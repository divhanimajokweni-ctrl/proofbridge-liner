'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectNode {
  name: string;
  type: string;
  status: 'ACTIVE' | 'DEV' | 'PRE-PROD' | 'PILOT';
  description: string;
  metricLabel: string;
  metricValue: string;
}

export default function PolishedGatewayMatrix() {
  const [trustSignal, setTrustSignal] = useState(0);
  const [activeView, setActiveView] = useState<'all' | 'pilot' | 'dev'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const trustInterval = setInterval(() => {
      setTrustSignal((prev) => {
        if (prev >= 100) return 100;
        const tick = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + tick, 100);
      });
    }, 1200);
    return () => clearInterval(trustInterval);
  }, []);

  const menuItems = [
    { id: 'all', label: '🚨 Gateway Deck', count: 6 },
    { id: 'pilot', label: '🤖 Agent Terminal / Pilots', count: 3 },
    { id: 'dev', label: '🔒 Sandbox Labs (DEV)', count: 3 },
  ];

  const projectNodes: ProjectNode[] = [
    {
      name: 'Ubuntu Pools',
      type: 'ROSCA / STOKVEL',
      status: 'PILOT',
      description: 'Decentralized mutual financial pooling structures configured around regional community affinity parameters.',
      metricLabel: 'Active Pool Containers',
      metricValue: '12 Pools Locked',
    },
    {
      name: 'ProofBridge Liner',
      type: 'ZK / COMPLIANCE',
      status: 'PILOT',
      description: 'Zero-knowledge circuit generation validation array running isolated compliance computations.',
      metricLabel: 'Release Pipeline Countdown',
      metricValue: 'T-34 DAYS',
    },
    {
      name: 'SafeKrypte',
      type: 'HSM-AS-A-SERVICE',
      status: 'DEV',
      description: 'Hardware Security Module integration matrices isolating administrative root identity assertions.',
      metricLabel: 'Enclave Lifecycle Status',
      metricValue: 'PROVISIONING',
    },
    {
      name: 'SafeGrid',
      type: 'WATER / NMBM',
      status: 'DEV',
      description: 'Utility access network integration infrastructure mapping live Nelson Mandela Bay Municipality data loops.',
      metricLabel: 'Telemetry Sensor Array',
      metricValue: '98.4% STABLE',
    },
    {
      name: 'Ekasi',
      type: 'UBUNTU GAMES / RPG',
      status: 'PRE-PROD',
      description: 'Hyper-localized gamified learning state machine architecture utilizing decentralized token rewards.',
      metricLabel: 'Build Environment Matrix',
      metricValue: 'v0.9.8-BETA',
    },
    {
      name: 'Lindiwe AI',
      type: 'INTERNAL INTELLIGENCE',
      status: 'ACTIVE',
      description: 'Localized model framework evaluating internal operations metrics, compliance parameters, and audit assertions.',
      metricLabel: 'Agent Cluster Pulse Rate',
      metricValue: '42ms LATENCY',
    },
  ];

  const filteredNodes = projectNodes.filter((node) => {
    if (activeView === 'pilot') return node.status === 'PILOT' || node.status === 'ACTIVE';
    if (activeView === 'dev') return node.status === 'DEV' || node.status === 'PRE-PROD';
    return true;
  });

  const statusStyles: Record<string, string> = {
    ACTIVE: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50',
    'PRE-PROD': 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50',
    PILOT: 'bg-cyan-950/60 text-cyan-400 border-cyan-900/50',
    DEV: 'bg-amber-950/60 text-amber-400 border-amber-900/50',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono text-xs flex overflow-hidden relative selection:bg-cyan-500/30">
      <style jsx global>{`
        body > aside { display: none !important; }
        body > main { margin: 0 !important; }
        .vvu-sidebar-clip {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
        }
        .vvu-card-border {
          position: relative;
        }
        .vvu-card-border::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 6px; height: 6px;
          border-top: 1px solid #06b6d4;
          border-left: 1px solid #06b6d4;
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* Cybernetic scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.25))] bg-[length:100%_4px] opacity-15" />

      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 64 }}
        className="h-screen bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 relative backdrop-blur-md z-40"
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 h-12">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-bold tracking-widest text-white font-mono text-sm"
                >
                  VVU-BRAIN OS
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 hover:text-white shrink-0"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* Nav items */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as typeof activeView)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded transition-all border ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400 font-bold shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate text-xs">
                    {sidebarOpen ? item.label : item.label.split(' ')[0]}
                  </span>
                  {sidebarOpen && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-500 tracking-tight font-mono">
          {sidebarOpen ? 'Gate Target: 2026-07-30' : '2026'}
        </div>
      </motion.aside>

      {/* ─── MAIN CANVAS ────────────────────────────────────── */}
      <div className="flex-1 h-screen overflow-y-auto p-6 space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950">
        {/* Header */}
        <header className="vvu-sidebar-clip border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6 rounded relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
              VENTURE VISION UBUNTU
              <span className="text-[10px] font-mono font-normal tracking-normal text-cyan-500 bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded">
                v2.0-STABLE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-sans font-medium">
              Gqeberha, Eastern Cape &middot; Workspace Management Subsystem
              <span className="block italic font-mono text-cyan-400 mt-1">
                &ldquo;Umuntu ngumuntu ngabantu&rdquo;
              </span>
            </p>
          </div>

          {/* Trust signal progress */}
          <div className="w-full md:w-64 bg-black/40 border border-slate-800/80 p-3 rounded space-y-1.5">
            <div className="flex justify-between text-[10px] tracking-wider font-bold">
              <span className="text-slate-500 uppercase">Trust Signals Resolution</span>
              <span
                className={
                  trustSignal === 100 ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
                }
              >
                {trustSignal}% {trustSignal === 100 ? 'LOCKED' : 'SYNCING'}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                animate={{ width: `${trustSignal}%` }}
                transition={{ type: 'spring', stiffness: 45 }}
              />
            </div>
          </div>
        </header>

        {/* Project grid */}
        <motion.main layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredNodes.map((node) => (
              <motion.div
                layout
                key={node.name}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="vvu-card-border border border-slate-800/70 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-700 rounded p-5 flex flex-col justify-between space-y-4 transition-colors group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      {node.type}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-black tracking-widest border ${
                        statusStyles[node.status] || ''
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                    ⬡ {node.name}
                  </h3>
                  <p className="text-slate-400 text-[11px] leading-relaxed font-sans font-medium h-12 overflow-hidden text-ellipsis">
                    {node.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">{node.metricLabel}:</span>
                  <span className="text-white font-bold tracking-wide">{node.metricValue}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.main>

        {/* Footer */}
        <footer className="border border-slate-800 bg-black/20 p-4 rounded text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <span>
              NETWORK CORRIDOR: <span className="text-emerald-400 font-bold">ACTIVE</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>
              DIAGNOSTICS: <span className="text-cyan-400 font-bold">STABLE</span>
            </span>
          </div>
          <div className="text-center sm:text-right text-[9px] tracking-wider text-slate-600">
            &copy; 2026 Vaguely Vanity LLC (CIPC 2026/259053/07)
          </div>
        </footer>
      </div>
    </div>
  );
}
