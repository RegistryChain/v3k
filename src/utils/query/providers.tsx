import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'

import { createPersistConfig } from './persist'
import { wagmiConfig } from './wagmi'
import { QueryClient } from '@tanstack/react-query'

type Props = {
  children: ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 24 * 60 * 60 * 1000, // 3 days
      refetchOnWindowFocus: false,
    },
  },
})

export function QueryProviders({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={typeof window !== 'undefined'}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={createPersistConfig({ queryClient })}
      >
        {children}
      </PersistQueryClientProvider>
    </WagmiProvider>
  )
}
