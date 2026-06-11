export interface SwarmConnectConfig {
  beeApiUrl?: string
  walletConnectProjectId?: string
}

export interface BeeNodeStatus {
  isRunning: boolean
  isChecking: boolean
  version?: string
  error?: string
}

export type WizardStep = 'bee' | 'wallet' | 'network' | 'done'

export interface SwarmConnectState {
  beeNode: BeeNodeStatus
  isWalletConnected: boolean
  address?: string
  isOnGnosis: boolean
  chainId?: number
  isFullyConnected: boolean
}
