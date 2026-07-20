"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  GitBranch,
  ShieldCheck,
  Network,
  Boxes,
  KeyRound,
  Cpu,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
  Sparkles,
  Minus,
  ArrowRight,
  Clock,
  Flame,
  Eye,
  LayoutGrid,
  FileText,
  Terminal,
  Globe2,
  CircuitBoard,
  History,
  GitCompare,
  FlaskConical,
  Search,
  Library,
  GitGraph,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatsResponse } from "@/lib/types";
import { StatusPill, Hash } from "./primitives";

function generateSparkline(base: number, variance: number, length = 12): number[] {
  let seed = base * 7 + 31;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length }, () =>
    Math.max(0, Math.round((base + (rand() - 0.5) * 2 * variance) * 10) / 10)
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const CAPABILITY_ICONS: Record<string, typeof Activity> = {
  studio: GitBranch,
  templates: Library,
  topology: Network,
  dependencies: GitGraph,
  coverage: LayoutGrid,
  merges: Wrench,
  shadow: Cpu,
  proofs: KeyRound,
  zkcircuit: CircuitBoard,
  miner: Sparkles,
  timeline: Clock,
  diff: GitCompare,
  matrix: Eye,
  tests: FlaskConical,
  metrics: TrendingUp,
  versions: History,
  audit: FileText,
  cli: Terminal,
  federation: Globe2,
  overview: ShieldCheck,
};

const ACTIVITY_CONFIG: Record<string, { icon: typeof Activity; color: string; bg: string; border: string; dot: string; label: string }> = {
  merge: {
    icon: GitBranch,
    color: "text-verified",
    bg: "bg-verified/10",
    border: "border-verified/20",
    dot: "bg-verified",
    label: "Merge",
  },
  shadow: {
    icon: Cpu,
    color: "text-repairing",
    bg: "bg-repairing/10",
    border: "border-repairing/20",
    dot: "bg-repairing",
    label: "Shadow",
  },
  violation: {
    icon: AlertTriangle,
    color: "text-violating",
    bg: "bg-violating/10",
    border: "border-violating/20",
    dot: "bg-violating",
    label: "Breach",
  },
};

export function OverviewSection({ onJump }: { onJump: (id: string) => void }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => alive && (setStats(d), setLoading(false)))
        .catch(() => alive && setLoading(false));
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (loading || !stats) {
    return (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="h-32 rounded-xl bg-card/40 animate-pulse border border-border/30"
          />
        ))}
      </motion.div>
    );
  }

  const healthScore = stats.shardHealth.healthScore;
  const healthStatus =
    healthScore >= 85 ? "healthy" : healthScore >= 60 ? "repairing" : "violating";

  const kpis = [
    {
      label: "Epistemic Health",
      value: `${healthScore}%`,
      numericValue: healthScore,
      sub: `${stats.shardHealth.healthy} ok · ${stats.shardHealth.repairing} fix · ${stats.shardHealth.violating} bad`,
      icon: ShieldCheck,
      status: healthStatus,
      sparkBase: healthScore,
      sparkVariance: 8,
      accentColor: healthStatus === "healthy" ? "var(--verified)" : healthStatus === "repairing" ? "var(--repairing)" : "var(--violating)",
    },
    {
      label: "Policies",
      value: String(stats.counts.policies),
      numericValue: stats.counts.policies,
      sub: `${stats.counts.shards} shards`,
      icon: GitBranch,
      status: null,
      sparkBase: stats.counts.policies,
      sparkVariance: 2,
      accentColor: "var(--verified)",
    },
    {
      label: "Merge Success",
      value: `${stats.mergeHealth.successRate}%`,
      numericValue: stats.mergeHealth.successRate,
      sub: `${stats.mergeHealth.applied} applied · ${stats.mergeHealth.rejected} rejected`,
      icon: Wrench,
      status: null,
      sparkBase: stats.mergeHealth.successRate,
      sparkVariance: 6,
      accentColor: "var(--repairing)",
    },
    {
      label: "Anchored Proofs",
      value: `${stats.ancestry.anchoredRate}%`,
      numericValue: stats.ancestry.anchoredRate,
      sub: `${stats.ancestry.zkProofs}/${stats.ancestry.totalProofs} ZK`,
      icon: KeyRound,
      status: null,
      sparkBase: stats.ancestry.anchoredRate,
      sparkVariance: 5,
      accentColor: "var(--verified)",
    },
  ];

  const gaugeData = [
    { name: "Health", value: healthScore },
    { name: "Remaining", value: 100 - healthScore },
  ];
  const gaugeColor = healthStatus === "healthy" ? "var(--verified)" : healthStatus === "repairing" ? "var(--repairing)" : "var(--violating)";

  const activityItems = stats.activity.map((a, i) => {
    const kind = a.title.includes("breach") ? "violation" : a.kind;
    return { ...a, kind, config: ACTIVITY_CONFIG[kind] ?? ACTIVITY_CONFIG.merge };
  });

  const inventory = [
    { icon: GitBranch, label: "Policies", value: stats.counts.policies, hint: "compiled .epd", max: Math.max(stats.counts.policies * 1.5, 10), color: "var(--verified)" },
    { icon: Network, label: "Shards", value: stats.counts.shards, hint: "state-space partitions", max: Math.max(stats.counts.shards * 1.5, 10), color: "var(--verified)" },
    { icon: GitBranch, label: "Merge proposals", value: stats.counts.merges, hint: "cross-shard", max: Math.max(stats.counts.merges * 1.5, 10), color: "var(--repairing)" },
    { icon: KeyRound, label: "Ancestry proofs", value: stats.counts.proofs, hint: "MMR + ZK", max: Math.max(stats.counts.proofs * 1.5, 10), color: "var(--verified)" },
    { icon: AlertTriangle, label: "Drift violations", value: stats.counts.violations, hint: "miner feed", max: Math.max(stats.counts.violations * 1.5, 10), color: "var(--violating)" },
    { icon: Cpu, label: "Shadow events", value: stats.counts.shadowEvents, hint: "twin telemetry", max: Math.max(stats.counts.shadowEvents * 1.5, 10), color: "var(--repairing)" },
    { icon: Sparkles, label: "Mined invariants", value: stats.counts.mined, hint: "AI candidates", max: Math.max(stats.counts.mined * 1.5, 10), color: "var(--verified)" },
  ];

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, idx) => (
          <KpiCardWithSparkline key={k.label} kpi={k} idx={idx} />
        ))}

        {}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div
              className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
              style={{ background: `linear-gradient(90deg, ${gaugeColor}, transparent)` }}
            />
            <div className="bg-grid-fine absolute inset-0 opacity-20" />
            <div className="relative flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                System Health
              </span>
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      startAngle={225}
                      endAngle={-45}
                      innerRadius={36}
                      outerRadius={48}
                      strokeWidth={0}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      <Cell fill={gaugeColor} />
                      <Cell fill="oklch(0.25 0.012 168)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: gaugeColor }}>
                    {healthScore}%
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    {healthStatus}
                  </span>
                </div>
              </div>
              {/* Pulse indicator */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                    style={{ backgroundColor: gaugeColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: gaugeColor }}
                  />
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">system pulse</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        variants={sectionVariants}
      >
        {/* Runtime Inventory */}
        <Card className="lg:col-span-1 bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 via-repairing/30 to-transparent" />
          <div className="bg-grid-fine absolute inset-0 opacity-15" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
                <Boxes className="h-3.5 w-3.5 text-verified" />
              </div>
              <h3 className="text-sm font-semibold">Runtime Inventory</h3>
            </div>
            <div className="space-y-3">
              {inventory.map((item) => {
                const Icon = item.icon;
                const pct = Math.min(100, (item.value / item.max) * 100);
                return (
                  <div key={item.label} className="group/inv">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-background/60 border border-border/30 flex items-center justify-center group-hover/inv:border-border/60 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">{item.label}</p>
                          <span className="text-lg font-semibold tabular-nums">{item.value}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 rounded-full bg-background/60 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono shrink-0">{item.hint}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Live Epistemic Activity */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-repairing/40 via-verified/30 to-transparent" />
          <div className="bg-grid-fine absolute inset-0 opacity-15" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-repairing/10">
                <Activity className="h-3.5 w-3.5 text-repairing" />
              </div>
              <h3 className="text-sm font-semibold">Live Epistemic Activity</h3>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verified" />
                </span>
                refresh 8s
              </span>
            </div>
            <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {activityItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
                )}
                {activityItems.map((a, i) => {
                  const Cfg = a.config;
                  const ActIcon = Cfg.icon;
                  return (
                    <motion.div
                      key={`${a.title}-${i}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="relative flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5 mb-2 hover:border-border/60 hover:bg-background/50 transition-all group/act"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className={`h-2 w-2 rounded-full ${Cfg.dot} ring-2 ring-background`} />
                      </div>
                      {/* Event badge */}
                      <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${Cfg.bg} ${Cfg.border} border`}>
                        <ActIcon className={`h-3.5 w-3.5 ${Cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${Cfg.bg} ${Cfg.color}`}>
                            {Cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate font-mono">{a.detail}</p>
                          <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono shrink-0 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </motion.div>

      {}
      <motion.div variants={sectionVariants}>
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 via-repairing/30 to-violating/20" />
          <div className="bg-grid-fine absolute inset-0 opacity-15" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
                <TrendingUp className="h-3.5 w-3.5 text-verified" />
              </div>
              <h3 className="text-sm font-semibold">Capability Map</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">epistemic://</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { id: "studio", label: "Policy DSL Studio", hint: ".epd → enforcers", gradient: "from-verified/8 to-verified/2" },
                { id: "templates", label: "Template Library", hint: "create from template", gradient: "from-verified/8 to-verified/2" },
                { id: "topology", label: "DAG Shard Topology", hint: "invariant-aware sharding", gradient: "from-verified/8 to-verified/2" },
                { id: "dependencies", label: "Dependency Graph", hint: "policy relations", gradient: "from-verified/8 to-verified/2" },
                { id: "coverage", label: "Coverage Treemap", hint: "invariant coverage", gradient: "from-verified/8 to-verified/2" },
                { id: "merges", label: "Self-Repairing Merges", hint: "least-divergent correction", gradient: "from-repairing/8 to-repairing/2" },
                { id: "shadow", label: "Shadow Bridge", hint: "digital-twin takeover", gradient: "from-repairing/8 to-repairing/2" },
                { id: "proofs", label: "MMR Ancestry Proofs", hint: "ZK verifiable history", gradient: "from-verified/8 to-verified/2" },
                { id: "zkcircuit", label: "ZK Proof Circuit", hint: "SNARK constraints", gradient: "from-verified/8 to-verified/2" },
                { id: "miner", label: "Invariant Miner", hint: "AI-mined candidates", gradient: "from-verified/8 to-verified/2" },
                { id: "timeline", label: "Replay Timeline", hint: "event scrubber", gradient: "from-repairing/8 to-repairing/2" },
                { id: "diff", label: "Policy Diff", hint: "compare .epd", gradient: "from-verified/8 to-verified/2" },
                { id: "matrix", label: "Comparison Matrix", hint: "multi-policy matrix", gradient: "from-verified/8 to-verified/2" },
                { id: "tests", label: "Test Suite", hint: "run invariant tests", gradient: "from-verified/8 to-verified/2" },
                { id: "metrics", label: "Performance Metrics", hint: "live charts", gradient: "from-verified/8 to-verified/2" },
                { id: "versions", label: "Policy Versioning", hint: "revision history", gradient: "from-verified/8 to-verified/2" },
                { id: "audit", label: "Audit Reports", hint: "compliance export", gradient: "from-repairing/8 to-repairing/2" },
                { id: "cli", label: "CLI Terminal", hint: "validate .epd files", gradient: "from-repairing/8 to-repairing/2" },
                { id: "federation", label: "epistemic:// Federation", hint: "multi-org reconciliation", gradient: "from-verified/8 to-verified/2" },
                { id: "overview", label: "Runtime Overview", hint: "this dashboard", gradient: "from-verified/8 to-verified/2" },
              ].map((c, idx) => {
                const Icon = CAPABILITY_ICONS[c.id] ?? Activity;
                return (
                  <motion.button
                    key={c.id}
                    onClick={() => onJump(c.id)}
                    className={`group text-left rounded-xl border border-border/40 bg-gradient-to-br ${c.gradient} p-3 hover:border-verified/40 hover:shadow-[0_0_16px_-4px_oklch(0.78_0.16_160/0.3)] transition-all relative overflow-hidden`}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-background/60 border border-border/30 flex items-center justify-center group-hover:border-verified/30 transition-colors">
                        <Icon className="h-3 w-3 text-muted-foreground group-hover:text-verified transition-colors" />
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-verified/60 ml-auto transition-all" />
                    </div>
                    <p className="mt-2 text-sm font-medium leading-tight">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.hint}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function KpiCardWithSparkline({
  kpi,
  idx,
}: {
  kpi: {
    label: string;
    value: string;
    numericValue: number;
    sub: string;
    icon: typeof Activity;
    status: string | null;
    sparkBase: number;
    sparkVariance: number;
    accentColor: string;
  };
  idx: number;
}) {
  const Icon = kpi.icon;
  const sparkData = useMemo(
    () => generateSparkline(kpi.sparkBase, kpi.sparkVariance).map((v, i) => ({ v, i })),
    [kpi.sparkBase, kpi.sparkVariance]
  );

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full group cursor-default">
        {/* Accent gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
          style={{ background: `linear-gradient(90deg, ${kpi.accentColor}, transparent)` }}
        />
        <div className="bg-grid-fine absolute inset-0 opacity-20" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
          <div className="mt-2 flex items-end gap-2 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums leading-none">{kpi.value}</span>
            {kpi.status && (
              <StatusPill status={kpi.status as "healthy" | "repairing" | "violating"} />
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-tight">{kpi.sub}</p>

          {/* Sparkline */}
          <div className="mt-2 h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.accentColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={kpi.accentColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={kpi.accentColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${idx})`}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
