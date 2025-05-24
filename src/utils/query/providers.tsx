import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { http } from 'wagmi'
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';


import { createPersistConfig } from './persist'
import { wagmiConfig } from './wagmi'
import { QueryClient } from '@tanstack/react-query'
import { mainnet, sepolia } from 'viem/chains';

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
const config = createConfig({
  chains: [mainnet, sepolia], // Pass your required chains as an array
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // For each of your required chains, add an entry to `transports` with
    // a key of the chain's `id` and a value of `http()`
  },
} as any);

export function QueryProviders({ children }: Props) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        embeddedWallets: { createOnLogin: 'all-users' },
        supportedChains: [mainnet, sepolia],
      }}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={createPersistConfig({ queryClient })}
      >
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </PersistQueryClientProvider>
    </PrivyProvider>
  )
}
