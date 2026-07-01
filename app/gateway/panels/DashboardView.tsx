'use client';

import React, { useState, useEffect } from 'react';

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export default function DashboardView() {
  const [bars] = useState(() => Array(34).fill(0.3));
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const metrics: MetricCard[] = [
    { label: 'PRODUCTION IN',  value: 'T-34 DAYS',    sub: 'ProofBridge · 2026-07-30',             color: '#C8A84A' },
    { label: 'SAFEKRIPTE LITE', value: '1000 FREE',   sub: 'ED25519 · /commons/v1/sign',           color: '#00E5FF' },
    { label: 'SAFELINER LITE', value: 'ACTIVE',       sub: 'Credentials · /commons/v1/issue',      color: '#3ECF8E' },
    { label: 'OPERATUS KERNEL', value: '4 OPERATORS', sub: 'SafeLiner · SafeKrypte · HAL · Audit', color: '#E4C86A' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Command Center</h2>
          <p className="text-slate-400 text-xs font-mono mt-0.5">
            {clock.toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400">NOMINAL</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="font-mono text-[10px] text-slate-500 tracking-wider mb-2">{m.label}</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: m.color }}>{m.value}</div>
            <div className="font-mono text-[10px] text-slate-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="font-mono text-[10px] text-slate-500 tracking-wider mb-4">SYSTEM PULSE</div>
        <div className="flex items-end h-20 gap-[3px] mb-3">
          {bars.map((_, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: `${20 + Math.random() * 80}%`,
                background: i >= bars.length - 4 ? '#C8A84A' : 'rgba(200,168,74,0.24)',
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 font-mono text-[10px]">
          <div><span className="text-slate-500">NATS</span><span className="text-emerald-400 ml-2">JetStream ✓</span></div>
          <div><span className="text-slate-500">Lean 4</span><span className="text-emerald-400 ml-2">v1.2.2 ✓</span></div>
          <div><span className="text-slate-500">Amoy</span><span className="text-emerald-400 ml-2">Connected</span></div>
        </div>
      </div>
    </div>
  );
}
