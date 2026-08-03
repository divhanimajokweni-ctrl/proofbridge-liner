'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, CheckCircle2, Activity, Hexagon, Shield, Zap } from 'lucide-react';
import { useIDEStore, type CanvasTab, CORE_SERVICES, LIFECYCLE_COLORS, LIFECYCLE_LABELS } from './ide-store';
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
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <div className="text-[10px] font-mono text-[#3dffb0]/60 tracking-wider">
          TRUST SPHERE [LIVE]
        </div>
        <div className="text-[9px] font-mono text-[#858585]">
          380 nodes · 7-state machine · Fibonacci lattice
        </div>
      </div>
      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[#555]">
        WebGL 2.0 · Zookeeper Runtime · Deterministic Operating Environment
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

    const cmd = inputValue.trim().toLowerCase();
    if (cmd === 'help') {
      addTerminalEntry({ level: 'info', source: 'system', message: 'Available commands: help, status, zk status, hbk status, lindiwe status, vvu plugin install, vvu plugin activate, vvu plugin shutdown, circuit-break, clear' });
    } else if (cmd === 'status' || cmd === 'zk status') {
      addTerminalEntry({ level: 'info', source: 'zookeeper', message: 'Zookeeper Runtime: online. Core services: 6/6 running. Adapters: 3 dormant, 3 not installed. Lindiwe: L2 Action-Safe. Watchdog: active.' });
    } else if (cmd === 'lindiwe status') {
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: 'Lindiwe specialist agent online. Autonomy: Action-Safe (Level 2). Monitoring 4 active nodes.' });
    } else if (cmd === 'hbk status') {
      addTerminalEntry({ level: 'info', source: 'hbk', message: 'HBK Cape Town Simulation: node_01 active, node_02 standby, node_03 idle, node_04 error.' });
    } else if (cmd.startsWith('vvu plugin install')) {
      addTerminalEntry({ level: 'info', source: 'plugin-manager', message: `> Plugin installed. Lifecycle: installed. Run 'vvu plugin activate' to activate.` });
    } else if (cmd.startsWith('vvu plugin activate')) {
      addTerminalEntry({ level: 'info', source: 'plugin-manager', message: `> Plugin activated. initialize() → discover() → authenticate() complete. Lifecycle: activated.` });
    } else if (cmd.startsWith('vvu plugin shutdown')) {
      addTerminalEntry({ level: 'info', source: 'plugin-manager', message: `> Plugin shutdown. shutdown() complete. Lifecycle: dormant.` });
    } else if (cmd === 'circuit-break') {
      addTerminalEntry({ level: 'critical', source: 'watchdog', message: '[CRITICAL] CIRCUIT BREAK. REASON: OPERATOR OVERRIDE. AWAITING CONFIRMATION.' });
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-[#2d2d2d]">
        <span className="text-[#3dffb0] font-mono text-[12px]">$</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-transparent text-[12px] text-white font-mono outline-none placeholder-[#555]"
          placeholder="Type a command… (help, status, zk status, vvu plugin install)"
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
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(#3dffb020 1px, transparent 1px), linear-gradient(90deg, #3dffb020 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="text-center z-10">
        <div className="text-[48px] mb-2">📐</div>
        <div className="text-[#3dffb0] font-mono text-sm tracking-wider">CAD VISUALIZER</div>
        <div className="text-[#858585] font-mono text-[11px] mt-1">Infrastructure topology · Network graph · Pipeline DAG</div>
        <div className="mt-4 px-4 py-2 bg-[#3dffb0]/10 border border-[#3dffb0]/20 rounded text-[11px] text-[#3dffb0] font-mono">
          Activate CAD Adapter from Zookeeper to populate
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Content — System Boot (Zookeeper Core Runtime)
// ---------------------------------------------------------------------------

function SystemBootCanvas() {
  const coreServices = useIDEStore((s) => s.coreServices);
  const adapters = useIDEStore((s) => s.adapters);
  const zookeeperOnline = useIDEStore((s) => s.zookeeperOnline);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0d0d12] p-6 custom-scrollbar">
      {/* Zookeeper Header */}
      <div className="flex items-center gap-3 mb-6">
        <Hexagon className="h-8 w-8 text-[#3dffb0]" strokeWidth={1.5} />
        <div>
          <div className="text-[#3dffb0] font-mono text-lg tracking-wider">ZOOKEEPER RUNTIME</div>
          <div className="text-[#858585] font-mono text-[11px]">
            Native orchestration runtime — minimal trusted core, dormant plugins activated on demand
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-full bg-[#3dffb0]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[#3dffb0] font-mono text-xs">ONLINE</span>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="mb-6 border border-[#2d2d2d] rounded-lg p-4 bg-[#1a1a1a]">
        <div className="text-[10px] font-mono text-[#858585] mb-3 tracking-wider">ARCHITECTURE</div>
        <div className="flex flex-col items-center gap-2 text-[11px] font-mono">
          <div className="px-4 py-2 bg-[#3dffb0]/10 border border-[#3dffb0]/30 rounded text-[#3dffb0]">User</div>
          <div className="text-[#555]">│</div>
          <div className="px-4 py-2 bg-[#3dffb0]/20 border border-[#3dffb0]/40 rounded text-[#3dffb0] font-bold">ZOOKEEPER RUNTIME</div>
          <div className="text-[#555]">│</div>
          <div className="flex gap-3">
            <div className="px-3 py-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded text-[#3b82f6]">Workflow</div>
            <div className="px-3 py-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded text-[#3b82f6]">Scheduler</div>
            <div className="px-3 py-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded text-[#3b82f6]">Policy</div>
          </div>
          <div className="text-[#555]">│</div>
          <div className="px-4 py-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded text-[#8b5cf6]">Immutable Event Runtime</div>
          <div className="text-[#555]">│</div>
          <div className="flex gap-3 flex-wrap justify-center">
            <div className="px-3 py-1.5 bg-[#ed1c24]/10 border border-[#ed1c24]/30 rounded text-[#ed1c24]">AMD Compute</div>
            <div className="px-3 py-1.5 bg-[#f0f6fc]/10 border border-[#f0f6fc]/30 rounded text-[#f0f6fc]">GitHub API</div>
            <div className="px-3 py-1.5 bg-[#2d8cff]/10 border border-[#2d8cff]/30 rounded text-[#2d8cff]">Zoom API</div>
          </div>
          <div className="text-[#555]">│</div>
          <div className="px-4 py-2 bg-[#3dffb0]/10 border border-[#3dffb0]/30 rounded text-[#3dffb0]">Cryptographic Ledger</div>
          <div className="text-[#555]">│</div>
          <div className="px-4 py-2 bg-[#858585]/10 border border-[#858585]/30 rounded text-[#858585]">Replay / Audit</div>
        </div>
      </div>

      {/* Core Services */}
      <div className="mb-6">
        <div className="text-[10px] font-mono text-[#858585] mb-3 tracking-wider">CORE SERVICES (ALWAYS RUNNING)</div>
        <div className="grid grid-cols-2 gap-2">
          {coreServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded"
            >
              <CheckCircle2 className="h-4 w-4 text-[#3dffb0] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white truncate">{service.label}</div>
                <div className="text-[10px] text-[#858585] font-mono">
                  {service.eventsProcessed.toLocaleString()} events · {service.uptime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adapter Registry */}
      <div className="mb-6">
        <div className="text-[10px] font-mono text-[#858585] mb-3 tracking-wider">ADAPTER REGISTRY</div>
        <div className="grid grid-cols-1 gap-2">
          {adapters.map((adapter) => (
            <div
              key={adapter.id}
              className="flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded"
            >
              <Circle
                className="h-3 w-3 shrink-0 fill-current"
                style={{ color: LIFECYCLE_COLORS[adapter.lifecycle] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white truncate">{adapter.label}</div>
                <div className="text-[10px] text-[#858585]">{adapter.description}</div>
              </div>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: `${LIFECYCLE_COLORS[adapter.lifecycle]}15`,
                  color: LIFECYCLE_COLORS[adapter.lifecycle],
                }}
              >
                {LIFECYCLE_LABELS[adapter.lifecycle]}
              </span>
              {adapter.category === 'vendor' && (
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#3c3c3c] text-[#858585] shrink-0">
                  {adapter.vendor}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Agents */}
      <div>
        <div className="text-[10px] font-mono text-[#858585] mb-3 tracking-wider">SPECIALIST AGENTS (UNDER ZOOKEEPER)</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded">
            <Activity className="h-4 w-4 text-[#a855f7] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white">Lindiwe</div>
              <div className="text-[10px] text-[#858585]">Behavioural analysis, anomaly detection, recommendations</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded">
            <Shield className="h-4 w-4 text-[#ef4444] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white">Watchdog</div>
              <div className="text-[10px] text-[#858585]">Compliance, provenance, safety, circuit-breaking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plugin Lifecycle */}
      <div className="mt-6 border border-[#2d2d2d] rounded-lg p-4 bg-[#1a1a1a]">
        <div className="text-[10px] font-mono text-[#858585] mb-3 tracking-wider">PLUGIN LIFECYCLE</div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {(['not_installed', 'installed', 'dormant', 'activated', 'running', 'idle'] as const).map((lc, i) => (
            <div key={lc} className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: `${LIFECYCLE_COLORS[lc]}10`, color: LIFECYCLE_COLORS[lc] }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIFECYCLE_COLORS[lc] }} />
                {LIFECYCLE_LABELS[lc]}
              </div>
              {i < 5 && <span className="text-[#555]">→</span>}
            </div>
          ))}
          <span className="text-[#555]">→</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: `${LIFECYCLE_COLORS['dormant']}10`, color: LIFECYCLE_COLORS['dormant'] }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIFECYCLE_COLORS['dormant'] }} />
            Dormant
          </div>
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
  SYSTEM_BOOT: SystemBootCanvas,
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
