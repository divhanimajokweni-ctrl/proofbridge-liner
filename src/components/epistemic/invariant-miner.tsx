"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Pickaxe, Check, X, TrendingUp, Activity, Brain, BarChart3,
  ShieldCheck, AlertTriangle, Clock, RotateCw, Gauge, Eye, Target, Flame, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparkLine, HeatGrid } from "./chart-primitives";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PolicyRow, MinedInvariantRow, Severity, StatsResponse } from "@/lib/types";
import { StatusPill, SeverityBadge, containerVariants, itemVariants, fmtTimestamp, SectionHeader, StatCard } from "./primitives";

const POLL_MS = 12_000;

interface DriftSummary { total: number; byInvariant: Record<string, number>; bySeverity: Record<string, number>; byPolicy: Record<string, number>; sampleFields: string[] }

function isStatistical(rationale: string) { return rationale.trim().toLowerCase().startsWith("statistical"); }
function severityBorder(severity: Severity, accepted: boolean) { return accepted ? "border-verified/50" : severity === "critical" ? "border-violating/50" : severity === "high" ? "border-repairing/50" : severity === "medium" ? "border-quarantined/50" : "border-border/60"; }
function severityGlow(severity: Severity, accepted: boolean) { if (accepted) return "glow-verified"; return severity === "critical" ? "shadow-[0_0_12px_-3px_var(--violating)]" : severity === "high" ? "shadow-[0_0_12px_-3px_var(--repairing)]" : ""; }

function ConfidenceGauge({ confidence, accepted, size = 52 }: { confidence: number; accepted: boolean; size?: number }) {
  const pct = Math.round(confidence * 100);
  const band = confidence >= 0.8 ? "verified" : confidence >= 0.6 ? "repairing" : "muted";
  const color = accepted ? "var(--verified)" : `var(--${band})`;
  const textColor = accepted ? "text-verified" : `text-${band}`;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} opacity={0.3} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-mono text-[11px] font-bold tabular-nums", textColor)}>{pct}</span>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, policyName, onAccept, onReject, busy, index }: {
  candidate: MinedInvariantRow; policyName: string; onAccept: () => void; onReject: () => void; busy: boolean; index: number;
}) {
  const statistical = isStatistical(candidate.rationale);
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.35, delay: index * 0.05 }} layout>
      <Card className={cn("bg-card/60 backdrop-blur p-3.5 relative overflow-hidden transition-all duration-200",
        severityBorder(candidate.severity as Severity, candidate.accepted),
        severityGlow(candidate.severity as Severity, candidate.accepted),
        candidate.accepted && "border-verified/30 glow-verified")}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className={cn("absolute top-0 left-0 right-0 h-[2px]",
          candidate.accepted ? "bg-gradient-to-r from-verified/0 via-verified/60 to-verified/0"
            : candidate.severity === "critical" ? "bg-gradient-to-r from-violating/0 via-violating/60 to-violating/0"
            : candidate.severity === "high" ? "bg-gradient-to-r from-repairing/0 via-repairing/60 to-repairing/0"
            : "bg-gradient-to-r from-quarantined/0 via-quarantined/60 to-quarantined/0")} />
        <div className="bg-grid-fine absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <SeverityBadge severity={candidate.severity as Severity} />
              <Badge variant="outline" className={cn("text-[9px] gap-0.5", statistical ? "border-repairing/30 bg-repairing/10 text-repairing" : "border-verified/30 bg-verified/10 text-verified")}>
                {statistical ? <><BarChart3 className="h-2.5 w-2.5" />statistical</> : <><Sparkles className="h-2.5 w-2.5" />AI-mined</>}
              </Badge>
              {candidate.accepted && <StatusPill status="verified" label="Hardened" />}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">{fmtTimestamp(candidate.createdAt)}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <pre className="codeblock rounded-md border border-border/60 bg-background/60 p-2.5 text-verified overflow-x-auto">{candidate.predicate}</pre>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1">
              <ConfidenceGauge confidence={candidate.confidence} accepted={candidate.accepted} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">conf</span>
            </div>
          </div>
          <div className={cn("transition-all duration-200 overflow-hidden", hovered ? "max-h-32 opacity-100" : "max-h-6 opacity-70")}>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{candidate.rationale}</p>
          </div>
          {!hovered && candidate.rationale.length > 60 && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50"><Eye className="h-2.5 w-2.5" />hover for full rationale</div>
          )}
          <Separator className="bg-border/40" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /><span className="font-mono">{policyName}</span></span>
            </div>
            {candidate.accepted ? (
              <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[10px] gap-0.5"><Check className="h-2.5 w-2.5" />hardened into enforcer</Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="h-7 border-violating/40 bg-violating/10 text-violating hover:bg-violating/20 px-2"><X className="h-3 w-3" />Reject</Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button size="sm" onClick={onAccept} disabled={busy} className="h-7 border border-verified/40 bg-verified/15 text-verified hover:bg-verified/25 px-2.5" variant="outline"><Check className="h-3 w-3" />Accept</Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}



function MiningProgress({ mining, progress }: { mining: boolean; progress: number }) {
  if (!mining) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="flex items-center gap-2 rounded-md border border-verified/30 bg-verified/5 px-3 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-verified" /><span className="text-xs text-verified font-medium">Mining in progress…</span>
        <div className="flex-1 max-w-[120px]"><Progress value={progress} className="h-1.5 bg-muted/40" /></div>
        <span className="text-[10px] text-muted-foreground font-mono">{Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
}

export function InvariantMinerSection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [mined, setMined] = useState<MinedInvariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filterPolicyId, setFilterPolicyId] = useState<string>("all");
  const [mining, setMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [driftSummary, setDriftSummary] = useState<DriftSummary | null>(null);
  const [llmUsed, setLlmUsed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const policyMap = useMemo(() => { const m: Record<string, PolicyRow> = {}; for (const p of policies) m[p.id] = p; return m; }, [policies]);
  const policyName = (id: string | null, fallback?: string | null) => fallback ?? (id ? policyMap[id]?.name ?? "global" : "global");

  useEffect(() => { let c = false; fetch("/api/policies").then((r) => r.json()).then((d: { policies: PolicyRow[] }) => { if (!c) setPolicies(d.policies ?? []); }).catch(() => {}); return () => { c = true; }; }, []);
  useEffect(() => { let c = false; const load = () => fetch("/api/stats").then((r) => r.json()).then((d: StatsResponse) => { if (!c) setStats(d); }).catch(() => {}); load(); const t = setInterval(load, POLL_MS); return () => { c = true; clearInterval(t); }; }, []);

  const loadMined = useCallback(async () => {
    try {
      const url = filterPolicyId && filterPolicyId !== "all" ? `/api/miner?policyId=${encodeURIComponent(filterPolicyId)}` : "/api/miner";
      const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: { mined: MinedInvariantRow[] } = await r.json();
      setMined(d.mined ?? []); setFetchError(false);
    } catch { setFetchError(true); } finally { setLoading(false); }
  }, [filterPolicyId]);

  useEffect(() => { setLoading(true); loadMined(); const t = setInterval(loadMined, POLL_MS); return () => clearInterval(t); }, [loadMined]);

  const mine = useCallback(async () => {
    setMining(true); setMiningProgress(0);
    const pi = setInterval(() => setMiningProgress((p) => Math.min(p + Math.random() * 15, 90)), 400);
    try {
      const body: { policyId?: string; useLLM: boolean } = { useLLM: true };
      if (filterPolicyId && filterPolicyId !== "all") body.policyId = filterPolicyId;
      const r = await fetch("/api/miner/mine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: { mined: MinedInvariantRow[]; llmUsed: boolean; driftSummary: DriftSummary } = await r.json();
      const fresh = d.mined ?? [];
      setLlmUsed(d.llmUsed); setDriftSummary(d.driftSummary ?? null);
      setMined((prev) => { const seen = new Set(prev.map((m) => m.id)); return [...fresh.filter((m) => !seen.has(m.id)), ...prev].sort((a, b) => b.confidence - a.confidence); });
      setFetchError(false); setMiningProgress(100);
      toast({ title: `Mined ${fresh.length} candidate${fresh.length === 1 ? "" : "s"}`, description: d.llmUsed ? "LLM augmented the statistical drift baseline." : "Statistical fallback only." });
    } catch (e) { toast({ title: "Mining failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { clearInterval(pi); setTimeout(() => { setMining(false); setMiningProgress(0); }, 600); }
  }, [filterPolicyId, toast]);

  const patch = useCallback(async (id: string, accepted: boolean) => {
    setPatchingId(id);
    try {
      const r = await fetch("/api/miner", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, accepted }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: { mined: MinedInvariantRow } = await r.json();
      setMined((prev) => prev.map((m) => (m.id === id ? { ...m, ...d.mined } : m)).sort((a, b) => b.confidence - a.confidence));
      toast({ title: accepted ? "Invariant hardened" : "Candidate rejected", description: accepted ? "Accepted invariants compile into verified enforcers." : "Rejected — will not be promoted." });
    } catch (e) { toast({ title: "Update failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setPatchingId(null); }
  }, [toast]);

  const sortedMined = useMemo(() => [...mined].sort((a, b) => b.confidence - a.confidence), [mined]);
  const topViolated = useMemo(() => {
    if (driftSummary) return Object.entries(driftSummary.byInvariant).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return stats?.drift?.topViolated ?? ([] as [string, number][]);
  }, [driftSummary, stats]);
  const totalViolations = stats?.drift?.total ?? stats?.counts.violations ?? driftSummary?.total ?? 0;
  const sparklineData = useMemo(() => topViolated.map(([name, count], i) => ({ name: name.length > 16 ? name.slice(0, 14) + "…" : name, violations: count, index: i })), [topViolated]);
  const treemapData = useMemo(() => {
    const items = Object.entries(driftSummary?.bySeverity ?? {}).map(([name, value]) => ({ name, size: value }));
    return items.length === 0 && topViolated.length > 0 ? topViolated.map(([name, value]) => ({ name, size: value })) : items;
  }, [driftSummary, topViolated]);

  return (
    <section className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <SectionHeader icon={Sparkles} title="AI-Augmented Invariant Miner" subtitle="LLMs propose candidate invariants from drift; humans accept/reject; accepted harden into verified enforcers"
          iconClass="border-verified/30 bg-verified/10 text-verified glow-verified" />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-3">
          <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violating/0 via-violating/50 to-violating/0" />
            <div className="bg-grid-fine absolute inset-0 opacity-30" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violating" /><span className="text-sm font-semibold text-foreground">Drift telemetry</span></div>
                <Badge variant="outline" className={cn("text-[10px]", totalViolations > 0 ? "border-violating/30 bg-violating/10 text-violating" : "border-verified/30 bg-verified/10 text-verified")}>
                  {totalViolations} violation{totalViolations === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="health" value={stats ? `${stats.shardHealth.healthScore}%` : "—"}
                  color={(stats?.shardHealth.healthScore ?? 100) >= 85 ? "text-verified" : (stats?.shardHealth.healthScore ?? 100) >= 60 ? "text-repairing" : "text-violating"} />
                <StatCard label="llm" value={llmUsed === null ? "—" : llmUsed ? "active" : "fallback"}
                  color={llmUsed === null ? "text-muted-foreground" : llmUsed ? "text-verified" : "text-repairing"} />
              </div>
              {sparklineData.length > 0 && (
                <div className="rounded-md border border-border/60 bg-background/40 p-2">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mb-1"><TrendingUp className="h-3 w-3" />violation trend</div>
                  <SparkLine data={sparklineData.map((d) => d.violations)} width={200} height={50} color="violating" fill className="w-full" />
                </div>
              )}
              <Separator className="bg-border/40" />
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><Target className="h-3 w-3" />most-violated invariants</div>
                {topViolated.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/70">No drift data yet — run the miner to populate.</p>
                ) : (
                  <div className="space-y-1.5">
                    {topViolated.map(([name, count]) => {
                      const max = topViolated[0]?.[1] ?? 1;
                      return (
                        <motion.div key={name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]"><span className="font-mono text-foreground truncate">{name}</span><span className="font-mono text-muted-foreground tabular-nums">{count}×</span></div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
                            <motion.div className="h-full rounded-full bg-violating/70" initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
          {treemapData.length > 0 && (
            <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-repairing/0 via-repairing/50 to-repairing/0" />
              <div className="bg-grid-fine absolute inset-0 opacity-20" />
              <div className="relative space-y-2">
                <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold text-foreground">Violation patterns</span></div>
                <HeatGrid data={treemapData.map((d, i) => ({ x: i % 5, y: Math.floor(i / 5), value: d.size, label: d.name }))} rows={Math.max(1, Math.ceil(treemapData.length / 5))} cols={5} colorScale={["var(--quarantined)", "var(--violating)"]} />
              </div>
            </Card>
          )}
          <Card className="bg-card/60 backdrop-blur border-quarantined/30 p-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-quarantined/0 via-quarantined/50 to-quarantined/0" />
            <div className="relative space-y-1.5">
              <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-quarantined" /><span className="text-xs font-semibold text-foreground">Mining pipeline</span></div>
              <ol className="space-y-1 text-[10.5px] text-muted-foreground">
                <li><span className="text-verified font-mono">1.</span> Drift telemetry collected from invariant violations.</li>
                <li><span className="text-verified font-mono">2.</span> LLM proposes grounded candidate predicates.</li>
                <li><span className="text-verified font-mono">3.</span> Human accepts → compiles to WASM enforcer.</li>
                <li><span className="text-verified font-mono">4.</span> Hardened invariants close the feedback loop.</li>
              </ol>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="space-y-3 lg:col-span-2">
          <Card className="bg-card/60 backdrop-blur border-border/60 p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-verified/0 via-verified/30 to-verified/0" />
            <div className="bg-grid-fine absolute inset-0 opacity-20" />
            <div className="relative flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">policy</span>
                <Select value={filterPolicyId} onValueChange={setFilterPolicyId}>
                  <SelectTrigger className="h-8 w-[200px] bg-card/60 text-xs"><SelectValue placeholder="All policies" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All policies</SelectItem>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button onClick={mine} disabled={mining} className="ml-auto bg-verified/15 border border-verified/40 text-verified hover:bg-verified/25" variant="outline">
                  {mining ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Pickaxe className="h-3.5 w-3.5" />}{mining ? "Mining…" : "Mine candidates"}
                </Button>
              </TooltipTrigger><TooltipContent><p>Run AI-augmented mining on drift telemetry</p></TooltipContent></Tooltip></TooltipProvider>
              {driftSummary && <Badge variant="outline" className="border-border/60 text-[10px] gap-1"><BarChart3 className="h-2.5 w-2.5" />{driftSummary.total} drift points</Badge>}
            </div>
            {fetchError && <div className="relative mt-2 flex items-center gap-1.5 text-[10px] text-repairing"><AlertTriangle className="h-3 w-3" />Live list sync unavailable — mining still works.</div>}
          </Card>
          <AnimatePresence><MiningProgress mining={mining} progress={miningProgress} /></AnimatePresence>
          {loading && mined.length === 0 ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg bg-muted/40" />)}</div>
          ) : sortedMined.length === 0 ? (
            <Card className="bg-card/60 border-dashed border-border/60 p-8 text-center">
              <Pickaxe className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No candidate invariants yet.</p>
              <p className="text-xs text-muted-foreground/70">Run <span className="font-mono text-verified">Mine candidates</span> to propose from drift.</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 epistemic-scroll">
              <AnimatePresence mode="popLayout">
                {sortedMined.map((c, i) => <CandidateCard key={c.id} candidate={c} policyName={policyName(c.policyId, c.policy?.name)} onAccept={() => patch(c.id, true)} onReject={() => patch(c.id, false)} busy={patchingId === c.id} index={i} />)}
              </AnimatePresence>
            </div>
          )}
          {sortedMined.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-mono"><Clock className="h-3 w-3" />{sortedMined.length} candidate{sortedMined.length === 1 ? "" : "s"} · {sortedMined.filter((m) => m.accepted).length} hardened</span>
              <span className="font-mono">sorted by confidence ↓</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
