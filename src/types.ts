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
   * The user's wallet must hold xBZZ — e.g. a platform token the dApp uses.
   * This is about the *connected wallet's* balance, NOT about buying postage
   * stamps (see `nodeWallet` for that). Default: false.
   */
  xbzz?: boolean
  /**
   * The user's wallet must have approved `spender` to spend its xBZZ (ERC-20
   * allowance) — for dApps whose contract pulls xBZZ from the user, where
   * holding it is not enough and every write reverts without an approval.
   * Adds an approve step after the balance step. Default: false.
   */
  xbzzAllowance?: XbzzAllowanceRequirement | false
  /**
   * The Bee node's own wallet must be funded with xDAI + xBZZ (adds the
   * node-wallet top-up step) so the dApp can buy stamps, e.g. via
   * stamps.createStamp(). Default: false.
   */
  nodeWallet?: boolean
  /**
   * The user must select a postage stamp in the modal. Set false when the
   * dApp manages stamps itself. Default: true.
   */
  postageStamp?: boolean
}

export interface XbzzAllowanceRequirement {
  /** The contract that spends the user's xBZZ (only the dApp knows it). */
  spender: `0x${string}`
  /**
   * Allowance in PLUR (1 xBZZ = 1e16) that counts as approved, and the amount
   * approve() asks for — a bounded approval for users who dislike infinite
   * ones. Default: any non-zero allowance counts; approve() asks for maxUint256.
   */
  minimum?: bigint
}

export interface SwarmConnectConfig {
  beeApiUrl?: string
  /**
   * API key sent as `x-api-key` on every node request — needed when the URL
   * points at a bee-manager instead of a bare Bee node. Initial value only;
   * the user can change it in the modal.
   */
  beeApiKey?: string
  /** Per-dApp requirements; omitted fields use the defaults above. */
  requirements?: SwarmConnectRequirements
}

export interface BeeNodeStatus {
  isRunning: boolean
  isChecking: boolean
  version?: string
  error?: string
  /** True when the node is reachable but its CORS config rejects this origin. */
  isCorsBlocked?: boolean
  /** True when the URL is a bee-manager (Bee-compatible façade) rather than a Bee node. */
  isBeeManager?: boolean
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
  /** xBZZ (BZZ ERC-20) balance of the connected wallet (undefined until loaded). */
  bzz?: number
  isLoading: boolean
  /** True when connected, on Gnosis, and the xDAI balance is greater than zero. */
  hasGas: boolean
  /** True when the connected wallet holds any xBZZ. */
  hasBzz: boolean
}

export interface XbzzAllowanceState {
  /** Current allowance in PLUR (undefined until loaded, or when not required). */
  value?: bigint
  isLoading: boolean
  /** True when on Gnosis and the allowance meets the requirement's minimum (any non-zero by default). */
  isApproved: boolean
  /** Sends approve(spender, minimum ?? maxUint256) from the connected wallet. */
  approve: () => void
  /** True while the approval is being signed or mined. */
  isApproving: boolean
  error?: string
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
  /** API key sent as `x-api-key`; empty string when none. */
  beeApiKey: string
  setBeeApiKey: (key: string) => void
  /** The resolved requirements (config merged with defaults). */
  requirements: Required<SwarmConnectRequirements>
  nodeWallet: NodeWalletState
  isWalletConnected: boolean
  address?: string
  isOnGnosis: boolean
  chainId?: number
  balance: BalanceState
  /** The connected wallet's xBZZ allowance for `requirements.xbzzAllowance.spender`. */
  allowance: XbzzAllowanceState
  isFullyConnected: boolean
}
