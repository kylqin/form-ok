import _ from 'lodash'
import { PlainObject } from './utils'
import { FieldExtT } from './types'

/** 让计算属性函数中 对数据的访问可以通过 ds['.path'], ds['path.subPath'], ds['arr[3].subPath'] 的语法进行访问 */
export const genGetProxy = (dp: { data: PlainObject }, field: FieldExtT, parent?: FieldExtT) => {
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
