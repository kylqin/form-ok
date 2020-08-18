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