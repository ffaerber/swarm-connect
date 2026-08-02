import React, { createContext, useContext } from 'react'
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

const SwarmConnectConfigContext = createContext<SwarmConnectConfig | undefined>(undefined)

/**
 * App-wide config from the nearest {@link SwarmConnectProvider}, or undefined
 * when there is none. `useSwarmConnect` falls back to it for any field the
 * caller left out.
 */
export function useSwarmConnectConfig(): SwarmConnectConfig | undefined {
  return useContext(SwarmConnectConfigContext)
}

interface SwarmConnectProviderProps {
  children: React.ReactNode
  config?: SwarmConnectConfig
}

export function SwarmConnectProvider({ children, config }: SwarmConnectProviderProps) {
  return (
    <WagmiProvider config={defaultConfig}>
      <QueryClientProvider client={queryClient}>
        <SwarmConnectConfigContext.Provider value={config}>
          {children}
        </SwarmConnectConfigContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
