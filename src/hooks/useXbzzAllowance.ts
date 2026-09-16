import { useEffect, useRef, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi, maxUint256 } from 'viem'
import type { BaseError } from 'viem'
import {
  GNOSIS_CHAIN_ID, BZZ_TOKEN_ADDRESS, UNLIMITED_ALLOWANCE, XBZZ_APPROVED_STORAGE_PREFIX, DEFAULT_XBZZ_ALLOWANCE_MINIMUM,
} from '../constants'
import type { XbzzAllowanceRequirement, XbzzAllowanceState } from '../types'

// The chain only knows what is left, not what was approved — so remember the
// amount this browser approved, to show "left of approved".
function readApproved(key: string | undefined): bigint | undefined {
  if (!key || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? BigInt(raw) : undefined
  } catch {
    return undefined
  }
}

function writeApproved(key: string, amount: bigint) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, amount.toString())
  } catch {
    // ignore storage failures (e.g. private mode / disabled storage)
  }
}

/**
 * The connected wallet's xBZZ allowance for a spender, plus approve(). Pass
 * `false` when the requirement is off — nothing is read then.
 */
export function useXbzzAllowance(requirement: XbzzAllowanceRequirement | false): XbzzAllowanceState {
  const { address, isConnected, chainId } = useAccount()
  const isOnGnosis = isConnected && chainId === GNOSIS_CHAIN_ID
  const spender = requirement ? requirement.spender : undefined
  const minimum = (requirement ? requirement.minimum : undefined) ?? DEFAULT_XBZZ_ALLOWANCE_MINIMUM

  const read = useReadContract({
    abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected && !!spender },
  })

  const storageKey = address && spender
    ? `${XBZZ_APPROVED_STORAGE_PREFIX}:${address.toLowerCase()}:${spender.toLowerCase()}`
    : undefined
  const [stored, setStored] = useState(() => readApproved(storageKey))
  useEffect(() => { setStored(readApproved(storageKey)) }, [storageKey])

  const tx = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: tx.data, chainId: GNOSIS_CHAIN_ID })
  const pending = useRef<{ key: string; amount: bigint }>()

  // Remember the amount and re-read once the approval lands.
  useEffect(() => {
    if (!receipt.isSuccess) return
    if (pending.current) {
      writeApproved(pending.current.key, pending.current.amount)
      if (pending.current.key === storageKey) setStored(pending.current.amount)
    }
    read.refetch()
  }, [receipt.isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = spender ? read.data : undefined
  const isApproved = isOnGnosis && value !== undefined && value > 0n && value >= minimum
  // A stored amount below what is left means it was approved elsewhere since.
  const approved = value === undefined ? undefined
    : value >= UNLIMITED_ALLOWANCE ? value
    : stored !== undefined && stored >= value ? stored
    : undefined

  const approve = (amount?: bigint) => {
    if (!spender || !storageKey) return
    const next = amount ?? (minimum > 0n ? minimum : maxUint256)
    pending.current = { key: storageKey, amount: next }
    tx.writeContract({
      abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'approve',
      args: [spender, next], chainId: GNOSIS_CHAIN_ID,
    })
  }

  // A reverted approval surfaces as a receipt error, not a write error.
  const error = tx.error ?? receipt.error
  return {
    value,
    approved,
    minimum,
    isLoading: isConnected && !!spender && read.isLoading,
    isApproved,
    approve,
    isApproving: tx.isPending || (!!tx.data && receipt.isLoading),
    error: error ? (error as BaseError).shortMessage ?? error.message : undefined,
  }
}
