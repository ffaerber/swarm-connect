import { useCallback, useMemo } from 'react'
import { beeHeaders, DEFAULT_GATEWAY_URL } from '../constants'
import type { SwarmReadState } from '../types'

const trimSlash = (url: string) => url.replace(/\/+$/, '')

function withHeaders(init: RequestInit | undefined, extra: Record<string, string> | undefined): RequestInit | undefined {
  if (!extra) return init
  const headers = new Headers(init?.headers)
  for (const [k, v] of Object.entries(extra)) if (!headers.has(k)) headers.set(k, v)
  return { ...init, headers }
}

/**
 * Where to read Swarm content from.
 *
 * Reads go through the user's own node once it is running — their bandwidth,
 * their cache, no dependence on a public gateway — and through the gateway
 * otherwise, so a visitor who never connects still sees everything. Writes are
 * not covered here: they always need the node, which stamps them.
 *
 * `fetch` falls back to the gateway when the node does not answer (network
 * error) or answers 5xx, since a node that just went away should not blank the
 * page. A 404 is passed through: it is the node's verdict that the content
 * cannot be retrieved, and asking a second source would only delay it.
 */
export function useSwarmRead(
  beeApiUrl: string,
  beeApiKey: string,
  isNodeRunning: boolean,
  gatewayUrl: string = DEFAULT_GATEWAY_URL,
): SwarmReadState {
  const gateway = trimSlash(gatewayUrl)
  const node = trimSlash(beeApiUrl)
  const isNode = isNodeRunning || !gateway
  const url = isNode ? node : gateway
  const headers = useMemo(() => (isNode ? beeHeaders(beeApiKey) : undefined), [isNode, beeApiKey])

  const read = useCallback(async (path: string, init?: RequestInit): Promise<Response> => {
    const rel = path.startsWith('/') ? path : `/${path}`
    if (!isNode) return fetch(`${gateway}${rel}`, init)

    const fallback = () => fetch(`${gateway}${rel}`, init)
    let res: Response
    try {
      res = await fetch(`${node}${rel}`, withHeaders(init, headers))
    } catch (e) {
      // An abort is the caller's decision, not the node failing.
      if (!gateway || init?.signal?.aborted) throw e
      return fallback()
    }
    if (res.status >= 500 && gateway && !init?.signal?.aborted) return fallback()
    return res
  }, [isNode, node, gateway, headers])

  // Stable while nothing changes, so callers can list `read` as an effect
  // dependency without refetching on every render.
  return useMemo(
    () => ({ url, headers, isNode, gatewayUrl: gateway, fetch: read }),
    [url, headers, isNode, gateway, read],
  )
}
