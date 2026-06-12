/**
 * Design tokens + keyframes for the Swarm Connect widget.
 *
 * Tokens are scoped to the `.swarm-connect` class so they don't leak globally;
 * the button, modal backdrop and dialog all carry that class, and every inner
 * element reads the values via `var(--…)` inheritance. Keyframes are prefixed
 * `sc-` to avoid clashing with a host app's animations.
 */
export const SWARM_CSS = `
.swarm-connect {
  --void:#060809; --bunker:#0b0f12; --surface:#121821; --raised:#18202b; --raised-2:#1e2833;
  --line:rgba(255,255,255,0.07); --line-2:rgba(255,255,255,0.12); --line-orange:rgba(255,107,0,0.45);
  --fg:#f3f5f7; --fg-soft:#c3cad3; --fg-muted:#7d8794; --fg-faint:#565f6b;
  --accent:#ff6b00; --accent-bright:#ff8a33; --accent-deep:#d65500; --accent-ink:#1a0e02;
  --accent-glow:rgba(255,107,0,0.40); --accent-wash:rgba(255,107,0,0.10);
  --ok:#36c46a; --ok-wash:rgba(54,196,106,0.12); --ok-line:rgba(54,196,106,0.40);
  --bad:#ff5640; --bad-wash:rgba(255,86,64,0.12); --bad-line:rgba(255,86,64,0.38);
  --warn:#f0a83a; --warn-wash:rgba(240,168,58,0.12); --warn-line:rgba(240,168,58,0.40);
  --font-display:'Space Grotesk',system-ui,sans-serif;
  --font-body:'Inter',system-ui,sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --ease:cubic-bezier(0.22,0.61,0.36,1);
}
@keyframes sc-spin { to { transform: rotate(360deg); } }
@keyframes sc-pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.82); } }
@keyframes sc-modal-in { from { opacity:0; transform:translate(-50%, calc(-50% + 10px)) scale(.985); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
@keyframes sc-backdrop-in { from { opacity:0; } to { opacity:1; } }
@keyframes sc-step-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
.sc-scroll::-webkit-scrollbar { width:8px; }
.sc-scroll::-webkit-scrollbar-thumb { background:var(--line-2); border-radius:8px; border:2px solid transparent; background-clip:padding-box; }
.sc-scroll::-webkit-scrollbar-track { background:transparent; }
`

let injected = false

/** Injects {@link SWARM_CSS} into <head> exactly once per document. */
export function ensureSwarmStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const el = document.createElement('style')
  el.dataset.swarmConnect = ''
  el.textContent = SWARM_CSS
  document.head.appendChild(el)
}
