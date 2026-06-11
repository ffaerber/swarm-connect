import { useChainId, useSwitchChain } from 'wagmi'
import { gnosis } from 'wagmi/chains'
import { GNOSIS_CHAIN_ID, STYLES } from '../../constants'

export function NetworkStep() {
  const chainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()

  const isOnGnosis = chainId === GNOSIS_CHAIN_ID

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, color: STYLES.colors.text }}>Network</h3>
      <p style={{ margin: '0 0 24px', color: STYLES.colors.muted, fontSize: 14 }}>
        Swarm runs on the Gnosis chain. Make sure your wallet is connected to the right network.
      </p>

      {isOnGnosis ? (
        <div style={{ background: STYLES.colors.successLight, border: `1px solid ${STYLES.colors.success}`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: STYLES.colors.success, fontWeight: 600, marginBottom: 4 }}>✓ Connected to Gnosis</div>
          <div style={{ color: STYLES.colors.muted, fontSize: 13 }}>Chain ID {GNOSIS_CHAIN_ID}</div>
        </div>
      ) : (
        <div>
          <div style={{ background: STYLES.colors.warningLight, border: `1px solid ${STYLES.colors.warning}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ color: STYLES.colors.warning, fontWeight: 600, marginBottom: 4 }}>Wrong network</div>
            <div style={{ color: STYLES.colors.muted, fontSize: 13 }}>
              Currently on chain ID {chainId ?? '—'}. Gnosis chain required (ID {GNOSIS_CHAIN_ID}).
            </div>
          </div>
          <button
            onClick={() => switchChain({ chainId: gnosis.id })}
            disabled={isPending}
            style={{
              background: STYLES.colors.primary, color: '#fff', border: 'none',
              borderRadius: 6, padding: '10px 24px', cursor: isPending ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 500, opacity: isPending ? 0.7 : 1,
            }}
            onMouseOver={e => { if (!isPending) e.currentTarget.style.background = STYLES.colors.primaryHover }}
            onMouseOut={e => { e.currentTarget.style.background = STYLES.colors.primary }}
          >
            {isPending ? 'Switching…' : 'Switch to Gnosis'}
          </button>
          {error && (
            <div style={{ marginTop: 12, color: STYLES.colors.error, fontSize: 13 }}>{error.message}</div>
          )}
        </div>
      )}
    </div>
  )
}
