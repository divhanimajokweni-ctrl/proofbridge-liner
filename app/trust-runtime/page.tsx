'use client'

import { useEffect, useRef } from 'react'

/**
 * VVU Trust Runtime — Bayesian Safety Kernel
 * Full operational simulation with animated evidence colony.
 * Ant behavior differentiates by state; spawn rate scales with load.
 */

const STATE_META: Record<string, { label: string; tone: string; color: string }> = {
  IDLE:       { label: 'IDLE',       tone: 'idle',    color: '#4E545E' },
  INGESTING:  { label: 'INGESTING',  tone: 'pending', color: '#E8A23D' },
  ATTESTING:  { label: 'ATTESTING',  tone: 'pending', color: '#E8A23D' },
  VERIFYING:  { label: 'VERIFYING',  tone: 'pending', color: '#E8A23D' },
  COMMITTING: { label: 'COMMITTING', tone: 'pending', color: '#E8A23D' },
  SETTLED:    { label: 'SETTLED',    tone: 'verified',color: '#2FBF71' },
  HAZARD:     { label: 'HAZARD',     tone: 'hazard',  color: '#E5484D' },
}
const STATE_ORDER = ['IDLE', 'INGESTING', 'ATTESTING', 'VERIFYING', 'COMMITTING', 'SETTLED', 'HAZARD']

/* ------------------------------------------------------------------ */
/*  Styling — complete design system                                  */
/* ------------------------------------------------------------------ */
const CSS = `
:root {
  --bg-base: #07080A;
  --bg-raised: #0C0D10;
  --bg-overlay: #121418;
  --bg-inset: #030405;
  --border-hairline: #1A1C22;
  --border-focus: #3A404A;
  --text-primary: #E8EAED;
  --text-secondary: #8E949E;
  --text-tertiary: #4E545E;
  --text-disabled: #2A2E36;
  --state-verified: #2FBF71;
  --state-pending: #E8A23D;
  --state-hazard: #E5484D;
  --state-idle: #4E545E;
  --state-info: #4C8CF5;
  --font-display: 'Fragment Mono', 'JetBrains Mono', monospace;
  --font-body: 'Inter Tight', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;
  --r-sm: 3px; --r-md: 5px; --r-lg: 8px; --r-pill: 999px;
  --dur-micro: 80ms; --dur-state: 300ms; --dur-hazard: 500ms;
  --ease-state: cubic-bezier(0.2, 0.9, 0.3, 1);
  --ease-hazard: cubic-bezier(0.4, 0, 0.6, 1);
}
.trust-runtime * { box-sizing: border-box; margin: 0; padding: 0; }
.trust-runtime { height: 100%; background: var(--bg-base); color: var(--text-primary); font-family: var(--font-body); font-size: 12.5px; font-weight: 400; line-height: 1.5; -webkit-font-smoothing: antialiased; overflow: hidden; display: flex; flex-direction: column; }
.trust-runtime .app { display: flex; flex-direction: column; height: 100vh; max-height: 100vh; overflow: hidden; }
.trust-runtime .topbar { display: flex; align-items: center; justify-content: space-between; padding: 6px var(--s-4); border-bottom: 1px solid var(--border-hairline); background: var(--bg-base); flex-shrink: 0; gap: var(--s-3); flex-wrap: nowrap; z-index: 10; }
.trust-runtime .topbar-left { display: flex; align-items: center; gap: var(--s-3); flex-shrink: 0; }
.trust-runtime .brand-logo { display: flex; align-items: center; gap: 6px; }
.trust-runtime .brand-logo svg { width: 22px; height: 22px; flex-shrink: 0; }
.trust-runtime .brand-mark { font-family: var(--font-display); font-size: 12px; font-weight: 500; letter-spacing: -0.01em; color: var(--text-primary); display: flex; align-items: center; gap: 4px; }
.trust-runtime .brand-mark .sep { color: var(--text-tertiary); }
.trust-runtime .brand-mark .sub { color: var(--text-tertiary); font-size: 10px; font-weight: 400; }
.trust-runtime .brand-mark .brand-full { font-weight: 600; letter-spacing: 0.02em; color: var(--text-primary); }
.trust-runtime .data-mode-badge { display: inline-flex; align-items: center; gap: 5px; margin-left: var(--s-3); padding: 2px 8px; border-radius: var(--r-pill); border: 1px solid var(--border-hairline); font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-tertiary); background: var(--bg-inset); }
.trust-runtime .data-mode-badge .dm-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-tertiary); flex-shrink: 0; }
.trust-runtime .data-mode-badge[data-mode="connecting"] { color: var(--state-pending); border-color: rgba(232,162,61,0.35); }
.trust-runtime .data-mode-badge[data-mode="connecting"] .dm-dot { background: var(--state-pending); animation: dm-connecting 900ms ease-in-out infinite; }
@keyframes dm-connecting { 0%,100%{ opacity:0.35; transform:scale(0.8); } 50%{ opacity:1; transform:scale(1.15); } }
.trust-runtime .data-mode-badge[data-mode="live"] { color: var(--state-verified); border-color: rgba(47,191,113,0.35); }
.trust-runtime .data-mode-badge[data-mode="live"] .dm-dot { background: var(--state-verified); }
.trust-runtime .state-head { display: flex; align-items: center; gap: var(--s-2); margin-left: var(--s-3); padding-left: var(--s-3); border-left: 1px solid var(--border-hairline); }
.trust-runtime .status-dot { position: relative; display: inline-flex; width: 8px; height: 8px; flex-shrink: 0; }
.trust-runtime .status-dot::before { content: ""; width: 8px; height: 8px; border-radius: var(--r-pill); background: currentColor; display: block; transition: background var(--dur-state) var(--ease-state); }
.trust-runtime .status-dot.pulse::after { content: ""; position: absolute; inset: -2px; border-radius: var(--r-pill); background: currentColor; animation: pulse-ring var(--dur-hazard) var(--ease-hazard) infinite; }
@keyframes pulse-ring { 0%{ transform:scale(1); opacity:0.5; } 100%{ transform:scale(2.4); opacity:0; } }
.trust-runtime .state-label { font-family: var(--font-display); font-size: 14px; font-weight: 500; letter-spacing: -0.01em; transition: color var(--dur-state) var(--ease-state); }
.trust-runtime .topbar-center { display: flex; align-items: center; gap: var(--s-2); flex: 1; max-width: 420px; min-width: 120px; }
.trust-runtime .search-box { background: var(--bg-inset); border: 1px solid var(--border-hairline); border-radius: var(--r-pill); padding: 2px 10px; display: flex; align-items: center; gap: 4px; flex: 1; position: relative; }
.trust-runtime .search-box input { background: transparent; border: none; color: var(--text-primary); font-family: var(--font-body); font-size: 11px; width: 100%; outline: none; padding: 4px 0; }
.trust-runtime .search-box input::placeholder { color: var(--text-tertiary); }
.trust-runtime .search-box svg { width: 12px; height: 12px; stroke: var(--text-tertiary); fill: none; stroke-width: 1.75; flex-shrink: 0; }
.trust-runtime .search-results { display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-overlay); border: 1px solid var(--border-hairline); border-radius: var(--r-lg); padding: var(--s-2); max-height: 180px; overflow-y: auto; z-index: 100; margin-top: 2px; }
.trust-runtime .search-results.open { display: block; }
.trust-runtime .search-results .item { padding: 4px 6px; font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); cursor: pointer; border-radius: var(--r-sm); transition: background var(--dur-micro) ease; }
.trust-runtime .search-results .item:hover { background: var(--bg-raised); color: var(--text-primary); }
.trust-runtime .topbar-right { display: flex; align-items: center; gap: var(--s-2); flex-shrink: 0; }
.trust-runtime .notif-btn { position: relative; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: var(--r-sm); transition: color var(--dur-micro) ease; display: flex; align-items: center; }
.trust-runtime .notif-btn:hover { color: var(--text-primary); }
.trust-runtime .notif-btn .badge { position: absolute; top: -2px; right: -2px; background: var(--state-hazard); color: var(--bg-base); font-family: var(--font-mono); font-size: 8px; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.trust-runtime .notif-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.75; }
.trust-runtime .live-indicator { display: flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-size: 9px; color: var(--state-verified); letter-spacing: 0.06em; text-transform: uppercase; }
.trust-runtime .live-indicator .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--state-verified); animation: pulse-dot 1.4s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.2; transform:scale(0.6); } }
.trust-runtime .notif-popup { display: none; position: absolute; top: 100%; right: 0; background: var(--bg-overlay); border: 1px solid var(--border-hairline); border-radius: var(--r-lg); padding: var(--s-3); width: 260px; max-height: 260px; overflow-y: auto; z-index: 100; margin-top: 2px; }
.trust-runtime .notif-popup.open { display: block; }
.trust-runtime .notif-popup .notif-item { padding: 4px 0; border-bottom: 1px solid var(--border-hairline); font-size: 11px; color: var(--text-secondary); }
.trust-runtime .notif-popup .notif-item .time { color: var(--text-tertiary); font-family: var(--font-mono); font-size: 9px; }
.trust-runtime .tab-nav { display: flex; align-items: center; gap: 0; padding: 0 var(--s-4); border-bottom: 1px solid var(--border-hairline); background: var(--bg-base); flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
.trust-runtime .tab-nav::-webkit-scrollbar { display: none; }
.trust-runtime .tab-btn { background: transparent; border: none; color: var(--text-tertiary); font-family: var(--font-body); font-size: 11px; font-weight: 500; padding: 8px 14px; cursor: pointer; transition: color var(--dur-micro) ease, border-color var(--dur-micro) ease; border-bottom: 2px solid transparent; white-space: nowrap; letter-spacing: 0.02em; text-transform: uppercase; }
.trust-runtime .tab-btn:hover { color: var(--text-secondary); }
.trust-runtime .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--state-verified); }
.trust-runtime .view { display: none; flex: 1; overflow: hidden; position: relative; }
.trust-runtime .view.active { display: flex; }
.trust-runtime .main-content { display: flex; flex: 1; overflow: hidden; position: relative; }
.trust-runtime .overview-layout { display: flex; height: 100%; width: 100%; gap: 0; background: var(--bg-base); }
.trust-runtime .overview-left { flex: 1; display: flex; flex-direction: column; padding: var(--s-4); gap: var(--s-3); overflow-y: auto; min-width: 0; }
.trust-runtime .overview-right { width: 380px; flex-shrink: 0; display: flex; flex-direction: column; padding: var(--s-4); gap: var(--s-3); overflow-y: auto; border-left: 1px solid var(--border-hairline); background: var(--bg-raised); }
@media (max-width: 900px) { .trust-runtime .overview-layout { flex-direction: column; } .trust-runtime .overview-right { width: 100%; border-left: none; border-top: 1px solid var(--border-hairline); max-height: 50vh; } }
.trust-runtime .panel { background: var(--bg-raised); border: 1px solid var(--border-hairline); border-radius: var(--r-lg); padding: var(--s-3); }
.trust-runtime .panel-title { font-family: var(--font-body); font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: var(--s-2); display: flex; align-items: center; justify-content: space-between; }
.trust-runtime .panel-title .hint { font-weight: 400; letter-spacing: 0.02em; text-transform: none; font-size: 10px; }
.trust-runtime .execution-bars { display: flex; flex-direction: column; gap: 3px; }
.trust-runtime .exec-bar { display: flex; align-items: center; gap: var(--s-2); font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); }
.trust-runtime .exec-bar .label { width: 44px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
.trust-runtime .exec-bar .track { flex: 1; height: 4px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; position: relative; }
.trust-runtime .exec-bar .track .fill { height: 100%; border-radius: var(--r-pill); transition: width var(--dur-state) var(--ease-state); width: 0%; }
.trust-runtime .exec-bar .track .fill.verified { background: var(--state-verified); }
.trust-runtime .exec-bar .track .fill.pending { background: var(--state-pending); }
.trust-runtime .exec-bar .track .fill.hazard { background: var(--state-hazard); }
.trust-runtime .exec-bar .track .fill.idle { background: var(--state-idle); }
.trust-runtime .exec-bar .pct { width: 28px; flex-shrink: 0; text-align: right; font-size: 9px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.trust-runtime .posterior-display { display: flex; flex-direction: column; gap: var(--s-1); }
.trust-runtime .posterior-main { display: flex; align-items: baseline; gap: var(--s-3); }
.trust-runtime .posterior-value { font-family: var(--font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; transition: color var(--dur-state) var(--ease-state); }
.trust-runtime .posterior-unit { font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
.trust-runtime .posterior-meta { display: flex; flex-wrap: wrap; gap: var(--s-3); font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); margin-top: var(--s-1); }
.trust-runtime .posterior-meta .item { display: flex; align-items: center; gap: 4px; }
.trust-runtime .posterior-meta .item .val { color: var(--text-secondary); font-weight: 500; }
.trust-runtime .posterior-meta .item .label { color: var(--text-tertiary); text-transform: uppercase; font-size: 8px; letter-spacing: 0.04em; }
.trust-runtime .posterior-confidence { height: 3px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; margin-top: var(--s-1); }
.trust-runtime .posterior-confidence .fill { height: 100%; border-radius: var(--r-pill); transition: width var(--dur-state) var(--ease-state), background var(--dur-state) var(--ease-state); }
.trust-runtime .policy { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--border-hairline); gap: var(--s-2); }
.trust-runtime .policy:last-child { border-bottom: 0; }
.trust-runtime .policy-left { display: flex; align-items: center; gap: var(--s-2); min-width: 0; }
.trust-runtime .policy-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.trust-runtime .policy-indicator.ok { background: var(--state-verified); }
.trust-runtime .policy-indicator.fail { background: var(--state-hazard); }
.trust-runtime .policy-label { font-size: 11px; color: var(--text-secondary); }
.trust-runtime .policy-tier { font-family: var(--font-mono); font-size: 8px; color: var(--text-tertiary); padding: 0 4px; border: 1px solid var(--border-hairline); border-radius: var(--r-sm); }
.trust-runtime .policy-right { display: flex; align-items: center; gap: var(--s-2); font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); flex-shrink: 0; }
.trust-runtime .policy-bar { width: 50px; height: 2px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; position: relative; }
.trust-runtime .policy-bar::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(--fill); background: var(--tone, var(--state-verified)); transition: width var(--dur-state) var(--ease-state); }
.trust-runtime .policy-bar::after { content: ""; position: absolute; top: -1px; bottom: -1px; left: var(--threshold); width: 1px; background: var(--text-tertiary); }
.trust-runtime .timeline { display: flex; flex-direction: column; gap: 1px; }
.trust-runtime .timeline-row { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: var(--s-2); padding: 3px 0; font-family: var(--font-mono); font-size: 9px; }
.trust-runtime .timeline-seq { color: var(--text-tertiary); }
.trust-runtime .timeline-bar { height: 2px; background: var(--bg-inset); border-radius: var(--r-pill); position: relative; overflow: hidden; }
.trust-runtime .timeline-bar::before { content: ""; position: absolute; inset: 0; width: var(--w, 100%); background: var(--tone, var(--state-verified)); transition: width var(--dur-state) var(--ease-state); }
.trust-runtime .timeline-event { color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; font-size: 8px; }
.trust-runtime .chain-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-hairline); gap: var(--s-2); }
.trust-runtime .chain-row:last-child { border-bottom: 0; }
.trust-runtime .chain-row .label { font-size: 11px; color: var(--text-secondary); }
.trust-runtime .chain-row .value { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); display: flex; align-items: center; gap: var(--s-2); }
.trust-runtime .chain-row .badge { padding: 1px 8px; border-radius: var(--r-pill); font-size: 9px; font-weight: 500; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.04em; }
.trust-runtime .badge.ok { background: rgba(47,191,113,0.15); color: var(--state-verified); }
.trust-runtime .badge.fail { background: rgba(229,72,77,0.15); color: var(--state-hazard); }
.trust-runtime .badge.pending { background: rgba(232,162,61,0.15); color: var(--state-pending); }
.trust-runtime .colony-container { position: relative; width: 100%; aspect-ratio: 1/1; max-width: 380px; margin: 0 auto; background: var(--bg-raised); border-radius: 50%; overflow: hidden; border: 1px solid var(--border-hairline); flex-shrink: 0; }
.trust-runtime .colony-container canvas { width: 100% !important; height: 100% !important; display: block; }
.trust-runtime .colony-health-label { text-align: center; font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); letter-spacing: 0.06em; text-transform: uppercase; padding: var(--s-1) 0; }
.trust-runtime .colony-health-label .status-text { transition: color var(--dur-state) var(--ease-state); font-weight: 500; }
.trust-runtime .log-stream { background: var(--bg-inset); border-radius: var(--r-sm); padding: var(--s-2); max-height: 140px; overflow-y: auto; font-family: var(--font-mono); font-size: 9px; line-height: 1.6; color: var(--text-secondary); border: 1px solid var(--border-hairline); }
.trust-runtime .log-stream .log-entry { display: flex; gap: var(--s-2); border-bottom: 1px solid var(--border-hairline); padding: 2px 0; }
.trust-runtime .log-stream .log-entry .time { color: var(--text-tertiary); flex-shrink: 0; }
.trust-runtime .log-stream .log-entry .msg { word-break: break-all; }
.trust-runtime .log-stream .log-entry .msg .highlight { color: var(--state-info); }
.trust-runtime .view-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: var(--text-tertiary); font-family: var(--font-mono); font-size: 12px; padding: var(--s-7); text-align: center; gap: var(--s-3); }
.trust-runtime .view-placeholder .icon { font-size: 28px; opacity: 0.3; }
.trust-runtime .view-placeholder .sub { font-size: 10px; color: var(--text-disabled); }
.trust-runtime.hazard-mode .colony-container { border-color: var(--state-hazard); }
.trust-runtime.hazard-mode .panel { border-color: var(--state-hazard); opacity: 0.85; }
.trust-runtime.hazard-mode .state-label { color: var(--state-hazard) !important; }
.trust-runtime.hazard-mode .posterior-value { color: var(--state-hazard) !important; }
.trust-runtime.hazard-mode .live-indicator { color: var(--state-hazard); }
.trust-runtime.hazard-mode .live-indicator .dot { background: var(--state-hazard); animation: pulse-dot-hazard 0.6s ease-in-out infinite; }
@keyframes pulse-dot-hazard { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.1; transform:scale(0.4); } }
@keyframes shake-card { 0%{ transform:translateX(0); } 20%{ transform:translateX(-4px); } 40%{ transform:translateX(4px); } 60%{ transform:translateX(-3px); } 80%{ transform:translateX(3px); } 100%{ transform:translateX(0); } }
.trust-runtime .shake { animation: shake-card 0.4s var(--ease-hazard) 1; }
@keyframes count-up { 0%{ opacity:0.6; transform:translateY(1px); } 100%{ opacity:1; transform:translateY(0); } }
.trust-runtime .count-up { animation: count-up 0.25s var(--ease-state) 1; }
.trust-runtime ::-webkit-scrollbar { width: 3px; height: 3px; }
.trust-runtime ::-webkit-scrollbar-track { background: var(--bg-inset); }
.trust-runtime ::-webkit-scrollbar-thumb { background: var(--border-hairline); border-radius: var(--r-pill); }
@media (max-width: 700px) { .trust-runtime .topbar { flex-wrap: wrap; padding: 4px var(--s-3); } .trust-runtime .topbar-center { order: 3; flex-basis: 100%; max-width: 100%; margin-top: 2px; } .trust-runtime .overview-right { width: 100%; max-height: 40vh; } .trust-runtime .colony-container { max-width: 200px; } .trust-runtime .tab-btn { font-size: 9px; padding: 6px 10px; } .trust-runtime .brand-mark .brand-full { display: none; } .trust-runtime .data-mode-badge .dm-text { display: none; } }
.trust-runtime .controls { position: fixed; bottom: var(--s-3); right: var(--s-3); background: var(--bg-overlay); border: 1px solid var(--border-hairline); border-radius: var(--r-md); padding: 4px 6px; display: flex; gap: 2px; z-index: 50; font-family: var(--font-mono); font-size: 9px; flex-wrap: wrap; max-width: calc(100vw - var(--s-5)); }
.trust-runtime .controls button { background: transparent; color: var(--text-tertiary); border: 1px solid transparent; padding: 3px 7px; border-radius: var(--r-sm); cursor: pointer; font-family: inherit; font-size: inherit; transition: background var(--dur-micro) ease, color var(--dur-micro) ease; }
.trust-runtime .controls button:hover { color: var(--text-primary); background: var(--bg-raised); }
.trust-runtime .controls button.active { color: var(--text-primary); background: var(--bg-raised); border-color: var(--border-hairline); }
.trust-runtime .controls .sep { width: 1px; background: var(--border-hairline); margin: 2px 2px; }
.trust-runtime .controls .auto-btn { color: var(--state-info); }
.trust-runtime .controls .auto-btn:hover { color: var(--state-info); }
`

/* ------------------------------------------------------------------ */
/*  React Component                                                    */
/* ------------------------------------------------------------------ */

export default function TrustRuntimePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    currentState: string
    currentSeq: number
    snapshotHistory: any[]
    logEntries: { time: string; msg: string }[]
    eventCount: number
    notifCount: number
    autoTimer: ReturnType<typeof setInterval> | null
    dataMode: string
    colonyAnts: any[]
    canopyLeaves: any[]
    colonyAntSeq: number
    colonyState: string
    colonyTrust: number
    colonyReducedMotion: boolean
    animFrame: number | null
  }>({
    currentState: 'IDLE',
    currentSeq: 0,
    snapshotHistory: [],
    logEntries: [],
    eventCount: 0,
    notifCount: 0,
    autoTimer: null,
    dataMode: 'simulated',
    colonyAnts: [],
    canopyLeaves: [],
    colonyAntSeq: 0,
    colonyState: 'IDLE',
    colonyTrust: 1,
    colonyReducedMotion: false,
    animFrame: null,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const st = stateRef.current
    const $ = (id: string) => container.querySelector('#' + id) as HTMLElement | null

    /* ---- helpers ---- */
    const GATE_R = 0.56, KERNEL_R = 0.16, OUTER_R = 0.94
    const LEAF_FRESH = '#5C8A52', LEAF_GATE = '#E8A23D', LEAF_VERIFIED = '#2FBF71', LEAF_REJECTED = '#5A6068'

    /* Load-dependent ant speed multipliers by state */
    function antSpeedByState(state: string, stage: string): number {
      if (stage === 'rejected') return 0.7  // slow retreat
      if (stage === 'atGate') return 0     // stopped at gate
      switch (state) {
        case 'IDLE':       return 0.35  // slow meandering
        case 'INGESTING':  return 1.8   // fast purposeful
        case 'ATTESTING':  return 1.3   // brisk
        case 'VERIFYING':  return 1.0   // moderate
        case 'COMMITTING': return 0.8   // steady
        case 'SETTLED':    return 0.5   // leisurely
        case 'HAZARD':     return 0.15  // frozen
        default:           return 0.6
      }
    }

    function spawnAnt(colonyAnts: any[], colonyState: string, colonyAntSeqRef: { current: number }) {
      const angle = Math.random() * Math.PI * 2
      const speedMul = antSpeedByState(colonyState, 'approaching')
      colonyAnts.push({
        id: colonyAntSeqRef.current++,
        angle: angle + (Math.random() - 0.5) * 0.15,
        baseAngle: angle,
        radius: OUTER_R,
        speed: (0.0014 + Math.random() * 0.0014) * speedMul,
        baseSpeed: 0.0014 + Math.random() * 0.0014,
        stage: 'approaching',
        leafColor: LEAF_FRESH,
        leafAlpha: 1,
        gateHold: 0,
        legPhase: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.3,
      })
    }

    function colonySpawnRateByState(state: string) {
      switch (state) {
        case 'IDLE':       return { p: 0.008, cap: 3 }
        case 'INGESTING':  return { p: 0.10,  cap: 14 }
        case 'ATTESTING':  return { p: 0.05,  cap: 12 }
        case 'VERIFYING':  return { p: 0.03,  cap: 10 }
        case 'COMMITTING': return { p: 0.015, cap: 8 }
        case 'SETTLED':    return { p: 0.006, cap: 4 }
        case 'HAZARD':     return { p: 0,     cap: 0 }
        default:           return { p: 0.008, cap: 4 }
      }
    }

    function buildSnapshot(state: string, seq: number) {
      const isHazard = state === 'HAZARD'
      const isSettled = state === 'SETTLED'
      const isIdle = state === 'IDLE'
      const evMap: Record<string, string> = {
        IDLE: '000000000000', INGESTING: 'a3f19c0b7e24', ATTESTING: '8b2e4d91fa07',
        VERIFYING: 'c7d2f10a93b8', COMMITTING: 'e4a81b3c6d5f', SETTLED: 'f9e2d7c4b1a0', HAZARD: 'deadbeef0000'
      }
      const evidencePrefix = evMap[state] || 'ffffffffffff'
      const hashChainIntact = !isHazard
      const signatureVerified = isSettled || (!isHazard && !isIdle)
      const attestations = [
        { platform: 'AMD SEV-SNP', verified: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', certChainValid: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', measurement: 'a3f19c0b7e24d817', lastCheckedIso: new Date(Date.now() - (isIdle ? 0 : 12000)).toISOString() },
        { platform: 'Intel SGX', verified: !isHazard && state !== 'IDLE', certChainValid: !isHazard, measurement: isHazard ? '0000000000000000' : '8b2e4d91fa07c3a1', lastCheckedIso: new Date(Date.now() - (isHazard ? 3200 : 8000)).toISOString() },
        { platform: 'AWS Nitro', verified: !isIdle, certChainValid: true, measurement: 'c7d2f10a93b8e4a1', lastCheckedIso: new Date(Date.now() - 4200).toISOString() },
      ]
      const policyDecisions = [
        { id: 'p1', label: 'Clock skew < 500ms', classTier: 'A', threshold: 0.500, observed: isHazard ? 1.847 : 0.112, passed: !isHazard },
        { id: 'p2', label: 'Hash chain continuity', classTier: 'A', threshold: 1.000, observed: hashChainIntact ? 1.000 : 0.000, passed: hashChainIntact },
        { id: 'p3', label: 'Attestation quorum ≥ 2/3', classTier: 'A', threshold: 0.667, observed: isHazard ? 0.333 : 1.000, passed: !isHazard },
        { id: 'p4', label: 'Envelope signature valid', classTier: 'B', threshold: 1.000, observed: signatureVerified ? 1.000 : 0.000, passed: signatureVerified },
        { id: 'p5', label: 'Journal monotonicity', classTier: 'B', threshold: 1.000, observed: 1.000, passed: true },
      ]
      const passing = policyDecisions.filter(p => p.passed).length
      const trust = isIdle ? 0 : +(passing / policyDecisions.length).toFixed(4)
      const sigma = +(0.008 + Math.random() * 0.012).toFixed(4)
      let trustClass = 'UNCLASSIFIED'
      if (isIdle) trustClass = 'UNCLASSIFIED'
      else if (isHazard) trustClass = 'HAZARD'
      else if (trust >= 0.95 && isSettled) trustClass = 'CLASS-A VERIFIED'
      else if (trust >= 0.80) trustClass = 'CLASS-B PROVISIONAL'
      else trustClass = 'UNVERIFIED'
      const receiptId = 'rcpt_' + evidencePrefix.slice(0, 8)
      const receiptHash = 'sha256:' + evidencePrefix + 'f3a1b9c2'
      const envelopeHash = 'sha256:9e8d7c6b5a4f3e2d'
      const signature = 'ed25519:' + (isSettled ? 'a1b2c3d4e5f6' : '—')
      const snapshotHash = 'snap_' + evidencePrefix + Math.random().toString(16).slice(2, 6)
      const barProgress = {
        INGEST: Math.min(100, Math.max(0, (seq / 20) * 100)),
        VERIFY: Math.min(100, Math.max(0, ((seq - 4) / 20) * 100)),
        ATTEST: Math.min(100, Math.max(0, ((seq - 8) / 20) * 100)),
        SIGN:   Math.min(100, Math.max(0, ((seq - 12) / 20) * 100)),
        COMMIT: Math.min(100, Math.max(0, ((seq - 16) / 20) * 100)),
      }
      if (isIdle) { Object.keys(barProgress).forEach(k => { barProgress[k as keyof typeof barProgress] = 0 }) }
      if (isHazard) { Object.keys(barProgress).forEach(k => { barProgress[k as keyof typeof barProgress] = Math.min(barProgress[k as keyof typeof barProgress], 60) }) }
      return {
        state, seq, progressPct: Math.min(100, Math.round((seq / 20) * 100)),
        provider: 'us-east-1a · nv-07', elapsedMs: isIdle ? 0 : (seq * 1420) + 318,
        evidenceHashPrefix: evidencePrefix, hashChainIntact, signatureVerified,
        attestations, policyDecisions, trust, sigma, trustClass,
        receiptId, receiptHash, envelopeHash, signature, snapshotHash,
        timestamp: new Date().toISOString(), barProgress, epoch: seq + 38291,
        quorumTotal: 5, quorumPass: Math.min(5, Math.max(0, Math.round(trust * 5))),
      }
    }

    function applySnapshot(snap: any) {
      st.snapshotHistory.push(snap)
      if (st.snapshotHistory.length > 200) st.snapshotHistory.shift()
      st.eventCount++

      // Log
      const logMsg = `[${new Date().toLocaleTimeString()}] ${snap.state} seq=${snap.seq} trust=${snap.trust} epoch=${snap.epoch}`
      st.logEntries.push({ time: new Date().toLocaleTimeString(), msg: logMsg })
      if (st.logEntries.length > 80) st.logEntries.shift()

      // If state changed and not idle, bump notification
      if (snap.state !== 'IDLE' && snap.state !== st.currentState) {
        st.notifCount++
        const badge = $('notif-badge')
        if (badge) badge.textContent = String(st.notifCount)
        const popup = $('notif-popup')
        if (popup) {
          const item = document.createElement('div')
          item.className = 'notif-item'
          item.innerHTML = `<span class="time">${new Date().toLocaleTimeString()}</span> State → ${snap.state}`
          popup.prepend(item)
          if (popup.children.length > 10) popup.removeChild(popup.lastChild!)
        }
      }
      if (snap.state === 'SETTLED' && st.notifCount > 0) {
        setTimeout(() => { st.notifCount = 0; const b = $('notif-badge'); if (b) b.textContent = '0' }, 2500)
      }
      st.currentState = snap.state
      render(snap)
      updateColonyAnts(snap)
      updateLogStream()
    }

    function emitEvent(state: string) {
      const seq = ++st.currentSeq
      const snap = buildSnapshot(state, seq)
      applySnapshot(snap)
    }

    /* ---- Render ---- */
    function render(s: any) {
      const meta = STATE_META[s.state]
      const isHazard = s.state === 'HAZARD'
      const isSettled = s.state === 'SETTLED'
      container!.classList.toggle('hazard-mode', isHazard)
      const dot = $('state-dot')
      if (dot) { dot.style.color = meta.color; dot.classList.toggle('pulse', isHazard) }
      const label = $('state-label')
      if (label) { label.textContent = meta.label; label.style.color = meta.color }

      // Bars
      const barOrder = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT']
      const barLabels: Record<string, string> = { INGEST: 'ingest', VERIFY: 'verify', ATTEST: 'attest', SIGN: 'sign', COMMIT: 'commit' }
      const barColors: Record<string, string> = { INGEST: 'pending', VERIFY: 'pending', ATTEST: 'pending', SIGN: 'pending', COMMIT: 'verified' }
      if (isHazard) { Object.keys(barColors).forEach(k => { barColors[k] = 'hazard' }) }
      if (s.state === 'IDLE') { Object.keys(barColors).forEach(k => { barColors[k] = 'idle' }) }
      let barHtml = ''
      barOrder.forEach((key) => {
        const pct = Math.round((s.barProgress as any)[key] || 0)
        barHtml += `<div class="exec-bar"><span class="label">${barLabels[key]}</span><div class="track"><div class="fill ${barColors[key]}" style="width:${pct}%;"></div></div><span class="pct">${pct}%</span></div>`
      })
      const eb = $('exec-bars')
      if (eb) { eb.innerHTML = barHtml }
      const eh = $('exec-hint')
      if (eh) eh.textContent = `seq #${s.seq}`

      // Posterior
      const pv = $('posterior-value')
      if (pv) { pv.textContent = s.trust.toFixed(4); pv.style.color = meta.color }
      const ps = $('posterior-sigma')
      if (ps) ps.textContent = s.sigma.toFixed(4)
      const confPct = Math.min(99.99, Math.max(0, (1 - s.sigma * 8) * 100))
      const pc = $('posterior-conf')
      if (pc) pc.textContent = confPct.toFixed(2) + '%'
      const pe = $('posterior-evidence')
      if (pe) pe.textContent = String(Math.min(999, Math.round(s.seq * 12.8)))
      const pq = $('posterior-quorum')
      if (pq) pq.textContent = `${s.quorumPass}/${s.quorumTotal}`
      const pep = $('posterior-epoch')
      if (pep) pep.textContent = String(s.epoch)
      const pcf = $('posterior-conf-fill')
      if (pcf) { (pcf as HTMLElement).style.width = confPct + '%'; (pcf as HTMLElement).style.background = isHazard ? 'var(--state-hazard)' : isSettled ? 'var(--state-verified)' : 'var(--state-pending)' }

      // Policy
      const failing = s.policyDecisions.filter((p: any) => !p.passed).length
      const ph = $('policy-hint')
      if (ph) { ph.textContent = failing > 0 ? `${failing} failing` : 'all passing'; ph.style.color = failing > 0 ? 'var(--state-hazard)' : 'var(--state-verified)' }
      let policyHtml = ''
      s.policyDecisions.forEach((p: any) => {
        const fillPct = Math.min(100, (p.observed / Math.max(p.threshold, 0.001)) * 100)
        const thresholdPct = Math.min(100, (p.threshold / Math.max(p.observed, p.threshold, 0.001)) * 100)
        const tone = p.passed ? 'var(--state-verified)' : 'var(--state-hazard)'
        policyHtml += `<div class="policy${isHazard && !p.passed ? ' shake' : ''}"><div class="policy-left"><span class="policy-indicator ${p.passed ? 'ok' : 'fail'}"></span><span class="policy-label">${p.label}</span><span class="policy-tier">${p.classTier}</span></div><div class="policy-right"><div class="policy-bar" style="--fill:${fillPct}%; --threshold:${thresholdPct}%; --tone:${tone}"></div><span>${p.observed.toFixed(3)}</span></div></div>`
      })
      const pr = $('policy-rows')
      if (pr) pr.innerHTML = policyHtml

      // Chain
      const chainOk = s.hashChainIntact && s.signatureVerified
      const cr = $('chain-rows')
      if (cr) {
        cr.innerHTML = `
          <div class="chain-row"><span class="label">Chain integrity</span><span class="value"><span>${s.evidenceHashPrefix}…</span><span class="badge ${chainOk ? 'ok' : (s.hashChainIntact ? 'pending' : 'fail')}">${chainOk ? 'intact' : (s.hashChainIntact ? 'pending' : 'broken')}</span></span></div>
          <div class="chain-row"><span class="label">Ed25519 signature</span><span class="value"><span>${s.signatureVerified ? 'valid' : 'invalid'}</span><span class="badge ${s.signatureVerified ? 'ok' : 'fail'}">${s.signatureVerified ? 'verified' : 'unverified'}</span></span></div>
        `
      }
      const ch = $('chain-hint')
      if (ch) { ch.textContent = chainOk ? 'intact · signed' : (!s.hashChainIntact) ? 'chain broken' : 'unsigned'; ch.style.color = chainOk ? 'var(--state-verified)' : (!s.hashChainIntact) ? 'var(--state-hazard)' : 'var(--state-pending)' }

      // Timeline
      const evs = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT', 'CHECK', 'SYNC', 'FINAL']
      const tones = ['var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-verified)', 'var(--state-info)', 'var(--state-pending)', 'var(--state-verified)']
      let tlHtml = ''
      const base = Math.max(0, s.seq - 5)
      for (let i = 0; i < 6; i++) {
        const seqI = base + i
        const ev = evs[i % evs.length]
        const w = Math.max(8, Math.min(100, (seqI / 20) * 100))
        tlHtml += `<div class="timeline-row"><span class="timeline-seq">#${String(seqI).padStart(3, '0')}</span><div class="timeline-bar" style="--w:${w}%; --tone:${tones[i % tones.length]}"></div><span class="timeline-event">${ev}</span></div>`
      }
      const tl = $('timeline')
      if (tl) tl.innerHTML = tlHtml

      // Receipt
      const rec = $('receipt')
      if (rec) rec.innerHTML = `<dt>id</dt><dd>${s.receiptId}</dd><dt>receipt</dt><dd>${s.receiptHash.slice(0, 20)}…</dd><dt>envelope</dt><dd>${s.envelopeHash.slice(0, 20)}…</dd><dt>signature</dt><dd>${s.signature.slice(0, 16)}…</dd>`

      // Colony status
      const cs = $('colony-status-text')
      if (cs) {
        if (isHazard) { cs.textContent = '⚠ HAZARD · SYSTEM DEGRADED'; cs.style.color = 'var(--state-hazard)' }
        else if (isSettled) { cs.textContent = '● ALL SYSTEMS NOMINAL'; cs.style.color = 'var(--state-verified)' }
        else if (s.state === 'IDLE') { cs.textContent = '○ SYSTEM STANDBY'; cs.style.color = 'var(--text-tertiary)' }
        else { cs.textContent = '◉ TRANSITIONING · VERIFYING'; cs.style.color = 'var(--state-pending)' }
      }
    }

    function updateColonyAnts(snap: any) {
      st.colonyState = snap.state
      st.colonyTrust = Math.max(0.05, Math.min(0.98, typeof snap.trust === 'number' ? snap.trust : 1))
    }

    function updateLogStream() {
      const ls = $('log-stream')
      if (!ls) return
      ls.innerHTML = st.logEntries.slice(-20).map((e: any) =>
        `<div class="log-entry"><span class="time">${e.time}</span><span class="msg">${e.msg}</span></div>`
      ).join('')
      ls.scrollTop = ls.scrollHeight
      const lh = $('log-hint')
      if (lh) lh.textContent = st.logEntries.length > 0 ? `${st.logEntries.length} entries` : 'waiting'
    }

    /* ---- Colony Animation ---- */
    const _canvas = container.querySelector('#colony-canvas') as HTMLCanvasElement | null
    if (!_canvas) return
    const canvas: HTMLCanvasElement = _canvas

    function setupCanvas() {
      const rect = canvas.parentElement!.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height, 380)
      if (size <= 10) return false
      canvas.width = size * 2
      canvas.height = size * 2
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      return true
    }
    setupCanvas()

    const _ctx = canvas.getContext('2d')
    if (!_ctx) return
    const ctx: CanvasRenderingContext2D = _ctx

    const colonyAntSeqRef = { current: 0 }
    st.colonyReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function animateColony() {
      const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = W * 0.42
      ctx.clearRect(0, 0, W, H)

      const rate = colonySpawnRateByState(st.colonyState)
      if (st.colonyAnts.length < rate.cap && Math.random() < rate.p) {
        spawnAnt(st.colonyAnts, st.colonyState, colonyAntSeqRef)
      }

      const stepScale = st.colonyReducedMotion ? 0.25 : 1
      st.colonyAnts.sort((a: any, b: any) => b.radius - a.radius)

      st.colonyAnts.forEach((a: any) => {
        a.legPhase += 0.35 * stepScale

        // Recalculate speed based on current state (so speed changes when state changes)
        const speedMul = antSpeedByState(st.colonyState, a.stage)

        if (a.stage === 'approaching') {
          // Meander angle based on state (more wander when idle)
          if (st.colonyState === 'IDLE') {
            a.angle += (Math.random() - 0.5) * 0.03  // more meander
          } else if (st.colonyState === 'INGESTING') {
            a.angle += (Math.random() - 0.5) * 0.005 // direct path
          } else {
            a.angle += (Math.random() - 0.5) * 0.012
          }
          a.radius -= a.baseSpeed * speedMul * stepScale
          if (a.radius <= GATE_R) { a.radius = GATE_R; a.stage = 'atGate'; a.leafColor = LEAF_GATE; a.gateHold = 26 + Math.floor(Math.random() * 20) }
        } else if (a.stage === 'atGate') {
          a.gateHold -= 1 * stepScale
          if (a.gateHold <= 0) {
            const rejected = Math.random() > st.colonyTrust
            a.stage = rejected ? 'rejected' : 'verified'
            a.leafColor = rejected ? LEAF_REJECTED : LEAF_VERIFIED
          }
        } else if (a.stage === 'verified') {
          a.radius -= a.baseSpeed * 1.3 * speedMul * stepScale
          if (a.radius <= KERNEL_R) {
            st.canopyLeaves.push({ angle: Math.random() * Math.PI * 2, dist: Math.random(), r: 1.4 + Math.random() * 1.3, hue: Math.random() })
            if (st.canopyLeaves.length > 140) st.canopyLeaves.shift()
            a.dead = true
          }
        } else if (a.stage === 'rejected') {
          a.radius += a.baseSpeed * 0.7 * stepScale
          a.leafAlpha -= 0.018 * stepScale
          if (a.leafAlpha <= 0 || a.radius >= OUTER_R + 0.05) a.dead = true
        }

        const x = cx + Math.cos(a.angle) * a.radius * R
        const y = cy + Math.sin(a.angle) * a.radius * R
        const antAlpha = a.stage === 'rejected' ? Math.max(0, a.leafAlpha) : 1
        const leafX = cx + Math.cos(a.angle) * (a.radius + 0.025) * R
        const leafY = cy + Math.sin(a.angle) * (a.radius + 0.025) * R
        drawLeaf(ctx, leafX, leafY, a.angle, a.scale, a.leafColor, Math.max(0, a.leafAlpha) * 0.95)
        drawAnt(ctx, x, y, a.angle + Math.PI, a.scale, antAlpha, a.legPhase)
      })
      st.colonyAnts = st.colonyAnts.filter((a: any) => !a.dead)

      // Gate ring
      ctx.beginPath(); ctx.arc(cx, cy, GATE_R * R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,162,61,0.22)'; ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([])

      // Canopy
      const canopySpread = Math.min(KERNEL_R * 2.6, KERNEL_R + st.canopyLeaves.length * 0.006)
      st.canopyLeaves.forEach((leaf: any) => {
        const d = leaf.dist * canopySpread * R
        const lx = cx + Math.cos(leaf.angle) * d
        const ly = cy + Math.sin(leaf.angle) * d * 0.7 - canopySpread * R * 0.25
        ctx.globalAlpha = 0.85
        ctx.fillStyle = '#2FBF71'
        ctx.beginPath(); ctx.ellipse(lx, ly, leaf.r, leaf.r * 0.7, leaf.angle, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1

      // Kernel
      const kernelColor = STATE_META[st.colonyState]?.color || '#4E545E'
      ctx.beginPath(); ctx.arc(cx, cy, KERNEL_R * R * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = kernelColor; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy, KERNEL_R * R * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = kernelColor; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; ctx.stroke()
      ctx.globalAlpha = 1

      st.animFrame = requestAnimationFrame(animateColony)
    }

    function drawAnt(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, alpha: number, legPhase: number) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(180,186,194,0.9)'; ctx.strokeStyle = 'rgba(180,186,194,0.9)'; ctx.lineWidth = 0.55
      ctx.beginPath(); ctx.ellipse(-3.1, 0, 2.0, 1.4, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(-0.4, 0, 1.2, 0.95, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(1.9, 0, 0.95, 0, Math.PI * 2); ctx.fill()
      for (let i = -1; i <= 1; i++) {
        const lp = Math.sin(legPhase + i * 1.3) * 0.7
        ctx.beginPath(); ctx.moveTo(i * 1.0 - 0.4, 0); ctx.lineTo(i * 1.0 - 0.4 + lp, 2.1)
        ctx.moveTo(i * 1.0 - 0.4, 0); ctx.lineTo(i * 1.0 - 0.4 - lp, -2.1); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(2.6, -0.4); ctx.lineTo(3.7, -1.2); ctx.moveTo(2.6, 0.4); ctx.lineTo(3.7, 1.2); ctx.stroke()
      ctx.restore()
    }

    function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, color: string, alpha: number) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.quadraticCurveTo(2.1, -0.9, 0, 3.2); ctx.quadraticCurveTo(-2.1, -0.9, 0, -3.2); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.lineTo(0, 3.2); ctx.stroke()
      ctx.restore()
    }

    // Start colony animation
    animateColony()

    // Emit initial IDLE
    emitEvent('IDLE')

    // Tab switching
    function handleTabClick(this: HTMLElement) {
      const tabNav = container!.querySelector('.tab-nav')
      if (tabNav) {
        tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      }
      this.classList.add('active')
      const viewId = this.getAttribute('data-view')
      container!.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
      const target = container!.querySelector('#view-' + viewId)
      if (target) target.classList.add('active')
    }

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', handleTabClick as EventListener)
    })

    // Search
    const searchInput = container.querySelector('#search-input') as HTMLInputElement | null
    const searchResultsEl = container.querySelector('#search-results') as HTMLElement | null
    if (searchInput && searchResultsEl) {
      searchInput.addEventListener('input', function (e: Event) {
        const val = (e.target as HTMLInputElement).value.trim().toLowerCase()
        if (val.length === 0) { searchResultsEl.classList.remove('open'); return }
        const matches = st.snapshotHistory.filter((s: any) =>
          s.state.toLowerCase().includes(val) || s.receiptId.includes(val) || s.evidenceHashPrefix.includes(val)
        )
        if (matches.length === 0) {
          searchResultsEl.innerHTML = '<div style="padding:4px;color:var(--text-tertiary);font-size:10px;">No matches</div>'
        } else {
          searchResultsEl.innerHTML = matches.slice(0, 6).map((s: any) =>
            `<div class="item" data-seq="${s.seq}">seq ${s.seq} · ${s.state} · ${s.receiptId}</div>`
          ).join('')
          searchResultsEl.querySelectorAll('.item').forEach(el => {
            el.addEventListener('click', function (this: HTMLElement) {
              const seq = parseInt(this.dataset.seq || '0')
              const snap = st.snapshotHistory.find((s: any) => s.seq === seq)
              if (snap) { render(snap); searchInput.value = ''; searchResultsEl.classList.remove('open') }
            })
          })
        }
        searchResultsEl.classList.add('open')
      })
    }
    document.addEventListener('click', function (e: Event) {
      if (!(e.target as HTMLElement).closest('.search-box') && searchResultsEl) {
        searchResultsEl.classList.remove('open')
      }
    })

    // Notifications
    const notifBtn = container.querySelector('#notif-btn') as HTMLElement | null
    const notifPopupEl = container.querySelector('#notif-popup') as HTMLElement | null
    if (notifBtn && notifPopupEl) {
      notifBtn.addEventListener('click', function (e: Event) { e.stopPropagation(); notifPopupEl.classList.toggle('open') })
    }
    document.addEventListener('click', function (e: Event) {
      if (!(e.target as HTMLElement).closest('.notif-btn') && !(e.target as HTMLElement).closest('.notif-popup')) {
        if (notifPopupEl) notifPopupEl.classList.remove('open')
      }
    })

    // Auto cycle
    const autoBtn = container.querySelector('#auto-btn') as HTMLElement | null
    function startAuto() {
      let i = 0
      st.autoTimer = setInterval(() => {
        const state = STATE_ORDER[i % STATE_ORDER.length]
        emitEvent(state)
        i++
        container!.querySelectorAll('.controls button[data-state]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-state') === state)
        })
      }, 2400)
      if (autoBtn) autoBtn.textContent = '■ STOP'
    }
    function stopAuto() {
      if (st.autoTimer) { clearInterval(st.autoTimer); st.autoTimer = null }
      if (autoBtn) autoBtn.textContent = '▶ AUTO'
    }
    if (autoBtn) {
      autoBtn.addEventListener('click', function () { if (st.autoTimer) stopAuto(); else startAuto() })
    }

    // State buttons
    container.querySelectorAll('.controls button[data-state]').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLElement) {
        if (st.autoTimer) stopAuto()
        const state = this.getAttribute('data-state') as string
        emitEvent(state)
        container!.querySelectorAll('.controls button[data-state]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-state') === state)
        })
      })
    })

    // Resize
    let resizeTimeout: ReturnType<typeof setTimeout>
    function handleResize() {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const rect = canvas.parentElement!.getBoundingClientRect()
        const size = Math.min(rect.width, rect.height, 380)
        if (size > 10) { canvas.width = size * 2; canvas.height = size * 2; canvas.style.width = size + 'px'; canvas.style.height = size + 'px' }
      }, 150)
    }
    window.addEventListener('resize', handleResize)

    // Start auto after 800ms
    const autoTimeout = setTimeout(() => { startAuto() }, 800)

    // Cleanup
    return () => {
      clearTimeout(autoTimeout)
      stopAuto()
      if (st.animFrame) cancelAnimationFrame(st.animFrame)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="trust-runtime" ref={containerRef}>
      <style>{CSS}</style>

      <div className="app">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="brand-logo" title="Venture Vision Ubuntu">
              <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5" />
                <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5" />
                <circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5" />
              </svg>
              <div className="brand-mark">
                <span className="brand-full">VENTURE VISION UBUNTU</span><span className="sep">/</span><span className="sub">trust-runtime</span>
              </div>
            </div>
            <div className="state-head">
              <span id="state-dot" className="status-dot" style={{ color: 'var(--state-idle)' as string }}></span>
              <span id="state-label" className="state-label">IDLE</span>
              <span id="data-mode-badge" className="data-mode-badge" data-mode="simulated" title="Data source for this session">
                <span className="dm-dot"></span><span className="dm-text">SIMULATED</span>
              </span>
            </div>
          </div>
          <div className="topbar-center">
            <div className="search-box">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input type="text" placeholder="Search journal, receipts, events…" id="search-input" />
              <div className="search-results" id="search-results"></div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="live-indicator">
              <span className="dot"></span>
              <span>live</span>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="notif-btn" id="notif-btn" aria-label="Notifications">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                <span className="badge" id="notif-badge">0</span>
              </button>
              <div className="notif-popup" id="notif-popup"></div>
            </div>
          </div>
        </header>

        {/* TAB NAV */}
        <nav className="tab-nav" id="tab-nav">
          <button className="tab-btn active" data-view="overview">Runtime</button>
          <button className="tab-btn" data-view="evidence">Evidence</button>
          <button className="tab-btn" data-view="attestation">Attestation</button>
          <button className="tab-btn" data-view="bayesian">Bayesian</button>
          <button className="tab-btn" data-view="journal">Journal</button>
          <button className="tab-btn" data-view="governance">Governance</button>
        </nav>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {/* Overview */}
          <div className="view active" id="view-overview">
            <div className="overview-layout">
              <div className="overview-left">
                <div className="colony-container" id="colony-container">
                  <canvas ref={canvasRef} id="colony-canvas"></canvas>
                </div>
                <div className="colony-health-label">
                  <span className="status-text" id="colony-status-text">● ALL SYSTEMS NOMINAL</span>
                </div>
                <div className="panel">
                  <div className="panel-title"><span>Execution</span><span className="hint" id="exec-hint">seq #0</span></div>
                  <div className="execution-bars" id="exec-bars"></div>
                </div>
                <div className="panel">
                  <div className="panel-title"><span>Hash Chain</span><span className="hint" id="chain-hint">—</span></div>
                  <div id="chain-rows"></div>
                </div>
                <div className="panel">
                  <div className="panel-title"><span>Log Stream</span><span className="hint" id="log-hint">live</span></div>
                  <div className="log-stream" id="log-stream"></div>
                </div>
              </div>
              <div className="overview-right">
                <div className="panel">
                  <div className="panel-title"><span>Posterior</span><span className="hint">Bayesian inference</span></div>
                  <div className="posterior-display">
                    <div className="posterior-main">
                      <span className="posterior-value" id="posterior-value">—</span>
                      <span className="posterior-unit">± <span id="posterior-sigma">0.000</span></span>
                    </div>
                    <div className="posterior-meta">
                      <span className="item"><span className="label">confidence</span> <span className="val" id="posterior-conf">—</span></span>
                      <span className="item"><span className="label">evidence</span> <span className="val" id="posterior-evidence">0</span></span>
                      <span className="item"><span className="label">quorum</span> <span className="val" id="posterior-quorum">0/0</span></span>
                      <span className="item"><span className="label">epoch</span> <span className="val" id="posterior-epoch">0</span></span>
                    </div>
                    <div className="posterior-confidence">
                      <div className="fill" id="posterior-conf-fill" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="panel" style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="panel-title"><span>Policy Decisions</span><span className="hint" id="policy-hint">—</span></div>
                  <div id="policy-rows"></div>
                </div>
                <div className="panel">
                  <div className="panel-title"><span>Timeline</span><span className="hint">last 6</span></div>
                  <div className="timeline" id="timeline"></div>
                </div>
                <div className="panel">
                  <div className="panel-title"><span>Receipt</span><span className="hint">last commit</span></div>
                  <dl className="receipt" id="receipt"></dl>
                </div>
              </div>
            </div>
          </div>

          {/* Other view placeholders */}
          <div className="view" id="view-evidence">
            <div className="view-placeholder"><div className="icon">⬡</div><div>Evidence Graph</div><div className="sub">Merkle tree · hash chain · receipt linkage</div></div>
          </div>
          <div className="view" id="view-attestation">
            <div className="view-placeholder"><div className="icon">◈</div><div>Attestation Explorer</div><div className="sub">Enclave quotes · certificate chains · measurements</div></div>
          </div>
          <div className="view" id="view-bayesian">
            <div className="view-placeholder"><div className="icon">∫</div><div>Bayesian Engine</div><div className="sub">Prior · Likelihood · Posterior · Confidence interval</div></div>
          </div>
          <div className="view" id="view-journal">
            <div className="view-placeholder"><div className="icon">⊞</div><div>Event Journal</div><div className="sub">Append‑only runtime log · sequence · hashes</div></div>
          </div>
          <div className="view" id="view-governance">
            <div className="view-placeholder"><div className="icon">⚖</div><div>Governance</div><div className="sub">Policy decisions · thresholds · reasons · signatures</div></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <nav className="controls" aria-label="Kernel state simulator">
        <button data-state="IDLE" className="active">IDLE</button>
        <button data-state="INGESTING">INGEST</button>
        <button data-state="ATTESTING">ATTEST</button>
        <button data-state="VERIFYING">VERIFY</button>
        <button data-state="COMMITTING">COMMIT</button>
        <button data-state="SETTLED">SETTLED</button>
        <button data-state="HAZARD">HAZARD</button>
        <div className="sep"></div>
        <button className="auto-btn" id="auto-btn">▶ AUTO</button>
      </nav>
    </div>
  )
}
