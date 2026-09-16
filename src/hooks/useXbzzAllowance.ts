import { useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi, maxUint256 } from 'viem'
import type { BaseError } from 'viem'
import { GNOSIS_CHAIN_ID, BZZ_TOKEN_ADDRESS } from '../constants'
import type { XbzzAllowanceRequirement, XbzzAllowanceState } from '../types'

/**
 * The connected wallet's xBZZ allowance for a spender, plus approve(). Pass
 * `false` when the requirement is off — nothing is read then.
 */
export function useXbzzAllowance(requirement: XbzzAllowanceRequirement | false): XbzzAllowanceState {
  const { address, isConnected, chainId } = useAccount()
  const isOnGnosis = isConnected && chainId === GNOSIS_CHAIN_ID
  const spender = requirement ? requirement.spender : undefined
  const minimum = requirement ? requirement.minimum : undefined

  const read = useReadContract({
    abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected && !!spender },
  })

  const tx = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: tx.data, chainId: GNOSIS_CHAIN_ID })

  // Re-read once the approval lands.
  useEffect(() => { if (receipt.isSuccess) read.refetch() }, [receipt.isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = spender ? read.data : undefined
  const isApproved = isOnGnosis && value !== undefined && (minimum !== undefined ? value >= minimum : value > 0n)

  const approve = () => {
    if (!spender) return
    tx.writeContract({
      abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'approve',
      args: [spender, minimum ?? maxUint256], chainId: GNOSIS_CHAIN_ID,
    })
  }

  // A reverted approval surfaces as a receipt error, not a write error.
  const error = tx.error ?? receipt.error
  return {
    value,
    isLoading: isConnected && !!spender && read.isLoading,
    isApproved,
    approve,
    isApproving: tx.isPending || (!!tx.data && receipt.isLoading),
    error: error ? (error as BaseError).shortMessage ?? error.message : undefined,
  }
}
