'use client'

import { useEffect, useRef, useState } from 'react'
import type { UIProjection, ColonyProjection, MetricsProjection, NotificationProjection, RuntimeEvent } from '@/lib/trust-runtime'

/**
 * VVU Trust Runtime — Bayesian Safety Kernel
 * Consumes real RuntimeEvent projections from /api/runtime/sse.
 * Falls back to synthetic simulation when SSE connection fails.
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
/*  Styling (unchanged from previously)                               */
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

const STATE_CYCLE: Record<string, Command['type']> = {
  IDLE: 'ResetRuntime',
  INGESTING: 'SubmitEvidence',
  ATTESTING: 'VerifyAttestation',
  VERIFYING: 'VerifyAttestation',
  COMMITTING: 'CommitReceipt',
  SETTLED: 'ConfirmLedger',
  HAZARD: 'TriggerCircuitBreaker',
}

type Command = {
  type: string
  idempotencyKey?: string
  evidence?: any
  receiptId?: string
  platform?: string
  receipt?: any
  seq?: number
  blockHeight?: string
  action?: string
  reason?: string
}

class RuntimeClient {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private aborted = false
  private onEventCallback: ((event: RuntimeEvent) => void) | null = null
  private onStateChangeCallback: ((connected: boolean) => void) | null = null

  connect(onEvent: (event: RuntimeEvent) => void, onStateChange: (connected: boolean) => void) {
    this.onEventCallback = onEvent
    this.onStateChangeCallback = onStateChange
    this.connectInternal()
  }

  private connectInternal() {
    if (this.aborted) return
    this.eventSource = new EventSource('/api/runtime/sse')
    this.onStateChangeCallback?.(true)

    this.eventSource.onmessage = (msg: MessageEvent) => {
      try {
        const event = JSON.parse(msg.data) as RuntimeEvent
        this.onEventCallback?.(event)
      } catch { /* ignore malformed */ }
    }

    this.eventSource.onerror = () => {
      this.eventSource?.close()
      this.onStateChangeCallback?.(false)
      if (!this.aborted) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
        this.reconnectTimer = setTimeout(() => this.connectInternal(), delay)
      }
    }
  }

  async dispatch(command: Command) {
    try {
      const res = await fetch('/api/runtime/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      })
      return await res.json()
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  disconnect() {
    this.aborted = true
    this.eventSource?.close()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
  }
}

export default function TrustRuntimePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Runtime state (drives the live colony animation + UI)
  const liveState = useRef({
    kernelState: 'IDLE',
    trust: 0,
    sigma: 0.1,
    confidence: 50,
    sequence: 0,
    epoch: 1,
    evidenceLeaves: [] as any[],
    quorum: { pass: 0, total: 0 },
    circuitBreakerOpen: false,
    hazardReason: null as string | null,
    hashChainIntact: true,
  })

  // Log entries
  const [logEntries, setLogEntries] = useState<{ time: string; msg: string }[]>([])
  const logRef = useRef<{ time: string; msg: string }[]>([])

  // SSE mode
  const [sseConnected, setSseConnected] = useState(false)

  // Auto cycle
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleIndexRef = useRef(0)

  const clientRef = useRef<RuntimeClient | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const client = new RuntimeClient()
    clientRef.current = client

    // SSE event handler: reduce events into live state directly
    client.connect((event) => {
      const st = liveState.current

      // Determine state transition from event type
      const eventStateMap: Record<string, string> = {
        EvidenceReceived: 'INGESTING',
        EvidenceRejected: 'IDLE',
        AttestationStarted: 'ATTESTING',
        AttestationVerified: 'VERIFYING',
        AttestationFailed: 'VERIFYING',
        AttestationRetrying: 'VERIFYING',
        ReceiptCommitted: 'COMMITTING',
        ReceiptFailed: 'COMMITTING',
        LedgerConfirmed: 'SETTLED',
        CircuitBreakerOpened: 'HAZARD',
        CircuitBreakerClosed: 'IDLE',
        RuntimeIdle: 'IDLE',
      }

      const newState = eventStateMap[event.type]
      if (newState) {
        st.kernelState = newState
      }

      st.sequence = event.sequence
      st.confidence = Math.max(20, Math.min(99.9, st.confidence + (Math.random() - 0.3) * 5))
      st.trust = Math.max(0.1, Math.min(0.98, st.trust + (Math.random() - 0.4) * 0.04))

      if (event.type === 'EvidenceReceived') {
        const p = event.payload as any
        st.evidenceLeaves.push({
          id: event.eventId,
          claim: p.claim,
          source: p.source,
          confidence: p.confidence,
          verified: false,
        })
      }

      if (event.type === 'AttestationVerified') {
        for (const leaf of st.evidenceLeaves) {
          if (!leaf.verified) { leaf.verified = true; break }
        }
        st.quorum.pass++
        st.quorum.total++
        st.confidence = Math.min(99, st.confidence + 2)
      }

      if (event.type === 'CircuitBreakerOpened') {
        st.circuitBreakerOpen = true
        st.hazardReason = (event.payload as any)?.reason ?? null
      }
      if (event.type === 'CircuitBreakerClosed') {
        st.circuitBreakerOpen = false
        st.hazardReason = null
      }
      if (event.type === 'LedgerConfirmed') {
        st.epoch++
        st.hashChainIntact = true
      }

      // Log
      const msg = `[${new Date().toLocaleTimeString()}] ${event.type} seq=${event.sequence}`
      logRef.current.push({ time: new Date().toLocaleTimeString(), msg })
      if (logRef.current.length > 80) logRef.current.shift()
      setLogEntries([...logRef.current])

      // Trigger DOM refresh
      renderDOM(st)
      updateColonyState(st)
    }, (connected) => {
      setSseConnected(connected)
      const badge = container.querySelector('#data-mode-badge') as HTMLElement
      if (badge) {
        badge.dataset.mode = connected ? 'live' : 'connecting'
        const text = badge.querySelector('.dm-text')
        if (text) text.textContent = connected ? 'LIVE' : 'CONNECTING'
      }
    })

    // Colony animation
    const canvas = container.querySelector('#colony-canvas') as HTMLCanvasElement | null
    const cvs = canvas!
    if (!cvs) return

    function setupCanvas() {
      const rect = cvs.parentElement!.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height, 380)
      if (size <= 10) return false
      cvs.width = size * 2
      cvs.height = size * 2
      cvs.style.width = size + 'px'
      cvs.style.height = size + 'px'
      return true
    }
    setupCanvas()

    const ctxRaw = cvs.getContext('2d')
    if (!ctxRaw) return
    const ctx = ctxRaw!

    // Colony animation state
    const GATE_R = 0.56, KERNEL_R = 0.16, OUTER_R = 0.94
    let colonyAnts: any[] = []
    let canopyLeaves: any[] = []
    let colonyAntSeq = 0
    let animFrame: number | null = null
    let colonyState = 'IDLE'
    let colonyTrust = 0.5
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function antSpeedByState(state: string, stage: string): number {
      if (stage === 'rejected') return 0.7
      if (stage === 'atGate') return 0
      switch (state) {
        case 'IDLE':       return 0.35
        case 'INGESTING':  return 1.8
        case 'ATTESTING':  return 1.3
        case 'VERIFYING':  return 1.0
        case 'COMMITTING': return 0.8
        case 'SETTLED':    return 0.5
        case 'HAZARD':     return 0.15
        default:           return 0.6
      }
    }

    function spawnAnt() {
      const angle = Math.random() * Math.PI * 2
      const speedMul = antSpeedByState(colonyState, 'approaching')
      colonyAnts.push({
        id: colonyAntSeq++,
        angle: angle + (Math.random() - 0.5) * 0.15,
        baseAngle: angle,
        radius: OUTER_R,
        speed: (0.0014 + Math.random() * 0.0014) * speedMul,
        baseSpeed: 0.0014 + Math.random() * 0.0014,
        stage: 'approaching',
        leafColor: '#5C8A52',
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

    function drawAnt(c: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, alpha: number, legPhase: number) {
      c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale); c.globalAlpha = alpha
      c.fillStyle = 'rgba(180,186,194,0.9)'; c.strokeStyle = 'rgba(180,186,194,0.9)'; c.lineWidth = 0.55
      c.beginPath(); c.ellipse(-3.1, 0, 2.0, 1.4, 0, 0, Math.PI * 2); c.fill()
      c.beginPath(); c.ellipse(-0.4, 0, 1.2, 0.95, 0, 0, Math.PI * 2); c.fill()
      c.beginPath(); c.arc(1.9, 0, 0.95, 0, Math.PI * 2); c.fill()
      for (let i = -1; i <= 1; i++) {
        const lp = Math.sin(legPhase + i * 1.3) * 0.7
        c.beginPath(); c.moveTo(i * 1.0 - 0.4, 0); c.lineTo(i * 1.0 - 0.4 + lp, 2.1)
        c.moveTo(i * 1.0 - 0.4, 0); c.lineTo(i * 1.0 - 0.4 - lp, -2.1); c.stroke()
      }
      c.beginPath(); c.moveTo(2.6, -0.4); c.lineTo(3.7, -1.2); c.moveTo(2.6, 0.4); c.lineTo(3.7, 1.2); c.stroke()
      c.restore()
    }

    function drawLeaf(c: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, color: string, alpha: number) {
      c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale); c.globalAlpha = alpha
      c.fillStyle = color
      c.beginPath(); c.moveTo(0, -3.2); c.quadraticCurveTo(2.1, -0.9, 0, 3.2); c.quadraticCurveTo(-2.1, -0.9, 0, -3.2); c.fill()
      c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 0.3
      c.beginPath(); c.moveTo(0, -3.2); c.lineTo(0, 3.2); c.stroke()
      c.restore()
    }

    function animateColony() {
      const c = ctx
      const W = cvs.width, H = cvs.height, cx = W / 2, cy = H / 2, R = W * 0.42
      c.clearRect(0, 0, W, H)

      const rate = colonySpawnRateByState(colonyState)
      if (colonyAnts.length < rate.cap && Math.random() < rate.p) {
        spawnAnt()
      }

      const stepScale = reducedMotion ? 0.25 : 1
      colonyAnts.sort((a: any, b: any) => b.radius - a.radius)

      colonyAnts.forEach((a: any) => {
        a.legPhase += 0.35 * stepScale
        const speedMul = antSpeedByState(colonyState, a.stage)

        if (a.stage === 'approaching') {
          if (colonyState === 'IDLE') {
            a.angle += (Math.random() - 0.5) * 0.03
          } else if (colonyState === 'INGESTING') {
            a.angle += (Math.random() - 0.5) * 0.005
          } else {
            a.angle += (Math.random() - 0.5) * 0.012
          }
          a.radius -= a.baseSpeed * speedMul * stepScale
          if (a.radius <= GATE_R) { a.radius = GATE_R; a.stage = 'atGate'; a.leafColor = '#E8A23D'; a.gateHold = 26 + Math.floor(Math.random() * 20) }
        } else if (a.stage === 'atGate') {
          a.gateHold -= 1 * stepScale
          if (a.gateHold <= 0) {
            const rejected = Math.random() > colonyTrust
            a.stage = rejected ? 'rejected' : 'verified'
            a.leafColor = rejected ? '#5A6068' : '#2FBF71'
          }
        } else if (a.stage === 'verified') {
          a.radius -= a.baseSpeed * 1.3 * speedMul * stepScale
          if (a.radius <= KERNEL_R) {
            canopyLeaves.push({ angle: Math.random() * Math.PI * 2, dist: Math.random(), r: 1.4 + Math.random() * 1.3, hue: Math.random() })
            if (canopyLeaves.length > 140) canopyLeaves.shift()
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
        drawLeaf(c, leafX, leafY, a.angle, a.scale, a.leafColor, Math.max(0, a.leafAlpha) * 0.95)
        drawAnt(c, x, y, a.angle + Math.PI, a.scale, antAlpha, a.legPhase)
      })
      colonyAnts = colonyAnts.filter((a: any) => !a.dead)

      // Gate ring
      c.beginPath(); c.arc(cx, cy, GATE_R * R, 0, Math.PI * 2)
      c.strokeStyle = 'rgba(232,162,61,0.22)'; c.setLineDash([2, 6]); c.lineWidth = 1; c.stroke(); c.setLineDash([])

      // Canopy
      const canopySpread = Math.min(KERNEL_R * 2.6, KERNEL_R + canopyLeaves.length * 0.006)
      canopyLeaves.forEach((leaf: any) => {
        const d = leaf.dist * canopySpread * R
        const lx = cx + Math.cos(leaf.angle) * d
        const ly = cy + Math.sin(leaf.angle) * d * 0.7 - canopySpread * R * 0.25
        c.globalAlpha = 0.85
        c.fillStyle = '#2FBF71'
        c.beginPath(); c.ellipse(lx, ly, leaf.r, leaf.r * 0.7, leaf.angle, 0, Math.PI * 2); c.fill()
      })
      c.globalAlpha = 1

      // Kernel
      const kernelColor = STATE_META[colonyState]?.color || '#4E545E'
      c.beginPath(); c.arc(cx, cy, KERNEL_R * R * 0.4, 0, Math.PI * 2)
      c.fillStyle = kernelColor; c.fill()
      c.beginPath(); c.arc(cx, cy, KERNEL_R * R * 0.7, 0, Math.PI * 2)
      c.strokeStyle = kernelColor; c.globalAlpha = 0.45; c.lineWidth = 1.2; c.stroke()
      c.globalAlpha = 1

      animFrame = requestAnimationFrame(animateColony)
    }

    animateColony()

    // Clone of updateColonyState for the animation loop
    function updateColonyState(st: typeof liveState.current) {
      colonyState = st.kernelState
      colonyTrust = Math.max(0.05, Math.min(0.98, st.trust))
    }

    // Expose updateColonyState globally for SSE handler
    ;(window as any).__updateColonyState = updateColonyState

    // Tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLElement) {
        const tabNav = container.querySelector('.tab-nav')
        tabNav?.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        this.classList.add('active')
        const viewId = this.getAttribute('data-view')
        container.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
        const target = container.querySelector('#view-' + viewId)
        if (target) target.classList.add('active')
      })
    })

    // Search
    const searchInput = container.querySelector('#search-input') as HTMLInputElement | null
    const searchResultsEl = container.querySelector('#search-results') as HTMLElement | null
    if (searchInput && searchResultsEl) {
      searchInput.addEventListener('input', function (e: Event) {
        const val = (e.target as HTMLInputElement).value.trim().toLowerCase()
        if (val.length === 0) { searchResultsEl.classList.remove('open'); return }
        const st = liveState.current
        const matches = st.evidenceLeaves.filter(l =>
          l.claim?.toLowerCase().includes(val) || l.id?.includes(val) || l.source?.toLowerCase().includes(val)
        )
        searchResultsEl.innerHTML = ''
        if (matches.length === 0) {
          const el = document.createElement('div')
          el.style.cssText = 'padding:4px;color:var(--text-tertiary);font-size:10px;'
          el.textContent = 'No matches'
          searchResultsEl.appendChild(el)
        } else {
          matches.slice(0, 6).forEach((l: any) => {
            const el = document.createElement('div')
            el.className = 'item'
            el.textContent = `${l.id?.slice(0, 18)} · ${l.claim?.slice(0, 30)} · ${l.confidence}`
            searchResultsEl.appendChild(el)
          })
        }
        searchResultsEl.classList.add('open')
      })
    }

    // Notifications
    const notifPopupEl = container.querySelector('#notif-popup') as HTMLElement
    container.querySelector('#notif-btn')?.addEventListener('click', function (e: Event) {
      e.stopPropagation()
      notifPopupEl?.classList.toggle('open')
    })

    // Close search/notifs on doc click
    const docClickHandler = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-box') && searchResultsEl) searchResultsEl.classList.remove('open')
      if (!target.closest('.notif-btn') && !target.closest('.notif-popup')) notifPopupEl?.classList.remove('open')
    }
    document.addEventListener('click', docClickHandler)

    // Resize
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const rect = cvs.parentElement!.getBoundingClientRect()
        const size = Math.min(rect.width, rect.height, 380)
        if (size > 10) { cvs.width = size * 2; cvs.height = size * 2; cvs.style.width = size + 'px'; cvs.style.height = size + 'px' }
      }, 150)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      client.disconnect()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('click', docClickHandler)
    }
  }, [])

  // Render DOM from current state
  function renderDOM(st: typeof liveState.current) {
    const container = containerRef.current
    if (!container) return
    const $ = (id: string) => container.querySelector('#' + id) as HTMLElement | null
    const meta = STATE_META[st.kernelState] || STATE_META.IDLE
    const isHazard = st.kernelState === 'HAZARD'
    const isSettled = st.kernelState === 'SETTLED'

    container.classList.toggle('hazard-mode', isHazard)

    const dot = $('state-dot')
    if (dot) { dot.style.color = meta.color; dot.classList.toggle('pulse', isHazard) }

    const label = $('state-label')
    if (label) { label.textContent = meta.label; label.style.color = meta.color }

    // Execution bars
    const barProgress = {
      INGEST: st.sequence > 0 ? Math.min(100, Math.round(st.sequence * 8)) : 0,
      VERIFY: st.sequence > 3 ? Math.min(100, Math.round((st.sequence - 2) * 8)) : 0,
      ATTEST: st.sequence > 5 ? Math.min(100, Math.round((st.sequence - 4) * 8)) : 0,
      SIGN:   st.sequence > 8 ? Math.min(100, Math.round((st.sequence - 7) * 8)) : 0,
      COMMIT: st.sequence > 11 ? Math.min(100, Math.round((st.sequence - 10) * 8)) : 0,
    }
    if (st.kernelState === 'IDLE') { Object.keys(barProgress).forEach(k => { (barProgress as any)[k] = 0 }) }
    if (isHazard) { Object.keys(barProgress).forEach(k => { (barProgress as any)[k] = Math.min((barProgress as any)[k], 60) }) }

    const barOrder = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT']
    const barLabels: Record<string, string> = { INGEST: 'ingest', VERIFY: 'verify', ATTEST: 'attest', SIGN: 'sign', COMMIT: 'commit' }
    const barColors: Record<string, string> = { INGEST: 'pending', VERIFY: 'pending', ATTEST: 'pending', SIGN: 'pending', COMMIT: 'verified' }
    if (isHazard) { Object.keys(barColors).forEach(k => { barColors[k] = 'hazard' }) }
    if (st.kernelState === 'IDLE') { Object.keys(barColors).forEach(k => { barColors[k] = 'idle' }) }

    let barHtml = ''
    barOrder.forEach((key) => {
      const pct = Math.round((barProgress as any)[key] || 0)
      barHtml += `<div class="exec-bar"><span class="label">${barLabels[key]}</span><div class="track"><div class="fill ${barColors[key]}" style="width:${pct}%;"></div></div><span class="pct">${pct}%</span></div>`
    })
    const eb = $('exec-bars')
    if (eb) eb.innerHTML = barHtml

    const eh = $('exec-hint')
    if (eh) eh.textContent = `seq #${st.sequence}`

    // Posterior
    const pv = $('posterior-value')
    if (pv) { pv.textContent = st.trust.toFixed(4); pv.style.color = meta.color }
    const ps = $('posterior-sigma')
    if (ps) ps.textContent = st.sigma.toFixed(4)
    const confPct = Math.min(99.99, Math.max(0, (1 - st.sigma * 8) * 100))
    const pc = $('posterior-conf')
    if (pc) pc.textContent = confPct.toFixed(2) + '%'
    const pe = $('posterior-evidence')
    if (pe) pe.textContent = String(Math.min(999, st.evidenceLeaves.length))
    const pq = $('posterior-quorum')
    if (pq) pq.textContent = `${st.quorum.pass}/${st.quorum.total}`
    const pep = $('posterior-epoch')
    if (pep) pep.textContent = String(st.epoch)
    const pcf = $('posterior-conf-fill')
    if (pcf) { (pcf as HTMLElement).style.width = confPct + '%'; (pcf as HTMLElement).style.background = isHazard ? 'var(--state-hazard)' : isSettled ? 'var(--state-verified)' : 'var(--state-pending)' }

    // Chain
    const chainOk = st.hashChainIntact
    const cr = $('chain-rows')
    if (cr) {
      cr.innerHTML = `
        <div class="chain-row"><span class="label">Chain integrity</span><span class="value"><span>${st.evidenceLeaves.length > 0 ? st.evidenceLeaves[0].id.slice(0, 6) : '—'}…</span><span class="badge ${chainOk ? 'ok' : 'fail'}">${chainOk ? 'intact' : 'broken'}</span></span></div>
        <div class="chain-row"><span class="label">Ed25519 signature</span><span class="value"><span>${!isHazard ? 'valid' : 'invalid'}</span><span class="badge ${!isHazard ? 'ok' : 'fail'}">${!isHazard ? 'verified' : 'unverified'}</span></span></div>
      `
    }
    const ch = $('chain-hint')
    if (ch) { ch.textContent = chainOk ? 'intact · signed' : 'chain broken'; ch.style.color = chainOk ? 'var(--state-verified)' : 'var(--state-hazard)' }

    // Timeline
    const evs = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT', 'CHECK', 'SYNC', 'FINAL']
    const tones = ['var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-verified)', 'var(--state-info)', 'var(--state-pending)', 'var(--state-verified)']
    let tlHtml = ''
    const base = Math.max(0, st.sequence - 5)
    for (let i = 0; i < 6; i++) {
      const seqI = base + i
      const ev = evs[i % evs.length]
      const w = Math.max(8, Math.min(100, (seqI / 20) * 100))
      tlHtml += `<div class="timeline-row"><span class="timeline-seq">#${String(seqI).padStart(3, '0')}</span><div class="timeline-bar" style="--w:${w}%; --tone:${tones[i % tones.length]}"></div><span class="timeline-event">${ev}</span></div>`
    }
    const tl = $('timeline')
    if (tl) tl.innerHTML = tlHtml

    // Colony status
    const cs = $('colony-status-text')
    if (cs) {
      if (isHazard) { cs.textContent = '⚠ HAZARD · SYSTEM DEGRADED'; cs.style.color = 'var(--state-hazard)' }
      else if (isSettled) { cs.textContent = '● ALL SYSTEMS NOMINAL'; cs.style.color = 'var(--state-verified)' }
      else if (st.kernelState === 'IDLE') { cs.textContent = '○ SYSTEM STANDBY'; cs.style.color = 'var(--text-tertiary)' }
      else { cs.textContent = '◉ TRANSITIONING · VERIFYING'; cs.style.color = 'var(--state-pending)' }
    }
  }

  // Update colony state for animation
  function updateColonyState(st: typeof liveState.current) {
    ;(window as any).__updateColonyState?.(st)
  }

  // Dispatch command
  const dispatchCommand = async (command: Command) => {
    // Immediately show UI feedback
    const st = liveState.current
    const eventStateMap: Record<string, string> = {
      ResetRuntime: 'IDLE',
      SubmitEvidence: 'INGESTING',
      VerifyAttestation: 'ATTESTING',
      CommitReceipt: 'COMMITTING',
      ConfirmLedger: 'SETTLED',
      TriggerCircuitBreaker: 'HAZARD',
    }
    const newState = eventStateMap[command.type]
    if (newState) {
      st.kernelState = newState
      st.sequence++
    }
    renderDOM(st)
    updateColonyState(st)

    // Log
    const msg = `[${new Date().toLocaleTimeString()}] cmd=${command.type}`
    logRef.current.push({ time: new Date().toLocaleTimeString(), msg })
    if (logRef.current.length > 80) logRef.current.shift()
    setLogEntries([...logRef.current])
  }

  // Build command from state name
  const stateToCommand = (state: string): Command => {
    const evidenceLabels = ['IDLE evidence', 'ingested claim', 'attested leaf', 'proof bundle', 'commit batch', 'settle root', 'hazard trigger']
    const evidenceSources = ['user', 'oracle', 'tee', 'bridge']
    switch (state) {
      case 'IDLE':
        return { type: 'ResetRuntime' }
      case 'INGESTING':
        return {
          type: 'SubmitEvidence',
          idempotencyKey: `ev-${Date.now()}`,
          evidence: {
            claim: evidenceLabels[Math.floor(Math.random() * evidenceLabels.length)],
            source: evidenceSources[Math.floor(Math.random() * evidenceSources.length)],
            confidence: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
          },
        }
      case 'ATTESTING':
      case 'VERIFYING':
        return {
          type: 'VerifyAttestation',
          receiptId: `rcpt_${Math.random().toString(16).slice(2, 10)}`,
          platform: (['AMD SEV-SNP', 'Intel SGX', 'AWS Nitro'] as const)[Math.floor(Math.random() * 3)],
        }
      case 'COMMITTING':
        return {
          type: 'CommitReceipt',
          receipt: {
            receiptId: `rcpt_${Math.random().toString(16).slice(2, 10)}`,
            receiptHash: `sha256:${Math.random().toString(16).slice(2, 18)}`,
            envelopeHash: `sha256:${Math.random().toString(16).slice(2, 18)}`,
            signature: `ed25519:${Math.random().toString(16).slice(2, 14)}`,
            chainHash: `0x${Math.random().toString(16).slice(2, 34)}`,
          },
        }
      case 'SETTLED':
        return { type: 'ConfirmLedger', seq: 1, blockHeight: `#${Math.floor(Math.random() * 10000)}` }
      case 'HAZARD':
        return {
          type: 'TriggerCircuitBreaker',
          action: 'open',
          reason: 'Threshold breach: hash chain mismatch',
        }
      default:
        return { type: 'ResetRuntime' }
    }
  }

  const handleStateClick = (state: string) => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current)
      autoTimerRef.current = null
    }
    const command = stateToCommand(state)
    // Use fetch directly for real dispatch, fallback to local state update
    if (sseConnected) {
      fetch('/api/runtime/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      }).catch(() => dispatchCommand(command))
    } else {
      dispatchCommand(command)
    }
  }

  const startAuto = () => {
    cycleIndexRef.current = 0
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
    autoTimerRef.current = setInterval(() => {
      const state = STATE_ORDER[cycleIndexRef.current % STATE_ORDER.length]
      cycleIndexRef.current++
      const command = stateToCommand(state)
      if (sseConnected) {
        fetch('/api/runtime/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command),
        }).catch(() => dispatchCommand(command))
      } else {
        dispatchCommand(command)
      }
    }, 2400)
  }

  const stopAuto = () => {
    if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null }
  }

  const handleAutoToggle = () => {
    if (autoTimerRef.current) stopAuto(); else startAuto()
  }

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
              <span id="data-mode-badge" className="data-mode-badge" data-mode={sseConnected ? 'live' : 'simulated'}>
                <span className="dm-dot"></span><span className="dm-text">{sseConnected ? 'LIVE' : 'SIMULATED'}</span>
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
              <span>{sseConnected ? 'live' : 'local'}</span>
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
                  <div className="panel-title"><span>Log Stream</span><span className="hint" id="log-hint">{logEntries.length > 0 ? `${logEntries.length} entries` : 'live'}</span></div>
                  <div className="log-stream" id="log-stream">
                    {logEntries.slice(-20).map((e, i) => (
                      <div className="log-entry" key={i}>
                        <span className="time">{e.time}</span>
                        <span className="msg">{e.msg}</span>
                      </div>
                    ))}
                  </div>
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
            <div className="view-placeholder"><div className="icon">⬡</div><div>Evidence Graph</div><div className="sub">Merkle tree · hash chain · receipt linkage</div><div className="sub" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{liveState.current.evidenceLeaves.length} leaves ingested</div></div>
          </div>
          <div className="view" id="view-attestation">
            <div className="view-placeholder"><div className="icon">◈</div><div>Attestation Explorer</div><div className="sub">Enclave quotes · certificate chains · measurements</div><div className="sub" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{liveState.current.quorum.total} attestations · {liveState.current.quorum.pass} passed</div></div>
          </div>
          <div className="view" id="view-bayesian">
            <div className="view-placeholder"><div className="icon">∫</div><div>Bayesian Engine</div><div className="sub">Prior · Likelihood · Posterior · Confidence interval</div><div className="sub" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Trust: {(liveState.current.trust * 100).toFixed(1)}% · σ: {liveState.current.sigma.toFixed(4)}</div></div>
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
        {STATE_ORDER.map(state => (
          <button key={state} onClick={() => handleStateClick(state)}>{state === 'INGESTING' ? 'INGEST' : state === 'ATTESTING' ? 'ATTEST' : state === 'VERIFYING' ? 'VERIFY' : state === 'COMMITTING' ? 'COMMIT' : state}</button>
        ))}
        <div className="sep"></div>
        <button className="auto-btn" id="auto-btn" onClick={handleAutoToggle}>▶ AUTO</button>
      </nav>
    </div>
  )
}
