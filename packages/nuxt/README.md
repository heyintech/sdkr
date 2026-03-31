# @heyintech/sdkr-nuxt

## @heyintech/sdkr-nuxt 是什么

`@heyintech/sdkr-nuxt` 是一个 Nuxt 模块，用来把文件系统定义的服务端 API
collection 暴露成带类型的 `calla(...)` 调用面。

它适合这样的场景：

- 你希望按目录组织一组 API handler
- 你希望从 handler 导出的类型里生成请求和响应约束
- 你希望在页面或 TS 代码里直接写 `calla(...)`，而不是手工维护一层客户端包装

当前包的 `peerDependencies.nuxt` 要求是 `^4.0.0`。

## 功能概览

- 从 `sdkr.collections` 加载一个或多个 collection
- 支持目录、显式 `.ts` 文件和 glob 三种 collection 引用方式
- 根据 handler 导出的 `CallaMeta` 生成 `types/sdkr.d.ts`
- 在构建期把 `calla(...)` 重写成 `useFetch(...)`
- 默认注入全局 `calla`，也支持显式从 `#sdkr/calla` 导入

## 安装与启用

安装：

```bash
npm i @heyintech/sdkr-nuxt
```

在 `nuxt.config.ts` 里启用模块：

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr-nuxt'],
  sdkr: {
    collections: [],
  },
})
```

`sdkr.collections` 里的引用都相对消费方 Nuxt 项目的 `rootDir` 解析。

## 快速开始

下面的例子对应 `packages/nuxt/playground/modules/demo-api` 这类最常见写法：

`collection.ts`：

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

在 `nuxt.config.ts` 注册这个 collection：

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr-nuxt'],
  sdkr: {
    collections: ['modules/demo-api'],
  },
})
```

写一个导出 `CallaMeta` 的 handler，例如 `runtime/server/profile.get.ts`：

```ts
import { getQuery } from 'h3'

export interface CallaMeta {
  query: {
    name?: string
  }
  res: {
    message: string
    source: string
  }
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const name = typeof query.name === 'string' ? query.name : 'sdkr'

  return {
    message: `Hello, ${name}!`,
    source: 'runtime/server/profile.get.ts',
  } satisfies CallaMeta['res']
})
```

然后在页面或 TS 代码里调用：

```ts
const { data } = await calla('/demo/profile', {
  query: {
    name: 'world',
  },
})
```

如果你还需要带 `body` 的例子，可以参考 playground 里的
`runtime/server/echo.post.ts`，它演示了如何从 `CallaMeta['body']` 约束
POST 请求体。

## sdkr.collections 的写法

`sdkr.collections` 主要支持三种写法：

- 目录式：`'modules/demo-api'`
- 显式 `.ts` 文件式：`'modules/demo-explicit/demo-module.ts'`
- glob：`'modules/*'` 或 `'modules/*/collection.ts'`

解析规则是：

- 所有引用都相对消费方 Nuxt 项目的 `rootDir` 解析
- 如果你给的不是显式 TypeScript 文件路径，模块会自动补成 `/collection.ts`
- glob 会先展开成文件列表，再加载 collection
- glob 匹配不到任何文件时，模块 setup 会直接抛错

例如：

- `'modules/demo-api'` 会解析成 `modules/demo-api/collection.ts`
- `'modules/demo-explicit/demo-module.ts'` 会保留这个显式文件路径
- `'modules/*'` 会展开为匹配到的 `collection.ts` 文件

## collection 定义约定

用户侧的 collection 契约在 `defineApiCollection(...)` 里长这样：

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

几个常用点：

- `defineApiCollection(...)` 是 authoring helper，本身只是 identity function
- `root` 不填时，默认使用当前 collection 文件所在目录
- `root` 可以是 `file:` URL、绝对路径，或相对当前 collection 文件的路径
- `routeGroups` 至少要定义一组扫描来源
- `ignore` 会附加到扫描阶段的忽略模式上

一个最小 collection 例子：

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

## CallaMeta 与 calla(...)

每个 handler 都可以选择导出具名 `CallaMeta`，例如：

```ts
export interface CallaMeta {
  body?: unknown
  query?: unknown
  res?: unknown
}
```

模块只读取这三个字段：

- `body`
- `query`
- `res`

它们会被用来生成 `types/sdkr.d.ts`，从而让 `calla(...)` 拿到对应路由的请求和响应类型。

`calla(...)` 本身是编译期宏表面。对使用者来说，你只需要像调用
`useFetch(...)` 一样传入路径和选项；构建阶段会把源码里的 `calla(...)`
改写成 `useFetch(...)`。

默认情况下，模块会把 `calla` 注入到全局。关闭方式：

```ts
export default defineNuxtConfig({
  sdkr: {
    injectCallaToGlobal: false,
  },
})
```

关闭全局注入后，改成显式导入：

```ts
import { calla } from '#sdkr/calla'
```

## 常用选项

目前最常用的公开选项是：

- `collections: string[]`
- `injectCallaToGlobal: boolean`

其中：

- `collections` 用来声明要加载的 collection 引用列表
- `injectCallaToGlobal` 默认值是 `true`

## 给维护者与贡献者

如果你需要了解模块 setup、collection 解析、路由扫描、类型生成和 transform
的实现链路，请继续阅读 [OVERVIEW.md](./OVERVIEW.md)。
