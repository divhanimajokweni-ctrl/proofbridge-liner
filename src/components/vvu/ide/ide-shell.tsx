'use client';

import { useEffect, useCallback, useState } from 'react';
import { useIDEStore } from './ide-store';
import { ActivityBar } from './activity-bar';
import { PrimarySidebar } from './primary-sidebar';
import { MainCanvas } from './main-canvas';
import { StatusBar } from './status-bar';
import { IDECommandPalette } from './command-palette';
import { LindiwePanel } from './lindiwe-panel';
import { LindiweTerminal } from './lindiwe-terminal';

// ---------------------------------------------------------------------------
// IDE Shell — The Deterministic Operating Environment
// ---------------------------------------------------------------------------

export function IDEShell() {
  const toggleCommandPalette = useIDEStore((s) => s.toggleCommandPalette);
  const toggleLindiwePanel = useIDEStore((s) => s.toggleLindiwePanel);
  const toggleLindiweTerminal = useIDEStore((s) => s.toggleLindiweTerminal);
  const setFocusMode = useIDEStore((s) => s.setFocusMode);
  const focusMode = useIDEStore((s) => s.focusMode);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);
  const setCircuitBreaker = useIDEStore((s) => s.setCircuitBreaker);
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);
  const updateComputeMetrics = useIDEStore((s) => s.updateComputeMetrics);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K — Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      // ⌘⇧L or Ctrl+Shift+L — Lindiwe Panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLindiwePanel();
      }
      // ⌘` or Ctrl+` — Lindiwe Terminal
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        toggleLindiweTerminal();
      }
      // Escape — Close overlays
      if (e.key === 'Escape') {
        setFocusMode(false);
      }
      // F11 — Focus mode
      if (e.key === 'F11') {
        e.preventDefault();
        setFocusMode(!focusMode);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCommandPalette, toggleLindiwePanel, toggleLindiweTerminal, setFocusMode, focusMode]);

  // ---- Simulated telemetry updates ----
  useEffect(() => {
    const interval = setInterval(() => {
      updateComputeMetrics({
        cpuUtilisation: Math.floor(28 + Math.random() * 15),
        eventsProcessed: Math.floor(12847 + Math.random() * 100),
        trustScore: Math.floor(70 + Math.random() * 8),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [updateComputeMetrics]);

  // ---- Simulated Lindiwe Action-Safe alerts ----
  useEffect(() => {
    const autonomyLevel = useIDEStore.getState().autonomyLevel;
    if (autonomyLevel !== 2) return;

    const alerts = [
      { message: 'Node_02 latency elevated: 340ms (baseline: 120ms). Execute `> lindiwe reroute HBK_02` to stabilize?', level: 'warn' as const },
      { message: 'Memory usage trending upward on GPU_0. Currently 78%. Monitoring.', level: 'warn' as const },
      { message: 'Trust score dip detected: 68/100 (threshold: 65). Self-correcting.', level: 'info' as const },
    ];

    const interval = setInterval(() => {
      const state = useIDEStore.getState();
      if (state.autonomyLevel === 2 && state.circuitBreaker === 'NORMAL') {
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        addTerminalEntry({
          level: alert.level,
          source: 'lindiwe',
          message: `⚡ ${alert.message}`,
        });
      }
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, [addTerminalEntry]);

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans select-none">
      {/* Activity Bar — Far Left Plugin Rail */}
      <ActivityBar />

      {/* Primary Sidebar — Contextual Plugin Content */}
      <PrimarySidebar />

      {/* Center Column — Canvas + Lindiwe Terminal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Canvas */}
        <MainCanvas />

        {/* Lindiwe Terminal (Operator Modality) — Bottom */}
        <LindiweTerminal />
      </div>

      {/* Lindiwe Side Panel (Advisor Modality) — Right */}
      <LindiwePanel />

      {/* Status Bar — Bottom */}
      <StatusBar />

      {/* Command Palette — Overlay */}
      <IDECommandPalette />
    </div>
  );
}
