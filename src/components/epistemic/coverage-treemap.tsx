"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Treemap,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import {
  GitGraph,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
  Download,
  RefreshCw,
  Search,
  Minus,
  Shield,
  BarChart3,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  cardVariants,
  itemVariants,
  StatusPill,
  Hash,
  SectionHeader,
  StatCard,
  TopAccentBar,
  GridOverlay,
  CHART_TOOLTIP_STYLE,
} from "./primitives";
import type { ShardStatus } from "@/lib/types";

/* ─── Types ─── */
interface ShardCoverage {
  id: string;
  name: string;
  hash: string;
  invariantCount: number;
  coveragePct: number;
  status: ShardStatus;
  lastChecked: string;
  trend: "up" | "down" | "stable";
}

interface CoverageGap {
  id: string;
  invariantName: string;
  shardName: string;
  shardHash: string;
  coveragePct: number;
  severity: "critical" | "high" | "medium";
}

interface CoverageData {
  shards: ShardCoverage[];
  totalInvariants: number;
  avgCoverage: number;
  uncoveredCount: number;
  criticalGaps: number;
  distribution: { bucket: string; count: number; fill: string }[];
  generatedAt: number;
}

/* ─── Sort type for table ─── */
type SortKey = "name" | "invariantCount" | "coveragePct" | "lastChecked";
type SortDir = "asc" | "desc";

/* ─── Color helpers ─── */
function coverageColor(pct: number): string {
  if (pct >= 80) return "oklch(0.78 0.16 160)"; // green
  if (pct >= 60) return "oklch(0.70 0.13 120)"; // light green
  if (pct >= 40) return "oklch(0.75 0.15 80)";  // amber
  if (pct >= 20) return "oklch(0.72 0.13 50)";  // orange
  return "oklch(0.65 0.2 25)";                   // red
}

function coverageTextClass(pct: number): string {
  if (pct >= 80) return "text-verified";
  if (pct >= 60) return "text-emerald-400";
  if (pct >= 40) return "text-repairing";
  if (pct >= 20) return "text-orange-400";
  return "text-violating";
}

function coverageBgClass(pct: number): string {
  if (pct >= 80) return "bg-verified/10 border-verified/30";
  if (pct >= 60) return "bg-emerald-500/10 border-emerald-500/30";
  if (pct >= 40) return "bg-repairing/10 border-repairing/30";
  if (pct >= 20) return "bg-orange-500/10 border-orange-500/30";
  return "bg-violating/10 border-violating/30";
}

function gapSeverityClass(severity: "critical" | "high" | "medium"): string {
  if (severity === "critical") return "border-violating/40 bg-violating/10 text-violating";
  if (severity === "high") return "border-repairing/40 bg-repairing/10 text-repairing";
  return "border-quarantined/40 bg-quarantined/10 text-quarantined";
}

/* ─── Mock data generation ─── */
function generateCoverageData(): CoverageData {
  const shardNames = [
    "us-east-1-alpha", "us-east-1-beta", "us-west-2-gamma",
    "eu-west-1-delta", "eu-central-1-epsilon", "ap-south-1-zeta",
    "ap-northeast-1-eta", "us-east-1-theta", "sa-east-1-iota",
    "eu-north-1-kappa", "us-west-1-lambda", "ap-southeast-1-mu",
  ];

  const statuses: ShardStatus[] = ["healthy", "repairing", "violating"];

  const shards: ShardCoverage[] = shardNames.map((name, i) => {
    const coveragePct = Math.round(
      i < 3 ? 85 + Math.random() * 15 :
      i < 6 ? 50 + Math.random() * 30 :
      i < 9 ? 20 + Math.random() * 30 :
      Math.random() * 20
    );
    return {
      id: `shard-${i}`,
      name,
      hash: `${name.slice(0, 3)}${Math.random().toString(36).slice(2, 8)}`,
      invariantCount: Math.floor(8 + Math.random() * 50),
      coveragePct: Math.min(100, coveragePct),
      status: coveragePct >= 70 ? "healthy" : coveragePct >= 40 ? "repairing" : "violating",
      lastChecked: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      trend: coveragePct >= 70 ? (Math.random() > 0.3 ? "up" : "stable") :
             coveragePct >= 40 ? (Math.random() > 0.5 ? "stable" : "down") :
             (Math.random() > 0.4 ? "down" : "stable"),
    };
  });

  const totalInvariants = shards.reduce((s, sh) => s + sh.invariantCount, 0);
  const avgCoverage = Math.round(shards.reduce((s, sh) => s + sh.coveragePct, 0) / shards.length);
  const uncoveredCount = shards.reduce((s, sh) => s + Math.round(sh.invariantCount * (1 - sh.coveragePct / 100)), 0);
  const criticalGaps = shards.filter((sh) => sh.coveragePct === 0).reduce((s, sh) => s + sh.invariantCount, 0);

  // Distribution buckets
  const buckets = [
    { label: "0-20%", min: 0, max: 20, fill: "oklch(0.65 0.2 25)" },
    { label: "21-40%", min: 21, max: 40, fill: "oklch(0.72 0.13 50)" },
    { label: "41-60%", min: 41, max: 60, fill: "oklch(0.75 0.15 80)" },
    { label: "61-80%", min: 61, max: 80, fill: "oklch(0.70 0.13 120)" },
    { label: "81-100%", min: 81, max: 100, fill: "oklch(0.78 0.16 160)" },
  ];

  const distribution = buckets.map((b) => ({
    bucket: b.label,
    count: shards.filter((sh) => sh.coveragePct >= b.min && sh.coveragePct <= b.max)
      .reduce((s, sh) => s + sh.invariantCount, 0),
    fill: b.fill,
  }));

  // Coverage gaps
  const gaps: CoverageGap[] = [];
  for (const shard of shards) {
    if (shard.coveragePct < 40) {
      const uncoveredCountForShard = Math.ceil(shard.invariantCount * (1 - shard.coveragePct / 100));
      const count = Math.min(uncoveredCountForShard, 3);
      for (let j = 0; j < count; j++) {
        gaps.push({
          id: `gap-${shard.id}-${j}`,
          invariantName: `inv_${shard.name.replace(/-/g, "_")}_${["bounds_check", "state_integrity", "prop_constraint", "drift_limit", "hash_valid"][j % 5]}`,
          shardName: shard.name,
          shardHash: shard.hash,
          coveragePct: Math.max(0, shard.coveragePct - Math.floor(Math.random() * 20)),
          severity: shard.coveragePct < 10 ? "critical" : shard.coveragePct < 25 ? "high" : "medium",
        });
      }
    }
  }

  return {
    shards,
    totalInvariants,
    avgCoverage,
    uncoveredCount,
    criticalGaps,
    distribution,
    generatedAt: Date.now(),
  };
}

/* ─── Custom Treemap Content ─── */
function CoverageTreemapContent(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; size?: number; coverage?: number; depth?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size = 0, coverage = 0, depth = 0 } = props;
  if (depth !== 1 || width < 20 || height < 16) return null;

  const fillColor = coverageColor(coverage);
  const opacity = 0.15 + (coverage / 100) * 0.35;

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={fillColor} opacity={opacity} rx={3}
        stroke={fillColor} strokeWidth={1} strokeOpacity={0.5}
      />
      {width > 50 && height > 22 && (
        <text x={x + 6} y={y + 13} fill="var(--foreground)" fontSize={8} fontFamily="var(--font-geist-mono)" opacity={0.9}>
          {name.length > 14 ? name.slice(0, 12) + "…" : name}
        </text>
      )}
      {width > 50 && height > 36 && (
        <text x={x + 6} y={y + 25} fill={fillColor} fontSize={9} fontFamily="var(--font-geist-mono)" fontWeight={600}>
          {coverage}% · {size}
        </text>
      )}
    </g>
  );
}

/* ─── Custom tooltip for treemap ─── */
function TreemapTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { name: string; size: number; coverage: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="p-2 space-y-1">
      <div className="font-semibold text-[11px]">{d.name}</div>
      <div className="text-[10px]">Invariants: <span className="font-mono">{d.size}</span></div>
      <div className="text-[10px]">Coverage: <span className="font-mono" style={{ color: coverageColor(d.coverage) }}>{d.coverage}%</span></div>
    </div>
  );
}

/* ─── Section variants ─── */
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ─── Main Component ─── */
export function CoverageTreemapSection() {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("coveragePct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const load = useCallback(() => {
    const d = generateCoverageData();
    setData(d);
    setLastRefresh(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  /* ─── Derived data ─── */
  const treemapData = useMemo(() => {
    if (!data) return [];
    return data.shards.map((sh) => ({
      name: sh.name,
      size: sh.invariantCount,
      coverage: sh.coveragePct,
    }));
  }, [data]);

  const sortedShards = useMemo(() => {
    if (!data) return [];
    const arr = [...data.shards];
    return arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "invariantCount") cmp = a.invariantCount - b.invariantCount;
      else if (sortKey === "coveragePct") cmp = a.coveragePct - b.coveragePct;
      else if (sortKey === "lastChecked") cmp = new Date(a.lastChecked).getTime() - new Date(b.lastChecked).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    }).slice(0, 10);
  }, [data, sortKey, sortDir]);

  const coverageGaps = useMemo(() => {
    if (!data) return [];
    const gaps: CoverageGap[] = [];
    for (const shard of data.shards) {
      if (shard.coveragePct < 40) {
        const uncovered = Math.ceil(shard.invariantCount * (1 - shard.coveragePct / 100));
        const count = Math.min(uncovered, 3);
        for (let j = 0; j < count; j++) {
          gaps.push({
            id: `gap-${shard.id}-${j}`,
            invariantName: `inv_${shard.name.replace(/-/g, "_")}_${["bounds_check", "state_integrity", "prop_constraint", "drift_limit", "hash_valid"][j % 5]}`,
            shardName: shard.name,
            shardHash: shard.hash,
            coveragePct: Math.max(0, shard.coveragePct - Math.floor(j * 8)),
            severity: shard.coveragePct < 10 ? "critical" : shard.coveragePct < 25 ? "high" : "medium",
          });
        }
      }
    }
    return gaps;
  }, [data]);

  const trendIcon = useMemo(() => {
    if (!data) return Minus;
    return data.avgCoverage >= 70 ? TrendingUp : data.avgCoverage >= 40 ? Minus : TrendingDown;
  }, [data]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => d === "asc" ? "desc" : "asc");
      } else {
        setSortDir("asc");
      }
      return key;
    });
  }, []);

  const fmtTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified" />
          <span className="text-sm">Loading coverage data…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const TrendIcon = trendIcon;

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ── Header Card ── */}
      <motion.div variants={cardVariants}>
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5">
          <TopAccentBar color="oklch(0.78 0.16 160)" />
          <GridOverlay opacity="opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <SectionHeader
              icon={GitGraph}
              title="Coverage Treemap"
              subtitle="Invariant coverage visualization across shards & policies"
              iconClass="border-verified/30 bg-verified/10 text-verified"
            />
            <div className="sm:ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-border/60 bg-muted/30 text-xs"
                onClick={load}
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-verified/30 bg-verified/10 text-verified text-xs hover:bg-verified/20"
              >
                <Download className="h-3 w-3" />
                Export Report
              </Button>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] cursor-pointer select-none transition-colors",
                  autoRefresh
                    ? "border-verified/30 bg-verified/10 text-verified"
                    : "border-border/60 bg-muted/30 text-muted-foreground"
                )}
                onClick={() => setAutoRefresh((v) => !v)}
              >
                <RefreshCw className={cn("h-3 w-3", autoRefresh && "animate-spin")} />
                Auto-refresh 30s
                {autoRefresh && <Check className="h-3 w-3" />}
              </div>
              <Badge variant="outline" className="gap-1.5 text-[10px] font-mono border-border/60 bg-muted/30">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {fmtTime(new Date(lastRefresh).toISOString())}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── 2. KPI Strip ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={containerVariants}
      >
        {/* Total Invariants */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Invariants</span>
                <Shield className="h-3.5 w-3.5 text-verified" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold tabular-nums">{data.totalInvariants}</span>
                <span className="text-[10px] text-muted-foreground">across {data.shards.length} shards</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Average Coverage */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${coverageColor(data.avgCoverage)}, transparent)` }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Coverage</span>
                <TrendIcon className={cn("h-3.5 w-3.5", coverageTextClass(data.avgCoverage))} />
              </div>
              <div className="mt-2">
                <span className={cn("text-2xl font-semibold tabular-nums", coverageTextClass(data.avgCoverage))}>
                  {data.avgCoverage}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-background/60 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", data.avgCoverage >= 80 ? "bg-verified" : data.avgCoverage >= 40 ? "bg-repairing" : "bg-violating")}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.avgCoverage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Uncovered Invariants */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.75 0.15 80), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Uncovered</span>
                <AlertTriangle className="h-3.5 w-3.5 text-repairing" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold tabular-nums text-repairing">{data.uncoveredCount}</span>
                <span className="text-[10px] text-muted-foreground">invariants</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {((data.uncoveredCount / data.totalInvariants) * 100).toFixed(1)}% of total
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Critical Gaps */}
        <motion.div variants={cardVariants} whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-4 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, oklch(0.65 0.2 25), transparent)" }} />
            <div className="bg-grid-fine absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical Gaps</span>
                <X className="h-3.5 w-3.5 text-violating" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className={cn("text-2xl font-semibold tabular-nums", data.criticalGaps > 0 ? "text-violating" : "text-verified")}>
                  {data.criticalGaps}
                </span>
                {data.criticalGaps > 0 ? (
                  <StatusPill status="violating" label="0% coverage" />
                ) : (
                  <StatusPill status="verified" label="No gaps" />
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {data.criticalGaps > 0 ? "requires immediate attention" : "all shards covered"}
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── 3. Treemap + Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Treemap */}
        <motion.div variants={sectionVariants} className="lg:col-span-3">
          <Card className="relative overflow-hidden bg-card/40 backdrop-blur-xl border-border/60 p-5 h-full glass">
            <TopAccentBar color="oklch(0.78 0.16 160)" />
            <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.03]" />
            <GridOverlay opacity="opacity-5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verified/10">
                  <GitGraph className="h-3.5 w-3.5 text-verified" />
                </div>
                <h3 className="text-sm font-semibold">Invariant Coverage Treemap</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  size = count · color = coverage
                </span>
              </div>
              <div className="h-72 w-full rounded-md border border-border/30 bg-background/20 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    nameKey="name"
                    content={<CoverageTreemapContent />}
                  >
                    <RTooltip content={<TreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="font-mono uppercase tracking-wide">Coverage:</span>
                {[
                  { label: "81-100%", color: "oklch(0.78 0.16 160)" },
                  { label: "61-80%", color: "oklch(0.70 0.13 120)" },
                  { label: "41-60%", color: "oklch(0.75 0.15 80)" },
                  { label: "21-40%", color: "oklch(0.72 0.13 50)" },
                  { label: "0-20%", color: "oklch(0.65 0.2 25)" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.7 }} />
                    <span className="font-mono">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Distribution Bar Chart */}
        <motion.div variants={sectionVariants} className="lg:col-span-2">
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.75 0.15 80)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10">
                  <BarChart3 className="h-3.5 w-3.5 text-repairing" />
                </div>
                <h3 className="text-sm font-semibold">Coverage Distribution</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribution} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                      stroke="oklch(0.3 0.01 168 / 0.5)"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.01 168)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                      stroke="oklch(0.3 0.01 168 / 0.5)"
                    />
                    <RTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Invariants" radius={[4, 4, 0, 0]} animationDuration={600}>
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center text-[10px] text-muted-foreground">
                {data.distribution.reduce((s, d) => s + d.count, 0)} total invariants distributed across coverage buckets
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── 4 & 5: Shard Coverage Table + Coverage Gaps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Shard Coverage Table */}
        <motion.div variants={sectionVariants} className="lg:col-span-3">
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.70 0.13 120)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold">Shard Coverage Table</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  top 10 · click headers to sort
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40">
                      {[
                        { key: "name" as SortKey, label: "Shard" },
                        { key: "invariantCount" as SortKey, label: "Invariants" },
                        { key: "coveragePct" as SortKey, label: "Coverage" },
                        { key: "lastChecked" as SortKey, label: "Last Checked" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="text-left py-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortKey === col.key ? (
                              sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sortedShards.map((shard, idx) => {
                        const TrendComp = shard.trend === "up" ? TrendingUp : shard.trend === "down" ? TrendingDown : Minus;
                        const trendColor = shard.trend === "up" ? "text-verified" : shard.trend === "down" ? "text-violating" : "text-muted-foreground";
                        return (
                          <motion.tr
                            key={shard.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ delay: idx * 0.03, duration: 0.2 }}
                            className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                          >
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-foreground truncate max-w-[130px]">{shard.name}</span>
                                <Hash value={shard.hash} length={6} />
                              </div>
                            </td>
                            <td className="py-2.5 px-2 font-mono tabular-nums">{shard.invariantCount}</td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-mono tabular-nums font-semibold", coverageTextClass(shard.coveragePct))}>
                                  {shard.coveragePct}%
                                </span>
                                <div className="h-1.5 w-16 rounded-full bg-background/60 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: coverageColor(shard.coveragePct) }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${shard.coveragePct}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.03 }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-muted-foreground font-mono">{fmtTime(shard.lastChecked)}</td>
                            <td className="py-2.5 px-2">
                              <StatusPill status={shard.status} />
                            </td>
                            <td className="py-2.5 px-2">
                              <TrendComp className={cn("h-3.5 w-3.5", trendColor)} />
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Coverage Gaps Panel */}
        <motion.div variants={sectionVariants} className="lg:col-span-2">
          <Card className="relative overflow-hidden bg-card/60 backdrop-blur border-border/60 p-5 h-full">
            <TopAccentBar color="oklch(0.65 0.2 25)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violating/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-violating" />
                </div>
                <h3 className="text-sm font-semibold">Coverage Gaps</h3>
                <Badge variant="outline" className="ml-auto gap-1 text-[10px] font-mono border-violating/30 bg-violating/10 text-violating">
                  {coverageGaps.length} gap{coverageGaps.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {coverageGaps.length === 0 ? (
                <div className="py-8 text-center">
                  <Check className="mx-auto h-8 w-8 text-verified/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No coverage gaps detected.</p>
                  <p className="text-xs text-muted-foreground/70">All invariants have &gt;40% coverage.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  <AnimatePresence>
                    {coverageGaps.map((gap, idx) => (
                      <motion.div
                        key={gap.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        className={cn(
                          "rounded-lg border p-3 transition-all hover:scale-[1.01]",
                          gapSeverityClass(gap.severity)
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className={cn("text-[9px] gap-0.5", gapSeverityClass(gap.severity))}>
                                {gap.severity}
                              </Badge>
                            </div>
                            <div className="font-mono text-[11px] text-foreground truncate">{gap.invariantName}</div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                              <span className="truncate">{gap.shardName}</span>
                              <Hash value={gap.shardHash} length={5} />
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={cn("font-mono text-sm font-semibold tabular-nums", coverageTextClass(gap.coveragePct))}>
                              {gap.coveragePct}%
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 gap-1 text-[10px] border-border/60 bg-muted/30 hover:bg-muted/50 px-2"
                            >
                              <Search className="h-2.5 w-2.5" />
                              Investigate
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {coverageGaps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <AlertTriangle className="h-3 w-3 text-violating" />
                    {coverageGaps.filter((g) => g.severity === "critical").length} critical · {coverageGaps.filter((g) => g.severity === "high").length} high
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 gap-1 text-[10px] border-violating/30 bg-violating/10 text-violating hover:bg-violating/20 px-2"
                  >
                    <Search className="h-2.5 w-2.5" />
                    View All Gaps
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Bottom accent / footer bar ── */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur border-border/40 p-3">
          <div className="relative flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <GitGraph className="h-3 w-3 text-verified" />
                Coverage Treemap
              </span>
              <span className="text-border/60">|</span>
              <span>{data.shards.length} shards</span>
              <span className="text-border/60">|</span>
              <span>{data.totalInvariants} invariants</span>
              <span className="text-border/60">|</span>
              <span className={cn("flex items-center gap-1", coverageTextClass(data.avgCoverage))}>
                <TrendIcon className="h-3 w-3" />
                {data.avgCoverage}% avg
              </span>
            </div>
            <span className="text-muted-foreground/60">
              epistemic://coverage-treemap · v0.2
            </span>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
