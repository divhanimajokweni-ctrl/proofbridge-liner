'use client';
import React, { useState, useMemo } from 'react';
import { VVUMicrokernelV2 } from '@/lib/kernel/vvu-os-v2';

export default function KernelConsoleV2() {
  const kernel = useMemo(() => new VVUMicrokernelV2(), []);
  const [snapshot, setSnapshot] = useState(kernel.getKernelSnapshot());
  const [consoleTraces, setConsoleTraces] = useState<string[]>(['[BOOT_LOG] VVU OS Microkernel v2.0 active. Systems nominal.']);

  // Custom states tracking form inputs
  const [spawnName, setSpawnName] = useState('');
  const [spawnPriority, setSpawnPriority] = useState(3);
  const [spawnCycles, setSpawnCycles] = useState(50);
  const [spawnMemory, setSpawnMemory] = useState(512);

  const [ipcSender, setIpcSender] = useState<number>(200);
  const [ipcReceiver, setIpcReceiver] = useState<number>(201);
  const [ipcPayload, setIpcPayload] = useState('');

  const syncState = () => setSnapshot(kernel.getKernelSnapshot());

  const dispatchClockInterrupt = () => {
    const traces = kernel.dispatchSchedulerCycle();
    setConsoleTraces(prev => [...prev, ...traces]);
    syncState();
  };

  const handleCreateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spawnName.trim()) return;
    try {
      const pid = kernel.spawnProcess(spawnName.toUpperCase(), 'EXECUTION', spawnPriority, spawnCycles, spawnMemory);
      setConsoleTraces(prev => [...prev, `[KERNEL_CALL] Successfully spawned process thread ${spawnName.toUpperCase()} assigned PID: ${pid}`]);
      setSpawnName('');
      syncState();
    } catch (err: any) {
      setConsoleTraces(prev => [...prev, `🛑 [CRITICAL_EXCEPTION] ${err.message}`]);
      syncState();
    }
  };

  const handleTransmitIPC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipcPayload.trim()) return;
    const responseTrace = kernel.sendIPCMessage({ senderPid: Number(ipcSender), receiverPid: Number(ipcReceiver), payload: ipcPayload });
    setConsoleTraces(prev => [...prev, responseTrace]);
    setIpcPayload('');
    syncState();
  };

  return (
    <div className={`border p-6 rounded font-mono text-xs max-w-7xl mx-auto space-y-6 transition-all duration-300 ${
      snapshot.isPanicked ? 'bg-red-950/20 border-red-900 shadow-[0_0_25px_rgba(239,68,68,0.15)] text-red-200' : 'bg-slate-950 border-slate-900 text-slate-300'
    }`}>

      {/* Microkernel Platform Control Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className={`text-base font-black tracking-widest uppercase ${snapshot.isPanicked ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {snapshot.isPanicked ? '⚠️ KERNEL CORE PANIC HALT ACTIVE' : '⬡ VVU OS MICROKERNEL CONTROL STATION'}
          </h1>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            {snapshot.isPanicked ? `Exception Trace: ${snapshot.panicReason}` : 'Priority-Preemptive Scheduler with Type-Safe Inter-Process Communication Mailboxes.'}
          </p>
        </div>
        <div className="flex gap-2">
          {snapshot.isPanicked ? (
            <button onClick={() => { kernel.clearPanicReset(); setConsoleTraces(['[SYSTEM_RESET] Cleared panic register hooks. Cold boot clean reboot executed.']); syncState(); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm">
              REBOOT_KERNEL
            </button>
          ) : (
            <>
              <button onClick={() => { kernel.triggerKernelPanic('MANUAL_OPERATOR_INTERRUPT_SIGNAL_RAISED'); setConsoleTraces(prev => [...prev, '🛑 [PANIC] Manual operator system drop exception triggered.']); syncState(); }} className="px-3 py-1.5 bg-slate-900 border border-red-900/60 hover:bg-red-950/30 text-red-400 rounded-sm">
                FORCE_PANIC
              </button>
              <button onClick={dispatchClockInterrupt} className="px-4 py-1.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 hover:bg-cyan-900/40 font-bold rounded-sm tracking-widest shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                CLOCK_INTERRUPT
              </button>
            </>
          )}
        </div>
      </header>

      {/* Telemetry Progress Bar Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 bg-black/30 border border-slate-900 rounded p-4 gap-6 items-center">
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-[10px] text-slate-500">
            <span>CORE REGION VIRTUAL MEMORY SPACE BUFFER MAP</span>
            <span className={snapshot.isPanicked ? 'text-red-400' : 'text-cyan-400'}>{snapshot.memoryUsed}MB / {snapshot.totalMemory}MB USED</span>
          </div>
          <div className="w-full bg-slate-950 h-2 border border-slate-900 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${snapshot.isPanicked ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} style={{ width: `${(snapshot.memoryUsed / snapshot.totalMemory) * 100}%` }} />
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-slate-500 justify-start md:justify-end">
          <div>ACTIVE_REGISTERS: <span className="text-white font-mono">{snapshot.processes.filter(p => p.status !== 'TERMINATED').length} Threads</span></div>
          <div>•</div>
          <div>ENVIRONMENT: <span className={snapshot.isPanicked ? 'text-red-400' : 'text-emerald-400'}>{snapshot.isPanicked ? 'CRASHED' : 'NOMINAL_STATE'}</span></div>
        </div>
      </section>

      {/* Core Split Execution Workdeck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form Inputs Workspace Column (Left Section) */}
        <div className="space-y-4">
          {/* Thread Spawner Frame */}
          <form onSubmit={handleCreateProcess} className="bg-slate-900/10 border border-slate-900 p-4 rounded space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5">Spawn Task Boundary</div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400">THREAD_NAME IDENTIFIER</label>
              <input type="text" value={spawnName} onChange={e => setSpawnName(e.target.value)} disabled={snapshot.isPanicked} className="w-full bg-black border border-slate-800 p-2 text-cyan-400 font-mono focus:outline-none focus:border-cyan-600 disabled:opacity-30" placeholder="e.g. ROSCA-POOL-SYNC" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] text-slate-500 mb-1">PRIORITY (1-5)</label>
                <input type="number" min="1" max="5" value={spawnPriority} onChange={e => setSpawnPriority(Number(e.target.value))} className="w-full bg-black border border-slate-800 p-1.5 text-white" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 mb-1">CYCLES (LOAD)</label>
                <input type="number" min="10" value={spawnCycles} onChange={e => setSpawnCycles(Number(e.target.value))} className="w-full bg-black border border-slate-800 p-1.5 text-white" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 mb-1">RAM (MB)</label>
                <input type="number" min="64" max="8192" value={spawnMemory} onChange={e => setSpawnMemory(Number(e.target.value))} className="w-full bg-black border border-slate-800 p-1.5 text-white" />
              </div>
            </div>
            <button type="submit" disabled={snapshot.isPanicked} className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-200 font-bold py-1.5 rounded-sm transition-all disabled:opacity-30">ALLOCATE_THREAD_FRAME</button>
          </form>

          {/* IPC Frame Messenger */}
          <form onSubmit={handleTransmitIPC} className="bg-slate-900/10 border border-slate-900 p-4 rounded space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5">IPC Mailbox Dispatch Array</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">SENDER_PID</label>
                <input type="number" value={ipcSender} onChange={e => setIpcSender(Number(e.target.value))} className="w-full bg-black border border-slate-800 p-1.5 text-white" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">RECEIVER_PID</label>
                <input type="number" value={ipcReceiver} onChange={e => setIpcReceiver(Number(e.target.value))} className="w-full bg-black border border-slate-800 p-1.5 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400">MESSAGE STRING STRING ENVELOPE</label>
              <input type="text" value={ipcPayload} onChange={e => setIpcPayload(e.target.value)} disabled={snapshot.isPanicked} className="w-full bg-black border border-slate-800 p-2 text-cyan-400 focus:outline-none focus:border-cyan-600 disabled:opacity-30" placeholder="e.g. EXECUTE_MINT_CLEARANCE" />
            </div>
            <button type="submit" disabled={snapshot.isPanicked} className="w-full bg-cyan-950/20 hover:bg-cyan-900/20 border border-cyan-900/50 text-cyan-400 font-bold py-1.5 rounded-sm transition-all disabled:opacity-30">DISPATCH_IPC_FRAME</button>
          </form>
        </div>

        {/* Dynamic PCB Memory State Register Monitoring Grid Layout (Middle Column) */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Kernel Process Control Blocks Table</div>

          <div className="border border-slate-900 rounded overflow-hidden bg-black/20">
            <div className="bg-slate-900/50 p-2.5 grid grid-cols-12 text-[10px] font-bold text-slate-500 border-b border-slate-900 uppercase">
              <div className="col-span-2">PID</div>
              <div className="col-span-3">NAME</div>
              <div className="col-span-2">PRIO</div>
              <div className="col-span-2">LOAD</div>
              <div className="col-span-3 text-right">STATE</div>
            </div>

            <div className="divide-y divide-slate-900/60 max-h-72 overflow-y-auto">
              {snapshot.processes.map((p) => (
                <div key={p.pid} className={`p-2.5 grid grid-cols-12 items-center transition-colors ${p.status === 'RUNNING' ? 'bg-cyan-950/20' : ''}`}>
                  <div className="col-span-2 font-bold text-slate-500">{p.pid}</div>
                  <div className="col-span-3 text-white font-bold">{p.name}</div>
                  <div className="col-span-2 text-cyan-500">{p.priority}</div>
                  <div className="col-span-2 font-bold">{p.cpuCyclesRemaining}c</div>
                  <div className="col-span-3 text-right">
                    <span className={`text-[9px] px-1 py-0.5 rounded-xs font-black tracking-wider border ${
                      p.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse' :
                      p.status === 'READY' ? 'bg-slate-900 text-slate-400 border-slate-800' :
                      p.status === 'BLOCKED' ? 'bg-red-950/40 text-red-400 border-red-900/40' :
                      'bg-black text-slate-600 border-transparent opacity-40'
                    }`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Running Log Console Diagnostics Terminal View Output (Right Column) */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Microkernel Output Buffer Trace</div>
          <div className={`border p-4 rounded h-[380px] overflow-y-auto text-[11px] space-y-1 shadow-inner ${
            snapshot.isPanicked ? 'bg-black text-red-400 border-red-950' : 'bg-black border-slate-900 text-emerald-400'
          }`}>
            {consoleTraces.slice(-40).map((log, idx) => (
              <div key={idx} className="leading-relaxed opacity-90 truncate">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
