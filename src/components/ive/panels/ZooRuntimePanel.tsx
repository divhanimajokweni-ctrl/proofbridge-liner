"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Code2,
  FileCode2,
  XCircle,
  ShieldX,
  ShieldCheck,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, MonoTable } from "../primitives";

interface MethodRow {
  method: string;
  type: "Native" | "Wrapper";
  status: string;
  evidence: string;
}

const NATIVE_METHODS = [
  {
    method: "load_model",
    intent: "Load a Zoo Engine model definition into the runtime.",
  },
  {
    method: "set_param",
    intent: "Mutate a model parameter and trigger a re-render.",
  },
  {
    method: "re-render",
    intent: "Re-evaluate the procedural geometry graph end-to-end.",
  },
];

const WRAPPER_METHODS = [
  {
    method: "wrapper.load_kcl",
    intent: "Parse a KCL program into the project's intermediate representation.",
  },
  {
    method: "wrapper.evaluate",
    intent: "Evaluate the parsed IR deterministically inside the IVE pipeline.",
  },
  {
    method: "wrapper.snapshot",
    intent: "Emit a reproducible geometry snapshot tied to the proof graph.",
  },
];

export function ZooRuntimePanel() {
  const zooStatus = useIveStore((s) => s.zooStatus);
  const zooPlugin = useIveStore((s) => s.plugins.find((p) => p.id === "zoo"));

  const comparisonRows: MethodRow[] = [
    ...NATIVE_METHODS.map((m) => ({
      method: m.method,
      type: "Native" as const,
      status: "NOT_DEMONSTRATED",
      evidence: "no Zoo SDK runtime invoked",
    })),
    ...WRAPPER_METHODS.map((m) => ({
      method: m.method,
      type: "Wrapper" as const,
      status: "IMPLEMENTED",
      evidence: "pipeline/compute_provider.py",
    })),
  ];

  return (
    <PanelFrame
      title="Zoo Runtime"
      tag="ZOO"
      accent="#3dffb0"
      mission="Native Zoo APIs vs project wrappers. Clearly labelled, never conflated."
      actions={
        zooPlugin ? (
          <StatusPill state={zooPlugin.state} accent="var(--ive-proven)" pulse={zooPlugin.state === "RUNNING"} />
        ) : null
      }
    >
      {/* Warning banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3 rounded-xl border border-[var(--ive-blocked)]/30 bg-[var(--ive-blocked)]/[0.06] p-4"
      >
        <ShieldX className="mt-0.5 h-5 w-5 flex-none text-[var(--ive-blocked)]" />
        <div className="min-w-0">
          <div className="ive-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ive-blocked)]">
            Conflation Guard · Native vs Wrapper
          </div>
          <p className="ive-mono mt-1.5 text-[10.5px] leading-relaxed text-foreground/85">
            Wrapper methods are <span className="font-bold text-[var(--ive-blocked)]">NOT</span> Zoo SDK
            methods. Native Zoo Engine API execution is{" "}
            <span className="font-bold text-[var(--ive-blocked)]">NOT_DEMONSTRATED</span> in this
            environment. The project wrapper layer is implemented at{" "}
            <span className="font-mono text-foreground">pipeline/compute_provider.py</span> and never
            claims to be the Zoo Engine itself.
          </p>
        </div>
      </motion.div>

      {/* Two-column comparison */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Native — blocked */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="ive-surface flex flex-col rounded-xl border border-[var(--ive-blocked)]/25 bg-[var(--ive-blocked)]/[0.04] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-blocked)]/40 bg-[var(--ive-blocked)]/10">
                <Boxes className="h-4 w-4 text-[var(--ive-blocked)]" />
              </span>
              <div className="min-w-0">
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ive-blocked)]/80">
                  Native
                </div>
                <h3 className="font-sans text-base font-bold text-foreground">
                  Zoo Engine API
                </h3>
                <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  The upstream Zoo SDK surface. Calls dispatch directly into the
                  vendor runtime, not the project adapter.
                </p>
              </div>
            </div>
            <StatusPill state={zooStatus.nativeApiExecution} accent="var(--ive-blocked)" pulse />
          </div>

          <div className="ive-divider mt-4 h-px w-full" />

          <div className="mt-4">
            <div className="ive-mono mb-2 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              Expected API Surface
            </div>
            <div className="flex flex-col gap-2">
              {NATIVE_METHODS.map((m) => (
                <div
                  key={m.method}
                  className="flex items-start gap-2.5 rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--ive-blocked)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <code className="ive-mono text-[11px] font-semibold text-foreground/90">
                        {m.method}
                      </code>
                      <span className="ive-mono rounded border border-[var(--ive-blocked)]/30 bg-[var(--ive-blocked)]/10 px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[var(--ive-blocked)]">
                        NOT_DEMONSTRATED
                      </span>
                    </div>
                    <p className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/70">
                      {m.intent}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-[var(--ive-blocked)]/25 bg-[var(--ive-blocked)]/[0.03] px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-none text-[var(--ive-blocked)]/80" />
            <span className="ive-mono text-[9.5px] leading-relaxed text-muted-foreground/80">
              No native runtime invocation was instrumented. Any reference to a
              Zoo SDK method in this run refers to the documented surface, not an
              executed call.
            </span>
          </div>
        </motion.div>

        {/* Wrapper — implemented */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="ive-surface flex flex-col rounded-xl border border-[var(--ive-proven)]/25 bg-[var(--ive-proven)]/[0.04] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-proven)]/40 bg-[var(--ive-proven)]/10">
                <Code2 className="h-4 w-4 text-[var(--ive-proven)]" />
              </span>
              <div className="min-w-0">
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ive-proven)]/80">
                  Project Adapter
                </div>
                <h3 className="font-sans text-base font-bold text-foreground">
                  Wrapper Layer
                </h3>
                <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  A project-authored adapter that wraps the procedural CAD
                  surface used inside the IVE pipeline. Distinct from the Zoo SDK.
                </p>
              </div>
            </div>
            <StatusPill state={zooStatus.wrapperLayer} accent="var(--ive-proven)" pulse />
          </div>

          <div className="ive-divider mt-4 h-px w-full" />

          <div className="mt-4">
            <div className="ive-mono mb-2 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              Implemented Adapter Surface
            </div>
            <div className="flex flex-col gap-2">
              {WRAPPER_METHODS.map((m) => (
                <div
                  key={m.method}
                  className="flex items-start gap-2.5 rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--ive-proven)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <code className="ive-mono text-[11px] font-semibold text-foreground/90">
                        {m.method}
                      </code>
                      <span className="ive-mono rounded border border-[var(--ive-proven)]/30 bg-[var(--ive-proven)]/10 px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[var(--ive-proven)]">
                        IMPLEMENTED
                      </span>
                    </div>
                    <p className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/70">
                      {m.intent}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--ive-proven)]/20 bg-[var(--ive-proven)]/[0.04] px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 flex-none text-[var(--ive-proven)]/80" />
            <span className="ive-mono text-[9.5px] leading-relaxed text-muted-foreground/85">
              Wrapper layer is implemented and integrated into the deterministic
              pipeline. It does <span className="text-foreground">not</span> invoke the
              Zoo SDK; it provides an equivalent procedural CAD surface for the
              demonstration case study.
            </span>
          </div>
        </motion.div>
      </div>

      {/* Integration point */}
      <div className="mt-6">
        <SectionLabel>Integration Point</SectionLabel>
        <div className="ive-surface flex flex-col gap-3 rounded-xl border border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-gold)]/40 bg-[var(--ive-gold)]/10">
              <FileCode2 className="h-4 w-4 text-[var(--ive-gold)]" />
            </span>
            <div className="min-w-0">
              <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                Wrapper integration point
              </div>
              <code className="ive-mono mt-0.5 block text-[12.5px] font-semibold text-foreground">
                {zooStatus.integrationPoint}
              </code>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill state="Wrapper · IMPLEMENTED" accent="var(--ive-proven)" />
            <StatusPill state="Native · NOT_DEMONSTRATED" accent="var(--ive-blocked)" />
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-6">
        <SectionLabel>Method Comparison · Native vs Wrapper</SectionLabel>
        <MonoTable
          cols={[
            { key: "method", label: "Method" },
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "evidence", label: "Evidence" },
          ]}
          rows={comparisonRows.map((r) => ({
            method: <code className="ive-mono text-[11px] font-semibold text-foreground/90">{r.method}</code>,
            type: (
              <span
                className="ive-mono rounded border px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider"
                style={
                  r.type === "Native"
                    ? {
                        borderColor: "rgba(255,77,95,0.30)",
                        background: "rgba(255,77,95,0.10)",
                        color: "var(--ive-blocked)",
                      }
                    : {
                        borderColor: "rgba(61,255,176,0.30)",
                        background: "rgba(61,255,176,0.10)",
                        color: "var(--ive-proven)",
                      }
                }
              >
                {r.type}
              </span>
            ),
            status: (
              <span
                className="ive-mono font-semibold uppercase tracking-wider"
                style={{
                  color:
                    r.status === "IMPLEMENTED"
                      ? "var(--ive-proven)"
                      : "var(--ive-blocked)",
                }}
              >
                {r.status}
              </span>
            ),
            evidence: <span className="ive-mono text-[10.5px] text-muted-foreground">{r.evidence}</span>,
          }))}
        />
        <p className="ive-mono mt-2 text-[9.5px] leading-relaxed text-muted-foreground/60">
          The table above makes the distinction explicit: a method&apos;s type
          determines whether it is backed by the Zoo SDK (Native) or the project
          adapter (Wrapper). The two are never conflated in the frozen contract.
        </p>
      </div>
    </PanelFrame>
  );
}
