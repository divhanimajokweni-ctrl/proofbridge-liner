"use client";

import { useEffect, useRef } from "react";
import { useIveStore, PANEL_MAP } from "@/store/useIveStore";

/**
 * StatusBar
 * ---------
 * Sticky footer taskbar. Shows the circuit-breaker state, live trust
 * density from the canvas sphere (with a mini activity sparkline), the
 * active panel, and keyboard hints. Sticks to the viewport bottom; the
 * parent flex-column layout ensures it is pushed down naturally when
 * content overflows.
 */
export function StatusBar() {
  const circuitBreaker = useIveStore((s) => s.circuitBreaker);
  const sphereVerified = useIveStore((s) => s.sphereVerified);
  const sphereTotal = useIveStore((s) => s.sphereTotal);
  const activePanel = useIveStore((s) => s.activePanel);
  const trustSphere = useIveStore((s) => s.trustSphere);

  const cbColor =
    circuitBreaker === "NORMAL"
      ? "var(--ive-proven)"
      : circuitBreaker === "DEGRADED"
        ? "#CC7722"
        : "var(--ive-blocked)";

  const activeMeta = PANEL_MAP[activePanel];
  const density = sphereTotal > 0 ? (sphereVerified / sphereTotal) * 100 : 0;
  const provenDims = [
    trustSphere.integrity,
    trustSphere.auditability,
    trustSphere.availability,
  ].filter(
    (d) => d.state === "VERIFIED" || d.state === "LEDGER_PRESENT" || d.state === "PRESENT",
  ).length;

  return (
    <footer className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-1.5 border-t border-white/[0.06] px-4 py-2 ive-mono text-[10px] text-muted-foreground ive-surface sm:px-6">
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full ive-live-pulse"
          style={{ background: cbColor, boxShadow: `0 0 6px ${cbColor}80` }}
        />
        <span className="text-muted-foreground/80">Circuit Breaker:</span>
        <span className="font-medium" style={{ color: cbColor }}>
          {circuitBreaker}
        </span>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-muted-foreground/80">Trust:</span>
        <span className="font-medium" style={{ color: "var(--ive-gold)" }}>
          {provenDims}/6
        </span>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-muted-foreground/80">Sphere:</span>
        <span className="font-medium" style={{ color: "var(--ive-gold)" }}>
          {sphereVerified}/{sphereTotal}
        </span>
        <MiniSparkline value={density} />
        <span className="font-medium" style={{ color: "var(--ive-gold)" }}>
          {density.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80">Active:</span>
        <span className="font-medium" style={{ color: activeMeta.accent }}>
          {activeMeta.label}
        </span>
      </div>
      <div className="ml-auto hidden items-center gap-2 lg:flex">
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px]">⌘K</kbd>
        <span className="text-muted-foreground/60">palette</span>
      </div>
    </footer>
  );
}

/**
 * MiniSparkline
 * -------------
 * A tiny inline SVG sparkline that tracks the sphere density over time.
 * Renders a rolling window of the last 32 readings as a smooth area path.
 * Readings are sampled from the `value` prop on an interval and stored in
 * a ref-backed array (no React state, no re-renders).
 */
function MiniSparkline({ value }: { value: number }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const readingsRef = useRef<number[]>(Array.from({ length: 32 }, () => value));
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const W = 56;
    const H = 16;
    const interval = setInterval(() => {
      const readings = readingsRef.current;
      readings.push(valueRef.current);
      if (readings.length > 32) readings.shift();
      const max = 100;
      const step = W / (readings.length - 1);
      const points = readings.map((v, i) => {
        const x = i * step;
        const y = H - (Math.min(v, max) / max) * H;
        return [x, y] as const;
      });
      const linePath = points
        .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
        .join(" ");
      const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
      if (pathRef.current) pathRef.current.setAttribute("d", linePath);
      if (areaRef.current) areaRef.current.setAttribute("d", areaPath);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg
      width="56"
      height="16"
      viewBox="0 0 56 16"
      className="flex-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={areaRef} d="" fill="url(#spark-fill)" />
      <path
        ref={pathRef}
        d=""
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
