import _ from 'lodash';
import { normalizeFields, isGroupWithoutTitle } from './fields';
import { createFieldExt, FieldDefineT, FieldExtT, PlainObject } from './types';
import { isPlain, utilIsArrPropPath, utilEmptyArrPropPath, utilIsEmptyArrPropPath } from './utils';
import { MultiValidatorDefineT, ValidateCombine } from './validation';
import { ActionsT } from './actions';
import { EventBus } from './events'

type WatcherTriggerInfo = {
  path?: string,
  formGroup: FormGroup,
  actionId?: string
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

  public eventBus = new EventBus()

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

  updateData (path: string, value: any) { _.set(this.__dataSet, path, value) }
  updateError (path: string, error: string) { this.__errSet[path] = error }
  updateAllow (path: string, allow: boolean) { this.__allow[path] = allow }

  field (path: string) { return utilGetFields(this.__fieldMap, this.__dataSet, [path])[0] }

  fields (paths: null|string[] = null): (FieldExtT|null)[] {
    if (paths) {
      return utilGetFields(this.__fieldMap, this.__dataSet, paths)
    } else {
      return utilGetAllFields(this.__fieldMap, this.__dataSet)
    }
  }

  // 直接在 field 上更新
  updateField (path: string, update: (field: FieldExtT) => void, notFund?: () => void) {
    const [field] = utilGetFields(this.__fieldMap, this.__dataSet, [path])
    if (field) {
      update(field)
    } else {
      notFund && notFund()
    }
  }

  fieldValidators (path: null|string|string[]): ValidateCombine[] {
    const filteredValidators = uitlGetByDeps(path, this.__validatorsMap)

    return filteredValidators.map((validator) => {
      return {
        validator,
        values: validator[0].map((path: string) => _.get(this.__dataSet, path))
      }
    })
  }

  fieldWatchers (path: string|string[]) {
    const filteredWatchers: WatcherDefineT[] = uitlGetByDeps(path, this.__watchersMap)

    return filteredWatchers.map(([deps, handler]) => {
      return {
        handler,
        paths: deps,
        values: deps.map((path: string) => _.get(this.__dataSet, path))
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
    const [paths] = def
    for (const path of paths) {
      if (map.has(path)) {
        map.get(path).push(def)
      } else {
        map.set(path, [def])
      }
    }
  }
  return map
}

function uitlGetByDeps<T extends MultiValidatorDefineT|WatcherDefineT> (path: null|string|string[], depMap: Map<string,T[]>): Array<T> {
    let filteredValidators: T[] = []
    if (Array.isArray(path)) {
      const hasIt = new Set() // 用于过滤掉相同的
      for (const k of path) {
        for (const vtor of (depMap.get(k) || [])) {
          if (!hasIt.has(vtor[1])) { // vtor[1], 是函数
            filteredValidators.push(vtor)
            hasIt.add(vtor[1])
          }
        }
      }
    } else if (path) {
      filteredValidators = depMap.get(path) || []
    }
    return filteredValidators
}

/** 根据 paths 数组 获取 Field 数组 */
function utilGetFields (fieldMap: FieldMap, dataSet: PlainObject, paths: string[]): (FieldExtT|null)[] {
  return paths.map(path => {
    const field = fieldMap.get(path)
    if (field) {
      field.syncFieldValue(dataSet)
      return field
    } else {
      // 即 数组项
      if (utilIsArrPropPath(path)) { // path: arr[4].porp
        // 转换: -> arr[].prop
        const pathWithoutIndex = utilEmptyArrPropPath(path)
        // 为数组项构造新的 Field
        const toCache = fieldMap.get(pathWithoutIndex)?.clone()
        if (toCache) {
          toCache.path = path

          if (toCache.defineLabelKey) {
            // 如果 有 相应 的 deinfeLableKey, 调整 labelPath
            toCache.labelPath = path.slice(0, path.length - toCache.defineKey.length) + toCache.defineLabelKey.length
          }

          if (toCache.group) {
            // 如果有相应的 group
            // TODO: 是否创建当前 index 对应的 group
            // if (isGroupWithoutTitle(propField.group)) {
            // }
          }

          toCache.value = _.get(dataSet, path)
          toCache.markNeedSyncValue(false)
          console.log('toCache ->', toCache)
          // 保存新的的 Field
          fieldMap.set(path, toCache)
          return toCache
        } else {
          // 无效的 path
          console.warn('utilGetFields 无法获取 Field, 无效的 path:', path)
          return null
        }
      } else {
        // 无效的 path
        console.warn('utilGetFields 无法获取 Field, 无效的 path:', path)
        return null
      }
    }
  })
}

/** 根据 dataSet 内容返回所有的 Field */
function utilGetAllFields (fieldMap: FieldMap, dataSet: PlainObject): FieldExtT[] {
  const fieldArr = fieldMap.values()
  const fields = []

  for (const field of fieldArr) {
    // 去掉 空index[] 数组项 Field
    if (!utilIsEmptyArrPropPath(field.path)) {
      field.syncFieldValue(dataSet)
      fields.push(field)
    }
  }

  // 收集数组项
  const walk = (dataSet: (PlainObject|any[]), accPath: string) => {
    if (Array.isArray(dataSet)) {
      const arr = dataSet
      if (!arr.length) {
        return
      }

      const emptiedAccPath = utilEmptyArrPropPath(accPath)
      arr.forEach((item, index) => {
        const arrField = fieldMap.get(emptiedAccPath)
        if (arrField) {
          const subKeys: string[] = []
          ;(arrField.properties || []).forEach(subField => {
            const subKey = subField.defineKey
            const path = `${accPath}[${index}].${subKey}`
            if (!fieldMap.get(path)) {
              // 不在 fieldMap 中
              subKeys.push(path)
            }
            walk(item[subKey], path)
          })

          // 获取未找到的 数组项
          fields.push(...utilGetFields(fieldMap, dataSet, subKeys))
        }
      })
    } else if (isPlain(dataSet)) {
      Object.keys(dataSet).forEach(path => {
        accPath += accPath ? ('.' + path) : path
        walk(dataSet[path], accPath)
      })
    }
  }

  walk(dataSet, '')

  return fields
}

/** 标准化 Field path, 并创建扁平的 Map<path, FieldExtT> */
function uitlCreateNormalizedFieldsWithFlattenedMap (fields: FieldDefineT[]): [FieldExtT[], FieldMap] {
  const normalized = normalizeFields(fields)
  console.log('normalized Fields ->', normalized)
  const flattened = uitlCreateFieldMap(normalized)
  return [normalized, flattened]
}

/** 创建扁平的 Map<path, FieldExtT> */
function uitlCreateFieldMap (fields: FieldExtT[]) : FieldMap {
  const labelKeys: string[] = []
  const flatten = (fields: FieldExtT[]): FieldExtT[] => {
    return fields
      // .filter() // 过滤掉 '非字段' field
      .flatMap(field => {
        if (field.properties) {
          return [field, ...flatten(field.properties)]
        } else if (field.labelPath) {
          labelKeys.push(field.labelPath) // 记录 labelPath, 不直接添加
          return [field]
        } else {
          return [field]
        }
      })
  }

  const map = new Map()
  flatten(fields).forEach(field => {
    map.set(field.path, field)
  })

  // 判断是否添加自动生成的 labelPath Field
  for (const labelPath of labelKeys) {
    if (!map.has(labelPath)) {
      map.set(labelPath, createFieldExt({ path: labelPath } as FieldDefineT))
    }
  }

  return map
}