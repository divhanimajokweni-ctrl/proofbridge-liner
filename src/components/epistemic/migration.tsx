"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, ArrowDown, CheckCircle2, XCircle, GitBranch, Shield,
  Clock, AlertTriangle, Play, RotateCcw, Layers, Box, Eye,
  Scale, ShieldCheck, Cpu, Activity, Zap, Database, Server,
  ChevronDown, ChevronUp, FileCheck, Terminal, Workflow,
  ArrowDownRight, Circle, Sparkles, HardDrive, Gauge,
  Code2, GitCommit, Tag, Timer, Ban, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  StatusPill, Hash, StatCard, SeverityDot, SeverityBadge,
  GradientBorderCard, SectionHeader, TopAccentBar,
  containerVariants, cardVariants, itemVariants,
} from "./primitives";
import { SparkLine, MiniBar, DonutChart, MetricGauge, TimelineBar } from "./chart-primitives";

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 16, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const fadeV: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

/* ─── Helpers ─── */
function fmtTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

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

/* ─── Section Header ─── */
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

/* ─── Code Block ─── */
function CodeBlock({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`rounded-md border border-border/40 bg-muted/30 p-3 overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground ${className ?? ""}`}>
      <pre className="whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

/* ─── Invariant Banner ─── */
function InvariantBanner({ children, color = "verified" }: { children: React.ReactNode; color?: "verified" | "repairing" | "violating" | "quarantined" }) {
  const colorMap = {
    verified: "border-verified/30 bg-verified/5 text-verified",
    repairing: "border-repairing/30 bg-repairing/5 text-repairing",
    violating: "border-violating/30 bg-violating/5 text-violating",
    quarantined: "border-quarantined/30 bg-quarantined/5 text-quarantined",
  };
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${colorMap[color]}`}>
      <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ─── Mock Data ─── */
const PRIMITIVES = [
  { name: "Fact", desc: "What happened", icon: Box, color: "verified" as const, letter: "F" },
  { name: "Proof", desc: "Why we believe it", icon: ShieldCheck, color: "repairing" as const, letter: "P" },
  { name: "Policy", desc: "Whether to accept", icon: Scale, color: "quarantined" as const, letter: "Po" },
  { name: "Projection", desc: "How to consume", icon: Eye, color: "violating" as const, letter: "Pr" },
];

const INFRASTRUCTURE_ITEMS = [
  { name: "Git", icon: GitBranch },
  { name: "K8s", icon: Server },
  { name: "Argo", icon: Workflow },
  { name: "MMR", icon: HardDrive },
  { name: "ZK", icon: Shield },
  { name: "TEE", icon: Lock },
  { name: "CLI", icon: Terminal },
  { name: "Dashboard", icon: Gauge },
  { name: "Migration", icon: ArrowRight },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    name: "Plan Migration",
    factType: "MigrationPlanned",
    factKey: "migration_planned",
    icon: FileCheck,
    invariant: "The kernel never plans migrations. The adapter does.",
    status: "verified" as const,
  },
  {
    step: 2,
    name: "Execute Steps",
    factType: "MigrationCheckpointReached",
    factKey: "migration_checkpoint_reached",
    icon: Play,
    invariant: "The kernel never executes shell commands. The adapter does.",
    status: "verified" as const,
  },
  {
    step: 3,
    name: "Verify Migration",
    factType: "MigrationVerified",
    factKey: "migration_verified",
    icon: CheckCircle2,
    invariant: "The kernel never verifies state. The adapter does.",
    status: "verified" as const,
  },
  {
    step: 4,
    name: "Complete Migration",
    factType: "MigrationCompleted",
    factKey: "migration_completed",
    icon: Zap,
    invariant: "Completion is a Fact, not a side-effect.",
    status: "verified" as const,
  },
  {
    step: 5,
    name: "Update Projections",
    factType: "ProjectionUpdated",
    factKey: "projection_updated",
    icon: Eye,
    invariant: "Projections are derived from Facts, never from commands.",
    status: "repairing" as const,
  },
];

const MIGRATION_FACTS_TIMELINE = [
  { type: "migration_planned", label: "v0.7 → v0.8", time: "3h ago", color: "verified" as const },
  { type: "migration_checkpoint_reached", label: "schema migration", time: "2h ago", color: "repairing" as const },
  { type: "migration_checkpoint_reached", label: "policy update", time: "1.5h ago", color: "repairing" as const },
  { type: "migration_verified", label: "all checks passed", time: "1h ago", color: "verified" as const },
  { type: "migration_completed", label: "v0.8 deployed", time: "45m ago", color: "verified" as const },
];

const FAILURE_FACTS = [
  { type: "migration_failed", label: "schema conflict", time: "2d ago", recoverable: false, severity: "critical" as const },
  { type: "migration_failed", label: "timeout on shard rebalance", time: "5d ago", recoverable: true, severity: "high" as const },
  { type: "migration_rolled_back", label: "policy violation", time: "1w ago", recoverable: true, severity: "medium" as const },
];

const POLICY_VERSIONS = [
  { version: "v1.0", effectiveFrom: "2025-01-01", effectiveTo: "2025-06-30", status: "superseded" as const },
  { version: "v2.0", effectiveFrom: "2025-07-01", effectiveTo: "2026-03-15", status: "superseded" as const },
  { version: "v2.1", effectiveFrom: "2026-03-16", effectiveTo: "2027-01-01", status: "active" as const },
  { version: "v3.0", effectiveFrom: "2027-01-02", effectiveTo: null, status: "draft" as const },
];

const REGISTERED_PROJECTIONS = [
  { name: "Dashboard", version: "v2.3", status: "active" as const, registeredAt: "2025-12-01T10:00:00Z", deprecated: false },
  { name: "AuditTrail", version: "v1.8", status: "active" as const, registeredAt: "2025-11-15T08:30:00Z", deprecated: false },
  { name: "TrustScore", version: "v3.1", status: "active" as const, registeredAt: "2026-01-10T12:00:00Z", deprecated: false },
  { name: "LegacyDashboard", version: "v1.0", status: "deprecated" as const, registeredAt: "2025-06-01T09:00:00Z", deprecated: true },
  { name: "ComplianceReport", version: "v2.0", status: "active" as const, registeredAt: "2026-02-01T14:00:00Z", deprecated: false },
  { name: "AlertManager", version: "v1.2", status: "pending" as const, registeredAt: "2026-03-01T16:00:00Z", deprecated: false },
];

const ALIGNMENT_TABLE = [
  { requirement: "Migration as Facts", implementation: "`migration_*` Fact types", status: "aligned" as const },
  { requirement: "Failure as Facts", implementation: "`migration_failed` Fact", status: "aligned" as const },
  { requirement: "Acceptance Pipeline", implementation: "8-stage pipeline", status: "pending" as const },
  { requirement: "Policy Time Travel", implementation: "Evaluate at `fact.acceptedAt`", status: "pending" as const },
  { requirement: "Projection Versioning", implementation: "Versioned Projection Facts", status: "pending" as const },
  { requirement: "Deterministic Ordering", implementation: "LogicalSequence", status: "pending" as const },
  { requirement: "Canonical Serialization", implementation: "RFC 8785", status: "pending" as const },
  { requirement: "Kernel Never Shells Out", implementation: "Migration Adapter", status: "aligned" as const },
  { requirement: "Deprecation Not Kernel", implementation: "No `DeprecationEvent`", status: "aligned" as const },
];

/* ─── Lock icon (small inline) ─── */
function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─── 1. Four Primitive Invariant Panel ─── */
function FourPrimitivePanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.78 0.16 160 / 0.6), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Layers} title="Evidence Kernel Architecture" />

      {/* Main diagram */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-4">
        {/* Kernel header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verified/15 border border-verified/30">
            <ShieldCheck className="h-4 w-4 text-verified" />
          </div>
          <span className="text-sm font-bold tracking-wide text-foreground uppercase">Evidence Kernel</span>
        </div>

        {/* Four Primitives */}
        <div className="rounded-md border border-verified/20 bg-verified/5 p-3 mb-3">
          <div className="text-[10px] uppercase tracking-wider text-verified font-semibold mb-2 text-center">Four Immutable Primitives</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIMITIVES.map((p, i) => {
              const Icon = p.icon;
              const colorClasses: Record<string, string> = {
                verified: "border-verified/30 bg-verified/10 text-verified",
                repairing: "border-repairing/30 bg-repairing/10 text-repairing",
                quarantined: "border-quarantined/30 bg-quarantined/10 text-quarantined",
                violating: "border-violating/30 bg-violating/10 text-violating",
              };
              return (
                <motion.div
                  key={p.name}
                  variants={itemV}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-center ${colorClasses[p.color]}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className="text-[10px] opacity-70">{p.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-2">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="h-4 w-4 text-muted-foreground/60" />
          </motion.div>
        </div>

        {/* Infrastructure layer */}
        <div className="rounded-md border border-quarantined/20 bg-quarantined/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-quarantined font-semibold mb-2 text-center">Infrastructure (Replaceable)</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {INFRASTRUCTURE_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <span key={item.name} className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground hover:border-quarantined/30 hover:bg-quarantined/10 hover:text-quarantined transition-colors">
                  <Icon className="h-3 w-3" />
                  {item.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <InvariantBanner color="verified">
        The kernel never knows what deprecation means. It only knows Facts.
      </InvariantBanner>
    </Shell>
  );
}

/* ─── 2. Migration Adapter Flow Panel ─── */
function MigrationAdapterFlow() {
  const [activeStep, setActiveStep] = useState(2);
  return (
    <Shell accent="linear-gradient(to right, oklch(0.72 0.14 80 / 0), oklch(0.72 0.14 80 / 0.5), oklch(0.72 0.14 80 / 0))">
      <H3 icon={Workflow} title="Migration Adapter Flow" extra={
        <StatusPill status="verified" label="5-Step Pattern" className="ml-auto" />
      } />

      <div className="flex flex-col gap-2">
        {MIGRATION_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.step === activeStep;
          const isPast = step.step < activeStep;
          const statusColor = step.status === "verified" ? "verified" : "repairing";
          const colorClasses: Record<string, string> = {
            verified: "border-verified/30 bg-verified/5",
            repairing: "border-repairing/30 bg-repairing/5",
          };

          return (
            <motion.div
              key={step.step}
              variants={itemV}
              className={`relative flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                isActive
                  ? "border-verified/40 bg-verified/5 ring-1 ring-verified/20"
                  : colorClasses[statusColor]
              }`}
              onClick={() => setActiveStep(step.step)}
            >
              {/* Step number line */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                  isActive ? "border-verified bg-verified text-verified-foreground" : isPast ? "border-verified/30 bg-verified/10 text-verified" : "border-border bg-muted/30 text-muted-foreground"
                }`}>
                  {step.step}
                </div>
                {i < MIGRATION_STEPS.length - 1 && (
                  <div className="w-px h-4 bg-border/40 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-verified" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-mono text-quarantined">Emit: {step.factType}</span>
                  <StatusPill status={step.status === "verified" ? "verified" : "repairing"} className="ml-auto shrink-0" />
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1.5"
                    >
                      <InvariantBanner color={statusColor as "verified" | "repairing"}>
                        {step.invariant}
                      </InvariantBanner>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 3. Migration Facts Panel ─── */
function MigrationFactsPanel() {
  const [showFullInterface, setShowFullInterface] = useState(false);
  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.78 0.16 160 / 0.5), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Database} title="Migration Fact Types" extra={
        <button
          onClick={() => setShowFullInterface(!showFullInterface)}
          className="ml-auto inline-flex items-center gap-1 rounded border border-border/50 bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showFullInterface ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showFullInterface ? "Collapse" : "Full Interface"}
        </button>
      } />

      {/* TypeScript Interface */}
      <CodeBlock className="mb-3">
{showFullInterface ? `interface MigrationFact extends Fact {
  type:
    | 'migration_planned'
    | 'migration_started'
    | 'migration_checkpoint_reached'
    | 'migration_verified'
    | 'migration_completed'
    | 'migration_rolled_back'
    | 'migration_failed';
  payload: {
    fromVersion: string;
    toVersion: string;
    environment: string;
    component?: string;
    reason?: string;
    parentFactId?: string;
  };
}` : `interface MigrationFact extends Fact {
  type: 'migration_planned' | 'migration_started'
     | 'migration_checkpoint_reached'
     | 'migration_verified' | 'migration_completed'
     | 'migration_rolled_back' | 'migration_failed';
  payload: { fromVersion, toVersion, ... };
}`}
      </CodeBlock>

      {/* Timeline */}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Recent Migration Facts</div>
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {MIGRATION_FACTS_TIMELINE.map((fact, i) => {
          const colorClasses: Record<string, string> = {
            verified: "border-verified/20 bg-verified/5 text-verified",
            repairing: "border-repairing/20 bg-repairing/5 text-repairing",
          };
          return (
            <motion.div
              key={i}
              variants={itemV}
              className="flex items-center gap-2.5 rounded-md border border-border/30 bg-muted/10 px-2.5 py-1.5"
            >
              <div className={`h-2 w-2 rounded-full shrink-0 ${fact.color === "verified" ? "bg-verified" : "bg-repairing"}`} />
              <span className="font-mono text-[10px] text-quarantined shrink-0">{fact.type}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <span className="text-xs text-foreground shrink-0">{fact.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{fact.time}</span>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 4. Failure as Facts Panel ─── */
function FailureAsFactsPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.65 0.2 25 / 0), oklch(0.65 0.2 25 / 0.5), oklch(0.65 0.2 25 / 0))">
      <H3 icon={AlertTriangle} title="Failure as Facts" />

      {/* WRONG vs RIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* WRONG */}
        <div className="rounded-md border border-violating/30 bg-violating/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="h-3.5 w-3.5 text-violating" />
            <span className="text-[10px] uppercase tracking-wider text-violating font-bold">Wrong</span>
          </div>
          <CodeBlock>{`throw new Error('Migration failed')`}</CodeBlock>
          <p className="text-[10px] text-violating/70 mt-1.5">Exceptions bypass the fact log. Unrecoverable information loss.</p>
        </div>

        {/* RIGHT */}
        <div className="rounded-md border border-verified/30 bg-verified/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
            <span className="text-[10px] uppercase tracking-wider text-verified font-bold">Right</span>
          </div>
          <CodeBlock>{`interface FailureFact extends Fact {
  type: 'migration_failed';
  payload: { reason, recoverable };
}`}</CodeBlock>
          <p className="text-[10px] text-verified/70 mt-1.5">Failures are Facts. Replayable. Auditable. Recoverable.</p>
        </div>
      </div>

      {/* Invariant */}
      <InvariantBanner color="violating">
        The kernel never throws exceptions. It only appends Facts.
      </InvariantBanner>

      {/* Recent failure facts */}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-3 mb-2">Recent Failure Facts</div>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
        {FAILURE_FACTS.map((f, i) => {
          const severityClasses: Record<string, string> = {
            critical: "border-violating/20 bg-violating/5",
            high: "border-repairing/20 bg-repairing/5",
            medium: "border-quarantined/20 bg-quarantined/5",
          };
          return (
            <motion.div
              key={i}
              variants={itemV}
              className={`flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${severityClasses[f.severity]}`}
            >
              <SeverityDot severity={f.severity} />
              <span className="font-mono text-[10px] text-violating">{f.type}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-xs text-foreground">{f.label}</span>
              <span className="ml-auto flex items-center gap-2">
                {f.recoverable ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-repairing">
                    <RefreshCw className="h-2.5 w-2.5" /> recoverable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-violating">
                    <Ban className="h-2.5 w-2.5" /> unrecoverable
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{f.time}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 5. Policy Time Travel Panel ─── */
function PolicyTimeTravelPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.72 0.14 55 / 0), oklch(0.72 0.14 55 / 0.5), oklch(0.72 0.14 55 / 0))">
      <H3 icon={Clock} title="Policy Time Travel" />

      {/* WRONG vs CORRECT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* WRONG */}
        <div className="rounded-md border border-violating/30 bg-violating/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="h-3.5 w-3.5 text-violating" />
            <span className="text-[10px] uppercase tracking-wider text-violating font-bold">Wrong</span>
          </div>
          <CodeBlock>{`const policy = policyEngine.getCurrent()`}</CodeBlock>
          <p className="text-[10px] text-violating/70 mt-1.5">Evaluates historical facts against today&apos;s policies. Non-deterministic.</p>
        </div>

        {/* CORRECT */}
        <div className="rounded-md border border-verified/30 bg-verified/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
            <span className="text-[10px] uppercase tracking-wider text-verified font-bold">Correct</span>
          </div>
          <CodeBlock>{`const policy = policyEngine
  .getAtTime(fact.acceptedAt)`}</CodeBlock>
          <p className="text-[10px] text-verified/70 mt-1.5">Evaluates facts against the policy that was active when the fact was accepted.</p>
        </div>
      </div>

      {/* Invariant */}
      <InvariantBanner color="quarantined">
        Replaying 2026 migration facts with 2032 policies must produce identical results.
      </InvariantBanner>

      {/* Policy version timeline */}
      <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Policy Version Timeline</div>
      <div className="relative rounded-md border border-border/40 bg-muted/10 p-4 overflow-x-auto">
        {/* Timeline axis */}
        <div className="relative min-w-[400px]">
          {/* Axis line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border/60" />

          {/* Policy bars */}
          <div className="flex flex-col gap-2">
            {POLICY_VERSIONS.map((pv, i) => {
              const totalRange = new Date("2027-12-31").getTime() - new Date("2025-01-01").getTime();
              const start = new Date(pv.effectiveFrom).getTime();
              const end = pv.effectiveTo ? new Date(pv.effectiveTo).getTime() : new Date("2027-06-30").getTime();
              const leftPct = ((start - new Date("2025-01-01").getTime()) / totalRange) * 100;
              const widthPct = ((end - start) / totalRange) * 100;

              const barColors: Record<string, string> = {
                superseded: "bg-muted-foreground/20 border-muted-foreground/30",
                active: "bg-verified/20 border-verified/40",
                draft: "bg-repairing/15 border-repairing/30 border-dashed",
              };

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">{pv.version}</span>
                  <div className="relative flex-1 h-6">
                    <div
                      className={`absolute top-0 h-6 rounded border ${barColors[pv.status]}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                        {pv.effectiveFrom.slice(0, 7)} — {pv.effectiveTo ? pv.effectiveTo.slice(0, 7) : "…"}
                      </span>
                    </div>
                  </div>
                  <StatusPill
                    status={pv.status === "active" ? "verified" : pv.status === "draft" ? "repairing" : "idle"}
                    label={pv.status}
                    className="shrink-0"
                  />
                </div>
              );
            })}
          </div>

          {/* Year markers */}
          <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/50 font-mono">
            <span>2025</span>
            <span>2026</span>
            <span>2027</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ─── 6. Projection Versioning Panel ─── */
function ProjectionVersioningPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.68 0.12 300 / 0), oklch(0.68 0.12 300 / 0.5), oklch(0.68 0.12 300 / 0))">
      <H3 icon={Eye} title="Projection Versioning" />

      {/* Fact types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-md border border-verified/20 bg-verified/5 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-verified font-semibold mb-1">ProjectionRegistration</div>
          <CodeBlock>{`interface ProjectionRegistered
  extends Fact {
  type: 'projection_registered';
  payload: {
    name: string;
    version: string;
    factTypes: string[];
  };
}`}</CodeBlock>
        </div>
        <div className="rounded-md border border-quarantined/20 bg-quarantined/5 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-quarantined font-semibold mb-1">ProjectionDeprecated</div>
          <CodeBlock>{`interface ProjectionDeprecated
  extends Fact {
  type: 'projection_deprecated';
  payload: {
    name: string;
    version: string;
    successor?: string;
    reason: string;
  };
}`}</CodeBlock>
        </div>
      </div>

      {/* Invariant */}
      <InvariantBanner color="quarantined">
        Every projection has a version. Versions are Facts.
      </InvariantBanner>

      {/* Registered projections list */}
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-3 mb-2">Registered Projections</div>
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {REGISTERED_PROJECTIONS.map((proj, i) => {
          const statusMap: Record<string, { status: "verified" | "repairing" | "violating" | "quarantined" | "idle"; label: string }> = {
            active: { status: "verified", label: "Active" },
            deprecated: { status: "quarantined", label: "Deprecated" },
            pending: { status: "repairing", label: "Pending" },
          };
          const s = statusMap[proj.status] ?? { status: "idle" as const, label: proj.status };
          return (
            <motion.div
              key={i}
              variants={itemV}
              className="flex items-center gap-2.5 rounded-md border border-border/30 bg-muted/10 px-2.5 py-1.5"
            >
              {proj.deprecated ? (
                <RotateCcw className="h-3 w-3 text-quarantined shrink-0" />
              ) : (
                <Eye className="h-3 w-3 text-verified shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground">{proj.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{proj.version}</span>
              <span className="ml-auto flex items-center gap-2">
                <StatusPill status={s.status} label={s.label} className="shrink-0" />
                <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(proj.registeredAt)}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 7. Specification Alignment Table ─── */
function SpecificationAlignmentTable() {
  const alignedCount = ALIGNMENT_TABLE.filter((r) => r.status === "aligned").length;
  const pendingCount = ALIGNMENT_TABLE.filter((r) => r.status === "pending").length;

  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.78 0.16 160 / 0.5), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Scale} title="Specification Alignment" extra={
        <div className="ml-auto flex items-center gap-2">
          <StatusPill status="verified" label={`${alignedCount} Aligned`} />
          <StatusPill status="repairing" label={`${pendingCount} Pending`} />
        </div>
      } />

      <div className="overflow-x-auto rounded-md border border-border/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Specification Requirement</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Implementation</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {ALIGNMENT_TABLE.map((row, i) => (
              <motion.tr
                key={i}
                variants={itemV}
                className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors"
              >
                <td className="px-3 py-2 text-foreground font-medium">{row.requirement}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{row.implementation}</td>
                <td className="px-3 py-2 text-center">
                  {row.status === "aligned" ? (
                    <StatusPill status="verified" label="✅ Aligned" />
                  ) : (
                    <StatusPill status="repairing" label="🔜 Required" />
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Coverage</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-verified"
            initial={{ width: 0 }}
            animate={{ width: `${(alignedCount / ALIGNMENT_TABLE.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] font-mono text-verified">{Math.round((alignedCount / ALIGNMENT_TABLE.length) * 100)}%</span>
      </div>
    </Shell>
  );
}

/* ─── 8. Deterministic Ordering Panel ─── */
function DeterministicOrderingPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.72 0.14 200 / 0), oklch(0.72 0.14 200 / 0.5), oklch(0.72 0.14 200 / 0))">
      <H3 icon={Layers} title="Deterministic Ordering" />

      {/* Ordering function */}
      <CodeBlock className="mb-3">{`Order(f1, f2) = 
  compare(f1.logicalSequence, f2.logicalSequence) ||
  compare(f1.timestamp, f2.timestamp) ||
  compare(f1.factId, f2.factId)`}</CodeBlock>

      {/* Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="rounded-md border border-verified/20 bg-verified/5 p-2.5 text-center">
          <div className="text-[9px] uppercase tracking-wider text-verified font-semibold mb-1">1st: Logical Sequence</div>
          <div className="text-[10px] text-muted-foreground">Monotonically increasing counter assigned by the kernel</div>
        </div>
        <div className="rounded-md border border-repairing/20 bg-repairing/5 p-2.5 text-center">
          <div className="text-[9px] uppercase tracking-wider text-repairing font-semibold mb-1">2nd: Timestamp</div>
          <div className="text-[10px] text-muted-foreground">ISO 8601 with nanosecond precision</div>
        </div>
        <div className="rounded-md border border-quarantined/20 bg-quarantined/5 p-2.5 text-center">
          <div className="text-[9px] uppercase tracking-wider text-quarantined font-semibold mb-1">3rd: Fact ID</div>
          <div className="text-[10px] text-muted-foreground">Content-addressed hash as tiebreaker</div>
        </div>
      </div>

      {/* Invariant */}
      <InvariantBanner color="violating">
        No `Date.now()` in the acceptance pipeline.
      </InvariantBanner>

      {/* Anti-pattern warning */}
      <div className="mt-3 rounded-md border border-violating/20 bg-violating/5 p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <XCircle className="h-3 w-3 text-violating" />
          <span className="text-[10px] uppercase tracking-wider text-violating font-bold">Anti-Pattern</span>
        </div>
        <CodeBlock>{`// ❌ Non-deterministic
const fact = { ...data, timestamp: Date.now() };

// ✅ Deterministic
const fact = { ...data, timestamp: monotonicClock.now(),
  logicalSequence: kernel.nextSequence() };`}</CodeBlock>
      </div>
    </Shell>
  );
}

/* ─── Stats Row ─── */
function StatsRow() {
  return (
    <motion.div variants={cv} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <motion.div variants={cardV}>
        <StatCard label="Fact Types" value="7" color="text-verified" bg="bg-verified/5" border="border-verified/20" />
      </motion.div>
      <motion.div variants={cardV}>
        <StatCard label="Adapter Steps" value="5" color="text-repairing" bg="bg-repairing/5" border="border-repairing/20" />
      </motion.div>
      <motion.div variants={cardV}>
        <StatCard label="Spec Coverage" value="56%" color="text-quarantined" bg="bg-quarantined/5" border="border-quarantined/20" />
      </motion.div>
      <motion.div variants={cardV}>
        <StatCard label="Projections" value="6" color="text-violating" bg="bg-violating/5" border="border-violating/20" />
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function MigrationSection() {
  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={cv}
      initial="hidden"
      animate="visible"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <SectionHeader
          icon={GitBranch}
          title="Migration as Facts"
          subtitle="Migration is NOT a kernel concept — it is infrastructure that produces Facts"
          iconClass="border-verified/30 bg-verified/10 text-verified"
        />
      </div>

      {/* Stats */}
      <StatsRow />

      {/* Row 1: Kernel Architecture + Adapter Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <FourPrimitivePanel />
        </motion.div>
        <motion.div variants={cardV}>
          <MigrationAdapterFlow />
        </motion.div>
      </div>

      {/* Row 2: Migration Facts + Failure as Facts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <MigrationFactsPanel />
        </motion.div>
        <motion.div variants={cardV}>
          <FailureAsFactsPanel />
        </motion.div>
      </div>

      {/* Row 3: Policy Time Travel + Projection Versioning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <PolicyTimeTravelPanel />
        </motion.div>
        <motion.div variants={cardV}>
          <ProjectionVersioningPanel />
        </motion.div>
      </div>

      {/* Row 4: Specification Alignment + Deterministic Ordering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <SpecificationAlignmentTable />
        </motion.div>
        <motion.div variants={cardV}>
          <DeterministicOrderingPanel />
        </motion.div>
      </div>
    </motion.div>
  );
}
