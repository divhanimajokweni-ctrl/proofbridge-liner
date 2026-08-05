"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, X } from "lucide-react";
import { useIveStore } from "@/store/useIveStore";

/**
 * StatsHUD
 * --------
 * A `h`-toggleable translucent heads-up display overlaying live IVE telemetry
 * in the top-right corner. Shows a compact, always-readable summary of the
 * most dynamic runtime values: sphere density (with sparkline), proof
 * progress, circuit breaker, unread notifications, and the active panel.
 *
 * Unlike MissionControl (a detailed card), the HUD is intentionally minimal —
 * a glanceable strip of live numbers with a tiny animated density sparkline.
 */
export function StatsHUD() {
  const open = useIveStore((s) => s.statsHudOpen);
  const setOpen = useIveStore((s) => s.setStatsHudOpen);
  const sphereVerified = useIveStore((s) => s.sphereVerified);
  const sphereTotal = useIveStore((s) => s.sphereTotal);
  const proofProgress = useIveStore((s) => s.proofProgress);
  const circuitBreaker = useIveStore((s) => s.circuitBreaker);
  const unread = useIveStore((s) => s.notifications.filter((n) => !n.read).length);
  const activePanel = useIveStore((s) => s.activePanel);
  const hardwareProfile = useIveStore((s) => s.hardwareProfile);

  const density = sphereTotal > 0 ? (sphereVerified / sphereTotal) * 100 : 0;
  const cbColor =
    circuitBreaker === "NORMAL"
      ? "var(--ive-proven)"
      : circuitBreaker === "DEGRADED"
        ? "#CC7722"
        : "var(--ive-blocked)";

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed right-4 top-16 z-30 w-[240px] overflow-hidden rounded-lg border border-white/[0.1] shadow-xl sm:right-6"
          style={{ background: "rgba(12, 12, 20, 0.88)", backdropFilter: "blur(16px)" }}
          role="region"
          aria-label="Live stats HUD"
        >
          {/* Header strip */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[var(--ive-proven)] ive-live-pulse" />
              <span className="ive-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Live HUD
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded border border-white/10 p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Close HUD"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
            <HudStat label="Density" value={`${density.toFixed(1)}%`} color="var(--ive-gold)" />
            <HudStat label="Sphere" value={`${sphereVerified}/${sphereTotal}`} color="var(--ive-gold)" />
            <HudStat label="Proof" value={`${proofProgress}/8`} color="var(--ive-gold)" />
            <HudStat label="CB" value={circuitBreaker} color={cbColor} />
            <HudStat label="Unread" value={String(unread)} color={unread > 0 ? "var(--ive-blocked)" : "var(--ive-proven)"} />
            <HudStat label="GPU" value={String(hardwareProfile.speedupRatio) + "×"} color="#CC7722" />
          </div>

          {/* Density sparkline */}
          <div className="border-t border-white/[0.06] px-3 py-2">
            <div className="ive-mono mb-1 flex items-center justify-between text-[7.5px] uppercase tracking-wider text-muted-foreground/50">
              <span>Mesh Activity</span>
              <span>display only</span>
            </div>
            <HudSparkline value={density} />
          </div>

          {/* Active panel footer */}
          <div className="border-t border-white/[0.06] px-3 py-1.5">
            <div className="ive-mono flex items-center justify-between text-[8px]">
              <span className="text-muted-foreground/50">ACTIVE</span>
              <span className="font-semibold text-foreground/80">{activePanel}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HudStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-[rgba(12,12,20,0.9)] px-2.5 py-1.5">
      <span className="ive-mono text-[7px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
      <span className="ive-mono text-[11px] font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/** Tiny inline sparkline for the HUD density reading. */
function HudSparkline({ value }: { value: number }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const readingsRef = useRef<number[]>(Array.from({ length: 28 }, () => value));
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const W = 210;
    const H = 28;
    const interval = setInterval(() => {
      const readings = readingsRef.current;
      readings.push(valueRef.current);
      if (readings.length > 28) readings.shift();
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
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg width="210" height="28" viewBox="0 0 210 28" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="hud-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={areaRef} d="" fill="url(#hud-spark)" />
      <path ref={pathRef} d="" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * StatsHudTrigger — the header activity button. Toggles the HUD.
 */
export function StatsHudTrigger() {
  const open = useIveStore((s) => s.statsHudOpen);
  const setOpen = useIveStore((s) => s.setStatsHudOpen);

  // `h` keyboard shortcut toggles globally.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="relative inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      title="Live stats HUD (H)"
      aria-label="Toggle stats HUD"
    >
      <Activity className={`h-3.5 w-3.5 ${open ? "text-[var(--ive-proven)]" : ""}`} />
      {open && (
        <span
          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--ive-proven)] ive-live-pulse"
          style={{ boxShadow: "0 0 6px rgba(61,255,176,0.6)" }}
        />
      )}
    </button>
  );
}
