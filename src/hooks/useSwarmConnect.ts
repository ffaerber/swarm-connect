import { useState, useEffect } from 'react'
import { useAccount, useChainId, useBalance } from 'wagmi'
import { useBeeNode } from './useBeeNode'
import { usePostageStamps } from './usePostageStamps'
import { useNodeWallet } from './useNodeWallet'
import { GNOSIS_CHAIN_ID, DEFAULT_BEE_API_URL, BEE_API_URL_STORAGE_KEY } from '../constants'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

function readStoredBeeApiUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(BEE_API_URL_STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function useSwarmConnect(config: SwarmConnectConfig = {}): SwarmConnectState {
  const [beeApiUrl, setBeeApiUrl] = useState(
    () => config.beeApiUrl ?? readStoredBeeApiUrl() ?? DEFAULT_BEE_API_URL
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(BEE_API_URL_STORAGE_KEY, beeApiUrl)
    } catch {
      // ignore storage failures (e.g. private mode / disabled storage)
    }
  }, [beeApiUrl])

  const stampMode = config.stampMode ?? 'select'
  const beeNode = useBeeNode(beeApiUrl)
  const stamps = usePostageStamps(beeApiUrl)
  const nodeWallet = useNodeWallet(beeApiUrl)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected },
  })
  const xdai = balanceData ? Number(balanceData.formatted) : undefined
  const hasGas = isOnGnosis && !!balanceData && balanceData.value > 0n
  const balance = { xdai, isLoading: isConnected && balanceLoading, hasGas }

  return {
    beeNode,
    stamps,
    beeApiUrl,
    setBeeApiUrl,
    stampMode,
    nodeWallet,
    isWalletConnected: isConnected,
    address,
    isOnGnosis,
    chainId,
    balance,
    isFullyConnected:
      isConnected && isOnGnosis && hasGas && beeNode.isRunning &&
      (stampMode === 'select' || nodeWallet.isFunded) &&
      !!stamps.selectedStampId,
  }
}
