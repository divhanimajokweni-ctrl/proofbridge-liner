'use client';

import { useEffect, useRef, useState } from 'react';

// Leak-rate radial gauge — appears when a node is active (leak simulation).
// Shows the simulated leak rate (L/min) as an animated SVG arc gauge with
// a needle, tick marks, and a digital readout. Disappears when the leak clears.

interface LeakGaugeProps {
  activeNodeId: string | null;
  leakActive: boolean; // true when FSM is in LEAK_SIMULATION_ACTIVE
  flowRate: number; // L/s — drives the leak rate estimate
  pressureHead: number; // m — drives the leak severity
}

export function LeakGauge({ activeNodeId, leakActive, flowRate, pressureHead }: LeakGaugeProps) {
  const [leakRate, setLeakRate] = useState(0);
  // The gauge shows when either a specific node is active OR the FSM is in
  // LEAK_SIMULATION_ACTIVE (e.g. via the thermal-recovery path).
  const active = leakActive || !!activeNodeId;
  const label = activeNodeId ?? 'pipe';
  // Ref to avoid re-creating the interval when pressureHead changes every frame.
  const pressureHeadRef = useRef(pressureHead);
  useEffect(() => {
    pressureHeadRef.current = pressureHead;
  }, [pressureHead]);

  // Estimated leak rate (L/min) — FAVAD-style: Q ∝ √(pressureHead) × orifice.
  // We use a nominal orifice coefficient of 0.6 and a simulated hole area
  // that scales with the active node's stress.
  useEffect(() => {
    if (!active) {
      // Defer the reset to avoid calling setState synchronously in the effect body.
      const reset = setTimeout(() => {
        setLeakRate(0);
      }, 0);
      return () => clearTimeout(reset);
    }
    const compute = () => {
      // Q = Cd × A × √(2 × g × h) → m³/s, × 1000 → L/s, × 60 → L/min
      const Cd = 0.6;
      const area = 0.0008 + Math.random() * 0.0004; // ~8-12 mm² hole
      const g = 9.81;
      const h = Math.max(1, pressureHeadRef.current);
      const qLps = Cd * area * Math.sqrt(2 * g * h) * 1000; // L/s
      const qLpm = qLps * 60;
      setLeakRate(Math.round(qLpm * 10) / 10);
    };
    // Fire immediately so the gauge shows a non-zero value right away.
    compute();
    const interval = setInterval(compute, 500);
    return () => clearInterval(interval);
  }, [active]);

  // Use leakRate directly for the displayed value. The needle animation is
  // handled by the SVG <animate> on the arc path, so no JS smoothing needed.
  const displayedRate = leakRate;

  if (!active) {
    return null;
  }

  // Gauge geometry — 180° sweep from -90° (left) to +90° (right)
  const W = 200;
  const H = 140;
  const cx = W / 2;
  const cy = H - 20;
  const r = 70;
  const maxRate = 50; // L/min max scale
  const angle = -90 + (Math.min(displayedRate, maxRate) / maxRate) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + Math.cos(rad - Math.PI / 2) * (r - 8);
  const needleY = cy + Math.sin(rad - Math.PI / 2) * (r - 8);

  // Arc path (background)
  const arcStart = { x: cx - r, y: cy };
  const arcEnd = { x: cx + r, y: cy };
  const arcBg = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;

  // Filled arc (value)
  const valueAngle = Math.min(displayedRate, maxRate) / maxRate;
  const filledEndX = cx + Math.cos(((-90 + valueAngle * 180) * Math.PI) / 180 - Math.PI / 2) * r;
  const filledEndY = cy + Math.sin(((-90 + valueAngle * 180) * Math.PI) / 180 - Math.PI / 2) * r;
  const arcFilled = `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${filledEndX} ${filledEndY}`;

  const severity = displayedRate < 15 ? 'low' : displayedRate < 35 ? 'med' : 'high';
  const color = severity === 'low' ? '#9DB36B' : severity === 'med' ? '#E0944A' : '#E27373';

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        background: 'rgba(10, 14, 11, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${color}55`,
        borderRadius: 12,
        padding: '0.6rem 0.7rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        animation: 'vvuGaugeIn 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.55rem',
          color,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        ⚠ Leak Rate · {label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="vvuGaugeArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9DB36B" />
            <stop offset="50%" stopColor="#E0944A" />
            <stop offset="100%" stopColor="#E27373" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path d={arcBg} fill="none" stroke="rgba(107,138,64,0.15)" strokeWidth={6} strokeLinecap="round" />

        {/* Filled arc */}
        <path d={arcFilled} fill="none" stroke="url(#vvuGaugeArc)" strokeWidth={6} strokeLinecap="round" />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const a = -90 + f * 180;
          const rd = (a * Math.PI) / 180;
          const x1 = cx + Math.cos(rd - Math.PI / 2) * (r - 2);
          const y1 = cy + Math.sin(rd - Math.PI / 2) * (r - 2);
          const x2 = cx + Math.cos(rd - Math.PI / 2) * (r + 4);
          const y2 = cy + Math.sin(rd - Math.PI / 2) * (r + 4);
          return (
            <line key={f} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(107,138,64,0.4)" strokeWidth={1} />
          );
        })}

        {/* Tick labels */}
        <text x={cx - r} y={cy + 14} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="middle">0</text>
        <text x={cx} y={cy - r - 6} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="middle">25</text>
        <text x={cx + r} y={cy + 14} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="middle">50</text>

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        <circle cx={cx} cy={cy} r={2} fill="#0A0E0B" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '1.4rem',
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {displayedRate.toFixed(1)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            color: '#8B9A7B',
          }}
        >
          L/min
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.52rem',
          color: '#5A6B4F',
          letterSpacing: '0.08em',
        }}
      >
        FAVAD · Cd=0.6 · h={pressureHead.toFixed(1)}m
      </div>
      <style>{`
        @keyframes vvuGaugeIn {
          from { opacity: 0; transform: scale(0.85) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
