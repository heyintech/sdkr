import type { AsyncData, AsyncDataOptions, FetchResult } from 'nuxt/app'
import type { HTTPMethod } from 'h3'
import type {
  AvailableRouterMethod as _AvailableRouterMethod,
  NitroFetchRequest,
} from 'nitro/types'
import type {
  ResponseType as _ResponseType,
  FetchError,
  FetchOptions,
} from 'ofetch'
import type { MaybeRefOrGetter, MultiWatchSources, Ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InternalApiPayload {}

type PickFrom<T, K extends string[]>
  = T extends Array<any>
    ? T
    : T extends Record<string, any>
      ? keyof T extends K[number]
        ? T
        : K[number] extends never
          ? T
          : Pick<T, K[number]>
      : T
type KeysOf<T> = Array<
  T extends T ? (keyof T extends string ? keyof T : never) : never
>
type AvailableRouterMethod<R extends NitroFetchRequest>
  = | _AvailableRouterMethod<R>
    | Uppercase<_AvailableRouterMethod<R>>
type ComputedOptions<T> = {
  [K in keyof T]: T[K] extends () => unknown
    ? T[K]
    : T[K] extends Record<string, unknown>
      ? ComputedOptions<T[K]> | Ref<T[K]> | T[K]
      : Ref<T[K]> | T[K];
}
interface NitroFetchOptions<
  R extends NitroFetchRequest,
  M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>,
  DataT = unknown,
> extends FetchOptions<_ResponseType, DataT> {
  method?: M
}
type ComputedFetchOptions<
  R extends NitroFetchRequest,
  M extends AvailableRouterMethod<R>,
  DataT = unknown,
> = ComputedOptions<NitroFetchOptions<R, M, DataT>>

type RouterMethod = Lowercase<HTTPMethod>
type RouteKey = Extract<keyof InternalApiPayload, string>
type CallaField = 'body' | 'query' | 'res'
type DefaultRequestSchema = { body?: never, query?: never }
type NormalizeMethod<M extends string> = Lowercase<M> & RouterMethod
type MatchedRoute<Route extends string> = Extract<Route, RouteKey>
type RouteMethods<Route extends string>
  = MatchedRoute<Route> extends infer R
    ? R extends RouteKey
      ? Exclude<Extract<keyof InternalApiPayload[R], string>, 'default'>
      : never
    : never
type DefaultRouteMethod<Route extends string, Fallback extends RouterMethod>
  = 'get' extends RouteMethods<Route>
    ? 'get'
    : Extract<RouteMethods<Route>, RouterMethod> extends infer Method
      ? Method extends RouterMethod
        ? Method
        : Fallback
      : Fallback
type RouteSchema<Route extends string, Method extends RouterMethod, Default>
  = MatchedRoute<Route> extends infer R
    ? R extends RouteKey
      ? Method extends keyof InternalApiPayload[R]
        ? InternalApiPayload[R][Method]
        : 'default' extends keyof InternalApiPayload[R]
          ? InternalApiPayload[R][Extract<
            'default',
            keyof InternalApiPayload[R]
          >]
          : Default
      : Default
    : Default
type TypedRouteField<
  Route extends string,
  Field extends CallaField,
  Method extends RouterMethod,
  Default = never,
>
  = RouteSchema<Route, Method, Record<string, never>> extends infer Schema
    ? Schema extends Record<string, unknown>
      ? Field extends keyof Schema
        ? Schema[Field]
        : Default
      : Default
    : Default
type TypedRequestSchema<
  Route,
  Method extends RouterMethod,
> = Route extends string
  ? RouteSchema<Route, Method, DefaultRequestSchema> extends infer Schema
    ? Schema extends { res?: unknown }
      ? Omit<Schema, 'res'>
      : Schema
    : DefaultRequestSchema
  : DefaultRequestSchema
type FetchPayload<
  ReqT extends NitroFetchRequest,
  M extends AvailableRouterMethod<ReqT>,
> = ReqT extends string
  ? TypedRequestSchema<ReqT, NormalizeMethod<Extract<M, string>>>
  : DefaultRequestSchema
type DefaultCallaMethod<ReqT extends NitroFetchRequest>
  = 'get' extends AvailableRouterMethod<ReqT>
    ? 'get'
    : AvailableRouterMethod<ReqT>

export type CallaQuery<
  Route extends string,
  Method extends RouterMethod = DefaultRouteMethod<Route, 'get'>,
> = TypedRouteField<Route, 'query', Method>

export type CallaBody<
  Route extends string,
  Method extends RouterMethod = DefaultRouteMethod<Route, 'post'>,
> = TypedRouteField<Route, 'body', Method>

export type CallaRes<
  ReqT extends NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT> = DefaultCallaMethod<ReqT>,
> = ReqT extends string
  ? TypedRouteField<
    ReqT,
    'res',
    NormalizeMethod<Extract<Method, string>>,
    FetchResult<ReqT, Method>
  >
  : FetchResult<ReqT, Method>

export interface CallaOpts<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
  R extends NitroFetchRequest = string & {},
  M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>,
>
  extends
  Omit<AsyncDataOptions<ResT, DataT, PickKeys, DefaultT>, 'watch'>,
  Omit<ComputedFetchOptions<R, M, DataT>, 'timeout' | 'body' | 'query'> {
  key?: MaybeRefOrGetter<string>
  $fetch?: typeof globalThis.$fetch
  watch?: MultiWatchSources | false
}

export function calla<
  ResT = void,
  ErrorT = FetchError,
  ReqT extends NitroFetchRequest = NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT> = ResT extends void
    ? 'get' extends AvailableRouterMethod<ReqT>
      ? 'get'
      : AvailableRouterMethod<ReqT>
    : AvailableRouterMethod<ReqT>,
  _ResT = ResT extends void ? CallaRes<ReqT, Method> : ResT,
  DataT = _ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  request: Ref<ReqT> | ReqT | (() => ReqT),
  opts?: ComputedOptions<FetchPayload<ReqT, Method>>
    & CallaOpts<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>,
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | undefined>
export function calla<
  ResT = void,
  ErrorT = FetchError,
  ReqT extends NitroFetchRequest = NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT> = ResT extends void
    ? 'get' extends AvailableRouterMethod<ReqT>
      ? 'get'
      : AvailableRouterMethod<ReqT>
    : AvailableRouterMethod<ReqT>,
  _ResT = ResT extends void ? CallaRes<ReqT, Method> : ResT,
  DataT = _ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = DataT,
>(
  request: Ref<ReqT> | ReqT | (() => ReqT),
  opts?: ComputedOptions<FetchPayload<ReqT, Method>>
    & CallaOpts<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>,
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | undefined>
export function calla(): any {}
