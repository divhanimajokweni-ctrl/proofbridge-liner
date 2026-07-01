'use client';
import React from 'react';

interface AuditMetric {
  controlId: string;
  domain: string;
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  score: number;
  lastChecked: string;
}

export default function AuditView() {
  const [metrics] = React.useState<AuditMetric[]>([
    { controlId: 'CC.6.1', domain: 'Edge Perimeter Access Filtering', status: 'COMPLIANT', score: 100, lastChecked: '2026-07-01' },
    { controlId: 'CC.6.3', domain: 'Parameter Type Sanity Verification', status: 'COMPLIANT', score: 100, lastChecked: '2026-07-01' },
    { controlId: 'CC.6.8', domain: 'Automated Core Exception Testing', status: 'COMPLIANT', score: 100, lastChecked: '2026-07-01' },
    { controlId: 'CC.7.1', domain: 'Real-Time Console Telemetry Logging', status: 'WARNING', score: 84, lastChecked: '2026-06-30' },
  ]);

  const pct = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300">
      <div className="bg-slate-900/30 border border-slate-900 p-5 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">SOC2 Type II Readiness Matrix</h2>
          <p className="text-slate-500 text-[11px] font-sans">NIST SP 800-53 isolation control assertions tracking platform stability parameters.</p>
        </div>
        <div className="bg-black/40 border border-slate-800 px-4 py-3 rounded text-center shrink-0 min-w-[140px]">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">AGGREGATE SCORE</span>
          <span className={`text-xl font-black ${pct > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{pct}% PASS</span>
        </div>
      </div>
      <div className="border border-slate-900 rounded bg-slate-950 overflow-hidden">
        <div className="bg-slate-900/50 border-b border-slate-900 p-3 grid grid-cols-12 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
          <div className="col-span-2">CONTROL</div>
          <div className="col-span-5">DOMAIN SPECIFICATION</div>
          <div className="col-span-3 text-center">COMPLIANCE STATE</div>
          <div className="col-span-2 text-right">SCORE</div>
        </div>
        <div className="divide-y divide-slate-900">
          {metrics.map((m) => (
            <div key={m.controlId} className="p-3 grid grid-cols-12 items-center hover:bg-slate-900/10 transition-colors">
              <div className="col-span-2 font-bold text-white">{m.controlId}</div>
              <div className="col-span-5 text-slate-300 font-sans font-medium">{m.domain}</div>
              <div className="col-span-3 flex justify-center">
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border ${
                  m.status === 'COMPLIANT'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                    : 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                }`}>{m.status}</span>
              </div>
              <div className="col-span-2 text-right font-bold font-mono text-slate-200">{m.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
