import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain } from 'wagmi'
import { gnosis } from 'wagmi/chains'
import { GNOSIS_CHAIN_ID, STYLES } from '../../constants'
import { StepLabel } from '../StepLabel'

export function WalletSection({ swarmReady }: { swarmReady: boolean }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  return (
    <section style={{ opacity: swarmReady ? 1 : 0.5 }}>
      <StepLabel step={3} done={isConnected && isOnGnosis}>Wallet</StepLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isConnected
          ? <ConnectedWallet address={address} />
          : swarmReady
            ? <WalletConnectors />
            : <SwarmRequiredNotice />}

        {isConnected && <NetworkCard isOnGnosis={isOnGnosis} chainId={chainId} />}
      </div>
    </section>
  )
}

function ConnectedWallet({ address }: { address?: string }) {
  const { disconnect } = useDisconnect()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px',
      border: `1px solid ${STYLES.colors.success}`, borderRadius: 8,
      background: STYLES.colors.successLight,
    }}>
      <div>
        <div style={{ fontWeight: 600, color: STYLES.colors.success, fontSize: 14 }}>Connected</div>
        {address && (
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: STYLES.colors.muted, marginTop: 2 }}>
            {`${address.slice(0, 8)}…${address.slice(-6)}`}
          </div>
        )}
      </div>
      <button
        onClick={() => disconnect()}
        style={{
          background: 'none', border: `1px solid ${STYLES.colors.border}`,
          borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
          fontSize: 12, color: STYLES.colors.muted,
        }}
      >
        Disconnect
      </button>
    </div>
  )
}

function SwarmRequiredNotice() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      border: `1px dashed ${STYLES.colors.border}`, borderRadius: 8,
      background: '#fafafa',
    }}>
      <span style={{ fontSize: 13 }}>🔒</span>
      <span style={{ fontSize: 13, color: STYLES.colors.muted }}>
        Complete steps 1 and 2 — a running Bee node and a selected postage stamp — to connect your wallet.
      </span>
    </div>
  )
}

function WalletConnectors() {
  const { connectors, connect, isPending, error } = useConnect()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {connectors.map(connector => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', border: `1.5px solid ${STYLES.colors.border}`,
            borderRadius: 8, cursor: isPending ? 'not-allowed' : 'pointer',
            background: '#fff', fontSize: 14, fontWeight: 500,
            color: STYLES.colors.text, opacity: isPending ? 0.6 : 1,
            transition: 'border-color 0.15s', width: '100%',
          }}
          onMouseOver={e => { if (!isPending) e.currentTarget.style.borderColor = STYLES.colors.primary }}
          onMouseOut={e => { e.currentTarget.style.borderColor = STYLES.colors.border }}
        >
          {connector.icon
            ? <img src={connector.icon} width={20} height={20} alt="" style={{ borderRadius: 4 }} />
            : <span style={{ width: 20, textAlign: 'center', fontSize: 16 }}>🔗</span>}
          {connector.name}
        </button>
      ))}
      {error && (
        <div style={{ fontSize: 12, color: STYLES.colors.error, marginTop: 2 }}>{error.message}</div>
      )}
    </div>
  )
}

function NetworkCard({ isOnGnosis, chainId }: { isOnGnosis: boolean; chainId?: number }) {
  const { switchChain, isPending, error } = useSwitchChain()

  if (isOnGnosis) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        border: `1px solid ${STYLES.colors.success}`, borderRadius: 8,
        background: STYLES.colors.successLight,
      }}>
        <span style={{ color: STYLES.colors.success, fontSize: 10, lineHeight: 1 }}>●</span>
        <div>
          <div style={{ fontWeight: 600, color: STYLES.colors.success, fontSize: 14 }}>Gnosis chain</div>
          <div style={{ fontSize: 12, color: STYLES.colors.muted }}>Chain ID {GNOSIS_CHAIN_ID}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        border: `1px solid ${STYLES.colors.warning}`, borderRadius: 8,
        background: STYLES.colors.warningLight,
      }}>
        <span style={{ color: STYLES.colors.warning, fontSize: 10, lineHeight: 1 }}>●</span>
        <div>
          <div style={{ fontWeight: 600, color: STYLES.colors.warning, fontSize: 14 }}>Wrong network</div>
          <div style={{ fontSize: 12, color: STYLES.colors.muted }}>
            Chain {chainId ?? '—'} active — Gnosis ({GNOSIS_CHAIN_ID}) required
          </div>
        </div>
      </div>
      <button
        onClick={() => switchChain({ chainId: gnosis.id })}
        disabled={isPending}
        style={{
          background: STYLES.colors.primary, color: '#fff', border: 'none',
          borderRadius: 6, padding: '9px 20px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 500, opacity: isPending ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {isPending ? 'Switching…' : 'Switch to Gnosis'}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: STYLES.colors.error }}>{error.message}</div>
      )}
    </div>
  )
}
