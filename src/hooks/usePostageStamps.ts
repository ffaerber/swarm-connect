import { useState, useCallback } from 'react'
import type { PostageStamp, PostageStampsState } from '../types'
import { DEFAULT_BEE_API_URL } from '../constants'

export function usePostageStamps(beeApiUrl = DEFAULT_BEE_API_URL): PostageStampsState {
  const [stamps, setStamps] = useState<PostageStamp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [selectedStampId, setSelectedStampId] = useState<string | undefined>()

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

  return { stamps, isLoading, error, fetchStamps, selectedStampId, selectStamp: setSelectedStampId }
}
