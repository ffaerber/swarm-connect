import { useState, useCallback } from 'react'
import type { BeeNodeStatus } from '../types'
import { DEFAULT_BEE_API_URL } from '../constants'

export function useBeeNode(beeApiUrl = DEFAULT_BEE_API_URL) {
  const [status, setStatus] = useState<BeeNodeStatus>({
    isRunning: false,
    isChecking: false,
  })

  const check = useCallback(async () => {
    setStatus({ isRunning: false, isChecking: true })
    try {
      const res = await fetch(`${beeApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = (await res.json()) as { version?: string; status?: string }
        setStatus({ isRunning: true, isChecking: false, version: data.version })
      } else {
        setStatus({ isRunning: false, isChecking: false, error: `Node returned HTTP ${res.status}` })
      }
    } catch {
      setStatus({
        isRunning: false,
        isChecking: false,
        error: `Cannot reach Bee node at ${beeApiUrl}`,
      })
    }
  }, [beeApiUrl])

  return { ...status, check }
}
