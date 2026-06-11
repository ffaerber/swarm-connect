import { STYLES } from '../constants'

interface StepLabelProps {
  step: number
  done?: boolean
  children: string
}

/** Numbered section heading that signals the setup sequence (1 → 2 → 3). */
export function StepLabel({ step, done = false, children }: StepLabelProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        fontSize: 11, fontWeight: 700, lineHeight: 1,
        color: '#fff',
        background: done ? STYLES.colors.success : STYLES.colors.stepActive,
      }}>
        {done ? '✓' : step}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: STYLES.colors.muted,
      }}>
        {children}
      </span>
    </div>
  )
}
