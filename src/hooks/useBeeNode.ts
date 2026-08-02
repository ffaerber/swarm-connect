import { useState, useCallback, useRef } from 'react'
import type { BeeNodeStatus } from '../types'
import { DEFAULT_BEE_API_URL } from '../constants'

const NEUTRAL: BeeNodeStatus = { isRunning: false, isChecking: false }

export function useBeeNode(beeApiUrl = DEFAULT_BEE_API_URL) {
  const [status, setStatus] = useState<BeeNodeStatus>(NEUTRAL)
  // Bumped whenever the current result becomes irrelevant (a newer probe, a
  // disconnect, a different node), so a slow response can't overwrite it.
  const run = useRef(0)

  // A different URL is a different node: drop the old status during render,
  // before the caller's effect fires a fresh check for the new node.
  const [lastUrl, setLastUrl] = useState(beeApiUrl)
  if (lastUrl !== beeApiUrl) {
    setLastUrl(beeApiUrl)
    setStatus(NEUTRAL)
    run.current++
  }

  const check = useCallback(async () => {
    const id = ++run.current
    const commit = (next: BeeNodeStatus) => { if (run.current === id) setStatus(next) }

    commit({ isRunning: false, isChecking: true })
    try {
      const res = await fetch(`${beeApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = (await res.json()) as { version?: string; status?: string }
        commit({ isRunning: true, isChecking: false, version: data.version })
      } else {
        commit({ isRunning: false, isChecking: false, error: `Node returned HTTP ${res.status}` })
      }
    } catch {
      // "Failed to fetch" is opaque: the node may be down, or up but blocking
      // this origin (CORS). A no-cors probe resolves (opaque response)
      // whenever the server is reachable, so it tells the two apart.
      const corsBlocked = await fetch(`${beeApiUrl}/health`, {
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      }).then(() => true, () => false)
      commit({
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
    run.current++
    setStatus(NEUTRAL)
  }, [])

  return { ...status, check, disconnect }
}
