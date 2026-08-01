"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SparkLine, MiniBar, DonutChart,
} from "./chart-primitives";
import { Activity, TrendingUp, TrendingDown, Minus, Gauge, Timer, GitBranch, AlertTriangle, Server, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GradientBorderCard, containerVariants, cardVariants, GridOverlay, StatusPill, TopAccentBar, SeverityDot, CHART_TOOLTIP_STYLE } from "./primitives";

interface MetricsData {
  throughput: { totalMerges: number; appliedMerges: number; rejectedMerges: number; successRate: number; avgDivergence: number; avgIterations: number };
  timeSeries: { t: number; merges: number; violations: number; repairs: number }[];
  nodeLoad: { node: string; shards: number; healthy: number; repairing: number; violating: number; load: number }[];
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  latency: { p50: number; p95: number; p99: number };
  shardCount: number; timestamp: number;
}

const successColor = (r: number) => r >= 80 ? "text-verified" : r >= 50 ? "text-repairing" : "text-violating";
const divColor = (v: number) => v < 0.001 ? "text-verified" : v < 1 ? "text-repairing" : "text-violating";
const loadClr = (l: number) => l < 40 ? "oklch(0.78 0.16 160)" : l < 70 ? "oklch(0.75 0.15 80)" : "oklch(0.65 0.2 25)";
const loadBg = (l: number) => l < 40 ? "bg-verified/20 border-verified/30" : l < 70 ? "bg-repairing/20 border-repairing/30" : "bg-violating/20 border-violating/30";
const secV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function PerformanceMetricsSection() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/metrics"); if (!r.ok) throw new Error(); setMetrics(await r.json()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const timeSeriesData = useMemo(() => metrics ? metrics.timeSeries.map((p) => ({ ...p, time: new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })) : [], [metrics]);
  const severityData = useMemo(() => {
    if (!metrics) return [];
    const sb = metrics.severityBreakdown;
    return [
      { label: "Critical", value: sb.critical, color: "violating" },
      { label: "High", value: sb.high, color: "repairing" },
      { label: "Medium", value: sb.medium, color: "quarantined" },
      { label: "Low", value: sb.low, color: "verified" },
    ].filter((d) => d.value > 0);
  }, [metrics]);
  const latencyData = useMemo(() => metrics ? [
    { label: "P50", value: metrics.latency.p50, color: "verified" },
    { label: "P95", value: metrics.latency.p95, color: "repairing" },
    { label: "P99", value: metrics.latency.p99, color: "violating" },
  ] : [], [metrics]);
  const totalViolations = useMemo(() => metrics ? metrics.severityBreakdown.critical + metrics.severityBreakdown.high + metrics.severityBreakdown.medium + metrics.severityBreakdown.low : 0, [metrics]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified mr-3" /><span className="text-sm text-muted-foreground">Loading metrics…</span></div>;
  if (!metrics) return <div className="flex items-center justify-center py-20"><span className="text-sm text-muted-foreground">Unable to load metrics.</span></div>;

  const TrendIcon = metrics.throughput.successRate >= 80 ? TrendingUp : TrendingDown;

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header */}
      <motion.div variants={cardVariants}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.78 0.16 160)" /><GridOverlay opacity="opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10"><Activity className="h-4.5 w-4.5 text-verified" /></div>
              <div><h2 className="text-base font-semibold">Performance Metrics</h2><p className="text-xs text-muted-foreground">Real-time throughput, latency & violation analytics</p></div>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-[10px] font-mono border-border/60 bg-muted/30"><Layers className="h-3 w-3 text-verified" />{metrics.shardCount} shards</Badge>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verified" /></span>live · 15s
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Merges", value: metrics.throughput.totalMerges, sub: `${metrics.throughput.rejectedMerges} rejected`, icon: TrendIcon, color: "oklch(0.78 0.16 160)" },
          { label: "Success Rate", value: `${metrics.throughput.successRate}%`, sub: null, icon: Gauge, color: loadClr(metrics.throughput.successRate), isRate: true },
          { label: "Avg Divergence", value: metrics.throughput.avgDivergence.toFixed(3), sub: metrics.throughput.avgDivergence < 0.001 ? "negligible" : metrics.throughput.avgDivergence < 1 ? "moderate" : "high", icon: GitBranch, color: "oklch(0.75 0.15 80)" },
          { label: "Avg Iterations", value: metrics.throughput.avgIterations.toFixed(1), sub: "repair cycles", icon: Activity, color: "oklch(0.78 0.16 160)" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }}>
            <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />
              <div className="bg-grid-fine absolute inset-0 opacity-15" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.isRate ? successColor(metrics.throughput.successRate) : divColor(metrics.throughput.avgDivergence))} />
                </div>
                <div className="mt-2"><span className={cn("text-2xl font-semibold tabular-nums", kpi.isRate ? successColor(metrics.throughput.successRate) : "text-foreground")}>{kpi.value}</span></div>
                {kpi.isRate && <div className="mt-1.5 h-1.5 rounded-full bg-background/60 overflow-hidden"><motion.div className={cn("h-full rounded-full", metrics.throughput.successRate >= 80 ? "bg-verified" : metrics.throughput.successRate >= 50 ? "bg-repairing" : "bg-violating")} initial={{ width: 0 }} animate={{ width: `${metrics.throughput.successRate}%` }} transition={{ duration: 0.6 }} /></div>}
                {kpi.sub && <p className="mt-1 text-[10px] text-muted-foreground">{kpi.sub}</p>}
              </div>
            </Card>
          </motion.div>
        ))}
        {/* Latency KPI (wider) */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.02 }} className="col-span-2 sm:col-span-1 lg:col-span-2">
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), oklch(0.75 0.15 80), oklch(0.65 0.2 25))" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</span><Timer className="h-3.5 w-3.5 text-repairing" /></div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[["P50", metrics.latency.p50, "text-verified"], ["P95", metrics.latency.p95, "text-repairing"], ["P99", metrics.latency.p99, "text-violating"]].map(([l, v, c]) => (
                  <div key={l}><div className="text-[9px] uppercase text-muted-foreground font-mono">{l}</div><div className={cn("text-lg font-semibold tabular-nums", c)}>{v}<span className="text-[10px] text-muted-foreground ml-0.5">ms</span></div></div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Throughput over Time */}
      <motion.div variants={secV}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.78 0.16 160)" /><GridOverlay opacity="opacity-10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verified/10"><TrendingUp className="h-3.5 w-3.5 text-verified" /></div>
              <h3 className="text-sm font-semibold">Throughput Over Time</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">24h window</span>
            </div>
            <div className="h-64 w-full flex flex-col gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-verified/70" />Merges</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-repairing/70" />Repairs</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violating/70" />Violations</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <SparkLine data={timeSeriesData.map((d) => d.merges)} width={400} height={80} color="verified" fill className="w-full" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <SparkLine data={timeSeriesData.map((d) => d.repairs)} width={400} height={60} color="repairing" fill className="w-full" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <SparkLine data={timeSeriesData.map((d) => d.violations)} width={400} height={40} color="violating" fill className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Node Load + Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Node Load */}
        <motion.div variants={secV}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.75 0.15 80)" /><GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10"><Server className="h-3.5 w-3.5 text-repairing" /></div>
                <h3 className="text-sm font-semibold">Node Load Heatmap</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{metrics.nodeLoad.length} nodes</span>
              </div>
              {metrics.nodeLoad.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">No node data</div> : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {metrics.nodeLoad.map((node, idx) => (
                    <motion.div key={node.node} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04, duration: 0.2 }}
                      className={cn("rounded-lg border p-3 transition-all hover:scale-[1.01]", loadBg(node.load))}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Server className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-mono font-medium truncate max-w-[120px]">{node.node}</span></div>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: loadClr(node.load) }}>{node.load}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-background/60 overflow-hidden mb-2">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: loadClr(node.load) }} initial={{ width: 0 }} animate={{ width: `${node.load}%` }} transition={{ duration: 0.5, delay: idx * 0.04 }} />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {[["Shards", node.shards, "text-foreground"], ["Healthy", node.healthy, "text-verified"], ["Repair", node.repairing, "text-repairing"], ["Violate", node.violating, "text-violating"]].map(([l, v, c]) => (
                          <div key={l} className="rounded border border-border/30 bg-background/40 px-1 py-0.5">
                            <div className="text-[8px] text-muted-foreground uppercase">{l}</div>
                            <div className={cn("text-[11px] font-mono font-semibold", c)}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {metrics.nodeLoad.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide mb-2">Load Grid</div>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.nodeLoad.map((node) => (
                      <div key={`g-${node.node}`} className="rounded-md border border-border/30 w-12 h-12 flex flex-col items-center justify-center" style={{ backgroundColor: `${loadClr(node.load)}15` }}>
                        <span className="text-[9px] font-mono font-semibold" style={{ color: loadClr(node.load) }}>{node.load}%</span>
                        <span className="text-[7px] font-mono text-muted-foreground truncate max-w-[40px]">{node.node.slice(0, 6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Severity Distribution */}
        <motion.div variants={secV}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.65 0.2 25)" /><GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violating/10"><AlertTriangle className="h-3.5 w-3.5 text-violating" /></div>
                <h3 className="text-sm font-semibold">Severity Distribution</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{totalViolations} total</span>
              </div>
              {totalViolations === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">No violations</div> : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    <DonutChart data={severityData} size={120} thickness={18} showLabels />
                  </div>
                  <div className="mt-3 w-full">
                    <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide mb-1.5">Breakdown</div>
                    <div className="flex h-4 rounded-full overflow-hidden bg-background/60">
                      {severityData.map((s, i) => { const pct = totalViolations > 0 ? (s.value / totalViolations) * 100 : 0; return <motion.div key={i} className="h-full" style={{ backgroundColor: s.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} />; })}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {severityData.map((s, i) => <div key={i} className="flex items-center gap-1"><SeverityDot severity={s.label.toLowerCase()} /><span className="text-[9px] font-mono text-muted-foreground">{s.label} <span className="font-semibold" style={{ color: s.color }}>{s.value}</span></span></div>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Latency Distribution */}
      <motion.div variants={secV}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.75 0.15 80)" /><GridOverlay opacity="opacity-10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10"><Timer className="h-3.5 w-3.5 text-repairing" /></div>
              <h3 className="text-sm font-semibold">Latency Distribution</h3>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">merge commit ms</span>
            </div>
            <div className="h-44 w-full flex items-end justify-center">
              <MiniBar data={latencyData} width={260} height={120} className="w-full" />
            </div>
            <div className="mt-3 flex items-center gap-4 pt-3 border-t border-border/30">
              {[["P50", metrics.latency.p50, "oklch(0.78 0.16 160)", "text-verified"], ["P95", metrics.latency.p95, "oklch(0.75 0.15 80)", "text-repairing"], ["P99", metrics.latency.p99, "oklch(0.65 0.2 25)", "text-violating"]].map(([l, v, bg, tc]) => (
                <div key={l} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: bg as string }} /><span className="text-[9px] font-mono text-muted-foreground">{l}: <span className={cn("font-semibold", tc)}>{v}ms</span></span></div>
              ))}
              <span className="ml-auto text-[9px] font-mono text-muted-foreground">tail ratio: <span className="text-foreground font-semibold">{(metrics.latency.p99 / Math.max(metrics.latency.p50, 1)).toFixed(1)}x</span></span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
