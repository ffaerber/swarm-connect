import { useEffect, useState } from 'react'
import { STYLES } from '../../constants'
import { StepLabel } from '../StepLabel'
import type { BeeNodeStatus, PostageStamp, PostageStampsState } from '../../types'

interface SwarmSectionProps {
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
}

export function SwarmSection({ beeApiUrl, setBeeApiUrl, beeNode, stamps }: SwarmSectionProps) {
  // Re-check whenever the URL changes (incl. initial mount). beeNode.check is
  // rebound to the current URL, so depending on beeApiUrl re-runs it.
  useEffect(() => {
    beeNode.check()
  }, [beeApiUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (beeNode.isRunning) stamps.fetchStamps()
  }, [beeNode.isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <section>
        <StepLabel step={1} done={beeNode.isRunning}>Bee Node</StepLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NodeUrlInput
            value={beeApiUrl}
            disabled={beeNode.isChecking}
            onSubmit={setBeeApiUrl}
          />
          <BeeNodeCard beeApiUrl={beeApiUrl} status={beeNode} onRetry={beeNode.check} />
        </div>
      </section>

      <section style={{ opacity: beeNode.isRunning ? 1 : 0.5 }}>
        <StepLabel step={2} done={!!stamps.selectedStampId}>Postage Stamp</StepLabel>
        {beeNode.isRunning
          ? <StampSelector stamps={stamps} />
          : <LockedNotice>Connect a running Bee node to load postage stamps.</LockedNotice>}
      </section>
    </>
  )
}

function NodeUrlInput({ value, disabled, onSubmit }: { value: string; disabled: boolean; onSubmit: (url: string) => void }) {
  const [draft, setDraft] = useState(value)

  // Keep the field in sync if the URL is changed elsewhere.
  useEffect(() => { setDraft(value) }, [value])

  const trimmed = draft.trim().replace(/\/+$/, '')
  const dirty = trimmed !== value && trimmed.length > 0
  const commit = () => { if (dirty) onSubmit(trimmed) }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        type="url"
        value={draft}
        disabled={disabled}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit() }}
        placeholder="http://localhost:1633"
        spellCheck={false}
        autoComplete="off"
        style={{
          flex: 1, minWidth: 0,
          padding: '8px 10px', fontSize: 13,
          fontFamily: 'monospace',
          border: `1px solid ${STYLES.colors.border}`,
          borderRadius: 6, color: STYLES.colors.text,
          outline: 'none', background: disabled ? '#f9fafb' : '#fff',
        }}
      />
      <button
        onClick={commit}
        disabled={disabled || !dirty}
        style={{
          ...ghostBtn,
          alignSelf: 'auto',
          cursor: disabled || !dirty ? 'default' : 'pointer',
          opacity: disabled || !dirty ? 0.5 : 1,
        }}
      >
        Connect
      </button>
    </div>
  )
}

function LockedNotice({ children }: { children: string }) {
  return (
    <div style={{
      ...row, color: STYLES.colors.muted, fontSize: 13,
      borderStyle: 'dashed', background: '#fafafa',
    }}>
      <span style={{ fontSize: 13 }}>🔒</span>
      <span>{children}</span>
    </div>
  )
}

function BeeNodeCard({ beeApiUrl, status, onRetry }: { beeApiUrl: string; status: BeeNodeStatus; onRetry: () => void }) {
  if (status.isChecking) {
    return (
      <div style={row}>
        <Spinner />
        <span style={{ color: STYLES.colors.muted, fontSize: 14 }}>Checking {beeApiUrl}…</span>
      </div>
    )
  }

  if (status.isRunning) {
    return (
      <div style={{ ...row, borderColor: STYLES.colors.success, background: STYLES.colors.successLight }}>
        <Dot color={STYLES.colors.success} />
        <div>
          <div style={{ fontWeight: 600, color: STYLES.colors.success, fontSize: 14 }}>Node running</div>
          {status.version && <div style={{ color: STYLES.colors.muted, fontSize: 12 }}>v{status.version}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ ...row, borderColor: STYLES.colors.error, background: STYLES.colors.errorLight }}>
        <Dot color={STYLES.colors.error} />
        <div>
          <div style={{ fontWeight: 600, color: STYLES.colors.error, fontSize: 14 }}>Node not reachable</div>
          <div style={{ color: STYLES.colors.muted, fontSize: 12 }}>
            {status.error ?? `Cannot reach ${beeApiUrl}`}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: STYLES.colors.muted }}>
        Start: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>bee start</code>
      </div>
      <button onClick={onRetry} style={ghostBtn}>Retry</button>
    </div>
  )
}

function StampSelector({ stamps }: { stamps: PostageStampsState }) {
  if (stamps.isLoading) {
    return (
      <div style={{ ...row, gap: 10 }}>
        <Spinner />
        <span style={{ color: STYLES.colors.muted, fontSize: 14 }}>Loading stamps…</span>
      </div>
    )
  }

  if (stamps.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...row, borderColor: STYLES.colors.error, background: STYLES.colors.errorLight }}>
          <span style={{ color: STYLES.colors.error, fontSize: 13 }}>{stamps.error}</span>
        </div>
        <button onClick={stamps.fetchStamps} style={ghostBtn}>Retry</button>
      </div>
    )
  }

  if (stamps.stamps.length === 0) {
    return (
      <div style={{ ...row, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ fontSize: 14, color: STYLES.colors.muted }}>No postage stamps found.</div>
        <div style={{ fontSize: 12, color: STYLES.colors.muted }}>
          Buy a stamp via the Bee API or Swarm Desktop to continue.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stamps.stamps.map(stamp => (
        <StampCard
          key={stamp.batchID}
          stamp={stamp}
          selected={stamps.selectedStampId === stamp.batchID}
          onSelect={() => stamps.selectStamp(stamp.batchID)}
        />
      ))}
    </div>
  )
}

function StampCard({ stamp, selected, onSelect }: { stamp: PostageStamp; selected: boolean; onSelect: () => void }) {
  const ttlDays = Math.floor(stamp.batchTTL / 86400)
  const shortId = `${stamp.batchID.slice(0, 8)}…${stamp.batchID.slice(-6)}`

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        border: `1.5px solid ${selected ? STYLES.colors.primary : STYLES.colors.border}`,
        borderRadius: 8, cursor: 'pointer',
        background: selected ? '#eff6ff' : '#fff',
        textAlign: 'left', width: '100%', transition: 'all 0.15s',
      }}
    >
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: STYLES.colors.text }}>{shortId}</div>
        {stamp.label && (
          <div style={{ fontSize: 12, color: STYLES.colors.muted, marginTop: 2 }}>{stamp.label}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: STYLES.colors.muted }}>
          {ttlDays > 0 ? `${ttlDays}d` : 'expiring'}
        </span>
        {stamp.usable
          ? <Badge bg={STYLES.colors.successLight} color={STYLES.colors.success}>usable</Badge>
          : <Badge bg={STYLES.colors.errorLight} color={STYLES.colors.error}>unusable</Badge>}
        <div style={{
          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${selected ? STYLES.colors.primary : STYLES.colors.border}`,
          background: selected ? STYLES.colors.primary : 'transparent',
        }} />
      </div>
    </button>
  )
}

function Badge({ children, bg, color }: { children: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 11, background: bg, color, borderRadius: 4, padding: '2px 6px' }}>
      {children}
    </span>
  )
}

function Dot({ color }: { color: string }) {
  return <span style={{ fontSize: 10, color, lineHeight: 1 }}>●</span>
}

function Spinner() {
  return (
    <div style={{
      width: 15, height: 15, flexShrink: 0,
      border: '2px solid #e5e7eb', borderTopColor: STYLES.colors.primary,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    }} />
  )
}

const row = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '11px 14px', border: `1px solid ${STYLES.colors.border}`,
  borderRadius: 8, background: '#fff',
} as const

const ghostBtn = {
  background: 'none', border: `1px solid ${STYLES.colors.border}`,
  borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
  fontSize: 13, color: STYLES.colors.muted, alignSelf: 'flex-start' as const,
} as const
