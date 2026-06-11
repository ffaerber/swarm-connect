import { useState } from 'react'
import { STYLES } from '../constants'
import type { BeeNodeStatus, PostageStampsState } from '../types'
import { SwarmTab } from './tabs/SwarmTab'
import { WalletTab } from './tabs/WalletTab'

type TabId = 'swarm' | 'wallet'

interface SwarmConnectModalProps {
  onClose: () => void
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
}

export function SwarmConnectModal({ onClose, beeNode, stamps, beeApiUrl, setBeeApiUrl }: SwarmConnectModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('swarm')

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: STYLES.colors.overlay,
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        zIndex: 9999,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        width: 460, maxWidth: 'calc(100vw - 32px)',
        animation: 'scIn 0.2s ease forwards',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🐝</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: STYLES.colors.text }}>
              Swarm Connect
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: STYLES.colors.muted, fontSize: 22, lineHeight: 1,
              padding: '0 2px', borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', margin: '14px 20px 0',
          borderBottom: `1px solid ${STYLES.colors.border}`,
        }}>
          {(['swarm', 'wallet'] as TabId[]).map(tab => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 18px 10px',
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? STYLES.colors.primary : STYLES.colors.muted,
                  borderBottom: `2px solid ${active ? STYLES.colors.primary : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.15s',
                }}
              >
                {tab === 'swarm' ? '🐝 Swarm' : '🦊 Wallet'}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px', minHeight: 260, maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'swarm' && (
            <SwarmTab beeApiUrl={beeApiUrl} setBeeApiUrl={setBeeApiUrl} beeNode={beeNode} stamps={stamps} />
          )}
          {activeTab === 'wallet' && <WalletTab />}
        </div>
      </div>
    </>
  )
}
