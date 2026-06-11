import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { STYLES } from '../../constants'

export function WalletStep() {
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()

  if (isConnected && address) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🦊</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, color: STYLES.colors.text }}>Wallet</h3>
        <div style={{ background: STYLES.colors.successLight, border: `1px solid ${STYLES.colors.success}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ color: STYLES.colors.success, fontWeight: 600, marginBottom: 4 }}>✓ Wallet connected</div>
          <div style={{ color: STYLES.colors.muted, fontSize: 13, fontFamily: 'monospace' }}>{shortAddress(address)}</div>
        </div>
        <button
          onClick={() => disconnect()}
          style={{ background: 'none', border: `1px solid ${STYLES.colors.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: STYLES.colors.muted }}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🦊</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, color: STYLES.colors.text }}>Connect Wallet</h3>
      <p style={{ margin: '0 0 24px', color: STYLES.colors.muted, fontSize: 14 }}>
        Connect your wallet to interact with the Gnosis chain and Swarm.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {connectors.map(connector => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', border: `1px solid ${STYLES.colors.border}`,
              borderRadius: 8, cursor: isPending ? 'not-allowed' : 'pointer',
              background: '#fff', fontSize: 15, fontWeight: 500, color: STYLES.colors.text,
              opacity: isPending ? 0.6 : 1, transition: 'border-color 0.15s',
            }}
            onMouseOver={e => { if (!isPending) e.currentTarget.style.borderColor = STYLES.colors.primary }}
            onMouseOut={e => { e.currentTarget.style.borderColor = STYLES.colors.border }}
          >
            <span>{connector.icon ? <img src={connector.icon} width={20} height={20} alt="" /> : '🔗'}</span>
            <span>{connector.name}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: STYLES.colors.error, fontSize: 13 }}>
          {error.message}
        </div>
      )}
    </div>
  )
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
