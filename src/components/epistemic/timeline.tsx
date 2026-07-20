"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Cpu,
  AlertTriangle,
  Clock,
  Filter,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Activity,
  Gauge,
  Zap,
  BarChart3,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { PolicyRow } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants, fmtTimestamp } from "./primitives";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type EventKind = "merge" | "shadow" | "violation";

interface TimelineEvent {
  id: string;
  kind: EventKind;
  at: string;
  policyName: string;
  domain: string | null;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  mergeStatus?: string;
  divergence?: number;
  iterations?: number;
  shadowKind?: string;
  invariant?: string;
  soft?: boolean;
  repaired?: boolean;
  actual?: string | null;
  expected?: string | null;
}

interface Bucket {
  t: number;
  count: number;
  byKind: Record<string, number>;
}

interface TimelineData {
  events: TimelineEvent[];
  total: number;
  buckets: Bucket[];
  policyId: string | null;
}

const KIND_META: Record<
  EventKind,
  { icon: typeof GitBranch; color: string; text: string; bg: string; label: string; dotBg: string }
> = {
  merge: {
    icon: GitBranch,
    color: "text-verified",
    text: "text-verified",
    bg: "bg-verified",
    label: "Merge",
    dotBg: "bg-verified",
  },
  shadow: {
    icon: Cpu,
    color: "text-repairing",
    text: "text-repairing",
    bg: "bg-repairing",
    label: "Shadow",
    dotBg: "bg-repairing",
  },
  violation: {
    icon: AlertTriangle,
    color: "text-violating",
    text: "text-violating",
    bg: "bg-violating",
    label: "Violation",
    dotBg: "bg-violating",
  },
};

const SEVERITY_META: Record<string, string> = {
  info: "border-verified/30 bg-verified/5",
  warning: "border-repairing/30 bg-repairing/5",
  critical: "border-violating/30 bg-violating/10",
};

export function TimelineSection() {
  const { toast } = useToast();
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [filterPolicy, setFilterPolicy] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState<number>(0);
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

  const load = useCallback(() => {
    const qs = filterPolicy !== "all" ? `?policyId=${filterPolicy}` : "";
    fetch(`/api/timeline${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        setCursor(0);
      })
      .catch(() => setLoading(false));
  }, [filterPolicy]);

  useEffect(() => {
    fetch("/api/policies")
      .then((r) => r.json())
      .then((d) => setPolicies(d.policies ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!playing || !data) return;
    const t = setInterval(() => {
      setCursor((c) => {
        if (c >= filtered.length - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [playing, data, filterKind]);

  const filtered = data ? data.events.filter((e) => filterKind === "all" || e.kind === filterKind) : [];

  const current = filtered[cursor];

  const totals = useMemo(() => ({
    merges: data?.events.filter((e) => e.kind === "merge").length ?? 0,
    shadows: data?.events.filter((e) => e.kind === "shadow").length ?? 0,
    violations: data?.events.filter((e) => e.kind === "violation").length ?? 0,
  }), [data]);

  const histogramData = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => ({
      time: new Date(b.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      merge: b.byKind.merge ?? 0,
      shadow: b.byKind.shadow ?? 0,
      violation: b.byKind.violation ?? 0,
      total: b.count,
      ts: b.t,
    }));
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const progress = filtered.length > 0 ? ((cursor + 1) / filtered.length) * 100 : 0;

  return (
    <motion.section
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header + filters */}
      <GradientBorderCard gradient="from-verified/40 via-repairing/20 to-violating/20" className="p-4">
        <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative flex flex-wrap items-center gap-3">
          <motion.div variants={cardVariants} className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0">
            <Clock className="h-5 w-5 text-verified" />
          </motion.div>
          <motion.div variants={cardVariants} className="min-w-0 flex-1">
            <h2 className="text-base font-semibold flex items-center gap-2">
              Historical Replay Timeline
              <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">
                {data.total} events
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scrub through merge proposals, shadow events, and invariant breaches. Replay any episode with modified invariants.
            </p>
          </motion.div>
          <motion.div variants={cardVariants} className="flex items-center gap-2 flex-wrap">
            {/* Event type filter buttons */}
            <div className="flex items-center gap-1 mr-1">
              <Button
                size="sm"
                variant={filterKind === "all" ? "default" : "outline"}
                className={cn("h-7 px-2 text-[10px]", filterKind === "all" ? "bg-verified/90 hover:bg-verified text-primary-foreground" : "")}
                onClick={() => setFilterKind("all")}
              >
                All <Badge variant="outline" className="ml-1 h-4 px-1 text-[8px] border-current/30 bg-current/10">{data.total}</Badge>
              </Button>
              <Button
                size="sm"
                variant={filterKind === "merge" ? "default" : "outline"}
                className={cn("h-7 px-2 text-[10px]", filterKind === "merge" ? "bg-verified/90 hover:bg-verified text-primary-foreground" : "")}
                onClick={() => setFilterKind("merge")}
              >
                <GitBranch className="h-3 w-3 mr-1" /> Merges <Badge variant="outline" className="ml-1 h-4 px-1 text-[8px] border-current/30 bg-current/10">{totals.merges}</Badge>
              </Button>
              <Button
                size="sm"
                variant={filterKind === "shadow" ? "default" : "outline"}
                className={cn("h-7 px-2 text-[10px]", filterKind === "shadow" ? "bg-repairing/90 hover:bg-repairing text-primary-foreground" : "")}
                onClick={() => setFilterKind("shadow")}
              >
                <Cpu className="h-3 w-3 mr-1" /> Shadow <Badge variant="outline" className="ml-1 h-4 px-1 text-[8px] border-current/30 bg-current/10">{totals.shadows}</Badge>
              </Button>
              <Button
                size="sm"
                variant={filterKind === "violation" ? "default" : "outline"}
                className={cn("h-7 px-2 text-[10px]", filterKind === "violation" ? "bg-violating/90 hover:bg-violating text-primary-foreground" : "")}
                onClick={() => setFilterKind("violation")}
              >
                <AlertTriangle className="h-3 w-3 mr-1" /> Violations <Badge variant="outline" className="ml-1 h-4 px-1 text-[8px] border-current/30 bg-current/10">{totals.violations}</Badge>
              </Button>
            </div>
            <Select value={filterPolicy} onValueChange={setFilterPolicy}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All policies</SelectItem>
                {policies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </GradientBorderCard>

      {/* Summary + histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} className="grid grid-cols-3 gap-3 lg:col-span-1">
          <SummaryStat icon={GitBranch} label="Merges" value={totals.merges} accent="verified" />
          <SummaryStat icon={Cpu} label="Shadow" value={totals.shadows} accent="repairing" />
          <SummaryStat icon={AlertTriangle} label="Violations" value={totals.violations} accent="violating" />
        </motion.div>

        <GradientBorderCard gradient="from-verified/30 via-repairing/15 to-violating/15" className="lg:col-span-2 p-4">
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-verified" />
              <span className="text-xs font-semibold">Event density · last 24h</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                {hoveredBucket !== null && data.buckets[hoveredBucket]
                  ? new Date(data.buckets[hoveredBucket].t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                    ` · ${data.buckets[hoveredBucket].count} events`
                  : "hover a bucket"}
              </span>
            </div>
            <RechartsHistogram
              data={histogramData}
              onHover={setHoveredBucket}
              onSelect={(idx) => {
                const bucketTime = data.buckets[idx]?.t;
                if (!bucketTime) return;
                const idx2 = data.events.findIndex(
                  (e) => new Date(e.at).getTime() >= bucketTime,
                );
                if (idx2 >= 0) setCursor(idx2);
              }}
            />
          </div>
        </GradientBorderCard>
      </div>

      {/* Player + scrubber */}
      <GradientBorderCard gradient="from-verified/30 via-repairing/15 to-verified/20" className="p-4">
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-verified" />
            <span className="text-sm font-semibold">Episode player</span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              {filtered.length > 0 ? `${cursor + 1} / ${filtered.length}` : "no events"}
            </span>
          </div>

          {/* Animated progress bar */}
          <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-verified via-repairing to-verified rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Scrubber */}
          <div className="relative h-10 rounded-md border border-border/60 bg-background/40 overflow-hidden">
            <div className="absolute inset-0 flex">
              {filtered.map((e, i) => {
                const m = KIND_META[e.kind];
                return (
                  <button
                    key={e.id}
                    onClick={() => setCursor(i)}
                    className={cn(
                      "flex-1 min-w-[3px] group relative transition-all",
                      i === cursor ? "bg-opacity-100" : "opacity-50 hover:opacity-100",
                    )}
                    title={`${e.title} · ${timeAgo(e.at)}`}
                  >
                    <div className={cn("h-full w-full", m.bg, i === cursor && "opacity-100")} />
                    {i === cursor && (
                      <motion.div
                        className="absolute -top-0.5 left-0 right-0 h-0.5 bg-foreground"
                        layoutId="scrubber-indicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic">
                no events match the filter
              </div>
            )}
          </div>

          {/* Scrubber legend */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-verified" /> merge
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-repairing" /> shadow
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-violating" /> violation
            </span>
            <span className="ml-auto italic">click a segment to jump</span>
          </div>

          {/* Transport controls */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCursor(0)}
              disabled={cursor === 0}
              title="Go to start"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
              disabled={cursor === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 px-4 bg-verified/90 hover:bg-verified text-primary-foreground"
              onClick={() => {
                if (cursor >= filtered.length - 1) {
                  setCursor(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              disabled={filtered.length === 0}
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" /> {cursor >= filtered.length - 1 ? "Replay" : "Play"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCursor((c) => Math.min(filtered.length - 1, c + 1))}
              disabled={cursor >= filtered.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCursor(filtered.length - 1)}
              disabled={cursor >= filtered.length - 1}
              title="Go to end"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <span className="ml-2 text-[11px] text-muted-foreground font-mono">
              {current ? timeAgo(current.at) : "—"}
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3 text-repairing" />
              auto-advance 1.2s
            </div>
          </div>

          {/* Current episode detail */}
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                <EventDetail event={current} onReplay={() => {
                  toast({
                    title: "Episode queued for replay",
                    description: `${current.title} · ${current.policyName}`,
                  });
                }} />
              </motion.div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No episode selected.
              </div>
            )}
          </AnimatePresence>
        </div>
      </GradientBorderCard>

      {/* Event list */}
      <GradientBorderCard gradient="from-repairing/30 via-verified/15 to-repairing/20" className="p-4">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-repairing" />
            <span className="text-sm font-semibold">Event stream</span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              newest first · {filtered.length} shown
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
            {filtered.map((e, i) => {
              const m = KIND_META[e.kind];
              const Icon = m.icon;
              return (
                <motion.button
                  key={e.id}
                  onClick={() => setCursor(i)}
                  variants={itemVariants}
                  custom={i}
                  whileHover={{ scale: 1.01, backgroundColor: "oklch(0.25 0.015 168 / 0.4)" }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "w-full text-left flex items-start gap-2.5 rounded-md border px-2.5 py-1.5 transition-colors",
                    i === cursor
                      ? "border-verified/40 bg-verified/5"
                      : "border-border/40 bg-background/30",
                  )}
                >
                  {/* Color-coded timeline dot */}
                  <div className="flex flex-col items-center pt-0.5 shrink-0">
                    <div className={cn("h-3 w-3 rounded-full border-2 border-background", m.dotBg)} />
                    {i < filtered.length - 1 && (
                      <div className={cn("w-0.5 h-4 mt-0.5", m.dotBg, "opacity-30")} />
                    )}
                  </div>
                  <div className={cn("mt-0.5 h-5 w-5 shrink-0 rounded flex items-center justify-center", m.bg, "bg-opacity-20")}>
                    <Icon className={cn("h-3 w-3", m.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">{e.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
                        {timeAgo(e.at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {e.policyName} · {e.detail}
                    </p>
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No events match the filter.</p>
            )}
          </div>
        </div>
      </GradientBorderCard>
    </motion.section>
  );
}

function RechartsHistogram({
  data,
  onHover,
  onSelect,
}: {
  data: { time: string; merge: number; shadow: number; violation: number; total: number; ts: number }[];
  onHover: (idx: number | null) => void;
  onSelect: (idx: number) => void;
}) {
  if (data.length === 0) {
    return <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barCategoryGap={1} barGap={0}>
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: "oklch(0.55 0.01 160)" }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(data.length / 8))} />
        <YAxis hide />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "oklch(0.22 0.014 168)",
            border: "1px solid oklch(0.32 0.014 165)",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
          labelStyle={{ color: "oklch(0.68 0.015 160)" }}
          itemStyle={{ color: "oklch(0.96 0.01 150)" }}
          formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
        />
        <Bar dataKey="violation" stackId="a" fill="oklch(0.64 0.21 25 / 0.7)" radius={[0, 0, 0, 0]} onMouseEnter={(_, idx) => onHover(idx)} onMouseLeave={() => onHover(null)} onClick={(_, idx) => onSelect(idx)} />
        <Bar dataKey="shadow" stackId="a" fill="oklch(0.80 0.15 80 / 0.7)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="merge" stackId="a" fill="oklch(0.78 0.16 160 / 0.7)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Histogram({
  buckets,
  onHover,
  onSelect,
}: {
  buckets: Bucket[];
  onHover: (idx: number | null) => void;
  onSelect: (idx: number) => void;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex items-end gap-[2px] h-16">
      {buckets.map((b, i) => {
        const h = (b.count / max) * 100;
        const hasM = b.byKind.merge > 0;
        const hasS = b.byKind.shadow > 0;
        const hasV = b.byKind.violation > 0;
        return (
          <button
            key={i}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(i)}
            className="flex-1 group relative flex flex-col justify-end h-full"
            title={`${new Date(b.t).toLocaleTimeString([], { hour: "2-digit" })} · ${b.count} events`}
          >
            <div className="w-full overflow-hidden rounded-sm flex flex-col justify-end" style={{ height: `${Math.max(4, h)}%` }}>
              {hasV && <div className="w-full bg-violating/80" style={{ flex: b.byKind.violation }} />}
              {hasS && <div className="w-full bg-repairing/80" style={{ flex: b.byKind.shadow }} />}
              {hasM && <div className="w-full bg-verified/80" style={{ flex: b.byKind.merge }} />}
            </div>
            {b.count === 0 && <div className="w-full h-[3px] bg-muted/30 rounded-sm" />}
          </button>
        );
      })}
    </div>
  );
}

function EventDetail({ event, onReplay }: { event: TimelineEvent; onReplay: () => void }) {
  const m = KIND_META[event.kind];
  const Icon = m.icon;
  return (
    <div className={cn("rounded-md border p-3", SEVERITY_META[event.severity])}>
      <div className="flex items-start gap-3">
        <motion.div
          className={cn("h-9 w-9 rounded-md flex items-center justify-center shrink-0", m.color, "bg-current/10")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className={cn("h-4.5 w-4.5", m.text)} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{event.title}</span>
            <Badge variant="outline" className={cn("text-[9px]", m.text, "border-current/30 bg-current/10")}>
              {m.label}
            </Badge>
            {event.severity === "critical" && (
              <Badge variant="outline" className="text-[9px] border-violating/40 bg-violating/10 text-violating">
                critical
              </Badge>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              {new Date(event.at).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{event.detail}</p>
          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">policy:</span>
              <span className="font-mono">{event.policyName}</span>
            </span>
            {event.domain && (
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground">domain:</span>
                <span className="font-mono">{event.domain}</span>
              </span>
            )}
            {event.divergence !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground">divergence:</span>
                <span className="font-mono text-repairing">{event.divergence.toFixed(3)}</span>
              </span>
            )}
            {event.iterations !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground">iters:</span>
                <span className="font-mono">{event.iterations}</span>
              </span>
            )}
            {event.soft !== undefined && event.soft && (
              <Badge variant="outline" className="text-[9px] border-quarantined/30 bg-quarantined/10 text-quarantined">
                soft
              </Badge>
            )}
            {event.repaired && (
              <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified">
                repaired
              </Badge>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-7 shrink-0 border-verified/30 bg-verified/10 text-verified hover:bg-verified/20" onClick={onReplay}>
          <Play className="h-3 w-3 mr-1" /> Replay
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof GitBranch;
  label: string;
  value: number;
  accent?: "verified" | "repairing" | "violating";
}) {
  const color =
    accent === "verified"
      ? "text-verified"
      : accent === "repairing"
        ? "text-repairing"
        : accent === "violating"
          ? "text-violating"
          : "text-foreground";
  const gradient =
    accent === "verified"
      ? "from-verified/40 to-verified/10"
      : accent === "repairing"
        ? "from-repairing/40 to-repairing/10"
        : "from-violating/40 to-violating/10";

  return (
    <GradientBorderCard gradient={gradient} className="p-3">
      <motion.div
        className="relative flex items-center gap-2.5"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="h-8 w-8 rounded-md bg-background/60 flex items-center justify-center shrink-0">
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div>
          <div className={cn("text-xl font-semibold tabular-nums leading-none", color)}>{value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
        </div>
      </motion.div>
    </GradientBorderCard>
  );
}
