"use client";

import { motion } from "framer-motion";
import {
  FileInput,
  Box,
  FileText,
  ListChecks,
  Cpu,
  ShieldCheck,
  BookOpen,
  OctagonAlert,
  RotateCcw,
  Play,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";
import type { ProofGraphNodeStatus } from "@/lib/ive/types";

const NODE_ICONS: Record<string, LucideIcon> = {
  provenance: FileInput,
  geometry: Box,
  specification: FileText,
  obligations: ListChecks,
  solver: Cpu,
  evidence: ShieldCheck,
  ledger: BookOpen,
  release: OctagonAlert,
};

const STATUS_ACCENT: Record<ProofGraphNodeStatus, string> = {
  PROVEN: "var(--ive-proven)",
  ACTIVE: "var(--ive-gold)",
  PENDING: "var(--ive-pending)",
  BLOCKED: "var(--ive-blocked)",
  OUT_OF_SCOPE: "#8b949e",
};

export function ProofGraphPanel() {
  const proofGraph = useIveStore((s) => s.proofGraph);
  const proofProgress = useIveStore((s) => s.proofProgress);
  const advanceProof = useIveStore((s) => s.advanceProof);
  const resetProof = useIveStore((s) => s.resetProof);

  return (
    <PanelFrame
      title="Proof Graph"
      tag="PG"
      accent="#3dffb0"
      mission="Engineering DAG: Input Provenance → Geometry → Specification → Proof Obligations → Solver → Evidence → Ledger → Engineering Release."
      actions={
        <div className="flex gap-1.5">
          <button
            onClick={advanceProof}
            disabled={proofProgress >= 8}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-[var(--ive-proven)]/30 bg-[var(--ive-proven)]/10 px-2.5 py-1 text-[10px] text-[var(--ive-proven)] transition-opacity disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Advance
          </button>
          <button
            onClick={resetProof}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Graph visualization */}
        <div>
          <SectionLabel>Sequential Engineering DAG</SectionLabel>
          <div className="ive-surface relative overflow-hidden rounded-xl border border-white/[0.06] p-4">
            <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative flex flex-col gap-1">
              {proofGraph.nodes.map((node, i) => {
                const Icon = NODE_ICONS[node.id] ?? Box;
                const accent = STATUS_ACCENT[node.status];
                const isLast = i === proofGraph.nodes.length - 1;
                return (
                  <div key={node.id} className="flex flex-col">
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.35 }}
                      className="relative flex items-center gap-3 rounded-lg border p-2.5"
                      style={{
                        borderColor: `${accent}40`,
                        background:
                          node.status === "ACTIVE"
                            ? `${accent}10`
                            : node.status === "BLOCKED"
                              ? `${accent}10`
                              : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {node.status === "ACTIVE" && (
                        <span
                          className="absolute -left-px top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full"
                          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                        />
                      )}
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-md border"
                        style={{ borderColor: `${accent}50`, background: `${accent}12` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: accent }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{node.label}</span>
                          <span
                            className="ive-mono rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                            style={{ color: accent, background: `${accent}15` }}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="ive-mono mt-0.5 truncate text-[9.5px] text-muted-foreground/70">
                          {node.semantic}
                        </div>
                        {node.status === "PROVEN" && node.completedAt && node.completedAt !== "PENDING" && (
                          <div className="ive-mono mt-0.5 text-[8.5px] text-muted-foreground/50">
                            completed {new Date(node.completedAt as string).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                    {!isLast && (
                      <div className="flex justify-center py-0.5">
                        <div className="relative h-5 w-[1.5px]">
                          <div className="absolute inset-0 bg-white/10" />
                          <motion.div
                            className="absolute inset-x-0 top-0"
                            style={{ background: STATUS_ACCENT.PROVEN }}
                            initial={{ height: 0 }}
                            animate={{
                              height: i < proofProgress ? "100%" : "0%",
                            }}
                            transition={{ duration: 0.4 }}
                          />
                          {i === proofProgress - 1 && (
                            <motion.div
                              className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full"
                              style={{ background: STATUS_ACCENT.PROVEN }}
                              animate={{ y: [0, 16, 0] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
            <span>progress: {proofProgress} / 8 stages</span>
            <span>connectSequential() · golden-ratio cadence</span>
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Node States</SectionLabel>
            <div className="ive-surface grid grid-cols-2 gap-2 rounded-lg border border-white/[0.06] p-3 sm:grid-cols-3">
              {(Object.keys(STATUS_ACCENT) as ProofGraphNodeStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: STATUS_ACCENT[s], boxShadow: `0 0 6px ${STATUS_ACCENT[s]}80` }}
                  />
                  <span className="ive-mono text-[9.5px] text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Proof Obligations</SectionLabel>
            <div className="flex flex-col gap-2">
              {useIveStore.getState().obligations.map((o) => (
                <div
                  key={o.id}
                  className="ive-surface rounded-lg border border-white/[0.06] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {o.category}
                    </span>
                    <StatusPill
                      state={o.state}
                      accent={
                        o.state === "PROVEN"
                          ? "var(--ive-proven)"
                          : o.state === "OUT_OF_SCOPE"
                            ? "var(--ive-blocked)"
                            : "var(--ive-pending)"
                      }
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-foreground/85">{o.statement}</div>
                  {o.solver && (
                    <div className="ive-mono mt-1.5 text-[9.5px] text-muted-foreground/60">
                      solver: {o.solver}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Engineering Semantics</SectionLabel>
            <div className="ive-surface rounded-lg border border-white/[0.06] p-3.5">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Every edge is a verifiable step. Every node is either an axiom or a proven
                consequence. The graph animates as execution progresses — node statuses are
                derived from actual runtime data where available and marked{" "}
                <span className="ive-mono text-[var(--ive-pending)]">PENDING</span> /{" "}
                <span className="ive-mono text-[var(--ive-blocked)]">BLOCKED</span> otherwise.
              </p>
              <p className="ive-mono mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
                No node is ever marked <span className="text-[var(--ive-proven)]">PROVEN</span> without
                evidence. The terminal <span className="text-[var(--ive-blocked)]">Engineering Release</span>{" "}
                node remains BLOCKED until all obligations are discharged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
