import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { dirname, extname, isAbsolute, resolve } from 'pathe'
import {
  addServerHandler,
  addTypeTemplate,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import type { ApiCollection } from './collection'
import { resolveCollectionRefs } from './collection-ref'
import { CALLA_MODULE_ID, genSdkrTemplate } from './templates'
import { scanServerRoutes, type ScannedServerRoute } from './scan'
import { createCallaToUseFetchPlugin } from './transform'

export * from './collection'

const jiti = createJiti(import.meta.url)

export interface ModuleOptions {
  collections: string[]
  injectCallaToGlobal: boolean
}

interface LoadedCollection extends ApiCollection {
  moduleRoot: string
  serverRoot: string
  storesRoot: string
}

interface CollectionHandler extends ScannedServerRoute {
  collectionName: string
}

function isFileLikePath(path: string) {
  return Boolean(extname(path))
}

function resolveCollectionRoot(
  root: string | undefined,
  collectionPath: string,
) {
  if (!root) {
    return dirname(collectionPath)
  }

  if (root.startsWith('file:')) {
    const filePath = fileURLToPath(root)
    return isFileLikePath(filePath) ? dirname(filePath) : filePath
  }

  const normalizedRoot = isAbsolute(root)
    ? root
    : resolve(dirname(collectionPath), root)
  return isFileLikePath(normalizedRoot)
    ? dirname(normalizedRoot)
    : normalizedRoot
}

async function loadCollection(
  collectionPath: string,
): Promise<LoadedCollection> {
  const normalizedCollection = (await jiti.import(collectionPath, {
    default: true,
  })) as ApiCollection | undefined

  if (!normalizedCollection) {
    throw new Error(
      `[sdkr] Collection "${collectionPath}" must export a default ApiCollection.`,
    )
  }

  if (
    !Array.isArray(normalizedCollection.routeGroups)
    || normalizedCollection.routeGroups.length === 0
  ) {
    throw new Error(
      `[sdkr] Collection "${normalizedCollection.name}" must define at least one route group.`,
    )
  }

  const moduleRoot = resolveCollectionRoot(
    normalizedCollection.root,
    collectionPath,
  )
  return {
    ...normalizedCollection,
    moduleRoot,
    serverRoot: resolve(moduleRoot, 'runtime/server'),
    storesRoot: resolve(moduleRoot, 'runtime/stores'),
  }
}

async function loadCollections(collectionRefs: string[]) {
  return Promise.all(collectionRefs.map(loadCollection))
}

async function scanCollectionRoutes(
  collection: LoadedCollection,
): Promise<CollectionHandler[]> {
  const ignore = ['**/types/**', '**/*.types.*', ...(collection.ignore ?? [])]

  const handlerGroups = await Promise.all(
    collection.routeGroups.map(group =>
      scanServerRoutes(collection.moduleRoot, group.dir, group.clientPrefix, {
        ignore,
      }),
    ),
  )

  return handlerGroups.flat().map(handler => ({
    ...handler,
    collectionName: collection.name,
  }))
}

async function scanConfiguredCollections(collections: LoadedCollection[]) {
  const handlerGroups = await Promise.all(
    collections.map(scanCollectionRoutes),
  )
  return handlerGroups.flat()
}

function routesConflict(a: CollectionHandler, b: CollectionHandler) {
  if (a.route !== b.route) return false
  if (!a.method || !b.method) return true
  return a.method === b.method
}

function assertNoRouteConflicts(handlers: CollectionHandler[]) {
  const visited: CollectionHandler[] = []

  handlers.forEach((handler) => {
    const conflict = visited.find(existing =>
      routesConflict(existing, handler),
    )
    if (conflict) {
      throw new Error(
        `[sdkr] Route conflict on ${handler.method ?? '*'} ${handler.route}: `
        + `${conflict.collectionName} (${conflict.handler}) conflicts with `
        + `${handler.collectionName} (${handler.handler}).`,
      )
    }
    visited.push(handler)
  })
}

const sdkrModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'sdkr',
    configKey: 'sdkr',
  },
  defaults: {
    collections: [],
    injectCallaToGlobal: true,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const callaEntry = resolver.resolve('./calla')
    const collectionRefs = await resolveCollectionRefs(
      options.collections,
      nuxt.options.rootDir,
    )
    const collections = await loadCollections(collectionRefs)

    collections.forEach((collection) => {
      nuxt.options.watch.push(collection.serverRoot)
    })

    let setupHandlers: CollectionHandler[] | undefined
      = await scanConfiguredCollections(collections)
    assertNoRouteConflicts(setupHandlers)
    setupHandlers.forEach((handler) => {
      const { collectionName: _collectionName, ...serverHandler } = handler
      addServerHandler(serverHandler)
    })

    nuxt.options.alias[CALLA_MODULE_ID] = callaEntry

    addTypeTemplate({
      filename: 'types/sdkr.d.ts',
      getContents: async () => {
        const handlers
          = setupHandlers ?? (await scanConfiguredCollections(collections))
        assertNoRouteConflicts(handlers)
        return genSdkrTemplate(handlers, options.injectCallaToGlobal)
      },
    })

    setupHandlers = undefined

    nuxt.hook('imports:dirs', (dirs) => {
      collections.forEach((collection) => {
        if (existsSync(collection.storesRoot)) dirs.push(collection.storesRoot)
      })
    })

    addVitePlugin(() => createCallaToUseFetchPlugin(), { prepend: true })
  },
})

export default sdkrModule

declare module 'nuxt/schema' {
  interface NuxtConfig {
    sdkr?: ModuleOptions
  }
}
