import { useState, useCallback } from 'react'
import type { CreateStampOptions, PostageStamp, PostageStampsState } from '../types'
import { DEFAULT_BEE_API_URL } from '../constants'

export function usePostageStamps(beeApiUrl = DEFAULT_BEE_API_URL): PostageStampsState {
  const [stamps, setStamps] = useState<PostageStamp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [selectedStampId, setSelectedStampId] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>()

  const fetchStamps = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      const res = await fetch(`${beeApiUrl}/stamps`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = (await res.json()) as { stamps: PostageStamp[] }
        setStamps(data.stamps ?? [])
      } else {
        setError(`HTTP ${res.status}`)
      }
    } catch {
      setError('Could not fetch postage stamps')
    } finally {
      setIsLoading(false)
    }
  }, [beeApiUrl])

  const createStamp = useCallback(async ({ amount, depth, label }: CreateStampOptions) => {
    setIsCreating(true)
    setCreateError(undefined)
    try {
      const qs = label ? `?label=${encodeURIComponent(label)}` : ''
      // Buying a batch sends an on-chain tx from the node's wallet and waits
      // for it to mine, so this call can take a couple of minutes.
      const res = await fetch(`${beeApiUrl}/stamps/${amount}/${depth}${qs}`, {
        method: 'POST',
        signal: AbortSignal.timeout(240_000),
      })
      if (!res.ok) {
        let message = `HTTP ${res.status}`
        try {
          const body = (await res.json()) as { message?: string }
          if (body.message) message = body.message
        } catch { /* non-JSON error body */ }
        setCreateError(message)
        return undefined
      }
      const data = (await res.json()) as { batchID: string }
      setSelectedStampId(data.batchID)
      void fetchStamps()
      return data.batchID
    } catch {
      setCreateError('Stamp purchase failed — is the node wallet funded with xDAI and xBZZ?')
      return undefined
    } finally {
      setIsCreating(false)
    }
  }, [beeApiUrl, fetchStamps])

  return {
    stamps, isLoading, error, fetchStamps,
    selectedStampId, selectStamp: setSelectedStampId,
    createStamp, isCreating, createError,
  }
}
