'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle } from 'lucide-react';
import { useIDEStore, type CanvasTab, type OpenTab } from './ide-store';
import TrustSphere from '@/components/vvu/trust-sphere';

// ---------------------------------------------------------------------------
// Tab Bar
// ---------------------------------------------------------------------------

function TabBar() {
  const openTabs = useIDEStore((s) => s.openTabs);
  const activeTab = useIDEStore((s) => s.activeTab);
  const setActiveTab = useIDEStore((s) => s.setActiveTab);
  const removeTab = useIDEStore((s) => s.removeTab);

  return (
    <div
      className="h-[36px] bg-[#2d2d2d] flex items-end overflow-x-auto no-scrollbar shrink-0"
      role="tablist"
      aria-label="Canvas Tabs"
    >
      {openTabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 text-[12px] cursor-pointer
              border-r border-[#1e1e1e] min-w-[100px] max-w-[180px] group transition-colors
              ${isActive
                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#3dffb0]'
                : 'text-[#858585] hover:bg-[#1e1e1e] border-t-2 border-t-transparent'
              }
            `}
          >
            <span className="text-[11px]">{tab.icon}</span>
            <span className="truncate flex-1">{tab.label}</span>
            {tab.isLive && (
              <Circle className="h-1.5 w-1.5 fill-[#3dffb0] text-[#3dffb0] shrink-0" />
            )}
            {openTabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
                className="h-4 w-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c] transition-opacity"
                aria-label={`Close ${tab.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content — Trust Sphere
// ---------------------------------------------------------------------------

function TrustSphereCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f] relative">
      <TrustSphere />
      {/* Overlay info */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <div className="text-[10px] font-mono text-[#3dffb0]/60 tracking-wider">
          TRUST SPHERE [LIVE]
        </div>
        <div className="text-[9px] font-mono text-[#858585]">
          380 nodes · 7-state machine · Fibonacci lattice
        </div>
      </div>
      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[#555]">
        WebGL 2.0 · Deterministic Operating Environment
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content — Terminal
// ---------------------------------------------------------------------------

function TerminalCanvas() {
  const terminalEntries = useIDEStore((s) => s.terminalEntries);
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addTerminalEntry({
      level: 'info',
      source: 'operator',
      message: `$ ${inputValue}`,
    });

    // Simple command simulation
    const cmd = inputValue.trim().toLowerCase();
    if (cmd === 'help') {
      addTerminalEntry({ level: 'info', source: 'system', message: 'Available commands: help, status, hbk status, lindiwe status, clear, circuit-break' });
    } else if (cmd === 'status') {
      addTerminalEntry({ level: 'info', source: 'system', message: 'All systems nominal. Autonomy: Action-Safe. Circuit Breaker: NORMAL.' });
    } else if (cmd === 'lindiwe status') {
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: 'Lindiwe-v3 online. Autonomy: Action-Safe (Level 2). Monitoring 4 active nodes.' });
    } else if (cmd === 'hbk status') {
      addTerminalEntry({ level: 'info', source: 'hbk', message: 'HBK Cape Town Simulation: node_01 active, node_02 standby, node_03 idle, node_04 error.' });
    } else if (cmd === 'circuit-break') {
      addTerminalEntry({ level: 'critical', source: 'watchdog', message: '[CRITICAL] WATCHDOG INITIATED. SESSION CIRCUIT-BROKEN. REASON: OPERATOR OVERRIDE. AWAITING CONFIRMATION.' });
    } else if (cmd === 'clear') {
      // Can't clear from here — just note it
      addTerminalEntry({ level: 'info', source: 'system', message: 'Terminal cleared.' });
    } else {
      addTerminalEntry({ level: 'warn', source: 'system', message: `Unknown command: ${inputValue}. Type 'help' for available commands.` });
    }

    setInputValue('');
  };

  const levelColors = {
    info: '#858585',
    warn: '#eab308',
    error: '#ef4444',
    critical: '#ef4444',
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a]">
      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-5 custom-scrollbar"
      >
        {terminalEntries.map((entry) => (
          <div key={entry.id} className="flex gap-2">
            <span className="text-[#555] shrink-0">
              {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="shrink-0" style={{ color: levelColors[entry.level] }}>
              [{entry.level.toUpperCase()}]
            </span>
            <span className="text-[#858585] shrink-0">{entry.source}:</span>
            <span className="text-[#cccccc]">{entry.message}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-[#2d2d2d]">
        <span className="text-[#3dffb0] font-mono text-[12px]">$</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-transparent text-[12px] text-white font-mono outline-none placeholder-[#555]"
          placeholder="Type a command… (help, status, hbk status, lindiwe status)"
          autoFocus
        />
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content — CAD Viewer
// ---------------------------------------------------------------------------

function CADViewerCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0d0d12] relative">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(#3dffb020 1px, transparent 1px), linear-gradient(90deg, #3dffb020 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="text-center z-10">
        <div className="text-[48px] mb-2">📐</div>
        <div className="text-[#3dffb0] font-mono text-sm tracking-wider">CAD VISUALIZER</div>
        <div className="text-[#858585] font-mono text-[11px] mt-1">Infrastructure topology · Network graph · Pipeline DAG</div>
        <div className="mt-4 px-4 py-2 bg-[#3dffb0]/10 border border-[#3dffb0]/20 rounded text-[11px] text-[#3dffb0] font-mono">
          Connect HBK Pipeline to populate
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content — System Log
// ---------------------------------------------------------------------------

function SystemLogCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0d0d12]">
      <div className="text-center">
        <div className="text-[48px] mb-2">📋</div>
        <div className="text-[#858585] font-mono text-sm">System Log</div>
        <div className="text-[#555] font-mono text-[11px] mt-1">Audit trail · Policy events · Trust ledger</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content Map
// ---------------------------------------------------------------------------

const CANVAS_CONTENT: Record<CanvasTab, React.ComponentType> = {
  TRUST_SPHERE_3D: TrustSphereCanvas,
  TERMINAL: TerminalCanvas,
  CAD_VIEWER: CADViewerCanvas,
  SYSTEM_LOG: SystemLogCanvas,
};

// ---------------------------------------------------------------------------
// Main Canvas
// ---------------------------------------------------------------------------

export function MainCanvas() {
  const activeTab = useIDEStore((s) => s.activeTab);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);
  const circuitBreakerReason = useIDEStore((s) => s.circuitBreakerReason);

  const ContentComponent = CANVAS_CONTENT[activeTab] ?? TrustSphereCanvas;

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative">
      {/* Tab Bar */}
      <TabBar />

      {/* The Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <ContentComponent />

        {/* Circuit Breaker Overlay */}
        <AnimatePresence>
          {circuitBreaker === 'TRIGGERED' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[#0a0a0f]/95 flex items-center justify-center z-50"
            >
              <div className="text-center max-w-lg">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[72px] mb-4"
                >
                  🛑
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="font-mono text-[#ef4444] text-lg tracking-wider mb-2"
                >
                  [CRITICAL] WATCHDOG INITIALIZED
                </motion.div>
                <div className="font-mono text-white text-sm mb-1">
                  SESSION CIRCUIT-BROKEN
                </div>
                <div className="font-mono text-[#ef4444] text-xs mb-6">
                  REASON: {circuitBreakerReason ?? 'UNKNOWN ANOMALY'}
                </div>
                <div className="font-mono text-[#858585] text-[11px]">
                  AWAITING OPERATOR OVERRIDE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
