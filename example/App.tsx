import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useDisconnect } from 'wagmi'
import { useSwarmConnect, SwarmConnectModal } from '../src'

const GNOSIS_CHAIN_ID = 100

export function App() {
  const [open, setOpen] = useState(false)
  const sc = useSwarmConnect()
  const { disconnect } = useDisconnect()
  const beeOverlay = useBeeOverlay(sc.beeApiUrl, sc.beeNode.isRunning)

  const selectedStamp = sc.stamps.stamps.find(s => s.batchID === sc.stamps.selectedStampId)

  return (
    <div style={page}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 26 }}>🐝</span>
          <h1 style={{ fontSize: 22, margin: 0 }}>swarm-connect demo</h1>
        </div>
        <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
          Click the button, complete the three steps, then watch the live state below.
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => setOpen(true)} style={primaryBtn}>
            {sc.isFullyConnected ? '✅ Connected — view / edit' : 'Connect to Swarm'}
          </button>
          {sc.isWalletConnected && (
            <button onClick={() => disconnect()} style={ghostBtn}>Sign out</button>
          )}
        </div>

        {sc.isFullyConnected ? (
          <div style={dataGrid}>
            <Row label="Status">
              <Badge ok>Fully connected</Badge>
            </Row>
            <Row label="Wallet address" mono>{sc.address ?? '—'}</Row>
            <Row label="Chain">
              {sc.isOnGnosis ? 'Gnosis' : 'Wrong network'} (ID {sc.chainId ?? '—'})
              {!sc.isOnGnosis && <Badge> expected {GNOSIS_CHAIN_ID}</Badge>}
            </Row>
            <Row label="Bee node URL" mono>{sc.beeApiUrl}</Row>
            <Row label="Bee version">{sc.beeNode.version ?? '—'}</Row>
            <Row label="Bee address (overlay)" mono>{beeOverlay ?? 'loading…'}</Row>
            <Row label="Postage stamp" mono>{selectedStamp?.batchID ?? sc.stamps.selectedStampId ?? '—'}</Row>
            <Row label="Stamp label">{selectedStamp?.label || '—'}</Row>
            <Row label="Stamp usable">
              {selectedStamp ? <Badge ok={selectedStamp.usable}>{selectedStamp.usable ? 'usable' : 'unusable'}</Badge> : '—'}
            </Row>
          </div>
        ) : (
          <div style={hint}>
            Not fully connected yet. Live progress:{' '}
            <Step done={sc.beeNode.isRunning}>Bee node</Step> ·{' '}
            <Step done={!!sc.stamps.selectedStampId}>Stamp</Step> ·{' '}
            <Step done={sc.isWalletConnected}>Wallet</Step> ·{' '}
            <Step done={sc.isOnGnosis}>Gnosis</Step>
          </div>
        )}
      </div>

      {open && (
        <SwarmConnectModal
          onClose={() => setOpen(false)}
          beeNode={sc.beeNode}
          stamps={sc.stamps}
          beeApiUrl={sc.beeApiUrl}
          setBeeApiUrl={sc.setBeeApiUrl}
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

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <>
      <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {children}
      </div>
    </>
  )
}

function Badge({ children, ok }: { children: ReactNode; ok?: boolean }) {
  const bg = ok === undefined ? '#fff7ed' : ok ? '#f0fdf4' : '#fef2f2'
  const color = ok === undefined ? '#c2410c' : ok ? '#0e9f6e' : '#dc2626'
  return (
    <span style={{ fontSize: 11, background: bg, color, borderRadius: 4, padding: '2px 6px', marginLeft: 4 }}>
      {children}
    </span>
  )
}

function Step({ done, children }: { done: boolean; children: string }) {
  return <span style={{ color: done ? '#0e9f6e' : '#9ca3af', fontWeight: 600 }}>{done ? '✓ ' : '○ '}{children}</span>
}

const page: CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#f3f4f6', padding: 20,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827',
}
const card: CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 28, width: 520, maxWidth: '100%',
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
}
const dataGrid: CSSProperties = {
  display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px 16px', alignItems: 'baseline',
}
const hint: CSSProperties = {
  fontSize: 13, color: '#6b7280', background: '#f9fafb',
  border: '1px dashed #e5e7eb', borderRadius: 8, padding: '12px 14px',
}
const primaryBtn: CSSProperties = {
  background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 18px', cursor: 'pointer', fontSize: 15, fontWeight: 600,
}
const ghostBtn: CSSProperties = {
  background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#6b7280',
}
