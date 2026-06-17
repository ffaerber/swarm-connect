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
      // "Failed to fetch" is opaque: the node may be down, or up but blocking
      // this origin (CORS). A no-cors probe resolves (opaque response)
      // whenever the server is reachable, so it tells the two apart.
      const corsBlocked = await fetch(`${beeApiUrl}/health`, {
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      }).then(() => true, () => false)
      setStatus({
        isRunning: false,
        isChecking: false,
        isCorsBlocked: corsBlocked,
        error: corsBlocked
          ? `Node at ${beeApiUrl} is reachable but rejects requests from this origin (CORS)`
          : `Cannot reach Bee node at ${beeApiUrl}`,
      })
    }
  }, [beeApiUrl])

  /** Forget the node — back to a neutral "not connected" state (no error). */
  const disconnect = useCallback(() => {
    setStatus({ isRunning: false, isChecking: false })
  }, [])

  return { ...status, check, disconnect }
}
