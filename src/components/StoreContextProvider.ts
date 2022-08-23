import React from 'react'
import { StateTree, UseStore } from '../types'

interface StoreContextProviderProps<Id extends string = any, S extends StateTree = any> {
  useStores: UseStore<Id, S>[]
  children: React.ReactNode
}

function createProviderNode<Id extends string = string, S extends StateTree = StateTree>(
  useStore: UseStore<Id, S>,
  children: React.ReactNode
) {
  const { $context, $useValue } = useStore
  // eslint-disable-next-line react/no-children-prop
  return React.createElement($context.Provider, {
    value: $useValue(),
    children,
  })
}

export function StoreContextProvider({ useStores, children }: StoreContextProviderProps) {
  console.log(`StoreContextProvider: ${useStores.length}`)
  const count = useStores.length
  const store1 = useStores[0]
  if (store1) {
    let ProviderNode: React.ReactElement = createProviderNode(store1, children)
    if (useStores.length > 1) {
      for (let i = 1; i < useStores.length; i++) {
        ProviderNode = createProviderNode(useStores[i], ProviderNode)
      }
    }
    return ProviderNode
  } else {
    console.warn('Invalid stores provided to StoreContextProvider')
    console.warn(`Stores Count: ${count}`)
    return null
  }
}

// export default StoreContextProvider
