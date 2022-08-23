import { useReducer } from 'react'
import { Context, createContext, useContext, useContextSelector } from 'use-context-selector'
import {
  DefineStoreOptions,
  DefineStoreOptionsGeneric,
  Store,
  StoreGeneric,
  StoreKeysContext,
  UseStore,
  _ActionsTree,
  _DeepPartial,
  _GettersTree,
} from '../types'
import { mergeObjects } from './utils'

/**
 * Returns a function which accepts a selector for retrieving a value from the provided context.
 * Uses the `useContextSelector` function.
 * @param context
 */
const _get =
  <S>(context: Context<[S, React.Dispatch<_DeepPartial<S>>]>) =>
  <Selected>(selector: (value: S) => Selected): Selected => {
    return useContextSelector(context, (v: [S, React.Dispatch<_DeepPartial<S>>]) => selector(v[0]))
  }

/**
 * Creates a `useStore` hook which allows for interaction with a defined store.
 * @param options - options to define the store (state, getters, actions)
 */
export function defineStore<Id extends string, S, G, A extends _ActionsTree>(
  options: DefineStoreOptions<Id, S, G, A>
): UseStore<Id, S, G, A> {
  let _state = options.state()
  const storeKeysContext = getStoreKeysContext(options)
  const storeStateContext = createContext<[S, React.Dispatch<_DeepPartial<S>>]>([
    _state,
    () => null,
  ])

  // used by the store actions proxy (proxy leveraging this internal state for binding to actions only)
  // this allows action functions to retrieve current state values without relying on useContext*
  const getState = () => _state
  const setState = (newState: S) => (_state = newState)

  const patchReducer = (state: S, patchToApply: _DeepPartial<S>) => {
    const newState = Object.assign({}, mergeObjects(state, patchToApply))
    setState(newState)
    return newState
  }
  const useValue = () => useReducer(patchReducer, _state)

  validateStoreOption(options, storeKeysContext)

  const useStoreFn = () => {
    const store = {
      $id: options.id,
      $context: storeStateContext,
      $useValue: useValue,
      get: _get(storeStateContext),
      set: useContextSelector(storeStateContext, (v) => v[1]),
    } as Store<Id, S, G, A>
    return getStoreProxy(store, options, storeKeysContext, getState)
  }

  useStoreFn.$context = storeStateContext
  useStoreFn.$useValue = useValue
  return useStoreFn
}

function getStoreKeysContext<G>(storeOptions: DefineStoreOptionsGeneric<G>): StoreKeysContext {
  const getterKeys = storeOptions.getters ? Object.keys(storeOptions.getters) : []
  const actionKeys = storeOptions.actions ? Object.keys(storeOptions.actions) : []
  const stateKeys = Object.keys(storeOptions.state()) || []
  return {
    stateKeys,
    getterKeys,
    actionKeys,
  }
}

function getStoreActionsProxy<Id extends string, S, G, A>(
  store: Store<Id, S, G, A>,
  storeOptions: DefineStoreOptions<Id, S, G, A>,
  storeKeysContext: StoreKeysContext,
  getState: () => S
) {
  return new Proxy(store, getStoreActionsProxyHandler(storeOptions, storeKeysContext, getState))
}

function getStoreActionsProxyHandler<Id extends string, S, G, A>(
  storeOptions: DefineStoreOptions<Id, S, G, A>,
  storeKeysContext: StoreKeysContext,
  getState: () => S
) {
  return {
    get(target: StoreGeneric, prop: string, receiver: StoreGeneric) {
      if (storeKeysContext.stateKeys.includes(prop)) {
        return (getState() as StoreGeneric)[prop]
      }
      if (storeKeysContext.getterKeys.includes(prop) && storeOptions.getters) {
        return (storeOptions.getters as unknown as _GettersTree)[prop].call(getState())
      }
      if (storeKeysContext.actionKeys.includes(prop) && storeOptions.actions) {
        return (storeOptions.actions as unknown as _ActionsTree)[prop].bind(receiver)
      }
      return Reflect.get(target, prop)
    },
  }
}

function getStoreProxy<Id extends string, S, G, A>(
  store: Store<Id, S, G, A>,
  storeOptions: DefineStoreOptions<Id, S, G, A>,
  storeKeysContext: StoreKeysContext,
  getState: () => S
) {
  const storeActionsProxy = getStoreActionsProxy(store, storeOptions, storeKeysContext, getState)
  return new Proxy(store, getStoreProxyHandler(storeOptions, storeKeysContext, storeActionsProxy))
}

function getStoreProxyHandler<Id extends string, S, G, A>(
  storeOptions: DefineStoreOptions<Id, S, G, A>,
  storeKeysContext: StoreKeysContext,
  storeActionsProxy: Store<Id, S, G, A>
) {
  return {
    get(target: StoreGeneric, prop: string, receiver: StoreGeneric) {
      if (prop === '$state') {
        return useContext(target.$context)[0] // the entire context state
      }
      if (storeKeysContext.stateKeys.includes(prop)) {
        return target.get((v) => v[prop])
      }
      if (storeKeysContext.getterKeys.includes(prop) && storeOptions.getters) {
        return (storeOptions.getters as unknown as _GettersTree)[prop].call(receiver)
      }
      if (storeKeysContext.actionKeys.includes(prop) && storeOptions.actions) {
        return (storeOptions.actions as unknown as _ActionsTree)[prop].bind(storeActionsProxy)
      }
      return Reflect.get(target, prop)
    },
  }
}

function validateStoreOption<G>(
  storeOptions: DefineStoreOptionsGeneric<G>,
  storeKeysContext: StoreKeysContext
) {
  const getterStateOverlappingKeys = storeKeysContext.getterKeys.filter((key) =>
    storeKeysContext.stateKeys.includes(key)
  )
  if (getterStateOverlappingKeys.length > 0) {
    console.warn(
      `Store '${storeOptions.id}' has one or more getters with the same name as a state property, the state prop(s) will take precedence: ${getterStateOverlappingKeys}`
    )
  }
}
