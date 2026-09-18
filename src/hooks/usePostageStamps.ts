import { useState, useCallback, useRef } from 'react'
import type { CreateStampOptions, PostageStamp, PostageStampsState } from '../types'
import { DEFAULT_BEE_API_URL, SELECTED_STAMP_STORAGE_PREFIX, beeHeaders } from '../constants'

/**
 * FNV-1a over the target, so the storage key identifies a node without
 * containing it. The API key is part of the target and must not be written
 * into a key that a casual look at localStorage shows in full; a hash also
 * keeps the key a fixed length whatever the URL.
 */
function fingerprint(target: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < target.length; i++) {
    h ^= target.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const storageKey = (target: string) => `${SELECTED_STAMP_STORAGE_PREFIX}:${fingerprint(target)}`

/** Both guarded: storage throws in private mode, and is absent during SSR. */
function readSelection(target: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(storageKey(target)) ?? undefined
  } catch {
    return undefined
  }
}

function writeSelection(target: string, batchId: string | undefined) {
  if (typeof window === 'undefined') return
  try {
    if (batchId) window.localStorage.setItem(storageKey(target), batchId)
    else window.localStorage.removeItem(storageKey(target))
  } catch {
    // ignore storage failures (private mode, disabled storage)
  }
}

export function usePostageStamps(beeApiUrl = DEFAULT_BEE_API_URL, apiKey?: string): PostageStampsState {
  const [stamps, setStamps] = useState<PostageStamp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>()
  // Bumped whenever a pending /stamps response stops being relevant.
  const run = useRef(0)

  // Stamps belong to one node: switching URLs must not leave the previous
  // node's list — or a selection the new node has never heard of, which would
  // otherwise keep isFullyConnected true against the wrong batch. On
  // bee-manager the key picks the batch, so a new key counts as a switch too.
  const target = `${beeApiUrl}\n${apiKey ?? ''}`
  // Restored from storage, so a reload keeps the batch the user picked rather
  // than silently falling back to whatever the dapp defaults to. Optimistic:
  // the node has not been asked yet, and fetchStamps() below drops it if the
  // node does not list it.
  const [selectedStampId, setSelected] = useState<string | undefined>(() => readSelection(target))
  const [lastTarget, setLastTarget] = useState(target)
  if (lastTarget !== target) {
    setLastTarget(target)
    setStamps([])
    // Not cleared — swapped for whatever was last chosen on the node being
    // switched TO. Switching away and back is a round trip, not an erasure.
    setSelected(readSelection(target))
    setError(undefined)
    setCreateError(undefined)
    setIsLoading(false)
    run.current++
  }

  /** Every write to the selection goes through here, so storage cannot drift. */
  const selectStamp = useCallback((batchId: string | undefined) => {
    setSelected(batchId)
    writeSelection(target, batchId)
  }, [target])

  const fetchStamps = useCallback(async () => {
    const id = ++run.current
    const fresh = () => run.current === id

    setIsLoading(true)
    setError(undefined)
    try {
      const res = await fetch(`${beeApiUrl}/stamps`, {
        headers: beeHeaders(apiKey),
        signal: AbortSignal.timeout(5000),
      })
      if (!fresh()) return
      if (res.ok) {
        const data = (await res.json()) as { stamps: PostageStamp[] }
        if (!fresh()) return
        const list = data.stamps ?? []
        setStamps(list)
        // Drop a selection the node no longer reports (expired, bought on a
        // different node, or restored from storage after the batch lapsed) so
        // it can't count as a satisfied requirement. Cleared from storage too:
        // a batch that no longer exists should not come back on next load.
        setSelected(prev => {
          const keep = prev && list.some(s => s.batchID === prev)
          if (prev && !keep) writeSelection(target, undefined)
          return keep ? prev : undefined
        })
      } else {
        setError(`HTTP ${res.status}`)
      }
    } catch {
      if (fresh()) setError('Could not fetch postage stamps')
    } finally {
      if (fresh()) setIsLoading(false)
    }
  }, [beeApiUrl, apiKey, target])

  const createStamp = useCallback(async ({ amount, depth, label }: CreateStampOptions) => {
    setIsCreating(true)
    setCreateError(undefined)
    try {
      const qs = label ? `?label=${encodeURIComponent(label)}` : ''
      // Buying a batch sends an on-chain tx from the node's wallet and waits
      // for it to mine, so this call can take a couple of minutes.
      const res = await fetch(`${beeApiUrl}/stamps/${amount}/${depth}${qs}`, {
        method: 'POST',
        headers: beeHeaders(apiKey),
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
      selectStamp(data.batchID)
      return data.batchID
    } catch {
      setCreateError('Stamp purchase failed — is the node wallet funded with xDAI and xBZZ?')
      return undefined
    } finally {
      setIsCreating(false)
    }
  }, [beeApiUrl, apiKey, fetchStamps, selectStamp])

  return {
    stamps, isLoading, error, fetchStamps,
    selectedStampId, selectStamp,
    createStamp, isCreating, createError,
  }
}
