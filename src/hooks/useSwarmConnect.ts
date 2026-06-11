import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useBeeNode } from './useBeeNode'
import { usePostageStamps } from './usePostageStamps'
import { GNOSIS_CHAIN_ID, DEFAULT_BEE_API_URL } from '../constants'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

export function useSwarmConnect(config: SwarmConnectConfig = {}): SwarmConnectState {
  const [beeApiUrl, setBeeApiUrl] = useState(config.beeApiUrl ?? DEFAULT_BEE_API_URL)
  const beeNode = useBeeNode(beeApiUrl)
  const stamps = usePostageStamps(beeApiUrl)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  return {
    beeNode,
    stamps,
    beeApiUrl,
    setBeeApiUrl,
    isWalletConnected: isConnected,
    address,
    isOnGnosis,
    chainId,
    isFullyConnected: beeNode.isRunning && !!stamps.selectedStampId && isConnected && isOnGnosis,
  }
}
