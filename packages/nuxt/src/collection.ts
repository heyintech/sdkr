export interface ApiRouteGroup {
  dir: string | RegExp
  clientPrefix: string
}

export interface ApiCollection {
  name: string
  root?: string
  routeGroups: ApiRouteGroup[]
  ignore?: string[]
}

// `defineApiCollection()` 是一个可擦除的 authoring helper。
// 默认情况下它只是 identity function，用来提供类型约束；
// 如果上游构建愿意，也可以把它当成宏擦成纯对象导出，但这不是正确性的前提。
export function defineApiCollection<T extends ApiCollection>(collection: T): T {
  return collection
}
