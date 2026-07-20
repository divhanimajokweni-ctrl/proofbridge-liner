"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Timer,
  GitBranch,
  AlertTriangle,
  Server,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GradientBorderCard,
  containerVariants,
  cardVariants,
  itemVariants,
  GridOverlay,
  StatusPill,
  StatCard,
  TopAccentBar,
  SeverityDot,
  SEVERITY_CLASSES,
  CHART_TOOLTIP_STYLE,
} from "./primitives";

/* ─── Types ─── */
interface MetricsData {
  throughput: {
    totalMerges: number;
    appliedMerges: number;
    rejectedMerges: number;
    successRate: number;
    avgDivergence: number;
    avgIterations: number;
  };
  timeSeries: { t: number; merges: number; violations: number; repairs: number }[];
  nodeLoad: { node: string; shards: number; healthy: number; repairing: number; violating: number; load: number }[];
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  latency: { p50: number; p95: number; p99: number };
  shardCount: number;
  timestamp: number;
}

/* ─── Color helpers ─── */
function successRateColor(rate: number): string {
  if (rate >= 80) return "text-verified";
  if (rate >= 50) return "text-repairing";
  return "text-violating";
}

function successRateBg(rate: number): string {
  if (rate >= 80) return "bg-verified/10 border-verified/30";
  if (rate >= 50) return "bg-repairing/10 border-repairing/30";
  return "bg-violating/10 border-violating/30";
}

function divergenceColor(v: number): string {
  if (v < 0.001) return "text-verified";
  if (v < 1) return "text-repairing";
  return "text-violating";
}

function loadColor(load: number): string {
  if (load < 40) return "oklch(0.78 0.16 160)"; // green
  if (load < 70) return "oklch(0.75 0.15 80)";  // amber
  return "oklch(0.65 0.2 25)";                   // red
}

function loadBgClass(load: number): string {
  if (load < 40) return "bg-verified/20 border-verified/30";
  if (load < 70) return "bg-repairing/20 border-repairing/30";
  return "bg-violating/20 border-violating/30";
}

/* ─── Section variants ─── */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ─── Main Component ─── */
export function PerformanceMetricsSection() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/metrics");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: MetricsData = await r.json();
      setMetrics(d);
      setLastRefresh(Date.now());
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-poll every 15s
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  /* ─── Derived data ─── */
  const timeSeriesData = useMemo(() => {
    if (!metrics) return [];
    return metrics.timeSeries.map((p) => ({
      ...p,
      time: new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));
  }, [metrics]);

  const severityData = useMemo(() => {
    if (!metrics) return [];
    const sb = metrics.severityBreakdown;
    const total = sb.critical + sb.high + sb.medium + sb.low;
    return [
      { name: "Critical", value: sb.critical, color: "oklch(0.65 0.2 25)", className: "bg-violating" },
      { name: "High", value: sb.high, color: "oklch(0.75 0.15 80)", className: "bg-repairing" },
      { name: "Medium", value: sb.medium, color: "oklch(0.70 0.10 200)", className: "bg-quarantined" },
      { name: "Low", value: sb.low, color: "oklch(0.55 0.04 168)", className: "bg-muted-foreground" },
    ].filter((d) => d.value > 0 || total === 0);
  }, [metrics]);

  const latencyData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "P50", value: metrics.latency.p50, fill: "oklch(0.78 0.16 160)" },
      { name: "P95", value: metrics.latency.p95, fill: "oklch(0.75 0.15 80)" },
      { name: "P99", value: metrics.latency.p99, fill: "oklch(0.65 0.2 25)" },
    ];
  }, [metrics]);

  const totalViolations = useMemo(() => {
    if (!metrics) return 0;
    const sb = metrics.severityBreakdown;
    return sb.critical + sb.high + sb.medium + sb.low;
  }, [metrics]);

  // Trend direction for total merges
  const trendIcon = useMemo(() => {
    if (!metrics || metrics.throughput.totalMerges === 0) return Minus;
    return metrics.throughput.successRate >= 80 ? TrendingUp : TrendingDown;
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified" />
          <span className="text-sm">Loading performance metrics…</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-muted-foreground">Unable to load metrics data.</span>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ── 1. Header Card ── */}
      <motion.div variants={cardVariants}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.78 0.16 160)" />
          <GridOverlay opacity="opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10">
                <Activity className="h-4.5 w-4.5 text-verified" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Performance Metrics</h2>
                <p className="text-xs text-muted-foreground">Real-time throughput, latency & violation analytics</p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-[10px] font-mono border-border/60 bg-muted/30">
                <Layers className="h-3 w-3 text-verified" />
                {metrics.shardCount} shards
              </Badge>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verified" />
                </span>
                live · refresh 15s
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── 2. KPI Strip ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        variants={containerVariants}
      >
        {/* Total Merges */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Merges</span>
                {(() => { const TrendIcon = trendIcon; return <TrendIcon className={cn("h-3.5 w-3.5", metrics.throughput.successRate >= 80 ? "text-verified" : metrics.throughput.successRate >= 50 ? "text-repairing" : "text-violating")} />; })()}
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold tabular-nums">{metrics.throughput.totalMerges}</span>
                <StatusPill status={metrics.throughput.successRate >= 80 ? "applied" : metrics.throughput.successRate >= 50 ? "pending" : "rejected"} label={`${metrics.throughput.appliedMerges} ok`} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{metrics.throughput.rejectedMerges} rejected</p>
            </div>
          </Card>
        </motion.div>

        {/* Success Rate */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${loadColor(metrics.throughput.successRate)}, transparent)` }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Success Rate</span>
                <Gauge className={cn("h-3.5 w-3.5", successRateColor(metrics.throughput.successRate))} />
              </div>
              <div className="mt-2">
                <span className={cn("text-2xl font-semibold tabular-nums", successRateColor(metrics.throughput.successRate))}>
                  {metrics.throughput.successRate}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-background/60 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", metrics.throughput.successRate >= 80 ? "bg-verified" : metrics.throughput.successRate >= 50 ? "bg-repairing" : "bg-violating")}
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.throughput.successRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Avg Divergence */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.75 0.15 80), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Divergence</span>
                <GitBranch className={cn("h-3.5 w-3.5", divergenceColor(metrics.throughput.avgDivergence))} />
              </div>
              <div className="mt-2">
                <span className={cn("text-2xl font-semibold tabular-nums", divergenceColor(metrics.throughput.avgDivergence))}>
                  {metrics.throughput.avgDivergence.toFixed(3)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {metrics.throughput.avgDivergence < 0.001 ? "negligible" : metrics.throughput.avgDivergence < 1 ? "moderate" : "high"} drift
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Avg Iterations */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Iterations</span>
                <Activity className="h-3.5 w-3.5 text-verified" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {metrics.throughput.avgIterations.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">repair cycles</p>
            </div>
          </Card>
        </motion.div>

        {/* Latency P50/P95/P99 */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="col-span-2 sm:col-span-1 lg:col-span-2">
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), oklch(0.75 0.15 80), oklch(0.65 0.2 25))" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</span>
                <Timer className="h-3.5 w-3.5 text-repairing" />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground font-mono">P50</div>
                  <div className="text-lg font-semibold tabular-nums text-verified">{metrics.latency.p50}<span className="text-[10px] text-muted-foreground ml-0.5">ms</span></div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground font-mono">P95</div>
                  <div className="text-lg font-semibold tabular-nums text-repairing">{metrics.latency.p95}<span className="text-[10px] text-muted-foreground ml-0.5">ms</span></div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground font-mono">P99</div>
                  <div className="text-lg font-semibold tabular-nums text-violating">{metrics.latency.p99}<span className="text-[10px] text-muted-foreground ml-0.5">ms</span></div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── 3. Throughput over Time ── */}
      <motion.div variants={sectionVariants}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.78 0.16 160)" />
          <GridOverlay opacity="opacity-10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verified/10">
                <TrendingUp className="h-3.5 w-3.5 text-verified" />
              </div>
              <h3 className="text-sm font-semibold">Throughput Over Time</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">24h window</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradMerges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 160)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 160)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradRepairs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.75 0.15 80)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.75 0.15 80)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradViolations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 168 / 0.3)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    stroke="oklch(0.3 0.01 168 / 0.5)"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    stroke="oklch(0.3 0.01 168 / 0.5)"
                  />
                  <RTooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={(l) => String(l)} />
                  <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)" }} />
                  <Area type="monotone" dataKey="merges" stroke="oklch(0.78 0.16 160)" strokeWidth={2} fill="url(#gradMerges)" name="Merges" animationDuration={600} />
                  <Area type="monotone" dataKey="repairs" stroke="oklch(0.75 0.15 80)" strokeWidth={2} fill="url(#gradRepairs)" name="Repairs" animationDuration={600} />
                  <Area type="monotone" dataKey="violations" stroke="oklch(0.65 0.2 25)" strokeWidth={2} fill="url(#gradViolations)" name="Violations" animationDuration={600} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── 4 & 5: Node Load Heatmap + Severity Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── 4. Node Load Heatmap ── */}
        <motion.div variants={sectionVariants}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.75 0.15 80)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10">
                  <Server className="h-3.5 w-3.5 text-repairing" />
                </div>
                <h3 className="text-sm font-semibold">Node Load Heatmap</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{metrics.nodeLoad.length} nodes</span>
              </div>

              {metrics.nodeLoad.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No node data available</div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <AnimatePresence>
                    {metrics.nodeLoad.map((node, idx) => (
                      <motion.div
                        key={node.node}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        className={cn(
                          "rounded-lg border p-3 transition-all hover:scale-[1.01]",
                          loadBgClass(node.load)
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Server className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-mono font-medium truncate max-w-[120px]">{node.node}</span>
                          </div>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: loadColor(node.load) }}
                          >
                            {node.load}%
                          </span>
                        </div>
                        {/* Load bar */}
                        <div className="h-2 rounded-full bg-background/60 overflow-hidden mb-2">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: loadColor(node.load) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${node.load}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.05 }}
                          />
                        </div>
                        {/* Sub-stats */}
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="rounded border border-border/30 bg-background/40 px-1 py-0.5">
                            <div className="text-[8px] text-muted-foreground uppercase">Shards</div>
                            <div className="text-[11px] font-mono font-semibold">{node.shards}</div>
                          </div>
                          <div className="rounded border border-verified/20 bg-verified/5 px-1 py-0.5">
                            <div className="text-[8px] text-verified uppercase">Healthy</div>
                            <div className="text-[11px] font-mono font-semibold text-verified">{node.healthy}</div>
                          </div>
                          <div className="rounded border border-repairing/20 bg-repairing/5 px-1 py-0.5">
                            <div className="text-[8px] text-repairing uppercase">Repair</div>
                            <div className="text-[11px] font-mono font-semibold text-repairing">{node.repairing}</div>
                          </div>
                          <div className="rounded border border-violating/20 bg-violating/5 px-1 py-0.5">
                            <div className="text-[8px] text-violating uppercase">Violate</div>
                            <div className="text-[11px] font-mono font-semibold text-violating">{node.violating}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Heatmap visual grid */}
              {metrics.nodeLoad.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide mb-2">Load Distribution Grid</div>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.nodeLoad.map((node) => (
                      <motion.div
                        key={`grid-${node.node}`}
                        className="relative rounded-md border border-border/30 w-12 h-12 flex flex-col items-center justify-center cursor-default group"
                        style={{ backgroundColor: `${loadColor(node.load)}15` }}
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-[9px] font-mono font-semibold truncate max-w-[40px]" style={{ color: loadColor(node.load) }}>
                          {node.load}%
                        </span>
                        <span className="text-[7px] font-mono text-muted-foreground truncate max-w-[40px]">{node.node.slice(0, 6)}</span>
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-popover border border-border px-2 py-1 text-[9px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {node.node}: {node.shards} shards
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "oklch(0.78 0.16 160)" }} />
                      <span className="text-[9px] text-muted-foreground font-mono">&lt;40%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "oklch(0.75 0.15 80)" }} />
                      <span className="text-[9px] text-muted-foreground font-mono">40-70%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "oklch(0.65 0.2 25)" }} />
                      <span className="text-[9px] text-muted-foreground font-mono">&gt;70%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 5. Severity Distribution ── */}
        <motion.div variants={sectionVariants}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.65 0.2 25)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violating/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-violating" />
                </div>
                <h3 className="text-sm font-semibold">Severity Distribution</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{totalViolations} total</span>
              </div>

              {totalViolations === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No violations recorded</div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* PieChart */}
                  <div className="h-48 w-full max-w-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          strokeWidth={1}
                          stroke="oklch(0.205 0.014 168)"
                          dataKey="value"
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {severityData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend
                          wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)" }}
                          formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Horizontal stacked bar */}
                  <div className="mt-3 w-full">
                    <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide mb-1.5">Violation Breakdown</div>
                    <div className="flex h-4 rounded-full overflow-hidden bg-background/60">
                      {severityData.map((s, i) => {
                        const pct = totalViolations > 0 ? (s.value / totalViolations) * 100 : 0;
                        return (
                          <motion.div
                            key={i}
                            className="h-full"
                            style={{ backgroundColor: s.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                            title={`${s.name}: ${s.value} (${pct.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {severityData.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <SeverityDot severity={s.name.toLowerCase()} />
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {s.name} <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── 6. Latency Distribution ── */}
      <motion.div variants={sectionVariants}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.75 0.15 80)" />
          <GridOverlay opacity="opacity-10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10">
                <Timer className="h-3.5 w-3.5 text-repairing" />
              </div>
              <h3 className="text-sm font-semibold">Latency Distribution</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">merge commit ms</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 168 / 0.3)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    stroke="oklch(0.3 0.01 168 / 0.5)"
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    stroke="oklch(0.3 0.01 168 / 0.5)"
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <RTooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v}ms`, "Latency"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {latencyData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Summary row */}
            <div className="mt-3 flex items-center gap-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.78 0.16 160)" }} />
                <span className="text-[9px] font-mono text-muted-foreground">P50: <span className="text-verified font-semibold">{metrics.latency.p50}ms</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 80)" }} />
                <span className="text-[9px] font-mono text-muted-foreground">P95: <span className="text-repairing font-semibold">{metrics.latency.p95}ms</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.65 0.2 25)" }} />
                <span className="text-[9px] font-mono text-muted-foreground">P99: <span className="text-violating font-semibold">{metrics.latency.p99}ms</span></span>
              </div>
              <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                tail ratio: <span className="text-foreground font-semibold">{(metrics.latency.p99 / Math.max(metrics.latency.p50, 1)).toFixed(1)}x</span>
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
