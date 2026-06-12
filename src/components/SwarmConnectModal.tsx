import { useEffect } from 'react'
import { useAccount, useChainId, useBalance } from 'wagmi'
import { GNOSIS_CHAIN_ID } from '../constants'
import { ensureSwarmStyles } from '../theme'
import { useNodeWallet } from '../hooks/useNodeWallet'
import type { BeeNodeStatus, NodeWalletState, PostageStampsState, StampMode } from '../types'
import { BeeMark, StepLabel, StepDots, LockedNotice } from './atoms'
import { NodeUrlInput, BeeNodeStep, StampStep, WalletStep, NetworkStep, BalanceStep, NodeWalletStep } from './steps'

interface SwarmConnectModalProps {
  onClose: () => void
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
  /** 'create' adds the node-wallet funding step and the buy-stamp form. */
  stampMode?: StampMode
  /** Pass the instance from useSwarmConnect to share state; created internally otherwise. */
  nodeWallet?: NodeWalletState
}

export function SwarmConnectModal({
  onClose, beeNode, stamps, beeApiUrl, setBeeApiUrl,
  stampMode = 'select', nodeWallet: nodeWalletProp,
}: SwarmConnectModalProps) {
  ensureSwarmStyles()
  const create = stampMode === 'create'

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isOnGnosis = chainId === GNOSIS_CHAIN_ID
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address, chainId: GNOSIS_CHAIN_ID, query: { enabled: isConnected },
  })
  const xdai = balanceData ? Number(balanceData.formatted) : undefined
  const hasGas = isOnGnosis && !!balanceData && balanceData.value > 0n
  const balance = { xdai, isLoading: isConnected && balanceLoading, hasGas }

  // Hooks must be unconditional — fall back to a local instance when the
  // caller doesn't share theirs (only consulted in create mode).
  const ownNodeWallet = useNodeWallet(beeApiUrl)
  const nodeWallet = nodeWalletProp ?? ownNodeWallet

  // Probe the node on open / URL change, then load stamps (and, in create
  // mode, the node's wallet) once it's online.
  useEffect(() => { beeNode.check() }, [beeApiUrl]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!beeNode.isRunning) return
    stamps.fetchStamps()
    if (create) nodeWallet.refresh()
  }, [beeNode.isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  // Gated chain: wallet → network → balance → node → (node wallet) → stamp.
  const walletState = isConnected ? 'done' : 'active'
  const networkState = !isConnected ? 'locked' : isOnGnosis ? 'done' : 'active'
  const balanceState = !isOnGnosis ? 'locked' : hasGas ? 'done' : 'active'
  const nodeState = !hasGas ? 'locked' : beeNode.isRunning ? 'done' : 'active'
  const nodeWalletState = nodeState !== 'done' ? 'locked' : nodeWallet.isFunded ? 'done' : 'active'
  const stampUnlocked = create ? nodeWalletState === 'done' : nodeState === 'done'
  const stampState = !stampUnlocked ? 'locked' : stamps.selectedStampId ? 'done' : 'active'

  const stampStepNo = create ? 6 : 5
  const fullyConnected = stampState === 'done'
  const dotStates = [
    isConnected, isOnGnosis, hasGas, beeNode.isRunning,
    ...(create ? [nodeWallet.isFunded] : []),
    !!stamps.selectedStampId,
  ]
  const trail = create
    ? 'wallet · chain · gas · node · fund · stamp'
    : 'wallet · chain · gas · node · stamp'

  return (
    <>
      <div className="swarm-connect" onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(4,6,8,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'sc-backdrop-in .2s var(--ease)',
      }} />
      <div className="swarm-connect" role="dialog" aria-label="Connect to Swarm" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9999, width: 440, maxWidth: 'calc(100vw - 28px)',
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
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--fg)', lineHeight: 1.1 }}>Connect to Swarm</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--fg-muted)', marginTop: 3 }}>
                  // {fullyConnected ? 'ready' : trail}
                </div>
              </div>
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

        {/* body */}
        <div className="sc-scroll" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '62vh', overflowY: 'auto' }}>
          <section style={{ animation: 'sc-step-in .3s var(--ease)' }}>
            <StepLabel step={1} state={walletState} hint={isConnected ? 'linked' : null}>Wallet</StepLabel>
            <WalletStep isConnected={isConnected} address={address} />
          </section>

          <section style={{ opacity: networkState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={2} state={networkState} hint={isConnected ? (isOnGnosis ? 'gnosis' : 'wrong net') : null}>Network chain</StepLabel>
            <NetworkStep locked={networkState === 'locked'} isOnGnosis={isOnGnosis} chainId={chainId} />
          </section>

          <section style={{ opacity: balanceState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={3} state={balanceState} hint={isOnGnosis ? (hasGas ? 'funded' : 'low') : null}>Balance</StepLabel>
            <BalanceStep locked={balanceState === 'locked'} balance={balance} />
          </section>

          <section style={{ opacity: nodeState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={4} state={nodeState} hint={beeNode.isRunning ? beeNode.version : null}>Bee node</StepLabel>
            {nodeState === 'locked'
              ? <LockedNotice>Top up xDAI gas to unlock the Bee node connection.</LockedNotice>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <NodeUrlInput value={beeApiUrl} disabled={beeNode.isChecking} onSubmit={setBeeApiUrl} />
                  <BeeNodeStep node={beeNode} beeApiUrl={beeApiUrl} />
                </div>
              )}
          </section>

          {create && (
            <section style={{ opacity: nodeWalletState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
              <StepLabel step={5} state={nodeWalletState}
                hint={nodeWalletState === 'locked' ? null : nodeWallet.isFunded ? 'funded' : 'top up'}>Node wallet</StepLabel>
              <NodeWalletStep locked={nodeWalletState === 'locked'} nodeWallet={nodeWallet} />
            </section>
          )}

          <section style={{ opacity: stampState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={stampStepNo} state={stampState}
              hint={stamps.selectedStampId ? '1 selected' : stampUnlocked ? `${stamps.stamps.length} found` : null}>Postage stamp</StepLabel>
            <StampStep stamps={stamps} locked={stampState === 'locked'} canCreate={create}
              lockedHint={create
                ? 'Fund the node wallet to manage postage stamps.'
                : 'Bring a node online to load its postage stamps.'} />
          </section>
        </div>

        {/* footer ribbon */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: fullyConnected ? 'var(--accent-wash)' : 'var(--bunker)', transition: 'background .3s',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: fullyConnected ? 'var(--accent-bright)' : 'var(--fg-muted)' }}>
            {fullyConnected ? '// fully connected — ready to upload' : '// gated · each step unlocks the next'}
          </span>
          {fullyConnected
            ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', color: 'var(--ok)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 8px var(--ok)' }} />done</span>
            : <StepDots states={dotStates} />}
        </div>
      </div>
    </>
  )
}
