'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, ChevronUp, Terminal } from 'lucide-react';
import { useIDEStore, AUTONOMY_COLORS, AUTONOMY_LABELS } from './ide-store';

// ---------------------------------------------------------------------------
// Lindiwe Terminal (Operator Modality)
// ---------------------------------------------------------------------------

export function LindiweTerminal() {
  const lindiweTerminalOpen = useIDEStore((s) => s.lindiweTerminalOpen);
  const toggleLindiweTerminal = useIDEStore((s) => s.toggleLindiweTerminal);
  const terminalEntries = useIDEStore((s) => s.terminalEntries);
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);
  const autonomyLevel = useIDEStore((s) => s.autonomyLevel);

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
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

    // Simulate command execution
    const cmd = inputValue.trim().toLowerCase();

    if (cmd === 'lindiwe init hbk --target cape_town --nodes 4') {
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> Initializing HBK simulation for Cape Town with 4 nodes...' });
      setTimeout(() => {
        addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> node_01: ACTIVE ✓' });
        addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> node_02: ACTIVE ✓' });
        addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> node_03: ACTIVE ✓' });
        addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> node_04: ACTIVE ✓' });
        addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> HBK Cape Town simulation initialized. 4 nodes online.' });
      }, 800);
    } else if (cmd.startsWith('lindiwe reroute')) {
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> Rerouting node. Traffic redistributed to healthy nodes.' });
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: '> Reroute complete. Latency normalized.' });
    } else if (cmd === 'lindiwe status') {
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: `> Lindiwe-v3 | Autonomy: ${AUTONOMY_LABELS[autonomyLevel]} (L${autonomyLevel}) | Nodes: 4 active | Trust: 72/100` });
    } else if (cmd === 'help') {
      addTerminalEntry({ level: 'info', source: 'system', message: '> Commands: lindiwe init HBK --target cape_town --nodes 4, lindiwe reroute HBK_XX, lindiwe status, clear, circuit-break' });
    } else if (cmd === 'circuit-break') {
      addTerminalEntry({ level: 'critical', source: 'watchdog', message: '> [CRITICAL] WATCHDOG INITIATED. SESSION CIRCUIT-BROKEN. REASON: OPERATOR OVERRIDE. AWAITING CONFIRMATION.' });
    } else {
      addTerminalEntry({ level: 'warn', source: 'system', message: `> Unknown command: ${inputValue}. Type 'help' for available commands.` });
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
    <AnimatePresence>
      {lindiweTerminalOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 200 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="bg-[#1a1a1a] border-t border-[#2d2d2d] flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1 border-b border-[#2d2d2d] bg-[#1c1c1c]">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-[#858585]" />
              <span className="text-[11px] font-mono text-[#858585]">LINDIWE TERMINAL</span>
              <span className="text-[10px] font-mono" style={{ color: AUTONOMY_COLORS[autonomyLevel] }}>
                {AUTONOMY_LABELS[autonomyLevel]}
              </span>
            </div>
            <button
              onClick={toggleLindiweTerminal}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Output */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] leading-4 custom-scrollbar"
          >
            {terminalEntries.map((entry) => (
              <div key={entry.id} className="flex gap-2 py-0.5">
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
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-1.5 border-t border-[#2d2d2d]">
            <span className="text-[#3dffb0] font-mono text-[11px]">$</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-white font-mono outline-none placeholder-[#555]"
              placeholder="lindiwe init HBK --target cape_town --nodes 4"
              autoFocus
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
