"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Network, Boxes, Activity, Users, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Cpu, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PolicyRow, ShardRow, ShardStatus } from "@/lib/types";
import { StatusDot, Hash, SeverityBadge, GradientBorderCard, containerVariants, cardVariants, itemVariants, fmtTimestamp, GridOverlay } from "./primitives";
import { ShardRebalancePanel } from "./shard-rebalance";
import { InteractiveDagGraph } from "./interactive-graph";

const POLL_MS = 10_000;
const STATUS_TEXT: Record<ShardStatus, string> = { healthy: "text-verified", repairing: "text-repairing", violating: "text-violating" };
const STATUS_GRADIENT: Record<ShardStatus, string> = { healthy: "from-verified/20 via-transparent to-transparent", repairing: "from-repairing/20 via-transparent to-transparent", violating: "from-violating/20 via-transparent to-transparent" };

function PeerLinks({ count, status }: { count: number; status: ShardStatus }) {
  const dots = Math.max(1, Math.min(count, 6));
  return (
    <div className="flex items-center gap-1">
      <Users className="h-3 w-3 text-muted-foreground" />
      <div className="flex items-center gap-0.5">
        {Array.from({ length: dots }).map((_, i) => (
          <motion.span key={i} className={cn("h-1 w-1 rounded-full", status === "violating" ? "bg-violating/60" : status === "repairing" ? "bg-repairing/60" : "bg-verified/50")}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04 }} />
        ))}
        {count > 6 && <span className="text-[10px] text-muted-foreground">+{count - 6}</span>}
      </div>
      <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
    </div>
  );
}

function MeshHint() {
  return (
    <div className="relative flex h-8 items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: "repeating-linear-gradient(90deg,oklch(0.78 0.16 160/0.25) 0,oklch(0.78 0.16 160/0.25) 2px,transparent 2px,transparent 6px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      {Array.from({ length: 11 }).map((_, i) => (
        <motion.span key={i} className="relative mx-2 h-1.5 w-1.5 rounded-full bg-verified/40"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.3 + (i % 3) * 0.25 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }} />
      ))}
      <motion.div className="absolute top-1/2 -translate-y-1/2 h-1 w-4 rounded-full bg-verified/40 blur-[2px]"
        animate={{ x: ["-10%", "110%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function ShardNodeCard({ shard, index }: { shard: ShardRow; index: number }) {
  const status = shard.invariantStatus;
  const [hovered, setHovered] = useState(false);
  return (
    <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
      <motion.div variants={cardVariants} custom={index} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}>
        <GradientBorderCard gradientFrom={status === "healthy" ? "oklch(0.78 0.16 160 / 0.3)" : status === "repairing" ? "oklch(0.80 0.15 80 / 0.3)" : "oklch(0.64 0.21 25 / 0.4)"}
          gradientTo="oklch(0.32 0.014 165 / 0.1)" className={cn(hovered && "shadow-lg")}>
          <div className="p-3 relative overflow-hidden">
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", STATUS_GRADIENT[status])} />
            <GridOverlay />
            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative"><StatusDot status={status} />
                      {status === "violating" && <motion.span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violating" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                      {status === "repairing" && <motion.span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-repairing" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />}
                    </span>
                    <span className="truncate text-sm font-semibold text-foreground">{shard.region}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Cpu className="h-3 w-3" /><span className="font-mono truncate">{shard.nodeId}</span></div>
                </div>
                <motion.span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", status === "healthy" ? "border-verified/30 bg-verified/10 text-verified" : status === "repairing" ? "border-repairing/30 bg-repairing/10 text-repairing" : "border-violating/30 bg-violating/10 text-violating")}
                  animate={status === "violating" ? { opacity: [1, 0.7, 1] } : {}} transition={status === "violating" ? { duration: 1.5, repeat: Infinity } : {}}>{status}</motion.span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <PeerLinks count={shard.peerCount} status={status} />
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="opacity-70">mmr</span><Hash value={shard.mmrRoot} length={10} /></div>
              </div>
              <Separator className="my-2 bg-border/50" />
              <div className="space-y-1">
                {shard.invariantEvals.length === 0 && <div className="text-[11px] text-muted-foreground italic">no invariants</div>}
                {shard.invariantEvals.map((ev) => (
                  <motion.div key={ev.name} variants={itemVariants} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-muted-foreground truncate">{ev.name}</span>
                    <div className="flex items-center gap-1.5"><SeverityBadge severity={ev.severity} soft={ev.soft} />{ev.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-verified" /> : <XCircle className="h-3.5 w-3.5 text-violating" />}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </GradientBorderCard>
      </motion.div>
    </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-foreground">{shard.region}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Cpu className="h-3 w-3" /><span className="font-mono">{shard.nodeId}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Policy:</span><span className="font-mono">{shard.policy.name}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Peers:</span><span className="font-mono">{shard.peerCount}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">MMR root:</span><span className="font-mono text-[10px]">{shard.mmrRoot.slice(0, 16)}…</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Last merge:</span><span>{fmtTimestamp(shard.lastMergeAt)}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Invariants:</span><span className={cn("font-semibold", STATUS_TEXT[status])}>{shard.invariantEvals.filter((e) => e.passed).length}/{shard.invariantEvals.length} passing</span></div>
        </div>
      </TooltipContent>
    </Tooltip></TooltipProvider>
  );
}

function ShardTable({ shards }: { shards: ShardRow[] }) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="bg-card/60 backdrop-blur border-border/60 p-0 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/40 via-repairing/30 to-violating/30" />
        <GridOverlay opacity="opacity-10" />
        <div className="relative">
          <div className="max-h-96 overflow-y-auto epistemic-scroll">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Region</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Policy</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Node</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground text-right">Peers</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">MMR root</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Last merge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shards.map((s, idx) => (
                  <motion.tr key={s.id} className={cn("border-border/40 transition-colors", idx % 2 === 0 ? "bg-transparent" : "bg-muted/[0.08]", "hover:bg-muted/25")}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                    <TableCell className="font-medium text-foreground">{s.region}</TableCell>
                    <TableCell><div className="flex flex-col"><span className="text-xs text-foreground">{s.policy.name}</span><span className="text-[10px] text-muted-foreground">{s.policy.domain ?? "—"}</span></div></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.nodeId}</TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-1.5", STATUS_TEXT[s.invariantStatus])}>
                        <span className="relative"><StatusDot status={s.invariantStatus} />
                          {s.invariantStatus === "violating" && <motion.span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-violating" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                        </span>
                        <span className="text-xs capitalize">{s.invariantStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{s.peerCount}</TableCell>
                    <TableCell><Hash value={s.mmrRoot} length={10} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtTimestamp(s.lastMergeAt)}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DagTopologySection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [policyId, setPolicyId] = useState("all");
  const [shards, setShards] = useState<ShardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { let c = false; fetch("/api/policies").then((r) => r.json()).then((d: { policies: PolicyRow[] }) => { if (!c) setPolicies(d.policies ?? []); }).catch(() => {}); return () => { c = true; }; }, []);

  const loadShards = useCallback(async () => {
    const url = policyId === "all" ? "/api/shards" : `/api/shards?policyId=${encodeURIComponent(policyId)}`;
    try { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); const d: { shards: ShardRow[] } = await r.json(); setShards(d.shards ?? []); }
    catch (e) { toast({ title: "Failed to load shards", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [policyId, toast]);

  useEffect(() => { setLoading(true); loadShards(); const t = setInterval(loadShards, POLL_MS); return () => clearInterval(t); }, [loadShards]);

  const sorted = useMemo(() => [...shards].sort((a, b) => {
    const rank: Record<ShardStatus, number> = { violating: 0, repairing: 1, healthy: 2 };
    const r = rank[a.invariantStatus] - rank[b.invariantStatus];
    return r !== 0 ? r : a.region.localeCompare(b.region);
  }), [shards]);

  const total = sorted.length;
  const healthy = sorted.filter((s) => s.invariantStatus === "healthy").length;
  const repairing = sorted.filter((s) => s.invariantStatus === "repairing").length;
  const violating = sorted.filter((s) => s.invariantStatus === "violating").length;
  const pct = total === 0 ? 0 : Math.round((healthy / total) * 100);
  const barColor = pct >= 80 ? "text-verified" : pct >= 50 ? "text-repairing" : "text-violating";

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={cardVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            <Network className="h-4.5 w-4.5 text-verified" />
          </motion.div>
          <div><h2 className="text-base font-semibold text-foreground">DAG Shard Topology</h2><p className="text-xs text-muted-foreground">Live sharded state across regions · MMR-anchored · peer-gossiped</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={policyId} onValueChange={setPolicyId}>
            <SelectTrigger className="w-[220px] bg-card/60"><SelectValue placeholder="Filter by policy" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All policies</SelectItem>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <motion.button type="button" onClick={() => { setRefreshing(true); loadShards(); }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Refresh topology" whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.92 }}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>
      </motion.div>

      {/* Summary bar */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", pct >= 80 ? "from-verified/60 via-verified/30 to-transparent" : pct >= 50 ? "from-repairing/60 via-repairing/30 to-transparent" : "from-violating/60 via-violating/30 to-transparent")} />
          <GridOverlay />
          <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total shards</div><div className="mt-1 flex items-baseline gap-2"><motion.span className="text-2xl font-semibold text-foreground font-mono" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}>{total}</motion.span><Boxes className="h-4 w-4 text-muted-foreground" /></div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Healthy</div><div className="mt-1 flex items-baseline gap-2"><motion.span className="text-2xl font-semibold text-verified font-mono" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.15 }}>{healthy}</motion.span><span className="text-xs text-muted-foreground">/ {total}</span></div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Repairing / Violating</div><div className="mt-1 flex items-baseline gap-3"><motion.span className="text-lg font-semibold text-repairing font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{repairing}</motion.span><motion.span className="text-lg font-semibold text-violating font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>{violating}</motion.span>{violating > 0 && <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}><AlertTriangle className="h-3.5 w-3.5 text-violating" /></motion.span>}</div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Health score</div><div className="mt-1 flex items-baseline gap-2"><motion.span className={cn("text-2xl font-semibold font-mono", barColor)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.3 }}>{pct}%</motion.span></div><Progress value={pct} className={cn("mt-1.5 h-1.5", pct >= 80 ? "[&>div]:bg-verified" : pct >= 50 ? "[&>div]:bg-repairing" : "[&>div]:bg-violating")} /></div>
          </div>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={containerVariants} className="flex flex-wrap items-center gap-4 px-1">
        {[
          { icon: CheckCircle2, label: "Healthy — all invariants satisfied", color: "bg-verified/10", border: "border-verified/30", text: "text-verified" },
          { icon: AlertTriangle, label: "Repairing — self-heal in progress", color: "bg-repairing/10", border: "border-repairing/30", text: "text-repairing" },
          { icon: XCircle, label: "Violating — invariant breach", color: "bg-violating/10", border: "border-violating/30", text: "text-violating" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} variants={itemVariants} className="flex items-center gap-2 text-xs" whileHover={{ scale: 1.04 }}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded border", item.color, item.border)}><Icon className={cn("h-3 w-3", item.text)} /></span>
              <span className="text-muted-foreground">{item.label}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Topology grid */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card/40 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/50 via-repairing/30 to-violating/30" />
          <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-verified" /><span className="text-sm font-medium text-foreground">Mesh view</span><span className="text-xs text-muted-foreground">{sorted.length} node{sorted.length === 1 ? "" : "s"} · dotted links = peer gossip</span></div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-lg bg-muted/40" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center"><Boxes className="h-8 w-8 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No shards found for this policy.</p></div>
            ) : (
              <div className="space-y-3">
                <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sorted.map((s, idx) => <ShardNodeCard key={s.id} shard={s} index={idx} />)}</motion.div>
                <MeshHint />
                <motion.div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <span className="font-mono">DAG</span><ArrowRight className="h-3 w-3" /><span>locality-preserving merges</span><ArrowRight className="h-3 w-3" /><span className="font-mono">MMR root</span>
                </motion.div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {!loading && sorted.length > 0 && <InteractiveDagGraph shards={sorted} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} className="lg:col-span-1"><ShardRebalancePanel onMigrated={loadShards} /></motion.div>
        <div className="lg:col-span-2">
          <motion.div variants={itemVariants} className="mb-2 flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-foreground">Shard ledger</span><span className="text-xs text-muted-foreground">· sorted by status severity</span><Info className="h-3 w-3 text-muted-foreground ml-1" />
          </motion.div>
          {loading ? <Skeleton className="h-64 w-full rounded-lg bg-muted/40" /> : sorted.length === 0 ? <Card className="bg-card/60 border-border/60 p-8 text-center text-sm text-muted-foreground">No shards to display.</Card> : <ShardTable shards={sorted} />}
        </div>
      </div>
    </motion.section>
  );
}
