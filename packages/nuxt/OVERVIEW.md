# @heyintech/sdkr-nuxt OVERVIEW

## 这个包解决什么问题

`@heyintech/sdkr-nuxt` 把 collection authoring、服务端 handler 扫描、
`CallaMeta` 类型提取和 `calla(...)` 调用面组合成一个 Nuxt 模块。

它解决的问题不是“如何手写一个 HTTP client”，而是：

- 如何把文件系统里的 API 模块组织成稳定的 collection
- 如何让 handler 自己声明请求和响应类型
- 如何让调用侧直接使用一层与 `useFetch(...)` 对齐的类型接口
- 如何在模块 setup 阶段把这些信息连成一条可生成、可扫描、可注册的链路

如果你只想安装和接入这个包，先看 [`README.md`](./README.md)。这一页只解释内部实现模型和当前边界。

## 当前实现模型

当前实现有两个边界需要先明确：

- `calla(...)` 是编译期宏表面
  `src/calla.ts` 导出的函数体本身是空的，真实行为依赖 transform
  把源码级 `calla(...)` 改写成 `useFetch(...)`。
- `defineApiCollection(...)` 是 authoring helper
  它默认只是 identity function，用来提供结构和类型约束；模块的运行正确性
  不依赖把它擦成纯对象。

围绕这两个边界，模块当前实现分成四块：

1. 从 `nuxt.config` 里的 `sdkr.collections` 解析 collection 引用
2. 扫描每个 collection 下的 handler 文件并注册 Nitro route
3. 从 handler 导出的 `CallaMeta` 提取 payload 类型并生成 `types/sdkr.d.ts`
4. 在构建期把调用侧的 `calla(...)` 改写成 `useFetch(...)`

## 模块启动流程

模块入口在 `src/module.ts`，公开选项是：

- `collections: string[]`
- `injectCallaToGlobal: boolean`

默认值：

- `collections: []`
- `injectCallaToGlobal: true`

`setup()` 当前的主流程是：

1. 通过 `resolveCollectionRefs(...)` 按 Nuxt 项目的 `rootDir` 解析 `sdkr.collections`
2. 用 `jiti` 动态导入每个 collection 文件
3. 从 collection 计算 `moduleRoot`、`serverRoot`、`storesRoot`
4. 把每个 `serverRoot` 加进 Nuxt watch 列表
5. 扫描所有 route group，得到待注册的 handler 列表
6. 对扫描结果做 route conflict 检查
7. 通过 `addServerHandler(...)` 把结果注册成 Nitro handler
8. 把 `#sdkr/calla` alias 到本包的 `src/calla.ts`
9. 通过 `addTypeTemplate(...)` 生成 `types/sdkr.d.ts`
10. 如果 collection 下存在 `runtime/stores`，把它加入 Nuxt 自动导入目录
11. 通过 `addVitePlugin(...)` 安装 `calla(...) -> useFetch(...)` 的 transform

`setupHandlers` 只在首次 setup 扫描结果可复用时存在；之后会被置空，让类型模板在
后续生成时重新扫描，从而拿到更新后的 handler 状态。

## collection 引用解析

`src/collection-ref.ts` 负责把 `sdkr.collections` 里的字符串解析成实际文件路径。

当前规则：

- 所有引用都相对消费方 Nuxt 项目的 `rootDir` 解析
- 如果引用不是显式 TypeScript 文件路径，会自动补 `/collection.ts`
- `file:` URL 会先转成本地路径再解析
- glob 会先展开成绝对文件路径，并按字典序排序
- glob 匹配不到任何文件时会抛错
- 精确文件路径会先按项目路径解析，失败后再回退到 Nuxt `resolvePath(...)`
- 多个引用命中同一个 collection 文件时会去重

这也是为什么下面这些写法都有效：

- `modules/demo-api`
- `modules/demo-explicit/demo-module.ts`
- `modules/*`
- `modules/*/collection.ts`

## collection 契约

用户侧契约在 `src/collection.ts`：

```ts
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
```

几个和实现强相关的点：

- `defineApiCollection(...)` 返回输入值本身，不做运行时包装
- `routeGroups` 不能为空；模块加载时会显式检查这一点
- `root` 不填时，`moduleRoot` 默认取 collection 文件所在目录
- `root` 如果是 `file:` URL、绝对路径或相对路径，都会先归一化，再决定是否需要取目录
- `serverRoot` 固定是 `resolve(moduleRoot, 'runtime/server')`
- `storesRoot` 固定是 `resolve(moduleRoot, 'runtime/stores')`

## 路由扫描与冲突判定

`src/scan.ts` 负责把 handler 文件映射成 Nitro 兼容的 route 注册信息。

扫描阶段使用：

- `tinyglobby`
- 模式：`**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}`

当前路径归一化规则：

- 去掉扩展名
- 去掉 `(group)/` 这种 route group 目录段
- 把 `[id]` 映射成 `:id`
- 把 `[...slug]` 映射成 `**:slug`
- 把 `[...]` 映射成 `**`
- 把 `/index` 收敛成父路径
- 给结果补上 `clientPrefix`

文件名后缀还会继续参与 route 元数据推导：

- `.get`、`.post`、`.patch`、`.put` 等后缀会映射成 `method`
- `.dev`、`.prod`、`.prerender` 后缀会映射成 Nitro `env`

最终输出的每条记录都至少包含：

- `handler`
- `route`
- `lazy: true`
- `middleware: false`

方法或环境标记存在时，还会带上：

- `method`
- `env`

冲突判定在 `src/module.ts` 里做，规则很直接：

- route 不同，不冲突
- route 相同且任意一方没有 `method`，冲突
- route 相同且双方 `method` 相同，冲突

这意味着“无方法后缀的通用 handler”和任意同路由的显式方法 handler 不能共存。

## 类型提取与模板生成

类型链路分成两层：`src/calla-meta.ts` 负责提取，`src/templates.ts` 负责生成。

### `src/calla-meta.ts`

这个文件会：

- 读取 handler 源码
- 用 `oxc-parser` 解析 TypeScript AST
- 只扫描顶层具名导出声明
- 识别两种 `CallaMeta` 写法：
  - `export interface CallaMeta { ... }`
  - `export type CallaMeta = { ... }`
- 只提取三个字段：
  - `body`
  - `query`
  - `res`

实现上的当前边界：

- 其他字段即使存在，也不会参与类型生成
- 解析失败时，当前 handler 会被跳过，而不是中断整轮生成
- 同一轮生成里会按文件路径缓存解析 Promise，避免重复读盘和重复 parse

### `src/templates.ts`

这个文件会把扫描结果和 `CallaMeta` 提取结果组装成 payload map，然后生成一个模板文件：

- `types/sdkr.d.ts`

生成逻辑的几个关键点：

- payload map 的 key 是 route
- 每个 route 下按 method 拆 schema
- GET handler 或没有 method 的 handler，会同时填 `default` 和 `get`
- 显式 method handler 只填自己的 method key
- schema 当前最多只包含 `body`、`query`、`res`

生成产物主要做两件事：

1. 扩展 `#sdkr/calla` 里的 `InternalApiPayload`
2. 在 `injectCallaToGlobal` 为 `true` 时声明全局 `calla`

## calla 类型接口

`src/calla.ts` 是公开类型壳，不是运行时实现。

当前主要导出：

- `InternalApiPayload`
- `CallaQuery`
- `CallaBody`
- `CallaRes`
- `CallaOpts`
- `calla(...)`

这里最重要的不是某个单独类型，而是这几个类型之间的关系：

- `InternalApiPayload` 初始为空，等待生成的 `sdkr.d.ts` 进行模块扩展
- `CallaQuery` / `CallaBody` / `CallaRes` 都从 `InternalApiPayload` 里按 route 和 method 取字段
- `CallaOpts` 的结构尽量对齐 Nuxt `useFetch`
- `calla(...)` 的函数体是空实现，因为源码调用会在构建阶段被擦掉

## transform 层

`src/transform.ts` 里实际上有两套职责独立的逻辑。

### 1. `createCallaToUseFetchPlugin()`

这是模块真正安装到 Vite 的 transform 插件。

它的职责是：

- 过滤掉 `node_modules`、`.nuxt`、`.output` 这类不该处理的文件
- 只在源码里包含 `calla(` 时继续处理
- 支持普通脚本文件和 `.vue` 文件里的 `script` / `script setup`
- 通过 AST 遍历识别真正的 `calla(...)` 调用
- 避开同名局部绑定，防止把用户自己的 `calla` 变量误改成 `useFetch`

当前实现不是简单字符串替换，而是“先找可替换的 callee 位置，再做 replacement”。

### 2. `rewriteDefineApiCollectionMacro()`

这是一条独立的 helper rewrite 路径。

它只处理这种形态：

```ts
export default defineApiCollection({
  name: 'demo',
  routeGroups: [],
})
```

然后把默认导出的 `defineApiCollection(...)` 调用擦成纯对象导出。它的定位是可选产物优化，不是模块运行正确性的前提。

## playground 与测试覆盖

当前仓库里可以直接参考的验证面有两类。

### playground

`packages/nuxt/playground` 用来做手动验证，当前能覆盖到：

- 目录式 collection 引用：`modules/demo-api`
- 显式 `.ts` 文件 collection 引用：`modules/demo-explicit/demo-module.ts`
- `calla('/demo/profile', { query })` 这种 GET 调用
- `calla('/demo/echo', { method: 'post', body })` 这种 POST 调用

### automated tests

自动化测试目前主要集中在三个点：

- `packages/nuxt/test/basic.test.ts`
  验证基本 SSR 页面是否能正常渲染
- `packages/nuxt/test/collection-ref.test.ts`
  验证目录式、显式 `.ts`、glob、去重和空匹配错误这些 collection 解析路径
- `packages/nuxt/test/collection-macro.test.ts`
  验证 `rewriteDefineApiCollectionMacro()` 会把默认导出的 helper 调用改写成纯对象

换句话说，当前测试能覆盖 collection 引用解析和一条基础 smoke path，但对 route 扫描、
类型模板生成和 `calla(...)` transform 的细节覆盖还不深。这也是后续如果继续扩测试，
最值得优先补的区域。
