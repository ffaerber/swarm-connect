import { useEffect, useState } from 'react'
import { useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { gnosis } from 'wagmi/chains'
import { GNOSIS_CHAIN_ID } from '../constants'
import type { BeeNodeStatus, PostageStamp, PostageStampsState, BalanceState } from '../types'
import { Spinner, Badge, StatusRow, GhostBtn, PrimaryBtn, LockedNotice } from './atoms'

/* ---------- STEP 1 — Bee node ------------------------------ */

export function NodeUrlInput({ value, disabled, onSubmit }: {
  value: string; disabled: boolean; onSubmit: (url: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [focus, setFocus] = useState(false)
  useEffect(() => { setDraft(value) }, [value])
  const trimmed = draft.trim().replace(/\/+$/, '')
  const dirty = trimmed !== value && trimmed.length > 0
  const commit = () => { if (dirty) onSubmit(trimmed) }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', borderRadius: 6,
        border: `1px solid ${focus ? 'var(--line-orange)' : 'var(--line-2)'}`,
        background: disabled ? 'var(--bunker)' : 'var(--surface)',
        boxShadow: focus ? '0 0 0 3px var(--accent-wash)' : 'none',
        transition: 'all .15s var(--ease)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>&gt;</span>
        <input type="url" value={draft} disabled={disabled} spellCheck={false} autoComplete="off"
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit() }}
          placeholder="http://localhost:1633"
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 12.5, padding: '9px 0',
          }} />
      </div>
      <GhostBtn onClick={commit} disabled={disabled || !dirty}>connect</GhostBtn>
    </div>
  )
}

export function BeeNodeStep({ node, beeApiUrl }: {
  node: BeeNodeStatus & { check: () => void }; beeApiUrl: string
}) {
  if (node.isChecking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--raised)' }}>
        <Spinner />
        <span style={{ color: 'var(--fg-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>probing {beeApiUrl}…</span>
      </div>
    )
  }
  if (node.isRunning) {
    return (
      <StatusRow tone="ok" title="Node online" sub={`bee ${node.version ?? '—'}  ·  ${beeApiUrl}`}>
        <Badge tone="ok">health ok</Badge>
      </StatusRow>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StatusRow tone="bad" title="Node unreachable" sub={node.error ?? `no /health response from ${beeApiUrl}`} />
      <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span>start one with</span>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, background: 'var(--bunker)', border: '1px solid var(--line)', color: 'var(--accent-bright)', padding: '2px 7px', borderRadius: 3 }}>bee start</code>
        <GhostBtn onClick={node.check}>retry</GhostBtn>
      </div>
    </div>
  )
}

/* ---------- STEP 2 — postage stamp ------------------------- */

function StampCard({ stamp, selected, onSelect }: {
  stamp: PostageStamp; selected: boolean; onSelect: () => void
}) {
  const [h, setH] = useState(false)
  const ttlDays = Math.floor(stamp.batchTTL / 86400)
  const shortId = `${stamp.batchID.slice(0, 8)}…${stamp.batchID.slice(-6)}`
  const active = selected || h
  return (
    <button onClick={onSelect} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${selected ? 'var(--ok-line)' : active ? 'var(--line-2)' : 'var(--line)'}`,
        background: selected ? 'var(--ok-wash)' : 'var(--raised)',
        boxShadow: selected ? '0 0 0 1px var(--ok-line), 0 0 18px var(--ok-wash)' : 'none',
        transition: 'all .15s var(--ease)',
      }}>
      <span style={{
        width: 8, height: 8, flexShrink: 0, borderRadius: '50%',
        background: selected ? 'var(--ok)' : 'var(--line-2)',
        boxShadow: selected ? '0 0 8px var(--ok)' : 'none', transition: 'all .15s var(--ease)',
      }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg)' }}>{shortId}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
          {stamp.label && <><span>{stamp.label}</span><span style={{ color: 'var(--fg-faint)' }}>·</span></>}
          <span>depth {stamp.depth}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: ttlDays > 30 ? 'var(--fg-muted)' : 'var(--warn)' }}>
          {ttlDays > 0 ? `${ttlDays}d ttl` : 'expiring'}
        </span>
        <Badge tone={stamp.usable ? 'ok' : 'bad'}>{stamp.usable ? 'usable' : 'unusable'}</Badge>
      </div>
    </button>
  )
}

export function StampStep({ stamps, locked }: { stamps: PostageStampsState; locked: boolean }) {
  if (locked) return <LockedNotice>Bring a node online to load its postage stamps.</LockedNotice>
  if (stamps.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--raised)' }}>
        <Spinner /><span style={{ color: 'var(--fg-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>reading /stamps…</span>
      </div>
    )
  }
  if (stamps.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatusRow tone="bad" title="Could not read stamps" sub={stamps.error} />
        <GhostBtn onClick={stamps.fetchStamps}>retry</GhostBtn>
      </div>
    )
  }
  if (stamps.stamps.length === 0) {
    return <LockedNotice>No postage stamps on this node — buy one via the Bee API to continue.</LockedNotice>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stamps.stamps.map(s => (
        <StampCard key={s.batchID} stamp={s}
          selected={stamps.selectedStampId === s.batchID}
          onSelect={() => stamps.selectStamp(s.batchID)} />
      ))}
    </div>
  )
}

/* ---------- STEP 3 — wallet -------------------------------- */

function WalletConnector({ name, icon, pending, disabled, onClick }: {
  name: string; icon?: string; pending: boolean; disabled: boolean; onClick: () => void
}) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled || pending}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '11px 13px', borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .45 : 1,
        border: `1px solid ${h && !disabled ? 'var(--line-orange)' : 'var(--line)'}`,
        background: h && !disabled ? 'var(--raised-2)' : 'var(--raised)',
        transition: 'all .15s var(--ease)',
      }}>
      <span style={{
        width: 30, height: 30, flexShrink: 0, borderRadius: 7, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bunker)',
        border: '1px solid var(--line-2)', color: 'var(--accent-bright)', overflow: 'hidden',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
      }}>
        {icon ? <img src={icon} width={30} height={30} alt="" style={{ borderRadius: 7 }} /> : name.charAt(0)}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>{name}</span>
      {pending
        ? <Spinner size={14} />
        : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: h && !disabled ? 'var(--accent)' : 'var(--fg-faint)', transition: 'color .15s' }}>→</span>}
    </button>
  )
}

export function WalletStep({ locked, isConnected, address }: {
  locked: boolean; isConnected: boolean; address?: string
}) {
  const { connectors, connect, isPending, variables, error } = useConnect()
  const { disconnect } = useDisconnect()

  if (locked) return <LockedNotice>Finish steps 1 and 2 to unlock wallet connection.</LockedNotice>

  if (isConnected) {
    return (
      <StatusRow tone="ok" title="Wallet connected" sub={address}>
        <GhostBtn onClick={() => disconnect()}>disconnect</GhostBtn>
      </StatusRow>
    )
  }

  const pendingId = isPending ? variables?.connector && 'uid' in variables.connector ? variables.connector.uid : undefined : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {connectors.map(c => (
        <WalletConnector key={c.uid} name={c.name} icon={c.icon}
          pending={pendingId === c.uid}
          disabled={isPending && pendingId !== c.uid}
          onClick={() => connect({ connector: c })} />
      ))}
      {error && <div style={{ fontSize: 12, color: 'var(--bad)', fontFamily: 'var(--font-mono)' }}>{error.message}</div>}
    </div>
  )
}

/* ---------- STEP 4 — network ------------------------------- */

export function NetworkStep({ locked, isOnGnosis, chainId }: {
  locked: boolean; isOnGnosis: boolean; chainId?: number
}) {
  const { switchChain, isPending } = useSwitchChain()
  if (locked) return <LockedNotice>Connect a wallet to verify it is on the Gnosis chain.</LockedNotice>
  if (isOnGnosis) {
    return (
      <StatusRow tone="ok" title="Gnosis chain" sub={`chain id ${GNOSIS_CHAIN_ID}`}>
        <Badge tone="ok">synced</Badge>
      </StatusRow>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StatusRow tone="warn" title="Wrong network" sub={`chain ${chainId ?? '—'} active — Gnosis (${GNOSIS_CHAIN_ID}) required`} />
      <PrimaryBtn onClick={() => switchChain({ chainId: gnosis.id })} pending={isPending} block>
        {isPending ? 'switching…' : 'switch to Gnosis'}
      </PrimaryBtn>
    </div>
  )
}

/* ---------- STEP 5 — balance ------------------------------- */

function TokenRow({ symbol, role, amount, loading }: {
  symbol: string; role: string; amount: number; loading: boolean
}) {
  const empty = !loading && amount === 0
  const c = empty ? 'var(--warn)' : 'var(--ok)'
  const line = empty ? 'var(--warn-line)' : 'var(--ok-line)'
  const wash = empty ? 'var(--warn-wash)' : 'var(--ok-wash)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      border: `1px solid ${loading ? 'var(--line)' : line}`, borderRadius: 8,
      background: loading ? 'var(--raised)' : wash,
    }}>
      {loading
        ? <Spinner size={14} />
        : <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, animation: empty ? 'sc-pulse-dot 1.6s var(--ease) infinite' : 'none' }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: loading ? 'var(--fg-soft)' : c }}>{symbol}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{role}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {!loading && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 500, color: empty ? 'var(--warn)' : 'var(--fg)' }}>{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>}
        {!loading && <Badge tone={empty ? 'warn' : 'ok'}>{empty ? 'empty' : 'ok'}</Badge>}
      </div>
    </div>
  )
}

export function BalanceStep({ locked, balance }: { locked: boolean; balance: BalanceState }) {
  if (locked) return <LockedNotice>Switch to the Gnosis chain to read your wallet's xDAI balance.</LockedNotice>
  const xdai = balance.xdai ?? 0
  const needsGas = !balance.isLoading && xdai === 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TokenRow symbol="xDAI" role="gas for transactions from this wallet" amount={xdai} loading={balance.isLoading} />
      <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', lineHeight: 1.5, paddingLeft: 2 }}>
        Your connected wallet signs and pays gas for its own transactions — separate from the wallet running your Bee node.
      </div>
      {needsGas && (
        <PrimaryBtn onClick={() => window.open('https://www.gnosisfaucet.com', '_blank', 'noopener')} block>
          get xDAI
        </PrimaryBtn>
      )}
    </div>
  )
}
