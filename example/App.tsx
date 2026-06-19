import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useSwarmConnect, SwarmConnectModal } from '../src'
import type { SwarmConnectRequirements } from '../src'

/**
 * Demo playground showing several connection scenarios side by side. Each
 * card runs its own useSwarmConnect instance (own modal, own gating) with a
 * different `requirements` config. Wallet + chain state is shared via wagmi.
 */

interface Scenario {
  id: string
  title: string
  desc: string
  requirements: SwarmConnectRequirements
}

const SCENARIOS: Scenario[] = [
  {
    id: 'classic',
    title: 'Classic — select a stamp',
    desc: 'The default. The user picks one of their existing postage stamps; the dApp uploads with it.',
    requirements: { xdai: true, postageStamp: true },
  },
  {
    id: 'dapp-managed',
    title: 'dApp-managed stamps',
    desc: 'The dApp creates and tracks its own stamps — the user only needs gas. No stamp step.',
    requirements: { xdai: true, postageStamp: false },
  },
  {
    id: 'platform-token',
    title: 'xBZZ as a platform token',
    desc: 'The dApp requires the user to hold xBZZ in their own wallet (a platform token) — not for buying stamps.',
    requirements: { xdai: true, xbzz: true, postageStamp: false },
  },
  {
    id: 'node-funding',
    title: 'dApp buys stamps — node funding',
    desc: 'The node wallet must be topped up with xDAI + xBZZ so the dApp can buy stamps via createStamp().',
    requirements: { xdai: true, nodeWallet: true, postageStamp: true },
  },
  {
    id: 'minimal',
    title: 'Minimal — node only',
    desc: 'Read-style dApp: wallet identity, Gnosis, and a running Bee node. No gas, no stamps.',
    requirements: { xdai: false, postageStamp: false },
  },
]

export function App() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="swarm-connect" style={page}>
      <div style={{ width: 1080, maxWidth: '100%' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
          <BeeMark size={34} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--fg)', margin: 0, letterSpacing: '-.01em', flex: 1 }}>
            swarm-connect scenarios
          </h1>
          {isConnected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
                {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
              </span>
              <SignOutBtn onClick={() => disconnect()} />
            </div>
          )}
        </div>
        <p style={{ color: 'var(--fg-muted)', margin: '0 0 24px', fontSize: 14, lineHeight: 1.5, maxWidth: 720 }}>
          Each card is an independent <code style={codeStyle}>useSwarmConnect</code> instance with its own{' '}
          <code style={codeStyle}>requirements</code> — open each modal to see how the gated steps adapt.
          Wallet and chain state are shared; node, funding, and stamp requirements differ per scenario.
        </p>

        {/* scenario grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 18 }}>
          {SCENARIOS.map(s => <ScenarioCard key={s.id} scenario={s} />)}
        </div>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false)
  const swarm = useSwarmConnect({ requirements: scenario.requirements })
  const { beeNode, stamps, nodeWallet, requirements, beeApiUrl, isWalletConnected, isOnGnosis, chainId, balance, isFullyConnected, address } = swarm
  const beeOverlay = useBeeOverlay(beeApiUrl, beeNode.isRunning)
  const selectedStamp = stamps.stamps.find(s => s.batchID === stamps.selectedStampId)

  return (
    <div style={card}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 90% at 90% -10%, var(--accent-wash), transparent 60%)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
        {/* title + requirement chips */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16.5, color: 'var(--fg)', margin: 0 }}>
              {scenario.title}
            </h2>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              <ReqChip on={requirements.xdai}>xdai</ReqChip>
              <ReqChip on={requirements.xbzz}>xbzz</ReqChip>
              <ReqChip on={requirements.nodeWallet}>node$</ReqChip>
              <ReqChip on={requirements.postageStamp}>stamp</ReqChip>
            </span>
          </div>
          <p style={{ color: 'var(--fg-muted)', margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{scenario.desc}</p>
        </div>

        {/* connect */}
        <div>
          <TriggerButton fullyConnected={isFullyConnected} address={address} onClick={() => setOpen(true)} />
        </div>

        {/* live state */}
        {isFullyConnected ? (
          <div style={{ display: 'grid', gridTemplateColumns: '128px 1fr', gap: '8px 14px', alignItems: 'baseline' }}>
            <Row label="Status"><Badge ok>Fully connected</Badge></Row>
            <Row label="Browser wallet" mono>{address}</Row>
            <Row label="Chain">Gnosis <span style={{ color: 'var(--fg-muted)' }}>(ID {chainId})</span></Row>
            {requirements.xdai && (
              <Row label="Wallet xDAI" mono>{balance.xdai !== undefined ? balance.xdai.toFixed(4) : '—'}</Row>
            )}
            {requirements.xbzz && (
              <Row label="Wallet xBZZ" mono>{balance.bzz !== undefined ? balance.bzz.toFixed(4) : '—'}</Row>
            )}
            <Row label="Bee node" mono>{beeApiUrl}</Row>
            <Row label="Bee version">{beeNode.version ?? '—'}</Row>
            <Row label="Bee overlay" mono>{beeOverlay ? `${beeOverlay.slice(0, 10)}…${beeOverlay.slice(-8)}` : 'loading…'}</Row>
            {requirements.nodeWallet && (
              <Row label="Bee wallet xDAI/xBZZ" mono>
                {nodeWallet.xdai !== undefined ? nodeWallet.xdai.toFixed(4) : '—'} / {nodeWallet.xbzz !== undefined ? nodeWallet.xbzz.toFixed(4) : '—'}
              </Row>
            )}
            {requirements.postageStamp && (
              <Row label="Stamp" mono>
                {selectedStamp ? `${selectedStamp.batchID.slice(0, 10)}…${selectedStamp.batchID.slice(-8)}` : '—'}
                {selectedStamp && (
                  <Badge ok={selectedStamp.usable}>{selectedStamp.usable ? 'usable' : 'unusable'}</Badge>
                )}
              </Row>
            )}
          </div>
        ) : (
          <div style={{ border: '1px dashed var(--line-2)', borderRadius: 10, padding: '11px 14px', background: 'var(--bunker)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
              <StepInline done={isWalletConnected}>Wallet</StepInline>
              <StepInline done={isOnGnosis}>Gnosis</StepInline>
              {requirements.xdai && <StepInline done={balance.hasGas}>xDAI</StepInline>}
              {requirements.xbzz && <StepInline done={balance.hasBzz}>xBZZ</StepInline>}
              <StepInline done={beeNode.isRunning}>Bee node</StepInline>
              {requirements.nodeWallet && <StepInline done={nodeWallet.isFunded}>Node funded</StepInline>}
              {requirements.postageStamp && <StepInline done={!!stamps.selectedStampId}>Stamp</StepInline>}
            </div>
          </div>
        )}
      </div>

      {open && (
        <SwarmConnectModal
          onClose={() => setOpen(false)}
          beeNode={beeNode}
          stamps={stamps}
          beeApiUrl={beeApiUrl}
          setBeeApiUrl={swarm.setBeeApiUrl}
          requirements={requirements}
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

function ReqChip({ on, children }: { on: boolean; children: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase',
      color: on ? 'var(--accent-bright)' : 'var(--fg-faint)',
      background: on ? 'var(--accent-wash)' : 'transparent',
      border: `1px solid ${on ? 'var(--line-orange)' : 'var(--line-2)'}`,
      borderRadius: 3, padding: '2px 6px', lineHeight: 1.3, whiteSpace: 'nowrap',
      textDecoration: on ? 'none' : 'line-through',
    }}>{children}</span>
  )
}

const HEX_CELL = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
const HEX_BUTTON = 'polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)'

function TriggerButton({ fullyConnected, address, onClick }: { fullyConnected: boolean; address?: string; onClick: () => void }) {
  const [h, setH] = useState(false)
  const label = fullyConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect to Swarm'
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
        padding: '12px 26px', cursor: 'pointer',
        background: fullyConnected ? 'var(--ok-wash)' : 'var(--accent)',
        color: fullyConnected ? 'var(--ok)' : 'var(--accent-ink)',
        border: 'none',
        clipPath: HEX_BUTTON,
        filter: fullyConnected ? 'none' : (h ? 'drop-shadow(0 0 13px var(--accent-glow))' : 'drop-shadow(0 0 8px var(--accent-glow))'),
        transform: h && !fullyConnected ? 'translateY(-1px)' : 'none',
        transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
      }}>
      {fullyConnected && <span style={{ width: 11, height: 12, clipPath: HEX_CELL, background: 'var(--ok)' }} />}
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
        color: h ? 'var(--accent-bright)' : 'var(--fg-soft)', borderRadius: 6, padding: '8px 14px',
        cursor: 'pointer', transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
      }}>sign out</button>
  )
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--fg)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', wordBreak: 'break-all', lineHeight: 1.45 }}>{children}</div>
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

const page: CSSProperties = {
  position: 'relative', zIndex: 2, minHeight: '100vh',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px',
}
const card: CSSProperties = {
  position: 'relative', background: 'var(--surface)',
  border: '1px solid var(--line-2)', borderRadius: 16, padding: 22, overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.06), 0 0 50px rgba(255,107,0,.06)',
}
const codeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--bunker)',
  border: '1px solid var(--line)', color: 'var(--accent-bright)', padding: '1px 6px', borderRadius: 3,
}
