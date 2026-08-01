'use client';
import React, { useMemo, useCallback } from 'react';

interface VelocityPoint {
  intervalLabel: string;
  mintCount: number;
}

export default function VelocityChartWithExport() {
  const data: VelocityPoint[] = useMemo(
    () => [
      { intervalLabel: '02:00', mintCount: 120 },
      { intervalLabel: '04:00', mintCount: 340 },
      { intervalLabel: '06:00', mintCount: 210 },
      { intervalLabel: '08:00', mintCount: 480 },
      { intervalLabel: '10:00', mintCount: 610 },
      { intervalLabel: '12:00', mintCount: 520 },
      { intervalLabel: '14:00', mintCount: 890 },
    ],
    [],
  );

  const width = 500;
  const height = 160;
  const padding = 30;

  const { points, maxVal, coords } = useMemo(() => {
    const counts = data.map((d) => d.mintCount);
    const max = Math.max(...counts) * 1.1;
    const min = 0;

    const pts = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.mintCount - min) / (max - min)) * (height - padding * 2);
      return { x, y, label: d.intervalLabel, count: d.mintCount };
    });

    return {
      points: pts.map((p) => `${p.x},${p.y}`).join(' '),
      maxVal: max,
      coords: pts,
    };
  }, [data]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: { y: number; label: string }[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = (maxVal / steps) * i;
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      ticks.push({ y, label: Math.floor(val).toString() });
    }
    return ticks;
  }, [maxVal]);

  /* ── CSV export handler ─────────────────────────── */
  const handleCSVExtractionAction = useCallback(() => {
    const headerRow = 'Interval_Timestamp,Tokens_Minted_Volume\n';
    const bodyRows = data.map((d) => `${d.intervalLabel},${d.mintCount}`).join('\n');
    const completeBlob = new Blob([headerRow + bodyRows], {
      type: 'text/csv;charset=utf-8;',
    });

    const executionUrl = URL.createObjectURL(completeBlob);
    const triggerLink = document.createElement('a');
    triggerLink.href = executionUrl;
    triggerLink.setAttribute(
      'download',
      `vvu_velocity_metrics_${new Date().toISOString().slice(0, 10)}.csv`,
    );

    document.body.appendChild(triggerLink);
    triggerLink.click();
    document.body.removeChild(triggerLink);
    URL.revokeObjectURL(executionUrl);
  }, [data]);

  return (
    <div className="border border-slate-900 bg-slate-950 p-4 rounded font-mono text-xs space-y-4 w-full">
      {/* ── Header with CSV export ──────────────────── */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
        <span className="text-cyan-400 font-bold tracking-widest flex items-center gap-1.5">
          📈 TOKEN ALLOCATION VELOCITY MATRIX
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">INTERVAL_12H</span>
          <button
            onClick={handleCSVExtractionAction}
            className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all rounded-sm uppercase tracking-wider cursor-pointer"
          >
            ⬇ EXPORT CSV
          </button>
        </div>
      </div>

      {/* ── SVG Chart ──────────────────────────────── */}
      <div className="relative overflow-visible flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full max-w-[500px] overflow-visible"
          style={{ height }}
        >
          {/* Y-axis grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding}
                y1={tick.y}
                x2={width - padding}
                y2={tick.y}
                stroke="#1e293b"
                strokeWidth={i === 0 ? 1 : 0.5}
                strokeDasharray={i === 0 ? 'none' : '4 4'}
              />
              <text
                x={padding - 6}
                y={tick.y + 3}
                textAnchor="end"
                fill="#64748b"
                className="text-[8px]"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Baseline */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* X-axis labels */}
          {coords.map((c, i) => (
            <text
              key={i}
              x={c.x}
              y={height - padding + 14}
              textAnchor="middle"
              fill="#64748b"
              className="text-[8px]"
            >
              {c.label}
            </text>
          ))}

          {/* Area fill */}
          <polygon
            fill="url(#areaGrad)"
            points={`${padding},${height - padding} ${points} ${coords[coords.length - 1].x},${height - padding}`}
          />
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main polyline */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
          />

          {/* Interactive nodes */}
          {coords.map((c, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={c.x} cy={c.y} r="3" fill="#020617" stroke="#22d3ee" strokeWidth="1.5" />
              <circle
                cx={c.x}
                cy={c.y}
                r="7"
                fill="#22d3ee"
                className="opacity-0 group-hover:opacity-20 transition-opacity"
              />
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                fill="#fff"
                className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                {c.count}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* ── Footer stats ───────────────────────────── */}
      <div className="flex justify-between text-[10px] text-slate-500 px-2 pt-1 border-t border-slate-900/60">
        <span>MIN_LIMIT: 0 TOKENS</span>
        <span>MAX_PEAK: {Math.floor(maxVal)} TOKENS</span>
      </div>
    </div>
  );
}
