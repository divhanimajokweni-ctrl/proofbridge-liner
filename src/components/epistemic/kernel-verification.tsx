"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  Play, Send, Hash, Signature, Fingerprint, Database, Clock, Cpu,
  KeyRound, Lock, FileCheck, Activity, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  StatusPill, StatCard, SectionHeader,
} from "./primitives";

/* ─── Types ─── */
interface Assertion {
  id: string;
  name: string;
  passed: boolean;
  details?: string;
}

interface ReplayCheck {
  factIdsMatch: boolean;
  canonicalBytesMatch: boolean;
  signaturesMatch: boolean;
  mmrRootsMatch: boolean;
  rootsMatch: boolean;
}

interface ReplayResult {
  deterministic: boolean;
  checks: ReplayCheck;
  assertions: Assertion[];
  projectionRoot1: string;
  projectionRoot2: string;
  verdict: string;
}

interface KernelData {
  version: string;
  status: string;
  verification: {
    passed: number;
    total: number;
    assertions: Assertion[];
  };
  runtime: {
    mmrRoot: string;
    currentSequence: number;
    factCount: number;
    projectionCount: number;
  };
  primitives: Record<string, string>;
  infrastructure: Record<string, string>;
  constitution: {
    rules: { id: number; text: string; status: string }[];
  };
}

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const fadeV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };

/* ─── Card Shell ─── */
function Shell({ children, accent, className }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm border-border/60 p-4 relative overflow-hidden ${className ?? ""}`}>
      {accent && <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: accent }} />}
      <div className="bg-grid-fine absolute inset-0 opacity-15" />
      <div className="relative">{children}</div>
    </Card>
  );
}

/* ─── Section Sub-header ─── */
function H3({ icon: Icon, title, extra }: { icon: typeof Activity; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
        <Icon className="h-3.5 w-3.5 text-verified" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {extra}
    </div>
  );
}

/* ─── Status Icon ─── */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "IMPLEMENTED":
    case "COMPLIANT":
    case "PASS":
      return <CheckCircle2 className="h-3.5 w-3.5 text-verified" />;
    case "PARTIAL":
    case "WARNING":
      return <AlertTriangle className="h-3.5 w-3.5 text-repairing" />;
    case "FAILED":
    case "NOT_IMPLEMENTED":
      return <XCircle className="h-3.5 w-3.5 text-violating" />;
    default:
      return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

/* ─── Status Color ─── */
function statusColor(status: string): string {
  switch (status) {
    case "IMPLEMENTED":
    case "COMPLIANT":
    case "PASS":
      return "text-verified";
    case "PARTIAL":
    case "WARNING":
      return "text-repairing";
    case "FAILED":
    case "NOT_IMPLEMENTED":
      return "text-violating";
    default:
      return "text-muted-foreground";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "IMPLEMENTED":
    case "COMPLIANT":
    case "PASS":
      return "bg-verified/10";
    case "PARTIAL":
    case "WARNING":
      return "bg-repairing/10";
    case "FAILED":
    case "NOT_IMPLEMENTED":
      return "bg-violating/10";
    default:
      return "bg-muted/20";
  }
}

/* ─── Infrastructure Label Map ─── */
const INFRA_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  acceptancePipeline: { label: "Acceptance Pipeline", icon: Activity },
  schemaRegistry: { label: "Schema Registry", icon: Database },
  deterministicSequencer: { label: "Sequencer", icon: Clock },
  mmr: { label: "MMR", icon: Hash },
  rfc8785: { label: "RFC 8785", icon: FileCheck },
  sha256: { label: "SHA-256", icon: Lock },
  ed25519: { label: "Ed25519", icon: KeyRound },
  wormStorage: { label: "WORM Storage", icon: Database },
  replayEngine: { label: "Replay Engine", icon: RefreshCw },
  policyEvaluator: { label: "Policy Engine", icon: ShieldCheck },
  projectionEngine: { label: "Projection Engine", icon: Cpu },
  redactionEngine: { label: "Redaction Engine", icon: ShieldAlert },
};

/* ─── Primitive Icons ─── */
const PRIMITIVE_META: Record<string, { icon: typeof Activity; desc: string }> = {
  fact: { icon: Fingerprint, desc: "Immutable, signed, sequenced evidence" },
  proof: { icon: Signature, desc: "Cryptographic ancestry & membership" },
  policy: { icon: ShieldCheck, desc: "Invariant enforcement rules" },
  projection: { icon: Cpu, desc: "State reduction from fact stream" },
};

/* ─── Constitution Rule Icons ─── */
const RULE_ICONS: Record<number, typeof Activity> = {
  1: Lock,
  2: ShieldAlert,
  3: ShieldCheck,
  4: Hash,
  5: FileCheck,
  6: KeyRound,
  7: Database,
};

/* ─── Fact Type Options ─── */
const FACT_TYPES = [
  "observation",
  "migration_plan",
  "migration_execute",
  "migration_verify",
  "migration_complete",
  "migration_rollback",
  "projection_registered",
  "projection_deprecated",
  "schema_change",
  "policy_change",
  "identity_change",
  "system",
];

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export function KernelVerificationSection() {
  const [data, setData] = useState<KernelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replay state
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);

  // Submit fact state
  const [factType, setFactType] = useState("observation");
  const [factBody, setFactBody] = useState('{"test": true}');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ accepted: boolean; fact?: { id: string; type: string; sequence: number; hash: string }; errors?: string[] } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch kernel data on mount
  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/kernel")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d: KernelData) => { if (alive) { setData(d); setLoading(false); } })
        .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    };
    load();
    return () => { alive = false; };
  }, []);

  // Refresh kernel data (used by replay/submit)
  const refreshKernel = useCallback(() => {
    fetch("/api/kernel")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: KernelData) => { setData(d); })
      .catch(() => {});
  }, []);

  // Replay verification
  const runReplay = useCallback(() => {
    setReplayLoading(true);
    setReplayError(null);
    setReplayResult(null);
    fetch("/api/kernel/verify")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ReplayResult) => {
        setReplayResult(d);
        setReplayLoading(false);
      })
      .catch((e) => {
        setReplayError(e.message);
        setReplayLoading(false);
      });
  }, []);

  // Submit test fact
  const submitFact = useCallback(() => {
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitResult(null);
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(factBody);
    } catch {
      setSubmitError("Invalid JSON in fact body");
      setSubmitLoading(false);
      return;
    }
    fetch("/api/kernel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: factType, factBody: parsedBody, submittedBy: "dashboard" }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setSubmitResult(d);
        setSubmitLoading(false);
        // Refresh kernel data to reflect new fact
        refreshKernel();
      })
      .catch((e) => {
        setSubmitError(e.message);
        setSubmitLoading(false);
      });
  }, [factType, factBody, refreshKernel]);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-verified/10 border border-verified/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-verified/60" />
          </div>
          <div className="absolute inset-0 rounded-lg animate-ping bg-verified/10 opacity-30" />
        </div>
        <span className="text-sm text-muted-foreground">Loading kernel verification…</span>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 rounded-lg bg-violating/10 border border-violating/20 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-violating" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-violating">Kernel Load Failed</p>
          <p className="text-xs text-muted-foreground mt-1">{error ?? "Unknown error"}</p>
        </div>
        <button
          type="button"
          onClick={refreshKernel}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const allPassed = data.verification.passed === data.verification.total;

  return (
    <div className="space-y-5">
      {/* ─── Section Header ─── */}
      <SectionHeader
        icon={ShieldCheck}
        title="Kernel Verification"
        subtitle="v0.8 Runtime — From hope to proof. From trust to verification."
        iconClass="border-verified/30 bg-verified/10 text-verified"
      />

      {/* ─── Top Status Banner ─── */}
      <motion.div variants={fadeV} initial="hidden" animate="visible">
        <div className={`flex items-center gap-3 rounded-lg border p-3 ${allPassed ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${allPassed ? "bg-verified/15" : "bg-violating/15"}`}>
            {allPassed ? (
              <ShieldCheck className="h-4 w-4 text-verified" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-violating" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold font-mono ${allPassed ? "text-verified" : "text-violating"}`}>
                {data.status}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">v{data.version}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allPassed
                ? "All kernel assertions pass. Runtime is in a verified state."
                : `${data.verification.total - data.verification.passed} assertion(s) failing. Runtime is degraded.`}
            </p>
          </div>
          <StatusPill status={allPassed ? "verified" : "violating"} label={data.status} />
        </div>
      </motion.div>

      {/* ─── Stat Cards Row ─── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" variants={cv} initial="hidden" animate="visible">
        <motion.div variants={cardV}>
          <StatCard
            label="Verification"
            value={`${data.verification.passed}/${data.verification.total}`}
            color={allPassed ? "text-verified" : "text-violating"}
            bg={allPassed ? "bg-verified/5" : "bg-violating/5"}
            border={allPassed ? "border-verified/20" : "border-violating/20"}
          />
        </motion.div>
        <motion.div variants={cardV}>
          <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">MMR Root</div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-foreground truncate" title={data.runtime.mmrRoot}>
              {data.runtime.mmrRoot.slice(0, 14)}…
            </div>
          </div>
        </motion.div>
        <motion.div variants={cardV}>
          <StatCard
            label="Fact Count"
            value={data.runtime.factCount}
            color="text-foreground"
          />
        </motion.div>
        <motion.div variants={cardV}>
          <StatCard
            label="Sequence"
            value={`#${data.runtime.currentSequence}`}
            color="text-foreground"
          />
        </motion.div>
      </motion.div>

      {/* ─── Main Grid ─── */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={cv} initial="hidden" animate="visible">

        {/* ── Assertions Card ── */}
        <motion.div variants={cardV}>
          <Shell accent={allPassed ? "oklch(0.78 0.16 160)" : "oklch(0.65 0.22 25)"}>
            <H3 icon={ShieldCheck} title="12 Assertions" extra={
              <span className={`ml-auto text-xs font-mono ${allPassed ? "text-verified" : "text-violating"}`}>
                {data.verification.passed}/{data.verification.total}
              </span>
            } />
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              <AnimatePresence>
                {data.verification.assertions.map((a, i) => (
                  <motion.div
                    key={a.id ?? i}
                    variants={itemV}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${a.passed ? "border-verified/20 bg-verified/5" : "border-violating/20 bg-violating/5"}`}
                  >
                    {a.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-violating shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 truncate">{a.name}</span>
                    <span className={`text-[9px] font-mono uppercase shrink-0 ${a.passed ? "text-verified" : "text-violating"}`}>
                      {a.passed ? "PASS" : "FAIL"}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Shell>
        </motion.div>

        {/* ── Primitives Card ── */}
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <H3 icon={Fingerprint} title="4 Primitives" extra={
              <span className="ml-auto text-xs font-mono text-verified">ALL IMPLEMENTED</span>
            } />
            <div className="space-y-2">
              {Object.entries(data.primitives).map(([key, status], i) => {
                const meta = PRIMITIVE_META[key];
                const Icon = meta?.icon ?? Activity;
                return (
                  <motion.div
                    key={key}
                    variants={itemV}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 rounded-md border border-verified/15 bg-verified/5 p-2.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verified/10 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-verified" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize">{key}</span>
                        <StatusIcon status={status} />
                        <span className={`text-[9px] font-mono uppercase ml-auto ${statusColor(status)}`}>{status}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{meta?.desc ?? ""}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Shell>
        </motion.div>

        {/* ── Infrastructure Card ── */}
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.72 0.14 170)">
            <H3 icon={Cpu} title="Infrastructure" extra={
              <span className="ml-auto text-xs font-mono text-verified">12/12</span>
            } />
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {Object.entries(data.infrastructure).map(([key, status], i) => {
                const meta = INFRA_LABELS[key];
                const Icon = meta?.icon ?? Activity;
                const label = meta?.label ?? key;
                return (
                  <motion.div
                    key={key}
                    variants={itemV}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-xs">{label}</span>
                    <StatusIcon status={status} />
                    <span className={`text-[9px] font-mono uppercase ${statusColor(status)}`}>{status.replace("_", " ")}</span>
                  </motion.div>
                );
              })}
            </div>
          </Shell>
        </motion.div>

        {/* ── Constitution Rules Card ── */}
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.75 0.12 140)">
            <H3 icon={Lock} title="Constitution Rules" extra={
              <span className="ml-auto text-xs font-mono text-verified">7/7 COMPLIANT</span>
            } />
            <div className="space-y-1.5">
              {data.constitution.rules.map((rule, i) => {
                const RuleIcon = RULE_ICONS[rule.id] ?? ShieldCheck;
                return (
                  <motion.div
                    key={rule.id}
                    variants={itemV}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 ${statusBg(rule.status)} border-verified/15`}
                  >
                    <RuleIcon className="h-3.5 w-3.5 text-verified shrink-0 mt-0.5" />
                    <span className="flex-1 text-xs leading-relaxed">{rule.text}</span>
                    <StatusIcon status={rule.status} />
                  </motion.div>
                );
              })}
            </div>
          </Shell>
        </motion.div>

        {/* ── Replay Verification Card ── */}
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.70 0.15 200)">
            <H3 icon={RefreshCw} title="Replay Verification" extra={
              replayResult ? (
                <span className={`ml-auto text-xs font-mono ${replayResult.deterministic ? "text-verified" : "text-violating"}`}>
                  {replayResult.deterministic ? "DETERMINISTIC" : "NONDETERMINISTIC"}
                </span>
              ) : undefined
            } />
            <p className="text-xs text-muted-foreground mb-3">
              Verify that replaying facts produces byte-identical output. The kernel must be deterministic.
            </p>

            {!replayResult && !replayLoading && !replayError && (
              <button
                type="button"
                onClick={runReplay}
                className="inline-flex items-center gap-1.5 rounded-md border border-verified/30 bg-verified/10 px-3 py-1.5 text-xs font-medium text-verified hover:bg-verified/20 transition-colors"
              >
                <Play className="h-3 w-3" /> Run Replay Verification
              </button>
            )}

            {replayLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Running replay verification…
              </div>
            )}

            {replayError && (
              <div className="rounded-md border border-violating/30 bg-violating/5 p-2.5">
                <p className="text-xs text-violating">{replayError}</p>
                <button
                  type="button"
                  onClick={runReplay}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}

            {replayResult && (
              <motion.div variants={fadeV} initial="hidden" animate="visible" className="space-y-2.5">
                {/* Verdict */}
                <div className={`rounded-md border p-2.5 ${replayResult.deterministic ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5"}`}>
                  <div className="flex items-center gap-2">
                    {replayResult.deterministic ? (
                      <CheckCircle2 className="h-4 w-4 text-verified" />
                    ) : (
                      <XCircle className="h-4 w-4 text-violating" />
                    )}
                    <span className={`text-xs font-semibold ${replayResult.deterministic ? "text-verified" : "text-violating"}`}>
                      {replayResult.verdict}
                    </span>
                  </div>
                </div>

                {/* Checks */}
                <div className="space-y-1">
                  {Object.entries(replayResult.checks).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {val ? (
                        <CheckCircle2 className="h-3 w-3 text-verified shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-violating shrink-0" />
                      )}
                      <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className={`ml-auto font-mono text-[10px] ${val ? "text-verified" : "text-violating"}`}>
                        {val ? "MATCH" : "MISMATCH"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Projection Roots */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Root 1</div>
                    <div className="font-mono text-[10px] text-foreground truncate">{replayResult.projectionRoot1}</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Root 2</div>
                    <div className="font-mono text-[10px] text-foreground truncate">{replayResult.projectionRoot2}</div>
                  </div>
                </div>

                {/* Replay Assertions */}
                {replayResult.assertions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Replay Assertions</div>
                    {replayResult.assertions.map((a, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${a.passed ? "text-verified" : "text-violating"}`}>
                        {a.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Re-run button */}
                <button
                  type="button"
                  onClick={runReplay}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Re-run
                </button>
              </motion.div>
            )}
          </Shell>
        </motion.div>

        {/* ── Submit Test Fact Card ── */}
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.72 0.14 90)">
            <H3 icon={Send} title="Submit Test Fact" />
            <p className="text-xs text-muted-foreground mb-3">
              Submit a test fact to the kernel and verify acceptance through the pipeline.
            </p>

            <div className="space-y-3">
              {/* Type Selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold block mb-1">
                  Fact Type
                </label>
                <select
                  value={factType}
                  onChange={(e) => setFactType(e.target.value)}
                  className="w-full rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-verified/40 focus:border-verified/40 transition-colors"
                >
                  {FACT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Fact Body */}
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold block mb-1">
                  Fact Body (JSON)
                </label>
                <textarea
                  value={factBody}
                  onChange={(e) => setFactBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-verified/40 focus:border-verified/40 transition-colors resize-none"
                  placeholder='{"key": "value"}'
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={submitFact}
                disabled={submitLoading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-verified/30 bg-verified/10 px-3 py-1.5 text-xs font-medium text-verified hover:bg-verified/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {submitLoading ? "Submitting…" : "Submit Fact"}
              </button>

              {/* Submit Error */}
              {submitError && (
                <div className="rounded-md border border-violating/30 bg-violating/5 p-2.5">
                  <p className="text-xs text-violating">{submitError}</p>
                </div>
              )}

              {/* Submit Result */}
              {submitResult && (
                <motion.div
                  variants={fadeV}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-md border p-2.5 ${submitResult.accepted ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5"}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {submitResult.accepted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-violating" />
                    )}
                    <span className={`text-xs font-semibold ${submitResult.accepted ? "text-verified" : "text-violating"}`}>
                      {submitResult.accepted ? "Fact Accepted" : "Fact Rejected"}
                    </span>
                  </div>
                  {submitResult.fact && (
                    <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                      <div>ID: <span className="text-foreground">{submitResult.fact.id}</span></div>
                      <div>Type: <span className="text-foreground">{submitResult.fact.type}</span></div>
                      <div>Sequence: <span className="text-foreground">#{submitResult.fact.sequence}</span></div>
                      <div>Hash: <span className="text-foreground truncate">{submitResult.fact.hash}</span></div>
                    </div>
                  )}
                  {submitResult.errors && submitResult.errors.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-violating">
                      {submitResult.errors.map((e, i) => <div key={i}>• {e}</div>)}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </Shell>
        </motion.div>

      </motion.div>

      {/* ─── Projections Summary ─── */}
      {data.runtime.projectionCount > 0 && (
        <motion.div variants={fadeV} initial="hidden" animate="visible">
          <Shell accent="oklch(0.75 0.12 160)">
            <H3 icon={Cpu} title="Active Projections" extra={
              <span className="ml-auto text-xs font-mono text-muted-foreground">{data.runtime.projectionCount} registered</span>
            } />
            <div className="text-xs text-muted-foreground">
              Projections consume the fact stream to derive state. The kernel guarantees deterministic projection replay.
            </div>
          </Shell>
        </motion.div>
      )}
    </div>
  );
}
