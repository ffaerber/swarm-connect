import { useState, useCallback, useRef } from 'react'
import type { CreateStampOptions, PostageStamp, PostageStampsState } from '../types'
import { DEFAULT_BEE_API_URL } from '../constants'

export function usePostageStamps(beeApiUrl = DEFAULT_BEE_API_URL): PostageStampsState {
  const [stamps, setStamps] = useState<PostageStamp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [selectedStampId, setSelectedStampId] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>()
  // Bumped whenever a pending /stamps response stops being relevant.
  const run = useRef(0)

  // Stamps belong to one node: switching URLs must not leave the previous
  // node's list — or a selection the new node has never heard of, which would
  // otherwise keep isFullyConnected true against the wrong batch.
  const [lastUrl, setLastUrl] = useState(beeApiUrl)
  if (lastUrl !== beeApiUrl) {
    setLastUrl(beeApiUrl)
    setStamps([])
    setSelectedStampId(undefined)
    setError(undefined)
    setCreateError(undefined)
    setIsLoading(false)
    run.current++
  }

  const fetchStamps = useCallback(async () => {
    const id = ++run.current
    const fresh = () => run.current === id

    setIsLoading(true)
    setError(undefined)
    try {
      const res = await fetch(`${beeApiUrl}/stamps`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!fresh()) return
      if (res.ok) {
        const data = (await res.json()) as { stamps: PostageStamp[] }
        if (!fresh()) return
        const list = data.stamps ?? []
        setStamps(list)
        // Drop a selection the node no longer reports (expired, or bought on
        // a different node) so it can't count as a satisfied requirement.
        setSelectedStampId(prev =>
          prev && list.some(s => s.batchID === prev) ? prev : undefined)
      } else {
        setError(`HTTP ${res.status}`)
      }
    } catch {
      if (fresh()) setError('Could not fetch postage stamps')
    } finally {
      if (fresh()) setIsLoading(false)
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
      // Reload first: fetchStamps prunes unknown selections, so selecting the
      // new batch afterwards survives even if the node hasn't listed it yet.
      await fetchStamps()
      setSelectedStampId(data.batchID)
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
