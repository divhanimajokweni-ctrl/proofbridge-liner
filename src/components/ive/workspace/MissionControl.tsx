"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crosshair,
  X,
  OctagonAlert,
  ShieldCheck,
  CircleDot,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { useIveStore, PANEL_MAP } from "@/store/useIveStore";
import { DISPOSITION, REQUIRED_FIXES } from "@/lib/ive/release";

/**
 * MissionControl
 * --------------
 * A compact, always-visible floating summary card showing the most critical
 * IVE engineering status at a glance: release disposition, trust dimensions,
 * active blockers, and runtime vitals. Toggled via the header crosshair
 * button or the `m` keyboard shortcut.
 *
 * Designed to sit in the bottom-left corner so it never overlaps the
 * notification center (right) or the guided tour (bottom-center).
 */
export function MissionControl() {
  const open = useIveStore((s) => s.missionControlOpen);
  const setOpen = useIveStore((s) => s.setMissionControlOpen);
  const trustSphere = useIveStore((s) => s.trustSphere);
  const circuitBreaker = useIveStore((s) => s.circuitBreaker);
  const proofProgress = useIveStore((s) => s.proofProgress);
  const sphereVerified = useIveStore((s) => s.sphereVerified);
  const sphereTotal = useIveStore((s) => s.sphereTotal);
  const hardwareProfile = useIveStore((s) => s.hardwareProfile);
  const setActivePanel = useIveStore((s) => s.setActivePanel);

  const blockers = REQUIRED_FIXES.filter((f) => f.blocksSubmission);
  const provenDims = [
    trustSphere.integrity,
    trustSphere.auditability,
    trustSphere.availability,
  ].filter(
    (d) => d.state === "VERIFIED" || d.state === "LEDGER_PRESENT" || d.state === "PRESENT",
  ).length;

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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed bottom-14 left-4 z-40 w-[300px] overflow-hidden rounded-xl border border-white/[0.1] shadow-2xl sm:left-6"
          style={{ background: "rgba(12, 12, 20, 0.96)", backdropFilter: "blur(20px)" }}
          role="dialog"
          aria-label="Mission control"
        >
          {/* Accent top bar — blocked red since disposition is NO-GO */}
          <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, var(--ive-blocked), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[var(--ive-gold)]" />
              <span className="font-sans text-xs font-bold tracking-tight text-foreground">
                Mission Control
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded border border-white/10 p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close mission control"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 p-4">
            {/* Disposition */}
            <button
              onClick={() => { setActivePanel("release"); setOpen(false); }}
              className="group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-white/[0.03]"
              style={{ borderColor: "rgba(255,77,95,0.25)", background: "rgba(255,77,95,0.05)" }}
            >
              <OctagonAlert className="h-5 w-5 shrink-0" style={{ color: "var(--ive-blocked)" }} />
              <div className="min-w-0 flex-1">
                <div className="ive-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Disposition
                </div>
                <div className="font-sans text-sm font-bold" style={{ color: "var(--ive-blocked)" }}>
                  {DISPOSITION}
                </div>
                <div className="ive-mono text-[8.5px] text-muted-foreground/60">
                  {blockers.length} blockers · {REQUIRED_FIXES.length} total fixes
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Trust dimensions mini-grid */}
            <div>
              <div className="ive-mono mb-1.5 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/60">
                <ShieldCheck className="h-3 w-3" />
                Trust Dimensions
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { label: "Safety", dim: trustSphere.safety },
                  { label: "Integrity", dim: trustSphere.integrity },
                  { label: "Determinism", dim: trustSphere.determinism },
                  { label: "Audit", dim: trustSphere.auditability },
                  { label: "Recover", dim: trustSphere.recoverability },
                  { label: "Avail", dim: trustSphere.availability },
                ]).map(({ label, dim }) => {
                  const color =
                    dim.state === "VERIFIED" || dim.state === "LEDGER_PRESENT" || dim.state === "PRESENT"
                      ? "var(--ive-proven)"
                      : dim.state === "OUT_OF_SCOPE"
                        ? "var(--ive-blocked)"
                        : "var(--ive-pending)";
                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-0.5 rounded border border-white/[0.05] bg-white/[0.01] py-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
                      <span className="ive-mono text-[7.5px] uppercase text-muted-foreground/60">{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="ive-mono mt-1 text-[8.5px] text-muted-foreground/50">
                {provenDims}/6 verified · release BLOCKED
              </div>
            </div>

            {/* Runtime vitals */}
            <div>
              <div className="ive-mono mb-1.5 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/60">
                <CircleDot className="h-3 w-3" />
                Runtime Vitals
              </div>
              <div className="flex flex-col gap-1">
                <Vital label="Circuit Breaker" value={circuitBreaker} color={cbColor} />
                <Vital label="Proof Progress" value={`${proofProgress}/8`} color="var(--ive-gold)" />
                <Vital label="Sphere Nodes" value={`${sphereVerified}/${sphereTotal}`} color="var(--ive-gold)" />
                <Vital
                  label="GPU Provider"
                  value={String(hardwareProfile.provider)}
                  color="#CC7722"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="ive-mono border-t border-white/[0.06] pt-2 text-[8px] leading-relaxed text-muted-foreground/50">
              Press <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[7px]">M</kbd> to toggle · Esc to close
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Vital({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-white/[0.04] bg-white/[0.01] px-2 py-1">
      <span className="ive-mono text-[9px] text-muted-foreground/70">{label}</span>
      <span className="ive-mono text-[9.5px] font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

/**
 * MissionControlTrigger — the header crosshair button. Toggles the widget.
 */
export function MissionControlTrigger() {
  const open = useIveStore((s) => s.missionControlOpen);
  const setOpen = useIveStore((s) => s.setMissionControlOpen);

  // `m` keyboard shortcut toggles globally.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "m" || e.key === "M") {
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
      title="Mission control (M)"
      aria-label="Toggle mission control"
    >
      <Crosshair className={`h-3.5 w-3.5 ${open ? "text-[var(--ive-gold)]" : ""}`} />
      {open && (
        <span
          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--ive-gold)] ive-live-pulse"
          style={{ boxShadow: "0 0 6px rgba(201,168,76,0.6)" }}
        />
      )}
    </button>
  );
}
