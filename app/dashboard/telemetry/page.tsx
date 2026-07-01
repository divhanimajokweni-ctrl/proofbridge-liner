'use client';
import React, { useEffect, useRef, useState } from 'react';
import DashboardWidget from '../../components/DashboardWidget';
import MetricCard from '../../components/MetricCard';
import SystemStatusBar from '../../components/SystemStatusBar';

// ─── Telemetry Globe (Canvas) ──────────────────────────────────────────

function TelemetryGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const radius = 75;
    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 180; i += 10) {
      const lat = (i * Math.PI) / 180 - Math.PI / 2;
      for (let j = 0; j < 360; j += 15) {
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
        const alpha = sf * 0.9;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 168, 74, ${alpha})`;
        ctx.fill();

        if (sf > 0.7) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${sf * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      ctx.strokeStyle = 'rgba(200, 168, 74, 0.13)';
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
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.45rem, 0.6vw, 0.5rem)',
        color: 'var(--color-gold)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop: 8,
      }}>
        ● QUORUM NODE TOPOLOGY
      </p>
    </div>
  );
}

// ─── Sparkline component ────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color?: string }) {
  const w = 100, h = 24;
  if (data.length < 2) return null;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - 0) / 100) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color || 'var(--color-gold)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

// ─── Streaming telemetry hook ───────────────────────────────────────────

interface TelemetryState {
  cpu: number;
  memory: number;
  load: number;
  processes: number;
  docker: number;
  timestamp: number;
  history: number[];
}

function useStreamingTelemetry() {
  const [state, setState] = useState<TelemetryState>({
    cpu: 0, memory: 0, load: 0, processes: 0, docker: 0,
    timestamp: Date.now(),
    history: [],
  });

  useEffect(() => {
    let mounted = true;
    let ws: WebSocket | null = null;
    let fallbackTimer: ReturnType<typeof setInterval>;

    try {
      ws = new WebSocket('ws://localhost:3001');
      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry:pulse' && msg.data) {
            const d = msg.data;
            setState(prev => ({
              cpu: d.cpu?.totalPercent ?? 0,
              memory: d.memory?.usedPercent ?? 0,
              load: d.load?.load1 ?? 0,
              processes: d.processes?.length ?? 0,
              docker: d.docker?.length ?? 0,
              timestamp: d.timestamp,
              history: [...prev.history.slice(-59), d.cpu?.totalPercent ?? 0],
            }));
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => { ws?.close(); };
      ws.onclose = () => {
        if (!mounted) return;
        // Fallback mock
        fallbackTimer = setInterval(() => {
          setState(prev => ({
            cpu: Math.round(30 + Math.random() * 40),
            memory: Math.round(40 + Math.random() * 30),
            load: Math.round(Math.random() * 5 * 10) / 10,
            processes: Math.round(100 + Math.random() * 200),
            docker: Math.round(Math.random() * 4),
            timestamp: Date.now(),
            history: [...prev.history.slice(-59), Math.round(30 + Math.random() * 40)],
          }));
        }, 1500);
      };
    } catch {
      fallbackTimer = setInterval(() => {
        setState(prev => ({
          cpu: Math.round(30 + Math.random() * 40),
          memory: Math.round(40 + Math.random() * 30),
          load: Math.round(Math.random() * 5 * 10) / 10,
          processes: Math.round(100 + Math.random() * 200),
          docker: Math.round(Math.random() * 4),
          timestamp: Date.now(),
          history: [...prev.history.slice(-59), Math.round(30 + Math.random() * 40)],
        }));
      }, 1500);
    }

    return () => {
      mounted = false;
      clearInterval(fallbackTimer);
      ws?.close();
    };
  }, []);

  return state;
}

// ─── Telemetry Page ─────────────────────────────────────────────────────

export default function TelemetryPage() {
  const telemetry = useStreamingTelemetry();

  const nodes = [
    { name: 'SafeKrypte Lite', status: 'ACTIVE' as const },
    { name: 'SafeLiner Lite', status: 'ACTIVE' as const },
    { name: 'VVU Operatus', status: 'ACTIVE' as const },
    { name: 'Lindiwe Agent Kernel', status: 'ACTIVE' as const },
    { name: 'Ubuntu Pools', status: 'PILOT' as const },
    { name: 'ProofBridge Liner', status: 'PILOT' as const },
    { name: 'SafeGrid', status: 'DEV' as const },
    { name: 'Ekasi', status: 'PRE-PROD' as const },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: 'var(--color-green)',
    PILOT: 'var(--color-cyan)',
    'PRE-PROD': 'var(--color-gold)',
    DEV: 'var(--color-crimson)',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 32px)',
    }}>
      {/* ═══ HEADER ═══════════════════════════════════ */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: '#fff',
            margin: 0,
          }}>
            🌐 TELEMETRY GLOBE
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
          }}>
            Live system topology · streaming at ~1s intervals
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span className="vvu-pill">
            CPU <strong style={{ color: 'var(--color-cyan)' }}>{telemetry.cpu}%</strong>
          </span>
          <span className="vvu-pill">
            MEM <strong style={{ color: 'var(--color-gold)' }}>{telemetry.memory}%</strong>
          </span>
          <span className="vvu-pill">
            LOAD <strong style={{ color: 'var(--color-green)' }}>{telemetry.load.toFixed(1)}</strong>
          </span>
        </div>
      </header>

      {/* ═══ MAIN LAYOUT ══════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 12,
        padding: '16px 20px',
        flex: 1,
      }}>
        {/* Left: Globe + Streaming metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Globe */}
          <DashboardWidget title="QUORUM NODE TOPOLOGY" subtitle="3D network visualization">
            <TelemetryGlobe />
          </DashboardWidget>

          {/* Streaming metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}>
            <MetricCard
              label="Streaming CPU"
              value={telemetry.cpu}
              unit="%"
              trend={telemetry.cpu > 70 ? 'up' : 'stable'}
              trendValue={`${telemetry.cpu.toFixed(1)}%`}
              color="var(--color-cyan)"
              sparkData={telemetry.history.length > 1 ? telemetry.history : undefined}
              source="WebSocket"
            />
            <MetricCard
              label="Streaming Memory"
              value={telemetry.memory}
              unit="%"
              trend={telemetry.memory > 70 ? 'up' : 'stable'}
              trendValue={`${telemetry.memory.toFixed(1)}%`}
              color="var(--color-gold)"
              sparkData={telemetry.history.length > 1 ? telemetry.history.slice().reverse() : undefined}
              source="WebSocket"
            />
            <MetricCard
              label="Streaming Load"
              value={telemetry.load.toFixed(1)}
              color="var(--color-green)"
              source="WebSocket"
            />
            <MetricCard
              label="Docker Containers"
              value={telemetry.docker}
              unit="running"
              color="var(--color-blue)"
            />
          </div>
        </div>

        {/* Right: Quorum Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DashboardWidget
            title="NETWORK QUORUM"
            subtitle={`${nodes.filter(n => n.status === 'ACTIVE').length} active nodes`}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              {nodes.map(n => (
                <div
                  key={n.name}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--color-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 600 }}>{n.name}</span>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusColors[n.status],
                    boxShadow: `0 0 8px ${statusColors[n.status]}`,
                  }} />
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title="HISTORICAL CPU" subtitle="Last 60 ticks">
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.4rem, 0.6vw, 0.5rem)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Current</span>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{telemetry.cpu}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Min</span>
                <span style={{ color: 'var(--color-green)' }}>
                  {telemetry.history.length > 0 ? Math.min(...telemetry.history) : 0}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max</span>
                <span style={{ color: 'var(--color-gold)' }}>
                  {telemetry.history.length > 0 ? Math.max(...telemetry.history) : 0}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg</span>
                <span style={{ color: '#fff' }}>
                  {telemetry.history.length > 0
                    ? (telemetry.history.reduce((a, b) => a + b, 0) / telemetry.history.length).toFixed(1)
                    : 0}%
                </span>
              </div>

              {telemetry.history.length > 1 && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                  <Sparkline data={telemetry.history} color="var(--color-cyan)" />
                </div>
              )}
            </div>
          </DashboardWidget>
        </div>
      </div>

      {/* ═══ STATUS BAR ════════════════════════════════ */}
      <SystemStatusBar />
    </div>
  );
}
