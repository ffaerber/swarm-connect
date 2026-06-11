import { useAccount, useChainId } from 'wagmi'
import { useBeeNode } from './useBeeNode'
import { usePostageStamps } from './usePostageStamps'
import { GNOSIS_CHAIN_ID } from '../constants'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

export function useSwarmConnect(config: SwarmConnectConfig = {}): SwarmConnectState {
  const beeNode = useBeeNode(config.beeApiUrl)
  const stamps = usePostageStamps(config.beeApiUrl)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  return {
    beeNode,
    stamps,
    isWalletConnected: isConnected,
    address,
    isOnGnosis,
    chainId,
    isFullyConnected: beeNode.isRunning && !!stamps.selectedStampId && isConnected && isOnGnosis,
  }
}
