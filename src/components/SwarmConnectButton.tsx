import { useState } from 'react'
import { useSwarmConnect } from '../hooks/useSwarmConnect'
import { SwarmConnectModal } from './SwarmConnectModal'
import { STYLES, DEFAULT_BEE_API_URL } from '../constants'
import type { SwarmConnectConfig } from '../types'

interface SwarmConnectButtonProps extends SwarmConnectConfig {
  label?: string
}

export function SwarmConnectButton({ beeApiUrl = DEFAULT_BEE_API_URL, label }: SwarmConnectButtonProps) {
  const [open, setOpen] = useState(false)
  const {
    beeNode, stamps, beeApiUrl: currentBeeApiUrl, setBeeApiUrl,
    isWalletConnected, address, isOnGnosis, isFullyConnected,
  } = useSwarmConnect({ beeApiUrl })

  const displayLabel = label
    ?? (isFullyConnected
      ? (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected')
      : 'Connect to Swarm')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isFullyConnected ? STYLES.colors.successLight : STYLES.colors.primary,
          color: isFullyConnected ? STYLES.colors.success : '#fff',
          border: isFullyConnected ? `1.5px solid ${STYLES.colors.success}` : 'none',
          borderRadius: 8, padding: '10px 18px',
          cursor: 'pointer', fontSize: 15, fontWeight: 600,
          boxShadow: isFullyConnected ? 'none' : '0 2px 8px rgba(26,86,219,0.25)',
          transition: 'all 0.15s',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
        onMouseOver={e => { if (!isFullyConnected) e.currentTarget.style.background = STYLES.colors.primaryHover }}
        onMouseOut={e => { e.currentTarget.style.background = isFullyConnected ? STYLES.colors.successLight : STYLES.colors.primary }}
      >
        {!isFullyConnected && (
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <StatusDot ok={beeNode.isRunning} checking={beeNode.isChecking} />
            <StatusDot ok={!!stamps.selectedStampId} />
            <StatusDot ok={isWalletConnected} />
            <StatusDot ok={isOnGnosis} />
          </span>
        )}
        {displayLabel}
      </button>

      {open && (
        <SwarmConnectModal
          onClose={() => setOpen(false)}
          beeNode={beeNode}
          stamps={stamps}
          beeApiUrl={currentBeeApiUrl}
          setBeeApiUrl={setBeeApiUrl}
        />
      )}
    </>
  )
}

function StatusDot({ ok, checking }: { ok: boolean; checking?: boolean }) {
  const color = checking
    ? STYLES.colors.warning
    : ok ? STYLES.colors.success : STYLES.colors.error
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7,
      borderRadius: '50%', background: color,
    }} />
  )
}
