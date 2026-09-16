import type { SwarmConnectRequirements } from './types'

export const GNOSIS_CHAIN_ID = 100
export const DEFAULT_BEE_API_URL = 'http://localhost:1633'
export const BEE_API_URL_STORAGE_KEY = 'swarm-connect:bee-api-url'
export const BEE_API_KEY_STORAGE_KEY = 'swarm-connect:bee-api-key'
/** Prefix for the last xBZZ amount approved per owner + spender. */
export const XBZZ_APPROVED_STORAGE_PREFIX = 'swarm-connect:xbzz-approved'

/** `/health` reports this as its version when the URL is a bee-manager. */
export const BEE_MANAGER_VERSION = 'bee-manager'

/**
 * Request headers for the node. A bare Bee node needs none; bee-manager wants
 * the key as `x-api-key`. Omitted when empty — a custom header forces a CORS
 * preflight, which a plain Bee node need not be configured for.
 */
export function beeHeaders(apiKey?: string): Record<string, string> | undefined {
  return apiKey ? { 'x-api-key': apiKey } : undefined
}

/** xBZZ (bridged BZZ) ERC-20 on Gnosis chain. */
export const BZZ_TOKEN_ADDRESS = '0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da' as const
/** BZZ uses 16 decimals (1 xBZZ = 1e16 PLUR), unlike the usual 18. */
export const BZZ_DECIMALS = 16
/** Allowances at or above this are infinite approvals (never spent down in practice). */
export const UNLIMITED_ALLOWANCE = 2n ** 255n
/** Default xbzzAllowance.minimum: 1 xBZZ, in PLUR. */
export const DEFAULT_XBZZ_ALLOWANCE_MINIMUM = 10n ** BigInt(BZZ_DECIMALS)

/** Suggested one-time top-up amounts for the Bee node's wallet. */
export const DEFAULT_FUND_XDAI = '0.1'
export const DEFAULT_FUND_XBZZ = '0.5'

/** Default per-dApp requirements; see SwarmConnectRequirements. */
export const DEFAULT_REQUIREMENTS: Required<SwarmConnectRequirements> = {
  xdai: true,
  xbzz: false,
  xbzzAllowance: false,
  nodeWallet: false,
  postageStamp: true,
}
