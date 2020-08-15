import * as _ from 'lodash'
import { FieldExtT, PlainObject, FieldPropsT, EnumItemT } from './types'
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
