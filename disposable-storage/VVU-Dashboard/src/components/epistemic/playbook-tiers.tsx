"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Library, Shield, Zap, Cpu, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, ArrowRight, Activity,
  FlaskConical, Eye, Lock, Clock, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DonutChart, MetricGauge, SparkLine } from "./chart-primitives";
import { StatusPill, Hash, SectionHeader, GradientBorderCard, StatCard, containerVariants, cardVariants } from "./primitives";

/* ─── Types ─── */
type TierLevel = "production" | "critical" | "destructive";
type CBMapping = "NORMAL" | "DEGRADED" | "FAIL-CLOSED";

interface TierPrompt {
  id: string;
  name: string;
  category: string;
  description: string;
  scope: string;
  resilience: string;
}

interface TierConfig {
  level: TierLevel;
  name: string;
  color: string;
  cbMapping: CBMapping;
  agentCount: number;
  cycle: string;
  prompts: TierPrompt[];
  qualityScope: string[];
  resilienceMeasures: string[];
}

/* ─── Tier configurations ─── */
const TIER_CONFIGS: TierConfig[] = [
  {
    level: "production",
    name: "Production Tier",
    color: "var(--verified)",
    cbMapping: "NORMAL",
    agentCount: 12,
    cycle: "60s",
    prompts: [
      { id: "p1", name: "Invariant Mining", category: "mining", description: "Discover hidden invariants from historical DAG state transitions", scope: "read-only", resilience: "retry-eligible" },
      { id: "p2", name: "Evidence Compilation", category: "compiler", description: "5-pass evidence pipeline: Parse→Validate→Infer→Correlate→CodeGen", scope: "read-only", resilience: "retry-eligible" },
      { id: "p3", name: "Policy Enforcement", category: "enforcer", description: "Execute .epd policies against live DAG facts with deterministic outcomes", scope: "read-write", resilience: "shadow-mode" },
      { id: "p4", name: "Fact Acceptance", category: "acceptor", description: "Deterministic fact lifecycle: propose→validate→accept/reject→store", scope: "read-write", resilience: "idempotent" },
      { id: "p5", name: "DAG Topology Optimization", category: "optimizer", description: "Shard rebalancing for invariant-aware state partitioning", scope: "read-only", resilience: "retry-eligible" },
    ],
    qualityScope: ["Deterministic", "Replay-safe", "Idempotent", "Shadow-mode", "Full audit trail"],
    resilienceMeasures: ["Full retry eligibility", "Shadow-mode enforcement", "Idempotent writes", "No hard failure codes", "Full audit logging"],
  },
  {
    level: "critical",
    name: "Critical Tier",
    color: "var(--repairing)",
    cbMapping: "DEGRADED",
    agentCount: 6,
    cycle: "300s",
    prompts: [
      { id: "c1", name: "Merge Reconciliation", category: "reconciliation", description: "Least-divergent merge correction with AI-mined invariant guidance", scope: "write-careful", resilience: "dry-run-first" },
      { id: "c2", name: "Shadow Bridge Takeover", category: "bridge", description: "Digital-twin shadow→live takeover with verification gate", scope: "write-verified", resilience: "reversible" },
      { id: "c3", name: "Release Gate Evaluation", category: "gate", description: "Binary PASS/FAIL gate with confidence scoring and HMAC-SHA-256 signature", scope: "read-only", resilience: "fail-closed" },
      { id: "c4", name: "ADR Generation", category: "adr", description: "Auto-generate Architecture Decision Records with HF codes", scope: "read-only", resilience: "deterministic" },
    ],
    qualityScope: ["Dry-run required", "Reversible", "Verified gates", "Confidence thresholds", "HF code awareness"],
    resilienceMeasures: ["Dry-run before execution", "Reversible operations", "Verified takeover gates", "Confidence scoring", "HF-001/HF-002 penalties"],
  },
  {
    level: "destructive",
    name: "Destructive Tier",
    color: "var(--violating)",
    cbMapping: "FAIL-CLOSED",
    agentCount: 2,
    cycle: "900s",
    prompts: [
      { id: "d1", name: "WAL Corruption Healing", category: "healing", description: "Truncate corrupt WAL entries and resync from CSB quorum", scope: "destructive", resilience: "requires-review" },
      { id: "d2", name: "Hard Reset & Recovery", category: "reset", description: "Full system reset from CSB seed with MMR root verification", scope: "destructive", resilience: "requires-review" },
    ],
    qualityScope: ["Human approval required", "CSB quorum verification", "MMR root check", "Full evidence trail", "Rollback plan"],
    resilienceMeasures: ["REQUIRES_REVIEW badge", "CSB quorum verification", "MMR root verification", "Full rollback plan", "Evidence compilation before execution", "30s cooldown after completion"],
  },
];

/* ─── Animation variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const tierV: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};
const promptV: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

/* ─── Category badge colors ─── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mining: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/20" },
  compiler: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/20" },
  enforcer: { bg: "bg-quarantined/10", text: "text-quarantined", border: "border-quarantined/20" },
  acceptor: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/20" },
  optimizer: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/20" },
  reconciliation: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/20" },
  bridge: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/20" },
  gate: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/20" },
  adr: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/20" },
  healing: { bg: "bg-violating/10", text: "text-violating", border: "border-violating/20" },
  reset: { bg: "bg-violating/10", text: "text-violating", border: "border-violating/20" },
};

/* ─── Tier Card ─── */
function TierCard({ tier }: { tier: TierConfig }) {
  const [expanded, setExpanded] = useState(false);

  const TierIcon = tier.level === "production" ? CheckCircle2 : tier.level === "critical" ? AlertTriangle : XCircle;
  const tierGradient = tier.level === "production" ? "from-verified/40 via-verified/20 to-verified/10" : tier.level === "critical" ? "from-repairing/40 via-repairing/20 to-repairing/10" : "from-violating/40 via-violating/20 to-violating/10";

  return (
    <GradientBorderCard gradient={tierGradient}>
      <motion.div className="p-4" variants={tierV} initial="hidden" animate="visible">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ borderColor: `${tier.color}40`, backgroundColor: `${tier.color}15` }}
            animate={tier.level === "destructive" ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] } : {}}
            transition={tier.level === "destructive" ? { duration: 2, repeat: Infinity } : {}}
          >
            <TierIcon className="h-5 w-5" style={{ color: tier.color }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">{tier.name}</span>
              <Badge className={`${CATEGORY_COLORS[tier.level === "production" ? "mining" : tier.level === "critical" ? "reconciliation" : "healing"].bg} ${CATEGORY_COLORS[tier.level === "production" ? "mining" : tier.level === "critical" ? "reconciliation" : "healing"].text} ${CATEGORY_COLORS[tier.level === "production" ? "mining" : tier.level === "critical" ? "reconciliation" : "healing"].border} text-[9px] font-bold`}>
                {tier.cbMapping}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">Circuit Breaker → {tier.cbMapping}</div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Agents</div>
            <div className="mt-0.5 font-mono text-sm font-semibold" style={{ color: tier.color }}>{tier.agentCount}</div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Cycle</div>
            <div className="mt-0.5 font-mono text-sm font-semibold" style={{ color: tier.color }}>{tier.cycle}</div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Prompts</div>
            <div className="mt-0.5 font-mono text-sm font-semibold" style={{ color: tier.color }}>{tier.prompts.length}</div>
          </div>
        </div>

        {/* Prompt list (always visible: names + categories) */}
        <div className="space-y-2 mb-3">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Key Prompts</div>
          {tier.prompts.map((prompt, i) => {
            const catColors = CATEGORY_COLORS[prompt.category] ?? CATEGORY_COLORS.mining;
            return (
              <motion.div
                key={prompt.id}
                className="flex items-center gap-2"
                variants={promptV}
                initial="hidden"
                animate="visible"
              >
                <Badge className={`${catColors.bg} ${catColors.text} ${catColors.border} text-[8px] font-bold capitalize`}>
                  {prompt.category}
                </Badge>
                <span className="text-xs text-foreground font-medium truncate">{prompt.name}</span>
                <span className="text-[9px] text-muted-foreground truncate">{prompt.scope}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Quality scope badges */}
        <div className="space-y-2 mb-3">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Quality Scope</div>
          <div className="flex flex-wrap gap-1.5">
            {tier.qualityScope.map((qs, i) => (
              <Badge key={i} className="bg-muted/40 text-muted-foreground border-border/40 text-[8px]">
                {qs}
              </Badge>
            ))}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border/40 space-y-4">
                {/* Resilience measures */}
                <div className="space-y-2">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Resilience Measures</div>
                  {tier.resilienceMeasures.map((rm, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 text-xs"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="text-muted-foreground">{rm}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Detailed prompt cards */}
                <div className="space-y-3">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Prompt Details</div>
                  {tier.prompts.map((prompt, i) => {
                    const catColors = CATEGORY_COLORS[prompt.category] ?? CATEGORY_COLORS.mining;
                    return (
                      <motion.div
                        key={prompt.id}
                        className="rounded-md border border-border/40 bg-muted/10 p-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${catColors.bg} ${catColors.text} ${catColors.border} text-[9px] font-bold capitalize`}>
                            {prompt.category}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">{prompt.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{prompt.description}</div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="text-muted-foreground">Scope:</span>
                          <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[8px]">{prompt.scope}</Badge>
                          <span className="text-muted-foreground">Resilience:</span>
                          <Badge className={`${catColors.bg} ${catColors.text} ${catColors.border} text-[8px]`}>{prompt.resilience}</Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* CB mapping visualization */}
                <div className="rounded-md border border-border/40 bg-muted/10 p-3">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Circuit Breaker Mapping</div>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="flex items-center gap-1.5"
                      animate={tier.level === "destructive" ? { scale: [1, 1.05, 1] } : {}}
                      transition={tier.level === "destructive" ? { duration: 2, repeat: Infinity } : {}}
                    >
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="text-xs font-semibold" style={{ color: tier.color }}>{tier.cbMapping}</span>
                    </motion.div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">
                      {tier.level === "production" ? "Full throughput, no restrictions" :
                       tier.level === "critical" ? "Reduced capacity, dry-run enforced" :
                       "All requests blocked, REQUIRES_REVIEW"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </GradientBorderCard>
  );
}

/* ─── Tier Transition Indicator ─── */
function TierTransitionIndicator() {
  const transitions = [
    { from: "Production", to: "Critical", trigger: "Error rate > 15%", color: "var(--repairing)" },
    { from: "Critical", to: "Destructive", trigger: "Error rate > 40%", color: "var(--violating)" },
    { from: "Destructive", to: "Critical", trigger: "Cooldown 30s", color: "var(--repairing)" },
    { from: "Critical", to: "Production", trigger: "Error rate < 15%", color: "var(--verified)" },
  ];

  return (
    <motion.div className="space-y-3" variants={cardVariants} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">Tier Transition Rules</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {transitions.map((t, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/10 p-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-foreground font-medium">{t.from}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground font-medium">{t.to}</span>
            <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[7px]">{t.trigger}</Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Summary Overview ─── */
function SummaryOverview() {
  const data = useMemo(() => [
    { label: "Production", value: 12, color: "var(--verified)" },
    { label: "Critical", value: 6, color: "var(--repairing)" },
    { label: "Destructive", value: 2, color: "var(--violating)" },
  ], []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[
        { label: "Total Agents", value: "20", color: "text-foreground" },
        { label: "Total Prompts", value: "11", color: "text-foreground" },
        { label: "Production", value: "12 agents", color: "text-verified" },
        { label: "Critical", value: "6 agents", color: "text-repairing" },
        { label: "Destructive", value: "2 agents", color: "text-violating" },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="rounded-md border border-border/40 bg-muted/20 p-3 text-center"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          <div className={`mt-0.5 font-mono text-sm font-semibold ${s.color}`}>{s.value}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── CB Mapping Overview ─── */
function CBMappingOverview() {
  const data = useMemo(() => [
    { label: "NORMAL (Prod)", value: 12, color: "var(--verified)" },
    { label: "DEGRADED (Crit)", value: 6, color: "var(--repairing)" },
    { label: "FAIL-CLOSED (Dest)", value: 2, color: "var(--violating)" },
  ], []);

  return (
    <GradientBorderCard>
      <div className="p-4">
        <div className="flex items-center gap-6">
          <DonutChart data={data} size={100} thickness={16} showLabels />
          <div className="space-y-2">
            <div className="text-sm font-semibold text-foreground">Agent Distribution</div>
            <div className="space-y-1">
              {data.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="font-mono font-semibold" style={{ color: d.color }}>{d.value}</span>
                  <span className="text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GradientBorderCard>
  );
}

/* ─── Main Section ─── */
export function PlaybookTiersSection() {
  return (
    <motion.div
      className="space-y-6"
      variants={cv}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={Library}
          title="Tiered AI Prompt Playbooks"
          subtitle="3-tier circuit breaker mapping: Production (NORMAL) → Critical (DEGRADED) → Destructive (FAIL-CLOSED)"
          iconClass="border-quarantined/30 bg-quarantined/10 text-quarantined"
        />
      </div>

      {/* Summary stats */}
      <SummaryOverview />

      {/* CB mapping overview */}
      <CBMappingOverview />

      {/* Tier transition rules */}
      <TierTransitionIndicator />

      {/* Tier cards */}
      <div className="space-y-4">
        {TIER_CONFIGS.map((tier) => (
          <TierCard key={tier.level} tier={tier} />
        ))}
      </div>

      {/* Architecture note */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-quarantined" />
          <span>
            Playbook tiers enforce circuit breaker state machine alignment. Production prompts execute under NORMAL conditions
            with full throughput. Critical prompts require dry-run verification under DEGRADED conditions.
            Destructive prompts are blocked under FAIL-CLOSED and require REQUIRES_REVIEW approval badges before execution.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
