export interface SwarmConnectConfig {
  beeApiUrl?: string
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

export interface PostageStampsState {
  stamps: PostageStamp[]
  isLoading: boolean
  error?: string
  fetchStamps: () => void
  selectedStampId?: string
  selectStamp: (id: string) => void
}

export interface SwarmConnectState {
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  isWalletConnected: boolean
  address?: string
  isOnGnosis: boolean
  chainId?: number
  isFullyConnected: boolean
}
