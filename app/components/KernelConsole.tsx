'use client';
import React, { useState, useMemo } from 'react';
import { VVUKernelEngine } from '@/lib/kernel/vvu-os';

export default function KernelConsoleDashboard() {
  // Instantiating the kernel module framework locally for thread tracking
  const kernel = useMemo(() => new VVUKernelEngine(), []);
  const [systemState, setSystemState] = useState(kernel.getSystemState());
  const [executionLogs, setExecutionLogs] = useState<string[]>(['[CONSOLE_READY] Kernel active. Click "CLOCK_TICK" to schedule cycles.']);

  const triggerSchedulerClockTick = () => {
    const runLogs = kernel.executeSchedulerTick();
    setExecutionLogs(prev => [...prev, ...runLogs]);
    setSystemState(kernel.getSystemState());
  };

  const handleSpawnAppProcess = () => {
    try {
      const randomAppId = Math.floor(Math.random() * 900) + 100;
      kernel.allocateProcess(`APP-CHILD-${randomAppId}`, 'EXECUTION', 3, 45, 512);
      setExecutionLogs(prev => [...prev, `[KERNEL_CALL] Spawned application container worker loop: APP-CHILD-${randomAppId}`]);
      setSystemState(kernel.getSystemState());
    } catch (err: any) {
      setExecutionLogs(prev => [...prev, `❌ ${err.message}`]);
    }
  };

  return (
    <div className="border border-slate-900 bg-slate-950 p-6 rounded font-mono text-xs text-slate-300 max-w-6xl mx-auto space-y-6">

      {/* Operating System Header Controls */}
      <header className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">VVU Microkernel Interface Deck</h2>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">Live visualization of Hardware Management and Application Scheduling processes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSpawnAppProcess}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-sm font-bold"
          >
            ➕ SPAWN PROCESS
          </button>
          <button
            onClick={triggerSchedulerClockTick}
            className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 hover:bg-cyan-900/40 font-bold rounded-sm tracking-wide"
          >
            ⚡ CLOCK_TICK
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread Processing Status Board Map Table (Left Section) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-wider">
            <span>ACTIVE PROCESS CONTROL BLOCK (PCB) REGISTERS</span>
            <span>MEM: {systemState.memoryUsed} / {systemState.totalMemory} MB</span>
          </div>

          <div className="border border-slate-900 rounded overflow-hidden bg-black/20">
            <div className="bg-slate-900/50 p-2.5 grid grid-cols-12 text-[10px] font-bold text-slate-500 border-b border-slate-900 uppercase">
              <div className="col-span-2">PID</div>
              <div className="col-span-3">THREAD_NAME</div>
              <div className="col-span-3">SUBSYSTEM</div>
              <div className="col-span-2">REMAIN_CYCLES</div>
              <div className="col-span-2 text-right">STATE</div>
            </div>

            <div className="divide-y divide-slate-900/60 max-h-64 overflow-y-auto">
              {systemState.threads.map((pcb) => (
                <div key={pcb.pid} className="p-2.5 grid grid-cols-12 items-center hover:bg-slate-900/10 transition-colors">
                  <div className="col-span-2 font-bold text-slate-500">{pcb.pid}</div>
                  <div className="col-span-3 text-white font-bold">{pcb.name}</div>
                  <div className="col-span-3 text-cyan-500">{pcb.subsystem}</div>
                  <div className="col-span-2 font-bold">{pcb.cpuCyclesRemaining}</div>
                  <div className="col-span-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded-xs text-[9px] font-black tracking-wider ${
                      pcb.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      pcb.status === 'READY' ? 'bg-slate-900 text-slate-400 border border-slate-800' :
                      'bg-emerald-950/20 text-emerald-500/50 border border-emerald-900/20 opacity-50'
                    }`}>
                      {pcb.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Live Scheduler Terminal Trace Output Logs (Right Section) */}
        <div className="space-y-4">
          <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Kernel Output Buffer Logs</div>
          <div className="bg-black border border-slate-900 p-4 rounded h-64 overflow-y-auto text-emerald-400 text-[11px] space-y-1 shadow-inner">
            {executionLogs.slice(-30).map((log, idx) => (
              <div key={idx} className="leading-relaxed opacity-90 truncate">{log}</div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
