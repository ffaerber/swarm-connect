import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type Tone = 'ok' | 'bad' | 'warn'
type StepState = 'locked' | 'active' | 'done'

export function HexIcon({ size = 18, stroke = 'var(--accent)', glow = true, children }: {
  size?: number; stroke?: string; glow?: boolean; children: ReactNode
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      filter: glow ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

export function Spinner({ size = 15 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, display: 'inline-block',
      border: '2px solid rgba(255,255,255,.12)', borderTopColor: 'var(--accent)',
      borderRadius: '50%', animation: 'sc-spin .7s linear infinite',
    }} />
  )
}

export function Badge({ children, tone }: { children: ReactNode; tone: Tone }) {
  const map = {
    ok: { c: 'var(--ok)', b: 'var(--ok-line)', w: 'var(--ok-wash)' },
    bad: { c: 'var(--bad)', b: 'var(--bad-line)', w: 'var(--bad-wash)' },
    warn: { c: 'var(--warn)', b: 'var(--warn-line)', w: 'var(--warn-wash)' },
  }[tone]
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.04em',
      textTransform: 'uppercase', color: map.c, background: map.w,
      border: `1px solid ${map.b}`, borderRadius: 3, padding: '2px 6px', lineHeight: 1.3,
    }}>{children}</span>
  )
}

export function StatusRow({ tone, title, sub, children }: {
  tone: Tone | 'flat'; title?: string; sub?: string; children?: ReactNode
}) {
  const map = {
    ok: { b: 'var(--ok-line)', w: 'var(--ok-wash)', d: 'var(--ok)' },
    bad: { b: 'var(--bad-line)', w: 'var(--bad-wash)', d: 'var(--bad)' },
    warn: { b: 'var(--warn-line)', w: 'var(--warn-wash)', d: 'var(--warn)' },
    flat: { b: 'var(--line)', w: 'var(--raised)', d: 'var(--fg-muted)' },
  }[tone]
  const monoSub = !!sub && (sub.startsWith('0x') || sub.includes('localhost') || sub.includes('http'))
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', border: `1px solid ${map.b}`, borderRadius: 8, background: map.w,
    }}>
      {tone !== 'flat' && (
        <span style={{
          width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: map.d,
          boxShadow: `0 0 8px ${map.d}`,
          animation: tone === 'warn' ? 'sc-pulse-dot 1.6s var(--ease) infinite' : 'none',
        }} />
      )}
      <div style={{ minWidth: 0 }}>
        {title && <div style={{ fontWeight: 600, fontSize: 13.5, color: tone === 'flat' ? 'var(--fg-soft)' : map.d }}>{title}</div>}
        {sub && <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2, fontFamily: monoSub ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{sub}</div>}
      </div>
      {children && <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{children}</div>}
    </div>
  )
}

export function GhostBtn({ children, onClick, disabled }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean
}) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.04em',
        background: 'transparent',
        border: `1px solid ${h && !disabled ? 'var(--line-orange)' : 'var(--line-2)'}`,
        color: disabled ? 'var(--fg-faint)' : h ? 'var(--accent-bright)' : 'var(--fg-soft)',
        borderRadius: 4, padding: '7px 14px', cursor: disabled ? 'default' : 'pointer',
        transition: 'all .15s var(--ease)', opacity: disabled ? .5 : 1,
      }}>{children}</button>
  )
}

export function PrimaryBtn({ children, onClick, pending, block, style }: {
  children: ReactNode; onClick?: () => void; pending?: boolean; block?: boolean; style?: CSSProperties
}) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={pending}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '.06em',
        textTransform: 'uppercase', width: block ? '100%' : 'auto',
        background: 'var(--accent)', color: 'var(--accent-ink)',
        border: 'none', borderRadius: 4, padding: '11px 20px', cursor: pending ? 'default' : 'pointer',
        boxShadow: h ? '0 0 24px var(--accent-glow)' : '0 0 14px var(--accent-glow)',
        transform: h ? 'translateY(-1px)' : 'none', transition: 'all .15s var(--ease)',
        opacity: pending ? .8 : 1, whiteSpace: 'nowrap', ...style,
      }}>{children}</button>
  )
}

export function LockedNotice({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      border: '1px dashed var(--line-2)', borderRadius: 8, background: 'var(--bunker)',
    }}>
      <HexIcon size={15} stroke="var(--fg-faint)" glow={false}>
        <rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </HexIcon>
      <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{children}</span>
    </div>
  )
}

/** Numbered, gated step header with a hex badge. */
export function StepLabel({ step, state, children, hint }: {
  step: number; state: StepState; children: ReactNode; hint?: ReactNode
}) {
  const done = state === 'done'
  const locked = state === 'locked'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, flexShrink: 0, fontFamily: 'var(--font-mono)',
        fontSize: 11, fontWeight: 600, lineHeight: 1,
        color: done ? 'var(--ok)' : locked ? 'var(--fg-faint)' : 'var(--accent-ink)',
        background: done ? 'var(--ok-wash)' : locked ? 'transparent' : 'var(--accent)',
        border: done ? '1px solid var(--ok-line)' : locked ? '1px solid var(--line-2)' : 'none',
        clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
        boxShadow: (!done && !locked) ? '0 0 14px var(--accent-glow)' : 'none',
      }}>{done ? '✓' : step}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.18em',
        color: locked ? 'var(--fg-faint)' : 'var(--fg-soft)',
      }}>{children}</span>
      {hint && (
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', color: 'var(--fg-faint)' }}>{hint}</span>
      )}
    </div>
  )
}

/** The bee / hex brand mark. */
export function BeeMark({ size = 30 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--accent)', color: 'var(--accent-ink)',
      clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
      boxShadow: '0 0 18px var(--accent-glow)',
    }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none"
        stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="5" ry="6.5" />
        <path d="M7 12h10M7 16h10M12 7.5V4M12 4l-2.5-1.5M12 4l2.5-1.5" />
      </svg>
    </span>
  )
}

/** Row of progress dots, one per gated step. */
export function StepDots({ states }: { states: boolean[] }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      {states.map((on, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: on ? 'var(--ok)' : 'var(--line-2)',
          boxShadow: on ? '0 0 8px var(--ok)' : 'none', transition: 'all .2s',
        }} />
      ))}
    </span>
  )
}
