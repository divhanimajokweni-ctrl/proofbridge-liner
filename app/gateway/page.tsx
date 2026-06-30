'use client';

import React, { useState } from 'react';
import DashboardView from './panels/DashboardView';
import AgentTerminalView from './panels/AgentTerminalView';
import InfrastructureView from './panels/InfrastructureView';

type TabId = 'dashboard' | 'agents' | 'infra';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Metrics' },
  { id: 'agents',    label: 'Agent Matrix' },
  { id: 'infra',     label: 'Infra Map' },
];

const GATE_PIN = '2026';

function PinGate({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  const tap = (d: string) => {
    if (err) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === GATE_PIN) { setTimeout(onAuth, 400); }
      else { setErr(true); setTimeout(() => { setPin(''); setErr(false); }, 900); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090C]"
      style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(140,26,62,0.09) 0%, #07090C 65%)' }}>
      <div className="text-center mb-12 animate-[fadeUp_0.7s_ease]">
        <div className="flex justify-center items-center mb-4">
          {[{ c: '#C8A84A', x: -16, y: -8, s: 32 }, { c: '#A8A090', x: 16, y: -8, s: 32 }, { c: '#C8A84A88', x: 0, y: 10, s: 28 }].map((r, i) => (
            <div key={i} className="absolute rounded-full"
              style={{ width: r.s, height: r.s, border: `2.5px solid ${r.c}`, left: `calc(50% + ${r.x}px)`, top: `calc(50% + ${r.y}px)`, transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-[4px] text-[#DCE2EA] mb-1">VVU GATEWAY OS</h1>
        <p className="text-[9px] tracking-[5px] text-[#334658] font-mono">RESTRICTED ACCESS</p>
      </div>

      <div className="flex gap-[18px] mb-8" style={{ animation: err ? 'pinShake 0.55s ease' : 'none' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[13px] h-[13px] rounded-full transition-all duration-200"
            style={{
              background: i < pin.length ? '#C8A84A' : 'transparent',
              border: `1.5px solid ${i < pin.length ? '#C8A84A' : '#1C2A38'}`,
              boxShadow: i < pin.length ? '0 0 10px rgba(200,168,74,0.38)' : 'none',
            }} />
        ))}
      </div>

      <div className="h-4 mb-5 text-center">
        {err && <span className="font-mono text-[10px] tracking-[3px] text-[#C4254F]">ACCESS DENIED</span>}
        {!err && <span className="font-mono text-[10px] tracking-[3px] text-[#334658]">ENTER PIN</span>}
      </div>

      <div className="grid grid-cols-3 gap-[10px] w-[220px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
          <button key={i}
            onClick={() => d !== '' && d !== '⌫' ? tap(String(d)) : d === '⌫' && !err ? setPin(p => p.slice(0, -1)) : undefined}
            disabled={d === ''}
            className="pb-btn h-[60px] rounded-lg text-[22px] font-mono transition-all"
            style={{
              background: d === '' ? 'transparent' : '#121925',
              border: `1px solid ${d === '' ? 'transparent' : '#1C2A38'}`,
              color: d === '⌫' ? '#6A8099' : '#DCE2EA',
              cursor: d === '' ? 'default' : 'pointer',
            }}>
            {d === '⌫' ? <span className="text-lg">⌫</span> : d}
          </button>
        ))}
      </div>

      <p className="mt-11 font-mono text-[8.5px] tracking-[3px] text-[#334658]">CIPC 2026/259053/07 · GQEBERHA, EC, ZA</p>
    </div>
  );
}

export default function GatewaySPAControlDeck() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (!isAuthorized) {
    return <PinGate onAuth={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="flex flex-col bg-slate-950 text-white p-8">
      <header className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gateway Engine Control</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-mono">Terminal Active Node: Secure-Sandbox-L4</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded border border-slate-800 self-start">
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'agents'    && <AgentTerminalView />}
        {activeTab === 'infra'     && <InfrastructureView />}
      </main>
    </div>
  );
}
