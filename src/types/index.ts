/* eslint-disable @typescript-eslint/ban-types */
import { Context } from 'use-context-selector'

export type StateTree = Record<string | number | symbol, any>

// mirror state tree
export type StoreStateTree<T extends StateTree> = {
  [K in keyof T]: T[K]
}

// getters provided in defineStore options
export type _GettersTree = Record<string, () => any>

// actions provided in defineStore options
export type _ActionsTree = Record<string, (...args: any[]) => any>

export interface StoreProperties<Id extends string> {
  $id: Id
}

export interface _StoreWithState<Id extends string, S extends StateTree>
  extends StoreProperties<Id> {
  /**
   * Provides direct access to the store's context.
   */
  $context: Context<[S, React.Dispatch<_DeepPartial<S>>]>
  /**
   * Returns the store's state & dispatch function, this invokes `React.useReducer` with the store's default reducer and state.
   */
  $useValue: () => [S, React.Dispatch<_DeepPartial<S>>]
  /**
   * Returns the entire state from the store's context.
   * This is similar to invoking React's useContext with the store's context.
   * Unless you require the entire state object, it is recommended to use the store's `get` function instead of `$state`.
   */
  $state: StoreStateTree<S>
  /**
   * Returns the context-selected value by selector.
   * @param selector
   */
  get<Selected>(selector: (value: S) => Selected): Selected
  /**
   * Merge the provided data into the store's state.
   * @param patchToApply
   */
  set(patchToApply: _DeepPartial<S>): void
}

export type _StoreWithMappedState<S extends StateTree> = {
  readonly [k in keyof S]: S[k] extends () => infer R ? R : S[k]
}

export type _StoreWithActions<A> = {
  [k in keyof A]: A[k] extends (...args: infer P) => infer R ? (...args: P) => R : never
}

export type _StoreWithGetters<G> = {
  readonly [k in keyof G]: G[k] extends (...args: any[]) => infer R ? R : G[k]
}

export type Store<
  Id extends string = string,
  S extends StateTree = {},
  G = {},
  A = {}
> = _StoreWithState<Id, S> & _StoreWithMappedState<S> & _StoreWithGetters<G> & _StoreWithActions<A>

/**
 * Options object provided as `defineStore` argument
 */
export interface DefineStoreOptions<Id extends string, S extends StateTree, G, A> {
  id: Id
  state: () => S
  getters?: G & ThisType<_StoreWithMappedState<S> & _StoreWithGetters<G>>
  actions?: A &
    ThisType<Omit<Store<Id, S, G, A>, '$context' | '$id' | '$useValue' | '$state' | 'get'>>
}

/**
 * Return type of `defineStore`
 */
export interface UseStore<
  Id extends string = string,
  S extends StateTree = StateTree,
  G = _GettersTree,
  A = _ActionsTree
> {
  (): Store<Id, S, G, A>
  /**
   * Provides direct access to the store's context.
   */
  $context: Context<[S, React.Dispatch<_DeepPartial<S>>]>
  /**
   * Returns the store's state & dispatch function, this invokes `React.useReducer` with the store's default reducer and state.
   */
  $useValue: () => [S, React.Dispatch<_DeepPartial<S>>]
}

export type StoreGeneric = Store<string, StateTree, _GettersTree, _ActionsTree>

export type DefineStoreOptionsGeneric<G> = DefineStoreOptions<string, StateTree, G, _ActionsTree>

export interface StoreKeysContext {
  stateKeys: string[]
  getterKeys: string[]
  actionKeys: string[]
}

/**
 * Recursive `Partial<T>`. Used by {@link Store['$set']}.
 */
export type _DeepPartial<T> = { [K in keyof T]?: _DeepPartial<T[K]> }
