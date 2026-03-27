# 概览

English version: [OVERVIEW.md](./OVERVIEW.md)

## 这个仓库是什么

`@heyintech/sdkr` 是一个 Nuxt 模块，用来把基于文件系统组织的服务端接口，
转换成一个带类型的客户端调用面 `calla(...)`。

当前实现的主链路有四段：

1. 从 `nuxt.config` 里的 `sdkr.collections` 解析并加载一个或多个接口集合。
2. 扫描每个集合下的服务端处理器文件，并把文件路径转换成 Nitro 路由信息。
3. 从处理器文件里读取导出的 `CallaMeta` 类型，生成统一的 `types/sdkr.d.ts`。
4. 在构建期把源码里的 `calla(...)` 改写为 `useFetch(...)`。

这个仓库的主功能已经能跑通，不再是模板状态；但 README 和测试覆盖仍然比较粗。

现在它已经被整理成一个 `pnpm` workspace monorepo：

- `packages/nuxt` 是对外发布的包，也就是 `@heyintech/sdkr`
- `packages/cli` 放 CLI 源码和脚手架 helper
- `packages/nuxt/playground` 是本地联调用的 Nuxt 应用

产物构建使用 `tsdown`，而 Nuxt 包的声明文件由
`scripts/build-nuxt-dts.mjs` 单独生成，目的是避免把 Nuxt 生态的大量类型直接卷进发布包。

## 当前模型

有两个边界需要明确：

- `calla(...)` 是必需的编译期宏表面。
  `packages/nuxt/src/calla.ts` 里导出的 `calla` 只是类型壳，真正运行时依赖 Vite transform
  把它改写成 `useFetch(...)`。
- `defineApiCollection(...)` 是作者态 helper，不是正确性的前提。
  默认情况下它只是 identity function，用来提供类型约束。
  `packages/nuxt/src/transform.ts` 里虽然有一个可选的擦除工具，但模块本身并不依赖它。

## 模块启动流程

模块入口是 `packages/nuxt/src/module.ts`。

`ModuleOptions`：

- `collections: string[]`
- `injectCallaToGlobal: boolean`

启动时做的事情：

1. 按消费方 Nuxt 项目的 `rootDir` 解析 collection 引用。
2. 用 `jiti` 导入每个 collection 文件。
3. 计算 `moduleRoot`、`serverRoot`、`storesRoot`。
4. 把每个集合的 `runtime/server` 加入 watch。
5. 扫描处理器文件并检查路由冲突。
6. 用 `addServerHandler` 注册服务端路由。
7. 把 `#sdkr/calla` 别名到本地 `packages/nuxt/src/calla.ts`。
8. 生成一份类型文件：`types/sdkr.d.ts`。
9. 把 `runtime/stores` 加入 Nuxt 自动导入目录。
10. 安装 `calla(...) -> useFetch(...)` 的 Vite transform。

## collection 引用解析

`packages/nuxt/src/collection-ref.ts` 负责解析 `sdkr.collections`。

规则如下：

- 以消费方项目的 `rootDir` 为相对路径基准。
- 如果字符串没有显式落到 TypeScript 文件上，就自动补 `/collection.ts`。
- 支持 glob。
- 精确路径在需要时仍会回退到 Nuxt 的 `resolvePath`。
- 多个引用命中同一个文件时会去重。

当前已验证的写法：

- `modules/demo-api`
- `modules/demo-explicit/demo-module.ts`
- `modules/*`

## collection 契约

用户侧的 collection 类型定义在 `packages/nuxt/src/collection.ts`。

`ApiCollection` 字段：

- `name`
- `root?`
- `routeGroups`
- `ignore?`

每个 `routeGroup` 包含：

- `dir: string | RegExp`
- `clientPrefix: string`

几点说明：

- `root` 是可选的。
  如果省略，`sdkr` 默认把当前 collection 文件所在目录当作模块根目录。
- 如果显式提供 `root`，它可以是 `file:` URL、绝对路径，或相对于 collection
  文件的相对路径。
- `defineApiCollection()` 当前就是 identity function。

## 路由扫描

`packages/nuxt/src/scan.ts` 负责把处理器文件转换成 Nitro 可注册的路由信息。

扫描范围：

- 基于 `tinyglobby`
- 模式是 `**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}`

路径归一化规则：

- 去掉文件扩展名
- 去掉 `(group)/`
- `[id]` 转成 `:id`
- `[...slug]` 转成 `**:slug`
- `[...]` 转成 `**`
- `/index` 折叠到父路由

后缀规则：

- `.get`、`.post`、`.patch` 等映射为 HTTP 方法
- `.dev`、`.prod`、`.prerender` 映射为 Nitro 环境标记

扫描结果包含：

- `handler`
- `route`
- 可选 `method`
- 可选 `env`
- `lazy: true`
- `middleware: false`

`packages/nuxt/src/module.ts` 里的冲突判定规则是：

- 计算后的 `route` 相同，并且
- 任意一方没有 method，或者双方 method 相同

也就是说，methodless 路由会挡住同路径下更具体的方法路由。

## 类型提取与生成

类型链路分成 `packages/nuxt/src/calla-meta.ts` 和 `packages/nuxt/src/templates.ts` 两部分。

### `packages/nuxt/src/calla-meta.ts`

它会：

- 用 `oxc-parser` 解析处理器源码
- 查找具名导出的 `CallaMeta`
- 支持两种写法：
  - `export interface CallaMeta { ... }`
  - `export type CallaMeta = { ... }`
- 只提取三个字段：
  - `body`
  - `query`
  - `res`
- 在一次生成周期内对同一个文件做缓存

如果解析失败，或者没有导出可识别的 `CallaMeta`，这个 handler 会被跳过，不参与类型生成。

### `packages/nuxt/src/templates.ts`

它负责构建 payload map，并生成唯一的 Nuxt 类型模板：

- `types/sdkr.d.ts`

这份生成文件包含两部分：

- `#sdkr/calla` 的模块增强，用来补 `InternalApiPayload`
- 可选的全局 `calla` 声明

生成规则：

- GET 或未标方法的处理器，会同时填充路由的 `default` 和显式 `get`
- 指定方法的处理器，只填充自己的方法分支
- 每个 schema 里可能包含 `body`、`query`、`res`

## `calla` 的类型接口

`packages/nuxt/src/calla.ts` 定义了 `calla` 的类型级公共接口。

主要导出：

- `InternalApiPayload`
- `CallaQuery`
- `CallaBody`
- `CallaRes`
- `CallaOpts`
- `calla(...)`

重点：

- `InternalApiPayload` 初始为空，等待生成的 `sdkr.d.ts` 做模块增强
- 泛型结构故意对齐 Nuxt 的 `useFetch`
- 当前哨兵泛型仍然使用 `ResT = void`，和 Nuxt `useFetch` 保持一致
- 函数体本身是空的，因为源码中的调用会在构建期被改写掉

## transform 层

`packages/nuxt/src/transform.ts` 里实际上有两套互相独立的逻辑。

### 1. `createCallaToUseFetchPlugin()`

这是当前模块真正启用的 Vite 插件。

行为：

- 以 `pre` 插件方式运行
- 跳过虚拟模块、`node_modules`、`.nuxt`、`.output`
- 同时支持普通脚本文件和 Vue SFC
- 使用 `oxc-parser` 做 AST 解析
- 跟踪词法作用域和绑定，避免误改写被局部遮蔽的 `calla`
- 只把真正的 `calla(...)` 调用改成 `useFetch(...)`

作用域跟踪是必要的。如果用户在局部自己声明了一个 `calla`，这个标识符不能被改写。

### 2. `rewriteDefineApiCollectionMacro()`

这是一个独立的辅助工具，不在模块 setup 中自动启用。

它可以把：

- `export default defineApiCollection({...})`

擦成：

- `export default {...}`

这个能力被视为可选的产物优化，不是运行正确性的基础。

## playground 覆盖的场景

当前 playground 同时覆盖了两种 collection 引用方式。

`packages/nuxt/playground/nuxt.config.ts` 里配置的是：

- 目录式 collection：`modules/demo-api`
- 显式 `.ts` 文件入口：`modules/demo-explicit/demo-module.ts`

`packages/nuxt/playground/app.vue` 实际调用了：

- `calla('/demo/profile', { query })`
- `calla('/demo/echo', { method: 'post', body })`
- `calla('/demo-explicit/status', { query })`

这些场景一起验证了：

- 路由扫描
- payload 类型生成
- 全局 `calla`
- `calla -> useFetch` 的改写
- collection 的目录式与显式文件式解析

## 测试现状

当前测试主要覆盖三块：

- `test/basic.test.ts`
  Nuxt 应用最小烟雾测试
- `test/collection-ref.test.ts`
  collection 引用解析规则
- `test/collection-macro.test.ts`
  可选的 `defineApiCollection` 擦除工具

还缺的部分：

- 路由注册的端到端断言
- `calla(...)` 改写行为的专门测试
- `CallaMeta` 边界情况的更强集成测试

## 目录说明

- `packages/nuxt/src/module.ts`
  Nuxt 模块主入口与总编排
- `packages/nuxt/src/collection-ref.ts`
  `sdkr.collections` 的路径与 glob 解析
- `packages/nuxt/src/collection.ts`
  collection 类型与 authoring helper
- `packages/nuxt/src/scan.ts`
  文件系统路由扫描
- `packages/nuxt/src/calla-meta.ts`
  从 handler 源码提取 `CallaMeta`
- `packages/nuxt/src/templates.ts`
  生成 `sdkr.d.ts`
- `packages/nuxt/src/calla.ts`
  `calla` 的类型公共接口
- `packages/nuxt/src/transform.ts`
  AST 级宏改写逻辑
- `packages/nuxt/playground/`
  本地联调用例
- `test/`
  烟雾测试与局部单测

## 常用开发命令

`package.json` 里的主要脚本：

- `pnpm dev:prepare`
- `pnpm dev`
- `pnpm dev:build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:watch`
- `pnpm test:types`
- `pnpm prepack`

## 当前还比较粗糙的地方

- 测试已经覆盖主干的一些关键点，但还远不算完整
- Nuxt 包的声明产物目前依赖一个额外的小脚本来生成，而不是直接使用 `tsdown`
  的 dts 产物，因为默认 dts 流会把大量 Nuxt 相关类型一并打进来
- 启动真实 Nuxt 服务的 e2e 测试，在受限沙箱里可能会因为端口分配失败而不稳定
- 某些源码文件为了直接处理 parser 输出，仍然保留了较务实的宽松 AST 类型写法
