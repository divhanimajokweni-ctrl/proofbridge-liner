"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparkLine, MiniBar } from "./chart-primitives";
import {
  GitMerge, Wrench, Play, RotateCw, CheckCircle2, XCircle, ArrowRight,
  ShieldCheck, Sparkles, KeyRound, Clock, ChevronDown, ChevronRight,
  AlertTriangle, Activity, TrendingUp, Zap, Layers, GitBranch, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PolicyRow, MergeRow } from "@/lib/types";
import {
  GradientBorderCard, containerVariants, cardVariants, itemVariants,
  fmtTimestamp, fmtVal, StatusPill, Hash, SeverityBadge, SectionHeader,
  CHART_TOOLTIP_STYLE, StatCard, divColor,
} from "./primitives";

const POLL_MS = 10_000;
const DEFAULT_PROPOSED = `{"frequency":50.6,"thermal_headroom":6,"generation":[420,380,510],"load":[410,375,500],"losses":12}`;

interface AppliedRepair { field: string; from: unknown; to: unknown }
interface RepairResult { ok: boolean; repairedState: Record<string, unknown> | null; violations: string[]; divergence: number; iterations: number; applied: AppliedRepair[] }

function AppliedDiff({ repair }: { repair: AppliedRepair }) {
  const delta = typeof repair.from === "number" && typeof repair.to === "number" ? repair.to - repair.from : null;
  const isNeg = delta !== null && delta < 0;
  return (
    <motion.div variants={itemVariants}
      className={cn("flex flex-col gap-1.5 rounded-md border p-2.5 transition-all hover:shadow-md hover:scale-[1.01]",
        isNeg ? "border-violating/40 bg-violating/5" : delta !== null && delta > 0 ? "border-verified/40 bg-verified/5" : "border-border/60 bg-muted/20")}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-foreground font-medium">{repair.field}</span>
        {delta !== null && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-semibold",
            delta > 0 ? "bg-verified/15 text-verified" : "bg-violating/15 text-violating")}>
            {delta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
            {delta > 0 ? "+" : ""}{delta.toFixed(3)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono px-1.5 py-0.5 rounded bg-violating/10 text-violating line-through">{fmtVal(repair.from)}</span>
        <ArrowRight className={cn("h-3 w-3 shrink-0", isNeg ? "text-violating" : "text-verified")} />
        <span className="font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified">{fmtVal(repair.to)}</span>
      </div>
    </motion.div>
  );
}

function RepairFlowDiagram({ repair }: { repair: RepairResult }) {
  const steps = [
    { label: "Original", icon: GitBranch, color: "text-repairing", bg: "bg-repairing/10 border-repairing/40", detail: `${repair.applied.length} field(s)` },
    { label: "Violations", icon: AlertTriangle, color: "text-violating", bg: "bg-violating/10 border-violating/40", detail: `${repair.violations.length} unresolved` },
    { label: "Self-repair", icon: Wrench, color: repair.ok ? "text-verified" : "text-repairing", bg: repair.ok ? "bg-verified/10 border-verified/40" : "bg-repairing/10 border-repairing/40", detail: `${repair.iterations} iter(s)` },
    { label: repair.ok ? "Healed" : "Partial", icon: repair.ok ? ShieldCheck : XCircle, color: repair.ok ? "text-verified" : "text-violating", bg: repair.ok ? "bg-verified/10 border-verified/40" : "bg-violating/10 border-violating/40", detail: `div ${repair.divergence.toFixed(4)}` },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center gap-1 shrink-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={cn("flex flex-col items-center gap-1 rounded-md border px-2.5 py-1.5 min-w-[72px]", step.bg)}>
              <Icon className={cn("h-3.5 w-3.5", step.color)} />
              <span className={cn("text-[9px] font-semibold uppercase tracking-wide", step.color)}>{step.label}</span>
              <span className="text-[8px] font-mono text-muted-foreground">{step.detail}</span>
            </motion.div>
            {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function DivergenceChart({ merges }: { merges: MergeRow[] }) {
  const values = useMemo(() => {
    if (!merges?.length) return Array.from({ length: 10 }, (_, i) => Math.abs(Math.sin(i * 0.6) * 0.3));
    return merges.slice(0, 10).map((m) => m.divergence);
  }, [merges]);
  return (
    <div className="h-32 w-full flex items-center justify-center">
      <SparkLine data={values} width={280} height={100} color="var(--repairing)" fill className="w-full" />
    </div>
  );
}

function RepairCostChart({ repair }: { repair: RepairResult }) {
  const data = useMemo(() => repair.applied?.map((a) => {
    const from = typeof a.from === "number" ? a.from : 0; const to = typeof a.to === "number" ? a.to : 0;
    return { label: a.field.length > 12 ? a.field.slice(0, 10) + "…" : a.field, value: Math.abs(to - from), color: to - from >= 0 ? "verified" : "violating" };
  }) ?? [], [repair]);
  if (!data.length) return null;
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" />Repair cost per field</div>
      <div className="h-28 w-full flex items-center justify-center">
        <MiniBar data={data} width={280} height={90} className="w-full" />
      </div>
    </div>
  );
}

function RepairVisualization({ repair, mergeId, onRerun, rerunning }: { repair: RepairResult; mergeId?: string; onRerun?: () => void; rerunning?: boolean }) {
  return (
    <GradientBorderCard gradientFrom={repair.ok ? "oklch(0.78 0.16 160 / 0.35)" : "oklch(0.64 0.21 25 / 0.4)"} gradientTo="oklch(0.32 0.014 165 / 0.1)">
      <div className="bg-grid-fine absolute inset-0 opacity-20 rounded-lg" />
      <div className="relative space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Wrench className={cn("h-4 w-4", repair.ok ? "text-verified" : "text-violating")} /><span className="text-sm font-semibold">Self-repair result</span></div>
          <StatusPill status={repair.ok ? "applied" : "rejected"} label={repair.ok ? "Repaired" : "Unresolved"} />
        </div>
        <RepairFlowDiagram repair={repair} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]"><span className="uppercase tracking-wide text-muted-foreground">Solver progress</span><span className="font-mono">{repair.iterations} iteration(s)</span></div>
          <Progress value={repair.ok ? 100 : Math.min(85, repair.iterations * 20)} className={cn("h-1.5", repair.ok ? "[&>div]:bg-verified" : "[&>div]:bg-repairing")} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatCard label="Divergence" value={repair.divergence.toFixed(4)} color={divColor(repair.divergence)} />
          <StatCard label="Iterations" value={repair.iterations} />
          <StatCard label="Applied" value={repair.applied.length} color="text-verified" />
        </div>
        <RepairCostChart repair={repair} />
        {repair.applied.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Layers className="h-3 w-3" />Field transformations</div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {repair.applied.map((a, i) => <AppliedDiff key={`${a.field}-${i}`} repair={a} />)}
            </motion.div>
          </div>
        )}
        {repair.violations.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-violating"><AlertTriangle className="h-3 w-3" />Unresolved violations ({repair.violations.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {repair.violations.map((v) => <span key={v} className="inline-flex items-center gap-1 rounded border border-violating/40 bg-violating/10 px-2 py-0.5 text-[11px] font-mono text-violating"><XCircle className="h-3 w-3" />{v}</span>)}
            </div>
          </div>
        )}
        {mergeId && onRerun && (
          <Button variant="outline" size="sm" onClick={onRerun} disabled={rerunning} className="w-full border-border/60 bg-card/40">
            <RotateCw className={cn("h-3.5 w-3.5", rerunning && "animate-spin")} />{rerunning ? "Re-running…" : "Re-run repair"}
          </Button>
        )}
      </div>
    </GradientBorderCard>
  );
}

function getMergeType(merge: MergeRow): "clean" | "repaired" | "rejected" {
  if (merge.status === "rejected") return "rejected";
  if (merge.repairedState && Object.keys(merge.repairedState).length > 0) return "repaired";
  return "clean";
}

const MERGE_CFG = {
  clean: { border: "border-verified/30", bg: "bg-verified/5", badge: { label: "CLEAN", color: "border-verified/40 bg-verified/10 text-verified" } },
  repaired: { border: "border-repairing/30", bg: "bg-repairing/5", badge: { label: "REPAIRED", color: "border-repairing/40 bg-repairing/10 text-repairing" } },
  rejected: { border: "border-violating/30", bg: "bg-violating/5", badge: { label: "REJECTED", color: "border-violating/40 bg-violating/10 text-violating" } },
};

function MergeItem({ merge, defaultOpen }: { merge: MergeRow; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const mt = getMergeType(merge); const cfg = MERGE_CFG[mt];
  return (
    <motion.div variants={cardVariants}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className={cn("bg-card/60 backdrop-blur p-0 relative overflow-hidden transition-all hover:shadow-lg", open ? cfg.border : "border-border/60")}>
          <CollapsibleTrigger asChild>
            <button type="button" className="relative w-full text-left p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="truncate text-sm font-medium">{merge.policy.name}</span>
                    <StatusPill status={merge.status} />
                    <Badge variant="outline" className={cn("text-[9px]", cfg.badge.color)}>{cfg.badge.label}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 pl-6 text-[11px] text-muted-foreground">
                    <span className="font-mono">{merge.sourceShardName}</span><ArrowRight className="h-3 w-3" /><span className="font-mono">{merge.targetShard}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{fmtTimestamp(merge.createdAt)}</span>
                  {merge.zkProof && <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[10px]"><KeyRound className="h-2.5 w-2.5" />ZK</Badge>}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 pl-6 text-[10px] text-muted-foreground flex-wrap">
                <span>div <span className={cn("font-mono", divColor(merge.divergence))}>{merge.divergence.toFixed(3)}</span></span>
                <span>iters <span className="font-mono text-foreground">{merge.iterations}</span></span>
                <span>mmr <Hash value={merge.mmrProof} length={10} /></span>
                {merge.violations.length > 0 && <span className="text-violating"><XCircle className="h-2.5 w-2.5 inline" /> {merge.violations.length}</span>}
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={cn("border-t p-3 space-y-3", cfg.bg)}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[10px] uppercase tracking-wide text-repairing">Proposed state</div>
                  <pre className="codeblock max-h-64 overflow-y-auto rounded-md border border-repairing/30 bg-background/60 p-2.5 text-[11px]">{JSON.stringify(merge.proposedState, null, 2)}</pre>
                </div>
                <div>
                  <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Repaired state {merge.repairedState ? "" : "(none)"}</div>
                  <pre className={cn("codeblock max-h-64 overflow-y-auto rounded-md border p-2.5 text-[11px]", merge.repairedState ? "border-verified/30 bg-background/60" : "border-border/60 bg-muted/30")}>{merge.repairedState ? JSON.stringify(merge.repairedState, null, 2) : "— no repair applied —"}</pre>
                </div>
              </div>
              {merge.repairedState && <InlineStateDiff proposed={merge.proposedState} repaired={merge.repairedState} />}
              {merge.violations.length > 0 && (
                <div><div className="mb-1.5 text-[10px] uppercase tracking-wide text-violating">Violations</div>
                  <div className="flex flex-wrap gap-1.5">{merge.violations.map((v) => <span key={v} className="inline-flex items-center gap-1 rounded border border-violating/40 bg-violating/10 px-2 py-0.5 text-[11px] font-mono text-violating"><XCircle className="h-3 w-3" />{v}</span>)}</div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(merge.createdAt).toLocaleString()}</span>
                {merge.zkProof && <span className="flex items-center gap-1 font-mono text-verified"><KeyRound className="h-3 w-3" />{merge.zkProof}</span>}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}

function InlineStateDiff({ proposed, repaired }: { proposed: Record<string, unknown>; repaired: Record<string, unknown> }) {
  const diffs = useMemo(() => {
    const keys = new Set([...Object.keys(proposed ?? {}), ...Object.keys(repaired ?? {})]);
    return Array.from(keys).sort().map((key) => {
      const fromVal = proposed?.[key]; const toVal = repaired?.[key];
      const changed = JSON.stringify(fromVal) !== JSON.stringify(toVal);
      const delta = typeof fromVal === "number" && typeof toVal === "number" ? toVal - fromVal : null;
      return { key, from: fromVal, to: toVal, changed, delta };
    }).filter((d) => d.changed);
  }, [proposed, repaired]);
  if (!diffs.length) return null;
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-wide text-foreground/70 flex items-center gap-1.5"><Eye className="h-3 w-3" />State delta ({diffs.length})</div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {diffs.map((d) => (
          <div key={d.key} className={cn("flex items-center justify-between gap-2 rounded border px-2 py-1 text-[11px]",
            d.delta !== null ? d.delta > 0 ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5" : "border-repairing/30 bg-repairing/5")}>
            <div className="flex items-center gap-1.5 min-w-0"><span className="font-mono text-muted-foreground truncate">{d.key}</span><ArrowRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground" /></div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn("font-mono line-through", d.delta !== null && d.delta < 0 ? "text-violating" : "text-muted-foreground")}>{fmtVal(d.from)}</span>
              <span className={cn("font-mono", d.delta !== null ? d.delta > 0 ? "text-verified" : "text-violating" : "text-verified")}>{fmtVal(d.to)}</span>
              {d.delta !== null && <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-4", d.delta > 0 ? "border-verified/30 text-verified" : "border-violating/30 text-violating")}>{d.delta > 0 ? "+" : ""}{d.delta.toFixed(3)}</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MergeSummary({ merges }: { merges: MergeRow[] }) {
  const stats = useMemo(() => {
    const clean = merges.filter((m) => getMergeType(m) === "clean").length;
    const repaired = merges.filter((m) => getMergeType(m) === "repaired").length;
    const rejected = merges.filter((m) => getMergeType(m) === "rejected").length;
    const avgDiv = merges.length > 0 ? merges.reduce((s, m) => s + m.divergence, 0) / merges.length : 0;
    return { clean, repaired, rejected, avgDiv };
  }, [merges]);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatCard label="Clean" value={stats.clean} color="text-verified" bg="bg-verified/10" border="border-verified/30" />
      <StatCard label="Repaired" value={stats.repaired} color="text-repairing" bg="bg-repairing/10" border="border-repairing/30" />
      <StatCard label="Rejected" value={stats.rejected} color="text-violating" bg="bg-violating/10" border="border-violating/30" />
      <StatCard label="Avg div" value={stats.avgDiv.toFixed(3)} bg="bg-muted/20" border="border-border/60" />
    </div>
  );
}

export function MergeReconciliationSection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [merges, setMerges] = useState<MergeRow[]>([]);
  const [loadingMerges, setLoadingMerges] = useState(true);
  const [policyId, setPolicyId] = useState<string>("");
  const [proposedText, setProposedText] = useState(DEFAULT_PROPOSED);
  const [submitting, setSubmitting] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ mergeId: string; repair: RepairResult } | null>(null);

  useEffect(() => { let c = false; fetch("/api/policies").then((r) => r.json()).then((d: { policies: PolicyRow[] }) => { if (c) return; const ps = d.policies ?? []; setPolicies(ps); if (ps.length > 0 && !policyId) setPolicyId(ps[0].id); }).catch(() => {}); return () => { c = true; }; }, []);

  const loadMerges = useCallback(async () => {
    try { const r = await fetch("/api/merges"); if (!r.ok) throw new Error(); setMerges((await r.json()).merges ?? []); } catch (e) { toast({ title: "Failed to load merges", variant: "destructive" }); } finally { setLoadingMerges(false); }
  }, [toast]);

  useEffect(() => { loadMerges(); const t = setInterval(loadMerges, POLL_MS); return () => clearInterval(t); }, [loadMerges]);

  const runRepair = useCallback(async () => {
    if (!policyId) { toast({ title: "Select a policy first", variant: "destructive" }); return; }
    let proposed: Record<string, unknown>;
    try { proposed = JSON.parse(proposedText); } catch (e) { toast({ title: "Invalid JSON", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/merges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId, sourceShardName: "manual", targetShard: "default", proposedState: proposed }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      const repair: RepairResult = d.repair;
      setLastResult({ mergeId: d.merge?.id, repair });
      toast({ title: repair.ok ? "Self-repair succeeded" : "Self-repair unresolved", variant: repair.ok ? "default" : "destructive" });
      loadMerges();
    } catch { toast({ title: "Repair request failed", variant: "destructive" }); } finally { setSubmitting(false); }
  }, [policyId, proposedText, toast, loadMerges]);

  const rerun = useCallback(async () => {
    if (!lastResult?.mergeId) return;
    setRerunning(true);
    try {
      const r = await fetch("/api/merges/repair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mergeId: lastResult.mergeId }) });
      if (!r.ok) throw new Error();
      const repair: RepairResult = (await r.json()).repair;
      setLastResult((prev) => (prev ? { ...prev, repair } : prev));
      loadMerges();
    } catch { toast({ title: "Re-run failed", variant: "destructive" }); } finally { setRerunning(false); }
  }, [lastResult, toast, loadMerges]);

  const recentMerges = useMemo(() => merges.slice(0, 12), [merges]);

  return (
    <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={cardVariants}>
        <SectionHeader icon={GitMerge} title="Self-Repairing Merge Reconciliation" subtitle="Propose a state merge · invariant enforcer self-heals"
          iconClass="border-repairing/30 bg-repairing/10 text-repairing" />
      </motion.div>

      <motion.div variants={cardVariants}>
        <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Merge Analytics</span></div>
              <Badge variant="outline" className="border-border/60 text-[10px]">{merges.length} total</Badge>
            </div>
            <MergeSummary merges={merges} />
            <DivergenceChart merges={merges} />
          </div>
        </GradientBorderCard>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Card className="bg-card/60 backdrop-blur border-border/60 p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Recent proposals</span><Badge variant="outline" className="border-border/60 text-[10px]">{merges.length}</Badge></div><span className="text-[10px] text-muted-foreground">click to expand</span></div></Card>
          {loadingMerges ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg bg-muted/40" />)}</div>
            : recentMerges.length === 0 ? <Card className="bg-card/60 border-border/60 p-8 text-center"><Wrench className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No merge proposals yet.</p></Card>
              : <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2 max-h-[640px] overflow-y-auto pr-1">{recentMerges.map((m) => <MergeItem key={m.id} merge={m} />)}</motion.div>
          }
        </div>

        <div className="space-y-3">
          <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
            <div className="bg-grid-fine absolute inset-0 opacity-20 rounded-lg" />
            <div className="relative space-y-3 p-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Propose merge</span></div><Badge variant="outline" className="border-repairing/30 bg-repairing/10 text-repairing text-[10px]">self_repair</Badge></div>
              <div className="space-y-1.5"><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Target policy</label><Select value={policyId} onValueChange={setPolicyId}><SelectTrigger className="bg-card/60"><SelectValue placeholder="Select policy" /></SelectTrigger><SelectContent>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposed state (JSON)</label><Textarea value={proposedText} onChange={(e) => setProposedText(e.target.value)} className="font-mono text-xs bg-background/60 min-h-[180px]" spellCheck={false} /></div>
              <Button onClick={runRepair} disabled={submitting || !policyId} variant="outline" className="w-full bg-repairing/15 border border-repairing/40 text-repairing hover:bg-repairing/25">
                {submitting ? <RotateCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{submitting ? "Running self-repair…" : "Run self-repair"}
              </Button>
            </div>
          </GradientBorderCard>
          <AnimatePresence mode="wait">
            {lastResult ? (
              <motion.div key="repair-result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <RepairVisualization repair={lastResult.repair} mergeId={lastResult.mergeId} onRerun={rerun} rerunning={rerunning} />
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GradientBorderCard gradientFrom="oklch(0.32 0.014 165 / 0.2)" gradientTo="oklch(0.32 0.014 165 / 0.08)">
                  <div className="p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-2 text-sm text-muted-foreground">No repair run yet — propose a merge to see the diff.</p></div>
                </GradientBorderCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <MergeSimulator policies={policies} />
    </motion.section>
  );
}

function MergeSimulator({ policies }: { policies: PolicyRow[] }) {
  const { toast } = useToast();
  const [simPolicyId, setSimPolicyId] = useState<string>(policies[0]?.id ?? "");
  const [simState, setSimState] = useState(`{"frequency":50.6,"thermal_headroom":6,"generation":[420,380,510],"load":[410,375,500],"losses":12}`);
  const [simResult, setSimResult] = useState<{
    evaluations: { name: string; severity: string; soft: boolean; passed: boolean; actual: unknown; expected: unknown }[];
    violations: string[]; hardViolationCount: number; softViolationCount: number;
    repair: { ok: boolean; repairedState?: Record<string, unknown>; divergence: number; iterations: number; adjustments?: Record<string, { from: unknown; to: unknown; delta: number }> } | null;
    verdict: string;
  } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = useCallback(async () => {
    if (!simPolicyId) return;
    let proposed: Record<string, unknown>;
    try { proposed = JSON.parse(simState); } catch { return; }
    setSimulating(true);
    try { const r = await fetch("/api/merges/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId: simPolicyId, proposedState: proposed }) }); if (!r.ok) throw new Error(); setSimResult(await r.json()); } catch {} finally { setSimulating(false); }
  }, [simPolicyId, simState]);

  const vc = simResult?.verdict === "accepted" ? "text-verified" : simResult?.verdict === "repaired" ? "text-repairing" : "text-violating";
  const vb = simResult?.verdict === "accepted" ? "bg-verified/10 border-verified/30" : simResult?.verdict === "repaired" ? "bg-repairing/10 border-repairing/30" : "bg-violating/10 border-violating/30";

  return (
    <motion.div variants={cardVariants}>
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.25)" gradientTo="oklch(0.65 0.2 25 / 0.15)">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Eye className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Merge Simulator</span></div><Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[10px]">what-if</Badge></div>
          <p className="text-[11px] text-muted-foreground">Preview how a proposed state would be evaluated and repaired — without committing.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="space-y-1"><label className="text-[10px] uppercase tracking-wide text-muted-foreground">Policy</label><Select value={simPolicyId} onValueChange={setSimPolicyId}><SelectTrigger className="bg-card/60 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-[10px] uppercase tracking-wide text-muted-foreground">Proposed state (JSON)</label><Textarea value={simState} onChange={(e) => setSimState(e.target.value)} className="font-mono text-xs bg-background/60 min-h-[120px]" spellCheck={false} /></div>
              <Button onClick={runSimulation} disabled={simulating || !simPolicyId} variant="outline" className="w-full bg-verified/15 border border-verified/40 text-verified hover:bg-verified/25 h-8 text-xs">
                {simulating ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{simulating ? "Simulating…" : "Simulate merge"}
              </Button>
            </div>
            <div className="space-y-2">
              {simResult ? (
                <>
                  <div className={cn("rounded-md border px-3 py-2 flex items-center justify-between", vb)}>
                    <span className={cn("text-sm font-bold uppercase", vc)}>{simResult.verdict}</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono"><span className="text-violating">{simResult.hardViolationCount} hard</span><span className="text-quarantined">{simResult.softViolationCount} soft</span></div>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto space-y-1">
                    {simResult.evaluations.map((ev) => (
                      <div key={ev.name} className={cn("flex items-center gap-2 rounded border px-2 py-1 text-[10px]", ev.passed ? "border-verified/20 bg-verified/5" : ev.soft ? "border-quarantined/20 bg-quarantined/5" : "border-violating/20 bg-violating/5")}>
                        {ev.passed ? <CheckCircle2 className="h-3 w-3 text-verified shrink-0" /> : ev.soft ? <AlertTriangle className="h-3 w-3 text-quarantined shrink-0" /> : <XCircle className="h-3 w-3 text-violating shrink-0" />}
                        <span className="font-mono truncate flex-1">{ev.name}</span>
                        {!ev.passed && ev.actual !== null && <span className="font-mono text-muted-foreground shrink-0">→ {String(ev.actual)}</span>}
                      </div>
                    ))}
                  </div>
                  {simResult.repair?.ok && simResult.repair.adjustments && Object.keys(simResult.repair.adjustments).length > 0 && (
                    <div className="rounded-md border border-repairing/30 bg-repairing/5 p-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-repairing"><Wrench className="h-3 w-3" />Self-repair · {simResult.repair.iterations} iter · div {simResult.repair.divergence.toFixed(3)}</div>
                      {Object.entries(simResult.repair.adjustments).map(([field, adj]) => (
                        <div key={field} className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-muted-foreground">{field}:</span>
                          <span className="text-violating line-through">{String(adj.from)}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-verified">{String(adj.to)}</span>
                          <span className={cn("ml-auto", adj.delta > 0 ? "text-verified" : "text-violating")}>{adj.delta > 0 ? "+" : ""}{adj.delta.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center border border-dashed border-border/40 rounded-md">
                  <Eye className="h-6 w-6 text-muted-foreground/40" /><p className="mt-2 text-xs text-muted-foreground">Run simulation to see evaluation & repair preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GradientBorderCard>
    </motion.div>
  );
}
