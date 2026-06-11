import React from 'react'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { gnosis } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SwarmConnectConfig } from '../types'

const queryClient = new QueryClient()

const defaultConfig = createConfig({
  chains: [gnosis],
  connectors: [injected()],
  transports: {
    [gnosis.id]: http(),
  },
})

interface SwarmConnectProviderProps {
  children: React.ReactNode
  config?: SwarmConnectConfig
}

export function SwarmConnectProvider({ children }: SwarmConnectProviderProps) {
  return (
    <WagmiProvider config={defaultConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
