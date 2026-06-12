import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useDisconnect } from 'wagmi'
import { useSwarmConnect, SwarmConnectModal } from '../src'

/**
 * Demo playground. Drives the connect button, the modal, and a live data panel
 * from a SINGLE useSwarmConnect instance so the panel reflects exactly what the
 * modal does (the public <SwarmConnectButton> keeps its own state internally).
 */
export function App() {
  const [open, setOpen] = useState(false)
  const swarm = useSwarmConnect({ stampMode: 'create' })
  const { disconnect } = useDisconnect()
  const { beeNode, stamps, nodeWallet, beeApiUrl, isWalletConnected, address, isOnGnosis, chainId, balance, isFullyConnected } = swarm
  const beeOverlay = useBeeOverlay(beeApiUrl, beeNode.isRunning)
  const selectedStamp = stamps.stamps.find(s => s.batchID === stamps.selectedStampId)

  return (
    <div className="swarm-connect" style={{
      position: 'relative', zIndex: 2, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={card}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 90% at 90% -10%, var(--accent-wash), transparent 60%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <BeeMark size={34} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 23, color: 'var(--fg)', margin: 0, letterSpacing: '-.01em' }}>
              swarm-connect demo
            </h1>
          </div>
          <p style={{ color: 'var(--fg-muted)', margin: '0 0 22px', fontSize: 14, lineHeight: 1.5 }}>
            Click the button, complete the six gated steps (stamp-create mode), then watch the live connection state below.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <TriggerButton fullyConnected={isFullyConnected} address={address} onClick={() => setOpen(true)} />
            {isWalletConnected && <SignOutBtn onClick={() => disconnect()} />}
          </div>

          {isFullyConnected ? (
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px 18px', alignItems: 'baseline' }}>
              <Row label="Status"><Badge ok>Fully connected</Badge></Row>
              <Row label="Wallet address" mono>{address}</Row>
              <Row label="Chain">Gnosis <span style={{ color: 'var(--fg-muted)' }}>(ID {chainId})</span></Row>
              <Row label="xDAI balance" mono>{balance.xdai !== undefined ? balance.xdai.toFixed(2) : '—'}</Row>
              <Row label="Bee node URL" mono>{beeApiUrl}</Row>
              <Row label="Bee version">{beeNode.version ?? '—'}</Row>
              <Row label="Bee overlay" mono>{beeOverlay ?? 'loading…'}</Row>
              <Row label="Node wallet" mono>{nodeWallet.address ?? '—'}</Row>
              <Row label="Node xDAI / xBZZ" mono>
                {nodeWallet.xdai !== undefined ? nodeWallet.xdai.toFixed(4) : '—'} / {nodeWallet.xbzz !== undefined ? nodeWallet.xbzz.toFixed(4) : '—'}
              </Row>
              <Row label="Postage stamp" mono>{selectedStamp?.batchID ?? stamps.selectedStampId ?? '—'}</Row>
              <Row label="Stamp label">{selectedStamp?.label || '—'}</Row>
              <Row label="Stamp usable">
                {selectedStamp ? <Badge ok={selectedStamp.usable}>{selectedStamp.usable ? 'usable' : 'unusable'}</Badge> : '—'}
              </Row>
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--line-2)', borderRadius: 10, padding: '14px 16px', background: 'var(--bunker)' }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 12 }}>Not fully connected yet — live progress:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                <StepInline done={isWalletConnected}>Wallet</StepInline>
                <StepInline done={isOnGnosis}>Gnosis</StepInline>
                <StepInline done={balance.hasGas}>xDAI</StepInline>
                <StepInline done={beeNode.isRunning}>Bee node</StepInline>
                <StepInline done={nodeWallet.isFunded}>Node funded</StepInline>
                <StepInline done={!!stamps.selectedStampId}>Stamp</StepInline>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <SwarmConnectModal
          onClose={() => setOpen(false)}
          beeNode={beeNode}
          stamps={stamps}
          beeApiUrl={beeApiUrl}
          setBeeApiUrl={swarm.setBeeApiUrl}
          stampMode={swarm.stampMode}
          nodeWallet={nodeWallet}
        />
      )}
    </div>
  )
}

/** Fetch the Bee node's overlay address from /addresses once it is reachable. */
function useBeeOverlay(beeApiUrl: string, isRunning: boolean): string | undefined {
  const [overlay, setOverlay] = useState<string>()
  useEffect(() => {
    if (!isRunning) { setOverlay(undefined); return }
    let cancelled = false
    fetch(`${beeApiUrl}/addresses`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(data => { if (!cancelled) setOverlay(data.overlay) })
      .catch(() => { if (!cancelled) setOverlay(undefined) })
    return () => { cancelled = true }
  }, [beeApiUrl, isRunning])
  return overlay
}

/* ---- demo atoms (dark theme, mirror the widget's look) ---- */

function TriggerButton({ fullyConnected, address, onClick }: { fullyConnected: boolean; address?: string; onClick: () => void }) {
  const [h, setH] = useState(false)
  const label = fullyConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect to Swarm'
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
        padding: '10px 16px', borderRadius: 6, cursor: 'pointer',
        background: fullyConnected ? 'var(--ok-wash)' : 'var(--accent)',
        color: fullyConnected ? 'var(--ok)' : 'var(--accent-ink)',
        border: `1px solid ${fullyConnected ? 'var(--ok-line)' : 'transparent'}`,
        boxShadow: fullyConnected ? 'none' : (h ? '0 0 26px var(--accent-glow)' : '0 0 14px var(--accent-glow)'),
        transform: h && !fullyConnected ? 'translateY(-1px)' : 'none',
        transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
      }}>
      {fullyConnected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 8px var(--ok)' }} />}
      {label}
    </button>
  )
}

function SignOutBtn({ onClick }: { onClick: () => void }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12.5, letterSpacing: '.04em', background: 'transparent',
        border: `1px solid ${h ? 'var(--line-orange)' : 'var(--line-2)'}`,
        color: h ? 'var(--accent-bright)' : 'var(--fg-soft)', borderRadius: 6, padding: '10px 16px',
        cursor: 'pointer', transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
      }}>sign out</button>
  )
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--fg)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', wordBreak: 'break-all', lineHeight: 1.45 }}>{children}</div>
    </>
  )
}

function Badge({ children, ok }: { children: ReactNode; ok?: boolean }) {
  const tone = ok === undefined ? { c: 'var(--accent-bright)', b: 'var(--line-orange)', w: 'var(--accent-wash)' }
    : ok ? { c: 'var(--ok)', b: 'var(--ok-line)', w: 'var(--ok-wash)' }
      : { c: 'var(--bad)', b: 'var(--bad-line)', w: 'var(--bad-wash)' }
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase',
      color: tone.c, background: tone.w, border: `1px solid ${tone.b}`, borderRadius: 3, padding: '2px 7px', marginLeft: 4 }}>{children}</span>
  )
}

function StepInline({ done, children }: { done: boolean; children: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
      color: done ? 'var(--ok)' : 'var(--fg-faint)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: done ? 'var(--ok)' : 'var(--line-2)', boxShadow: done ? '0 0 7px var(--ok)' : 'none' }} />
      {children}
    </span>
  )
}

function BeeMark({ size = 30 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--accent)', color: 'var(--accent-ink)',
      clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', boxShadow: '0 0 18px var(--accent-glow)',
    }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none"
        stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="5" ry="6.5" />
        <path d="M7 12h10M7 16h10M12 7.5V4M12 4l-2.5-1.5M12 4l2.5-1.5" />
      </svg>
    </span>
  )
}

const card: CSSProperties = {
  position: 'relative', width: 560, maxWidth: '100%', background: 'var(--surface)',
  border: '1px solid var(--line-2)', borderRadius: 16, padding: 30, overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.06), 0 0 50px rgba(255,107,0,.06)',
}
