import { useState } from 'react'
import { useSwarmConnect } from '../hooks/useSwarmConnect'
import { SwarmConnectModal } from './SwarmConnectModal'
import { ensureSwarmStyles } from '../theme'
import type { SwarmConnectState } from '../types'
import type { SwarmConnectConfig } from '../types'

/** Pointy-top hexagon — the honeycomb cell shape (status cells). */
const HEX_CELL = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

/** Elongated flat-top hexagon — the button's outer honeycomb-cell silhouette. */
const HEX_BUTTON = 'polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)'

interface SwarmConnectButtonProps extends SwarmConnectConfig {
  label?: string
}

// `beeApiUrl` is deliberately left undefined when the prop is omitted: passing
// a default here would shadow the URL the user last saved in localStorage.
export function SwarmConnectButton({ beeApiUrl, requirements, label }: SwarmConnectButtonProps) {
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
          display: 'inline-flex', alignItems: 'center', gap: 11,
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
          padding: '12px 26px', cursor: 'pointer',
          background: isFullyConnected ? 'var(--ok-wash)' : 'var(--accent)',
          color: isFullyConnected ? 'var(--ok)' : 'var(--accent-ink)',
          border: 'none',
          // outer shape: a single elongated honeycomb cell
          clipPath: HEX_BUTTON,
          // drop-shadow (not box-shadow) so the glow follows the clipped hex shape
          filter: isFullyConnected ? 'none' : (h ? 'drop-shadow(0 0 13px var(--accent-glow))' : 'drop-shadow(0 0 8px var(--accent-glow))'),
          transform: h && !isFullyConnected ? 'translateY(-1px)' : 'none',
          transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
        }}
      >
        {isFullyConnected
          ? <span style={{ width: 11, height: 12, clipPath: HEX_CELL, background: 'var(--ok)' }} />
          : <ButtonHive swarm={swarm} />}
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

/** Per-step status as an interlocking honeycomb cluster of hexagon cells. */
function ButtonHive({ swarm }: { swarm: SwarmConnectState }) {
  const { beeNode, stamps, nodeWallet, requirements, isWalletConnected, isOnGnosis, balance } = swarm
  const cells: ('ok' | 'bad' | 'warn')[] = [
    isWalletConnected ? 'ok' : 'bad',
    isOnGnosis ? 'ok' : 'bad',
    ...(requirements.xdai ? [balance.hasGas ? 'ok' : isOnGnosis ? 'warn' : 'bad'] as const : []),
    ...(requirements.xbzz ? [balance.hasBzz ? 'ok' : isOnGnosis ? 'warn' : 'bad'] as const : []),
    beeNode.isChecking ? 'warn' : beeNode.isRunning ? 'ok' : 'bad',
    ...(requirements.nodeWallet ? [nodeWallet.isFunded ? 'ok' : 'bad'] as const : []),
    ...(requirements.postageStamp ? [stamps.selectedStampId ? 'ok' : 'bad'] as const : []),
  ]
  const col = { ok: 'var(--accent-ink)', bad: 'rgba(26,14,2,.30)', warn: '#7a4a00' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 16 }}>
      {cells.map((t, i) => (
        <span key={i} style={{
          width: 12, height: 13, flexShrink: 0,
          clipPath: HEX_CELL, background: col[t],
          marginLeft: i === 0 ? 0 : -3.5,
          transform: `translateY(${i % 2 ? 3 : -3}px)`,
          animation: t === 'warn' ? 'sc-pulse-dot 1.4s var(--ease) infinite' : 'none',
        }} />
      ))}
    </span>
  )
}
