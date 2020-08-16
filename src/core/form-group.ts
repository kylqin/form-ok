import * as _ from 'lodash';
import { normalizeFields } from './fields';
import { createFieldExt, FieldDefineT, FieldExtT, PlainObject } from './types';
import { isPlain } from './utils';
import { MultiValidatorDefineT } from './validation';

type FormGroupSchema = {
  fields?: FieldDefineT[],
  validators?: MultiValidatorDefineT[],
  watch?: any[],
}

export function createFormGroup(
  schema: FormGroupSchema,
  initalData: PlainObject
) {
  return new FormGroup(schema.fields, schema.validators, schema.watch, initalData)
}

export class FormGroup {
  private __fieldSchema: FieldExtT[]
  private __flattenedFields: Map<string, FieldExtT>
  private __dataSet: PlainObject
  private __errSet: PlainObject
  private __allow: PlainObject


  constructor (fields: FieldDefineT[] = [], private validators: MultiValidatorDefineT[] = [], private watch: any[] = [], initalData: PlainObject) {
    // [this.__fieldSchema, this.__flattenedFields] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
    this.__dataSet = initalData
    this.updateFieldSchema(fields)
  }

  updateFieldSchema (fields: FieldDefineT[]) {
    [this.__fieldSchema, this.__flattenedFields] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
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
    for (const field of this.__flattenedFields.values()) {
      field.__ok_needSyncValue = true
    }
  }

  get fieldSchema () { return this.__fieldSchema }
  get data () { return this.__dataSet }
  get error () { return this.__errSet }
  get allow () { return this.__allow }

  updateData (key: string, value: any) { _.set(this.__dataSet, key, value) }
  updateError (key: string, error: string) { this.__errSet[key] = error }
  updateAllow (key: string, allow: boolean) { this.__allow[key] = allow }

  field (key: string) { return utilGetFields(this.__flattenedFields, this.__dataSet, [key])[0] }

  fields (keys: string[]) {
    if (keys) {
      return utilGetFields(this.__flattenedFields, this.__dataSet, keys)
    } else {
      return utilGetAllFields(this.__flattenedFields, this.__dataSet)
    }
  }

  // 直接在 field 上更新
  updateField (key: string, update: (field: FieldExtT) => void, notFund?: () => void) {
    const [field] = utilGetFields(this.__flattenedFields, this.__dataSet, [key])
    if (field) {
      update(field)
    } else {
      notFund && notFund()
    }
  }

  fieldWValidators (key: string|string[]) {
    let filteredValidators = []
    if (Array.isArray(key)) {
      const hasIt = new Set()
      for (const k of key) { hasIt.add(k) }
      filteredValidators = this.validators.filter(v => v[0].find((k: string) => hasIt.has(k)))
    } else if (key) {
      filteredValidators = this.validators.filter(v => v[0].includes(key))
    }

    return filteredValidators.map(([deps, vFuns]) => {
      return {
        validators: vFuns,
        keys: deps,
        // values: this.fields(deps).map(f => f.value)
        values: deps.map((key: string) => _.get(this.__dataSet, key))
      }
    })
  }

  fieldWatchers (key: string) {
    let filteredWatchers = []
    if (key) {
      filteredWatchers = this.watch.filter(v => v[0].includes(key))
    }

    return filteredWatchers.map(([deps, handler]) => {
      return {
        handler,
        keys: deps,
        // values: this.fields(deps).map(f => f.value)
        values: deps.map((key: string) => _.get(this.__dataSet, key))
      }
    })
  }

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

/** 同步 Field value */
function utilSyncFieldValue (field: FieldExtT, dataSet: PlainObject) {
  if (field.__ok_needSyncValue) {
    field.__ok_preValue = field.value
    field.value = o.get(dataSet, field.key)
    field.__ok_needSyncValue = false
  }
}

/** 根据 keys 数组 获取 Field 数组 */
function utilGetFields (flattenedFields: Map<string, FieldExtT>, dataSet: PlainObject, keys: string[]): FieldExtT[] {
  return keys.map(key => {
    const field = flattenedFields.get(key)
    if (field) {
      utilSyncFieldValue(field, dataSet)
      return field
    } else {
      const matched = key.match(RegArrProp)
      if (matched) { // key: arr[4].porp
        // 转换: -> arr[].prop
        const keyWithoutIndex = utilEmptyArrProp(key)
        // 为数组项构造新的 Field
        const toCache = new FieldExtT({ ...flattenedFields.get(keyWithoutIndex), key, value: _.get(dataSet, key), __ok_needSyncValue: false })
        // 保存新的的 Field
        flattenedFields.set(key, toCache)
        return toCache
      } else {
        // 无效的 key
        console.warn('utilGetFields 无法获取 Field, 无效的 key:', key)
        return null
      }
    }
  })
}

/** 根据 dataSet 内容返回所有的 Field */
function utilGetAllFields (flattenedFields: Map<string, FieldExtT>, dataSet: PlainObject): FieldExtT[] {
  const fieldArr = flattenedFields.values()
  const fields = []

  // 去掉 空index[] 数组项 Field
  for (const field of fieldArr) {
    const [isArrProp, _, index] = utilPraseArrProp(field.key)
    if (!isArrProp && index === '') {
      utilSyncFieldValue(field, dataSet)
      fields.push(field)
    }
  }

  // 收集数组项
  const walk = (dataSet, accKeyPath) => {
    if (Array.isArray(dataSet)) {
      const arr = dataSet
      if (!arr.length) {
        return
      }

      const emptiedAccKeyPath = utilEmptyArrProp(accKeyPath)
      arr.forEach((item, index) => {
        const arrField = flattenedFields.get(emptiedAccKeyPath)
        if (arrField) {
          const subKeys = []
          ;(arrField.properties || []).forEach(subField => {
            const subKey = subField.originKey
            const fieldKey = `${accKeyPath}[${index}].${subKey}`
            if (!flattenedFields.get(fieldKey)) {
              // 不在 flattenedFields 中
              subKeys.push(subKey)
            }
            walk(item[subKey], fieldKey)
          })

          // 获取未找到的 数组项
          fields.push(...utilGetFields(flattenedFields, dataSet, subKeys))
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
function uitlCreateNormalizedFieldsWithFlattenedMap (fields: FieldDefineT[]): [FieldExtT[], Map<string, FieldExtT>] {
  const normalized = normalizeFields(fields)
  console.log('normalized Fields ->', normalized)
  const flattened = uitlCreateFlattenedFieldsMap(normalized)
  return [normalized, flattened]
}

/** 创建扁平的 Map<key, FieldExtT> */
function uitlCreateFlattenedFieldsMap (fields: FieldExtT[]) : Map<string, FieldExtT> {
  const labelKeys = []
  const flatten = (fields: FieldExtT[]): FieldExtT[] => {
    return fields
      // .filter() // 过滤掉 非 字段 field
      .flatMap(field => {
        if (field.properties) {
          return [field, ...flatten(field.properties)]
        } else if (field.labelKey) {
          labelKeys.push(field.textKey) // 记录 labelKey, 不直接添加
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