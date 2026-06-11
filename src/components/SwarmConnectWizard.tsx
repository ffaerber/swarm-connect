import React, { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { GNOSIS_CHAIN_ID, STYLES } from '../constants'
import type { BeeNodeStatus, WizardStep } from '../types'
import { BeeNodeStep } from './steps/BeeNodeStep'
import { WalletStep } from './steps/WalletStep'
import { NetworkStep } from './steps/NetworkStep'

interface SwarmConnectWizardProps {
  onClose: () => void
  beeNodeStatus: BeeNodeStatus
  onCheckBeeNode: () => void
  beeApiUrl: string
}

const STEPS: WizardStep[] = ['bee', 'wallet', 'network']

const STEP_LABELS: Record<WizardStep, string> = {
  bee: 'Bee Node',
  wallet: 'Wallet',
  network: 'Network',
  done: 'Done',
}

export function SwarmConnectWizard({
  onClose,
  beeNodeStatus,
  onCheckBeeNode,
  beeApiUrl,
}: SwarmConnectWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('bee')
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const stepIndex = STEPS.indexOf(currentStep)
  const isLastStep = stepIndex === STEPS.length - 1

  function canAdvance() {
    if (currentStep === 'bee') return beeNodeStatus.isRunning
    if (currentStep === 'wallet') return isConnected
    if (currentStep === 'network') return chainId === GNOSIS_CHAIN_ID
    return false
  }

  function stepStatus(step: WizardStep): 'done' | 'active' | 'inactive' {
    const idx = STEPS.indexOf(step)
    if (idx < stepIndex) return 'done'
    if (idx === stepIndex) return 'active'
    return 'inactive'
  }

  function handleNext() {
    if (isLastStep) {
      onClose()
    } else {
      setCurrentStep(STEPS[stepIndex + 1])
    }
  }

  function handleBack() {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1])
  }

  const allDone = beeNodeStatus.isRunning && isConnected && chainId === GNOSIS_CHAIN_ID

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: STYLES.colors.overlay,
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999, background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        width: 420, maxWidth: 'calc(100vw - 32px)',
        animation: 'fadeIn 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: STYLES.colors.text }}>Swarm Connect</div>
            <div style={{ fontSize: 13, color: STYLES.colors.muted, marginTop: 2 }}>
              {allDone ? 'All systems ready!' : 'Complete the steps below to connect'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: STYLES.colors.muted, fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, i) => {
            const status = stepStatus(step)
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: status === 'done' ? STYLES.colors.stepDone : status === 'active' ? STYLES.colors.stepActive : STYLES.colors.stepInactive,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, transition: 'background 0.3s',
                  }}>
                    {status === 'done' ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color: status === 'inactive' ? STYLES.colors.muted : STYLES.colors.text, fontWeight: status === 'active' ? 600 : 400 }}>
                    {STEP_LABELS[step]}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 2, height: 2, background: stepIndex > i ? STYLES.colors.stepDone : STYLES.colors.stepInactive, marginBottom: 18, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step content */}
        <div style={{ padding: '24px', minHeight: 200 }}>
          {currentStep === 'bee' && (
            <BeeNodeStep status={beeNodeStatus} onCheck={onCheckBeeNode} beeApiUrl={beeApiUrl} />
          )}
          {currentStep === 'wallet' && <WalletStep />}
          {currentStep === 'network' && <NetworkStep />}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${STYLES.colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            style={{
              background: 'none', border: `1px solid ${STYLES.colors.border}`,
              borderRadius: 6, padding: '8px 18px', cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: 14, color: STYLES.colors.muted, opacity: stepIndex === 0 ? 0.4 : 1,
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{
              background: canAdvance() ? STYLES.colors.primary : STYLES.colors.stepInactive,
              color: '#fff', border: 'none', borderRadius: 6,
              padding: '8px 22px', cursor: canAdvance() ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
            }}
            onMouseOver={e => { if (canAdvance()) e.currentTarget.style.background = STYLES.colors.primaryHover }}
            onMouseOut={e => { e.currentTarget.style.background = canAdvance() ? STYLES.colors.primary : STYLES.colors.stepInactive }}
          >
            {allDone && isLastStep ? '✓ Done' : isLastStep ? 'Finish' : 'Continue →'}
          </button>
        </div>
      </div>
    </>
  )
}
