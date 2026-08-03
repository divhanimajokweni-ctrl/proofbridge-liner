'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Bot,
  User,
  AlertTriangle,
  Shield,
  Activity,
  Zap,
  ChevronDown,
  Minimize2,
} from 'lucide-react';
import { useIDEStore, AUTONOMY_LABELS, AUTONOMY_COLORS } from './ide-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'user' | 'lindiwe' | 'system';
  content: string;
  timestamp: string;
  level?: 'info' | 'warn' | 'critical';
}

// ---------------------------------------------------------------------------
// Lindiwe Advisor Responses (simulated)
// ---------------------------------------------------------------------------

const LINDIWE_RESPONSES: Record<string, string> = {
  'default': "I'm monitoring the current session. All systems are operating within normal parameters. Trust Score: 72/100. Is there something specific you'd like me to analyze?",
  'node': "I've analyzed the node cluster. node_01 is active and healthy. node_02 shows elevated latency — 340ms vs the 120ms baseline. I've pre-written a reroute command: `> lindiwe reroute HBK_02`. Execute when ready.",
  'trust': "The Trust Sphere is currently displaying 380 nodes in a Fibonacci lattice. The epistemic trust score is 72/100 — this reflects the weighted average of verified vs. unverified contributions. All cryptographic receipts are anchored to the MMR.",
  'hbk': "The HBK Cape Town simulation is running on 4 nodes. The MCMC pipeline is in Phase 2 (Analysis) at 78% completion. node_04 is reporting errors — possible memory leak in the sampling loop. I recommend stopping node_04 and redistributing the workload.",
  'circuit': "The circuit breaker is currently in NORMAL state. I'm monitoring for: trust breaches, memory leaks, unauthorized compute drain, and epistemic integrity violations. If you elevate my autonomy to Watchdog (Level 3), I can automatically circuit-break on critical events.",
  'help': "I can help you with:\n• **Node Analysis** — Ask about any node status\n• **Trust Verification** — Query the current trust score\n• **HBK Pipeline** — Simulation status and diagnostics\n• **Circuit Breaker** — Security monitoring status\n• **Autonomy** — Adjust my permission level\n\nUse the Command Palette (⌘K) for quick actions, or just ask me anything in natural language.",
};

function getLindiweResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('node') || lower.includes('latency') || lower.includes('lag')) return LINDIWE_RESPONSES['node'];
  if (lower.includes('trust') || lower.includes('sphere') || lower.includes('score')) return LINDIWE_RESPONSES['trust'];
  if (lower.includes('hbk') || lower.includes('simulation') || lower.includes('pipeline')) return LINDIWE_RESPONSES['hbk'];
  if (lower.includes('circuit') || lower.includes('breaker') || lower.includes('security')) return LINDIWE_RESPONSES['circuit'];
  if (lower.includes('help') || lower.includes('what can')) return LINDIWE_RESPONSES['help'];
  return LINDIWE_RESPONSES['default'];
}

// ---------------------------------------------------------------------------
// Lindiwe Side Panel
// ---------------------------------------------------------------------------

export function LindiwePanel() {
  const lindiwePanelOpen = useIDEStore((s) => s.lindiwePanelOpen);
  const lindiwePanelWidth = useIDEStore((s) => s.lindiwePanelWidth);
  const toggleLindiwePanel = useIDEStore((s) => s.toggleLindiwePanel);
  const autonomyLevel = useIDEStore((s) => s.autonomyLevel);
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'lindiwe',
      content: "Lindiwe-v3 online. Autonomy: Action-Safe. I'm monitoring the current session. How can I help?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate Lindiwe response
    setTimeout(() => {
      const response = getLindiweResponse(inputValue);
      const lindiweMsg: ChatMessage = {
        id: `lindiwe-${Date.now()}`,
        role: 'lindiwe',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, lindiweMsg]);
      addTerminalEntry({ level: 'info', source: 'lindiwe', message: 'Advisor response dispatched.' });
    }, 600);

    setInputValue('');
  };

  if (!lindiwePanelOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: lindiwePanelWidth, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="bg-[#1c1c1c] border-l border-[#2d2d2d] flex flex-col shrink-0 overflow-hidden"
        style={{ width: lindiwePanelWidth }}
        aria-label="Lindiwe Advisor Panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" style={{ color: AUTONOMY_COLORS[autonomyLevel] }} />
            <span className="text-[12px] font-semibold text-white">Lindiwe</span>
            <span className="text-[10px] font-mono text-[#858585]">Advisor</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: AUTONOMY_COLORS[autonomyLevel] }}
            />
          </div>
          <button
            onClick={toggleLindiwePanel}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Autonomy Quick Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2d2d2d] bg-[#1a1a1a]">
          <span className="text-[10px] text-[#858585] font-mono">Autonomy:</span>
          <span className="text-[10px] font-mono" style={{ color: AUTONOMY_COLORS[autonomyLevel] }}>
            {AUTONOMY_LABELS[autonomyLevel]} (L{autonomyLevel})
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#2a2d2e]">
                {msg.role === 'user' ? (
                  <User className="h-3 w-3 text-[#858585]" />
                ) : (
                  <Bot className="h-3 w-3" style={{ color: AUTONOMY_COLORS[autonomyLevel] }} />
                )}
              </div>
              <div
                className={`
                  max-w-[85%] px-3 py-2 rounded-lg text-[12px] leading-5
                  ${msg.role === 'user'
                    ? 'bg-[#094771] text-white'
                    : 'bg-[#2a2d2e] text-[#cccccc]'
                  }
                `}
              >
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.startsWith('•') || line.startsWith('**') ? (
                      <span className="text-[#3dffb0]">{line}</span>
                    ) : (
                      line
                    )}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 py-2 border-t border-[#2d2d2d]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[#2a2d2e] rounded-lg px-3 py-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Lindiwe…"
              className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-[#555] font-mono"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-6 w-6 flex items-center justify-center rounded bg-[#3dffb0]/20 text-[#3dffb0] hover:bg-[#3dffb0]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
