import { useState, useCallback, useRef } from 'react'
import type { NodeWalletState } from '../types'
import { DEFAULT_BEE_API_URL, BZZ_DECIMALS } from '../constants'

interface WalletResponse {
  // Bee ≥ 1.6 field names, with fallbacks for older nodes.
  bzzBalance?: string
  nativeTokenBalance?: string
  bzz?: string
  xDai?: string
}

type WalletData = Omit<NodeWalletState, 'isFunded' | 'refresh'>

const NEUTRAL: WalletData = { isLoading: false }

/**
 * Reads the Bee node's OWN wallet (GET /wallet) and Ethereum address
 * (GET /addresses). This is the wallet that pays for postage stamps —
 * separate from the user's browser wallet.
 */
export function useNodeWallet(beeApiUrl = DEFAULT_BEE_API_URL): NodeWalletState {
  const [state, setState] = useState<WalletData>(NEUTRAL)
  const run = useRef(0)

  // A different URL is a different node with a different wallet. Clear the old
  // one during render so no step ever reads node A's address or balances while
  // node B is selected — funding the wrong address would send real money away.
  const [lastUrl, setLastUrl] = useState(beeApiUrl)
  if (lastUrl !== beeApiUrl) {
    setLastUrl(beeApiUrl)
    setState(NEUTRAL)
    run.current++
  }

  const refresh = useCallback(async () => {
    const id = ++run.current
    const commit = (next: WalletData | ((prev: WalletData) => WalletData)) => {
      if (run.current === id) setState(next)
    }

    // Keep the last known balances visible while re-reading (a refresh after a
    // top-up must not unmount the funding form mid-transaction).
    commit(prev => ({ ...prev, isLoading: true, error: undefined }))
    try {
      const [addrRes, walletRes] = await Promise.all([
        fetch(`${beeApiUrl}/addresses`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${beeApiUrl}/wallet`, { signal: AbortSignal.timeout(5000) }),
      ])
      if (!addrRes.ok || !walletRes.ok) {
        commit({
          isLoading: false,
          error: `Node returned HTTP ${addrRes.ok ? walletRes.status : addrRes.status}`,
        })
        return
      }
      const addresses = (await addrRes.json()) as { ethereum?: string }
      const wallet = (await walletRes.json()) as WalletResponse
      const bzzRaw = wallet.bzzBalance ?? wallet.bzz
      const xdaiRaw = wallet.nativeTokenBalance ?? wallet.xDai
      commit({
        address: addresses.ethereum,
        xdai: xdaiRaw !== undefined ? Number(xdaiRaw) / 1e18 : undefined,
        xbzz: bzzRaw !== undefined ? Number(bzzRaw) / 10 ** BZZ_DECIMALS : undefined,
        isLoading: false,
      })
    } catch {
      commit({
        isLoading: false,
        error: `Cannot read node wallet at ${beeApiUrl}`,
      })
    }
  }, [beeApiUrl])

  return {
    ...state,
    isFunded: (state.xdai ?? 0) > 0 && (state.xbzz ?? 0) > 0,
    refresh,
  }
}
