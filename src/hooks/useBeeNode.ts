import { useState, useCallback, useRef } from 'react'
import type { BeeNodeStatus } from '../types'
import { DEFAULT_BEE_API_URL, BEE_MANAGER_VERSION, beeHeaders } from '../constants'

const NEUTRAL: BeeNodeStatus = { isRunning: false, isChecking: false }

export function useBeeNode(beeApiUrl = DEFAULT_BEE_API_URL, apiKey?: string) {
  const [status, setStatus] = useState<BeeNodeStatus>(NEUTRAL)
  // Bumped whenever the current result becomes irrelevant (a newer probe, a
  // disconnect, a different node), so a slow response can't overwrite it.
  const run = useRef(0)

  // A different URL is a different node (and on bee-manager a different key is
  // a different app): drop the old status during render, before the caller's
  // effect fires a fresh check.
  const target = `${beeApiUrl}\n${apiKey ?? ''}`
  const [lastTarget, setLastTarget] = useState(target)
  if (lastTarget !== target) {
    setLastTarget(target)
    setStatus(NEUTRAL)
    run.current++
  }

  const check = useCallback(async () => {
    const id = ++run.current
    const commit = (next: BeeNodeStatus) => { if (run.current === id) setStatus(next) }

    commit({ isRunning: false, isChecking: true })
    let version: string | undefined
    try {
      const res = await fetch(`${beeApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) {
        commit({ isRunning: false, isChecking: false, error: `Node returned HTTP ${res.status}` })
        return
      }
      const data = (await res.json()) as { version?: string; status?: string }
      version = data.version
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
      return
    }

    const isBeeManager = version === BEE_MANAGER_VERSION
    if (!apiKey) {
      // bee-manager answers /health for anyone but 401s everything else, so
      // without a key it is not usable — don't report it as online.
      commit(isBeeManager
        ? { isRunning: false, isChecking: false, isBeeManager, version, error: 'bee-manager requires an API key' }
        : { isRunning: true, isChecking: false, isBeeManager, version })
      return
    }

    // /health is unauthenticated, so it says nothing about the key. /stamps
    // is the cheapest call that requires it, on bee-manager and Bee alike.
    try {
      const res = await fetch(`${beeApiUrl}/stamps`, {
        headers: beeHeaders(apiKey),
        signal: AbortSignal.timeout(5000),
      })
      if (res.status === 401 || res.status === 403) {
        commit({ isRunning: false, isChecking: false, isBeeManager, version, error: 'API key rejected' })
        return
      }
      commit({ isRunning: true, isChecking: false, isBeeManager, version })
    } catch {
      // /health passed, so the server is up: a failure here is the preflight
      // for the x-api-key header being refused.
      commit({
        isRunning: false, isChecking: false, isBeeManager, version, isCorsBlocked: true,
        error: `${beeApiUrl} rejects the x-api-key header from this origin (CORS)`,
      })
    }
  }, [beeApiUrl, apiKey])

  /** Forget the node — back to a neutral "not connected" state (no error). */
  const disconnect = useCallback(() => {
    run.current++
    setStatus(NEUTRAL)
  }, [])

  return { ...status, check, disconnect }
}
