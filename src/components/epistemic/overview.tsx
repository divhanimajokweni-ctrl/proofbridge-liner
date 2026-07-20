"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, BarChart, Bar, Legend,
} from "recharts";
import {
  Activity, GitBranch, ShieldCheck, Network, Boxes, KeyRound, Cpu,
  TrendingUp, AlertTriangle, Wrench, Sparkles, ArrowRight, Clock,
  LayoutGrid, FileText, Terminal, Globe2, CircuitBoard, History,
  GitCompare, FlaskConical, Library, GitGraph, Zap, Download, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { StatsResponse, ShardRow } from "@/lib/types";
import { StatusPill, Hash } from "./primitives";

function generateSparkline(base: number, variance: number, length = 12): number[] {
  let seed = base * 7 + 31;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  return Array.from({ length }, () => Math.max(0, Math.round((base + (rand() - 0.5) * 2 * variance) * 10) / 10));
}

const cv = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const secV = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const CAPABILITY_ICONS: Record<string, typeof Activity> = {
  studio: GitBranch, templates: Library, topology: Network, dependencies: GitGraph,
  coverage: LayoutGrid, merges: Wrench, shadow: Cpu, proofs: KeyRound,
  zkcircuit: CircuitBoard, miner: Sparkles, timeline: Clock, diff: GitCompare,
  matrix: Activity, tests: FlaskConical, metrics: TrendingUp, versions: History,
  audit: FileText, cli: Terminal, federation: Globe2, overview: ShieldCheck,
};

const ACT_CFG: Record<string, { icon: typeof Activity; color: string; bg: string; border: string; dot: string; label: string }> = {
  merge: { icon: GitBranch, color: "text-verified", bg: "bg-verified/10", border: "border-verified/20", dot: "bg-verified", label: "Merge" },
  shadow: { icon: Cpu, color: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/20", dot: "bg-repairing", label: "Shadow" },
  violation: { icon: AlertTriangle, color: "text-violating", bg: "bg-violating/10", border: "border-violating/20", dot: "bg-violating", label: "Breach" },
};

const CHART_STYLE = { background: "oklch(0.205 0.014 168)", border: "1px solid oklch(0.32 0.014 165 / 0.6)", borderRadius: "6px", fontSize: "10px", fontFamily: "var(--font-geist-mono)" };

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function SeverityBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-muted-foreground font-mono uppercase">{label}</span>
        <span className="text-[9px] font-mono tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background/60 overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

function CardShell({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
      {accent && <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: accent }} />}
      <div className="bg-grid-fine absolute inset-0 opacity-15" />
      <div className="relative">{children}</div>
    </Card>
  );
}

function SectionHeader2({ icon: Icon, title, extra }: { icon: typeof Activity; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
        <Icon className="h-3.5 w-3.5 text-verified" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {extra}
    </div>
  );
}

const CAPABILITIES = [
  { id: "studio", label: "Policy DSL Studio", hint: ".epd → enforcers", g: "from-verified/8 to-verified/2" },
  { id: "templates", label: "Template Library", hint: "create from template", g: "from-verified/8 to-verified/2" },
  { id: "topology", label: "DAG Shard Topology", hint: "invariant-aware sharding", g: "from-verified/8 to-verified/2" },
  { id: "merges", label: "Self-Repairing Merges", hint: "least-divergent correction", g: "from-repairing/8 to-repairing/2" },
  { id: "shadow", label: "Shadow Bridge", hint: "digital-twin takeover", g: "from-repairing/8 to-repairing/2" },
  { id: "proofs", label: "MMR Ancestry Proofs", hint: "ZK verifiable history", g: "from-verified/8 to-verified/2" },
  { id: "zkcircuit", label: "ZK Proof Circuit", hint: "SNARK constraints", g: "from-verified/8 to-verified/2" },
  { id: "miner", label: "Invariant Miner", hint: "AI-mined candidates", g: "from-verified/8 to-verified/2" },
  { id: "timeline", label: "Replay Timeline", hint: "event scrubber", g: "from-repairing/8 to-repairing/2" },
  { id: "diff", label: "Policy Diff", hint: "compare .epd", g: "from-verified/8 to-verified/2" },
  { id: "metrics", label: "Performance Metrics", hint: "live charts", g: "from-verified/8 to-verified/2" },
  { id: "versions", label: "Policy Versioning", hint: "revision history", g: "from-verified/8 to-verified/2" },
  { id: "audit", label: "Audit Reports", hint: "compliance export", g: "from-repairing/8 to-repairing/2" },
  { id: "cli", label: "CLI Terminal", hint: "validate .epd files", g: "from-repairing/8 to-repairing/2" },
  { id: "federation", label: "epistemic:// Federation", hint: "multi-org reconciliation", g: "from-verified/8 to-verified/2" },
];

export function OverviewSection({ onJump }: { onJump: (id: string) => void }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [metrics, setMetrics] = useState<{
    timeSeries: { t: number; merges: number; violations: number; repairs: number }[];
    throughput: { successRate: number; avgDivergence: number; avgIterations: number };
    severityBreakdown: { critical: number; high: number; medium: number; low: number };
    latency: { p50: number; p95: number; p99: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shards, setShards] = useState<ShardRow[] | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/stats").then((r) => r.json()).then((d) => alive && (setStats(d), setLoading(false))).catch(() => alive && setLoading(false));
    load();
    const t = autoRefresh ? setInterval(load, 8000) : undefined;
    return () => { alive = false; if (t) clearInterval(t); };
  }, [autoRefresh]);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/metrics").then((r) => r.json()).then((d) => alive && setMetrics(d)).catch(() => {});
    load();
    const t = autoRefresh ? setInterval(load, 15000) : undefined;
    return () => { alive = false; if (t) clearInterval(t); };
  }, [autoRefresh]);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/shards").then((r) => r.json()).then((d) => alive && setShards(d.shards ?? [])).catch(() => {});
    load();
    const t = autoRefresh ? setInterval(load, 15000) : undefined;
    return () => { alive = false; if (t) clearInterval(t); };
  }, [autoRefresh]);

  if (loading || !stats) {
    return (
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={cv}>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div key={i} variants={cardV} className="h-32 rounded-xl bg-card/40 animate-pulse border border-border/30" />
        ))}
      </motion.div>
    );
  }

  const healthScore = stats.shardHealth.healthScore;
  const healthStatus = healthScore >= 85 ? "healthy" : healthScore >= 60 ? "repairing" : "violating";
  const gaugeColor = healthStatus === "healthy" ? "var(--verified)" : healthStatus === "repairing" ? "var(--repairing)" : "var(--violating)";

  const kpis = [
    { label: "Epistemic Health", value: `${healthScore}%`, numericValue: healthScore, sub: `${stats.shardHealth.healthy} ok · ${stats.shardHealth.repairing} fix · ${stats.shardHealth.violating} bad`, icon: ShieldCheck, status: healthStatus, sparkBase: healthScore, sparkVariance: 8, accentColor: gaugeColor },
    { label: "Policies", value: String(stats.counts.policies), numericValue: stats.counts.policies, sub: `${stats.counts.shards} shards`, icon: GitBranch, status: null, sparkBase: stats.counts.policies, sparkVariance: 2, accentColor: "var(--verified)" },
    { label: "Merge Success", value: `${stats.mergeHealth.successRate}%`, numericValue: stats.mergeHealth.successRate, sub: `${stats.mergeHealth.applied} applied · ${stats.mergeHealth.rejected} rejected`, icon: Wrench, status: null, sparkBase: stats.mergeHealth.successRate, sparkVariance: 6, accentColor: "var(--repairing)" },
    { label: "Anchored Proofs", value: `${stats.ancestry.anchoredRate}%`, numericValue: stats.ancestry.anchoredRate, sub: `${stats.ancestry.zkProofs}/${stats.ancestry.totalProofs} ZK`, icon: KeyRound, status: null, sparkBase: stats.ancestry.anchoredRate, sparkVariance: 5, accentColor: "var(--verified)" },
  ];

  const gaugeData = [{ name: "Health", value: healthScore }, { name: "Remaining", value: 100 - healthScore }];
  const activityItems = stats.activity.map((a, i) => {
    const kind = a.title.includes("breach") ? "violation" : a.kind;
    return { ...a, kind, config: ACT_CFG[kind] ?? ACT_CFG.merge };
  });

  const inventory = [
    { icon: GitBranch, label: "Policies", value: stats.counts.policies, hint: "compiled .epd", max: Math.max(stats.counts.policies * 1.5, 10), color: "var(--verified)" },
    { icon: Network, label: "Shards", value: stats.counts.shards, hint: "partitions", max: Math.max(stats.counts.shards * 1.5, 10), color: "var(--verified)" },
    { icon: GitBranch, label: "Merge proposals", value: stats.counts.merges, hint: "cross-shard", max: Math.max(stats.counts.merges * 1.5, 10), color: "var(--repairing)" },
    { icon: KeyRound, label: "Ancestry proofs", value: stats.counts.proofs, hint: "MMR + ZK", max: Math.max(stats.counts.proofs * 1.5, 10), color: "var(--verified)" },
    { icon: AlertTriangle, label: "Drift violations", value: stats.counts.violations, hint: "miner feed", max: Math.max(stats.counts.violations * 1.5, 10), color: "var(--violating)" },
    { icon: Cpu, label: "Shadow events", value: stats.counts.shadowEvents, hint: "twin telemetry", max: Math.max(stats.counts.shadowEvents * 1.5, 10), color: "var(--repairing)" },
    { icon: Sparkles, label: "Mined invariants", value: stats.counts.mined, hint: "AI candidates", max: Math.max(stats.counts.mined * 1.5, 10), color: "var(--verified)" },
  ];

  const COLOR_MAP: Record<string, string> = { healthy: "oklch(0.78 0.16 160)", repairing: "oklch(0.75 0.15 80)", violating: "oklch(0.65 0.2 25)" };

  // Coverage ring data
  let passing = 0, violating = 0, softViolations = 0;
  if (shards && shards.length > 0) {
    for (const shard of shards) for (const ev of shard.invariantEvals) { if (ev.passed) passing++; else if (ev.soft) softViolations++; else violating++; }
  } else { passing = stats.shardHealth.healthy * 3; softViolations = stats.shardHealth.repairing * 2; violating = stats.shardHealth.violating * 2; }
  const totalInv = passing + violating + softViolations || 1;
  const ringData = [
    { name: "Passing", value: passing, fill: "oklch(0.78 0.16 160)" },
    { name: "Soft", value: softViolations, fill: "oklch(0.75 0.15 80)" },
    { name: "Violating", value: violating, fill: "oklch(0.65 0.2 25)" },
  ];

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={cv}>
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, idx) => <KpiCardWithSparkline key={k.label} kpi={k} idx={idx} />)}
        {/* Health gauge */}
        <motion.div variants={cardV} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${gaugeColor}, transparent)` }} />
            <div className="bg-grid-fine absolute inset-0 opacity-20" />
            <div className="relative flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">System Health</span>
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={gaugeData} startAngle={225} endAngle={-45} innerRadius={36} outerRadius={48} strokeWidth={0} dataKey="value" animationDuration={1000}>
                    <Cell fill={gaugeColor} /><Cell fill="oklch(0.25 0.012 168)" />
                  </Pie></PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: gaugeColor }}>{healthScore}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{healthStatus}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: gaugeColor }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: gaugeColor }} />
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">system pulse</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Live System Pulse */}
      <motion.div variants={secV}>
        <CardShell accent="linear-gradient(90deg, oklch(0.78 0.16 160 / 0.4), oklch(0.75 0.15 80 / 0.3), oklch(0.65 0.2 25 / 0.2))">
          <SectionHeader2 icon={Activity} title="Live System Pulse" extra={
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verified" /></span>
              24h · refresh 15s
            </span>
          } />
          {metrics ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MetricChip label="Success Rate" value={`${metrics.throughput.successRate}%`} color="text-verified" />
                <MetricChip label="Avg Divergence" value={metrics.throughput.avgDivergence.toFixed(2)} color="text-repairing" />
                <MetricChip label="Avg Iterations" value={metrics.throughput.avgIterations.toFixed(1)} color="text-verified" />
                <MetricChip label="P95 Latency" value={`${metrics.latency.p95}ms`} color="text-quarantined" />
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.timeSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 168 / 0.3)" />
                    <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit" })} tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9 }} stroke="oklch(0.3 0.01 168 / 0.5)" />
                    <YAxis tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9 }} stroke="oklch(0.3 0.01 168 / 0.5)" />
                    <RTooltip contentStyle={CHART_STYLE} labelFormatter={(t) => new Date(t as number).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line type="monotone" dataKey="merges" stroke="oklch(0.78 0.16 160)" strokeWidth={2} dot={false} name="Merges" />
                    <Line type="monotone" dataKey="repairs" stroke="oklch(0.75 0.15 80)" strokeWidth={2} dot={false} name="Repairs" />
                    <Line type="monotone" dataKey="violations" stroke="oklch(0.65 0.2 25)" strokeWidth={2} dot={false} name="Violations" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">Severity:</span>
                <div className="flex-1 flex items-center gap-2">
                  {(["critical", "high", "medium", "low"] as const).map((s, i) => {
                    const colors = ["bg-violating", "bg-repairing", "bg-quarantined", "bg-muted-foreground"];
                    const sevTotal = metrics.severityBreakdown.critical + metrics.severityBreakdown.high + metrics.severityBreakdown.medium + metrics.severityBreakdown.low;
                    return <SeverityBar key={s} label={s} count={metrics.severityBreakdown[s]} max={Math.max(sevTotal, 1)} color={colors[i]} />;
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified mr-2" />Loading live metrics…
            </div>
          )}
        </CardShell>
      </motion.div>

      {/* Runtime Inventory + Activity */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={secV}>
        <CardShell accent="linear-gradient(90deg, oklch(0.78 0.16 160 / 0.4), oklch(0.75 0.15 80 / 0.3), transparent)">
          <SectionHeader2 icon={Boxes} title="Runtime Inventory" />
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
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0">{item.hint}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardShell>

        <Card className="lg:col-span-2 bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-repairing/40 via-verified/30 to-transparent" />
          <div className="bg-grid-fine absolute inset-0 opacity-15" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-repairing/10"><Activity className="h-3.5 w-3.5 text-repairing" /></div>
              <h3 className="text-sm font-semibold">Live Epistemic Activity</h3>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verified" /></span>
                refresh 8s
              </span>
            </div>
            <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {activityItems.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>}
                {activityItems.map((a, i) => {
                  const Cfg = a.config;
                  const ActIcon = Cfg.icon;
                  return (
                    <motion.div key={`${a.title}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="relative flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5 mb-2 hover:border-border/60 hover:bg-background/50 transition-all group/act">
                      <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${Cfg.bg} ${Cfg.border} border`}>
                        <ActIcon className={`h-3.5 w-3.5 ${Cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${Cfg.bg} ${Cfg.color}`}>{Cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate font-mono">{a.detail}</p>
                          <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono shrink-0 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
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

      {/* Shard Health Heatmap + Coverage Ring */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={secV}>
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 via-repairing/30 to-violating/20" />
          <div className="bg-grid-fine absolute inset-0 opacity-15" />
          <div className="relative">
            <SectionHeader2 icon={LayoutGrid} title="Shard Health Heatmap" extra={<span className="ml-auto text-[10px] text-muted-foreground font-mono">{shards ? `${shards.length} shards` : "loading…"}</span>} />
            {shards ? (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                  {shards.map((shard, i) => (
                    <motion.div key={shard.id} title={`${shard.shardKey} (${shard.region}) — ${shard.invariantStatus}`}
                      className={`heatmap-cell h-8 w-full rounded cursor-default relative ${shard.invariantStatus === "violating" ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: COLOR_MAP[shard.invariantStatus] ?? COLOR_MAP.healthy }}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02, duration: 0.2 }} />
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {[["Healthy", "oklch(0.78 0.16 160)"], ["Repairing", "oklch(0.75 0.15 80)"], ["Violating", "oklch(0.65 0.2 25)"]].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-sm${l === "Violating" ? " animate-pulse" : ""}`} style={{ backgroundColor: c }} />
                      <span className="text-[9px] text-muted-foreground font-mono uppercase">{l}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="h-24 flex items-center justify-center text-sm text-muted-foreground"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified mr-2" />Loading shards…</div>}
          </div>
        </Card>

        <CardShell accent="linear-gradient(90deg, oklch(0.78 0.16 160 / 0.4), oklch(0.65 0.2 25 / 0.3), oklch(0.75 0.15 80 / 0.2))">
          <SectionHeader2 icon={ShieldCheck} title="Invariant Coverage" />
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={ringData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} strokeWidth={0} dataKey="value" animationDuration={1000}>
                  {ringData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums text-verified">{Math.round((passing / totalInv) * 100)}%</span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-wider">coverage</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {ringData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                  <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">({Math.round((item.value / totalInv) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </CardShell>
      </motion.div>

      {/* Policy Status Timeline */}
      <motion.div variants={secV}>
        <CardShell accent="linear-gradient(90deg, oklch(0.78 0.16 160 / 0.4), oklch(0.65 0.2 25 / 0.3), oklch(0.75 0.15 80 / 0.2))">
          <SectionHeader2 icon={Clock} title="Policy Status Timeline" extra={<span className="ml-auto text-[10px] text-muted-foreground font-mono">last 12h</span>} />
          <div className="relative h-16">
            <div className="absolute top-5 left-0 right-0 h-1 rounded-full bg-border/40" />
            <div className="absolute inset-x-0 top-4 flex justify-between">
              {Array.from({ length: 7 }).map((_, h) => {
                const hour = new Date(Date.now() - (12 - h * 2) * 3600000);
                return <div key={h} className="flex flex-col items-center"><span className="h-2 w-px bg-border/60" /><span className="text-[7px] text-muted-foreground/50 font-mono mt-0.5">{hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>;
              })}
            </div>
            {stats.activity.map((event, i) => {
              const eventTime = new Date(event.at).getTime();
              const twelveHoursAgo = Date.now() - 12 * 3600000;
              const position = ((eventTime - twelveHoursAgo) / (12 * 3600000)) * 100;
              if (position < 0 || position > 100) return null;
              const isViolation = event.title.includes("breach");
              const isShadow = event.kind === "shadow" && !isViolation;
              const dotColor = isViolation ? "bg-violating" : isShadow ? "bg-repairing" : "bg-verified";
              return (
                <Tooltip key={`ev-${i}`}>
                  <TooltipTrigger asChild>
                    <motion.div className={`absolute top-4 -translate-y-1/2 h-3 w-3 rounded-full ${dotColor} ring-2 ring-background cursor-pointer z-10`}
                      style={{ left: `${position}%` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 400 }} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-mono">
                    <span className="font-semibold">{event.title}</span><br />
                    <span className="text-muted-foreground">{event.detail}</span><br />
                    <span className="text-muted-foreground">{new Date(event.at).toLocaleString()}</span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[["Merge", "bg-verified"], ["Violation", "bg-violating"], ["Shadow", "bg-repairing"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${c}`} /><span className="text-[9px] text-muted-foreground font-mono uppercase">{l}</span></div>
            ))}
          </div>
        </CardShell>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div variants={secV}>
        <Card className="bg-card/60 backdrop-blur border-border/60 p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/30 via-repairing/20 to-violating/10" />
          <div className="relative flex flex-wrap items-center gap-3">
            <motion.button className="card-hover-lift flex items-center gap-2 rounded-lg border border-verified/30 bg-verified/10 px-4 py-2 text-sm font-medium text-verified hover:bg-verified/20 transition-colors"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { fetch("/api/shards").then(() => fetch("/api/stats").then((r) => r.json()).then((d) => setStats(d))); }}>
              <ShieldCheck className="h-4 w-4" />Run All Invariants
            </motion.button>
            <motion.button className="card-hover-lift flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-background/60 transition-colors"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { const data = JSON.stringify({ stats, metrics, exportedAt: new Date().toISOString() }, null, 2); const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `epistemic-dashboard-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}>
              <Download className="h-4 w-4" />Export Dashboard
            </motion.button>
            <motion.button className={`card-hover-lift flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${autoRefresh ? "border-verified/30 bg-verified/10 text-verified hover:bg-verified/20" : "border-border/60 bg-background/40 text-muted-foreground hover:bg-background/60"}`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setAutoRefresh((v) => !v)}>
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : undefined} />
              {autoRefresh ? "Auto-Refresh: ON" : "Auto-Refresh: OFF"}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* Capability Map */}
      <motion.div variants={secV}>
        <CardShell accent="linear-gradient(90deg, oklch(0.78 0.16 160 / 0.4), oklch(0.75 0.15 80 / 0.3), oklch(0.65 0.2 25 / 0.2))">
          <SectionHeader2 icon={TrendingUp} title="Capability Map" extra={<span className="ml-auto text-[10px] text-muted-foreground font-mono">epistemic://</span>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CAPABILITIES.map((c, idx) => {
              const Icon = CAPABILITY_ICONS[c.id] ?? Activity;
              return (
                <motion.button key={c.id} onClick={() => onJump(c.id)}
                  className={`group text-left rounded-xl border border-border/40 bg-gradient-to-br ${c.g} p-3 hover:border-verified/40 hover:shadow-[0_0_16px_-4px_oklch(0.78_0.16_160/0.3)] transition-all relative overflow-hidden`}
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02, duration: 0.25 }}>
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
        </CardShell>
      </motion.div>
    </motion.div>
  );
}

function KpiCardWithSparkline({ kpi, idx }: { kpi: { label: string; value: string; numericValue: number; sub: string; icon: typeof Activity; status: string | null; sparkBase: number; sparkVariance: number; accentColor: string }; idx: number }) {
  const Icon = kpi.icon;
  const sparkData = useMemo(() => generateSparkline(kpi.sparkBase, kpi.sparkVariance).map((v, i) => ({ v, i })), [kpi.sparkBase, kpi.sparkVariance]);
  return (
    <motion.div variants={cardV} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full group cursor-default">
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${kpi.accentColor}, transparent)` }} />
        <div className="bg-grid-fine absolute inset-0 opacity-20" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-end gap-2 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums leading-none">{kpi.value}</span>
            {kpi.status && <StatusPill status={kpi.status as "healthy" | "repairing" | "violating"} />}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-tight">{kpi.sub}</p>
          <div className="mt-2 h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id={`spark-${idx}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={kpi.accentColor} stopOpacity={0.4} /><stop offset="100%" stopColor={kpi.accentColor} stopOpacity={0.05} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke={kpi.accentColor} strokeWidth={1.5} fill={`url(#spark-${idx})`} animationDuration={600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
