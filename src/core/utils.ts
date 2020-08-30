export type PlainObject = {
  [prop: string]: any
}

/** 指通过字面量形式或者 new Object() 形式定义的对象 */
export function isPlain (obj: any) {
  if (obj === null || typeof obj !== 'object') return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}

/** 生成 全局 唯一 ID */
let __id = 0
export function genID (prefix = '') {
  return prefix + ('' + ++__id).padStart(5, '0')
}

/** notNU: Not null and not Undefined */
export const notNull = (v: any) => v !== null && v !== undefined

/** clone 对象 */
export function clone (source: any, target: any) {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key]
    }
  }
  return target
}

/** 数组项 path */

/** 数组项: [1] = array; [2] = subProp */
const RegArrProp = /^(\w+)\[\d+\]\.(.+)$/
export function utilIsArrPropPath (path: string) { return RegArrProp.test(path) }

/** 数组项: [1] = arr.ay; [2] = ''; [3] = subProp */
const RegArrPropWithoutIndex = /^([\w.]+)\[\]\.(.+)$/
export function utilIsEmptyArrPropPath (path: string) { return RegArrPropWithoutIndex.test(path) }

/** 转换数组项的 path: path1[3].path2[1].path3 => path1[].path2[].path3 */
export function utilEmptyArrPropPath (path: string) { return path.replace(/\[\d+\]\./g, '[].') }

/** 数组项: [1] = arr.ay; [2] = index|''; [3] = subProp */
// const RegArrPropWithIndex = /^([\w.]+)\[(\d*)\]\.(.+)$/
/** 解析数组项的 path:  path => [isArrProp, arr.ay.path, index|'', sub.prop.path] */
// export function utilPraseArrProp (path: string) {
//   const matched = path.match(RegArrPropWithIndex)
//   if (matched) {
//     return [true, matched[1], matched[2], matched[3]]
//   }
//   return [false]
// }