'use client';

import React, { useState } from 'react';

interface InfraNode {
  id: string;
  type: string;
  ip: string;
  health: 'STABLE' | 'DEGRADED' | 'OFFLINE';
  cpuLoad: number;
}

export default function InfrastructureView() {
  const [nodes] = useState<InfraNode[]>([
    { id: 'VVU-CORE-GATE-01', type: 'Production Node', ip: '10.144.12.4', health: 'STABLE', cpuLoad: 24 },
    { id: 'VVU-SANDBOX-04', type: 'Isolated Agent Loop', ip: '10.144.99.11', health: 'DEGRADED', cpuLoad: 92 },
    { id: 'VVU-BACKEND-DB', type: 'Data Storage Array', ip: '10.144.12.8', health: 'STABLE', cpuLoad: 14 },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-white">System Infrastructure</h2>
      <p className="text-slate-400 text-xs">Resource allocation and health across nodes</p>
      <div className="grid grid-cols-1 gap-4">
        {nodes.map((node) => (
          <div key={node.id} className="bg-slate-900 border border-slate-800 p-4 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-200">{node.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                  node.health === 'STABLE'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : node.health === 'DEGRADED'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                      : 'bg-red-950/80 text-red-400 border border-red-800'
                }`}>{node.health}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{node.type} &bull; {node.ip}</p>
            </div>
            <div className="w-full md:w-64 space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>CPU Load</span>
                <span>{node.cpuLoad}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${node.cpuLoad > 80 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${node.cpuLoad}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
