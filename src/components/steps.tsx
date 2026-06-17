import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  useAccount, useConnect, useDisconnect, useSwitchChain,
  useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useReadContract,
} from 'wagmi'
import { gnosis } from 'wagmi/chains'
import { erc20Abi, parseEther, parseUnits } from 'viem'
import type { BaseError } from 'viem'
import {
  GNOSIS_CHAIN_ID, BZZ_TOKEN_ADDRESS, BZZ_DECIMALS,
  DEFAULT_FUND_XDAI, DEFAULT_FUND_XBZZ,
} from '../constants'
import type { BalanceState, BeeNodeStatus, NodeWalletState, PostageStamp, PostageStampsState } from '../types'
import { Spinner, Badge, StatusRow, GhostBtn, PrimaryBtn, LockedNotice } from './atoms'

function txError(error: Error | null): string | undefined {
  if (!error) return undefined
  return (error as BaseError).shortMessage ?? error.message
}

/* ---------- STEP 1 — wallet -------------------------------- */

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

export function WalletStep({ isConnected, address }: {
  isConnected: boolean; address?: string
}) {
  const { connectors, connect, isPending, variables, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { connector: activeConnector } = useAccount()

  if (isConnected) {
    return (
      <StatusRow tone="ok"
        title={`Wallet connected${activeConnector ? ` · ${activeConnector.name}` : ''}`}
        sub={address}>
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

/* ---------- STEP 2 — network ------------------------------- */

export function NetworkStep({ locked, isOnGnosis, chainId }: {
  locked: boolean; isOnGnosis: boolean; chainId?: number
}) {
  const { switchChain, isPending, error } = useSwitchChain()
  if (locked) return <LockedNotice>Connect a wallet to verify it is on the Gnosis chain.</LockedNotice>
  if (isOnGnosis) {
    return (
      <StatusRow tone="ok" title="Gnosis chain" sub={`wallet reports chain id ${chainId}`}>
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
      {error && (
        <div style={{ fontSize: 12, color: 'var(--bad)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
          switch failed: {txError(error)}
        </div>
      )}
    </div>
  )
}

/* ---------- STEP 3 — balance ------------------------------- */

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
      <div style={hintStyle}>
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

/* ---------- STEP 4 — Bee node ------------------------------ */

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
  if (!node.error) {
    // Neutral state: never probed, or explicitly disconnected.
    return (
      <StatusRow tone="flat" title="Node not connected" sub={beeApiUrl}>
        <GhostBtn onClick={node.check}>connect</GhostBtn>
      </StatusRow>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StatusRow tone="bad" title={node.isCorsBlocked ? 'Node blocks this origin' : 'Node unreachable'} sub={node.error} />
      {node.isCorsBlocked ? (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>allow this site in the node config:</span>
          <code style={codeChip}>cors-allowed-origins: ["*"]</code>
          <span>then restart the node</span>
          <GhostBtn onClick={node.check}>retry</GhostBtn>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>start one with</span>
          <code style={codeChip}>bee start</code>
          <GhostBtn onClick={node.check}>retry</GhostBtn>
        </div>
      )}
    </div>
  )
}

const codeChip: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11.5, background: 'var(--bunker)',
  border: '1px solid var(--line)', color: 'var(--accent-bright)', padding: '2px 7px', borderRadius: 3,
}

/* ---------- STEP 5 — node wallet (create mode) ------------- */

function FundRow({ symbol, value, onChange, onSend, pending, confirming, done, disabled }: {
  symbol: string; value: string; onChange: (v: string) => void; onSend: () => void
  pending: boolean; confirming: boolean; done: boolean; disabled: boolean
}) {
  const busy = pending || confirming
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', borderRadius: 6, border: '1px solid var(--line-2)',
        background: busy || disabled ? 'var(--bunker)' : 'var(--surface)',
      }}>
        <input inputMode="decimal" value={value} disabled={busy || disabled} spellCheck={false}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 12.5, padding: '8px 0',
          }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0 }}>{symbol}</span>
      </div>
      {done
        ? <Badge tone="ok">sent</Badge>
        : (
          <GhostBtn onClick={onSend} disabled={busy || disabled || !value.trim()}>
            {pending ? 'sign…' : confirming ? 'mining…' : `send ${symbol.toLowerCase()}`}
          </GhostBtn>
        )}
    </div>
  )
}

function FundNodeForm({ to, onSettled }: { to: string; onSettled: () => void }) {
  const [xdaiAmount, setXdaiAmount] = useState(DEFAULT_FUND_XDAI)
  const [bzzAmount, setBzzAmount] = useState(DEFAULT_FUND_XBZZ)
  const { address } = useAccount()

  const xdaiTx = useSendTransaction()
  const bzzTx = useWriteContract()
  const xdaiReceipt = useWaitForTransactionReceipt({ hash: xdaiTx.data })
  const bzzReceipt = useWaitForTransactionReceipt({ hash: bzzTx.data })

  // Re-read the node wallet once a transfer lands.
  useEffect(() => { if (xdaiReceipt.isSuccess) onSettled() }, [xdaiReceipt.isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (bzzReceipt.isSuccess) onSettled() }, [bzzReceipt.isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  // The user's wallet needs xBZZ before it can forward any to the node.
  const userBzz = useReadContract({
    abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: GNOSIS_CHAIN_ID, query: { enabled: !!address },
  })
  const userBzzAmount = userBzz.data !== undefined ? Number(userBzz.data) / 10 ** BZZ_DECIMALS : undefined
  const userHasBzz = (userBzzAmount ?? 0) > 0

  const sendXdai = () => {
    const value = safeParse(() => parseEther(xdaiAmount.trim()))
    if (value !== undefined) xdaiTx.sendTransaction({ to: to as `0x${string}`, value, chainId: GNOSIS_CHAIN_ID })
  }
  const sendBzz = () => {
    const value = safeParse(() => parseUnits(bzzAmount.trim(), BZZ_DECIMALS))
    if (value !== undefined) {
      bzzTx.writeContract({
        abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'transfer',
        args: [to as `0x${string}`, value], chainId: GNOSIS_CHAIN_ID,
      })
    }
  }

  const error = txError(xdaiTx.error) ?? txError(bzzTx.error)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={hintStyle}>
        One-time top-up — sent from your connected wallet to the node wallet:
      </div>
      <FundRow symbol="xDAI" value={xdaiAmount} onChange={setXdaiAmount} onSend={sendXdai}
        pending={xdaiTx.isPending} confirming={xdaiReceipt.isLoading && !!xdaiTx.data}
        done={xdaiReceipt.isSuccess} disabled={false} />
      <FundRow symbol="xBZZ" value={bzzAmount} onChange={setBzzAmount} onSend={sendBzz}
        pending={bzzTx.isPending} confirming={bzzReceipt.isLoading && !!bzzTx.data}
        done={bzzReceipt.isSuccess} disabled={!userHasBzz} />
      {userBzzAmount !== undefined && (
        <div style={{ ...hintStyle, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>
            your wallet holds{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: userHasBzz ? 'var(--fg-soft)' : 'var(--warn)' }}>
              {userBzzAmount.toLocaleString('en-US', { maximumFractionDigits: 4 })} xBZZ
            </span>
          </span>
          {!userHasBzz && (
            <GhostBtn onClick={() => window.open('https://www.ethswarm.org/get-bzz', '_blank', 'noopener')}>get xBZZ</GhostBtn>
          )}
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: 'var(--bad)', fontFamily: 'var(--font-mono)' }}>{error}</div>}
    </div>
  )
}

function safeParse<T>(parse: () => T): T | undefined {
  try { return parse() } catch { return undefined }
}

export function NodeWalletStep({ locked, nodeWallet }: { locked: boolean; nodeWallet: NodeWalletState }) {
  if (locked) return <LockedNotice>Bring your Bee node online to read its wallet.</LockedNotice>

  if (nodeWallet.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatusRow tone="bad" title="Could not read node wallet" sub={nodeWallet.error} />
        <GhostBtn onClick={nodeWallet.refresh}>retry</GhostBtn>
      </div>
    )
  }

  const loading = nodeWallet.isLoading && nodeWallet.xdai === undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TokenRow symbol="xDAI" role="gas for the node's own transactions" amount={nodeWallet.xdai ?? 0} loading={loading} />
      <TokenRow symbol="xBZZ" role="pays for postage stamps" amount={nodeWallet.xbzz ?? 0} loading={loading} />
      <div style={hintStyle}>
        The Bee node has its own wallet
        {nodeWallet.address && (
          <>{' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>
            {nodeWallet.address.slice(0, 8)}…{nodeWallet.address.slice(-6)}
          </span></>
        )}
        {' '}— it buys and renews postage stamps on chain.
      </div>
      {!nodeWallet.isFunded && nodeWallet.address && (
        <FundNodeForm to={nodeWallet.address} onSettled={nodeWallet.refresh} />
      )}
    </div>
  )
}

/* ---------- STEP 6 — postage stamp ------------------------- */

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

export function StampStep({ stamps, locked, lockedHint }: {
  stamps: PostageStampsState; locked: boolean; lockedHint: string
}) {
  if (locked) return <LockedNotice>{lockedHint}</LockedNotice>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stamps.stamps.length === 0 && (
        <>
          <LockedNotice>No postage stamps on this node yet — once the dApp buys one it will appear here.</LockedNotice>
          <GhostBtn onClick={stamps.fetchStamps}>refresh</GhostBtn>
        </>
      )}
      {stamps.stamps.map(s => (
        <StampCard key={s.batchID} stamp={s}
          selected={stamps.selectedStampId === s.batchID}
          onSelect={() => stamps.selectStamp(s.batchID)} />
      ))}
    </div>
  )
}

const hintStyle: CSSProperties = {
  fontSize: 11.5, color: 'var(--fg-faint)', lineHeight: 1.5, paddingLeft: 2,
}
