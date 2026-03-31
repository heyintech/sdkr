# packages/nuxt Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write Chinese package-level `README.md` and `OVERVIEW.md` for `@heyintech/sdkr-nuxt`, with `README.md` serving first-time users and `OVERVIEW.md` serving maintainers.

**Architecture:** Ship two package-local Markdown files under `packages/nuxt`. `README.md` stays user-facing and example-driven, while `OVERVIEW.md` explains the setup, collection resolution, route scanning, type generation, and transform pipeline from the current implementation. Verification is source-backed: every package fact in the docs must map to existing code, playground files, or tests.

**Tech Stack:** Markdown, Nuxt module source in `packages/nuxt/src`, playground examples in `packages/nuxt/playground`, Vitest coverage in `packages/nuxt/test`

---

### Task 1: Build the source-backed doc map

**Files:**
- Create: none
- Modify: none
- Read: `docs/superpowers/specs/2026-03-30-packages-nuxt-docs-design.md`
- Read: `README.md`
- Read: `OVERVIEW.md`
- Read: `packages/nuxt/package.json`
- Read: `packages/nuxt/src/module.ts`
- Read: `packages/nuxt/src/collection-ref.ts`
- Read: `packages/nuxt/src/collection.ts`
- Read: `packages/nuxt/src/scan.ts`
- Read: `packages/nuxt/src/calla.ts`
- Read: `packages/nuxt/src/calla-meta.ts`
- Read: `packages/nuxt/src/templates.ts`
- Read: `packages/nuxt/src/transform.ts`
- Read: `packages/nuxt/playground/nuxt.config.ts`
- Read: `packages/nuxt/playground/modules/demo-api/collection.ts`
- Read: `packages/nuxt/playground/modules/demo-api/runtime/server/profile.get.ts`
- Read: `packages/nuxt/playground/modules/demo-api/runtime/server/echo.post.ts`
- Read: `packages/nuxt/test/basic.test.ts`
- Read: `packages/nuxt/test/collection-ref.test.ts`
- Read: `packages/nuxt/test/collection-macro.test.ts`

- [ ] **Step 1: Re-read the spec and root docs to lock the package-level scope**

Run: `sed -n '1,240p' docs/superpowers/specs/2026-03-30-packages-nuxt-docs-design.md`

Expected: the spec confirms that only `packages/nuxt/README.md` and `packages/nuxt/OVERVIEW.md` are in scope, and that the two files have different target readers.

- [ ] **Step 2: Extract the user-facing facts that must appear in `README.md`**

Run: `sed -n '1,220p' packages/nuxt/package.json`

Run: `sed -n '1,240p' packages/nuxt/src/module.ts`

Run: `sed -n '1,220p' packages/nuxt/src/collection-ref.ts`

Run: `sed -n '1,220p' packages/nuxt/src/collection.ts`

Expected: confirm the published package name `@heyintech/sdkr-nuxt`, peer dependency `nuxt: ^4.0.0`, default `injectCallaToGlobal: true`, rootDir-based collection resolution, `/collection.ts` fallback for directory-like refs, and the `ApiCollection` contract.

- [ ] **Step 3: Extract the maintainer-facing facts that belong in `OVERVIEW.md`**

Run: `sed -n '1,260p' packages/nuxt/src/scan.ts`

Run: `sed -n '1,240p' packages/nuxt/src/calla-meta.ts`

Run: `sed -n '1,240p' packages/nuxt/src/templates.ts`

Run: `sed -n '1,320p' packages/nuxt/src/transform.ts`

Run: `sed -n '1,240p' packages/nuxt/src/calla.ts`

Expected: confirm route normalization, conflict rules, `CallaMeta` extraction, generated `types/sdkr.d.ts`, `#sdkr/calla` aliasing, and the split between the active `calla(...)` transform and the standalone `defineApiCollection(...)` macro rewrite.

- [ ] **Step 4: Pick example sources from the real playground instead of inventing examples**

Run: `sed -n '1,220p' packages/nuxt/playground/nuxt.config.ts`

Run: `sed -n '1,120p' packages/nuxt/playground/modules/demo-api/collection.ts`

Run: `sed -n '1,200p' packages/nuxt/playground/modules/demo-api/runtime/server/profile.get.ts`

Run: `sed -n '1,200p' packages/nuxt/playground/modules/demo-api/runtime/server/echo.post.ts`

Expected: `README.md` can reuse a real collection, one GET handler, one POST handler, and a real `calla(...)` shape without making up API contracts.

- [ ] **Step 5: Note the concrete coverage surface that `OVERVIEW.md` should mention**

Run: `sed -n '1,220p' packages/nuxt/test/basic.test.ts`

Run: `sed -n '1,260p' packages/nuxt/test/collection-ref.test.ts`

Run: `sed -n '1,220p' packages/nuxt/test/collection-macro.test.ts`

Expected: the coverage section stays concrete: SSR smoke coverage, collection ref resolution cases, and the `defineApiCollection` macro rewrite test.

### Task 2: Draft `packages/nuxt/README.md`

**Files:**
- Create: `packages/nuxt/README.md`
- Read: `packages/nuxt/package.json`
- Read: `packages/nuxt/src/module.ts`
- Read: `packages/nuxt/src/collection-ref.ts`
- Read: `packages/nuxt/src/collection.ts`
- Read: `packages/nuxt/src/calla.ts`
- Read: `packages/nuxt/playground/nuxt.config.ts`
- Read: `packages/nuxt/playground/modules/demo-api/collection.ts`
- Read: `packages/nuxt/playground/modules/demo-api/runtime/server/profile.get.ts`
- Read: `packages/nuxt/playground/modules/demo-api/runtime/server/echo.post.ts`

- [ ] **Step 1: Create the README skeleton in the exact section order from the spec**

```md
# @heyintech/sdkr-nuxt

## @heyintech/sdkr-nuxt 是什么

## 功能概览

## 安装与启用

## 快速开始

## sdkr.collections 的写法

## collection 定义约定

## CallaMeta 与 calla(...)

## 常用选项

## 给维护者与贡献者
```

- [ ] **Step 2: Write the package positioning, feature list, and install block with package-local naming**

```md
# @heyintech/sdkr-nuxt

`@heyintech/sdkr-nuxt` 是一个 Nuxt 模块，用来把文件系统定义的服务端 API collection 暴露成带类型的 `calla(...)` 调用面。

## 功能概览

- 从 `sdkr.collections` 加载一个或多个 collection
- 支持目录、显式 `.ts` 文件和 glob 三种 collection 引用方式
- 根据 handler 导出的 `CallaMeta` 生成 `types/sdkr.d.ts`
- 在构建期把 `calla(...)` 重写成 `useFetch(...)`
- 默认注入全局 `calla`，也支持显式从 `#sdkr/calla` 导入

## 安装与启用

```bash
npm i @heyintech/sdkr-nuxt
```

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr-nuxt'],
  sdkr: {
    collections: [],
  },
})
```
```

- [ ] **Step 3: Write one quick-start flow backed by the playground files**

```md
## 快速开始

`collection.ts`:

```ts
import { defineApiCollection } from '@heyintech/sdkr-nuxt'

export default defineApiCollection({
  name: 'demo-api',
  routeGroups: [
    {
      dir: 'runtime/server',
      clientPrefix: '/demo',
    },
  ],
})
```

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr-nuxt'],
  sdkr: {
    collections: ['modules/demo-api'],
  },
})
```

`runtime/server/profile.get.ts`:

```ts
import { getQuery } from 'h3'

export interface CallaMeta {
  query: {
    name?: string
  }
  res: {
    message: string
  }
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const name = typeof query.name === 'string' ? query.name : 'sdkr'

  return {
    message: `Hello, ${name}!`,
  } satisfies CallaMeta['res']
})
```

页面里调用：

```ts
const { data } = await calla('/demo/profile', {
  query: {
    name: 'world',
  },
})
```
```

- [ ] **Step 4: Fill the collection resolution and collection contract sections with the exact supported shapes**

```md
## sdkr.collections 的写法

- 目录式：`'modules/demo-api'`，会解析为 `modules/demo-api/collection.ts`
- 显式 `.ts` 文件式：`'modules/demo-explicit/demo-module.ts'`
- glob：`'modules/*'` 或 `'modules/*/collection.ts'`

这些引用都相对消费方 Nuxt 项目的 `rootDir` 解析；glob 匹配不到任何文件时，模块启动会抛错。

## collection 定义约定

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

说明：

- `defineApiCollection(...)` 是 authoring helper，本身只是 identity function
- 未显式设置 `root` 时，默认使用当前 collection 文件所在目录
- `root` 可以是 `file:` URL、绝对路径，或相对 collection 文件的路径
- `ignore` 会附加到扫描阶段的忽略模式上
```

- [ ] **Step 5: Explain `CallaMeta`, `calla(...)`, and the public option surface without leaking internal pipeline detail**

```md
## CallaMeta 与 calla(...)

`CallaMeta` 只读取三个字段：

- `body`
- `query`
- `res`

`calla(...)` 是编译期宏表面；它的类型壳与 Nuxt `useFetch` 对齐，构建期会被改写成 `useFetch(...)`。

默认情况下，模块会把 `calla` 注入到全局。关闭方式：

```ts
export default defineNuxtConfig({
  sdkr: {
    injectCallaToGlobal: false,
  },
})
```

关闭全局注入后，显式导入：

```ts
import { calla } from '#sdkr/calla'
```

## 常用选项

- `collections: string[]`
- `injectCallaToGlobal: boolean`，默认值是 `true`
```

- [ ] **Step 6: End the README with the maintainer handoff and create the first docs commit**

```md
## 给维护者与贡献者

如果你需要了解模块 setup、collection 解析、路由扫描、类型生成和 transform 的实现链路，请继续阅读 [OVERVIEW.md](./OVERVIEW.md)。
```

Run: `git add packages/nuxt/README.md`

Run: `git commit -m "docs(nuxt): add package readme"`

Expected: one docs-only commit containing the new package README.

### Task 3: Draft `packages/nuxt/OVERVIEW.md`

**Files:**
- Create: `packages/nuxt/OVERVIEW.md`
- Read: `packages/nuxt/src/module.ts`
- Read: `packages/nuxt/src/collection-ref.ts`
- Read: `packages/nuxt/src/collection.ts`
- Read: `packages/nuxt/src/scan.ts`
- Read: `packages/nuxt/src/calla.ts`
- Read: `packages/nuxt/src/calla-meta.ts`
- Read: `packages/nuxt/src/templates.ts`
- Read: `packages/nuxt/src/transform.ts`
- Read: `packages/nuxt/playground/nuxt.config.ts`
- Read: `packages/nuxt/test/basic.test.ts`
- Read: `packages/nuxt/test/collection-ref.test.ts`
- Read: `packages/nuxt/test/collection-macro.test.ts`

- [ ] **Step 1: Create the maintainer-oriented skeleton from the spec**

```md
# @heyintech/sdkr-nuxt OVERVIEW

## 这个包解决什么问题

## 当前实现模型

## 模块启动流程

## collection 引用解析

## collection 契约

## 路由扫描与冲突判定

## 类型提取与模板生成

## calla 类型接口

## transform 层

## playground 与测试覆盖
```

- [ ] **Step 2: Write the problem statement, implementation model, and setup flow from `src/module.ts`**

```md
## 这个包解决什么问题

`@heyintech/sdkr-nuxt` 把 collection authoring、handler 扫描、`CallaMeta` 类型提取和 `calla(...)` 调用面组合成一个 Nuxt 模块，让 Nuxt 应用可以从文件系统 API 生成一套类型化的客户端调用接口。

## 当前实现模型

- `calla(...)` 是编译期宏表面；`src/calla.ts` 导出的只是类型壳，真实运行时依赖 transform 把调用改写成 `useFetch(...)`
- `defineApiCollection(...)` 是 authoring helper；默认只是 identity function，用来提供结构和类型约束

## 模块启动流程

`src/module.ts` 的 setup 流程是：

1. 从 Nuxt 项目的 `rootDir` 解析 `sdkr.collections`
2. 用 `jiti` 导入每个 collection
3. 计算 `moduleRoot`、`serverRoot` 和 `storesRoot`
4. 为每个 collection 的 `runtime/server` 建立 watch
5. 扫描 route group 并生成 handler 列表
6. 检查 route conflict
7. 通过 `addServerHandler(...)` 注册 Nitro handler
8. 把 `#sdkr/calla` alias 到 `src/calla.ts`
9. 生成 `types/sdkr.d.ts`
10. 把 `runtime/stores` 加进 Nuxt 自动导入目录
11. 安装 `calla(...) -> useFetch(...)` 的 Vite transform
```

- [ ] **Step 3: Document collection resolution, contract, and route scanning with the exact runtime rules**

```md
## collection 引用解析

`src/collection-ref.ts` 处理 `sdkr.collections`：

- 所有引用都相对消费方 Nuxt 项目的 `rootDir` 解析
- 非显式 TypeScript 文件路径会自动补成 `/collection.ts`
- 支持 glob，并在匹配为空时抛错
- 精确文件路径会先按项目路径解析，失败后再回退到 Nuxt `resolvePath`
- 多个引用命中同一个文件时会去重

## collection 契约

`src/collection.ts` 暴露的用户侧契约是：

- `name`
- `root?`
- `routeGroups`
- `ignore?`

每个 `routeGroup` 包含：

- `dir: string | RegExp`
- `clientPrefix: string`

## 路由扫描与冲突判定

`src/scan.ts` 的扫描规则包括：

- 扫描 `**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}`
- 去掉扩展名
- 去掉 `(group)/` 这种 route group 目录段
- 把 `[id]` 映射成 `:id`
- 把 `[...slug]` 映射成 `**:slug`
- 把 `[...]` 映射成 `**`
- 把 `/index` 收敛到父路径
- 识别 `.get`、`.post` 之类的方法后缀
- 识别 `.dev`、`.prod`、`.prerender` 环境后缀

`src/module.ts` 的冲突规则是：

- route 相同并且任意一方没有 method 时，视为冲突
- route 相同并且两边 method 也相同时，视为冲突
```

- [ ] **Step 4: Document the type pipeline, `calla` surface, transform split, and current coverage**

```md
## 类型提取与模板生成

`src/calla-meta.ts` 会解析 handler 源码里的具名导出 `CallaMeta`，支持：

- `export interface CallaMeta { ... }`
- `export type CallaMeta = { ... }`

它只提取三个字段：

- `body`
- `query`
- `res`

`src/templates.ts` 会把这些字段组装成路由 payload map，并生成一个 Nuxt 类型模板文件：

- `types/sdkr.d.ts`

生成结果会扩展 `#sdkr/calla` 里的 `InternalApiPayload`，并在 `injectCallaToGlobal` 为 `true` 时声明全局 `calla`。

## calla 类型接口

`src/calla.ts` 的定位是公开类型壳：

- `InternalApiPayload` 初始为空，等待生成文件扩展
- `CallaQuery`、`CallaBody`、`CallaRes`、`CallaOpts` 与 `calla(...)` 一起构成用户可见类型面
- 函数体本身为空，因为源码调用会在构建时被改写掉

## transform 层

`src/transform.ts` 里有两套职责独立的 transform 逻辑：

1. `createCallaToUseFetchPlugin()`：当前模块实际安装的 Vite 插件，把源码级 `calla(...)` 调用改写成 `useFetch(...)`
2. `rewriteDefineApiCollectionMacro()`：独立的 `defineApiCollection(...)` 擦除逻辑，用来把默认导出的 collection helper 调用改写成纯对象

## playground 与测试覆盖

当前仓库里可以引用的验证面包括：

- `packages/nuxt/playground`：手动验证目录式 collection 引用、显式 `.ts` 文件引用，以及 `calla(...)` 的 GET/POST 调用
- `packages/nuxt/test/basic.test.ts`：SSR smoke test
- `packages/nuxt/test/collection-ref.test.ts`：目录式、显式 `.ts`、glob、去重和空匹配错误
- `packages/nuxt/test/collection-macro.test.ts`：`defineApiCollection(...)` rewrite 行为
```

- [ ] **Step 5: Create the second docs commit**

Run: `git add packages/nuxt/OVERVIEW.md`

Run: `git commit -m "docs(nuxt): add package overview"`

Expected: one docs-only commit containing the new maintainer overview.

### Task 4: Verify scope, accuracy, and cross-document boundaries

**Files:**
- Modify: `packages/nuxt/README.md`
- Modify: `packages/nuxt/OVERVIEW.md`
- Read: `docs/superpowers/specs/2026-03-30-packages-nuxt-docs-design.md`
- Read: `packages/nuxt/package.json`
- Read: `packages/nuxt/src/module.ts`
- Read: `packages/nuxt/src/collection-ref.ts`
- Read: `packages/nuxt/src/collection.ts`
- Read: `packages/nuxt/src/scan.ts`
- Read: `packages/nuxt/src/calla-meta.ts`
- Read: `packages/nuxt/src/templates.ts`
- Read: `packages/nuxt/src/transform.ts`

- [ ] **Step 1: Compare the two docs against the spec and remove duplicated long examples**

Run: `git diff -- packages/nuxt/README.md packages/nuxt/OVERVIEW.md`

Expected: `README.md` stays user-facing, `OVERVIEW.md` stays architecture-facing, and they only share small amounts of terminology and one cross-link.

- [ ] **Step 2: Re-check every fact that can drift**

Run: `rg -n "@heyintech/sdkr-nuxt|injectCallaToGlobal|collections|CallaMeta|#sdkr/calla" packages/nuxt/README.md packages/nuxt/OVERVIEW.md`

Run: `rg -n "name|peerDependencies|injectCallaToGlobal|collections|CALLA_MODULE_ID|body|query|res" packages/nuxt/package.json packages/nuxt/src/module.ts packages/nuxt/src/collection-ref.ts packages/nuxt/src/calla-meta.ts packages/nuxt/src/templates.ts`

Expected: package name, option names, default value, module id, and `CallaMeta` field list all match the current implementation.

- [ ] **Step 3: Check the Markdown files for obvious diff and whitespace issues**

Run: `git diff --check -- packages/nuxt/README.md packages/nuxt/OVERVIEW.md`

Expected: no output.

- [ ] **Step 4: Commit any verification-driven cleanup as a final tightening pass**

Run: `git add packages/nuxt/README.md packages/nuxt/OVERVIEW.md`

Run: `git commit -m "docs(nuxt): tighten package docs"`

Expected: only create this commit if verification changed either file.
