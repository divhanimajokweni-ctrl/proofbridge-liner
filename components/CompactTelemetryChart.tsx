'use client';

/**
 * CompactTelemetryChart — Responsive Quota Utilization Widget
 *
 * Tracks container width via ResizeObserver. Standard view shows a
 * 5-bar chart with legend. Below 320px it collapses to an ultra-compact
 * mini-widget: single progress line + percentage label.
 *
 * Designed for PiP pop-out window where screen real estate is scarce.
 */

import React, { useState, useEffect, useRef } from 'react';

interface CompactTelemetryChartProps {
  logsCount?: number;
  policyLimit?: number;
}

export default function CompactTelemetryChart({
  logsCount = 42,
  policyLimit = 100,
}: CompactTelemetryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUltraCompact, setIsUltraCompact] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsUltraCompact(entry.contentRect.width < 320);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const utilizationRate = Math.min((logsCount / policyLimit) * 100, 100);

  return (
    <div
      ref={containerRef}
      className="bg-slate-900/50 border border-slate-900 rounded-xl p-3 w-full"
    >
      {isUltraCompact ? (
        /* ── Ultra-Compact Mini Widget (< 320px) ── */
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>PROOFBRIDGE</span>
            <span
              className={
                utilizationRate > 85 ? 'text-rose-400' : 'text-teal-400'
              }
            >
              {utilizationRate.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
            <div
              className={`h-full transition-all duration-300 ${
                utilizationRate > 85 ? 'bg-rose-500' : 'bg-teal-500'
              }`}
              style={{ width: `${utilizationRate}%` }}
            />
          </div>
        </div>
      ) : (
        /* ── Standard Expanded View (≥ 320px) ── */
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white uppercase tracking-wider">
              Quota Utilization
            </span>
            <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400">
              Node: Active
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 items-end h-12 pt-2 border-b border-slate-950">
            {[40, 65, 35, 80, utilizationRate].map((val, i) => (
              <div
                key={i}
                className={`w-full rounded-t transition-all ${
                  i === 4 ? 'bg-teal-500' : 'bg-slate-800'
                }`}
                style={{ height: `${val}%` }}
              />
            ))}
          </div>

          <p className="text-[10px] text-slate-500 leading-normal font-sans">
            {logsCount} of {policyLimit.toLocaleString()} logs consumed (
            {utilizationRate.toFixed(1)}%). Remaining quota within operational
            limits.
          </p>
        </div>
      )}
    </div>
  );
}
