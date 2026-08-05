"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldX, CheckCircle2, CircleDot, OctagonAlert } from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { TrustSphere } from "../trust/TrustSphere";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";
import type { TrustDimensionStatus } from "@/lib/ive/types";

const DIMENSIONS: { key: keyof ReturnType<typeof dimSource>; label: string; icon: typeof ShieldX }[] = [
  { key: "safety", label: "Safety", icon: ShieldX },
  { key: "integrity", label: "Integrity", icon: CheckCircle2 },
  { key: "determinism", label: "Determinism", icon: CircleDot },
  { key: "auditability", label: "Auditability", icon: CheckCircle2 },
  { key: "recoverability", label: "Recoverability", icon: CircleDot },
  { key: "availability", label: "Availability", icon: CheckCircle2 },
];

function dimSource() {
  return useIveStore.getState().trustSphere;
}

function dimAccent(state: string): string {
  if (state === "VERIFIED" || state === "LEDGER_PRESENT" || state === "PRESENT") return "var(--ive-proven)";
  if (state === "OUT_OF_SCOPE") return "var(--ive-blocked)";
  if (state === "NOT_EVALUATED" || state === "PENDING") return "var(--ive-pending)";
  return "#8b949e";
}

export function TrustSpherePanel() {
  const trustSphere = useIveStore((s) => s.trustSphere);
  const [mode, setMode] = useState<"global" | "personal">("global");

  return (
    <PanelFrame
      title="Trust Sphere"
      tag="TS"
      accent="#b23dff"
      mission="Fibonacci verification state space. Six engineering dimensions + release decision. Evidence counts only — no aggregate percentage."
      actions={
        <div className="flex gap-1.5">
          {(["global", "personal"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`ive-mono rounded-full border px-3 py-1 text-[10px] transition-all ${
                mode === m
                  ? "border-[var(--ive-gold)]/30 bg-[var(--ive-gold)]/10 text-[var(--ive-gold)]"
                  : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "global" ? "Global Mesh" : "Personal Ledger"}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Sphere */}
        <div className="flex flex-col items-center">
          <TrustSphere mode={mode} />
          <p className="ive-mono mt-3 max-w-[480px] text-center text-[10px] italic leading-relaxed text-muted-foreground">
            {mode === "global"
              ? "“How healthy is the trust network right now?”"
              : "“Where do I fit in the network?”"}
          </p>
          <p className="ive-mono mt-1 text-center text-[9px] text-muted-foreground/50">
            The sphere visualizes the living mesh. Dimensions below are the frozen engineering status.
          </p>
        </div>

        {/* Dimensions */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Frozen Engineering Dimensions</SectionLabel>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {DIMENSIONS.map((d, i) => {
                const dim = trustSphere[d.key] as TrustDimensionStatus;
                const accent = dimAccent(dim.state);
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="ive-surface rounded-lg border border-white/[0.06] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                        <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {d.label}
                        </span>
                      </div>
                      {dim.count && (
                        <span className="ive-mono text-[10px] font-semibold" style={{ color: accent }}>
                          {dim.count.proven}/{dim.count.total}
                        </span>
                      )}
                    </div>
                    <div className="ive-mono mt-1.5 text-[11px] font-bold" style={{ color: accent }}>
                      {dim.state}
                    </div>
                    <div className="ive-mono mt-1 text-[9.5px] leading-relaxed text-muted-foreground/70">
                      {dim.detail}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Engineering release */}
          <div>
            <SectionLabel>Engineering Release Decision</SectionLabel>
            <div
              className="flex items-center gap-3 rounded-lg border p-4"
              style={{
                borderColor: "rgba(255,77,95,0.3)",
                background: "rgba(255,77,95,0.06)",
              }}
            >
              <OctagonAlert className="h-6 w-6 shrink-0" style={{ color: "var(--ive-blocked)" }} />
              <div>
                <div className="ive-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Decision
                </div>
                <div className="font-sans text-lg font-bold" style={{ color: "var(--ive-blocked)" }}>
                  BLOCKED
                </div>
                <div className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/80">
                  Engineering release remains BLOCKED until formal verification solver links and
                  multi-run ledger histories are executed. Missing evidence is surfaced explicitly.
                </div>
              </div>
            </div>
          </div>

          {/* Evidence legend */}
          <div>
            <SectionLabel>Evidence Boundary</SectionLabel>
            <div className="ive-surface flex flex-col gap-2 rounded-lg border border-white/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <span className="ive-mono text-[10px] text-muted-foreground">Provenance</span>
                <StatusPill state="AUTHENTICATED_BASE_ONLY" accent="var(--ive-pending)" />
              </div>
              <div className="flex items-center justify-between">
                <span className="ive-mono text-[10px] text-muted-foreground">Ledger</span>
                <StatusPill state="INITIALIZED_SINGLE_RUN" accent="var(--ive-pending)" />
              </div>
              <div className="flex items-center justify-between">
                <span className="ive-mono text-[10px] text-muted-foreground">Solver</span>
                <StatusPill state="NOT_LINKED" accent="var(--ive-blocked)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
