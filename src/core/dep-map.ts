export type DepMap<T> = Map<string, T[]>

export function createMapByDeps<T extends any[]> (defines: T[]): DepMap<T> {
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

export function getByDeps<T extends any[]> (path: null|string|string[], depMap: Map<string,T[]>): Array<T> {
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
