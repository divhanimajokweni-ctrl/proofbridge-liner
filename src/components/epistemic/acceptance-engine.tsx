"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, ArrowDownRight, CheckCircle2, AlertTriangle, XCircle, Clock,
  Cpu, Shield, Hash as HashIcon, FileCheck, Signature, Scale, Layers,
  Database, Radio, Zap, Activity, ChevronDown, ChevronUp, Circle,
  RotateCcw, Timer, Gauge, TrendingDown, AlertOctagon, Copy, Ban,
  RefreshCw, AlertCircle, GitBranch, Binary,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SparkLine, DonutChart, MetricGauge, MiniBar } from "./chart-primitives";
import {
  StatusPill, Hash, StatCard, SeverityDot, SeverityBadge,
  GradientBorderCard, SectionHeader, TopAccentBar,
  containerVariants, cardVariants, itemVariants,
} from "./primitives";

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const pulseV: Variants = {
  pulse: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  idle: { scale: 1 },
};

/* ─── Helpers ─── */
function fmtTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function fmtMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
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

/* ─── Mock Data ─── */
const PIPELINE_STAGES = [
  { id: "incoming", name: "Incoming Fact", icon: Radio, status: "complete" as const, timeMs: 0.02, success: 14832, failure: 0 },
  { id: "canonicalize", name: "Canonicalize", icon: FileCheck, status: "complete" as const, timeMs: 0.15, success: 14830, failure: 2 },
  { id: "hash", name: "Hash", icon: HashIcon, status: "complete" as const, timeMs: 0.08, success: 14830, failure: 0 },
  { id: "schema", name: "Verify Schema", icon: Shield, status: "complete" as const, timeMs: 0.34, success: 14825, failure: 5 },
  { id: "signatures", name: "Verify Signatures", icon: Signature, status: "active" as const, timeMs: 1.12, success: 14810, failure: 15 },
  { id: "policies", name: "Evaluate Policies", icon: Scale, status: "idle" as const, timeMs: 2.87, success: 14780, failure: 30 },
  { id: "sequence", name: "Assign Sequence", icon: Layers, status: "idle" as const, timeMs: 0.03, success: 14780, failure: 0 },
  { id: "persist", name: "Persist", icon: Database, status: "idle" as const, timeMs: 3.41, success: 14778, failure: 2 },
  { id: "emit", name: "Emit Acceptance", icon: Zap, status: "idle" as const, timeMs: 0.11, success: 14778, failure: 0 },
];

const FACT_LIFECYCLE_STATES = [
  { id: "accepted", label: "Accepted", count: 14778, color: "verified", icon: CheckCircle2 },
  { id: "rejected", label: "Rejected", count: 234, color: "violating", icon: XCircle },
  { id: "superseded", label: "Superseded", count: 891, color: "repairing", icon: RotateCcw },
  { id: "expired", label: "Expired", count: 156, color: "quarantined", icon: Clock },
  { id: "compensated", label: "Compensated", count: 43, color: "repairing", icon: ArrowDownRight },
];

const FAILURE_FACTS = [
  { id: "FactRejected", count: 234, lastOccurrence: "2025-03-04T14:22:31Z", severity: "high" as const, description: "Fact failed policy evaluation or signature verification" },
  { id: "ProofExpired", count: 18, lastOccurrence: "2025-03-04T12:45:10Z", severity: "medium" as const, description: "Cryptographic proof exceeded validity window" },
  { id: "PolicyViolation", count: 89, lastOccurrence: "2025-03-04T15:01:47Z", severity: "critical" as const, description: "Fact violates one or more active policy invariants" },
  { id: "DuplicateFact", count: 312, lastOccurrence: "2025-03-04T15:03:22Z", severity: "low" as const, description: "Fact with identical canonical hash already persisted" },
  { id: "ReplayConflict", count: 7, lastOccurrence: "2025-03-04T09:17:55Z", severity: "high" as const, description: "Fact sequence conflicts with existing ordering" },
  { id: "ConsensusFailure", count: 3, lastOccurrence: "2025-03-03T22:34:12Z", severity: "critical" as const, description: "Cluster failed to reach consensus on fact ordering" },
  { id: "ProjectionFailure", count: 22, lastOccurrence: "2025-03-04T13:58:09Z", severity: "medium" as const, description: "Fact could not be projected onto target shard state" },
];

const CANONICALIZATION_EXAMPLE = {
  before: '{"name":"Alice","age":30,"timestamp":"2025-03-04T15:03:22Z","id":"f7a2b9"}',
  after:  '{"age":30,"id":"f7a2b9","name":"Alice","timestamp":"2025-03-04T15:03:22Z"}',
  hash:   "sha256:a4f7c2e91b3d8f6e0c5a7d2b4e6f8a1c3d5e7f9b2d4a6c8e0f2b4d6a8c0e2f4",
};

const SEQUENCE_DATA = {
  currentSequence: 14778,
  logicalTime: 9284471,
  vectorClock: [12, 8, 15, 3, 9],
  monotonicTime: "2025-03-04T15:03:22.4781291Z",
  epoch: 42,
};

const METRICS = {
  throughput: 247.3,
  throughputHistory: [232, 245, 251, 238, 260, 255, 270, 247],
  avgLatencyMs: 8.34,
  latencyHistory: [9.1, 8.7, 8.4, 9.2, 7.8, 8.1, 8.0, 8.3],
  rejectionRate: 0.0158,
  rejectionHistory: [0.016, 0.015, 0.014, 0.018, 0.015, 0.016, 0.013, 0.016],
  policyEvalMs: 2.87,
  policyEvalHistory: [3.1, 2.9, 2.8, 3.0, 2.7, 2.9, 2.8, 2.9],
};

/* ─── 1. Pipeline Visualization ─── */
function PipelineVisualization() {
  const [activeIdx, setActiveIdx] = useState(4); // "Verify Signatures" is active

  const statusConfig: Record<string, { bg: string; text: string; border: string; dotColor: string }> = {
    complete: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/30", dotColor: "bg-verified" },
    active: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/30", dotColor: "bg-repairing" },
    failed: { bg: "bg-violating/10", text: "text-violating", border: "border-violating/30", dotColor: "bg-violating" },
    idle: { bg: "bg-muted/20", text: "text-muted-foreground", border: "border-border/40", dotColor: "bg-muted-foreground" },
  };

  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.78 0.16 160 / 0.5), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Cpu} title="Acceptance Pipeline" extra={
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-repairing/30 bg-repairing/10 px-2.5 py-0.5 text-[10px] font-semibold text-repairing">
          <Activity className="h-3 w-3 animate-pulse" />
          PROCESSING
        </span>
      } />
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:block">
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const cfg = statusConfig[stage.status];
            const Icon = stage.icon;
            const isActive = stage.status === "active";
            return (
              <motion.div key={stage.id} variants={itemV} className="flex items-center shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => setActiveIdx(i)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 min-w-[100px] transition-colors ${cfg.border} ${cfg.bg} ${isActive ? "ring-2 ring-repairing/40" : ""}`}
                      animate={isActive ? { boxShadow: ["0 0 0px oklch(0.75 0.15 80 / 0)", "0 0 12px oklch(0.75 0.15 80 / 0.3)", "0 0 0px oklch(0.75 0.15 80 / 0)"] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="relative">
                        <Icon className={`h-4 w-4 ${cfg.text}`} />
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-repairing opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-repairing" />
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${cfg.text}`}>{stage.name}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{fmtMs(stage.timeMs)}</span>
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <span className="text-verified">{stage.success}</span>
                        {stage.failure > 0 && <span className="text-violating">·{stage.failure}</span>}
                      </div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">
                    <div className="space-y-0.5">
                      <div className="font-semibold">{stage.name}</div>
                      <div>Latency: {fmtMs(stage.timeMs)}</div>
                      <div>Success: {stage.success.toLocaleString()}</div>
                      {stage.failure > 0 && <div>Failed: {stage.failure.toLocaleString()}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-1 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      {/* Mobile: vertical flow */}
      <div className="lg:hidden space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
        {PIPELINE_STAGES.map((stage, i) => {
          const cfg = statusConfig[stage.status];
          const Icon = stage.icon;
          const isActive = stage.status === "active";
          return (
            <motion.div
              key={stage.id}
              variants={itemV}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${cfg.border} ${cfg.bg} ${isActive ? "ring-1 ring-repairing/40" : ""}`}
            >
              <div className="relative">
                <Icon className={`h-4 w-4 ${cfg.text}`} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-repairing opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-repairing" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${cfg.text}`}>{stage.name}</span>
                  <StatusPill status={stage.status === "active" ? "repairing" : stage.status === "complete" ? "verified" : "idle"} label={stage.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                  <span>{fmtMs(stage.timeMs)}</span>
                  <span className="text-border/50">·</span>
                  <span className="text-verified">✓{stage.success}</span>
                  {stage.failure > 0 && <span className="text-violating">✗{stage.failure}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 2. Fact Lifecycle Panel ─── */
function FactLifecyclePanel() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const transitions = [
    { from: "accepted", to: "rejected", label: "policy fail", color: "text-violating" },
    { from: "accepted", to: "superseded", label: "new version", color: "text-repairing" },
    { from: "accepted", to: "expired", label: "TTL", color: "text-quarantined" },
    { from: "rejected", to: "compensated", label: "undo", color: "text-repairing" },
    { from: "superseded", to: "expired", label: "TTL", color: "text-quarantined" },
  ];

  const totalFacts = FACT_LIFECYCLE_STATES.reduce((s, st) => s + st.count, 0);

  return (
    <Shell accent="linear-gradient(to right, oklch(0.65 0.22 25 / 0), oklch(0.75 0.15 80 / 0.4), oklch(0.65 0.22 25 / 0))">
      <H3 icon={GitBranch} title="Fact Lifecycle" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{totalFacts.toLocaleString()} total facts</span>
      } />
      {/* State diagram - desktop */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-center gap-2 py-4">
          {FACT_LIFECYCLE_STATES.map((state, i) => {
            const Icon = state.icon;
            const isHovered = hoveredState === state.id;
            return (
              <motion.div
                key={state.id}
                className="flex items-center gap-2"
                onMouseEnter={() => setHoveredState(state.id)}
                onMouseLeave={() => setHoveredState(null)}
              >
                <motion.div
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 min-w-[80px] cursor-pointer transition-colors
                    ${state.color === "verified" ? "border-verified/30 bg-verified/5" :
                      state.color === "violating" ? "border-violating/30 bg-violating/5" :
                      state.color === "repairing" ? "border-repairing/30 bg-repairing/5" :
                      "border-quarantined/30 bg-quarantined/5"}`}
                  animate={isHovered ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon className={`h-4 w-4 ${
                    state.color === "verified" ? "text-verified" :
                    state.color === "violating" ? "text-violating" :
                    state.color === "repairing" ? "text-repairing" :
                    "text-quarantined"
                  }`} />
                  <span className={`text-[10px] font-medium ${
                    state.color === "verified" ? "text-verified" :
                    state.color === "violating" ? "text-violating" :
                    state.color === "repairing" ? "text-repairing" :
                    "text-quarantined"
                  }`}>{state.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{state.count.toLocaleString()}</span>
                </motion.div>
                {i < FACT_LIFECYCLE_STATES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
        {/* Transition labels */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {transitions.map((t) => (
            <span key={`${t.from}-${t.to}`} className="text-[9px] text-muted-foreground">
              <span className="font-mono">{t.from}</span>
              <span className="mx-0.5">→</span>
              <span className="font-mono">{t.to}</span>
              <span className="ml-0.5 text-muted-foreground/60">({t.label})</span>
            </span>
          ))}
        </div>
      </div>
      {/* State list - mobile */}
      <div className="md:hidden space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {FACT_LIFECYCLE_STATES.map((state) => {
          const Icon = state.icon;
          const colorClass = state.color === "verified" ? "text-verified" :
            state.color === "violating" ? "text-violating" :
            state.color === "repairing" ? "text-repairing" : "text-quarantined";
          const bgClass = state.color === "verified" ? "bg-verified/10 border-verified/30" :
            state.color === "violating" ? "bg-violating/10 border-violating/30" :
            state.color === "repairing" ? "bg-repairing/10 border-repairing/30" : "bg-quarantined/10 border-quarantined/30";
          const pct = ((state.count / totalFacts) * 100).toFixed(1);
          return (
            <motion.div key={state.id} variants={itemV}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${bgClass}`}
            >
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${colorClass}`}>{state.label}</span>
                  <span className="text-xs font-mono font-semibold">{state.count.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      state.color === "verified" ? "bg-verified/60" :
                      state.color === "violating" ? "bg-violating/60" :
                      state.color === "repairing" ? "bg-repairing/60" : "bg-quarantined/60"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">{pct}%</span>
            </motion.div>
          );
        })}
      </div>
      {/* Note about projections */}
      <p className="mt-3 text-[10px] text-muted-foreground/70 italic">
        State transitions are projections over metadata — the original fact is never mutated.
      </p>
    </Shell>
  );
}

/* ─── 3. Canonicalizer Interface Panel ─── */
function CanonicalizerPanel() {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.75 0.15 80 / 0.4), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Binary} title="Canonicalizer Interface" extra={
        <div className="ml-auto flex items-center gap-2">
          <StatusPill status="verified" label="RFC8785 JSON" />
          <span className="text-[9px] text-muted-foreground">Future: CBOR</span>
        </div>
      } />

      {/* Interface definition */}
      <div className="rounded-md border border-border/40 bg-background/60 p-3 mb-3">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1.5">Interface</div>
        <pre className="text-[11px] font-mono text-verified/80 leading-relaxed">
{`interface Canonicalizer {
  serialize(): Uint8Array
  deserialize(bytes: Uint8Array): Fact
  hash(): FactID
}`}
        </pre>
      </div>

      {/* Live example */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Live Canonicalization</span>
          <button
            onClick={() => setShowAfter(!showAfter)}
            className="inline-flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-2.5 w-2.5" />
            {showAfter ? "Show Before" : "Show After"}
          </button>
        </div>

        <div className="rounded-md border border-border/40 bg-background/60 p-2.5 overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={showAfter ? "after" : "before"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">
                {showAfter ? "After (RFC8785 canonical)" : "Before (original JSON)"}
              </div>
              <pre className="text-[10px] font-mono leading-relaxed break-all whitespace-pre-wrap">
                {showAfter ? CANONICALIZATION_EXAMPLE.after : CANONICALIZATION_EXAMPLE.before}
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hash result */}
        <div className="flex items-center gap-2 rounded-md border border-verified/20 bg-verified/5 px-2.5 py-2">
          <HashIcon className="h-3.5 w-3.5 text-verified" />
          <span className="text-[9px] text-verified font-semibold shrink-0">SHA-256:</span>
          <Hash value={CANONICALIZATION_EXAMPLE.hash} length={40} className="text-verified/80" />
        </div>

        {/* Properties */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px]">
          <div className="rounded border border-border/30 bg-background/40 px-2 py-1.5 text-center">
            <div className="text-muted-foreground uppercase tracking-wide">Deterministic</div>
            <div className="mt-0.5 font-mono font-semibold text-verified">✓ Yes</div>
          </div>
          <div className="rounded border border-border/30 bg-background/40 px-2 py-1.5 text-center">
            <div className="text-muted-foreground uppercase tracking-wide">Encoding</div>
            <div className="mt-0.5 font-mono font-semibold">UTF-8</div>
          </div>
          <div className="rounded border border-border/30 bg-background/40 px-2 py-1.5 text-center">
            <div className="text-muted-foreground uppercase tracking-wide">Key Order</div>
            <div className="mt-0.5 font-mono font-semibold">Lexicographic</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ─── 4. Sequencer Panel ─── */
function SequencerPanel() {
  const { currentSequence, logicalTime, vectorClock, monotonicTime, epoch } = SEQUENCE_DATA;

  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.78 0.16 160 / 0.4), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Layers} title="Deterministic Sequencer" />

      {/* Ordering rule */}
      <div className="rounded-md border border-verified/20 bg-verified/5 px-3 py-2 mb-3">
        <div className="text-[9px] uppercase tracking-wide text-verified font-semibold mb-1">Total Order</div>
        <div className="font-mono text-xs text-foreground">
          Order = <span className="text-verified">LogicalSequence</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="text-repairing">Timestamp</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="text-quarantined">FactID</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Sequence #" value={currentSequence.toLocaleString()} color="text-verified" bg="bg-verified/5" border="border-verified/20" />
        <StatCard label="Logical Time" value={logicalTime.toLocaleString()} color="text-repairing" bg="bg-repairing/5" border="border-repairing/20" />
        <StatCard label="Epoch" value={epoch} color="text-quarantined" bg="bg-quarantined/5" border="border-quarantined/20" />
        <StatCard label="Facts/Epoch" value="352" bg="bg-muted/20" border="border-border/60" />
      </div>

      {/* Vector clock visualization */}
      <div className="space-y-2 mb-3">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Vector Clock</div>
        <div className="flex items-end gap-1.5">
          {vectorClock.map((val, i) => {
            const maxVal = Math.max(...vectorClock, 1);
            const heightPct = (val / maxVal) * 100;
            const color = i === 0 ? "bg-verified/70" : i === 1 ? "bg-repairing/70" : i === 2 ? "bg-quarantined/70" : i === 3 ? "bg-violating/70" : "bg-verified/50";
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[9px] font-mono text-muted-foreground">{val}</span>
                <div className="w-full max-w-[24px] rounded-sm bg-muted/20 overflow-hidden" style={{ height: 48 }}>
                  <motion.div
                    className={`w-full rounded-sm ${color}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[8px] font-mono text-muted-foreground/60">N{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monotonic time */}
      <div className="rounded-md border border-border/40 bg-background/60 px-2.5 py-2">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Monotonic Time</div>
        <div className="mt-0.5 font-mono text-xs font-semibold text-foreground truncate">{monotonicTime}</div>
      </div>
    </Shell>
  );
}

/* ─── 5. Failure Facts Panel ─── */
function FailureFactsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalFailures = FAILURE_FACTS.reduce((s, f) => s + f.count, 0);

  return (
    <Shell accent="linear-gradient(to right, oklch(0.65 0.22 25 / 0), oklch(0.65 0.22 25 / 0.4), oklch(0.65 0.22 25 / 0))">
      <H3 icon={AlertOctagon} title="Failure Facts" extra={
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-violating/30 bg-violating/10 px-2.5 py-0.5 text-[10px] font-semibold text-violating">
          <AlertTriangle className="h-3 w-3" />
          {totalFailures.toLocaleString()} failures
        </span>
      } />
      <p className="text-[10px] text-muted-foreground/70 italic mb-3">
        Errors are recorded as evidence facts — never thrown as exceptions.
      </p>
      <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
        {FAILURE_FACTS.map((fact) => {
          const isExpanded = expanded === fact.id;
          const severityColor = fact.severity === "critical" ? "text-violating" :
            fact.severity === "high" ? "text-repairing" :
            fact.severity === "medium" ? "text-quarantined" : "text-muted-foreground";
          return (
            <motion.div key={fact.id} variants={itemV}>
              <button
                onClick={() => setExpanded(isExpanded ? null : fact.id)}
                className={`w-full flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors
                  ${fact.severity === "critical" ? "border-violating/20 bg-violating/5 hover:bg-violating/10" :
                    fact.severity === "high" ? "border-repairing/20 bg-repairing/5 hover:bg-repairing/10" :
                    fact.severity === "medium" ? "border-quarantined/20 bg-quarantined/5 hover:bg-quarantined/10" :
                    "border-border/30 bg-muted/10 hover:bg-muted/20"}`}
              >
                <SeverityBadge severity={fact.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold">{fact.id}</span>
                  </div>
                </div>
                <span className={`text-xs font-mono font-semibold ${severityColor}`}>{fact.count}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 ml-4 border-l-2 border-border/30 text-[10px] text-muted-foreground space-y-1.5">
                      <p>{fact.description}</p>
                      <div className="flex items-center gap-3 font-mono">
                        <span>Last: {fmtTime(fact.lastOccurrence)}</span>
                        <span className={`font-semibold ${severityColor}`}>{fact.severity}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── 6. Acceptance Metrics Panel ─── */
function AcceptanceMetrics() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160 / 0), oklch(0.75 0.15 80 / 0.3), oklch(0.78 0.16 160 / 0))">
      <H3 icon={Gauge} title="Acceptance Metrics" extra={
        <span className="ml-auto inline-flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
          <Timer className="h-3 w-3" />
          last 5min
        </span>
      } />

      {/* Throughput */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Throughput</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono tabular-nums text-verified">{METRICS.throughput}</span>
            <span className="text-[10px] text-muted-foreground">facts/sec</span>
          </div>
        </div>
        <SparkLine data={METRICS.throughputHistory} width={280} height={40} fill color="verified" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Average latency */}
        <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Avg Latency</span>
            <span className="text-sm font-bold font-mono tabular-nums text-repairing">{fmtMs(METRICS.avgLatencyMs)}</span>
          </div>
          <SparkLine data={METRICS.latencyHistory} width={120} height={28} color="repairing" />
        </div>

        {/* Rejection rate */}
        <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Rejection Rate</span>
            <span className="text-sm font-bold font-mono tabular-nums text-violating">{(METRICS.rejectionRate * 100).toFixed(2)}%</span>
          </div>
          <SparkLine data={METRICS.rejectionHistory} width={120} height={28} color="violating" />
        </div>

        {/* Policy eval time */}
        <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Policy Eval</span>
            <span className="text-sm font-bold font-mono tabular-nums text-quarantined">{fmtMs(METRICS.policyEvalMs)}</span>
          </div>
          <SparkLine data={METRICS.policyEvalHistory} width={120} height={28} color="quarantined" />
        </div>

        {/* Acceptance donut */}
        <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2.5 flex flex-col items-center justify-center">
          <DonutChart
            data={[
              { label: "Accepted", value: 14778, color: "verified" },
              { label: "Rejected", value: 234, color: "violating" },
              { label: "Superseded", value: 891, color: "repairing" },
            ]}
            size={56}
            thickness={8}
            showLabels
          />
        </div>
      </div>

      {/* Pipeline latency breakdown */}
      <div className="mt-3">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Pipeline Latency Breakdown</div>
        <MiniBar
          data={PIPELINE_STAGES.filter(s => s.timeMs > 0).map(s => ({
            label: s.name.length > 8 ? s.name.slice(0, 7) + "…" : s.name,
            value: s.timeMs,
            color: s.status === "active" ? "repairing" : s.status === "complete" ? "verified" : "quarantined",
          }))}
          width={280}
          height={90}
          horizontal
        />
      </div>
    </Shell>
  );
}

/* ─── Main Section Component ─── */
export function AcceptanceEngineSection() {
  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="space-y-4">
      {/* Section header */}
      <motion.div variants={cardV}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10">
            <Shield className="h-4.5 w-4.5 text-verified" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Acceptance Engine</h2>
            <p className="text-xs text-muted-foreground">Deterministic acceptance pipeline — the kernel of the Epistemic Runtime</p>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Pipeline (full width) */}
      <motion.div variants={cardV}>
        <PipelineVisualization />
      </motion.div>

      {/* Row 2: Lifecycle + Sequencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <FactLifecyclePanel />
        </motion.div>
        <motion.div variants={cardV}>
          <SequencerPanel />
        </motion.div>
      </div>

      {/* Row 3: Canonicalizer + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <CanonicalizerPanel />
        </motion.div>
        <motion.div variants={cardV}>
          <AcceptanceMetrics />
        </motion.div>
      </div>

      {/* Row 4: Failure Facts (full width) */}
      <motion.div variants={cardV}>
        <FailureFactsPanel />
      </motion.div>
    </motion.div>
  );
}
