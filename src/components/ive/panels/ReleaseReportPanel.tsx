"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  OctagonAlert,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Scale,
  FileText,
  GitBranch,
  Clock,
  Hash,
  Cpu,
  Ban,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Printer,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard } from "../primitives";
import type { RequiredFix, Severity, PipelineRun } from "@/lib/ive/release";
import {
  REQUIRED_FIXES,
  DISPOSITION,
  DISPOSITION_RATIONALE,
  PIPELINE_RUNS,
  PIPELINE_PRESERVATION_RULES,
  LICENSE_STATUS,
} from "@/lib/ive/release";
import {
  generateReleaseReportMarkdown,
  downloadTextFile,
  copyToClipboard,
} from "@/lib/ive/export";

const SEVERITY_ACCENT: Record<Severity, string> = {
  BLOCKER: "var(--ive-blocked)",
  HIGH: "#CC7722",
  MEDIUM: "var(--ive-gold)",
  LOW: "#8b949e",
};

const RUN_ICON: LucideIcon = GitBranch;

function countBlocksSubmission(fixes: RequiredFix[]): number {
  return fixes.filter((f) => f.blocksSubmission).length;
}

function countBlockers(fixes: RequiredFix[]): number {
  return fixes.filter((f) => f.severity === "BLOCKER").length;
}

function SeverityPill({ severity }: { severity: Severity }) {
  const accent = SEVERITY_ACCENT[severity];
  return (
    <span
      className="ive-mono inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
      style={{ borderColor: `${accent}40`, background: `${accent}12`, color: accent }}
    >
      {severity}
    </span>
  );
}

function BlocksPill({ blocks }: { blocks: boolean }) {
  const accent = blocks ? "var(--ive-blocked)" : "#8b949e";
  const label = blocks ? "YES" : "NO";
  return (
    <span
      className="ive-mono inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ borderColor: `${accent}40`, background: `${accent}10`, color: accent }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {label}
    </span>
  );
}

function PipelineRunCard({ run, index }: { run: PipelineRun; index: number }) {
  const Icon = RUN_ICON;
  const accent = run.retained ? "var(--ive-proven)" : "var(--ive-pending)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="ive-surface relative overflow-hidden rounded-xl border border-white/[0.06] p-4"
    >
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent }}
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
              style={{ borderColor: `${accent}40`, background: `${accent}10` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
            </span>
            <span className="ive-mono text-[11px] font-semibold text-foreground">
              {run.runId}
            </span>
            {run.retained && (
              <StatusPill state="RETAINED" accent={accent} />
            )}
          </div>
          <div className="ive-mono mt-1 flex items-center gap-1.5 text-[9.5px] text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {run.timestamp}
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
          <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Target
          </div>
          <div className="mt-0.5 text-[11px] text-foreground/85">{run.target}</div>
        </div>
        <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
          <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Environment
          </div>
          <div className="mt-0.5 text-[11px] text-foreground/85">{run.environment}</div>
        </div>
        <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
          <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Source Commit
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-muted-foreground/50" />
            <span
              className="ive-mono text-[10px]"
              style={{
                color:
                  run.sourceCommit === "REQUIRES VALIDATION"
                    ? "var(--ive-blocked)"
                    : "var(--ive-foreground)",
              }}
            >
              {run.sourceCommit}
            </span>
          </div>
        </div>
        <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
          <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Config Hash
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-muted-foreground/50" />
            <span
              className="ive-mono text-[10px]"
              style={{
                color:
                  run.configHash === "REQUIRES VALIDATION"
                    ? "var(--ive-blocked)"
                    : "var(--ive-foreground)",
              }}
            >
              {run.configHash}
            </span>
          </div>
        </div>
      </div>
      <div className="ive-mono mt-2.5 flex items-start gap-1.5 rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5 text-[9.5px] leading-relaxed text-muted-foreground/80">
        <FileText className="mt-0.5 h-3 w-3 flex-none text-[var(--ive-gold)]/60" />
        <span>{run.note}</span>
      </div>
    </motion.div>
  );
}

export function ReleaseReportPanel() {
  // Pull run_id for the closing statement (display only).
  const contractRunId = useIveStore((s) => s.contract.run_id);
  const [copied, setCopied] = useState(false);

  const totalFixes = REQUIRED_FIXES.length;
  const blockers = countBlockers(REQUIRED_FIXES);
  const blockingSubmission = countBlocksSubmission(REQUIRED_FIXES);
  const nonBlocking = totalFixes - blockingSubmission;

  function handleExportMarkdown() {
    const md = generateReleaseReportMarkdown({
      disposition: DISPOSITION,
      rationale: DISPOSITION_RATIONALE,
      fixes: REQUIRED_FIXES,
      runId: String(contractRunId),
      generatedAt: new Date().toISOString(),
    });
    downloadTextFile(`ive-release-report-${Date.now()}.md`, md);
  }

  async function handleCopy() {
    const md = generateReleaseReportMarkdown({
      disposition: DISPOSITION,
      rationale: DISPOSITION_RATIONALE,
      fixes: REQUIRED_FIXES,
      runId: String(contractRunId),
      generatedAt: new Date().toISOString(),
    });
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <PanelFrame
      title="Release Report"
      tag="RR"
      accent="#ff4d5f"
      mission="Release-readiness report ending in exactly one disposition. Required-fixes table with severity and blocking."
      actions={
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            title="Copy report as markdown"
            aria-label="Copy release report as markdown"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[var(--ive-proven)]" />
                <span className="text-[var(--ive-proven)]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportMarkdown}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            title="Download report as markdown file"
            aria-label="Download release report as markdown"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">.md</span>
          </button>
          <button
            onClick={() => window.print()}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            title="Print / save as PDF"
            aria-label="Print release report"
          >
            <Printer className="h-3 w-3" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      }
    >
      {/* ---- Disposition hero banner ---- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-[var(--ive-blocked)]/25 p-5 sm:p-7"
        style={{ background: "linear-gradient(135deg, rgba(255,77,95,0.10), rgba(15,15,24,0.65) 70%)" }}
      >
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-25" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 15% 25%, rgba(255,77,95,0.18), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl border border-[var(--ive-blocked)]/40"
            style={{ background: "rgba(255,77,95,0.12)" }}
          >
            <OctagonAlert
              className="h-9 w-9 text-[var(--ive-blocked)]"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,77,95,0.45))" }}
            />
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="ive-mono flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--ive-blocked)]/85">
              <Ban className="h-3 w-3" />
              Final Disposition
            </div>
            <h1
              className="mt-1 font-sans text-4xl font-extrabold tracking-tight text-[var(--ive-blocked)] sm:text-5xl"
              style={{ textShadow: "0 0 22px rgba(255,77,95,0.30)" }}
            >
              {DISPOSITION}
            </h1>
            <p className="ive-mono mt-2 max-w-[680px] text-[11px] leading-relaxed text-muted-foreground">
              {DISPOSITION_RATIONALE}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <StatusPill state="Blocks Submission" accent="var(--ive-blocked)" pulse />
            <StatusPill state="Pipeline Retained" accent="var(--ive-proven)" />
          </div>
        </div>
      </motion.div>

      {/* ---- Stat row ---- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Fixes"
          value={totalFixes}
          hint="required-fix entries on the report"
          status="error"
        />
        <StatCard
          label="Blockers"
          value={blockers}
          hint="severity = BLOCKER"
          status="error"
        />
        <StatCard
          label="Blocking Submission"
          value={blockingSubmission}
          hint="blocksSubmission = true"
          status="error"
        />
        <StatCard
          label="Non-blocking"
          value={nonBlocking}
          hint="blocksSubmission = false"
          accent="#8b949e"
        />
      </div>

      {/* ---- Required fixes table ---- */}
      <div className="mt-6">
        <SectionLabel>Required Fixes</SectionLabel>
        <div className="ive-surface overflow-hidden rounded-xl border border-white/[0.06]">
          {/* Header (desktop only) */}
          <div className="hidden lg:grid grid-cols-[88px_92px_220px_minmax(0,1fr)_minmax(0,1fr)_120px] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">ID</div>
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Severity</div>
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Affected File / Component</div>
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Evidence</div>
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Minimum Action</div>
            <div className="ive-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Blocks Submission</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {REQUIRED_FIXES.map((fix, i) => {
              const accent = SEVERITY_ACCENT[fix.severity];
              return (
                <motion.div
                  key={fix.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="relative grid grid-cols-1 gap-2.5 px-4 py-3 transition-colors hover:bg-white/[0.015] lg:grid-cols-[88px_92px_220px_minmax(0,1fr)_minmax(0,1fr)_120px] lg:gap-3 lg:py-3.5"
                >
                  <span
                    className="absolute left-0 top-0 hidden h-full w-[2px] lg:block"
                    style={{ background: `${accent}80` }}
                  />
                  <div className="ive-mono flex items-center gap-2 text-[10.5px] font-semibold" style={{ color: accent }}>
                    {fix.id}
                  </div>
                  <div className="flex items-center">
                    <SeverityPill severity={fix.severity} />
                  </div>
                  <div className="ive-mono flex items-start gap-1.5 text-[10.5px] leading-relaxed text-foreground/90">
                    <FileText className="mt-0.5 h-3 w-3 flex-none text-muted-foreground/55" />
                    <span className="break-words">{fix.affectedFile}</span>
                  </div>
                  <div className="text-[10.5px] leading-relaxed text-muted-foreground">
                    {fix.evidence}
                  </div>
                  <div className="text-[10.5px] leading-relaxed text-foreground/75">
                    {fix.minimumAction}
                  </div>
                  <div className="flex items-center">
                    <BlocksPill blocks={fix.blocksSubmission} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
          <span>{REQUIRED_FIXES.length} required fixes · {blockers} BLOCKER · {blockingSubmission} blocking submission</span>
          <span>every fix carries severity, affected file, evidence, minimum action, and blocking flag</span>
        </div>
      </div>

      {/* ---- Pipeline execution preservation ---- */}
      <div className="mt-7">
        <SectionLabel>Pipeline Execution Preservation</SectionLabel>
        <p className="ive-mono mb-3 max-w-[680px] text-[10.5px] leading-relaxed text-muted-foreground/75">
          The pipeline is not rerun automatically. Existing executions are evaluated against the
          frozen release requirements first; rerun only if none satisfies them.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {PIPELINE_RUNS.map((run, i) => (
            <PipelineRunCard key={run.runId} run={run} index={i} />
          ))}
        </div>

        <div className="mt-4 ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
          <div className="ive-mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ive-gold)]/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            Preservation Rules
          </div>
          <ol className="flex flex-col gap-2">
            {PIPELINE_PRESERVATION_RULES.map((rule, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] p-2.5"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--ive-proven)]" />
                <span className="ive-mono text-[10px] font-semibold text-[var(--ive-gold)]/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[10.5px] leading-relaxed text-foreground/85">{rule}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>

      {/* ---- License handling ---- */}
      <div className="mt-7">
        <SectionLabel>License Handling</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-xl border border-[var(--ive-blocked)]/25 p-5"
          style={{ background: "rgba(255,77,95,0.04)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-[var(--ive-blocked)]/40"
                style={{ background: "rgba(255,77,95,0.10)" }}
              >
                <Scale className="h-5 w-5 text-[var(--ive-blocked)]" />
              </span>
              <div>
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  License State
                </div>
                <div className="font-sans text-lg font-bold text-[var(--ive-blocked)]">
                  {LICENSE_STATUS.state}
                </div>
              </div>
            </div>
            <StatusPill state="Awaiting Owner" accent="var(--ive-blocked)" pulse />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                Detail
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                {LICENSE_STATUS.detail}
              </p>
            </div>
            <div className="rounded-md border border-[var(--ive-gold)]/15 bg-[var(--ive-gold)]/[0.04] p-3">
              <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--ive-gold)]/80">
                Action
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-foreground/85">
                {LICENSE_STATUS.action}
              </p>
            </div>
          </div>
          <div className="ive-mono mt-3 flex items-start gap-2 rounded-md border border-[var(--ive-gold)]/15 bg-[var(--ive-gold)]/[0.04] p-2.5 text-[9.5px] leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-none text-[var(--ive-gold)]" />
            <span>
              Do not select or fabricate a software license without authorization from the
              repository owner.
            </span>
          </div>
        </motion.div>
      </div>

      {/* ---- Closing statement ---- */}
      <div className="mt-7">
        <SectionLabel>Closing Statement</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-xl border border-white/[0.08] p-5 sm:p-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,77,95,0.05), rgba(15,15,24,0.55) 60%)",
          }}
        >
          <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-25" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[var(--ive-blocked)]/40"
              style={{ background: "rgba(255,77,95,0.10)" }}
            >
              <ShieldAlert className="h-6 w-6 text-[var(--ive-blocked)]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="ive-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ive-blocked)]/85">
                Disposition · Closing
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">
                Disposition: <span className="font-bold text-[var(--ive-blocked)]">NO-GO</span>.
                Three BLOCKER required fixes must be resolved. The existing pipeline execution is
                retained; this is a packaging/integration gap, not a pipeline rejection or
                architecture redesign.
              </p>
              <div className="ive-mono mt-3 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground/70">
                <Lock className="h-3 w-3" />
                <span>contract run_id: {contractRunId}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>fixes: {totalFixes} total · {blockers} BLOCKER · {blockingSubmission} blocking</span>
                <span className="text-muted-foreground/40">·</span>
                <span>pipeline runs retained: {PIPELINE_RUNS.filter((r) => r.retained).length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PanelFrame>
  );
}
