# sdkr

`@heyintech/sdkr` is a Nuxt module that turns filesystem-defined server APIs into
a typed client surface powered by `calla(...)`.

The current model is:

- author API modules with `defineApiCollection(...)`
- let `sdkr` scan handler files and register Nitro routes
- export `CallaMeta` from handlers to generate request/response typings
- write `calla(...)` in Vue or TS code and let the build rewrite it to `useFetch(...)`

Chinese overview: [OVERVIEW.zh-CN.md](./OVERVIEW.zh-CN.md)  
English overview: [OVERVIEW.md](./OVERVIEW.md)

## Features

- `sdkr.collections` supports project-relative directories, explicit `.ts` files, and glob patterns
- collection directory refs default to `<dir>/collection.ts`
- one generated type file: `types/sdkr.d.ts`
- `calla(...)` is a compile-time macro surface with `useFetch`-aligned typing
- optional global `calla`, or import-based usage through `#sdkr/calla`
- bundled CLI to scaffold a collection module inside a Nuxt app

## Workspace

This repository is a `pnpm` workspace monorepo.

- `packages/nuxt` contains the published Nuxt module package, `@heyintech/sdkr`
- `packages/cli` contains the CLI source used to scaffold collection modules
- `packages/nuxt/playground` is the local Nuxt app used for manual verification

Build output is produced with `tsdown`. The Nuxt package's declaration files are
emitted by `scripts/build-nuxt-dts.mjs` so the published type surface stays
small and source-like.

## Install

```bash
npm i @heyintech/sdkr
```

Enable the module in your Nuxt app:

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr'],
  sdkr: {
    collections: [],
  },
})
```

## Quick Start

Generate a collection scaffold inside your Nuxt app:

```bash
npx @heyintech/sdkr collection modules/demo-api --example
```

This command:

- requires a path relative to the Nuxt app root
- derives the collection `name` from the last path segment
- uses `/${name}` as the default `clientPrefix`
- continues only when the target path does not exist yet, or is an empty directory
- aborts when the target path is a file or a non-empty directory

The generated `collection.ts` looks like this:

```ts
import { defineApiCollection } from '@heyintech/sdkr'

export default defineApiCollection({
  name: 'demo-api',
  routeGroups: [
    {
      dir: 'runtime/server',
      clientPrefix: '/demo-api',
    },
  ],
})
```

Register the collection in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@heyintech/sdkr'],
  sdkr: {
    collections: [
      'modules/demo-api',
    ],
  },
})
```

Add a server handler:

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

Then call it from Vue or TS:

```ts
const { data } = await calla('/demo-api/hello', {
  query: {
    name: 'world',
  },
})
```

## Collection Resolution

`sdkr.collections` is resolved from the consuming Nuxt app's `rootDir`.

Examples:

- `'modules/demo-api'`  
  resolves to `modules/demo-api/collection.ts`
- `'modules/demo-explicit/demo-module.ts'`  
  keeps the explicit TypeScript file
- `'modules/*'`  
  expands to matching `collection.ts` files
- `'modules/*/collection.ts'`  
  expands explicit file globs

If a glob matches nothing, module setup throws.

## Collection Contract

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

Notes:

- `root` is optional
- when omitted, `sdkr` uses the directory containing the loaded collection file
- `root` may be a `file:` URL, an absolute path, or a path relative to the collection file
- `defineApiCollection(...)` is an authoring helper for typing and structure; the object you pass is the meaningful input

## `CallaMeta` and Type Generation

Each handler may export a named `CallaMeta`:

```ts
export interface CallaMeta {
  body?: unknown
  query?: unknown
  res?: unknown
}
```

`sdkr` reads only these three fields:

- `body`
- `query`
- `res`

From scanned handlers it generates a single Nuxt type file:

- `types/sdkr.d.ts`

That file augments `#sdkr/calla` with route payload metadata and, by default,
also injects a global `calla`.

## `calla(...)`

`calla(...)` is not a runtime implementation. It is a compile-time macro surface.

At build time, `sdkr` rewrites:

```ts
calla('/demo-api/hello', { query: { name: 'world' } })
```

into:

```ts
useFetch('/demo-api/hello', { query: { name: 'world' } })
```

The type shell is aligned with Nuxt `useFetch`.

If you disable global injection:

```ts
export default defineNuxtConfig({
  sdkr: {
    injectCallaToGlobal: false,
  },
})
```

then import it explicitly:

```ts
import { calla } from '#sdkr/calla'
```

## CLI

Usage:

```bash
sdkr collection <targetPath> [--template minimal|example]
```

Examples:

```bash
npx @heyintech/sdkr collection modules/demo-api
npx @heyintech/sdkr collection modules/demo-api --example
npx @heyintech/sdkr collection modules/internal/user-center --template example
```

Generated files:

- `collection.ts`
- `runtime/server/.gitkeep`
- `runtime/server/hello.get.ts` when using the `example` template

The CLI does not edit `nuxt.config.ts` for you.

## Development

```bash
pnpm install
pnpm build
pnpm dev:prepare
pnpm dev
pnpm dev:build
pnpm lint
pnpm test
pnpm test:types
pnpm prepack
```
