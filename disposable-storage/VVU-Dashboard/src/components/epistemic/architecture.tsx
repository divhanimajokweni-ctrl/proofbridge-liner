"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Layers, Box, ShieldCheck, FileCheck, Scale, Eye, ArrowDown,
  ArrowRight, ArrowLeft, CheckCircle2, Clock, AlertTriangle, XCircle,
  Cpu, GitBranch, KeyRound, Activity, Zap, Lock, Server,
  ChevronDown, ChevronUp, RotateCcw, Binary, Workflow, Cuboid,
  Network, HardDrive, Gauge, Puzzle, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  StatusPill, StatCard, GradientBorderCard, SectionHeader,
  containerVariants, cardVariants, itemVariants, TopAccentBar,
} from "./primitives";
import { RadarGrid, SparkLine, DonutChart, MetricGauge } from "./chart-primitives";

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 16, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const fadeV: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

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
const PRIMITIVES = [
  {
    name: "Fact",
    definition: "What happened",
    icon: Box,
    color: "var(--verified)",
    colorClass: "text-verified",
    bgClass: "bg-verified/10",
    borderClass: "border-verified/30",
    properties: ["Immutable record", "Content-addressed", "Append-only log"],
    relations: ["→ Proof validates", "→ Policy accepts/rejects", "→ Projection consumes"],
  },
  {
    name: "Proof",
    definition: "Why we believe it",
    icon: ShieldCheck,
    color: "var(--repairing)",
    colorClass: "text-repairing",
    bgClass: "bg-repairing/10",
    borderClass: "border-repairing/30",
    properties: ["Cryptographic signature", "Verifier identity", "Ed25519 / post-quantum"],
    relations: ["← Fact attested", "→ Policy gates on", "→ Identity derived"],
  },
  {
    name: "Policy",
    definition: "Whether it should be accepted",
    icon: Scale,
    color: "var(--quarantined)",
    colorClass: "text-quarantined",
    bgClass: "bg-quarantined/10",
    borderClass: "border-quarantined/30",
    properties: ["Deterministic rules", "Emits correction facts", "Version-controlled"],
    relations: ["← Fact evaluated", "← Proof verified", "→ Correction Fact → Projection"],
  },
  {
    name: "Projection",
    definition: "How humans consume it",
    icon: Eye,
    color: "var(--violating)",
    colorClass: "text-violating",
    bgClass: "bg-violating/10",
    borderClass: "border-violating/30",
    properties: ["Derived state", "View functions", "Consumer-specific"],
    relations: ["← Fact stream", "← Policy output", "→ Application API"],
  },
];

const CORE_INSIGHTS = [
  {
    title: "Primitives are Orthogonal",
    description: "No overlap between Fact, Proof, Policy, Projection — each has a single, well-defined concern.",
    icon: Puzzle,
    status: "verified" as const,
  },
  {
    title: "State is Derived",
    description: "State(t) = Projection(…), not State += mutation. No in-place updates — every view is recomputed from facts.",
    icon: RotateCcw,
    status: "verified" as const,
  },
  {
    title: "Policies Emit Facts",
    description: "Policy → Correction Fact → Projection. Everything observable flows through the fact log.",
    icon: Zap,
    status: "verified" as const,
  },
  {
    title: "Identity is Derived",
    description: "Proof → Verifier → Public Key → Identity. No separate identity layer — trust is cryptographic.",
    icon: KeyRound,
    status: "repairing" as const,
  },
  {
    title: "Deprecation Is Not Kernel",
    description: "The kernel never knows what deprecation means. It only knows Facts. Deprecation, migration, and lifecycle management are all infrastructure that produce Facts. This keeps the kernel minimal and stable.",
    icon: Binary,
    status: "verified" as const,
  },
];

const ARCHITECTURE_LAYERS = [
  { label: "Applications", icon: Cuboid, color: "var(--violating)", sub: [] },
  { label: "Projection API", icon: Eye, color: "var(--violating)", sub: [] },
  { label: "Projection Engine", icon: Workflow, color: "var(--violating)", sub: [] },
  { label: "Fact Log", icon: HardDrive, color: "var(--verified)", sub: [] },
  {
    label: "Acceptance Engine", icon: ShieldCheck, color: "var(--quarantined)",
    sub: ["Canonicalizer", "Proof Engine", "Policy Engine", "Sequencer", "Persistence"],
  },
  { label: "Adapters", icon: Network, color: "var(--repairing)", sub: ["Git", "K8s", "Argo", "CLI", "API", "Migration Adapter"] },
  { label: "External Systems", icon: Server, color: "var(--repairing)", sub: [] },
];

const GAPS = [
  { id: 1, name: "Acceptance Pipeline", description: "Full pipeline for fact acceptance with canonicalization, proof, and policy checks", status: "in-progress" as const, priority: "Critical" as const, impact: "Blocks v1.0 — core correctness" },
  { id: 2, name: "Fact Status/Lifecycle", description: "State machine for fact lifecycle: proposed → accepted → projected → archived", status: "in-progress" as const, priority: "Critical" as const, impact: "Required for audit compliance" },
  { id: 3, name: "Deterministic Ordering", description: "Guarantee same ordering across all nodes given same facts", status: "in-progress" as const, priority: "High" as const, impact: "Consistency guarantee" },
  { id: 4, name: "Canonical Serialization Interface", description: "Deterministic byte-level serialization for content addressing", status: "planned" as const, priority: "High" as const, impact: "Cross-node verification" },
  { id: 5, name: "Projection Versioning", description: "Version projection functions for reproducible state derivation", status: "planned" as const, priority: "High" as const, impact: "Audit & replay correctness" },
  { id: 6, name: "Policy Time Travel", description: "Evaluate facts against policy at any historical point-in-time", status: "planned" as const, priority: "Medium" as const, impact: "Compliance & debugging" },
  { id: 7, name: "Proof Aggregation (Graph)", description: "Construct and traverse proof dependency DAG for batch verification", status: "planned" as const, priority: "Medium" as const, impact: "Performance at scale" },
  { id: 8, name: "Snapshot Semantics", description: "Define what constitutes a consistent snapshot across shards", status: "planned" as const, priority: "Medium" as const, impact: "Backup & migration" },
  { id: 9, name: "Distributed Consensus Interface", description: "Pluggable consensus for multi-node fact ordering", status: "planned" as const, priority: "Low" as const, impact: "Multi-region deployments" },
  { id: 10, name: "Failure Facts", description: "Represent infrastructure failures as first-class facts in the log", status: "in-progress" as const, priority: "Low" as const, impact: "Observability & healing" },
];

const REPLACEABLE = [
  { current: "SHA-256", future: "BLAKE3", area: "Hashing", reason: "Faster, parallelizable" },
  { current: "Ed25519", future: "Post-quantum sigs", area: "Signatures", reason: "Quantum resistance" },
  { current: "MMR", future: "Verkle", area: "Merkle structure", reason: "Smaller proofs" },
  { current: "Kubernetes", future: "Nomad", area: "Orchestration", reason: "Simpler ops" },
  { current: "Git", future: "Perforce", area: "Source control", reason: "Large mono-repos" },
  { current: "Argo", future: "Flux", area: "GitOps", reason: "CNCF native" },
];

const ASSESSMENT = [
  { area: "Conceptual model", score: 95, rating: "Excellent" as const },
  { area: "Separation of concerns", score: 95, rating: "Excellent" as const },
  { area: "Event sourcing", score: 92, rating: "Excellent" as const },
  { area: "Replayability", score: 90, rating: "Excellent" as const },
  { area: "Cryptographic model", score: 75, rating: "Good" as const },
  { area: "Distributed systems", score: 35, rating: "Incomplete" as const },
  { area: "Version evolution", score: 30, rating: "Incomplete" as const },
  { area: "Storage model", score: 25, rating: "Incomplete" as const },
  { area: "Concurrency", score: 10, rating: "Missing" as const },
  { area: "Production readiness", score: 82, rating: "Good" as const },
];

/* ─── Rating Color Helper ─── */
function ratingColor(rating: string) {
  switch (rating) {
    case "Excellent": return { text: "text-verified", bg: "bg-verified/10", border: "border-verified/30" };
    case "Good": return { text: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/30" };
    case "Incomplete": return { text: "text-quarantined", bg: "bg-quarantined/10", border: "border-quarantined/30" };
    case "Missing": return { text: "text-violating", bg: "bg-violating/10", border: "border-violating/30" };
    default: return { text: "text-muted-foreground", bg: "bg-muted", border: "border-border/40" };
  }
}

function statusColor(status: string) {
  switch (status) {
    case "in-progress": return { text: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/30", icon: Clock };
    case "planned": return { text: "text-quarantined", bg: "bg-quarantined/10", border: "border-quarantined/30", icon: AlertTriangle };
    case "done": return { text: "text-verified", bg: "bg-verified/10", border: "border-verified/30", icon: CheckCircle2 };
    default: return { text: "text-muted-foreground", bg: "bg-muted", border: "border-border/40", icon: Clock };
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case "Critical": return "text-violating";
    case "High": return "text-repairing";
    case "Medium": return "text-quarantined";
    case "Low": return "text-muted-foreground";
    default: return "text-muted-foreground";
  }
}

/* ═══════════════════════════════════════════════════
   1. Four Primitives Panel
   ═══════════════════════════════════════════════════ */
function FourPrimitivesPanel() {
  return (
    <Shell accent="linear-gradient(to right, var(--verified)00, var(--verified)80, var(--verified)00)">
      <H3 icon={Box} title="Four Orthogonal Primitives" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">core ontology</span>
      } />
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        The runtime is built on four <span className="font-semibold text-foreground">orthogonal</span> primitives — each has a single, non-overlapping concern that composes into the full epistemic pipeline.
      </p>

      {/* Primitive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {PRIMITIVES.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.name} variants={cardV} className="relative">
              <GradientBorderCard
                gradient={`from-verified/30 via-repairing/20 to-violating/20`}
                className="h-full"
              >
                <div className="p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.bgClass} border ${p.borderClass}`}>
                      <Icon className={`h-4 w-4 ${p.colorClass}`} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{p.name}</div>
                      <div className={`text-[10px] font-mono ${p.colorClass}`}>{p.definition}</div>
                    </div>
                  </div>

                  {/* Properties */}
                  <div className="space-y-1">
                    {p.properties.map((prop) => (
                      <div key={prop} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className={`inline-block h-1 w-1 rounded-full ${p.bgClass}`} />
                        {prop}
                      </div>
                    ))}
                  </div>

                  {/* Relations */}
                  <div className="border-t border-border/40 pt-2 space-y-0.5">
                    {p.relations.map((rel) => (
                      <div key={rel} className="text-[9px] font-mono text-muted-foreground/70">{rel}</div>
                    ))}
                  </div>
                </div>
              </GradientBorderCard>
            </motion.div>
          );
        })}
      </div>

      {/* Flow Diagram */}
      <div className="flex items-center justify-center gap-1 flex-wrap py-3 px-2 rounded-lg bg-background/40 border border-border/30">
        {PRIMITIVES.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="flex items-center gap-1">
              <motion.div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${p.borderClass} ${p.bgClass}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Icon className={`h-3.5 w-3.5 ${p.colorClass}`} />
                <span className={`text-xs font-semibold ${p.colorClass}`}>{p.name}</span>
              </motion.div>
              {i < PRIMITIVES.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
        <div className="ml-2 text-[9px] text-muted-foreground font-mono">→ loop: Policy → Correction Fact → Projection</div>
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   2. Core Insights Panel
   ═══════════════════════════════════════════════════ */
function CoreInsightsPanel() {
  return (
    <Shell accent="linear-gradient(to right, var(--repairing)00, var(--repairing)80, var(--repairing)00)">
      <H3 icon={Sparkles} title="Core Architecture Insights" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">what&apos;s exceptionally good</span>
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CORE_INSIGHTS.map((insight, i) => {
          const Icon = insight.icon;
          const statusCfg = insight.status === "verified"
            ? { bg: "bg-verified/10", border: "border-verified/30", text: "text-verified", icon: CheckCircle2, label: "Proven" }
            : { bg: "bg-repairing/10", border: "border-repairing/30", text: "text-repairing", icon: Clock, label: "Evolving" };
          const StatusIcon = statusCfg.icon;
          return (
            <motion.div key={insight.title} variants={cardV}>
              <div className={`rounded-lg border ${statusCfg.border} ${statusCfg.bg} p-3 space-y-2`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${statusCfg.text}`} />
                  <span className="text-xs font-semibold">{insight.title}</span>
                  <span className={`ml-auto inline-flex items-center gap-1 text-[9px] font-semibold ${statusCfg.text}`}>
                    <StatusIcon className="h-3 w-3" />{statusCfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Kernel Invariant Callout */}
      <div className="mt-4 rounded-lg border-2 border-verified/50 bg-verified/5 dark:bg-verified/10 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-verified/0 via-verified to-verified/0" />
        <div className="flex items-center gap-2 mb-2">
          <Binary className="h-4 w-4 text-verified" />
          <span className="text-xs font-bold uppercase tracking-wider text-verified">The Kernel Invariant</span>
        </div>
        <div className="space-y-1.5 text-[11px] leading-relaxed">
          <p className="text-foreground font-medium">
            The kernel may only know <span className="font-mono font-bold text-verified">immutable facts</span>, <span className="font-mono font-bold text-verified">immutable policies</span>, <span className="font-mono font-bold text-verified">immutable proofs</span>, <span className="font-mono font-bold text-verified">immutable relations</span>, and <span className="font-mono font-bold text-verified">deterministic projections</span>.
          </p>
          <p className="text-muted-foreground italic">
            Everything else — including migration — is replaceable infrastructure.
          </p>
        </div>
      </div>

      {/* Key Equations */}
      <div className="mt-3 space-y-2">
        <div className="rounded-md border border-border/30 bg-background/40 px-3 py-2">
          <div className="text-[10px] text-muted-foreground mb-1">State Derivation</div>
          <code className="text-xs font-mono text-verified">State(t) = Projection(Filter(FactLog, Policy), t)</code>
        </div>
        <div className="rounded-md border border-border/30 bg-background/40 px-3 py-2">
          <div className="text-[10px] text-muted-foreground mb-1">Identity Chain</div>
          <code className="text-xs font-mono text-repairing">Identity = PublicKey(Verifier(Proof(Fact)))</code>
        </div>
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   3. Production Architecture Diagram
   ═══════════════════════════════════════════════════ */
function ArchitectureDiagram() {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(4); // Acceptance Engine expanded by default

  return (
    <Shell accent="linear-gradient(to right, var(--quarantined)00, var(--quarantined)80, var(--quarantined)00)">
      <H3 icon={Layers} title="Production Architecture" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">layered diagram</span>
      } />
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        The runtime is organized as strict layers — data flows downward through acceptance and upward through projection. Each layer has a single responsibility.
      </p>

      <div className="space-y-0">
        {ARCHITECTURE_LAYERS.map((layer, i) => {
          const Icon = layer.icon;
          const isExpanded = expandedLayer === i;
          const hasSubs = layer.sub.length > 0;

          return (
            <motion.div key={layer.label} variants={itemV}>
              {/* Layer block */}
              <button
                onClick={() => setExpandedLayer(isExpanded ? null : i)}
                className="w-full text-left"
                disabled={!hasSubs}
              >
                <div
                  className="relative flex items-center gap-2.5 px-3 py-2.5 border border-border/40 rounded-lg bg-background/40 hover:bg-background/60 transition-colors"
                  style={{ borderLeftColor: layer.color, borderLeftWidth: "3px" }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: layer.color }} />
                  <span className="text-xs font-semibold">{layer.label}</span>
                  {hasSubs && (
                    <span className="ml-auto text-[9px] text-muted-foreground font-mono">
                      {layer.sub.length} components
                    </span>
                  )}
                  {hasSubs && (
                    <span className="shrink-0">
                      {isExpanded
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </span>
                  )}
                </div>
              </button>

              {/* Sub-components */}
              <AnimatePresence>
                {hasSubs && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l-2 border-border/30 py-1.5 space-y-1">
                      {layer.sub.map((sub) => (
                        <div key={sub} className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/30 text-[11px]">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: layer.color }} />
                          <span className="font-medium">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connector arrow */}
              {i < ARCHITECTURE_LAYERS.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   4. Gap Analysis Panel
   ═══════════════════════════════════════════════════ */
function GapAnalysisPanel() {
  const [showAll, setShowAll] = useState(false);
  const visibleGaps = showAll ? GAPS : GAPS.slice(0, 5);

  const inProgressCount = GAPS.filter(g => g.status === "in-progress").length;
  const plannedCount = GAPS.filter(g => g.status === "planned").length;

  return (
    <Shell accent="linear-gradient(to right, var(--repairing)00, var(--repairing)80, var(--repairing)00)">
      <H3 icon={AlertTriangle} title="Gap Analysis" extra={
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] text-repairing font-mono">
            <Clock className="h-3 w-3" />{inProgressCount} in progress
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] text-quarantined font-mono">
            <AlertTriangle className="h-3 w-3" />{plannedCount} planned
          </span>
        </div>
      } />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatCard label="In Progress" value={inProgressCount} color="text-repairing" bg="bg-repairing/5" border="border-repairing/30" />
        <StatCard label="Planned" value={plannedCount} color="text-quarantined" bg="bg-quarantined/5" border="border-quarantined/30" />
        <StatCard label="Total Gaps" value={GAPS.length} color="text-foreground" bg="bg-muted/20" border="border-border/60" />
      </div>

      {/* Gap list */}
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
        {visibleGaps.map((gap) => {
          const sc = statusColor(gap.status);
          const StatusIcon = sc.icon;
          return (
            <motion.div
              key={gap.id}
              variants={itemV}
              className={`rounded-lg border ${sc.border} ${sc.bg} p-3`}
            >
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/60 text-[10px] font-mono font-bold text-muted-foreground shrink-0 mt-0.5">
                  {gap.id}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{gap.name}</span>
                    <StatusIcon className={`h-3 w-3 ${sc.text} shrink-0`} />
                    <span className={`text-[9px] font-semibold uppercase ${sc.text}`}>
                      {gap.status.replace("-", " ")}
                    </span>
                    <span className={`ml-auto text-[9px] font-semibold uppercase ${priorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{gap.description}</p>
                  <div className="text-[9px] text-muted-foreground/70 font-mono">Impact: {gap.impact}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show more / less */}
      {!showAll && GAPS.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Show {GAPS.length - 5} more gaps…
        </button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   5. Long-term Stability Panel
   ═══════════════════════════════════════════════════ */
function StabilityPanel() {
  return (
    <Shell accent="linear-gradient(to right, var(--verified)00, var(--verified)80, var(--verified)00)">
      <H3 icon={Lock} title="Long-term Stability" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">replaceable infra</span>
      } />
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Infrastructure can be swapped — the kernel (Fact, Proof, Policy, Projection) remains stable regardless.
      </p>

      {/* Stable kernel indicator */}
      <div className="mb-3 p-3 rounded-lg border border-verified/30 bg-verified/5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-verified" />
          <span className="text-xs font-semibold text-verified">Stable Kernel</span>
          <StatusPill status="verified" label="Immutable" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRIMITIVES.map((p, i) => (
            <div key={p.name} className="flex items-center gap-1">
              <span className={`text-[10px] font-mono font-bold ${p.colorClass}`}>{p.name}</span>
              {i < PRIMITIVES.length - 1 && <span className="text-[9px] text-muted-foreground/40">·</span>}
            </div>
          ))}
          <span className="text-[9px] text-muted-foreground ml-1">— these never change</span>
        </div>
      </div>

      {/* Replaceable items */}
      <div className="space-y-2">
        {REPLACEABLE.map((item) => (
          <motion.div
            key={item.current}
            variants={itemV}
            className="flex items-center gap-2.5 rounded-md border border-border/30 bg-background/30 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground line-through opacity-60">{item.current}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <span className="text-[10px] font-mono font-semibold text-foreground">{item.future}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">{item.area}</span>
              <span className="text-[9px] text-muted-foreground/60 hidden sm:inline">{item.reason}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   6. Assessment Scorecard
   ═══════════════════════════════════════════════════ */
function AssessmentScorecard() {
  const radarData = ASSESSMENT.map(a => ({
    label: a.area.length > 10 ? a.area.slice(0, 9) + "…" : a.area,
    value: a.score,
    max: 100,
  }));

  const excellentCount = ASSESSMENT.filter(a => a.rating === "Excellent").length;
  const goodCount = ASSESSMENT.filter(a => a.rating === "Good").length;
  const incompleteCount = ASSESSMENT.filter(a => a.rating === "Incomplete").length;
  const missingCount = ASSESSMENT.filter(a => a.rating === "Missing").length;

  return (
    <Shell accent="linear-gradient(to right, var(--verified)00, var(--verified)60, var(--violating)80, var(--violating)00)">
      <H3 icon={Gauge} title="Assessment Scorecard" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">~80–85% ready</span>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Radar Chart */}
        <div className="flex flex-col items-center gap-3">
          <RadarGrid data={radarData} size={200} color="verified" />
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-[9px] text-verified"><span className="h-1.5 w-1.5 rounded-full bg-verified" />Excellent</span>
            <span className="flex items-center gap-1 text-[9px] text-repairing"><span className="h-1.5 w-1.5 rounded-full bg-repairing" />Good</span>
            <span className="flex items-center gap-1 text-[9px] text-quarantined"><span className="h-1.5 w-1.5 rounded-full bg-quarantined" />Incomplete</span>
            <span className="flex items-center gap-1 text-[9px] text-violating"><span className="h-1.5 w-1.5 rounded-full bg-violating" />Missing</span>
          </div>
        </div>

        {/* Right: Detailed bars */}
        <div className="space-y-2">
          {/* Summary counts */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <StatCard label="Excellent" value={excellentCount} color="text-verified" bg="bg-verified/5" border="border-verified/30" />
            <StatCard label="Good" value={goodCount} color="text-repairing" bg="bg-repairing/5" border="border-repairing/30" />
            <StatCard label="Incomplete" value={incompleteCount} color="text-quarantined" bg="bg-quarantined/5" border="border-quarantined/30" />
            <StatCard label="Missing" value={missingCount} color="text-violating" bg="bg-violating/5" border="border-violating/30" />
          </div>

          {/* Progress bars */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
            {ASSESSMENT.map((a) => {
              const rc = ratingColor(a.rating);
              return (
                <div key={a.area} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{a.area}</span>
                    <span className={`text-[9px] font-semibold uppercase ${rc.text}`}>{a.rating}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: a.rating === "Excellent" ? "var(--verified)"
                          : a.rating === "Good" ? "var(--repairing)"
                          : a.rating === "Incomplete" ? "var(--quarantined)"
                          : "var(--violating)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overall readiness gauge */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <MetricGauge value={82} max={100} label="Production Readiness" color="verified" size={110} />
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
            <span>Conceptual model is rock-solid</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-repairing" />
            <span>Crypto &amp; distributed need work</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-violating" />
            <span>Concurrency model is undefined</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════
   Main Section Export
   ═══════════════════════════════════════════════════ */
export function ArchitectureSection() {
  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="space-y-6">
      {/* Section Header */}
      <SectionHeader
        icon={Layers}
        title="Architecture & Primitives"
        subtitle="Core ontology, production architecture, gap analysis & long-term stability"
        iconClass="border-verified/30 bg-verified/10 text-verified"
      />

      {/* Row 1: Four Primitives (full width) */}
      <motion.div variants={cardV}>
        <FourPrimitivesPanel />
      </motion.div>

      {/* Row 2: Core Insights + Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <CoreInsightsPanel />
        </motion.div>
        <motion.div variants={cardV}>
          <ArchitectureDiagram />
        </motion.div>
      </div>

      {/* Row 3: Gap Analysis (full width) */}
      <motion.div variants={cardV}>
        <GapAnalysisPanel />
      </motion.div>

      {/* Row 4: Stability + Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardV}>
          <StabilityPanel />
        </motion.div>
        <motion.div variants={cardV}>
          <AssessmentScorecard />
        </motion.div>
      </div>
    </motion.div>
  );
}
