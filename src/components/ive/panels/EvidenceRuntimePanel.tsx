"use client";

import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard } from "../primitives";
import type { EvidenceEvent } from "@/lib/ive/types";

const LEVEL_ACCENT: Record<EvidenceEvent["level"], string> = {
  success: "var(--ive-proven)",
  error: "var(--ive-blocked)",
  warn: "#CC7722",
  info: "#8b949e",
};

const LEVEL_ICON: Record<EvidenceEvent["level"], LucideIcon> = {
  success: CheckCircle2,
  error: ShieldAlert,
  warn: AlertTriangle,
  info: Info,
};

export function EvidenceRuntimePanel() {
  const evidenceTimeline = useIveStore((s) => s.evidenceTimeline);
  const evidenceCursor = useIveStore((s) => s.evidenceCursor);
  const advanceEvidence = useIveStore((s) => s.advanceEvidence);
  const resetEvidence = useIveStore((s) => s.resetEvidence);
  const proofProgress = useIveStore((s) => s.proofProgress);
  const contract = useIveStore((s) => s.contract);

  const revealedCount = Math.min(evidenceCursor, evidenceTimeline.length);
  const evidencedCount = evidenceTimeline
    .slice(0, revealedCount)
    .filter((e) => e.evidenced).length;
  const pendingCount = evidenceTimeline.length - revealedCount;
  const errorCount = evidenceTimeline
    .slice(0, revealedCount)
    .filter((e) => e.level === "error").length;

  return (
    <PanelFrame
      title="Evidence Runtime"
      tag="ER"
      accent="#3d9bff"
      mission="Deterministic evidence timeline. Never fabricates evidence."
      actions={
        <div className="flex gap-1.5">
          <button
            onClick={advanceEvidence}
            disabled={evidenceCursor >= evidenceTimeline.length}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-[var(--ive-pending)]/30 bg-[var(--ive-pending)]/10 px-2.5 py-1 text-[10px] text-[var(--ive-pending)] transition-opacity disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Advance
          </button>
          <button
            onClick={resetEvidence}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      }
    >
      {/* Runtime stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Revealed Events"
          value={`${revealedCount} / ${evidenceTimeline.length}`}
          hint="events stepped through cursor"
          accent="#3d9bff"
          status="pending"
        />
        <StatCard
          label="Evidenced"
          value={evidencedCount}
          hint="backed by runtime artifacts"
          status="ok"
        />
        <StatCard
          label="Not Evidenced"
          value={revealedCount - evidencedCount}
          hint="intended sequence, no artifact"
          status="warn"
        />
        <StatCard
          label="Errors"
          value={errorCount}
          hint="error-level events revealed"
          status="error"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Timeline */}
        <div>
          <SectionLabel>Deterministic Evidence Timeline</SectionLabel>
          <div className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
            <div className="flex flex-col gap-0">
              {evidenceTimeline.map((ev, i) => {
                const revealed = i < evidenceCursor;
                const accent = LEVEL_ACCENT[ev.level];
                const Icon = LEVEL_ICON[ev.level];
                const isLast = i === evidenceTimeline.length - 1;
                return (
                  <div key={ev.id} className="flex flex-col">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: revealed ? 1 : 0.4, y: 0 }}
                      transition={{ delay: revealed ? i * 0.04 : 0, duration: 0.3 }}
                      className="relative flex items-start gap-3 rounded-lg border p-3"
                      style={{
                        borderColor: revealed
                          ? `${accent}40`
                          : "rgba(255,255,255,0.04)",
                        background: revealed
                          ? `${accent}08`
                          : "rgba(255,255,255,0.015)",
                        borderStyle: revealed ? "solid" : "dashed",
                      }}
                    >
                      <span
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
                        style={{
                          borderColor: `${accent}50`,
                          background: `${accent}10`,
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className="ive-mono text-[10px] font-semibold tabular-nums"
                            style={{ color: accent }}
                          >
                            {ev.timestamp}
                          </span>
                          <span className="ive-mono rounded border border-white/10 bg-white/[0.03] px-1 py-0.5 text-[8.5px] uppercase tracking-wider text-muted-foreground">
                            {ev.stage}
                          </span>
                          <span
                            className="ive-mono rounded px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider"
                            style={{
                              color: ev.evidenced
                                ? "var(--ive-proven)"
                                : "var(--ive-blocked)",
                              background: ev.evidenced
                                ? "rgba(61,255,176,0.12)"
                                : "rgba(255,77,95,0.10)",
                            }}
                          >
                            {ev.evidenced ? "EVIDENCED" : "NOT EVIDENCED"}
                          </span>
                          {!revealed && (
                            <span className="ive-mono rounded border border-white/10 border-dashed bg-white/[0.02] px-1 py-0.5 text-[8.5px] uppercase tracking-wider text-muted-foreground/50">
                              PENDING
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-foreground/85">
                          {ev.message}
                        </div>
                      </div>
                      {revealed && ev.level === "error" && (
                        <span
                          className="absolute -left-px top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full"
                          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                        />
                      )}
                    </motion.div>
                    {!isLast && (
                      <div className="flex justify-center py-0.5">
                        <div
                          className="relative h-4 w-[1.5px]"
                          style={{
                            background: revealed ? `${accent}40` : "rgba(255,255,255,0.06)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {evidenceCursor === 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-white/10 bg-white/[0.015] px-3 py-2">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="ive-mono text-[10px] text-muted-foreground/70">
                  Cursor at start. Press <span className="text-foreground">Advance</span> to reveal the intended evidence sequence.
                </span>
              </div>
            )}
          </div>
          <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
            <span>cursor: {evidenceCursor} / {evidenceTimeline.length}</span>
            <span>{pendingCount} pending</span>
          </div>
        </div>

        {/* Runtime state */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Runtime State</SectionLabel>
            <div className="ive-surface flex flex-col gap-3 rounded-xl border border-white/[0.06] p-4">
              <div>
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  Proof Progress
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="font-sans text-2xl font-bold"
                    style={{ color: "var(--ive-gold)" }}
                  >
                    {proofProgress}
                  </span>
                  <span className="ive-mono text-[11px] text-muted-foreground">
                    / 8 stages
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--ive-gold)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(proofProgress / 8) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-white/[0.06]" />

              <div className="flex items-center justify-between gap-2">
                <span className="ive-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Ledger Status
                </span>
                <StatusPill
                  state={contract.ledger_status}
                  accent="var(--ive-proven)"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="ive-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Provenance
                </span>
                <StatusPill
                  state={contract.provenance_status}
                  accent="var(--ive-pending)"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="ive-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Eng. Release
                </span>
                <StatusPill
                  state={contract.trustSphere.engineeringRelease}
                  accent="var(--ive-blocked)"
                  pulse
                />
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>Level Legend</SectionLabel>
            <div className="ive-surface grid grid-cols-2 gap-2 rounded-lg border border-white/[0.06] p-3">
              {(Object.keys(LEVEL_ACCENT) as EvidenceEvent["level"][]).map((lvl) => {
                const Icon = LEVEL_ICON[lvl];
                return (
                  <div key={lvl} className="flex items-center gap-2">
                    <Icon className="h-3 w-3" style={{ color: LEVEL_ACCENT[lvl] }} />
                    <span
                      className="ive-mono text-[9.5px] uppercase tracking-wider"
                      style={{ color: LEVEL_ACCENT[lvl] }}
                    >
                      {lvl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Evidence Discipline</SectionLabel>
            <div className="ive-surface flex items-start gap-2.5 rounded-lg border border-[var(--ive-blocked)]/15 bg-[var(--ive-blocked)]/[0.04] p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--ive-blocked)]" />
              <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground">
                Timeline reflects intended sequence. Events marked{" "}
                <span className="text-[var(--ive-proven)]">EVIDENCED</span> only when
                backed by actual runtime artifacts. All events in this run are{" "}
                <span className="text-[var(--ive-blocked)]">NOT EVIDENCED</span> —
                no fabricated provenance is ever emitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
