import { useAccount, useChainId } from 'wagmi'
import { useBeeNode } from './useBeeNode'
import { GNOSIS_CHAIN_ID } from '../constants'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

export function useSwarmConnect(config: SwarmConnectConfig = {}): SwarmConnectState & {
  checkBeeNode: () => void
} {
  const beeNode = useBeeNode(config.beeApiUrl)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  return {
    beeNode,
    isWalletConnected: isConnected,
    address,
    isOnGnosis,
    chainId,
    isFullyConnected: beeNode.isRunning && isConnected && isOnGnosis,
    checkBeeNode: beeNode.check,
  }
}
