/**
 * 'select' — the dApp only uses postage stamps the user already owns.
 * 'create' — the dApp can buy stamps too, which needs the Bee node's own
 * wallet funded with xDAI + xBZZ (a one-time setup step shown in the modal).
 */
export type StampMode = 'select' | 'create'

export interface SwarmConnectConfig {
  beeApiUrl?: string
  /** Defaults to 'select' so no on-chain spending is required to connect. */
  stampMode?: StampMode
}

export interface BeeNodeStatus {
  isRunning: boolean
  isChecking: boolean
  version?: string
  error?: string
}

export interface PostageStamp {
  batchID: string
  utilization: number
  usable: boolean
  label?: string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  exists: boolean
  batchTTL: number
}

export interface CreateStampOptions {
  /** PLUR per chunk; TTL grows with amount. */
  amount: string
  /** Batch depth (capacity = 2^depth chunks); bee requires ≥ 17. */
  depth: number
  label?: string
}

export interface PostageStampsState {
  stamps: PostageStamp[]
  isLoading: boolean
  error?: string
  fetchStamps: () => void
  selectedStampId?: string
  selectStamp: (id: string) => void
  /** Buys a stamp via the node (POST /stamps); resolves to the new batch ID. */
  createStamp: (options: CreateStampOptions) => Promise<string | undefined>
  isCreating: boolean
  createError?: string
}

export interface BalanceState {
  /** Native xDAI balance on Gnosis, in ether units (undefined until loaded). */
  xdai?: number
  isLoading: boolean
  /** True when connected, on Gnosis, and the xDAI balance is greater than zero. */
  hasGas: boolean
}

export interface NodeWalletState {
  /** The Bee node's own Ethereum address (from /addresses). */
  address?: string
  /** Node wallet xDAI balance, in ether units (undefined until loaded). */
  xdai?: number
  /** Node wallet xBZZ balance, in token units (undefined until loaded). */
  xbzz?: number
  isLoading: boolean
  error?: string
  /** True once the node wallet holds both xDAI and xBZZ — it can buy stamps. */
  isFunded: boolean
  refresh: () => void
}

export interface SwarmConnectState {
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  stampMode: StampMode
  nodeWallet: NodeWalletState
  isWalletConnected: boolean
  address?: string
  isOnGnosis: boolean
  chainId?: number
  balance: BalanceState
  isFullyConnected: boolean
}
