"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  FileText,
  GitBranch,
  Workflow,
  AlertTriangle,
  CornerDownRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard } from "../primitives";
import type { AttributionEntry } from "@/lib/ive/release";
import { ADAPTER_ATTRIBUTION, ADAPTER_RULES } from "@/lib/ive/release";
import type { ExplicitMissing } from "@/lib/ive/types";

const EXPLICIT_MISSING: ReadonlySet<ExplicitMissing> = new Set([
  "UNDEFINED",
  "MISSING",
  "NOT_EVALUATED",
  "OUT_OF_SCOPE",
  "REQUIRES VALIDATION",
  "PENDING",
]);

function isExplicitMissing(value: string): value is ExplicitMissing {
  return (EXPLICIT_MISSING as Set<string>).has(value);
}

function sourceRunAccent(run: string | ExplicitMissing): string {
  return isExplicitMissing(run) ? "var(--ive-blocked)" : "var(--ive-pending)";
}

function FieldKey({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
        {label}
      </div>
      <div className="ive-mono mt-0.5 break-words text-[10.5px] leading-relaxed text-foreground/85">
        {value}
      </div>
    </div>
  );
}

const RULE_ICON: LucideIcon = ShieldCheck;

export function AdapterAttributionPanel() {
  const [query, setQuery] = useState("");
  // Display-only contract run_id (provenance link).
  const contractRunId = useIveStore((s) => s.contract.run_id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADAPTER_ATTRIBUTION;
    return ADAPTER_ATTRIBUTION.filter((e) =>
      e.field.toLowerCase().includes(q) ||
      e.sourceArtifact.toLowerCase().includes(q) ||
      e.sourceField.toLowerCase().includes(q) ||
      e.transformation.toLowerCase().includes(q),
    );
  }, [query]);

  const missingTreatmentCount = ADAPTER_ATTRIBUTION.filter(
    (e) => e.missingTreatment.includes("UNDEFINED") ||
      e.missingTreatment.includes("MISSING") ||
      e.missingTreatment.includes("NOT_EVALUATED") ||
      e.missingTreatment.includes("OUT_OF_SCOPE") ||
      e.missingTreatment.includes("REQUIRES VALIDATION") ||
      e.missingTreatment.includes("BLOCKED"),
  ).length;

  const explicitMissingSourceRunCount = ADAPTER_ATTRIBUTION.filter(
    (e) => isExplicitMissing(e.sourceRun as string),
  ).length;

  return (
    <PanelFrame
      title="Adapter Attribution"
      tag="ADP"
      accent="#3d9bff"
      mission="Source attribution for every normalized contract field. No inference from filenames or branch names."
    >
      {/* ---- Rules card list ---- */}
      <div>
        <SectionLabel>Adapter Contract — Mandatory Rules</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADAPTER_RULES.map((rule, i) => {
            const Icon = RULE_ICON;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="ive-surface relative overflow-hidden rounded-xl border border-[var(--ive-pending)]/20 p-4"
              >
                <span
                  className="absolute left-0 top-0 h-full w-[3px]"
                  style={{ background: "var(--ive-pending)" }}
                />
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-pending)]/40"
                    style={{ background: "rgba(61,155,255,0.10)" }}
                  >
                    <Icon className="h-4 w-4 text-[var(--ive-pending)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="ive-mono rounded border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          borderColor: "rgba(61,155,255,0.40)",
                          background: "rgba(61,155,255,0.10)",
                          color: "var(--ive-pending)",
                        }}
                      >
                        MUST
                      </span>
                      <span className="ive-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                        Rule {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/90">
                      {rule}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ---- Stat row ---- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Attributed Fields"
          value={ADAPTER_ATTRIBUTION.length}
          hint="normalized contract fields traced"
          status="pending"
        />
        <StatCard
          label="Explicit-Missing Treatments"
          value={missingTreatmentCount}
          hint="fields with declared missing-state"
          accent="var(--ive-gold)"
        />
        <StatCard
          label="Runs MISSING / REQUIRES"
          value={explicitMissingSourceRunCount}
          hint="sourceRun unresolved"
          status="warn"
        />
        <StatCard
          label="Branch Inference"
          value="PROHIBITED"
          hint="hardware never derived from branch name"
          status="ok"
        />
      </div>

      {/* ---- Warning banner ---- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-5 relative overflow-hidden rounded-xl border border-[var(--ive-gold)]/30 p-4 sm:p-5"
        style={{ background: "rgba(201,168,76,0.06)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-[var(--ive-gold)]/40"
            style={{ background: "rgba(201,168,76,0.10)" }}
          >
            <ShieldAlert className="h-5 w-5 text-[var(--ive-gold)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="ive-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--ive-gold)]/85">
              Conflation Guard · No Filename / Branch Inference
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/90">
              The adapter must never infer hardware, metrics, proof results, API execution, or
              engineering status from filenames or branch names. Branch{" "}
              <span className="ive-mono rounded bg-white/[0.06] px-1 py-0.5 text-[10px] text-[var(--ive-gold)]">
                mi300x-rocm-run-20260804
              </span>{" "}
              is <span className="font-semibold text-foreground">NOT</span> used to infer hardware.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---- Search / filter ---- */}
      <div className="mt-6">
        <SectionLabel>Source Attribution Map</SectionLabel>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by field, source artifact, source field, or transformation…"
              className="ive-mono h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.02] py-1.5 pl-8 pr-8 text-[11px] text-foreground placeholder:text-muted-foreground/45 focus:border-[var(--ive-pending)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--ive-pending)]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="ive-mono flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9.5px] text-muted-foreground/70">
            <span className="text-[var(--ive-pending)]">{filtered.length}</span>
            <span className="text-muted-foreground/40">/</span>
            <span>{ADAPTER_ATTRIBUTION.length}</span>
            <span className="ml-1 uppercase tracking-wider">entries</span>
          </div>
        </div>

        {/* ---- Attribution entries ---- */}
        <div className="mt-4 flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="ive-surface flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-5">
              <AlertTriangle className="h-4 w-4 text-muted-foreground/60" />
              <span className="ive-mono text-[10.5px] text-muted-foreground">
                No attribution entries match the filter.
              </span>
            </div>
          )}
          {filtered.map((entry, i) => (
            <AttributionCard
              key={`${entry.field}-${i}`}
              entry={entry}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ---- Footer note ---- */}
      <div className="mt-7">
        <SectionLabel>Closure</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-pending)]/30"
              style={{ background: "rgba(61,155,255,0.08)" }}
            >
              <Workflow className="h-4 w-4 text-[var(--ive-pending)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] leading-relaxed text-foreground/90">
                Every normalized value retains its source attribution. The adapter fails or emits
                an explicit missing state when the input schema is invalid.
              </p>
              <div className="ive-mono mt-2.5 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground/60">
                <CornerDownRight className="h-3 w-3" />
                <span>contract run_id: {contractRunId}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>attribution entries: {ADAPTER_ATTRIBUTION.length}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>per-field retention: sourceArtifact, sourceField, sourceRun, transformation, missingTreatment</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PanelFrame>
  );
}

function AttributionCard({ entry, index }: { entry: AttributionEntry; index: number }) {
  const runAccent = sourceRunAccent(entry.sourceRun as string);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      className="ive-surface relative overflow-hidden rounded-xl border border-white/[0.06] p-4 transition-colors hover:border-white/[0.12]"
    >
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: "var(--ive-pending)" }}
      />
      <div className="flex flex-col gap-3">
        {/* Field header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-md border border-[var(--ive-gold)]/30"
              style={{ background: "rgba(201,168,76,0.10)" }}
            >
              <FileText className="h-3.5 w-3.5 text-[var(--ive-gold)]" />
            </span>
            <div>
              <div className="ive-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/55">
                Normalized Field
              </div>
              <div className="ive-mono text-[12px] font-semibold text-[var(--ive-gold)]">
                {entry.field}
              </div>
            </div>
          </div>
          <StatusPill
            state={entry.sourceRun}
            accent={runAccent}
            pulse={isExplicitMissing(entry.sourceRun as string)}
          />
        </div>

        {/* Source grid */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
            <FieldKey label="Source Artifact" value={entry.sourceArtifact} />
          </div>
          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
            <FieldKey label="Source Field" value={entry.sourceField} />
          </div>
          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
            <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
              Source Run
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 flex-none" style={{ color: runAccent }} />
              <span
                className="ive-mono break-words text-[10.5px] leading-relaxed"
                style={{ color: runAccent }}
              >
                {entry.sourceRun}
              </span>
            </div>
          </div>
        </div>

        {/* Transformation + missing treatment */}
        <div className="grid gap-2.5 lg:grid-cols-2">
          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
            <div className="ive-mono flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
              <Workflow className="h-3 w-3" />
              Transformation
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-foreground/85">
              {entry.transformation}
            </p>
          </div>
          <div className="rounded-md border border-[var(--ive-gold)]/12 bg-[var(--ive-gold)]/[0.03] p-2.5">
            <div className="ive-mono flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-[var(--ive-gold)]/80">
              <ShieldAlert className="h-3 w-3" />
              Missing Treatment
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-foreground/85">
              {entry.missingTreatment}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
