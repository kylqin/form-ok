import * as _ from 'lodash'
import { FieldExtT, PlainObject } from './types'
import { genID } from './utils'

const genKey = () => genID('__key_')

/** 让计算属性函数中 对数据的访问可以通过 ds['.key'], ds['key.subKey'], ds['arr[3].subKey'] 的语法进行访问 */
const genGetProxy = (dp: { dataSet: PlainObject }, field: FieldExtT, parent: FieldExtT) => {
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
const UiProps = ['readonly', 'disabled', 'hidden']

export type FormCommonPropsT = {
  dsPack: any
  readonly: boolean
  disabled: boolean
  cachedFieldProps: PlainObject
}

/** 设置计算属性 */
export function setComputeProps (field: FieldExtT, commonProps: FormCommonPropsT) {}