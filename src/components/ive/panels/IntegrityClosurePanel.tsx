"use client";

import { motion } from "framer-motion";
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileLock2,
  Hash,
  ListChecks,
  FileText,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard, MonoTable } from "../primitives";
import type { ChecksumEntry } from "@/lib/ive/release";
import {
  CHECKSUM_SPEC,
  LEDGER_ROOT_DESCRIPTION,
  CHECKSUM_ENTRIES,
} from "@/lib/ive/release";

interface IntegrityRule {
  label: string;
  detail: string;
  icon: LucideIcon;
}

const INTEGRITY_RULES: IntegrityRule[] = [
  {
    label: "Index excludes itself",
    detail: "The checksum index is not hashed into the checksum index.",
    icon: Ban,
  },
  {
    label: "Deterministic filename ordering",
    detail: "Entries are sorted lexicographically by path for reproducible output.",
    icon: ListChecks,
  },
  {
    label: "Safe filename handling",
    detail: "Paths are passed via null-delimited stream — no glob word-splitting.",
    icon: FileLock2,
  },
  {
    label: "Covers the authoritative manifest",
    detail: "submission_manifest.json is covered by the index.",
    icon: FileText,
  },
  {
    label: "Independent verification",
    detail: "A separate sha256sum -c pass must succeed against the generated index.",
    icon: ShieldCheck,
  },
  {
    label: "No post-checksum modification",
    detail: "No covered artifact may be modified after checksum generation.",
    icon: Lock,
  },
];

function StatusPillForEntry({ entry }: { entry: ChecksumEntry }) {
  const accent =
    entry.status === "COMPUTED" ? "var(--ive-proven)" : "var(--ive-gold)";
  return <StatusPill state={entry.status} accent={accent} />;
}

export function IntegrityClosurePanel() {
  const satisfied = CHECKSUM_SPEC.filter((s) => s.satisfied).length;
  const total = CHECKSUM_SPEC.length;
  const allSatisfied = satisfied === total;

  // Display-only — proof the panel reads the canonical store.
  const contractLedgerStatus = useIveStore((s) => s.contract.ledger_status);

  const rows = CHECKSUM_ENTRIES.map((e) => ({
    path: <span className="break-all text-foreground/85">{e.path}</span>,
    algorithm: <span className="text-muted-foreground">{e.algorithm}</span>,
    hash: (
      <span
        className="ive-mono text-[10px]"
        style={{
          color:
            e.hash === "REQUIRES VALIDATION" ? "var(--ive-gold)" : "var(--ive-foreground)",
        }}
      >
        {e.hash}
      </span>
    ),
    status: <StatusPillForEntry entry={e} />,
  }));

  return (
    <PanelFrame
      title="Integrity Closure"
      tag="INT"
      accent="#C9A84C"
      mission="Checksum index spec, ledger-root boundary, covered-artifact registry."
    >
      {/* ---- Stat row ---- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Spec Rules Satisfied"
          value={`${satisfied} / ${total}`}
          hint={
            allSatisfied
              ? "all checksum-spec rules discharged"
              : "one or more rules await independent verification"
          }
          status={allSatisfied ? "ok" : "warn"}
        />
        <StatCard
          label="Covered Artifacts"
          value={CHECKSUM_ENTRIES.length}
          hint="entries in the checksum index"
          accent="var(--ive-gold)"
        />
        <StatCard
          label="Algorithm"
          value="SHA-256"
          hint="every covered artifact hashed with sha256"
          status="ok"
        />
        <StatCard
          label="Independent Verify"
          value="REQUIRES VALIDATION"
          hint="sha256sum -c not executed in this env"
          status="warn"
        />
      </div>

      {/* ---- Checksum Index Specification ---- */}
      <div className="mt-6">
        <SectionLabel>Checksum Index Specification</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ive-gold)]/30"
                style={{ background: "rgba(201,168,76,0.10)" }}
              >
                <Hash className="h-4 w-4 text-[var(--ive-gold)]" />
              </span>
              <div>
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  Satisfied
                </div>
                <div
                  className="font-sans text-lg font-bold"
                  style={{
                    color: allSatisfied ? "var(--ive-proven)" : "var(--ive-gold)",
                  }}
                >
                  {satisfied} <span className="text-muted-foreground/50">/</span> {total}
                </div>
              </div>
            </div>
            <StatusPill
              state={allSatisfied ? "FULLY SATISFIED" : "PARTIAL — REQUIRES VALIDATION"}
              accent={allSatisfied ? "var(--ive-proven)" : "var(--ive-gold)"}
              pulse={!allSatisfied}
            />
          </div>

          <div className="flex flex-col gap-2">
            {CHECKSUM_SPEC.map((spec, i) => {
              const Icon = spec.satisfied ? CheckCircle2 : XCircle;
              const accent = spec.satisfied ? "var(--ive-proven)" : "var(--ive-blocked)";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3"
                >
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
                    style={{ borderColor: `${accent}40`, background: `${accent}10` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-foreground">
                        {spec.rule}
                      </span>
                      <span
                        className="ive-mono rounded border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          borderColor: `${accent}40`,
                          background: `${accent}10`,
                          color: accent,
                        }}
                      >
                        {spec.satisfied ? "SATISFIED" : "NOT SATISFIED"}
                      </span>
                    </div>
                    <div className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/75">
                      <span className="text-muted-foreground/55">evidence · </span>
                      {spec.evidence}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ---- Ledger Root Boundary ---- */}
      <div className="mt-7">
        <SectionLabel>Ledger Root Boundary</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-xl border border-[var(--ive-gold)]/30 p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.60) 70%)",
          }}
        >
          <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[var(--ive-gold)]/40"
              style={{ background: "rgba(201,168,76,0.12)" }}
            >
              <ShieldAlert className="h-6 w-6 text-[var(--ive-gold)]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ive-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--ive-gold)]/85">
                  Boundary Notice · Honest Description
                </span>
                <StatusPill state="INTERNAL ONLY" accent="var(--ive-gold)" />
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground">
                {LEDGER_ROOT_DESCRIPTION}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-[var(--ive-proven)]/20 bg-[var(--ive-proven)]/[0.05] p-2.5">
                  <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--ive-proven)]/85">
                    Internally Consistent
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-foreground/85">Within the submitted package.</div>
                </div>
                <div className="rounded-md border border-[var(--ive-blocked)]/20 bg-[var(--ive-blocked)]/[0.05] p-2.5">
                  <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--ive-blocked)]/85">
                    Not Externally Signed
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-foreground/85">Not anchored or co-signed.</div>
                </div>
                <div className="rounded-md border border-[var(--ive-blocked)]/20 bg-[var(--ive-blocked)]/[0.05] p-2.5">
                  <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--ive-blocked)]/85">
                    Not Immutable
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-foreground/85">Not independently authenticated.</div>
                </div>
              </div>
              <div className="ive-mono mt-3 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground/60">
                <Lock className="h-3 w-3" />
                <span>contract ledger_status: {contractLedgerStatus}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---- Covered Artifacts registry ---- */}
      <div className="mt-7">
        <SectionLabel>Covered Artifacts Registry</SectionLabel>
        <p className="ive-mono mb-3 max-w-[680px] text-[10.5px] leading-relaxed text-muted-foreground/75">
          Hash values are not fabricated. Every covered artifact is recorded as{" "}
          <span className="text-[var(--ive-gold)]">REQUIRES VALIDATION</span> until an
          independent sha256sum pass is executed in this environment.
        </p>
        <MonoTable
          cols={[
            { key: "path", label: "Path", className: "min-w-[180px]" },
            { key: "algorithm", label: "Algorithm", className: "w-[100px]" },
            { key: "hash", label: "Hash", className: "min-w-[200px]" },
            { key: "status", label: "Status", className: "w-[160px]" },
          ]}
          rows={rows}
        />
        <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
          <span>{CHECKSUM_ENTRIES.length} covered artifacts · algorithm: sha256</span>
          <span>hash column never fabricated — REQUIRES VALIDATION is the explicit missing state</span>
        </div>
      </div>

      {/* ---- Integrity rules mini-section ---- */}
      <div className="mt-7">
        <SectionLabel>Integrity Closure Rules</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRITY_RULES.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="ive-surface rounded-lg border border-white/[0.06] p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-md border border-[var(--ive-gold)]/30"
                    style={{ background: "rgba(201,168,76,0.10)" }}
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--ive-gold)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-foreground">
                      {rule.label}
                    </div>
                    <div className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/75">
                      {rule.detail}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ---- Closing note ---- */}
      <div className="mt-7">
        <SectionLabel>Closure Note</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-xl border border-white/[0.06] p-4 sm:p-5"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(15,15,24,0.55) 70%)",
          }}
        >
          <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex items-start gap-3">
            <span
              className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[var(--ive-gold)]/30"
              style={{ background: "rgba(201,168,76,0.10)" }}
            >
              <ShieldCheck className="h-4 w-4 text-[var(--ive-gold)]" />
            </span>
            <p className="text-[11.5px] leading-relaxed text-foreground/90">
              The checksum index is generated only after all release artifacts are finalized. No
              covered artifact may be modified after checksum generation.
            </p>
          </div>
        </motion.div>
      </div>
    </PanelFrame>
  );
}
