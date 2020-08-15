import * as _ from 'lodash'
import { FieldExtT, PlainObject, FieldPropsT, EnumItemT, FieldDefineT } from './types'
import { genID, notNull } from './utils'

const genKey = () => genID('__key_')

/** 让计算属性函数中 对数据的访问可以通过 ds['.key'], ds['key.subKey'], ds['arr[3].subKey'] 的语法进行访问 */
const genGetProxy = (dp: { dataSet: PlainObject }, field: FieldExtT, parent?: FieldExtT) => {
  return new Proxy(dp.dataSet, {
    get (dataSet, key: string) {
      return key[0] !== '.' // 'key', 'book.mark'
        ? _.get(dataSet, key) // '.key', '.book.mark'
        : !parent
          ? _.get(dataSet, key.slice(1)) // 无父亲，退化为 'key', 'book.mark'
          : parent.widget === 'array' // 父亲是数组: 'parent[idx].key', 'parent[idx].book.mark'
            ? _.get(dataSet, field.key.slice(0, field.key.length - field.originKey.length - 1) + key) // 替换 origin key 部分, key 是带`.` 的
            : _.get(dataSet, parent.key + key) // 父亲是对象: 'parent.key', 'parent.book.mark'
    }
  })
}

/** UI 相关属性 */
const UiProps = new Set(['readonly', 'disabled', 'hidden'])

export type FormCommonPropsT = {
  dsPack: any
  readonly: boolean
  disabled: boolean
  cachedFieldProps: PlainObject
}

/** 设置计算属性 */
function setComputeProps (field: FieldExtT, commonProps: FormCommonPropsT) {
  const { dsPack } = commonProps

  if (field.compute) {
    const Get = genGetProxy(dsPack, field, field.parent)
    Object.keys(field.compute).forEach(propName => {
      if ((field.group || field.parent) && UiProps.has(propName)) {
        // 如果 该属性为 UI 相关属性，且有 所属组(group) 或 父亲(parent)
        // 所属组 优先于 父亲

        const groupProps = makeFieldProps((field.group || field.parent)!, commonProps)

        if ((groupProps as any)[propName]) {
          // 且 group/parent 的 该 UI 相关属性 为 true, 优先使用 group/parent 的属性
          (field as any)[propName] = true
        } else {
          // 否则, 计算之
          (field as any)[propName] = field.compute![propName](Get, field, dsPack)
        }
      } else {
        // 否则， 计算之
        (field as any)[propName] = field.compute![propName](Get, field, dsPack)
      }
    })
  }
}

/** 设置 UI 相关的属性 */
function setUIProps (field: FieldExtT, commonProps: FormCommonPropsT) {
  if (field.group || field.parent) {
    for (const propName of UiProps.values()) {
      const groupProps = makeFieldProps((field.group || field.parent)!, commonProps)
      if ((groupProps as any)[propName]) {
        // 若 其 group/parent 的 UI 相关属性 位置，则覆盖
        (field as any)[propName] = true
      }
    }
  }
}

// function makeFieldPropsProxy (fieldProps: FieldPropsT) {
//   return new Proxy(fieldProps, {
//     get (fp, key) {
//       return (fp as any)[key] || (fp.props as any)[key] || (fp.field as any)[key]
//     },
//     set (fp, key, value) {
//       (fp.props as any)[key] = value
//       return true
//     }
//   })
// }


/** 生成渲染 Field 需要的属性 */
export function makeFieldProps (field: FieldExtT, commonProps: FormCommonPropsT): FieldPropsT {
  if (commonProps.cachedFieldProps[field.key]) {
    // 返回缓存
    return commonProps.cachedFieldProps[field.key]
  }

  const { dsPack, readonly } = commonProps
  // const proxy: any = makeFieldPropsProxy({ field, props: new FieldExtT(field) })
  const copied = new FieldPropsT(field)

  setComputeProps(copied, commonProps)
  setUIProps(copied, commonProps)

  // 设置 text
  copied.text = copied.labelKey ? _.get(dsPack.dataSet, copied.labelKey) : ''

  // 全局 readonly 覆盖
  copied.readonly = readonly || copied.readonly

  // 同步 required, _.remove 会 删除掉 validators 中的 ’required'
  copied.required = _.remove(copied.validators, v => v === 'required').length > 0 || copied.required

  // 标准化 enums: 过滤掉 null / undefined 值
  copied.enums = (copied.enums || []) // TODO: 如果 数组很大会影响性能
    .filter(e => notNull(e.value) && notNull(e.label))

  // 缓存
  commonProps.cachedFieldProps[field.key] = copied

  return copied as FieldPropsT
}

/** 是否为 无标题组 */
export function isGroupWithoutTitle (field: FieldExtT) { return field.widget === 'group' && !field.title }

/** 将 无标题组 的 field 压扁; 并设置 field 的 group/parent 属性 */
/** 每个 field 都返回 副本 copied */
function flattenNoTitleGroups (fields: FieldDefineT[], parent?: FieldDefineT): FieldDefineT[] {
  let copiedFields: FieldDefineT[] = []

  fields.forEach(field => {
    const copied = new FieldDefineT(field)
    if (isGroupWithoutTitle(field)) {
      // 是 无标题组
      // copied is an group without title

      // 标记是否已经标准化: 在 normalizeFields 中使用, 因为 无标题组，在其中会被多次访问到，此标记第一次访问后 设置为 true
      (copied as any).__ok_keyIsNormalized = false

      const properties = flattenNoTitleGroups(copied.properties || [], parent)

      // 设置 properties 的 group 属性
      properties.forEach(subField => {
        subField.group = copied
      })

      // 需要 "压扁"
      copiedFields = copiedFields.concat(properties)
    } else if (field.widget === 'group' || field.widget === 'box' || field.widget === 'object' || field.widget === 'array') {
      // 是 容器
      copied.properties = flattenNoTitleGroups(field.properties || [], copied)
      copiedFields.push(copied)
    } else {
      // 普通 field
      copiedFields.push(copied)
    }
  })


  return copiedFields
}

/** 标准化 field 的 key 属性，使之在整棵 fields 树中 唯一，即: 对象属性(parent.key), 数组属性(array[].key)*/
/** 设置 originKey, compute, 建立 树结构关系, group/parent */
export function normalizeFields (fields: FieldDefineT[]): FieldExtT[] {
  const resultFields: FieldExtT[] = []

  const walk = (fields: FieldDefineT[], parent?: FieldExtT) => {
    fields.forEach(field => {
      // 直接在 field 上修改， 因为 flattenNotTitleGroups 返回的是副本

      field.originKey = field.key || genKey() // 自动生成 key, 并保存至 originKey
      field.key = field.originKey // 同步自动生成的 key
      if (field.labelKey) { field.originLabelKey = field.labelKey }

      const parentIsArr = parent && parent.widget === 'array'

      if (parentIsArr || (parent && parent.widget === 'object')) {
        // 父亲 widget 为 数组或对象, 处理 key, labelKey, group.key, group.labelKey, 设置 origin{key, labelKey}
        const jointer = parentIsArr ? '[].' : '.'

        field.key = parent!.key + jointer + field.key
        if (field.labelKey) { field.labelKey = parent!.key + jointer + field.labelKey }

        if (field.group && isGroupWithoutTitle(field.group)) {
          // 无标题组 也要处理
          if (!(field.group as any).__ok_keyIsNormalized) {
            // 避免重复处理
            field.group.originKey = field.group.key || genKey()
            field.group.key = field.group.originKey

            field.group.key = parent!.key + jointer + field.group.key
            ;(field.group as any).__ok_keyIsNormalized = true
          }
        }

        if (field.widget === 'object' || field.widget === 'array') {
          // 递归
          walk(field.properties || [], field)
        }

        if (field.widget === 'box' || field.widget === 'group') {
          // box/group 不贡献 key， 递归
          walk(field.properties || [], parent)
        }
      }

      return field
    })
  }

  walk(flattenNoTitleGroups(fields))

  return fields
}