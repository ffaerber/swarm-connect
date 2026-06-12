import { useEffect } from 'react'
import { useAccount, useChainId, useBalance } from 'wagmi'
import { GNOSIS_CHAIN_ID } from '../constants'
import { ensureSwarmStyles } from '../theme'
import type { BeeNodeStatus, PostageStampsState } from '../types'
import { BeeMark, StepLabel, StepDots } from './atoms'
import { NodeUrlInput, BeeNodeStep, StampStep, WalletStep, NetworkStep, BalanceStep } from './steps'

interface SwarmConnectModalProps {
  onClose: () => void
  beeNode: BeeNodeStatus & { check: () => void }
  stamps: PostageStampsState
  beeApiUrl: string
  setBeeApiUrl: (url: string) => void
}

export function SwarmConnectModal({ onClose, beeNode, stamps, beeApiUrl, setBeeApiUrl }: SwarmConnectModalProps) {
  ensureSwarmStyles()

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isOnGnosis = chainId === GNOSIS_CHAIN_ID
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address, chainId: GNOSIS_CHAIN_ID, query: { enabled: isConnected },
  })
  const xdai = balanceData ? Number(balanceData.formatted) : undefined
  const hasGas = isOnGnosis && !!balanceData && balanceData.value > 0n
  const balance = { xdai, isLoading: isConnected && balanceLoading, hasGas }

  // Probe the node on open / URL change, then load stamps once it's online.
  useEffect(() => { beeNode.check() }, [beeApiUrl]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (beeNode.isRunning) stamps.fetchStamps() }, [beeNode.isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  const swarmReady = beeNode.isRunning && !!stamps.selectedStampId
  const fullyConnected = swarmReady && isConnected && isOnGnosis && hasGas

  const nodeState = beeNode.isRunning ? 'done' : 'active'
  const stampState = !beeNode.isRunning ? 'locked' : stamps.selectedStampId ? 'done' : 'active'
  const walletState = !swarmReady ? 'locked' : isConnected ? 'done' : 'active'
  const networkState = !isConnected ? 'locked' : isOnGnosis ? 'done' : 'active'
  const balanceState = !isOnGnosis ? 'locked' : hasGas ? 'done' : 'active'

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
                  // {fullyConnected ? 'ready' : 'node · stamp · wallet · chain · balance'}
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
            <StepLabel step={1} state={nodeState} hint={beeNode.isRunning ? beeNode.version : null}>Bee node</StepLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NodeUrlInput value={beeApiUrl} disabled={beeNode.isChecking} onSubmit={setBeeApiUrl} />
              <BeeNodeStep node={beeNode} beeApiUrl={beeApiUrl} />
            </div>
          </section>

          <section style={{ opacity: stampState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={2} state={stampState}
              hint={stamps.selectedStampId ? '1 selected' : beeNode.isRunning ? `${stamps.stamps.length} found` : null}>Postage stamp</StepLabel>
            <StampStep stamps={stamps} locked={stampState === 'locked'} />
          </section>

          <section style={{ opacity: walletState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={3} state={walletState} hint={isConnected ? 'linked' : null}>Wallet</StepLabel>
            <WalletStep locked={!swarmReady} isConnected={isConnected} address={address} />
          </section>

          <section style={{ opacity: networkState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={4} state={networkState} hint={isConnected ? (isOnGnosis ? 'gnosis' : 'wrong net') : null}>Network chain</StepLabel>
            <NetworkStep locked={!isConnected} isOnGnosis={isOnGnosis} chainId={chainId} />
          </section>

          <section style={{ opacity: balanceState === 'locked' ? .55 : 1, transition: 'opacity .3s var(--ease)' }}>
            <StepLabel step={5} state={balanceState} hint={isOnGnosis ? (hasGas ? 'funded' : 'low') : null}>Balance</StepLabel>
            <BalanceStep locked={!isOnGnosis} balance={balance} />
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
            : <StepDots states={[beeNode.isRunning, !!stamps.selectedStampId, isConnected, isOnGnosis, hasGas]} />}
        </div>
      </div>
    </>
  )
}
