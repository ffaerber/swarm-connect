import { useState } from 'react'
import { useSwarmConnect } from '../hooks/useSwarmConnect'
import { SwarmConnectModal } from './SwarmConnectModal'
import { DEFAULT_BEE_API_URL } from '../constants'
import { ensureSwarmStyles } from '../theme'
import type { SwarmConnectConfig, SwarmConnectState } from '../types'

interface SwarmConnectButtonProps extends SwarmConnectConfig {
  label?: string
}

export function SwarmConnectButton({ beeApiUrl = DEFAULT_BEE_API_URL, requirements, label }: SwarmConnectButtonProps) {
  ensureSwarmStyles()
  const [open, setOpen] = useState(false)
  const swarm = useSwarmConnect({ beeApiUrl, requirements })
  const { beeApiUrl: currentBeeApiUrl, setBeeApiUrl, beeNode, stamps, nodeWallet, isFullyConnected, address } = swarm

  const [h, setH] = useState(false)
  const displayLabel = label
    ?? (isFullyConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect to Swarm')

  return (
    <>
      <button
        className="swarm-connect"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
          padding: '10px 16px', borderRadius: 6, cursor: 'pointer',
          background: isFullyConnected ? 'var(--ok-wash)' : 'var(--accent)',
          color: isFullyConnected ? 'var(--ok)' : 'var(--accent-ink)',
          border: `1px solid ${isFullyConnected ? 'var(--ok-line)' : 'transparent'}`,
          boxShadow: isFullyConnected ? 'none' : (h ? '0 0 26px var(--accent-glow)' : '0 0 14px var(--accent-glow)'),
          transform: h && !isFullyConnected ? 'translateY(-1px)' : 'none',
          transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
        }}
      >
        {isFullyConnected
          ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 8px var(--ok)' }} />
          : <ButtonDots swarm={swarm} />}
        {displayLabel}
      </button>

      {open && (
        <SwarmConnectModal
          onClose={() => setOpen(false)}
          beeNode={beeNode}
          stamps={stamps}
          beeApiUrl={currentBeeApiUrl}
          setBeeApiUrl={setBeeApiUrl}
          requirements={swarm.requirements}
          nodeWallet={nodeWallet}
        />
      )}
    </>
  )
}

function ButtonDots({ swarm }: { swarm: SwarmConnectState }) {
  const { beeNode, stamps, nodeWallet, requirements, isWalletConnected, isOnGnosis, balance } = swarm
  const dots: ('ok' | 'bad' | 'warn')[] = [
    isWalletConnected ? 'ok' : 'bad',
    isOnGnosis ? 'ok' : 'bad',
    ...(requirements.xdai ? [balance.hasGas ? 'ok' : isOnGnosis ? 'warn' : 'bad'] as const : []),
    beeNode.isChecking ? 'warn' : beeNode.isRunning ? 'ok' : 'bad',
    ...(requirements.xbzz ? [nodeWallet.isFunded ? 'ok' : 'bad'] as const : []),
    ...(requirements.postageStamp ? [stamps.selectedStampId ? 'ok' : 'bad'] as const : []),
  ]
  const col = { ok: 'var(--accent-ink)', bad: 'rgba(26,14,2,.32)', warn: '#7a4a00' }
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {dots.map((t, i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: col[t], animation: t === 'warn' ? 'sc-pulse-dot 1.4s var(--ease) infinite' : 'none' }} />
      ))}
    </span>
  )
}
