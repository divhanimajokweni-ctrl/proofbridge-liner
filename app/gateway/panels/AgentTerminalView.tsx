'use client';

import React, { useState } from 'react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AgentTerminalView() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: '1', role: 'system', content: 'Agent state engine linked. Sandbox: Level-4.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const runCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.reply || '(empty)' }]);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'system', content: 'CRITICAL: Execution loop failure.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] border border-slate-800 bg-slate-950 rounded-lg overflow-hidden">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center font-mono text-xs">
        <span className="text-slate-300 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Agent Terminal
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs text-slate-300">
        {messages.map((m) => (
          <div key={m.id} className={`p-3 rounded border ${
            m.role === 'user'
              ? 'bg-slate-900 border-slate-800 ml-12 text-slate-200'
              : m.role === 'system'
                ? 'bg-amber-950/20 border-amber-900/50 text-amber-400'
                : 'bg-cyan-950/10 border-cyan-900/30 text-cyan-300 mr-12'
          }`}>
            <span className="block font-bold text-[10px] uppercase text-slate-500 mb-1">{m.role}</span>
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={runCycle} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Command..." disabled={loading}
          className="flex-1 bg-black text-cyan-400 font-mono text-xs px-3 py-2 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
        <button type="submit" disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono px-4 text-xs font-bold rounded tracking-wider transition-all disabled:opacity-50">
          {loading ? 'RUNNING...' : 'EXEC'}
        </button>
      </form>
    </div>
  );
}
