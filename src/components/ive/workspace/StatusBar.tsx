"use client";

import { useIveStore, PANEL_MAP } from "@/store/useIveStore";

/**
 * StatusBar
 * ---------
 * Sticky footer taskbar. Shows the circuit-breaker state, live trust
 * density from the canvas sphere, the active panel, and keyboard hints.
 * Sticks to the viewport bottom; the parent fl-direction column ensures it
 * is pushed down naturally when content overflows.
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
  ].filter((d) => d.state === "VERIFIED" || d.state === "LEDGER_PRESENT" || d.state === "PRESENT").length;

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
        <span className="text-muted-foreground/80">Trust Dimensions:</span>
        <span className="font-medium" style={{ color: "var(--ive-gold)" }}>
          {provenDims}/6 verified
        </span>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-muted-foreground/80">Sphere Nodes:</span>
        <span className="font-medium" style={{ color: "var(--ive-gold)" }}>
          {sphereVerified}/{sphereTotal}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground/80">density</span>
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
