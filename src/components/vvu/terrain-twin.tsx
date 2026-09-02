'use client';

import { useEffect, useMemo, useState } from 'react';

// SVG-based 3D wireframe terrain — the Gqeberha digital twin hero.
// No Three.js dependency (keeps the bundle light, matches the "clean minimal
// viewport" regression criterion). Renders an isometric grid that subtly
// breathes; click any node pin to dispatch a leak simulation.
//
// BUGFIX (R2): decorative elements (glow ellipse, grid lines, ridge, pipe
// segments, radar sweep) now carry `pointerEvents: 'none'` so they never
// intercept clicks meant for the node-pin hit targets. Each pin also has an
// invisible 16px-radius hit circle to make touch/click reliable.

interface TerrainTwinProps {
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  thermalThrottle: boolean;
  failClosed: boolean;
}

interface Pin {
  id: string;
  label: string;
  gx: number;
  gy: number;
  gz: number;
}

const PINS: Pin[] = [
  { id: 'inlet', label: 'Inlet Meter Pod', gx: -2.4, gy: -1.6, gz: 0.62 },
  { id: 'outlet', label: 'Outlet Meter Pod', gx: 2.4, gy: 1.6, gz: 0.6 },
  { id: 'pipe', label: 'Pressure Pipe', gx: 0, gy: 0, gz: 0.48 },
  { id: 'cabinet', label: 'Edge Cabinet', gx: 0.4, gy: -2.2, gz: 0.32 },
  { id: 'battery', label: 'Power Backup', gx: -0.4, gy: 2.2, gz: 0.3 },
  { id: 'mast', label: 'Telemetry Mast', gx: -2.6, gy: 0.6, gz: 0.92 },
  { id: 'beacon', label: 'Top Beacon', gx: 2.6, gy: -0.6, gz: 0.98 },
  { id: 'skidN', label: 'N Datum Skid', gx: 0.2, gy: -2.6, gz: 0.12 },
  { id: 'skidS', label: 'S Datum Skid', gx: -0.2, gy: 2.6, gz: 0.12 },
];

function iso(gx: number, gy: number, gz: number, cx: number, cy: number, t: number) {
  const tileW = 46;
  const tileH = 23;
  const elev = gz * 60;
  const sx = cx + (gx - gy) * tileW;
  const sy = cy + (gx + gy) * tileH - elev + Math.sin(t / 2200 + gx * 0.6) * 1.5;
  return { x: sx, y: sy };
}

export function TerrainTwin({ activeNodeId, onNodeClick, thermalThrottle, failClosed }: TerrainTwinProps) {
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setT(Date.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const W = 760;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2 + 30;

  const grid = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; depth: number }[] = [];
    const N = 3;
    for (let i = -N; i <= N; i++) {
      for (let j = -N; j < N; j++) {
        const a = iso(i, j, 0, cx, cy, t);
        const b = iso(i, j + 1, 0, cx, cy, t);
        lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, depth: i + j });
      }
    }
    for (let j = -N; j <= N; j++) {
      for (let i = -N; i < N; i++) {
        const a = iso(i, j, 0, cx, cy, t);
        const b = iso(i + 1, j, 0, cx, cy, t);
        lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, depth: i + j });
      }
    }
    return lines;
  }, [cx, cy, t]);

  const ridge = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = -3; i <= 3; i += 0.5) {
      const gz = 0.25 + Math.exp(-((i - 0.4) ** 2) / 2.2) * 0.5;
      pts.push(iso(i, -i * 0.4, gz, cx, cy, t));
    }
    return pts;
  }, [cx, cy, t]);

  // Color theme shifts with FSM state — green nominal, amber throttle, red fail.
  const gridStroke = failClosed
    ? 'rgba(176, 42, 42, 0.5)'
    : thermalThrottle
      ? 'rgba(196, 109, 26, 0.42)'
      : 'rgba(107, 138, 64, 0.32)';
  const accent = failClosed ? '#B02A2A' : thermalThrottle ? '#C46D1A' : '#6B8A40';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '760 / 460',
        maxHeight: '48vh',
        background:
          'radial-gradient(ellipse at 50% 38%, rgba(107,138,64,0.06) 0%, rgba(15,20,16,0) 60%), linear-gradient(180deg, #0A0E0B 0%, #060806 100%)',
        borderRadius: 14,
        border: `1px solid ${accent}33`,
        overflow: 'hidden',
        transition: 'border-color 240ms ease',
      }}
    >
      {/* Radar sweep — pointer-events:none so it never blocks pins */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          width: 2,
          height: '42%',
          transformOrigin: 'top center',
          background: 'linear-gradient(180deg, rgba(243,227,138,0) 0%, rgba(243,227,138,0.18) 100%)',
          animation: 'vvuRadar 6s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', position: 'relative', zIndex: 2 }}
      >
        <defs>
          <radialGradient id="vvuGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={failClosed ? 'rgba(176,42,42,0.16)' : thermalThrottle ? 'rgba(196,109,26,0.16)' : 'rgba(107,138,64,0.18)'} />
            <stop offset="100%" stopColor="rgba(107,138,64,0)" />
          </radialGradient>
          <linearGradient id="vvuRidge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(196,109,26,0)" />
            <stop offset="50%" stopColor={failClosed ? 'rgba(176,42,42,0.6)' : 'rgba(196,109,26,0.55)'} />
            <stop offset="100%" stopColor="rgba(196,109,26,0)" />
          </linearGradient>
        </defs>

        {/* Decorative glow — pointer-events:none */}
        <ellipse cx={cx} cy={cy - 10} rx={300} ry={150} fill="url(#vvuGlow)" style={{ pointerEvents: 'none' }} />

        {/* Wireframe grid — pointer-events:none */}
        <g stroke={gridStroke} strokeWidth={0.7} fill="none" style={{ pointerEvents: 'none' }}>
          {grid.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              opacity={0.4 + Math.max(0, l.depth + 6) / 12}
            />
          ))}
        </g>

        {/* Elevation ridge — pointer-events:none */}
        <polyline
          points={ridge.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="url(#vvuRidge)"
          strokeWidth={1.4}
          style={{ pointerEvents: 'none' }}
        />

        {/* Pipe segment connecting inlet → cabinet → outlet — pointer-events:none */}
        <g style={{ pointerEvents: 'none' }}>
          {(() => {
            const a = iso(PINS[0].gx, PINS[0].gy, PINS[0].gz, cx, cy, t);
            const b = iso(PINS[3].gx, PINS[3].gy, PINS[3].gz, cx, cy, t);
            const c = iso(PINS[1].gx, PINS[1].gy, PINS[1].gz, cx, cy, t);
            return (
              <>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6B8A40" strokeWidth={2} opacity={0.7} />
                <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="#6B8A40" strokeWidth={2} opacity={0.7} />
                {activeNodeId && (
                  <>
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={14}
                      fill="none"
                      stroke="#C46D1A"
                      strokeWidth={1.5}
                      opacity={0.7}
                    >
                      <animate attributeName="r" from="10" to="28" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={8}
                      fill="rgba(196,109,26,0.25)"
                      stroke="#C46D1A"
                      strokeWidth={1}
                    >
                      <animate attributeName="opacity" from="0.6" to="0.1" dur="1s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </>
            );
          })()}
        </g>

        {/* Node pins — these are the ONLY clickable elements.
            Each pin has an invisible 16px hit circle for reliable clicks. */}
        {PINS.map((p) => {
          const pos = iso(p.gx, p.gy, p.gz, cx, cy, t);
          const active = activeNodeId === p.id;
          const color = active ? '#C46D1A' : p.gz > 0.7 ? '#F3E38A' : '#9DB36B';
          return (
            <g
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(p.id);
              }}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${p.label}${active ? ' (active — click to clear)' : ' (click to simulate leak)'}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNodeClick(p.id);
                }
              }}
            >
              {/* Invisible hit target — large, reliable click area */}
              <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.x}
                y2={pos.y - 22}
                stroke={color}
                strokeWidth={1}
                opacity={0.55}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={active ? 6 : 4}
                fill={color}
                opacity={active ? 1 : 0.85}
                style={{ filter: active ? `drop-shadow(0 0 4px ${color})` : 'none' }}
              >
                {active && (
                  <animate attributeName="r" from="4" to="9" dur="1s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx={pos.x} cy={pos.y} r={2} fill="#0A0E0B" />
              <text
                x={pos.x + 8}
                y={pos.y - 18}
                fill={active ? '#FFFAC2' : '#8B9A7B'}
                fontSize={9}
                fontFamily="var(--font-geist-mono), monospace"
                opacity={active ? 1 : 0.7}
                style={{ pointerEvents: 'none' }}
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* HUD corners — pointer-events:none */}
        <g fontFamily="var(--font-geist-mono), monospace" fontSize={9} fill={accent} style={{ pointerEvents: 'none' }}>
          <text x={16} y={22}>GQEBERHA · HUMEWOOD TEST GROUNDS</text>
          <text x={16} y={36} fill="#8B9A7B">33.9608°S · 25.6022°E · ENU mm</text>
          <text x={W - 16} y={22} textAnchor="end" fill={accent}>
            DFA · {failClosed ? 'FAIL_CLOSED_LOCKDOWN' : thermalThrottle ? 'THERMAL_THROTTLE' : 'STEADY_STATE_LOCKED'}
          </text>
          <text x={W - 16} y={36} textAnchor="end" fill="#8B9A7B">
            {failClosed ? '⚠ HARDWARE DISCONNECT' : thermalThrottle ? 'VERTEX DECIMATION 62.5%' : 'MESH DENSITY · NOMINAL'}
          </text>
        </g>

        {/* Crosshair reticle — pointer-events:none, only shows when a node is active */}
        {activeNodeId && (
          <g style={{ pointerEvents: 'none' }} opacity={0.4}>
            <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={accent} strokeWidth={0.5} strokeDasharray="3 6" />
            <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke={accent} strokeWidth={0.5} strokeDasharray="3 6" />
          </g>
        )}
      </svg>

      <style>{`
        @keyframes vvuRadar {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
