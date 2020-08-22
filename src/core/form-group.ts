import _ from 'lodash';
import { normalizeFields } from './fields';
import { createFieldExt, FieldDefineT, FieldExtT, PlainObject } from './types';
import { isPlain } from './utils';
import { MultiValidatorDefineT, ValidateCombine } from './validation';
import { ActionsT } from './actions';

type WatcherTriggerInfo = {
  key?: string,
  formGroup: FormGroup,
  actionId: string
}

export type WatcherDefineT = [string[], (...valuesAndWatherTrigerInfo: (any|WatcherTriggerInfo)[]) => void]

type FieldMap = Map<string, FieldExtT>
type DepMap<T> = Map<string, T[]>
// type ValidatorsMap = Map<string, MultiValidatorDefineT[]>
// type WatchersMap = Map<string, WatcherDefineT[]>
type ValidatorsMap = DepMap<MultiValidatorDefineT>
type WatchersMap = DepMap<WatcherDefineT>

export type FormGroupSchema = {
  fields?: FieldDefineT[],
  validators?: MultiValidatorDefineT[],
  watch?: WatcherDefineT[],
}

export function createFormGroup(
  schema: FormGroupSchema,
  initalData: PlainObject
) {
  return new FormGroup(schema.fields, schema.validators, schema.watch, initalData)
}

export class FormGroup {
  private __fieldSchema: FieldExtT[]
  private __fieldMap: FieldMap
  private __dataSet: PlainObject
  private __errSet: PlainObject = {}
  private __allow: PlainObject = {}

  private __validatorsMap: ValidatorsMap
  private __watchersMap: WatchersMap

  public actions: ActionsT

  constructor (fields: FieldDefineT[] = [], private validators: MultiValidatorDefineT[] = [], private watch: WatcherDefineT[] = [], initalData: PlainObject) {
    [this.__fieldSchema, this.__fieldMap] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
    this.__validatorsMap = utilCreateValidatorsMap(this.validators)
    this.__watchersMap = utilCreateWatchersMap(this.watch)
    this.__dataSet = initalData
    this.actions = new ActionsT(this)
  }

  updateFieldSchema (fields: FieldDefineT[]) {
    [this.__fieldSchema, this.__fieldMap] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
    // setAllow(allow => ({ ...allow })) // TODO: hack 强制刷新, FXIME
  }

  updateSchema (schema: FormGroupSchema) {
    if (schema.watch) {
      this.watch = schema.watch
    }
    if (schema.validators) {
      this.validators = schema.validators
    }
    if (schema.fields) {
      this.updateFieldSchema(schema.fields)
    }
  }

  syncFieldsValue (dataSet: PlainObject) {
    this.__dataSet = dataSet
    for (const field of this.__fieldMap.values()) {
      field.markNeedSyncValue()
    }
  }

  get fieldSchema () { return this.__fieldSchema }
  get data () { return this.__dataSet }
  set data (data: PlainObject) { this.__dataSet = data}
  get error () { return this.__errSet }
  set error (error: PlainObject) { this.__errSet = error }
  get allow () { return this.__allow }

  updateData (key: string, value: any) { _.set(this.__dataSet, key, value) }
  updateError (key: string, error: string) { this.__errSet[key] = error }
  updateAllow (key: string, allow: boolean) { this.__allow[key] = allow }

  field (key: string) { return utilGetFields(this.__fieldMap, this.__dataSet, [key])[0] }

  fields (keys: null|string[]): (FieldExtT|null)[] {
    if (keys) {
      return utilGetFields(this.__fieldMap, this.__dataSet, keys)
    } else {
      return utilGetAllFields(this.__fieldMap, this.__dataSet)
    }
  }

  // 直接在 field 上更新
  updateField (key: string, update: (field: FieldExtT) => void, notFund?: () => void) {
    const [field] = utilGetFields(this.__fieldMap, this.__dataSet, [key])
    if (field) {
      update(field)
    } else {
      notFund && notFund()
    }
  }

  fieldValidators (key: null|string|string[]): ValidateCombine[] {
    const filteredValidators = uitlGetByDeps(key, this.__validatorsMap)

    return filteredValidators.map((validator) => {
      return {
        validator,
        values: validator[0].map((key: string) => _.get(this.__dataSet, key))
      }
    })
  }

  fieldWatchers (key: string|string[]) {
    const filteredWatchers: WatcherDefineT[] = uitlGetByDeps(key, this.__watchersMap)

    return filteredWatchers.map(([deps, handler]) => {
      return {
        handler,
        keys: deps,
        values: deps.map((key: string) => _.get(this.__dataSet, key))
      }
    })
  }
}

function utilCreateValidatorsMap (validators: MultiValidatorDefineT[]): ValidatorsMap {
  return utilCreateMapByDeps(validators)
}

function utilCreateWatchersMap (watchers: WatcherDefineT[]): WatchersMap {
  return utilCreateMapByDeps(watchers)
}

function utilCreateMapByDeps<T extends MultiValidatorDefineT|WatcherDefineT> (defines: T[]): DepMap<T> {
  const map = new Map()
  for (const def of defines) {
    const [keys] = def
    for (const key of keys) {
      if (map.has(key)) {
        map.get(key).push(def)
      } else {
        map.set(key, [def])
      }
    }
  }
  return map
}

function uitlGetByDeps<T extends MultiValidatorDefineT|WatcherDefineT> (key: null|string|string[], depMap: Map<string,T[]>): Array<T> {
    let filteredValidators: T[] = []
    if (Array.isArray(key)) {
      const hasIt = new Set() // 用于过滤掉相同的
      for (const k of key) {
        for (const vtor of (depMap.get(k) || [])) {
          if (!hasIt.has(vtor[1])) { // vtor[1], 是函数
            filteredValidators.push(vtor)
            hasIt.add(vtor[1])
          }
        }
      }
    } else if (key) {
      filteredValidators = depMap.get(key) || []
    }
    return filteredValidators
}

/** 数组项: [1] = array; [2] = subProp */
const RegArrProp = /^(\w+)\[\d+\]\.(.+)$/

/** 数组项: [1] = arr.ay; [2] = index|''; [3] = subProp */
const RegArrPropWithIndex = /^([\w.]+)\[(\d*)\]\.(.+)$/

/** 解析数组项的 key:  key => [isArrProp, arr.ay.key, index|'', sub.prop.key] */
function utilPraseArrProp (key: string) {
  const matched = key.match(RegArrPropWithIndex)
  if (matched) {
    return [true, matched[1], matched[2], matched[3]]
  }
  return [false]
}

/** 转换数组项的 key: key1[3].key2[1].key3 => key1[].key2[].key3 */
function utilEmptyArrProp (key: string) { return key.replace(/\[\d+\]\./g, '[].') }

/** 根据 keys 数组 获取 Field 数组 */
function utilGetFields (fieldMap: FieldMap, dataSet: PlainObject, keys: string[]): (FieldExtT|null)[] {
  return keys.map(key => {
    const field = fieldMap.get(key)
    if (field) {
      field.syncFieldValue(dataSet)
      return field
    } else {
      const matched = key.match(RegArrProp)
      if (matched) { // key: arr[4].porp
        // 转换: -> arr[].prop
        const keyWithoutIndex = utilEmptyArrProp(key)
        // 为数组项构造新的 Field
        const toCache = fieldMap.get(keyWithoutIndex)?.clone()
        if (toCache) {
          toCache.key = key
          toCache.value = _.get(dataSet, key)
          toCache.markNeedSyncValue(false)
          // 保存新的的 Field
          fieldMap.set(key, toCache)
          return toCache
        } else {
          // 无效的 key
          console.warn('utilGetFields 无法获取 Field, 无效的 key:', key)
          return null
        }
      } else {
        // 无效的 key
        console.warn('utilGetFields 无法获取 Field, 无效的 key:', key)
        return null
      }
    }
  })
}

/** 根据 dataSet 内容返回所有的 Field */
function utilGetAllFields (fieldMap: FieldMap, dataSet: PlainObject): FieldExtT[] {
  const fieldArr = fieldMap.values()
  const fields = []

  // 去掉 空index[] 数组项 Field
  for (const field of fieldArr) {
    const [isArrProp, _, index] = utilPraseArrProp(field.key)
    if (!isArrProp && index === '') {
      field.syncFieldValue(dataSet)
      fields.push(field)
    }
  }

  // 收集数组项
  const walk = (dataSet: (PlainObject|any[]), accKeyPath: string) => {
    if (Array.isArray(dataSet)) {
      const arr = dataSet
      if (!arr.length) {
        return
      }

      const emptiedAccKeyPath = utilEmptyArrProp(accKeyPath)
      arr.forEach((item, index) => {
        const arrField = fieldMap.get(emptiedAccKeyPath)
        if (arrField) {
          const subKeys: string[] = []
          ;(arrField.properties || []).forEach(subField => {
            const subKey = subField.originKey
            const fieldKey = `${accKeyPath}[${index}].${subKey}`
            if (!fieldMap.get(fieldKey)) {
              // 不在 fieldMap 中
              subKeys.push(subKey)
            }
            walk(item[subKey], fieldKey)
          })

          // 获取未找到的 数组项
          fields.push(...utilGetFields(fieldMap, dataSet, subKeys))
        }
      })
    } else if (isPlain(dataSet)) {
      Object.keys(dataSet).forEach(key => {
        accKeyPath += accKeyPath ? ('.' + key) : key
        walk(dataSet[key], accKeyPath)
      })
    }
  }

  walk(dataSet, '')

  return fields
}

/** 标准化 Field key, 并创建扁平的 Map<key, FieldExtT> */
function uitlCreateNormalizedFieldsWithFlattenedMap (fields: FieldDefineT[]): [FieldExtT[], FieldMap] {
  const normalized = normalizeFields(fields)
  console.log('normalized Fields ->', normalized)
  const flattened = uitlCreateFieldMap(normalized)
  return [normalized, flattened]
}

/** 创建扁平的 Map<key, FieldExtT> */
function uitlCreateFieldMap (fields: FieldExtT[]) : FieldMap {
  const labelKeys: string[] = []
  const flatten = (fields: FieldExtT[]): FieldExtT[] => {
    return fields
      // .filter() // 过滤掉 '非字段' field
      .flatMap(field => {
        if (field.properties) {
          return [field, ...flatten(field.properties)]
        } else if (field.labelKey) {
          labelKeys.push(field.labelKey) // 记录 labelKey, 不直接添加
          return [field]
        } else {
          return [field]
        }
      })
  }

  const map = new Map()
  flatten(fields).forEach(field => {
    map.set(field.key, field)
  })

  // 判断是否添加自动生成的 labelKey Field
  for (const labelKey of labelKeys) {
    if (!map.has(labelKey)) {
      map.set(labelKey, createFieldExt({ key: labelKey } as FieldDefineT))
    }
  }

  return map
}