import { useState } from 'react'
import { useSwarmConnect } from '../hooks/useSwarmConnect'
import { SwarmConnectWizard } from './SwarmConnectWizard'
import { STYLES, DEFAULT_BEE_API_URL } from '../constants'
import type { SwarmConnectConfig } from '../types'

interface SwarmConnectButtonProps extends SwarmConnectConfig {
  label?: string
}

export function SwarmConnectButton({ beeApiUrl = DEFAULT_BEE_API_URL, label }: SwarmConnectButtonProps) {
  const [open, setOpen] = useState(false)
  const { beeNode, isWalletConnected, address, isOnGnosis, isFullyConnected, checkBeeNode } = useSwarmConnect({ beeApiUrl })

  function statusDot(ok: boolean, checking = false) {
    const color = checking ? STYLES.colors.warning : ok ? STYLES.colors.success : STYLES.colors.error
    return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
  }

  const buttonLabel = label ?? (isFullyConnected ? shortAddress(address) ?? 'Connected' : 'Connect to Swarm')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isFullyConnected ? STYLES.colors.successLight : STYLES.colors.primary,
          color: isFullyConnected ? STYLES.colors.success : '#fff',
          border: isFullyConnected ? `1px solid ${STYLES.colors.success}` : 'none',
          borderRadius: 8, padding: '10px 18px',
          cursor: 'pointer', fontSize: 15, fontWeight: 600,
          boxShadow: isFullyConnected ? 'none' : '0 2px 8px rgba(26,86,219,0.25)',
          transition: 'all 0.15s',
        }}
        onMouseOver={e => { if (!isFullyConnected) e.currentTarget.style.background = STYLES.colors.primaryHover }}
        onMouseOut={e => { if (!isFullyConnected) e.currentTarget.style.background = STYLES.colors.primary }}
      >
        {!isFullyConnected && (
          <span style={{ display: 'flex', gap: 4 }}>
            {statusDot(beeNode.isRunning, beeNode.isChecking)}
            {statusDot(isWalletConnected)}
            {statusDot(isOnGnosis)}
          </span>
        )}
        {buttonLabel}
      </button>

      {open && (
        <SwarmConnectWizard
          onClose={() => setOpen(false)}
          beeNodeStatus={beeNode}
          onCheckBeeNode={checkBeeNode}
          beeApiUrl={beeApiUrl}
        />
      )}
    </>
  )
}

function shortAddress(addr?: string) {
  if (!addr) return undefined
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
