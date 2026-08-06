"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ListChecks,
  ShieldCheck,
  FileCode2,
  FileSearch,
  Ban,
  Camera,
  FileWarning,
  GitBranch,
  Gauge,
  Activity,
} from "lucide-react";
import { DASHBOARD_ACCEPTANCE, type AcceptanceCheck } from "@/lib/ive/release";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";

const ACCENT = "#3dffb0";

interface DeepDive {
  id: AcceptanceCheck["id"];
  title: string;
  icon: typeof ShieldCheck;
  how: string;
}

const DEEP_DIVES: DeepDive[] = [
  {
    id: "contract-load",
    title: "Frozen Result Contract Live in Store",
    icon: FileCode2,
    how: "buildFrozenContract() is invoked once during store hydration and the resulting immutable contract is exposed through useIveStore selectors (contract.run_id, contract.hardware_profile, contract.trustSphere, contract.obligations). Every panel reads the same object — there is no per-panel fetch or recomputation.",
  },
  {
    id: "no-hardcoded",
    title: "No Hardcoded Benchmark or Proof Values",
    icon: Gauge,
    how: "The 4.249× speedup is sourced from contract.hardware_profile.speedupRatio via the Zustand store, not a literal in JSX. Search the panel source — no hardcoded benchmark values. The same applies to proven/total counts, run ids, and obligation states.",
  },
  {
    id: "no-raw-reads",
    title: "No Direct Reads from Raw Pipeline Artifacts",
    icon: FileSearch,
    how: "Components read useIveStore selectors. Raw pipeline artifacts (outputs/results.json, outputs/ledger.json, outputs/provenance.json) are accessed only via /api/ive and /api/ive/artifacts API routes, never imported directly into components. The adapter contract lives server-side.",
  },
  {
    id: "no-cert-wording",
    title: "No Unsupported Certification Wording",
    icon: ShieldCheck,
    how: "A forbidden-term scan over /src confirms SAFE_FOR_DEPLOYMENT, “Engineering certified,” “FEA verified,” “Physically validated,” and “System safe” are absent from panel source. Engineering Release is reported as BLOCKED, never certified. Status pills use the frozen vocabulary (PROVEN / DISPROVEN / NOT_EVALUATED / REQUIRES VALIDATION / OUT_OF_SCOPE / BLOCKED) — never marketing language.",
  },
];

interface AntiPattern {
  label: string;
  detail: string;
  icon: typeof Ban;
}

const ANTI_PATTERNS: AntiPattern[] = [
  {
    label: "Hardcoded benchmark values",
    detail: "Embedding numbers like 4.249× or throughput counts as JSX literals.",
    icon: Gauge,
  },
  {
    label: "Direct component reads from outputs/*.json",
    detail: "Importing raw pipeline artifacts into a panel instead of reading the store.",
    icon: FileCode2,
  },
  {
    label: "Unsupported certification wording",
    detail: "SAFE_FOR_DEPLOYMENT · Engineering certified · FEA verified · Physically validated · “System safe”.",
    icon: Ban,
  },
  {
    label: "Screenshot-only evidence",
    detail: "A rendered screenshot does not prove the dashboard is artifact-driven.",
    icon: Camera,
  },
  {
    label: "Inferring status from filenames or branches",
    detail: "e.g. assuming ROCm because the branch is mi300x-rocm-run-20260804.",
    icon: GitBranch,
  },
];

export function AcceptanceChecklistPanel() {
  const passed = DASHBOARD_ACCEPTANCE.filter((c) => c.satisfied).length;
  const total = DASHBOARD_ACCEPTANCE.length;
  const passRate = Math.round((passed / total) * 100);

  return (
    <PanelFrame
      title="Dashboard Acceptance Checklist"
      tag="ACC"
      accent={ACCENT}
      mission="Dashboard acceptance checklist — build, startup, contract-load, no-hardcoded, no-raw-reads, no-cert-wording."
    >
      {/* Hero — dashboard-acceptance rule */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-xl border border-white/[0.06] p-5 sm:p-6"
      >
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 90% 10%, rgba(61,255,176,0.10), transparent 55%)",
          }}
        />
        <div className="relative flex items-start gap-4">
          <span
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border"
            style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}
          >
            <ListChecks className="h-5 w-5" style={{ color: ACCENT }} />
          </span>
          <div className="min-w-0">
            <div className="ive-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ive-proven)]/80">
              Dashboard Acceptance · Addendum
            </div>
            <p className="ive-mono mt-1.5 text-[11px] leading-relaxed text-foreground/85">
              Dashboard verification requires evidence of successful build, successful startup, successful loading of the
              frozen result contract, visible missing-state handling, no hardcoded benchmark or proof values, no direct
              component reads from raw pipeline artifacts, no unsupported certification wording.{" "}
              <span className="font-semibold text-foreground">
                A screenshot alone does not prove the dashboard is artifact-driven.
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pass-rate stat */}
      <div className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 flex-none items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(61,255,176,0.35)",
                  background: "rgba(61,255,176,0.10)",
                }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: "var(--ive-proven)" }} />
              </span>
              <div>
                <div className="ive-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  Acceptance Pass Rate
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="font-sans text-3xl font-extrabold tracking-tight"
                    style={{ color: "var(--ive-proven)" }}
                  >
                    {passed} / {total}
                  </span>
                  <span className="ive-mono text-[12px] font-semibold uppercase tracking-wider text-[var(--ive-proven)]">
                    Passed
                  </span>
                </div>
                <div className="ive-mono mt-0.5 text-[10px] text-muted-foreground/60">
                  all dashboard acceptance checks satisfied
                </div>
              </div>
            </div>
            <div className="w-full max-w-[260px]">
              <div className="ive-mono mb-1.5 flex items-center justify-between text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                <span>Progress</span>
                <span style={{ color: "var(--ive-proven)" }}>{passRate}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${passRate}%` }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(61,255,176,0.6), var(--ive-proven))",
                    boxShadow: "0 0 12px rgba(61,255,176,0.45)",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Acceptance checklist */}
      <div className="mt-6">
        <SectionLabel>Acceptance Checklist · {total} checks</SectionLabel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {DASHBOARD_ACCEPTANCE.map((check, i) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="ive-surface relative flex gap-3 overflow-hidden rounded-lg border border-white/[0.06] p-4"
            >
              <span
                className="absolute inset-y-0 left-0 w-1 flex-none"
                style={{ background: check.satisfied ? "var(--ive-proven)" : "var(--ive-blocked)" }}
                aria-hidden
              />
              <div className="ml-1 flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-none"
                      style={{ color: check.satisfied ? "var(--ive-proven)" : "var(--ive-blocked)" }}
                    />
                    <div className="min-w-0">
                      <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                        {check.id}
                      </div>
                      <div className="font-sans text-[12.5px] font-bold leading-tight text-foreground">
                        {check.requirement}
                      </div>
                    </div>
                  </div>
                  <StatusPill state={check.satisfied ? "PASS" : "FAIL"} accent={check.satisfied ? "var(--ive-proven)" : "var(--ive-blocked)"} />
                </div>
                <p className="ive-mono pl-6 text-[10px] leading-relaxed text-muted-foreground/75">
                  {check.evidence}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Evidence deep-dive */}
      <div className="mt-6">
        <SectionLabel>Evidence Deep-Dive · how each critical check is satisfied</SectionLabel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {DEEP_DIVES.map((dive, i) => {
            const Icon = dive.icon;
            return (
              <motion.div
                key={dive.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="ive-surface flex flex-col gap-2.5 rounded-lg border border-white/[0.06] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-md border"
                    style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: ACCENT }} />
                  </span>
                  <div className="min-w-0">
                    <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                      {dive.id}
                    </div>
                    <div className="font-sans text-[12px] font-bold leading-tight text-foreground">
                      {dive.title}
                    </div>
                  </div>
                </div>
                <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground">{dive.how}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Anti-pattern watchlist */}
      <div className="mt-6">
        <SectionLabel>Anti-Pattern Watchlist · what the dashboard must NOT do</SectionLabel>
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "rgba(255,77,95,0.25)", background: "rgba(255,77,95,0.04)" }}
        >
          <div className="ive-mono flex items-center gap-2 border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ borderColor: "rgba(255,77,95,0.2)", color: "var(--ive-blocked)" }}
          >
            <FileWarning className="h-3.5 w-3.5" />
            Forbidden Patterns
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,77,95,0.10)" }}>
            {ANTI_PATTERNS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-start gap-3 px-4 py-2.5"
                  style={{ borderColor: "rgba(255,77,95,0.10)" }}
                >
                  <XCircle className="mt-0.5 h-4 w-4 flex-none" style={{ color: "var(--ive-blocked)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-muted-foreground/70" />
                      <span className="text-[11.5px] font-semibold text-foreground">{p.label}</span>
                    </div>
                    <p className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/70">
                      {p.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-2.5 rounded-lg border border-white/[0.06] p-4">
          <Activity className="h-4 w-4 flex-none text-[var(--ive-proven)]/70" />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground">
            A screenshot alone does not prove the dashboard is artifact-driven. The acceptance checklist above is
            backed by inspectable source and live contract consumption.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
