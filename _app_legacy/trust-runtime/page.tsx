'use client'

import { useEffect, useRef } from 'react'

export default function TrustRuntimePage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Prevent double-init in Strict Mode / re-mounts
    if (containerRef.current.hasAttribute('data-vvu-init')) return
    containerRef.current.setAttribute('data-vvu-init', '1')

    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VVU · Trust Runtime — Venture Vision Ubuntu</title>
    <meta name="description" content="Venture Vision Ubuntu — Trust Runtime Operating System. Deterministic projection of the Bayesian Safety Kernel." />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='35' cy='40' r='16' stroke='%238A9A5B' stroke-width='7' fill='none'/%3E%3Ccircle cx='65' cy='40' r='16' stroke='%23CC7722' stroke-width='7' fill='none'/%3E%3Ccircle cx='50' cy='64' r='16' stroke='%23E2E3DB' stroke-width='7' fill='none'/%3E%3C/svg%3E" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fragment+Mono:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* ------------------------------------------------------------------
           VVU Trust Runtime — Design System
           ------------------------------------------------------------------ */
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
            --s-1: 4px;
            --s-2: 8px;
            --s-3: 12px;
            --s-4: 16px;
            --s-5: 24px;
            --s-6: 32px;
            --s-7: 48px;
            --s-8: 64px;
            --r-sm: 3px;
            --r-md: 5px;
            --r-lg: 8px;
            --r-pill: 999px;
            --dur-micro: 80ms;
            --dur-state: 300ms;
            --dur-hazard: 500ms;
            --ease-state: cubic-bezier(0.2, 0.9, 0.3, 1);
            --ease-hazard: cubic-bezier(0.4, 0, 0.6, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: var(--bg-base); }
        body {
            color: var(--text-primary);
            font-family: var(--font-body);
            font-size: 12.5px;
            font-weight: 400;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Layout */
        .app { display: flex; flex-direction: column; height: 100vh; max-height: 100vh; overflow: hidden; }

        /* Top bar */
        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px var(--s-4);
            border-bottom: 1px solid var(--border-hairline);
            background: var(--bg-base);
            flex-shrink: 0;
            gap: var(--s-3);
            flex-wrap: nowrap;
            z-index: 10;
        }
        .topbar-left {
            display: flex;
            align-items: center;
            gap: var(--s-3);
            flex-shrink: 0;
        }
        .brand-logo {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .brand-logo svg { width: 22px; height: 22px; flex-shrink: 0; }
        .brand-mark {
            font-family: var(--font-display);
            font-size: 12px;
            font-weight: 500;
            letter-spacing: -0.01em;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .brand-mark .sep { color: var(--text-tertiary); }
        .brand-mark .sub { color: var(--text-tertiary); font-size: 10px; font-weight: 400; }
        .brand-mark .brand-full { font-weight: 600; letter-spacing: 0.02em; color: var(--text-primary); }

        .data-mode-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-left: var(--s-3);
            padding: 2px 8px;
            border-radius: var(--r-pill);
            border: 1px solid var(--border-hairline);
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.06em;
            color: var(--text-tertiary);
            background: var(--bg-inset);
        }
        .data-mode-badge .dm-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-tertiary); flex-shrink: 0; }
        .data-mode-badge[data-mode="connecting"] { color: var(--state-pending); border-color: rgba(232,162,61,0.35); }
        .data-mode-badge[data-mode="connecting"] .dm-dot { background: var(--state-pending); animation: dm-connecting 900ms ease-in-out infinite; }
        @keyframes dm-connecting { 0%,100%{ opacity:0.35; transform:scale(0.8); } 50%{ opacity:1; transform:scale(1.15); } }
        .data-mode-badge[data-mode="live"] { color: var(--state-verified); border-color: rgba(47,191,113,0.35); }
        .data-mode-badge[data-mode="live"] .dm-dot { background: var(--state-verified); }
        .data-mode-badge[data-mode="replay"] { color: var(--state-info); border-color: rgba(76,140,245,0.35); }
        .data-mode-badge[data-mode="replay"] .dm-dot { background: var(--state-info); animation: dm-connecting 900ms ease-in-out infinite; }

        .state-head {
            display: flex;
            align-items: center;
            gap: var(--s-2);
            margin-left: var(--s-3);
            padding-left: var(--s-3);
            border-left: 1px solid var(--border-hairline);
        }
        .status-dot {
            position: relative;
            display: inline-flex;
            width: 8px;
            height: 8px;
            flex-shrink: 0;
        }
        .status-dot::before {
            content: "";
            width: 8px; height: 8px;
            border-radius: var(--r-pill);
            background: currentColor;
            display: block;
            transition: background var(--dur-state) var(--ease-state);
        }
        .status-dot.pulse::after {
            content: "";
            position: absolute;
            inset: -2px;
            border-radius: var(--r-pill);
            background: currentColor;
            animation: pulse-ring var(--dur-hazard) var(--ease-hazard) infinite;
        }
        @keyframes pulse-ring { 0%{ transform:scale(1); opacity:0.5; } 100%{ transform:scale(2.4); opacity:0; } }
        .state-label {
            font-family: var(--font-display);
            font-size: 14px;
            font-weight: 500;
            letter-spacing: -0.01em;
            transition: color var(--dur-state) var(--ease-state);
        }

        .topbar-center {
            display: flex;
            align-items: center;
            gap: var(--s-2);
            flex: 1;
            max-width: 420px;
            min-width: 120px;
        }
        .search-box {
            background: var(--bg-inset);
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-pill);
            padding: 2px 10px;
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            position: relative;
        }
        .search-box input {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: var(--font-body);
            font-size: 11px;
            width: 100%;
            outline: none;
            padding: 4px 0;
        }
        .search-box input::placeholder { color: var(--text-tertiary); }
        .search-box svg { width: 12px; height: 12px; stroke: var(--text-tertiary); fill: none; stroke-width: 1.75; flex-shrink: 0; }
        .search-results {
            display: none;
            position: absolute;
            top: 100%;
            left: 0; right: 0;
            background: var(--bg-overlay);
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-lg);
            padding: var(--s-2);
            max-height: 180px;
            overflow-y: auto;
            z-index: 100;
            margin-top: 2px;
        }
        .search-results.open { display: block; }
        .search-results .item {
            padding: 4px 6px;
            font-family: var(--font-mono);
            font-size: 10px;
            color: var(--text-secondary);
            cursor: pointer;
            border-radius: var(--r-sm);
            transition: background var(--dur-micro) ease;
        }
        .search-results .item:hover { background: var(--bg-raised); color: var(--text-primary); }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: var(--s-2);
            flex-shrink: 0;
        }
        .notif-btn {
            position: relative;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--r-sm);
            transition: color var(--dur-micro) ease;
            display: flex;
            align-items: center;
        }
        .notif-btn:hover { color: var(--text-primary); }
        .notif-btn .badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: var(--state-hazard);
            color: var(--bg-base);
            font-family: var(--font-mono);
            font-size: 8px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        .notif-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.75; }
        .live-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--state-verified);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .live-indicator .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--state-verified);
            animation: pulse-dot 1.4s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.2; transform:scale(0.6); } }
        .live-indicator.replay { color: var(--state-info); }
        .live-indicator.replay .dot { background: var(--state-info); animation: none; opacity: 1; }

        .notif-popup {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--bg-overlay);
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-lg);
            padding: var(--s-3);
            width: 260px;
            max-height: 260px;
            overflow-y: auto;
            z-index: 100;
            margin-top: 2px;
        }
        .notif-popup.open { display: block; }
        .notif-popup .notif-item { padding: 4px 0; border-bottom: 1px solid var(--border-hairline); font-size: 11px; color: var(--text-secondary); }
        .notif-popup .notif-item .time { color: var(--text-tertiary); font-family: var(--font-mono); font-size: 9px; }

        /* Tab navigation */
        .tab-nav {
            display: flex;
            align-items: center;
            gap: 0;
            padding: 0 var(--s-4);
            border-bottom: 1px solid var(--border-hairline);
            background: var(--bg-base);
            flex-shrink: 0;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .tab-nav::-webkit-scrollbar { display: none; }
        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-tertiary);
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 500;
            padding: 8px 14px;
            cursor: pointer;
            transition: color var(--dur-micro) ease, border-color var(--dur-micro) ease;
            border-bottom: 2px solid transparent;
            white-space: nowrap;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--state-verified); }

        /* Main content */
        .main-content { display: flex; flex: 1; overflow: hidden; position: relative; }
        .view { display: none; flex: 1; overflow: hidden; position: relative; }
        .view.active { display: flex; }

        /* Runtime Overview */
        .overview-layout {
            display: flex;
            height: 100%;
            width: 100%;
            gap: 0;
            background: var(--bg-base);
        }
        .overview-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: var(--s-4);
            gap: var(--s-3);
            overflow-y: auto;
            min-width: 0;
        }
        .overview-right {
            width: 380px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            padding: var(--s-4);
            gap: var(--s-3);
            overflow-y: auto;
            border-left: 1px solid var(--border-hairline);
            background: var(--bg-raised);
        }
        @media (max-width: 900px) {
            .overview-layout { flex-direction: column; }
            .overview-right { width: 100%; border-left: none; border-top: 1px solid var(--border-hairline); max-height: 50vh; }
        }

        .panel {
            background: var(--bg-raised);
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-lg);
            padding: var(--s-3);
        }
        .panel-title {
            font-family: var(--font-body);
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            margin-bottom: var(--s-2);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .panel-title .hint { font-weight: 400; letter-spacing: 0.02em; text-transform: none; font-size: 10px; }

        /* Execution bars */
        .execution-bars { display: flex; flex-direction: column; gap: 3px; }
        .exec-bar {
            display: flex;
            align-items: center;
            gap: var(--s-2);
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--text-tertiary);
        }
        .exec-bar .label { width: 44px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
        .exec-bar .track { flex: 1; height: 4px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; position: relative; }
        .exec-bar .track .fill { height: 100%; border-radius: var(--r-pill); transition: width var(--dur-state) var(--ease-state); width: 0%; }
        .exec-bar .track .fill.verified { background: var(--state-verified); }
        .exec-bar .track .fill.pending { background: var(--state-pending); }
        .exec-bar .track .fill.hazard { background: var(--state-hazard); }
        .exec-bar .pct { width: 28px; flex-shrink: 0; text-align: right; font-size: 9px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }

        /* Posterior */
        .posterior-display { display: flex; flex-direction: column; gap: var(--s-1); }
        .posterior-main { display: flex; align-items: baseline; gap: var(--s-3); }
        .posterior-value { font-family: var(--font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; transition: color var(--dur-state) var(--ease-state); }
        .posterior-unit { font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
        .posterior-meta { display: flex; flex-wrap: wrap; gap: var(--s-3); font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); margin-top: var(--s-1); }
        .posterior-meta .item { display: flex; align-items: center; gap: 4px; }
        .posterior-meta .item .val { color: var(--text-secondary); font-weight: 500; }
        .posterior-meta .item .label { color: var(--text-tertiary); text-transform: uppercase; font-size: 8px; letter-spacing: 0.04em; }
        .posterior-confidence { height: 3px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; margin-top: var(--s-1); }
        .posterior-confidence .fill { height: 100%; border-radius: var(--r-pill); transition: width var(--dur-state) var(--ease-state), background var(--dur-state) var(--ease-state); width: 0%; }

        /* Policy rows — NO ICONS */
        .policy {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid var(--border-hairline);
            gap: var(--s-2);
        }
        .policy:last-child { border-bottom: 0; }
        .policy-left { display: flex; align-items: center; gap: var(--s-2); min-width: 0; }
        .policy-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .policy-indicator.ok { background: var(--state-verified); }
        .policy-indicator.fail { background: var(--state-hazard); }
        .policy-label { font-size: 11px; color: var(--text-secondary); }
        .policy-tier { font-family: var(--font-mono); font-size: 8px; color: var(--text-tertiary); padding: 0 4px; border: 1px solid var(--border-hairline); border-radius: var(--r-sm); }
        .policy-right { display: flex; align-items: center; gap: var(--s-2); font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); flex-shrink: 0; }
        .policy-bar { width: 50px; height: 2px; background: var(--bg-inset); border-radius: var(--r-pill); overflow: hidden; position: relative; }
        .policy-bar::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(--fill); background: var(--tone, var(--state-verified)); transition: width var(--dur-state) var(--ease-state); }
        .policy-bar::after { content: ""; position: absolute; top: -1px; bottom: -1px; left: var(--threshold); width: 1px; background: var(--text-tertiary); }

        /* Timeline */
        .timeline { display: flex; flex-direction: column; gap: 1px; }
        .timeline-row {
            display: grid;
            grid-template-columns: 36px 1fr auto;
            align-items: center;
            gap: var(--s-2);
            padding: 3px 0;
            font-family: var(--font-mono);
            font-size: 9px;
        }
        .timeline-seq { color: var(--text-tertiary); }
        .timeline-bar { height: 2px; background: var(--bg-inset); border-radius: var(--r-pill); position: relative; overflow: hidden; }
        .timeline-bar::before { content: ""; position: absolute; inset: 0; width: var(--w, 100%); background: var(--tone, var(--state-verified)); transition: width var(--dur-state) var(--ease-state); }
        .timeline-event { color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; font-size: 8px; }

        /* Hash Chain — NO ICONS */
        .chain-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid var(--border-hairline);
            gap: var(--s-2);
        }
        .chain-row:last-child { border-bottom: 0; }
        .chain-row .label { font-size: 11px; color: var(--text-secondary); }
        .chain-row .value { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); display: flex; align-items: center; gap: var(--s-2); }
        .chain-row .badge {
            padding: 1px 8px;
            border-radius: var(--r-pill);
            font-size: 9px;
            font-weight: 500;
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .badge.ok { background: rgba(47,191,113,0.15); color: var(--state-verified); }
        .badge.fail { background: rgba(229,72,77,0.15); color: var(--state-hazard); }
        .badge.pending { background: rgba(232,162,61,0.15); color: var(--state-pending); }

        /* Attestation */
        .attestation {
            display: flex;
            flex-direction: column;
            gap: var(--s-1);
            padding: var(--s-2) 0;
            border-bottom: 1px solid var(--border-hairline);
        }
        .attestation:last-child { border-bottom: 0; }
        .attestation-head { display: flex; align-items: center; gap: var(--s-2); }
        .attestation-head .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .attestation-platform { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
        .attestation-meta { font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); padding-left: 20px; line-height: 1.5; }

        /* Receipt */
        .receipt {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: var(--s-1) var(--s-2);
            font-family: var(--font-mono);
            font-size: 9px;
        }
        .receipt dt { color: var(--text-tertiary); }
        .receipt dd { color: var(--text-secondary); word-break: break-all; }

        /* Evidence Colony — ANIMATED */
        .colony-container {
            position: relative;
            width: 100%;
            aspect-ratio: 1/1;
            max-width: 380px;
            margin: 0 auto;
            background: var(--bg-raised);
            border-radius: 50%;
            overflow: hidden;
            border: 1px solid var(--border-hairline);
            flex-shrink: 0;
        }
        .colony-container canvas { width: 100% !important; height: 100% !important; display: block; }
        .colony-health-label {
            text-align: center;
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--text-tertiary);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: var(--s-1) 0;
        }
        .colony-health-label .status-text { transition: color var(--dur-state) var(--ease-state); font-weight: 500; }

        /* Log Stream */
        .log-stream {
            background: var(--bg-inset);
            border-radius: var(--r-sm);
            padding: var(--s-2);
            max-height: 140px;
            overflow-y: auto;
            font-family: var(--font-mono);
            font-size: 9px;
            line-height: 1.6;
            color: var(--text-secondary);
            border: 1px solid var(--border-hairline);
        }
        .log-stream .log-entry {
            display: flex;
            gap: var(--s-2);
            border-bottom: 1px solid var(--border-hairline);
            padding: 2px 0;
        }
        .log-stream .log-entry .time { color: var(--text-tertiary); flex-shrink: 0; }
        .log-stream .log-entry .msg { word-break: break-all; }
        .log-stream .log-entry .msg .highlight { color: var(--state-info); }

        /* Other views */
        .view-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            color: var(--text-tertiary);
            font-family: var(--font-mono);
            font-size: 12px;
            padding: var(--s-7);
            text-align: center;
            gap: var(--s-3);
        }
        .view-placeholder .icon { font-size: 28px; opacity: 0.3; }
        .view-placeholder .sub { font-size: 10px; color: var(--text-disabled); }

        /* Hazard mode */
        .hazard-mode .colony-container { border-color: var(--state-hazard); }
        .hazard-mode .panel { border-color: var(--state-hazard); opacity: 0.85; }
        .hazard-mode .state-label { color: var(--state-hazard) !important; }
        .hazard-mode .posterior-value { color: var(--state-hazard) !important; }
        .hazard-mode .live-indicator { color: var(--state-hazard); }
        .hazard-mode .live-indicator .dot { background: var(--state-hazard); animation: pulse-dot-hazard 0.6s ease-in-out infinite; }
        @keyframes pulse-dot-hazard { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.1; transform:scale(0.4); } }

        @keyframes shake-card { 0%{ transform:translateX(0); } 20%{ transform:translateX(-4px); } 40%{ transform:translateX(4px); } 60%{ transform:translateX(-3px); } 80%{ transform:translateX(3px); } 100%{ transform:translateX(0); } }
        .shake { animation: shake-card 0.4s var(--ease-hazard) 1; }
        @keyframes count-up { 0%{ opacity:0.6; transform:translateY(1px); } 100%{ opacity:1; transform:translateY(0); } }
        .count-up { animation: count-up 0.25s var(--ease-state) 1; }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: var(--bg-inset); }
        ::-webkit-scrollbar-thumb { background: var(--border-hairline); border-radius: var(--r-pill); }

        /* Time-Travel Replay bar */
        .replay-bar {
            display: flex;
            align-items: center;
            gap: var(--s-3);
            padding: 5px var(--s-4);
            border-top: 1px solid var(--border-hairline);
            background: var(--bg-inset);
            flex-shrink: 0;
        }
        .replay-bar input[type="range"] {
            flex: 1;
            accent-color: var(--state-info);
            background: var(--bg-raised);
            height: 2px;
            border-radius: var(--r-pill);
            outline: none;
        }
        .replay-bar input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--state-info);
            cursor: pointer;
        }
        .replay-bar input[type="range"]::-moz-range-thumb {
            width: 10px;
            height: 10px;
            border: none;
            border-radius: 50%;
            background: var(--state-info);
            cursor: pointer;
        }
        .replay-bar .time-label {
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--text-tertiary);
            min-width: 58px;
            flex-shrink: 0;
        }
        .replay-bar .replay-label {
            font-family: var(--font-mono);
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            flex-shrink: 0;
        }
        .replay-bar .replay-btn {
            background: transparent;
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-pill);
            color: var(--text-secondary);
            padding: 2px 10px;
            font-family: var(--font-mono);
            font-size: 9px;
            cursor: pointer;
            transition: background var(--dur-micro) ease, color var(--dur-micro) ease;
            flex-shrink: 0;
        }
        .replay-bar .replay-btn:hover { background: var(--bg-raised); color: var(--text-primary); }
        .replay-bar .replay-btn.live-btn.at-tail { color: var(--state-verified); border-color: rgba(47,191,113,0.35); }

        @media (max-width: 700px) {
            .topbar { flex-wrap: wrap; padding: 4px var(--s-3); }
            .topbar-center { order: 3; flex-basis: 100%; max-width: 100%; margin-top: 2px; }
            .overview-right { width: 100%; max-height: 40vh; }
            .colony-container { max-width: 200px; }
            .tab-btn { font-size: 9px; padding: 6px 10px; }
            .brand-mark .brand-full { display: none; }
            .data-mode-badge .dm-text { display: none; }
            .replay-bar .replay-label { display: none; }
        }

        /* Controls */
        .controls {
            position: fixed;
            bottom: var(--s-3);
            right: var(--s-3);
            background: var(--bg-overlay);
            border: 1px solid var(--border-hairline);
            border-radius: var(--r-md);
            padding: 4px 6px;
            display: flex;
            gap: 2px;
            z-index: 50;
            font-family: var(--font-mono);
            font-size: 9px;
            flex-wrap: wrap;
            max-width: calc(100vw - var(--s-5));
        }
        .controls button {
            background: transparent;
            color: var(--text-tertiary);
            border: 1px solid transparent;
            padding: 3px 7px;
            border-radius: var(--r-sm);
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
            transition: background var(--dur-micro) ease, color var(--dur-micro) ease;
        }
        .controls button:hover { color: var(--text-primary); background: var(--bg-raised); }
        .controls button.active { color: var(--text-primary); background: var(--bg-raised); border-color: var(--border-hairline); }
        .controls .sep { width: 1px; background: var(--border-hairline); margin: 2px 2px; }
        .controls .auto-btn { color: var(--state-info); }
        .controls .auto-btn:hover { color: var(--state-info); }
    </style>
</head>
<body>

    <div class="app" id="app">

        <!-- TOP BAR -->
        <header class="topbar">
            <div class="topbar-left">
                <div class="brand-logo" title="Venture Vision Ubuntu">
                    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
                        <circle cx="35" cy="40" r="16" stroke="#8A9A5B" stroke-width="5" />
                        <circle cx="65" cy="40" r="16" stroke="#CC7722" stroke-width="5" />
                        <circle cx="50" cy="64" r="16" stroke="#E2E3DB" stroke-width="5" />
                    </svg>
                    <div class="brand-mark">
                        <span class="brand-full">VENTURE VISION UBUNTU</span><span class="sep">/</span><span class="sub">trust-runtime</span>
                    </div>
                </div>
                <div class="state-head">
                    <span id="state-dot" class="status-dot" style="color: var(--state-idle)"></span>
                    <span id="state-label" class="state-label">IDLE</span>
                    <span id="data-mode-badge" class="data-mode-badge" data-mode="simulated" title="Data source for this session">
                        <span class="dm-dot"></span><span class="dm-text">SIMULATED</span>
                    </span>
                </div>
            </div>
            <div class="topbar-center">
                <div class="search-box">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search journal, receipts, events…" id="search-input" />
                    <div class="search-results" id="search-results"></div>
                </div>
            </div>
            <div class="topbar-right">
                <div class="live-indicator" id="live-indicator">
                    <span class="dot"></span>
                    <span id="live-indicator-label">live</span>
                </div>
                <div class="relative">
                    <button class="notif-btn" id="notif-btn" aria-label="Notifications">
                        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span class="badge" id="notif-badge">0</span>
                    </button>
                    <div class="notif-popup" id="notif-popup"></div>
                </div>
            </div>
        </header>

        <!-- TAB NAV -->
        <nav class="tab-nav" id="tab-nav">
            <button class="tab-btn active" data-view="overview">Runtime</button>
            <button class="tab-btn" data-view="evidence">Evidence</button>
            <button class="tab-btn" data-view="attestation">Attestation</button>
            <button class="tab-btn" data-view="bayesian">Bayesian</button>
            <button class="tab-btn" data-view="journal">Journal</button>
            <button class="tab-btn" data-view="governance">Governance</button>
        </nav>

        <!-- MAIN CONTENT -->
        <div class="main-content">

            <!-- VIEW: Runtime Overview -->
            <div class="view active" id="view-overview">
                <div class="overview-layout">
                    <div class="overview-left">
                        <!-- Evidence Colony — ANIMATED -->
                        <div class="colony-container" id="colony-container">
                            <canvas id="colony-canvas"></canvas>
                        </div>
                        <div class="colony-health-label">
                            <span class="status-text" id="colony-status-text">● ALL SYSTEMS NOMINAL</span>
                        </div>

                        <!-- Execution Bars -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Execution</span>
                                <span class="hint" id="exec-hint">seq #0</span>
                            </div>
                            <div class="execution-bars" id="exec-bars"></div>
                        </div>

                        <!-- Hash Chain — NO ICONS -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Hash Chain</span>
                                <span class="hint" id="chain-hint">—</span>
                            </div>
                            <div id="chain-rows"></div>
                        </div>

                        <!-- LOG STREAM -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Log Stream</span>
                                <span class="hint" id="log-hint">live</span>
                            </div>
                            <div class="log-stream" id="log-stream"></div>
                        </div>
                    </div>

                    <div class="overview-right">
                        <!-- Posterior / Trust -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Posterior</span>
                                <span class="hint">Bayesian inference</span>
                            </div>
                            <div class="posterior-display">
                                <div class="posterior-main">
                                    <span class="posterior-value" id="posterior-value">—</span>
                                    <span class="posterior-unit">± <span id="posterior-sigma">0.000</span></span>
                                </div>
                                <div class="posterior-meta">
                                    <span class="item"><span class="label">confidence</span> <span class="val" id="posterior-conf">—</span></span>
                                    <span class="item"><span class="label">evidence</span> <span class="val" id="posterior-evidence">0</span></span>
                                    <span class="item"><span class="label">quorum</span> <span class="val" id="posterior-quorum">0/0</span></span>
                                    <span class="item"><span class="label">epoch</span> <span class="val" id="posterior-epoch">0</span></span>
                                </div>
                                <div class="posterior-confidence">
                                    <div class="fill" id="posterior-conf-fill" style="width:0%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Policy Decisions — NO ICONS -->
                        <div class="panel" style="flex:1; overflow-y:auto;">
                            <div class="panel-title">
                                <span>Policy Decisions</span>
                                <span class="hint" id="policy-hint">—</span>
                            </div>
                            <div id="policy-rows"></div>
                        </div>

                        <!-- Timeline -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Timeline</span>
                                <span class="hint">last 6</span>
                            </div>
                            <div class="timeline" id="timeline"></div>
                        </div>

                        <!-- Receipt -->
                        <div class="panel">
                            <div class="panel-title">
                                <span>Receipt</span>
                                <span class="hint">last commit</span>
                            </div>
                            <dl class="receipt" id="receipt"></dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Other views (placeholders) -->
            <div class="view" id="view-evidence">
                <div class="view-placeholder"><div class="icon">⬡</div><div>Evidence Graph</div><div class="sub">Merkle tree · hash chain · receipt linkage</div></div>
            </div>
            <div class="view" id="view-attestation">
                <div class="view-placeholder"><div class="icon">◈</div><div>Attestation Explorer</div><div class="sub">Enclave quotes · certificate chains · measurements</div></div>
            </div>
            <div class="view" id="view-bayesian">
                <div class="view-placeholder"><div class="icon">∫</div><div>Bayesian Engine</div><div class="sub">Prior · Likelihood · Posterior · Confidence interval</div></div>
            </div>
            <div class="view" id="view-journal">
                <div class="view-placeholder"><div class="icon">⊞</div><div>Event Journal</div><div class="sub">Append‑only runtime log · sequence · hashes</div></div>
            </div>
            <div class="view" id="view-governance">
                <div class="view-placeholder"><div class="icon">⚖</div><div>Governance</div><div class="sub">Policy decisions · thresholds · reasons · signatures</div></div>
            </div>

        </div>

        <!-- TIME-TRAVEL REPLAY BAR -->
        <div class="replay-bar" id="replay-bar">
            <span class="replay-label">replay</span>
            <button class="replay-btn" id="replay-play-btn" title="Play/pause history playback">▶</button>
            <span class="time-label" id="replay-time">seq 0</span>
            <input type="range" id="replay-slider" min="0" max="0" value="0" />
            <span class="time-label" id="replay-total">seq 0</span>
            <button class="replay-btn live-btn at-tail" id="replay-live-btn" title="Jump to live tail">⟲ live</button>
        </div>
    </div>

    <!-- Controls -->
    <nav class="controls" aria-label="Kernel state simulator">
        <button data-state="IDLE" class="active">IDLE</button>
        <button data-state="INGESTING">INGEST</button>
        <button data-state="ATTESTING">ATTEST</button>
        <button data-state="VERIFYING">VERIFY</button>
        <button data-state="COMMITTING">COMMIT</button>
        <button data-state="SETTLED">SETTLED</button>
        <button data-state="HAZARD">HAZARD</button>
        <div class="sep"></div>
        <button class="auto-btn" id="auto-btn">▶ AUTO</button>
    </nav>

    <script>
        /* ---------------------------------------------------------------------
           VVU Trust Runtime — Production layout
           Base: Trust Runtime dashboard (tabs, animated evidence colony,
           posterior/policy/hash-chain/log panels, live+simulated data modes).
           Added: Time-Travel Replay Adapter (scrub/play/live-tail) wired to
           the existing snapshotHistory ring buffer, so replay is a read-only
           view over already-applied snapshots — it never re-emits history
           through the live event/log/notification pipeline.
           --------------------------------------------------------------------- */

        const STATE_META = {
            IDLE: { label: 'IDLE', tone: 'idle', color: '#4E545E' },
            INGESTING: { label: 'INGESTING', tone: 'pending', color: '#E8A23D' },
            ATTESTING: { label: 'ATTESTING', tone: 'pending', color: '#E8A23D' },
            VERIFYING: { label: 'VERIFYING', tone: 'pending', color: '#E8A23D' },
            COMMITTING: { label: 'COMMITTING', tone: 'pending', color: '#E8A23D' },
            SETTLED: { label: 'SETTLED', tone: 'verified', color: '#2FBF71' },
            HAZARD: { label: 'HAZARD', tone: 'hazard', color: '#E5484D' },
        };
        const STATE_ORDER = ['IDLE', 'INGESTING', 'ATTESTING', 'VERIFYING', 'COMMITTING', 'SETTLED', 'HAZARD'];

        let currentState = 'IDLE';
        let currentSeq = 0;
        let eventCount = 0;
        let snapshotHistory = [];
        let logEntries = [];
        let auditLog = [];
        let notifCount = 0;
        let autoTimer = null;
        let dataMode = 'simulated';

        // Replay state
        let isReplaying = false;
        let replayIndex = 0;
        let replayInterval = null;
        let wasAutoRunningBeforeReplay = false;

        const $ = id => document.getElementById(id);
        const stateDot = $('state-dot');
        const stateLabel = $('state-label');
        const posteriorValue = $('posterior-value');
        const posteriorSigma = $('posterior-sigma');
        const posteriorConf = $('posterior-conf');
        const posteriorEvidence = $('posterior-evidence');
        const posteriorQuorum = $('posterior-quorum');
        const posteriorEpoch = $('posterior-epoch');
        const posteriorConfFill = $('posterior-conf-fill');
        const policyRows = $('policy-rows');
        const policyHint = $('policy-hint');
        const chainRows = $('chain-rows');
        const chainHint = $('chain-hint');
        const timeline = $('timeline');
        const receipt = $('receipt');
        const execBars = $('exec-bars');
        const execHint = $('exec-hint');
        const colonyStatus = $('colony-status-text');
        const notifBadge = $('notif-badge');
        const notifPopup = $('notif-popup');
        const notifBtn = $('notif-btn');
        const searchInput = $('search-input');
        const searchResults = $('search-results');
        const app = $('app');
        const logStream = $('log-stream');
        const logHint = $('log-hint');
        const liveIndicator = $('live-indicator');
        const liveIndicatorLabel = $('live-indicator-label');
        const replayPlayBtn = $('replay-play-btn');
        const replayLiveBtn = $('replay-live-btn');
        const replaySlider = $('replay-slider');
        const replayTime = $('replay-time');
        const replayTotal = $('replay-total');

        // ---- Deterministic snapshot --------------------
        function buildSnapshot(state, seq) {
            const isHazard = state === 'HAZARD';
            const isSettled = state === 'SETTLED';
            const isIdle = state === 'IDLE';
            const progress = Math.min(100, Math.round((seq / 20) * 100));

            const evMap = {
                IDLE: '000000000000',
                INGESTING: 'a3f19c0b7e24',
                ATTESTING: '8b2e4d91fa07',
                VERIFYING: 'c7d2f10a93b8',
                COMMITTING: 'e4a81b3c6d5f',
                SETTLED: 'f9e2d7c4b1a0',
                HAZARD: 'deadbeef0000'
            };
            const evidencePrefix = evMap[state] || 'ffffffffffff';
            const hashChainIntact = !isHazard;
            const signatureVerified = isSettled || (!isHazard && !isIdle);

            const attestations = [
                { platform: 'AMD SEV-SNP', verified: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', certChainValid: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', measurement: 'a3f19c0b7e24d817', lastCheckedIso: new Date(Date.now() - (isIdle ? 0 : 12000)).toISOString() },
                { platform: 'Intel SGX', verified: !isHazard && state !== 'IDLE', certChainValid: !isHazard, measurement: isHazard ? '0000000000000000' : '8b2e4d91fa07c3a1', lastCheckedIso: new Date(Date.now() - (isHazard ? 3200 : 8000)).toISOString() },
                { platform: 'AWS Nitro', verified: !isIdle, certChainValid: true, measurement: 'c7d2f10a93b8e4a1', lastCheckedIso: new Date(Date.now() - 4200).toISOString() },
            ];

            const policyDecisions = [
                { id: 'p1', label: 'Clock skew < 500ms', classTier: 'A', threshold: 0.500, observed: isHazard ? 1.847 : 0.112, passed: !isHazard },
                { id: 'p2', label: 'Hash chain continuity', classTier: 'A', threshold: 1.000, observed: hashChainIntact ? 1.000 : 0.000, passed: hashChainIntact },
                { id: 'p3', label: 'Attestation quorum ≥ 2/3', classTier: 'A', threshold: 0.667, observed: isHazard ? 0.333 : 1.000, passed: !isHazard },
                { id: 'p4', label: 'Envelope signature valid', classTier: 'B', threshold: 1.000, observed: signatureVerified ? 1.000 : 0.000, passed: signatureVerified },
                { id: 'p5', label: 'Journal monotonicity', classTier: 'B', threshold: 1.000, observed: 1.000, passed: true },
            ];

            const passing = policyDecisions.filter(p => p.passed).length;
            const trust = isIdle ? 0 : +(passing / policyDecisions.length).toFixed(4);
            const sigma = +(0.008 + Math.random() * 0.012).toFixed(4);

            let trustClass = 'UNCLASSIFIED';
            if (isIdle) trustClass = 'UNCLASSIFIED';
            else if (isHazard) trustClass = 'HAZARD';
            else if (trust >= 0.95 && isSettled) trustClass = 'CLASS-A VERIFIED';
            else if (trust >= 0.80) trustClass = 'CLASS-B PROVISIONAL';
            else trustClass = 'UNVERIFIED';

            const receiptId = 'rcpt_' + evidencePrefix.slice(0, 8);
            const receiptHash = 'sha256:' + evidencePrefix + 'f3a1b9c2';
            const envelopeHash = 'sha256:9e8d7c6b5a4f3e2d';
            const signature = 'ed25519:' + (isSettled ? 'a1b2c3d4e5f6' : '—');
            const snapshotHash = 'snap_' + evidencePrefix + Math.random().toString(16).slice(2, 6);

            const barProgress = {
                INGEST: Math.min(100, Math.max(0, (seq / 20) * 100)),
                VERIFY: Math.min(100, Math.max(0, ((seq - 4) / 20) * 100)),
                ATTEST: Math.min(100, Math.max(0, ((seq - 8) / 20) * 100)),
                SIGN: Math.min(100, Math.max(0, ((seq - 12) / 20) * 100)),
                COMMIT: Math.min(100, Math.max(0, ((seq - 16) / 20) * 100)),
            };
            if (isIdle) { Object.keys(barProgress).forEach(k => barProgress[k] = 0); }
            if (isHazard) { Object.keys(barProgress).forEach(k => barProgress[k] = Math.min(barProgress[k], 60)); }

            return {
                state, seq, progressPct: progress, provider: 'us-east-1a · nv-07',
                elapsedMs: isIdle ? 0 : (seq * 1420) + 318,
                evidenceHashPrefix: evidencePrefix,
                hashChainIntact, signatureVerified,
                attestations, policyDecisions,
                trust, sigma, trustClass,
                receiptId, receiptHash, envelopeHash, signature, snapshotHash,
                timestamp: new Date().toISOString(),
                barProgress,
                epoch: seq + 38291,
                quorumTotal: 5,
                quorumPass: Math.min(5, Math.max(0, Math.round(trust * 5))),
            };
        }

        // ---- Apply snapshot (LIVE path — records history, logs, notifies) ----
        function applySnapshot(snap) {
            const state = snap.state;
            currentSeq = snap.seq;
            snapshotHistory.push(snap);
            if (snapshotHistory.length > 200) snapshotHistory.shift();
            eventCount++;

            const logMsg = '[' + new Date().toLocaleTimeString() + '] ' + state + ' seq=' + snap.seq + ' trust=' + snap.trust + ' epoch=' + snap.epoch;
            logEntries.push({ time: new Date().toLocaleTimeString(), msg: logMsg });
            if (logEntries.length > 80) logEntries.shift();

            auditLog.push({
                time: new Date().toLocaleTimeString(),
                event: state,
                status: state === 'HAZARD' ? 'fail' : (state === 'SETTLED' ? 'ok' : 'pending')
            });
            if (auditLog.length > 40) auditLog.shift();

            if (state !== 'IDLE' && state !== currentState) {
                notifCount++;
                notifBadge.textContent = notifCount;
                const item = document.createElement('div');
                item.className = 'notif-item';
                item.innerHTML = '<span class="time">' + new Date().toLocaleTimeString() + '</span> State → ' + state;
                notifPopup.prepend(item);
                if (notifPopup.children.length > 10) notifPopup.removeChild(notifPopup.lastChild);
            }
            if (state === 'SETTLED' && notifCount > 0) {
                setTimeout(() => { notifCount = 0; notifBadge.textContent = '0'; }, 2500);
            }
            currentState = state;

            render(snap);
            updateColony(snap);
            updateLogStream();
            syncReplaySliderToTail();
            return snap;
        }

        // ---- Emit event (SIMULATION) -------------------
        function emitEvent(state) {
            if (dataMode === 'live') return null;
            if (isReplaying) exitReplay(false);
            const seq = ++currentSeq;
            const snap = buildSnapshot(state, seq);
            return applySnapshot(snap);
        }

        // ---- Live ingest hook --------------------------
        const REQUIRED_SNAPSHOT_FIELDS = [
            'state', 'seq', 'progressPct', 'provider', 'elapsedMs',
            'evidenceHashPrefix', 'hashChainIntact', 'signatureVerified',
            'attestations', 'policyDecisions', 'trust', 'trustClass',
            'receiptId', 'receiptHash', 'envelopeHash', 'signature',
            'barProgress', 'epoch', 'sigma', 'quorumTotal', 'quorumPass',
        ];

        function ingestSnapshot(raw) {
            if (!raw || typeof raw !== 'object') {
                console.error('[VVU] ingestSnapshot: expected a snapshot object, got', raw);
                return false;
            }
            const missing = REQUIRED_SNAPSHOT_FIELDS.filter(f => !(f in raw));
            if (missing.length) {
                console.error('[VVU] ingestSnapshot: rejected — missing required field(s):', missing.join(', '));
                setDataMode('connecting');
                return false;
            }
            if (dataMode !== 'live') {
                stopAuto();
                setDataMode('live');
            }
            applySnapshot(raw);
            return true;
        }

        function setDataMode(mode) {
            dataMode = mode;
            const badge = document.getElementById('data-mode-badge');
            if (!badge) return;
            badge.dataset.mode = mode;
            const text = badge.querySelector('.dm-text');
            if (text) text.textContent = mode === 'live' ? 'LIVE' : mode === 'connecting' ? 'CONNECTING…' : 'SIMULATED';
        }

        window.VVU = window.VVU || {};
        window.VVU.ingestSnapshot = ingestSnapshot;
        window.VVU.getMode = () => dataMode;

        // ---- Render (no icons) -------------------------
        function render(s) {
            const meta = STATE_META[s.state];
            const isHazard = s.state === 'HAZARD';
            const isSettled = s.state === 'SETTLED';

            app.classList.toggle('hazard-mode', isHazard && !isReplaying);
            stateDot.style.color = meta.color;
            stateDot.classList.toggle('pulse', isHazard);
            stateLabel.textContent = meta.label;
            stateLabel.style.color = meta.color;

            const barOrder = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT'];
            const barLabels = { INGEST: 'ingest', VERIFY: 'verify', ATTEST: 'attest', SIGN: 'sign', COMMIT: 'commit' };
            const barColors = { INGEST: 'pending', VERIFY: 'pending', ATTEST: 'pending', SIGN: 'pending', COMMIT: 'verified' };
            if (isHazard) { barColors.INGEST = 'hazard'; barColors.VERIFY = 'hazard'; barColors.ATTEST = 'hazard'; barColors.SIGN = 'hazard'; barColors.COMMIT = 'hazard'; }
            if (s.state === 'IDLE') { barColors.INGEST = 'idle'; barColors.VERIFY = 'idle'; barColors.ATTEST = 'idle'; barColors.SIGN = 'idle'; barColors.COMMIT = 'idle'; }
            let barHtml = '';
            barOrder.forEach(key => {
                const pct = Math.round(s.barProgress[key] || 0);
                const cls = barColors[key] || 'pending';
                barHtml += '<div class="exec-bar"><span class="label">' + barLabels[key] + '</span><div class="track"><div class="fill ' + cls + '" style="width:' + pct + '%;"></div></div><span class="pct">' + pct + '%</span></div>';
            });
            execBars.innerHTML = barHtml;
            execHint.textContent = 'seq #' + s.seq;

            posteriorValue.textContent = s.trust.toFixed(4);
            posteriorValue.style.color = meta.color;
            posteriorSigma.textContent = s.sigma.toFixed(4);
            const confPct = Math.min(99.99, Math.max(0, (1 - s.sigma * 8) * 100));
            posteriorConf.textContent = confPct.toFixed(2) + '%';
            posteriorEvidence.textContent = Math.min(999, Math.round(s.seq * 12.8));
            posteriorQuorum.textContent = s.quorumPass + '/' + s.quorumTotal;
            posteriorEpoch.textContent = s.epoch;
            posteriorConfFill.style.width = confPct + '%';
            posteriorConfFill.style.background = isHazard ? 'var(--state-hazard)' : isSettled ? 'var(--state-verified)' : 'var(--state-pending)';

            const failing = s.policyDecisions.filter(p => !p.passed).length;
            policyHint.textContent = failing > 0 ? failing + ' failing' : 'all passing';
            policyHint.style.color = failing > 0 ? 'var(--state-hazard)' : 'var(--state-verified)';
            let policyHtml = '';
            s.policyDecisions.forEach(p => {
                const fillPct = Math.min(100, (p.observed / Math.max(p.threshold, 0.001)) * 100);
                const thresholdPct = Math.min(100, (p.threshold / Math.max(p.observed, p.threshold, 0.001)) * 100);
                const tone = p.passed ? 'var(--state-verified)' : 'var(--state-hazard)';
                const dotClass = p.passed ? 'ok' : 'fail';
                const shake = isHazard && !p.passed && !isReplaying ? 'shake' : '';
                policyHtml += '<div class="policy ' + shake + '"><div class="policy-left"><span class="policy-indicator ' + dotClass + '"></span><span class="policy-label">' + p.label + '</span><span class="policy-tier">' + p.classTier + '</span></div><div class="policy-right"><div class="policy-bar" style="--fill:' + fillPct + '%; --threshold:' + thresholdPct + '%; --tone:' + tone + '"></div><span>' + p.observed.toFixed(3) + '</span></div></div>';
            });
            policyRows.innerHTML = policyHtml;

            const chainOk = s.hashChainIntact && s.signatureVerified;
            const chainBadgeClass = chainOk ? 'ok' : (s.hashChainIntact ? 'pending' : 'fail');
            const chainBadgeText = chainOk ? 'intact' : (s.hashChainIntact ? 'pending' : 'broken');
            const sigBadgeClass = s.signatureVerified ? 'ok' : 'fail';
            const sigBadgeText = s.signatureVerified ? 'verified' : 'unverified';
            chainRows.innerHTML = '<div class="chain-row"><span class="label">Chain integrity</span><span class="value"><span>' + s.evidenceHashPrefix + '…</span><span class="badge ' + chainBadgeClass + '">' + chainBadgeText + '</span></span></div><div class="chain-row"><span class="label">Ed25519 signature</span><span class="value"><span>' + (s.signatureVerified ? 'valid' : 'invalid') + '</span><span class="badge ' + sigBadgeClass + '">' + sigBadgeText + '</span></span></div>';
            chainHint.textContent = chainOk ? 'intact · signed' : (!s.hashChainIntact ? 'chain broken' : 'unsigned');
            chainHint.style.color = chainOk ? 'var(--state-verified)' : (!s.hashChainIntact ? 'var(--state-hazard)' : 'var(--state-pending)');

            const evs = ['INGEST', 'VERIFY', 'ATTEST', 'SIGN', 'COMMIT', 'CHECK', 'SYNC', 'FINAL'];
            const tones = ['var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-pending)', 'var(--state-verified)', 'var(--state-info)', 'var(--state-pending)', 'var(--state-verified)'];
            let tlHtml = '';
            const base = Math.max(0, s.seq - 5);
            for (let i = 0; i < 6; i++) {
                const seqI = base + i;
                const ev = evs[i % evs.length];
                const w = Math.max(8, Math.min(100, (seqI / 20) * 100));
                const tone = tones[i % tones.length];
                tlHtml += '<div class="timeline-row"><span class="timeline-seq">#' + String(seqI).padStart(3, '0') + '</span><div class="timeline-bar" style="--w:' + w + '%; --tone:' + tone + '"></div><span class="timeline-event">' + ev + '</span></div>';
            }
            timeline.innerHTML = tlHtml;

            receipt.innerHTML = '<dt>id</dt><dd>' + s.receiptId + '</dd><dt>receipt</dt><dd>' + s.receiptHash.slice(0, 20) + '…</dd><dt>envelope</dt><dd>' + s.envelopeHash.slice(0, 20) + '…</dd><dt>signature</dt><dd>' + s.signature.slice(0, 16) + '…</dd>';

            if (isReplaying) { colonyStatus.textContent = '◐ REPLAY · HISTORICAL VIEW'; colonyStatus.style.color = 'var(--state-info)'; }
            else if (isHazard) { colonyStatus.textContent = '⚠ HAZARD · SYSTEM DEGRADED'; colonyStatus.style.color = 'var(--state-hazard)'; }
            else if (isSettled) { colonyStatus.textContent = '● ALL SYSTEMS NOMINAL'; colonyStatus.style.color = 'var(--state-verified)'; }
            else if (s.state === 'IDLE') { colonyStatus.textContent = '○ SYSTEM STANDBY'; colonyStatus.style.color = 'var(--text-tertiary)'; }
            else { colonyStatus.textContent = '◉ TRANSITIONING · VERIFYING'; colonyStatus.style.color = 'var(--state-pending)'; }
        }

        // ---- Log stream --------------------------------
        function updateLogStream() {
            logStream.innerHTML = logEntries.slice(-20).map(function(e) {
                return '<div class="log-entry"><span class="time">' + e.time + '</span><span class="msg">' + e.msg + '</span></div>';
            }).join('');
            logStream.scrollTop = logStream.scrollHeight;
            logHint.textContent = logEntries.length > 0 ? logEntries.length + ' entries' : 'waiting';
        }

        // ---- Evidence Colony — FULLY ANIMATED ----------
        let colonyCtx = null, colonyCanvas = null, animFrame = null;
        let colonyAnts = [], canopyLeaves = [], colonyAntSeq = 0;
        let colonyState = 'IDLE', colonyTrust = 1, colonyReducedMotion = false;
        const GATE_R = 0.56, KERNEL_R = 0.16, OUTER_R = 0.94;
        const LEAF_FRESH = '#5C8A52', LEAF_GATE = '#E8A23D', LEAF_VERIFIED = '#2FBF71', LEAF_REJECTED = '#5A6068';

        function spawnAnt() {
            const angle = Math.random() * Math.PI * 2;
            colonyAnts.push({
                id: colonyAntSeq++,
                angle: angle + (Math.random() - 0.5) * 0.15,
                baseAngle: angle,
                radius: OUTER_R,
                speed: 0.0016 + Math.random() * 0.0012,
                stage: 'approaching',
                leafColor: LEAF_FRESH,
                leafAlpha: 1,
                gateHold: 0,
                legPhase: Math.random() * Math.PI * 2,
                scale: 0.85 + Math.random() * 0.3,
            });
        }

        function colonySpawnRate(state) {
            switch (state) {
                case 'IDLE': return { p: 0.01, cap: 3 };
                case 'INGESTING': return { p: 0.09, cap: 12 };
                case 'ATTESTING': return { p: 0.04, cap: 14 };
                case 'VERIFYING': return { p: 0.025, cap: 14 };
                case 'COMMITTING': return { p: 0.012, cap: 10 };
                case 'SETTLED': return { p: 0.008, cap: 4 };
                case 'HAZARD': return { p: 0, cap: 0 };
                default: return { p: 0.01, cap: 4 };
            }
        }

        function initColony() {
            colonyCanvas = document.getElementById('colony-canvas');
            const rect = colonyCanvas.parentElement.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height, 380);
            colonyCanvas.width = size * 2;
            colonyCanvas.height = size * 2;
            colonyCanvas.style.width = size + 'px';
            colonyCanvas.style.height = size + 'px';
            colonyCtx = colonyCanvas.getContext('2d');
            colonyReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            updateColony(buildSnapshot('IDLE', 0));
            animateColony();
        }

        function updateColony(snap) {
            colonyState = snap.state;
            colonyTrust = Math.max(0.05, Math.min(0.98, typeof snap.trust === 'number' ? snap.trust : 1));
            if (snap.state === 'HAZARD') {
                colonyAnts.forEach(function(a) { if (a.stage !== 'rejected') { a.stage = 'rejected'; a.leafColor = LEAF_REJECTED; } });
            }
        }

        function drawAnt(ctx, x, y, angle, scale, alpha, legPhase) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(180,186,194,0.9)'; ctx.strokeStyle = 'rgba(180,186,194,0.9)'; ctx.lineWidth = 0.55;
            ctx.beginPath(); ctx.ellipse(-3.1, 0, 2.0, 1.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(-0.4, 0, 1.2, 0.95, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(1.9, 0, 0.95, 0, Math.PI * 2); ctx.fill();
            for (let i = -1; i <= 1; i++) {
                const lp = Math.sin(legPhase + i * 1.3) * 0.7;
                ctx.beginPath(); ctx.moveTo(i * 1.0 - 0.4, 0); ctx.lineTo(i * 1.0 - 0.4 + lp, 2.1);
                ctx.moveTo(i * 1.0 - 0.4, 0); ctx.lineTo(i * 1.0 - 0.4 - lp, -2.1); ctx.stroke();
            }
            ctx.beginPath(); ctx.moveTo(2.6, -0.4); ctx.lineTo(3.7, -1.2); ctx.moveTo(2.6, 0.4); ctx.lineTo(3.7, 1.2); ctx.stroke();
            ctx.restore();
        }

        function drawLeaf(ctx, x, y, angle, scale, color, alpha) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.quadraticCurveTo(2.1, -0.9, 0, 3.2); ctx.quadraticCurveTo(-2.1, -0.9, 0, -3.2); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.3;
            ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.lineTo(0, 3.2); ctx.stroke();
            ctx.restore();
        }

        function animateColony() {
            const canvas = colonyCanvas, ctx = colonyCtx;
            if (!ctx) { animFrame = requestAnimationFrame(animateColony); return; }
            const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = W * 0.42;
            ctx.clearRect(0, 0, W, H);

            const rate = colonySpawnRate(colonyState);
            if (colonyAnts.length < rate.cap && Math.random() < rate.p) spawnAnt();

            const stepScale = colonyReducedMotion ? 0.35 : 1;
            colonyAnts.sort(function(a, b) { return b.radius - a.radius; });

            colonyAnts.forEach(function(a) {
                a.legPhase += 0.35 * stepScale;
                if (a.stage === 'approaching') {
                    a.radius -= a.speed * stepScale;
                    if (a.radius <= GATE_R) { a.radius = GATE_R; a.stage = 'atGate'; a.leafColor = LEAF_GATE; a.gateHold = 26 + Math.floor(Math.random() * 20); }
                } else if (a.stage === 'atGate') {
                    a.gateHold -= 1 * stepScale;
                    if (a.gateHold <= 0) {
                        const rejected = Math.random() > colonyTrust;
                        a.stage = rejected ? 'rejected' : 'verified';
                        a.leafColor = rejected ? LEAF_REJECTED : LEAF_VERIFIED;
                    }
                } else if (a.stage === 'verified') {
                    a.radius -= a.speed * 1.3 * stepScale;
                    if (a.radius <= KERNEL_R) {
                        canopyLeaves.push({ angle: Math.random() * Math.PI * 2, dist: Math.random(), r: 1.4 + Math.random() * 1.3, hue: Math.random() });
                        if (canopyLeaves.length > 140) canopyLeaves.shift();
                        a.dead = true;
                    }
                } else if (a.stage === 'rejected') {
                    a.radius += a.speed * 0.7 * stepScale;
                    a.leafAlpha -= 0.018 * stepScale;
                    if (a.leafAlpha <= 0 || a.radius >= OUTER_R + 0.05) a.dead = true;
                }

                const x = cx + Math.cos(a.angle) * a.radius * R;
                const y = cy + Math.sin(a.angle) * a.radius * R;
                const antAlpha = a.stage === 'rejected' ? Math.max(0, a.leafAlpha) : 1;
                const leafX = cx + Math.cos(a.angle) * (a.radius + 0.025) * R;
                const leafY = cy + Math.sin(a.angle) * (a.radius + 0.025) * R;
                drawLeaf(ctx, leafX, leafY, a.angle, a.scale, a.leafColor, Math.max(0, a.leafAlpha) * 0.95);
                drawAnt(ctx, x, y, a.angle + Math.PI, a.scale, antAlpha, a.legPhase);
            });
            colonyAnts = colonyAnts.filter(function(a) { return !a.dead; });

            ctx.beginPath(); ctx.arc(cx, cy, GATE_R * R, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(232,162,61,0.22)'; ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);

            const canopySpread = Math.min(KERNEL_R * 2.6, KERNEL_R + canopyLeaves.length * 0.006);
            canopyLeaves.forEach(function(leaf) {
                const d = leaf.dist * canopySpread * R;
                const lx = cx + Math.cos(leaf.angle) * d;
                const ly = cy + Math.sin(leaf.angle) * d * 0.7 - canopySpread * R * 0.25;
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = '#2FBF71';
                ctx.beginPath(); ctx.ellipse(lx, ly, leaf.r, leaf.r * 0.7, leaf.angle, 0, Math.PI * 2); ctx.fill();
            });
            ctx.globalAlpha = 1;

            const kernelColor = STATE_META[colonyState] ? STATE_META[colonyState].color : '#4E545E';
            ctx.beginPath(); ctx.arc(cx, cy, KERNEL_R * R * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = kernelColor; ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy, KERNEL_R * R * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = kernelColor; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.globalAlpha = 1;

            animFrame = requestAnimationFrame(animateColony);
        }

        // ---- Tab switching ------------------------------
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                const view = this.dataset.view;
                document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
                const target = document.getElementById('view-' + view);
                if (target) target.classList.add('active');
            });
        });

        // ---- Search ------------------------------------
        searchInput.addEventListener('input', function(e) {
            const val = e.target.value.trim().toLowerCase();
            const results = searchResults;
            if (val.length === 0) { results.classList.remove('open'); return; }
            const matches = snapshotHistory.filter(function(s) {
                return s.state.toLowerCase().includes(val) || s.receiptId.includes(val) || s.evidenceHashPrefix.includes(val);
            });
            if (matches.length === 0) {
                results.innerHTML = '<div style="padding:4px;color:var(--text-tertiary);font-size:10px;">No matches</div>';
            } else {
                results.innerHTML = matches.slice(0, 6).map(function(s) {
                    return '<div class="item" data-seq="' + s.seq + '">seq ' + s.seq + ' · ' + s.state + ' · ' + s.receiptId + '</div>';
                }).join('');
                results.querySelectorAll('.item').forEach(function(el) {
                    el.addEventListener('click', function() {
                        const seq = parseInt(this.dataset.seq);
                        const idx = snapshotHistory.findIndex(function(s) { return s.seq === seq; });
                        if (idx !== -1) { enterReplayAt(idx); searchInput.value = ''; results.classList.remove('open'); }
                    });
                });
            }
            results.classList.add('open');
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-box')) { searchResults.classList.remove('open'); }
        });

        // ---- Notifications ------------------------------
        notifBtn.addEventListener('click', function(e) { e.stopPropagation(); notifPopup.classList.toggle('open'); });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-popup')) { notifPopup.classList.remove('open'); }
        });

        // ---- Auto state cycle --------------------------
        function startAuto() {
            let i = 0;
            autoTimer = setInterval(function() {
                const state = STATE_ORDER[i % STATE_ORDER.length];
                emitEvent(state);
                i++;
                document.querySelectorAll('.controls button[data-state]').forEach(function(b) {
                    b.classList.toggle('active', b.dataset.state === state);
                });
            }, 2400);
            document.getElementById('auto-btn').textContent = '■ STOP';
        }
        function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } document.getElementById('auto-btn').textContent = '▶ AUTO'; }
        document.getElementById('auto-btn').addEventListener('click', function() { if (autoTimer) stopAuto(); else startAuto(); });

        document.querySelectorAll('.controls button[data-state]').forEach(function(b) {
            b.addEventListener('click', function() {
                if (autoTimer) stopAuto();
                const state = this.dataset.state;
                emitEvent(state);
                document.querySelectorAll('.controls button[data-state]').forEach(function(btn) {
                    btn.classList.toggle('active', btn.dataset.state === state);
                });
            });
        });

        // ---- Time-Travel Replay Adapter -----------------
        function syncReplaySliderToTail() {
            if (isReplaying) return;
            const maxIdx = Math.max(0, snapshotHistory.length - 1);
            replaySlider.max = String(maxIdx);
            replaySlider.value = String(maxIdx);
            replayIndex = maxIdx;
            const tailSeq = snapshotHistory.length ? snapshotHistory[maxIdx].seq : 0;
            replayTime.textContent = 'seq ' + tailSeq;
            replayTotal.textContent = 'seq ' + tailSeq;
        }

        function enterReplayAt(index) {
            if (!snapshotHistory.length) return;
            index = Math.max(0, Math.min(index, snapshotHistory.length - 1));
            if (!isReplaying) {
                wasAutoRunningBeforeReplay = !!autoTimer;
                stopAuto();
                isReplaying = true;
                setDataModeVisual('replay');
            }
            replayIndex = index;
            replaySlider.max = String(snapshotHistory.length - 1);
            replaySlider.value = String(index);
            const snap = snapshotHistory[index];
            render(snap);
            updateColony(snap);
            replayTime.textContent = 'seq ' + snap.seq;
            replayTotal.textContent = 'seq ' + snapshotHistory[snapshotHistory.length - 1].seq;
        }

        function exitReplay(resumeAuto) {
            if (replayInterval) { clearInterval(replayInterval); replayInterval = null; replayPlayBtn.textContent = '▶'; }
            isReplaying = false;
            setDataModeVisual('tail');
            if (snapshotHistory.length) {
                const last = snapshotHistory[snapshotHistory.length - 1];
                render(last);
                updateColony(last);
            }
            syncReplaySliderToTail();
            if (resumeAuto && wasAutoRunningBeforeReplay && dataMode !== 'live') startAuto();
            wasAutoRunningBeforeReplay = false;
        }

        function setDataModeVisual(mode) {
            if (mode === 'replay') {
                liveIndicator.classList.add('replay');
                liveIndicatorLabel.textContent = 'replay';
            } else {
                liveIndicator.classList.remove('replay');
                liveIndicatorLabel.textContent = dataMode === 'live' ? 'live' : 'live';
            }
        }

        replaySlider.addEventListener('input', function() {
            const idx = parseInt(this.value, 10);
            enterReplayAt(idx);
        });

        replayPlayBtn.addEventListener('click', function() {
            if (replayInterval) {
                clearInterval(replayInterval);
                replayInterval = null;
                this.textContent = '▶';
                return;
            }
            if (!snapshotHistory.length) return;
            if (!isReplaying) enterReplayAt(parseInt(replaySlider.value, 10) || 0);
            this.textContent = '⏸';
            replayInterval = setInterval(function() {
                let idx = replayIndex + 1;
                if (idx >= snapshotHistory.length) idx = 0;
                enterReplayAt(idx);
            }, 550);
        });

        replayLiveBtn.addEventListener('click', function() {
            exitReplay(true);
        });

        // ---- Resize handler ----------------------------
        function resizeColony() {
            if (!colonyCanvas) return;
            const rect = colonyCanvas.parentElement.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height, 380);
            if (size > 10) { colonyCanvas.width = size * 2; colonyCanvas.height = size * 2; colonyCanvas.style.width = size + 'px'; colonyCanvas.style.height = size + 'px'; }
        }
        window.addEventListener('resize', resizeColony);

        // ---- Init --------------------------------------
        initColony();
        emitEvent('IDLE');
        syncReplaySliderToTail();
        setTimeout(function() { startAuto(); }, 800);
        document.fonts && document.fonts.ready && document.fonts.ready.then(resizeColony);

        console.log('VVU Trust Runtime · production · replay adapter online');
    </script>
</body>
</html>`;

    if (containerRef.current) {
      containerRef.current.innerHTML = html
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    />
  )
}
