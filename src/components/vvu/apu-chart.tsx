'use client';

import { useEffect, useRef, useState } from 'react';

// APU temperature chart — 60-second rolling temperature with 65°C warn and
// 85°C critical threshold lines. Colour shifts green → amber → red as the
// current reading crosses the thresholds.

interface TempPoint {
  t: number;
  temp: number;
}

interface ApuChartProps {
  currentTemp: number;
  thermalThrottle: boolean;
  failClosed: boolean;
}

const MAX_POINTS = 60;
const WARN_THRESHOLD = 65;
const CRIT_THRESHOLD = 85;

export function ApuChart({ currentTemp, thermalThrottle, failClosed }: ApuChartProps) {
  const [points, setPoints] = useState<TempPoint[]>([]);
  const pointsRef = useRef<TempPoint[]>([]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Use the currentTemp prop as the latest reading, plus a tiny jitter
      // so the line isn't perfectly flat between page-state updates.
      const jitter = (Math.random() - 0.5) * 0.6;
      const temp = Math.round((currentTemp + jitter) * 10) / 10;
      const next = [...pointsRef.current, { t: now, temp }].slice(-MAX_POINTS);
      setPoints(next);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTemp]);

  const W = 520;
  const H = 140;
  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const tempMin = 40;
  const tempMax = 95;

  const xScale = (i: number) => padL + (i / (MAX_POINTS - 1)) * plotW;
  const yTemp = (v: number) => padT + plotH - ((v - tempMin) / (tempMax - tempMin)) * plotH;

  const tempPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yTemp(p.temp).toFixed(1)}`)
    .join(' ');

  const tempArea =
    points.length > 1
      ? `${tempPath} L ${xScale(points.length - 1).toFixed(1)} ${padT + plotH} L ${xScale(0).toFixed(1)} ${padT + plotH} Z`
      : '';

  const lineColor = failClosed
    ? '#B02A2A'
    : thermalThrottle
      ? '#E0944A'
      : '#9DB36B';
  const areaGrad = failClosed ? 'vvuTempAreaRed' : thermalThrottle ? 'vvuTempAreaAmber' : 'vvuTempAreaGreen';

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: `1px solid ${lineColor}33`,
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        transition: 'border-color 240ms ease',
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
          APU Thermal Envelope
        </h3>
        <div style={{ display: 'flex', gap: '0.8rem', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.62rem' }}>
          <span style={{ color: '#9DB36B' }}>
            WARN <b style={{ color: '#E0944A' }}>65°C</b>
          </span>
          <span style={{ color: '#9DB36B' }}>
            CRIT <b style={{ color: '#E27373' }}>85°C</b>
          </span>
          <span style={{ color: lineColor }}>
            NOW <b style={{ color: '#FFFAC2' }}>{currentTemp.toFixed(1)}°C</b>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="vvuTempAreaGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(107,138,64,0.3)" />
            <stop offset="100%" stopColor="rgba(107,138,64,0)" />
          </linearGradient>
          <linearGradient id="vvuTempAreaAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(196,109,26,0.3)" />
            <stop offset="100%" stopColor="rgba(196,109,26,0)" />
          </linearGradient>
          <linearGradient id="vvuTempAreaRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(176,42,42,0.35)" />
            <stop offset="100%" stopColor="rgba(176,42,42,0)" />
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

        {/* 65°C warn threshold line */}
        <line
          x1={padL}
          y1={yTemp(WARN_THRESHOLD)}
          x2={W - padR}
          y2={yTemp(WARN_THRESHOLD)}
          stroke="#E0944A"
          strokeWidth={0.8}
          strokeDasharray="4 3"
          opacity={0.6}
        />
        <text x={padL + 2} y={yTemp(WARN_THRESHOLD) - 3} fontSize={7} fontFamily="monospace" fill="#E0944A">
          65°C warn
        </text>

        {/* 85°C critical threshold line */}
        <line
          x1={padL}
          y1={yTemp(CRIT_THRESHOLD)}
          x2={W - padR}
          y2={yTemp(CRIT_THRESHOLD)}
          stroke="#B02A2A"
          strokeWidth={0.8}
          strokeDasharray="4 3"
          opacity={0.6}
        />
        <text x={padL + 2} y={yTemp(CRIT_THRESHOLD) - 3} fontSize={7} fontFamily="monospace" fill="#B02A2A">
          85°C crit
        </text>

        {/* Y-axis labels */}
        <text x={4} y={padT + 4} fontSize={8} fontFamily="monospace" fill="#6B8A40">{tempMax}°</text>
        <text x={4} y={padT + plotH + 3} fontSize={8} fontFamily="monospace" fill="#6B8A40">{tempMin}°</text>
        <text x={4} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F">°C</text>

        {/* Area + line */}
        {tempArea && <path d={tempArea} fill={`url(#${areaGrad})`} />}
        {tempPath && <path d={tempPath} fill="none" stroke={lineColor} strokeWidth={1.6} />}

        {/* Current-point marker */}
        {points.length > 0 && (
          <circle
            cx={xScale(points.length - 1)}
            cy={yTemp(points.at(-1)!.temp)}
            r={3.5}
            fill={lineColor}
            style={{ filter: `drop-shadow(0 0 4px ${lineColor})` }}
          />
        )}

        {/* X-axis labels */}
        <text x={padL} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F">-60s</text>
        <text x={W - padR} y={H - 4} fontSize={7} fontFamily="monospace" fill="#5A6B4F" textAnchor="end">now</text>
      </svg>
    </div>
  );
}
