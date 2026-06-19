import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAccount, useBalance, useDisconnect, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { GNOSIS_CHAIN_ID, DEFAULT_REQUIREMENTS, BZZ_TOKEN_ADDRESS, BZZ_DECIMALS } from '../constants'
import { ensureSwarmStyles } from '../theme'
import { useNodeWallet } from '../hooks/useNodeWallet'
import type { BeeNodeStatus, NodeWalletState, PostageStampsState, SwarmConnectRequirements } from '../types'
import { BeeMark, StepLabel, StepDots, LockedNotice } from './atoms'
import { NodeUrlInput, BeeNodeStep, StampStep, WalletStep, NetworkStep, BalanceStep, NodeWalletStep } from './steps'

type StepState = 'locked' | 'active' | 'done'

interface Step {
  key: string
  /** 'wallet' = the user's wallet column; 'node' = the Bee node column. */
  col: 'wallet' | 'node'
  title: string
  state: StepState
  hint: ReactNode
  body: ReactNode
}

interface SwarmConnectModalProps {
  onClose: () => void
  beeNode: BeeNodeStatus & { check: () => void; disconnect: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  /** Per-dApp requirements; disabled ones drop their step. See SwarmConnectRequirements. */
  requirements?: SwarmConnectRequirements
  /** Pass the instance from useSwarmConnect to share state; created internally otherwise. */
  nodeWallet?: NodeWalletState
}

export function SwarmConnectModal({
  onClose, beeNode, stamps, beeApiUrl, setBeeApiUrl,
  requirements, nodeWallet: nodeWalletProp,
}: SwarmConnectModalProps) {
  ensureSwarmStyles()
  const req = { ...DEFAULT_REQUIREMENTS, ...requirements }

  // useAccount().chainId is the wallet's actual chain (undefined when
  // disconnected) — useChainId() would report the config's default chain even
  // with no wallet, falsely unlocking the network/balance steps.
  const { address, isConnected, chainId } = useAccount()
  const isOnGnosis = isConnected && chainId === GNOSIS_CHAIN_ID
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address, chainId: GNOSIS_CHAIN_ID, query: { enabled: isConnected },
  })
  const xdai = balanceData ? Number(balanceData.formatted) : undefined
  const hasGas = isOnGnosis && !!balanceData && balanceData.value > 0n

  const { data: bzzData, isLoading: bzzLoading } = useReadContract({
    abi: erc20Abi, address: BZZ_TOKEN_ADDRESS, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: GNOSIS_CHAIN_ID,
    query: { enabled: isConnected && req.xbzz },
  })
  const bzz = bzzData !== undefined ? Number(bzzData) / 10 ** BZZ_DECIMALS : undefined
  const hasBzz = isOnGnosis && (bzz ?? 0) > 0
  const balance = {
    xdai, bzz,
    isLoading: isConnected && (balanceLoading || (req.xbzz && bzzLoading)),
    hasGas, hasBzz,
  }

  // Hooks must be unconditional — fall back to a local instance when the
  // caller doesn't share theirs (only consulted when req.nodeWallet is on).
  const ownNodeWallet = useNodeWallet(beeApiUrl)
  const nodeWallet = nodeWalletProp ?? ownNodeWallet

  // Probe the node on open / URL change, then load stamps (and, if required,
  // the node's wallet) once it's online. Skip the mount-time probe when the
  // node is already known-running: check() momentarily resets isRunning,
  // which would needlessly re-lock all the steps on reopen.
  const probedOnce = useRef(false)
  useEffect(() => {
    if (!probedOnce.current) {
      probedOnce.current = true
      if (beeNode.isRunning) return
    }
    beeNode.check()
  }, [beeApiUrl]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!beeNode.isRunning) return
    stamps.fetchStamps()
    if (req.nodeWallet) nodeWallet.refresh()
  }, [beeNode.isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  // Gated chain (disabled requirements are skipped). The Ethereum column must
  // be fully satisfied before the Swarm column unlocks:
  // wallet → network → [xDAI + xBZZ] → node → [node wallet] → [stamp]
  const gasOk = !req.xdai || hasGas
  const bzzOk = !req.xbzz || hasBzz
  const walletSideOk = isOnGnosis && gasOk && bzzOk
  const nodeFundOk = !req.nodeWallet || nodeWallet.isFunded
  const showBalance = req.xdai || req.xbzz

  const walletState: StepState = isConnected ? 'done' : 'active'
  const networkState: StepState = !isConnected ? 'locked' : isOnGnosis ? 'done' : 'active'
  const balanceState: StepState = !isOnGnosis ? 'locked' : (gasOk && bzzOk) ? 'done' : 'active'
  const nodeState: StepState = !walletSideOk ? 'locked' : beeNode.isRunning ? 'done' : 'active'
  const nodeWalletState: StepState = nodeState !== 'done' ? 'locked' : nodeWallet.isFunded ? 'done' : 'active'
  const stampState: StepState = !(nodeState === 'done' && nodeFundOk) ? 'locked'
    : stamps.selectedStampId ? 'done' : 'active'

  const fullyConnected =
    isConnected && isOnGnosis && beeNode.isRunning &&
    gasOk && bzzOk && nodeFundOk && (!req.postageStamp || !!stamps.selectedStampId)

  // Tear down the session (wallet AND bee node), then close the modal.
  const { disconnect: disconnectWallet } = useDisconnect()
  const disconnectAll = () => {
    disconnectWallet()
    beeNode.disconnect()
    onClose()
  }

  const steps: Step[] = [
    {
      key: 'wallet', col: 'wallet', title: 'Browser wallet', state: walletState,
      hint: isConnected ? 'linked' : null,
      body: <WalletStep isConnected={isConnected} address={address} />,
    },
    {
      key: 'network', col: 'wallet', title: 'Network chain', state: networkState,
      hint: isConnected ? (isOnGnosis ? 'gnosis' : 'wrong net') : null,
      body: <NetworkStep locked={networkState === 'locked'} isOnGnosis={isOnGnosis} chainId={chainId} />,
    },
    ...(showBalance ? [{
      key: 'balance', col: 'wallet' as const, title: 'Balance', state: balanceState,
      hint: !isOnGnosis ? null : (gasOk && bzzOk) ? 'ok' : 'low',
      body: <BalanceStep locked={balanceState === 'locked'} balance={balance} showXdai={req.xdai} showBzz={req.xbzz} />,
    }] : []),
    {
      key: 'node', col: 'node', title: 'Bee node', state: nodeState,
      hint: beeNode.isRunning ? beeNode.version : null,
      body: nodeState === 'locked'
        ? <LockedNotice>{showBalance
            ? 'Satisfy the wallet balance to unlock the Bee node connection.'
            : 'Switch to the Gnosis chain to unlock the Bee node connection.'}</LockedNotice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <NodeUrlInput value={beeApiUrl} disabled={beeNode.isChecking} onSubmit={setBeeApiUrl} />
            <BeeNodeStep node={beeNode} beeApiUrl={beeApiUrl} />
          </div>
        ),
    },
    ...(req.nodeWallet ? [{
      key: 'nodeWallet', col: 'node' as const, title: 'Bee wallet', state: nodeWalletState,
      hint: nodeWalletState === 'locked' ? null : nodeWallet.isFunded ? 'funded' : 'top up',
      body: <NodeWalletStep locked={nodeWalletState === 'locked'} nodeWallet={nodeWallet} />,
    }] : []),
    ...(req.postageStamp ? [{
      key: 'stamp', col: 'node' as const, title: 'Postage stamp', state: stampState,
      hint: stamps.selectedStampId ? '1 selected' : stampState !== 'locked' ? `${stamps.stamps.length} found` : null,
      body: <StampStep stamps={stamps} locked={stampState === 'locked'}
        lockedHint={req.nodeWallet
          ? 'Fund the Bee wallet to manage postage stamps.'
          : 'Bring a node online to load its postage stamps.'} />,
    }] : []),
  ]

  // Number steps in gating order, then split into the two columns.
  const numbered = steps.map((s, i) => ({ ...s, no: i + 1 }))
  const walletCol = numbered.filter(s => s.col === 'wallet')
  const nodeCol = numbered.filter(s => s.col === 'node')
  const renderStep = (s: Step & { no: number }) => (
    <section key={s.key} style={{ opacity: s.state === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
      <StepLabel step={s.no} state={s.state} hint={s.hint}>{s.title}</StepLabel>
      {s.body}
    </section>
  )

  return (
    <>
      <div className="swarm-connect" onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(4,6,8,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'sc-backdrop-in .2s var(--ease)',
      }} />
      <div className="swarm-connect" role="dialog" aria-label="Swarm Connect" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9999, width: 720, maxWidth: 'calc(100vw - 28px)',
        background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line-2)',
        boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,107,0,.08), 0 0 60px rgba(255,107,0,.08)',
        overflow: 'hidden', animation: 'sc-modal-in .26s var(--ease) forwards',
        fontFamily: 'var(--font-body)',
      }}>
        {/* header */}
        <div style={{ position: 'relative', padding: '18px 20px 16px', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 140% at 88% 0%, var(--accent-wash), transparent 70%)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <BeeMark size={30} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--fg)', lineHeight: 1.1 }}>Swarm Connect</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{
              background: 'transparent', border: '1px solid var(--line)', color: 'var(--fg-muted)',
              width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 18, lineHeight: 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-orange)'; e.currentTarget.style.color = 'var(--accent-bright)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--fg-muted)' }}>×</button>
          </div>
        </div>

        {/* body — two columns: your wallet (left) · the Bee node (right) */}
        <div className="sc-scroll" style={{ padding: 20, maxHeight: '64vh', overflowY: 'auto' }}>
          <div className="sc-cols">
            <div className="sc-col">
              <ColHeader label="Ethereum" sub="compute" />
              {walletCol.map(renderStep)}
            </div>
            <div className="sc-divider" />
            <div className="sc-col">
              <ColHeader label="Swarm" sub="storage" />
              {nodeCol.map(renderStep)}
            </div>
          </div>
        </div>

        {/* footer — split button when done, progress ribbon while connecting */}
        {fullyConnected ? (
          <FooterSplit onDisconnect={disconnectAll} onDone={onClose} />
        ) : (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bunker)', transition: 'background .3s',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: 'var(--fg-muted)' }}>
              // gated · each step unlocks the next
            </span>
            <StepDots states={steps.map(s => s.state === 'done')} />
          </div>
        )}
      </div>
    </>
  )
}

/** Column heading that names which wallet a column's balances belong to. */
function ColHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
        letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent-bright)',
      }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', marginTop: 4, letterSpacing: '.04em' }}>
        {sub}
      </div>
    </div>
  )
}

/**
 * Fully-connected footer: a 50/50 split button. Left tears down the session
 * (wallet + bee node), right confirms and closes the modal.
 */
function FooterSplit({ onDisconnect, onDone }: { onDisconnect: () => void; onDone: () => void }) {
  const [hL, setHL] = useState(false)
  const [hR, setHR] = useState(false)
  return (
    <div style={{ display: 'flex', borderTop: '1px solid var(--line)' }}>
      <button onClick={onDisconnect}
        onMouseEnter={() => setHL(true)} onMouseLeave={() => setHL(false)}
        style={{
          flex: '1 1 50%', minWidth: 0, padding: '13px 20px', cursor: 'pointer',
          background: hL ? 'var(--bad-wash)' : 'var(--bunker)',
          border: 'none', borderRight: '1px solid var(--line)',
          color: hL ? 'var(--bad)' : 'var(--fg-muted)',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          letterSpacing: '.1em', textTransform: 'uppercase',
          transition: 'all .15s var(--ease)', whiteSpace: 'nowrap',
        }}>
        disconnect
      </button>
      <button onClick={onDone}
        onMouseEnter={() => setHR(true)} onMouseLeave={() => setHR(false)}
        style={{
          flex: '1 1 50%', minWidth: 0, padding: '13px 20px', cursor: 'pointer',
          background: hR ? 'var(--ok-wash)' : 'var(--bunker)',
          border: 'none',
          color: 'var(--ok)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          letterSpacing: '.1em', textTransform: 'uppercase', transition: 'all .15s var(--ease)',
          whiteSpace: 'nowrap',
        }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 8px var(--ok)' }} />
          connected
        </span>
      </button>
    </div>
  )
}
