import _ from 'lodash'
import { FieldExtT, FieldPropsT, FieldDefineT, createFieldExt } from './types'
import { genID, notNull, PlainObject } from './utils'
import { FormGroup } from './form-group'

type PropsGetter = (field: FieldExtT) => FieldPropsT

export type FormCommonPropsT = {
  formGroup: FormGroup
  readonly: boolean
  disabled: boolean
  propsGetter?: PropsGetter
}

const genPath = () => genID('__path_')

/** 让计算属性函数中 对数据的访问可以通过 ds['.path'], ds['path.subPath'], ds['arr[3].subPath'] 的语法进行访问 */
const genGetProxy = (dp: { data: PlainObject }, field: FieldExtT, parent?: FieldExtT) => {
  return new Proxy(dp.data, {
    get (dataSet, path: string) {
      return path[0] !== '.' // 'path', 'book.mark'
        ? _.get(dataSet, path) // '.path', '.book.mark'
        : !parent
          ? _.get(dataSet, path.slice(1)) // 无父亲，退化为 'path', 'book.mark'
          : parent.widget === 'array' // 父亲是数组: 'parent[idx].path', 'parent[idx].book.mark'
            ? _.get(dataSet, field.path.slice(0, field.path.length - field.defineKey.length - 1) + path) // 替换 origin path 部分, path 是带`.` 的
            : _.get(dataSet, parent.path + path) // 父亲是对象: 'parent.path', 'parent.book.mark'
    }
  })
}

/** UI 相关属性 */
const UiProps = new Set(['readonly', 'disabled', 'hidden'])

/** 设置计算属性 */
function setComputeProps (field: FieldExtT, commonProps: FormCommonPropsT) {
  const { formGroup } = commonProps

  if (field.compute) {
    const Get = genGetProxy(formGroup, field, field.parent)
    Object.keys(field.compute).forEach(propName => {
      if ((field.group || field.parent) && UiProps.has(propName)) {
        // 如果 该属性为 UI 相关属性，且有 所属组(group) 或 父亲(parent)
        // 所属组 优先于 父亲

        const groupProps = commonProps.propsGetter!((field.group || field.parent)!)

        if ((groupProps as any)[propName]) {
          // 且 group/parent 的 该 UI 相关属性 为 true, 优先使用 group/parent 的属性
          (field as any)[propName] = true
        } else {
          // 否则, 计算之
          // (field as any)[propName] = field.compute![propName][1](Get, field, formGroup)
          (field as any)[propName] = formGroup.computed(field.path, propName)
        }
      } else {
        // 否则， 计算之
        // (field as any)[propName] = field.compute![propName][1](Get, field, formGroup)
        (field as any)[propName] = formGroup.computed(field.path, propName)
      }
    })
  }
}

/** 设置 UI 相关的属性 */
function setUIProps (field: FieldExtT, commonProps: FormCommonPropsT) {
  if (field.group || field.parent) {
    for (const propName of UiProps.values()) {
      const groupProps = commonProps.propsGetter!((field.group || field.parent)!)
      if ((groupProps as any)[propName]) {
        // 若 其 group/parent 的 UI 相关属性 位置，则覆盖
        (field as any)[propName] = true
      }
    }
  }
}

/** 生成渲染 Field 需要的属性 */
function makeFieldProps (field: FieldExtT, commonProps: FormCommonPropsT): FieldPropsT {
  const { formGroup, readonly } = commonProps
  // 获取 value, 传入的 field 没有值, 通过 formGroup.field 从 fromGroup.__fieldMap 中取值
  const copied = FieldPropsT.fromFieldExtT(formGroup.field(field.path)!)

  setComputeProps(copied, commonProps)
  setUIProps(copied, commonProps)

  // 设置 text
  copied.text = copied.labelPath ? _.get(formGroup.data, copied.labelPath) : ''

  // 全局 readonly 覆盖
  copied.readonly = readonly || copied.readonly

  // 同步 required, _.remove 会 删除掉 validators 中的 ’required'
  copied.required = _.remove(copied.validators, v => v === 'required').length > 0 || copied.required
  copied.required && copied.validators.unshift('required') // 如果， required === true, 加回 'required'

  // 标准化 enums: 过滤掉 null / undefined 值
  copied.enums = (copied.enums || []) // TODO: 如果 数组很大会影响性能
    .filter(e => notNull(e.value) && notNull(e.label))

  return copied as FieldPropsT
}

/** 生成 propsGetter */
export function createMemoPropsGetter (commonProps: FormCommonPropsT): PropsGetter {
  const cachedProps: Map<string, FieldPropsT> = new Map()

  console.log('createMemoPropsGetter called')

  commonProps.propsGetter = (field: FieldExtT) => {
    if (cachedProps.has(field.path) && !field.propsDirty) {
    // 返回缓存
      return cachedProps.get(field.path)!
    }

    const toCache = makeFieldProps(field, commonProps)
    field.markNeedSyncProps(false)
    // 缓存
    cachedProps.set(field.path, toCache)
    return toCache
  }

  return commonProps.propsGetter
}

/** 是否为 无标题组 */
export function isGroupWithoutTitle (field: FieldExtT) { return field.widget === 'group' && !field.title }

/** 将 无标题组 的 field 压扁; 并设置 field 的 group/parent 属性 */
/** 每个 field 都返回 副本 copied */
function flattenNoTitleGroups (fields: FieldDefineT[], parent?: FieldDefineT): FieldDefineT[] {
  let copiedFields: FieldDefineT[] = []

  fields.forEach(field => {
    const copied = createFieldExt(field)
    if (isGroupWithoutTitle(field)) {
      // 是 无标题组
      // copied is an group without title

      // 标记是否已经标准化: 在 normalizeFields 中使用, 因为 无标题组，在其中会被多次访问到，此标记第一次访问后 设置为 true
      (copied as any).__ok_pathIsNormalized = false

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

/** 标准化 field 的 path 属性，使之在整棵 fields 树中 唯一，即: 对象属性(parent.path), 数组属性(array[].path)*/
/** 设置 defineKey, compute, 建立 树结构关系, group/parent */
export function normalizeFields (fields: FieldDefineT[]): FieldExtT[] {
  const walk = (fields: FieldDefineT[], parent?: FieldExtT) => {
    fields.forEach(field => {
      // 直接在 field 上修改， 因为 flattenNotTitleGroups 返回的是副本

      field.defineKey = field.path || genPath() // 自动生成 path, 并保存至 defineKey
      field.path = field.defineKey // 同步自动生成的 path
      if (field.labelPath) { field.defineLabelKey = field.labelPath }

      // console.log('field ->', field)

      const parentIsArr = parent && parent.widget === 'array'

      if (parentIsArr || (parent && parent.widget === 'object')) {
        // 父亲 widget 为 数组或对象, 处理 path, labelPath, group.path, group.labelPath, 设置 origin{path, labelPath}
        const jointer = parentIsArr ? '[].' : '.'

        // console.log('jointer ->', jointer)

        field.path = parent!.path + jointer + field.path
        if (field.labelPath) { field.labelPath = parent!.path + jointer + field.labelPath }

        if (field.group && isGroupWithoutTitle(field.group)) {
          // 无标题组 也要处理
          if (!(field.group as any).__ok_pathIsNormalized) {
            // 避免重复处理
            field.group.defineKey = field.group.path || genPath()
            field.group.path = field.group.defineKey

            field.group.path = parent!.path + jointer + field.group.path
            ;(field.group as any).__ok_pathIsNormalized = true
          }
        }
      }

      if (field.widget === 'object' || field.widget === 'array') {
        // 递归
        walk(field.properties || [], field)
      }

      if (field.widget === 'box' || field.widget === 'group') {
        // box/group 不贡献 path， 递归
        walk(field.properties || [], parent)
      }

      return field
    })
  }

  const flattened = flattenNoTitleGroups(fields)

  walk(flattened)

  return flattened
}