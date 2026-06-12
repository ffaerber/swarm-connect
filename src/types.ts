/**
 * Which requirements this dApp needs before the user counts as connected.
 * A disabled requirement drops its step from the modal and is ignored by
 * isFullyConnected. Wallet, Gnosis chain, and a running Bee node are always
 * required.
 */
export interface SwarmConnectRequirements {
  /** The user's wallet must hold xDAI for gas. Default: true. */
  xdai?: boolean
  /**
   * The Bee node's own wallet must be funded with xDAI + xBZZ (adds the
   * node-wallet top-up step) so the dApp can buy stamps, e.g. via
   * stamps.createStamp(). Default: false.
   */
  xbzz?: boolean
  /**
   * The user must select a postage stamp in the modal. Set false when the
   * dApp manages stamps itself. Default: true.
   */
  postageStamp?: boolean
}

export interface SwarmConnectConfig {
  beeApiUrl?: string
  /** Per-dApp requirements; omitted fields use the defaults above. */
  requirements?: SwarmConnectRequirements
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
  beeNode: BeeNodeStatus & { check: () => void; disconnect: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  /** The resolved requirements (config merged with defaults). */
  requirements: Required<SwarmConnectRequirements>
  nodeWallet: NodeWalletState
  isWalletConnected: boolean
  address?: string
  isOnGnosis: boolean
  chainId?: number
  balance: BalanceState
  isFullyConnected: boolean
}
