'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_TENANT } from '@/lib/vvu-telemetry';

// EPANET-style live hydraulic chart — pressure head + flow rate over time.
// Two synchronized sparkline-style series rendered on a shared SVG canvas.
// Driven by the same mock sensor model as the telemetry feed (SANS-compliant).

interface DataPoint {
  t: number;
  flow: number; // L/s
  head: number; // m
  temp: number; // °C
}

interface HydraulicChartProps {
  nodeId: string;
  thermalThrottle: boolean;
}

const MAX_POINTS = 60;

export function HydraulicChart({ nodeId, thermalThrottle }: HydraulicChartProps) {
  const [points, setPoints] = useState<DataPoint[]>([]);
  const prevNodeIdRef = useRef<string>(nodeId);

  useEffect(() => {
    // Reset the series when nodeId changes — deferred via setTimeout(0) to
    // avoid calling setState synchronously inside the effect body.
    if (prevNodeIdRef.current !== nodeId) {
      prevNodeIdRef.current = nodeId;
      const reset = setTimeout(() => setPoints([]), 0);
      return () => clearTimeout(reset);
    }
  }, [nodeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const phase = now / 1000;
      const flow = 42 + Math.sin(phase / 7) * 6 + Math.random() * 2;
      const head = 38 + Math.cos(phase / 11) * 4 + Math.random() * 1.5;
      const temp = 48 + Math.sin(phase / 23) * 7 + Math.random() * 1.6;
      setPoints((cur) => [...cur, { t: now, flow, head, temp }].slice(-MAX_POINTS));
    }, 1000);
    return () => clearInterval(interval);
  }, [nodeId]);

  const W = 520;
  const H = 180;
  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Y-axis ranges
  const flowMin = 30;
  const flowMax = 55;
  const headMin = 30;
  const headMax = 46;

  const xScale = (i: number) => padL + (i / (MAX_POINTS - 1)) * plotW;
  const yFlow = (v: number) => padT + plotH - ((v - flowMin) / (flowMax - flowMin)) * plotH;
  const yHead = (v: number) => padT + plotH - ((v - headMin) / (headMax - headMin)) * plotH;

  const flowPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yFlow(p.flow).toFixed(1)}`)
    .join(' ');
  const headPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yHead(p.head).toFixed(1)}`)
    .join(' ');

  const flowArea = points.length > 1
    ? `${flowPath} L ${xScale(points.length - 1).toFixed(1)} ${padT + plotH} L ${xScale(0).toFixed(1)} ${padT + plotH} Z`
    : '';
  const headArea = points.length > 1
    ? `${headPath} L ${xScale(points.length - 1).toFixed(1)} ${padT + plotH} L ${xScale(0).toFixed(1)} ${padT + plotH} Z`
    : '';

  const currentFlow = points.at(-1)?.flow ?? 0;
  const currentHead = points.at(-1)?.head ?? 0;
  const currentTemp = points.at(-1)?.temp ?? 0;

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: '#6B8A40',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Hydraulic Twin · EPANET
        </h3>
        <div style={{ display: 'flex', gap: '0.8rem', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.62rem' }}>
          <span style={{ color: '#9DB36B' }}>
            FLOW <b style={{ color: '#FFFAC2' }}>{currentFlow.toFixed(1)}</b> L/s
          </span>
          <span style={{ color: '#E0944A' }}>
            HEAD <b style={{ color: '#FFFAC2' }}>{currentHead.toFixed(1)}</b> m
          </span>
          <span style={{ color: thermalThrottle ? '#E27373' : '#9DB36B' }}>
            APU <b style={{ color: '#FFFAC2' }}>{currentTemp.toFixed(1)}</b>°C
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="vvuFlowArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(107,138,64,0.28)" />
              <stop offset="100%" stopColor="rgba(107,138,64,0)" />
            </linearGradient>
            <linearGradient id="vvuHeadArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(196,109,26,0.22)" />
              <stop offset="100%" stopColor="rgba(196,109,26,0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={padL}
              y1={padT + f * plotH}
              x2={W - padR}
              y2={padT + f * plotH}
              stroke="rgba(107,138,64,0.1)"
              strokeWidth={0.5}
            />
          ))}

          {/* Y-axis labels (left: flow, right: head) */}
          <text x={4} y={padT + 4} fontSize={8} fontFamily="monospace" fill="#6B8A40">{flowMax}</text>
          <text x={4} y={padT + plotH + 3} fontSize={8} fontFamily="monospace" fill="#6B8A40">{flowMin}</text>
          <text x={W - padR - 2} y={padT + 4} fontSize={8} fontFamily="monospace" fill="#C46D1A" textAnchor="end">{headMax}</text>
          <text x={W - padR - 2} y={padT + plotH + 3} fontSize={8} fontFamily="monospace" fill="#C46D1A" textAnchor="end">{headMin}</text>

          {/* Axis units */}
          <text x={4} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F">L/s</text>
          <text x={W - 4} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="end">m</text>

          {/* Area fills */}
          {flowArea && <path d={flowArea} fill="url(#vvuFlowArea)" />}
          {headArea && <path d={headArea} fill="url(#vvuHeadArea)" />}

          {/* Lines */}
          {flowPath && <path d={flowPath} fill="none" stroke="#9DB36B" strokeWidth={1.6} />}
          {headPath && <path d={headPath} fill="none" stroke="#E0944A" strokeWidth={1.6} strokeDasharray="2 2" />}

          {/* Current-point markers */}
          {points.length > 0 && (
            <>
              <circle cx={xScale(points.length - 1)} cy={yFlow(currentFlow)} r={3} fill="#9DB36B" />
              <circle cx={xScale(points.length - 1)} cy={yHead(currentHead)} r={3} fill="#E0944A" />
            </>
          )}

          {/* X-axis time labels */}
          <text x={padL} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F">-60s</text>
          <text x={W - padR} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="end">now</text>
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.58rem',
          color: '#5A6B4F',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 10, height: 2, background: '#9DB36B' }} /> Flow rate (L/s)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 10, height: 2, background: '#E0944A', borderTop: '2px dashed #E0944A' }} /> Pressure head (m)
        </span>
        <span style={{ marginLeft: 'auto' }}>
          NODE · <span style={{ color: '#F3E38A' }}>{nodeId}</span> · TENANT · <span style={{ color: '#F3E38A' }}>{DEFAULT_TENANT.slug}</span>
        </span>
      </div>
    </div>
  );
}
