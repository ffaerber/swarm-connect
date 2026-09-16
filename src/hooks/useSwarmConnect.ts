import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { useBeeNode } from './useBeeNode'
import { usePostageStamps } from './usePostageStamps'
import { useNodeWallet } from './useNodeWallet'
import { useSwarmConnectConfig } from '../context/SwarmConnectProvider'
import {
  GNOSIS_CHAIN_ID, DEFAULT_BEE_API_URL, BEE_API_URL_STORAGE_KEY, BEE_API_KEY_STORAGE_KEY,
  DEFAULT_REQUIREMENTS, BZZ_TOKEN_ADDRESS, BZZ_DECIMALS,
} from '../constants'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

function readStored(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

/** Persist, or remove when empty (so a cleared API key doesn't linger). */
function writeStored(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // ignore storage failures (e.g. private mode / disabled storage)
  }
}

export function useSwarmConnect(config: SwarmConnectConfig = {}): SwarmConnectState {
  // Anything the caller left out falls back to the provider's config, then to
  // what the user last chose, then to the built-in default.
  const providerConfig = useSwarmConnectConfig()
  const [beeApiUrl, setBeeApiUrl] = useState(
    () => config.beeApiUrl ?? providerConfig?.beeApiUrl ?? readStored(BEE_API_URL_STORAGE_KEY) ?? DEFAULT_BEE_API_URL
  )
  const [beeApiKey, setBeeApiKey] = useState(
    () => config.beeApiKey ?? providerConfig?.beeApiKey ?? readStored(BEE_API_KEY_STORAGE_KEY) ?? ''
  )

  useEffect(() => { writeStored(BEE_API_URL_STORAGE_KEY, beeApiUrl) }, [beeApiUrl])
  useEffect(() => { writeStored(BEE_API_KEY_STORAGE_KEY, beeApiKey) }, [beeApiKey])

  const requirements = { ...DEFAULT_REQUIREMENTS, ...providerConfig?.requirements, ...config.requirements }
  const beeNode = useBeeNode(beeApiUrl, beeApiKey)
  const stamps = usePostageStamps(beeApiUrl, beeApiKey)
  const nodeWallet = useNodeWallet(beeApiUrl, beeApiKey)
  // useAccount().chainId is the wallet's actual chain (undefined when
  // disconnected) — unlike useChainId(), which reports the config's default
  // chain even with no wallet, falsely "passing" the network step.
  const { address, isConnected, chainId } = useAccount()

  const isOnGnosis = isConnected && chainId === GNOSIS_CHAIN_ID

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected },
  })
  const xdai = balanceData ? Number(balanceData.formatted) : undefined
  const hasGas = isOnGnosis && !!balanceData && balanceData.value > 0n

  const { data: bzzData, isLoading: bzzLoading } = useReadContract({
    abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected && requirements.xbzz },
  })
  const bzz = bzzData !== undefined ? Number(bzzData) / 10 ** BZZ_DECIMALS : undefined
  const hasBzz = isOnGnosis && (bzz ?? 0) > 0

  const balance = {
    xdai, bzz,
    isLoading: isConnected && (balanceLoading || (requirements.xbzz && bzzLoading)),
    hasGas, hasBzz,
  }

  return {
    beeNode,
    stamps,
    beeApiUrl,
    setBeeApiUrl,
    beeApiKey,
    setBeeApiKey,
    requirements,
    nodeWallet,
    isWalletConnected: isConnected,
    address,
    isOnGnosis,
    chainId,
    balance,
    isFullyConnected:
      isConnected && isOnGnosis && beeNode.isRunning &&
      (!requirements.xdai || hasGas) &&
      (!requirements.xbzz || hasBzz) &&
      (!requirements.nodeWallet || nodeWallet.isFunded) &&
      (!requirements.postageStamp || !!stamps.selectedStampId),
  }
}
