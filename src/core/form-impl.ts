import _ from 'lodash';
import { createMapByDeps, DepMap } from './dep-map';
import { normalizeFields } from './fields';
import { Form } from './form';
import { ComputePropT, createFieldExt, FieldDefineT, FieldExtT } from './types';
import { isPlain, PlainObject, utilEmptyArrPropPath, utilIsArrPropPath, utilIsEmptyArrPropPath } from './utils';
import { MultiValidatorDefineT } from './validation';

type WatcherTriggerInfo = {
  path?: string,
  Form: Form,
  actionId?: string
}

export type WatcherDefineT = [string[], (...valuesAndWatherTrigerInfo: (any|WatcherTriggerInfo)[]) => void]

export type FieldMap = Map<string, FieldExtT>
export type ValidatorsMap = DepMap<MultiValidatorDefineT>
export type WatchersMap = DepMap<WatcherDefineT>
export type ComputesMap = DepMap<ComputePropT>
export type ComputedMap = Map<string, Map<string, any>>

export type FormSchema = {
  fields?: FieldDefineT[],
  validators?: MultiValidatorDefineT[],
  watch?: WatcherDefineT[],
}

export function utilCreateValidatorsMap (validators: MultiValidatorDefineT[]): ValidatorsMap {
  return createMapByDeps(validators)
}

export function utilCreateWatchersMap (watchers: WatcherDefineT[]): WatchersMap {
  return createMapByDeps(watchers)
}

export function utilCreateComputesMap(fieldMap: FieldMap): ComputesMap {
  const computes: ComputePropT[] = []
  for (const field of fieldMap.values()) {
    Object.keys(field.compute!).forEach((prop: string) => {
      const [deps, compute] = field.compute![prop]
      computes.push([deps, [`${field.path}:${prop}`, compute]])
    })
  }
  return createMapByDeps(computes)
}

/** 根据 paths 数组 获取 Field 数组 */
export function utilGetFields (fieldMap: FieldMap, dataSet: PlainObject, paths: string[]): (FieldExtT|null)[] {
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
        const toCache = fieldMap.get(pathWithoutIndex)!.clone()
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
          // console.log('toCache ->', toCache)
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
export function utilGetAllFields (fieldMap: FieldMap, dataSet: PlainObject): FieldExtT[] {
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
export function uitlCreateNormalizedFieldsWithFlattenedMap (fields: FieldDefineT[]): [FieldExtT[], FieldMap] {
  const normalized = normalizeFields(fields)
  // console.log('normalized Fields ->', normalized)
  const flattened = uitlCreateFieldMap(normalized)
  return [normalized, flattened]
}

/** 创建扁平的 Map<path, FieldExtT> */
export function uitlCreateFieldMap (fields: FieldExtT[]) : FieldMap {
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