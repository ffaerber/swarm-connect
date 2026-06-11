import React, { useEffect } from 'react'
import { STYLES } from '../../constants'
import type { BeeNodeStatus } from '../../types'

interface BeeNodeStepProps {
  status: BeeNodeStatus
  onCheck: () => void
  beeApiUrl: string
}

export function BeeNodeStep({ status, onCheck, beeApiUrl }: BeeNodeStepProps) {
  useEffect(() => {
    onCheck()
  }, []) // run once on mount

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🐝</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, color: STYLES.colors.text }}>
        Bee Node
      </h3>
      <p style={{ margin: '0 0 24px', color: STYLES.colors.muted, fontSize: 14 }}>
        Checking for a running Bee node at <code style={{ fontSize: 12 }}>{beeApiUrl}</code>
      </p>

      {status.isChecking && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: STYLES.colors.muted }}>
          <Spinner />
          <span>Checking node status…</span>
        </div>
      )}

      {!status.isChecking && status.isRunning && (
        <div style={{ background: STYLES.colors.successLight, border: `1px solid ${STYLES.colors.success}`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: STYLES.colors.success, fontWeight: 600, marginBottom: 4 }}>✓ Bee node is running</div>
          {status.version && (
            <div style={{ color: STYLES.colors.muted, fontSize: 13 }}>Version {status.version}</div>
          )}
        </div>
      )}

      {!status.isChecking && !status.isRunning && status.error && (
        <div>
          <div style={{ background: STYLES.colors.errorLight, border: `1px solid ${STYLES.colors.error}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ color: STYLES.colors.error, fontWeight: 600, marginBottom: 4 }}>✗ Bee node not found</div>
            <div style={{ color: STYLES.colors.muted, fontSize: 13 }}>{status.error}</div>
          </div>
          <div style={{ fontSize: 13, color: STYLES.colors.muted, marginBottom: 16, textAlign: 'left' }}>
            <strong>To start your Bee node:</strong>
            <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>Install Bee: <code>brew install ethersphere/tap/bee</code></li>
              <li>Start it: <code>bee start</code></li>
              <li>Wait for it to sync and retry below</li>
            </ol>
          </div>
          <button
            onClick={onCheck}
            style={retryButtonStyle}
            onMouseOver={e => (e.currentTarget.style.background = STYLES.colors.primaryHover)}
            onMouseOut={e => (e.currentTarget.style.background = STYLES.colors.primary)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, border: '2px solid #e5e7eb',
      borderTopColor: STYLES.colors.primary, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

const retryButtonStyle: React.CSSProperties = {
  background: STYLES.colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 20px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  transition: 'background 0.15s',
}
