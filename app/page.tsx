'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── DEVICE TYPES ───────────────────────────────────────
type ViewTab = 'deck' | 'terminal' | 'infra' | 'globe';
type ProjectStatus = 'ACTIVE' | 'DEV' | 'PRE-PROD' | 'PILOT';
interface ProjectNode {
  name: string; type: string; status: ProjectStatus;
  description: string; metricLabel: string; metricValue: string;
}

// ─── VVU COLOR CONSTANTS ────────────────────────────────
const C = {
  void: '#07090B', surface: '#121925', card: '#16202E',
  border: '#1C2A38', borderHover: '#243546',
  gold: '#C8A84A', goldBright: '#E4C86A', goldGlow: '0 0 14px rgba(200,168,74,0.25)',
  cyan: '#00E5FF', cyanGlow: '0 0 14px rgba(0,229,255,0.25)',
  emerald: '#3ECF8E',
  crimson: '#8C1A3E',
  text: '#DCE2EA', textSecondary: '#6A8099', textMuted: '#334658',
};

// ─── ANTONY THE ANT MASCOT ─────────────────────────────
function AntonyTrack({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [taskLabel, setTaskLabel] = useState('BOOT');
  const tasks = [
    'PARSE_HMAC', 'VERIFY_STITCH_EFT', 'MUTATE_REPUTATION',
    'SIGN_ED25519', 'ANCHOR_AMOY', 'INGEST_QUEUE',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (trackRef.current) {
            trackRef.current.querySelectorAll('.antony-ant').forEach(el => el.remove());
          }
          return 0;
        }
        const t = tasks[Math.floor(Math.random() * tasks.length)];
        setTaskLabel(t);
        const next = prev + Math.ceil(Math.random() * 7) + 3;
        if (trackRef.current) {
          const ant = document.createElement('div');
          ant.className = 'antony-ant';
          Object.assign(ant.style, {
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: '40px', fontFamily: '"IBM Plex Mono",monospace',
            fontSize: '0.65rem', color: C.gold, whiteSpace: 'nowrap',
            zIndex: '5', transition: 'opacity 0.3s',
          });
          ant.innerHTML = `🐜 <span style="background:${C.gold}22;padding:1px 8px;border-radius:4px;margin-left:6px;border:1px solid ${C.gold}44">${t}</span>`;
          trackRef.current.appendChild(ant);
          let pos = 40;
          const end = trackRef.current.clientWidth - 180;
          const run = () => {
            pos += 5;
            ant.style.left = pos + 'px';
            if (pos < end) requestAnimationFrame(run);
            else { ant.style.opacity = '0'; setTimeout(() => ant.remove(), 150); }
          };
          requestAnimationFrame(run);
        }
        return Math.min(next, 100);
      });
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2 font-mono text-[10px]">
        <span style={{ color: C.gold }}>🐜 ANTONY QUEUE ENGINE</span>
        <span style={{ color: C.cyan }}>{taskLabel}</span>
      </div>
      <div ref={trackRef}
        style={{
          height: '48px', background: C.void, border: `1px dashed ${C.border}`,
          borderRadius: '6px', position: 'relative', overflow: 'hidden',
        }}
      >
        <span style={{
          position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.55rem',
          color: C.textMuted, zIndex: 10,
        }}>ENTRY</span>
        <span style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.55rem',
          color: C.textMuted, zIndex: 10,
        }}>VAULT</span>
      </div>
      <div style={{ height: '3px', background: C.card, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${C.gold}, ${C.cyan})`,
          transition: 'width 0.15s linear',
          boxShadow: `0 0 8px ${C.gold}44`,
        }} />
      </div>
    </div>
  );
}

// ─── SPINNING TELEMETRY GLOBE ─────────────────────────
function TelemetryGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const radius = 90;
    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 180; i += 8) {
      const lat = (i * Math.PI) / 180 - Math.PI / 2;
      for (let j = 0; j < 360; j += 12) {
        const lon = (j * Math.PI) / 180 - Math.PI;
        nodes.push({
          x: radius * Math.cos(lat) * Math.sin(lon),
          y: radius * Math.sin(lat),
          z: radius * Math.cos(lat) * Math.cos(lon),
        });
      }
    }

    let rotX = 0, rotY = 0;
    let frameId: number;
    const render = () => {
      ctx.clearRect(0, 0, size, size);
      rotY += 0.004;
      rotX += 0.002;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      // Sort by depth for z-order
      const projected = nodes.map((n) => {
        const rx = n.x * cosY - n.z * sinY;
        const rz = n.z * cosY + n.x * sinY;
        const ry = n.y * cosX - rz * sinX;
        const fz = rz * cosX + n.y * sinX;
        return { x: rx, y: ry, z: fz, visible: fz + radius > 0 };
      }).sort((a, b) => a.z - b.z);

      projected.forEach((p) => {
        if (!p.visible) return;
        const sx = size / 2 + p.x;
        const sy = size / 2 + p.y;
        const sf = Math.max(0.3, (p.z + radius) / (radius * 2));
        const r = sf * 2;

        // Gold glow on front nodes, dim on back
        const alpha = sf * 0.9;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 168, 74, ${alpha})`;
        ctx.fill();

        // Cyan highlight ring on closer nodes
        if (sf > 0.7) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${sf * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Orbital rings
      ctx.strokeStyle = `${C.gold}22`;
      ctx.lineWidth = 0.5;
      [0.4, 0.7, 1.0].forEach((s) => {
        ctx.beginPath();
        ctx.ellipse(size / 2, size / 2, radius * s, radius * s * 0.35, rotY * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      });

      frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className={className} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
    }}>
      <canvas ref={canvasRef} style={{ borderRadius: '50%' }} />
      <p style={{
        fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.55rem',
        color: C.gold, letterSpacing: '0.12em', textTransform: 'uppercase',
        marginTop: '8px',
      }}>
        ● QUORUM NODE TOPOLOGY
      </p>
    </div>
  );
}

// ─── SVG SPARKLINE ─────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const w = 120, h = 28;
  if (data.length < 2) return null;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - 0) / 100) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.cyan} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="url(#sparkGrad)" strokeWidth="1.5" points={pts} />
      <circle cx={w} cy={h - ((data[data.length - 1] - 0) / 100) * h} r="2.5" fill={C.cyan} />
    </svg>
  );
}

// ─── AGENT CHAT ─────────────────────────────────────────
const RATE_LIMIT_MS = 2000;
const MAX_MESSAGE_LENGTH = 2000;

function AgentChat() {
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    const now = Date.now();
    if (now - lastSentRef.current < RATE_LIMIT_MS) {
      setError(`Wait ${((RATE_LIMIT_MS - (now - lastSentRef.current)) / 1000).toFixed(1)}s`);
      setTimeout(() => setError(''), 1500);
      return;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (${text.length}/${MAX_MESSAGE_LENGTH})`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    lastSentRef.current = now;
    setInput('');
    setError('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/agent/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-request': 'true' },
        body: JSON.stringify({ message: text, threadId: threadId || undefined }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.threadId && !threadId) setThreadId(data.threadId);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.content || data.reply || '(no response)' }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out (15s) — agent may be overloaded'
          : 'Connection failed — check agent API status',
      }]);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const roleColors: Record<string, { bg: string; border: string; dot: string; label: string }> = {
    user: { bg: `${C.void}`, border: C.border, dot: C.cyan, label: 'YOU' },
    assistant: { bg: `${C.surface}`, border: C.borderHover, dot: C.gold, label: 'AGENT' },
    system: { bg: `${C.void}`, border: C.crimson, dot: C.crimson, label: 'SYSTEM' },
  };

  return (
    <div className="flex flex-col" style={{
      border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden',
      background: C.void, minHeight: '520px', height: 'calc(100vh - 220px)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
          <span style={{ fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>CORE AGENT</span>
          <span style={{ fontSize: '0.45rem', color: C.textMuted, background: `${C.card}`, padding: '2px 8px', borderRadius: '4px', fontFamily: '"IBM Plex Mono",monospace' }}>
            {threadId ? threadId.slice(0, 8) : 'NEW SESSION'}
          </span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setThreadId(''); }}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: '4px', padding: '4px 10px', fontSize: '0.5rem', fontFamily: '"IBM Plex Mono",monospace', cursor: 'pointer' }}>
            CLEAR
          </button>
        )}
      </div>

      <div className="vvu-scrollbar" style={{
        flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: C.textMuted, fontSize: '0.6rem', fontFamily: '"IBM Plex Mono",monospace' }}>
            <div style={{ fontSize: '2rem', opacity: 0.2 }}>⬡</div>
            <div>Agent ready — type a message to begin</div>
            <div style={{ color: C.border, fontSize: '0.5rem' }}>powered by VVU Operatus · SafeKrypte Lite · SafeLiner Lite</div>
          </div>
        )}
        {messages.map(m => {
          const rc = roleColors[m.role] || roleColors.system;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: '8px',
                background: rc.bg, border: `1px solid ${rc.border}`,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: rc.dot, boxShadow: `0 0 6px ${rc.dot}` }} />
                  <span style={{ fontSize: '0.45rem', color: rc.dot, fontWeight: 700, letterSpacing: '0.1em', fontFamily: '"IBM Plex Mono",monospace' }}>
                    {rc.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: C.text, lineHeight: '1.6', fontFamily: '"DM Sans",sans-serif', whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', color: C.gold, fontSize: '0.55rem', fontFamily: '"IBM Plex Mono",monospace' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.gold, animation: 'pulse 1s infinite' }} />
            Agent processing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{
        display: 'flex', flexDirection: 'column', borderTop: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        {error && (
          <div style={{
            padding: '4px 12px', fontSize: '0.5rem', color: C.crimson,
            fontFamily: '"IBM Plex Mono",monospace', background: `${C.crimson}15`,
          }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', padding: '10px', gap: '8px' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Message the VVU core agent..."
            disabled={loading}
            style={{
              flex: 1, background: C.void, border: `1px solid ${C.border}`, borderRadius: '6px',
              color: C.text, fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.65rem',
              padding: '8px 12px', outline: 'none',
            }} />
          <button type="submit" disabled={loading || !input.trim()}
            style={{
              background: loading ? C.card : C.gold, border: 'none', borderRadius: '6px',
              color: loading ? C.textMuted : C.void, fontWeight: 700,
              fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', cursor: loading ? 'default' : 'pointer',
              padding: '8px 18px', letterSpacing: '0.05em',
            }}>
            {loading ? '...' : 'SEND'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────
export default function VVUEliteGateway() {
  const [activeTab, setActiveTab] = useState<ViewTab>('deck');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectNode | null>(null);
  const [trustSignal, setTrustSignal] = useState(0);
  const [cpuHistory, setCpuHistory] = useState<Record<string, number[]>>({
    prod01: [42, 48, 45, 52, 49, 55, 51, 47, 53, 50],
    gateway: [80, 78, 85, 82, 88, 84, 90, 86, 83, 89],
  });

  // Trust signal simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTrustSignal(p => p >= 100 ? 100 : Math.min(p + Math.floor(Math.random() * 6) + 2, 100));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  // CPU telemetry simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuHistory(prev => {
        const tick = (arr: number[], base: number) => {
          const n = Math.max(10, Math.min(100, base + Math.floor(Math.random() * 16) - 8));
          return [...arr.slice(-9), n];
        };
        return {
          prod01: tick(prev.prod01, 48),
          gateway: tick(prev.gateway, 85),
        };
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Escape key to close drawer
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedProject(null);
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const nodes: ProjectNode[] = [
    { name: 'SafeKrypte Lite', type: 'ED25519 SIGNING', status: 'ACTIVE',
      description: 'Free-tier ED25519 signing service for first 1000 creators. POST /commons/v1/sign — content_hash + creator_id → signed attestation + timestamp.',
      metricLabel: 'Free Tier Remaining', metricValue: '1000 CREATORS' },
    { name: 'SafeLiner Lite', type: 'CREDENTIAL ISSUANCE', status: 'ACTIVE',
      description: 'Free-tier credential issuance with QR verification. POST /commons/v1/issue — holder verification + credential type → verifiable credential.',
      metricLabel: 'Credentials Issued', metricValue: '0 / 1000 FREE' },
    { name: 'VVU Operatus', type: 'MICROKERNEL RUNTIME', status: 'ACTIVE',
      description: 'Headless microkernel running SafeLiner + SafeKrypte operators with Round-Robin and Priority-Preemptive scheduling.',
      metricLabel: 'Kernel Operators', metricValue: '4 ONLINE' },
    { name: 'Lindiwe Agent Kernel', type: 'INTERNAL INTELLIGENCE', status: 'ACTIVE',
      description: 'Localized model framework evaluating internal operations, compliance parameters, and audit assertions via WhatsApp transport.',
      metricLabel: 'Agent Cluster Pulse Rate', metricValue: '42ms LATENCY' },
    { name: 'Ubuntu Pools', type: 'ROSCA / STOKVEL', status: 'PILOT',
      description: 'Decentralized mutual financial pooling structures configured around regional community affinity parameters.',
      metricLabel: 'Active Pool Containers', metricValue: '12 Pools Locked' },
    { name: 'ProofBridge Liner', type: 'ZK / COMPLIANCE', status: 'PILOT',
      description: 'Zero-knowledge circuit generation validation array running isolated compliance computations.',
      metricLabel: 'Release Pipeline Countdown', metricValue: 'T-34 DAYS' },
    { name: 'SafeGrid', type: 'WATER / NMBM', status: 'DEV',
      description: 'Utility access network integration infrastructure mapping live Nelson Mandela Bay Municipality.',
      metricLabel: 'Telemetry Sensor Array', metricValue: '98.4% STABLE' },
    { name: 'Ekasi', type: 'UBUNTU GAMES / RPG', status: 'PRE-PROD',
      description: 'Hyper-localized gamified learning state machine utilizing decentralized token rewards.',
      metricLabel: 'Build Environment Matrix', metricValue: 'v0.9.8-BETA' },
  ];

  const navItems = [
    { id: 'deck' as ViewTab, label: '🚨 OPERATIONAL DECK' },
    { id: 'terminal' as ViewTab, label: '🤖 AGENT TERMINAL' },
    { id: 'infra' as ViewTab, label: '⚙️ INFRASTRUCTURE' },
    { id: 'globe' as ViewTab, label: '🌐 TELEMETRY GLOBE' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: C.void, color: C.text,
      fontFamily: '"DM Sans","IBM Plex Mono",monospace,sans-serif',
      fontSize: '0.75rem', display: 'flex', overflow: 'hidden',
    }}>
      {/* ─── GLOBAL STYLES ──────────────────────────────── */}
      <style jsx global>{`
        body > aside { display: none !important; }
        body > main { margin: 0 !important; }
        .vvu-scrollbar::-webkit-scrollbar { width: 3px; }
        .vvu-scrollbar::-webkit-scrollbar-track { background: ${C.void}; }
        .vvu-scrollbar::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .vvu-scrollbar::-webkit-scrollbar-thumb:hover { background: ${C.gold}; }
        @keyframes vvuGlowPulse {
          0%, 100% { box-shadow: ${C.goldGlow}; }
          50% { box-shadow: 0 0 24px rgba(200,168,74,0.4); }
        }
        @keyframes vvuScanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 9999,
        background: `linear-gradient(to bottom,transparent,transparent 50%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.15))`,
        backgroundSize: '100% 4px', opacity: 0.12,
      }} />

      {/* ─── SIDEBAR ────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 56 }}
        style={{
          height: '100vh', background: `${C.surface}`,
          borderRight: `1px solid ${C.border}`,
          padding: '16px 12px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', flexShrink: 0, zIndex: 40,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar top */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brand */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', height: '48px',
          }}>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontWeight: 800, letterSpacing: '0.15em', color: C.gold, fontSize: '0.8rem' }}
                >
                  VVU·BRAIN
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: '4px', border: `1px solid ${C.border}`, borderRadius: '4px',
                background: 'transparent', color: C.textSecondary, cursor: 'pointer',
                fontSize: '0.65rem', flexShrink: 0,
              }}
            >{sidebarOpen ? '◀' : '▶'}</button>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const sel = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    padding: '10px 10px', border: 'none', borderRadius: '6px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem',
                    fontWeight: sel ? 700 : 400,
                    background: sel ? `${C.cyan}15` : 'transparent',
                    color: sel ? C.cyan : C.textSecondary,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block', maxWidth: sidebarOpen ? '180px' : '28px',
                  }}>
                    {sidebarOpen ? item.label : item.id === 'globe' ? '🌐' :
                     item.id === 'infra' ? '⚙️' : item.id === 'terminal' ? '🤖' : '🚨'}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar bottom */}
        <div style={{
          borderTop: `1px solid ${C.border}`, paddingTop: '12px',
          fontSize: '0.5rem', color: C.textMuted, fontFamily: '"IBM Plex Mono",monospace',
        }}>
          {sidebarOpen ? 'Gate Target: 2026-07-30' : '2026'}
        </div>
      </motion.aside>

      {/* ─── MAIN CONTENT ───────────────────────────────── */}
      <div className="vvu-scrollbar" style={{
        flex: 1, height: '100vh', overflowY: 'auto',
        padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px',
        background: `radial-gradient(ellipse at 30% 0%, ${C.surface} 0%, ${C.void} 70%)`,
      }}>
        {/* ═══ HEADER ══════════════════════════════════════ */}
        <header style={{
          border: `1px solid ${C.border}`, background: `${C.surface}80`,
          backdropFilter: 'blur(8px)', padding: '20px 24px', borderRadius: '12px',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${C.gold}, ${C.cyan}, transparent)`,
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: C.cyan, boxShadow: `0 0 12px ${C.cyan}`,
                animation: 'pulse 2s infinite',
              }} />
              <h1 style={{
                fontFamily: '"Syne",sans-serif', fontWeight: 800, fontSize: '1.3rem',
                letterSpacing: '0.05em', color: '#fff', margin: 0,
              }}>
                VENTURE VISION UBUNTU
              </h1>
              <span style={{
                fontSize: '0.5rem', fontFamily: '"IBM Plex Mono",monospace',
                color: C.gold, background: `${C.gold}18`,
                border: `1px solid ${C.gold}44`, padding: '2px 10px',
                borderRadius: '20px', letterSpacing: '0.1em',
               }}>v2.1-ORCHESTRATOR</span>
            </div>
            <p style={{
              fontSize: '0.65rem', color: C.textSecondary,
              marginTop: '6px', fontFamily: '"DM Sans",sans-serif',
            }}>
              Gqeberha, Eastern Cape · Workspace Command Suite
              <span style={{ display: 'block', color: C.gold, fontStyle: 'italic', marginTop: '2px' }}>
                &ldquo;Umuntu ngumuntu ngabantu&rdquo;
              </span>
            </p>
          </div>

          {/* Trust signal */}
          <div style={{
            width: '240px', background: `${C.void}CC`, border: `1px solid ${C.border}`,
            padding: '10px 14px', borderRadius: '8px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em',
              fontFamily: '"IBM Plex Mono",monospace', marginBottom: '6px',
            }}>
              <span style={{ color: C.textMuted }}>TRUST SIGNAL RESOLUTION</span>
              <span style={{ color: trustSignal === 100 ? C.emerald : C.cyan }}>
                {trustSignal}%
              </span>
            </div>
            <div style={{
              height: '4px', background: C.card, borderRadius: '4px', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <motion.div
                animate={{ width: `${trustSignal}%` }}
                transition={{ type: 'spring', stiffness: 40 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${C.gold}, ${C.cyan}, ${C.emerald})`,
                  boxShadow: `0 0 10px ${C.cyan}66`,
                }}
              />
            </div>
          </div>
        </header>

        {/* ═══ TAB: DECK ══════════════════════════════════ */}
        {activeTab === 'deck' && (
          <>
            <AntonyTrack />
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}>
              {nodes.map((node) => (
                <motion.div
                  key={node.name}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedProject(node)}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: '10px',
                    padding: '16px 18px', cursor: 'pointer', display: 'flex',
                    flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
                    background: `${C.surface}60`, transition: 'all 0.25s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.gold;
                    e.currentTarget.style.background = `${C.surface}CC`;
                    e.currentTarget.style.boxShadow = `0 0 20px ${C.gold}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = `${C.surface}60`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Corner crosshair */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '8px', height: '8px',
                    borderTop: `1.5px solid ${C.gold}66`,
                    borderRight: `1.5px solid ${C.gold}66`,
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.55rem', color: C.textMuted, fontWeight: 700,
                        letterSpacing: '0.1em', fontFamily: '"IBM Plex Mono",monospace',
                      }}>
                        {node.type}
                      </span>
                      <span style={{
                        fontSize: '0.45rem', padding: '2px 8px', borderRadius: '10px',
                        fontWeight: 800, letterSpacing: '0.08em', border: '1px solid',
                        fontFamily: '"IBM Plex Mono",monospace',
                        ...(node.status === 'ACTIVE' ? {
                          background: `${C.emerald}22`, color: C.emerald, borderColor: `${C.emerald}66`,
                        } : node.status === 'PILOT' ? {
                          background: `${C.cyan}22`, color: C.cyan, borderColor: `${C.cyan}66`,
                        } : node.status === 'PRE-PROD' ? {
                          background: `${C.gold}22`, color: C.gold, borderColor: `${C.gold}66`,
                        } : {
                          background: `${C.crimson}22`, color: '#C4254F', borderColor: `${C.crimson}66`,
                        }),
                      }}>
                        {node.status}
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: '0.95rem',
                      color: '#fff', margin: 0,
                    }}>
                      ⬡ {node.name}
                    </h3>
                    <p style={{
                      fontSize: '0.65rem', color: C.textSecondary,
                      lineHeight: '1.5', fontFamily: '"DM Sans",sans-serif',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', margin: 0,
                    }}>
                      {node.description}
                    </p>
                  </div>
                  <div style={{
                    borderTop: `1px solid ${C.border}`, paddingTop: '10px',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.55rem', fontFamily: '"IBM Plex Mono",monospace',
                  }}>
                    <span style={{ color: C.textMuted }}>{node.metricLabel}:</span>
                    <span style={{ color: C.gold, fontWeight: 700 }}>{node.metricValue}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ═══ TAB: TERMINAL ══════════════════════════════ */}
        {activeTab === 'terminal' && <AgentChat />}

        {/* ═══ TAB: INFRASTRUCTURE ═════════════════════─── */}
        {activeTab === 'infra' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AntonyTrack />
            <div style={{
              border: `1px solid ${C.border}`, borderRadius: '10px',
              background: `${C.surface}60`, padding: '18px',
            }}>
              <h3 style={{
                fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: '0.85rem',
                color: '#fff', margin: '0 0 16px', letterSpacing: '0.03em',
              }}>■ Compute Pool Telemetry</h3>
              {Object.keys(cpuHistory).map(key => {
                const data = cpuHistory[key];
                const load = data[data.length - 1];
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
                    gap: '16px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700, fontSize: '0.65rem', color: '#fff' }}>
                        {key === 'prod01' ? 'VVU-CORE-PROD-01' : 'SAFE-GATEWAY-ARRAY'}
                      </div>
                      <div style={{ fontSize: '0.5rem', color: C.textMuted, marginTop: '2px' }}>
                        Compute Pool Allocation
                      </div>
                    </div>
                    <Sparkline data={data} />
                    <div style={{
                      fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.65rem',
                      fontWeight: 700, color: load > 80 ? C.gold : C.cyan,
                      minWidth: '60px', textAlign: 'right',
                    }}>
                      {load}% LOAD
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              border: `1px solid ${C.border}`, borderRadius: '10px',
              background: `${C.surface}60`, padding: '18px', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px',
            }}>
              {nodes.map(n => (
                <div key={n.name} style={{
                  padding: '12px', border: `1px solid ${C.border}`, borderRadius: '8px',
                  background: C.card,
                }}>
                  <div style={{ fontSize: '0.5rem', color: C.textMuted, marginBottom: '4px' }}>
                    {n.type}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                    {n.name}
                  </div>
                  <div style={{
                    fontSize: '0.5rem', color: C.gold, fontFamily: '"IBM Plex Mono",monospace',
                    marginTop: '4px',
                  }}>
                    {n.metricValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB: TELEMETRY GLOBE ═════════════════════── */}
        {activeTab === 'globe' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
            padding: '24px 0',
          }}>
            <div style={{
              border: `1px solid ${C.border}`, borderRadius: '16px',
              background: `${C.surface}60`, padding: '32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <TelemetryGlobe />
            </div>

            <AntonyTrack className="w-full max-w-2xl" />

            <div style={{
              border: `1px solid ${C.border}`, borderRadius: '10px',
              background: `${C.surface}60`, padding: '20px', width: '100%',
              maxWidth: '640px',
            }}>
              <h3 style={{
                fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: '0.8rem',
                color: C.gold, margin: '0 0 12px',
              }}>■ Network Quorum Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {nodes.map(n => (
                  <div key={n.name} style={{
                    padding: '10px 12px', border: `1px solid ${C.border}`,
                    borderRadius: '6px', background: C.card,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', color: '#fff' }}>
                      {n.name}
                    </span>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: n.status === 'ACTIVE' ? C.emerald :
                                  n.status === 'PILOT' ? C.cyan :
                                  n.status === 'PRE-PROD' ? C.gold : C.crimson,
                      boxShadow: `0 0 8px ${n.status === 'ACTIVE' ? C.emerald :
                        n.status === 'PILOT' ? C.cyan :
                        n.status === 'PRE-PROD' ? C.gold : C.crimson}88`,
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══════════════════════════════════ */}
        <footer style={{
          border: `1px solid ${C.border}`, borderRadius: '8px',
          background: `${C.void}CC`, padding: '12px 18px',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: '12px',
          fontSize: '0.55rem', fontFamily: '"IBM Plex Mono",monospace', color: C.textMuted,
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>NETWORK: <span style={{ color: C.emerald, fontWeight: 700 }}>ACTIVE</span></span>
            <span style={{ color: C.border }}>|</span>
            <span>CONSOLE: <span style={{ color: C.cyan, fontWeight: 700 }}>STABLE</span></span>
          </div>
          <span>&copy; 2026 Vaguely Vanity LLC (CIPC 2026/259053/07)</span>
        </footer>
      </div>

      {/* ─── DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              style={{
                position: 'fixed', right: 0, top: 0, height: '100vh',
                width: '320px', background: C.surface, borderLeft: `1px solid ${C.border}`,
                padding: '24px', zIndex: 51, display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Close button */}
                <button onClick={() => setSelectedProject(null)}
                  style={{
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: C.textSecondary, padding: '6px 12px', borderRadius: '4px',
                    cursor: 'pointer', fontFamily: '"IBM Plex Mono",monospace',
                    fontSize: '0.55rem',
                  }}
                >ESC · CLOSE</button>

                {/* Drawer content */}
                <div style={{ marginTop: '24px' }}>
                  <span style={{
                    fontSize: '0.5rem', color: C.textMuted, fontFamily: '"IBM Plex Mono",monospace',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {selectedProject.type}
                  </span>
                  <h2 style={{
                    fontFamily: '"Syne",sans-serif', fontWeight: 800, fontSize: '1.2rem',
                    color: '#fff', margin: '8px 0 4px',
                  }}>
                    ⬡ {selectedProject.name}
                  </h2>
                  <p style={{ fontSize: '0.65rem', color: C.textSecondary, lineHeight: '1.6' }}>
                    {selectedProject.description}
                  </p>
                </div>

                {/* Metrics */}
                <div style={{
                  marginTop: '20px', borderTop: `1px solid ${C.border}`,
                  paddingTop: '16px',
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      padding: '10px', border: `1px solid ${C.border}`,
                      borderRadius: '6px', background: C.card,
                    }}>
                      <div style={{ fontSize: '0.5rem', color: C.textMuted, marginBottom: '2px' }}>
                        {selectedProject.metricLabel}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.gold }}>
                        {selectedProject.metricValue}
                      </div>
                    </div>
                    <div style={{
                      padding: '10px', border: `1px solid ${C.border}`,
                      borderRadius: '6px', background: C.card,
                    }}>
                      <div style={{ fontSize: '0.5rem', color: C.textMuted, marginBottom: '2px' }}>
                        STATUS
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.cyan }}>
                        {selectedProject.status}
                      </div>
                    </div>
                  </div>
                  <button style={{
                    width: '100%', background: `${C.gold}22`, border: `1px solid ${C.gold}66`,
                    color: C.gold, padding: '10px', borderRadius: '6px',
                    fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.65rem',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    letterSpacing: '0.05em',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${C.gold}22`; }}
                  >
                    DISPATCH COMPLIANCE MINT
                  </button>
                </div>
              </div>

              {/* Antony mascot in drawer */}
              <div style={{
                borderTop: `1px solid ${C.border}`, paddingTop: '12px',
                fontSize: '0.5rem', color: C.textMuted, fontFamily: '"IBM Plex Mono",monospace',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>🐜</span>
                <span>Antony Queued · {Math.floor(Math.random() * 12) + 3} pending</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
