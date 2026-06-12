export const GNOSIS_CHAIN_ID = 100
export const DEFAULT_BEE_API_URL = 'http://localhost:1633'
export const BEE_API_URL_STORAGE_KEY = 'swarm-connect:bee-api-url'

/** xBZZ (bridged BZZ) ERC-20 on Gnosis chain. */
export const BZZ_TOKEN_ADDRESS = '0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da' as const
/** BZZ uses 16 decimals (1 xBZZ = 1e16 PLUR), unlike the usual 18. */
export const BZZ_DECIMALS = 16

/** Suggested one-time top-up amounts for the Bee node's wallet. */
export const DEFAULT_FUND_XDAI = '0.1'
export const DEFAULT_FUND_XBZZ = '0.5'

/** Suggested values for buying a postage stamp (cost = 2^depth × amount PLUR). */
export const DEFAULT_STAMP_DEPTH = 20
export const DEFAULT_STAMP_AMOUNT = '1000000000'
