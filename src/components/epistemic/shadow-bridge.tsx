"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Activity, Zap, Play, Radio, Moon, ShieldAlert, FlaskConical,
  RotateCw, GitCompare, Undo2, AlertTriangle, CheckCircle2, XCircle,
  Clock, Gauge, Power, Wifi, WifiOff, TrendingUp, TrendingDown, Minus, Eye, BarChart3,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatValue } from "@/lib/format";
import type { PolicyRow, ShadowBridgeRow, ShadowEventRow, ShadowKind, Severity } from "@/lib/types";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants, fmtTimestamp, SeverityBadge, CHART_TOOLTIP_STYLE, SectionHeader, divColor, GridOverlay } from "./primitives";

const POLL_MS = 8_000;
const DEFAULT_DELTA = `{"frequency": 49.5}`;

interface InvariantEval { name: string; passed: boolean; severity: Severity; soft: boolean; actual?: string }

const KIND_META: Record<ShadowKind, { icon: typeof ShieldAlert; color: string; border: string; text: string; label: string }> = {
  takeover: { icon: ShieldAlert, color: "bg-violating/15", border: "border-violating/40", text: "text-violating", label: "TAKEOVER" },
  whatif: { icon: FlaskConical, color: "bg-repairing/15", border: "border-repairing/40", text: "text-repairing", label: "WHAT-IF" },
  replay: { icon: RotateCw, color: "bg-quarantined/15", border: "border-quarantined/40", text: "text-quarantined", label: "REPLAY" },
  divergence: { icon: GitCompare, color: "bg-violating/15", border: "border-violating/40", text: "text-violating", label: "DIVERGENCE" },
  handback: { icon: Undo2, color: "bg-verified/15", border: "border-verified/40", text: "text-verified", label: "HANDBACK" },
};

function fmtVal(v: unknown) { return formatValue(v, 40); }

function DriftSparkline({ events }: { events: ShadowEventRow[] }) {
  const data = useMemo(() => {
    if (!events?.length) return Array.from({ length: 20 }, (_, i) => ({ idx: i, drift: Math.abs(Math.sin(i * 0.4) * 0.3 + Math.cos(i * 0.7) * 0.15 + 0.05) }));
    return events.slice(0, 20).map((ev, i) => ({ idx: i, drift: ev.divergence }));
  }, [events]);
  const maxDrift = Math.max(...data.map((d) => d.drift), 0.01);
  return (
    <div className="h-12 w-full"><ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs><linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.80 0.15 80)" stopOpacity={0.4} /><stop offset="95%" stopColor="oklch(0.80 0.15 80)" stopOpacity={0.02} /></linearGradient></defs>
        <YAxis domain={[0, maxDrift * 1.2]} hide /><Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [v.toFixed(4), "drift"]} />
        <Area type="monotone" dataKey="drift" stroke="oklch(0.80 0.15 80)" strokeWidth={1.5} fill="url(#driftGrad)" animationDuration={1200} />
      </AreaChart>
    </ResponsiveContainer></div>
  );
}

function GaugeNeedle({ value, max, size = 80 }: { value: number; max: number; size?: number }) {
  const clamped = Math.min(Math.max(value / max, 0), 1);
  const angle = -90 + clamped * 180;
  const color = clamped < 0.33 ? "oklch(0.78 0.16 160)" : clamped < 0.66 ? "oklch(0.80 0.15 80)" : "oklch(0.64 0.21 25)";
  return (
    <svg width={size} height={size / 2 + 6} viewBox="0 0 80 46" className="overflow-visible">
      <defs><linearGradient id="gaugeArcGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="oklch(0.78 0.16 160)" /><stop offset="50%" stopColor="oklch(0.80 0.15 80)" /><stop offset="100%" stopColor="oklch(0.64 0.21 25)" /></linearGradient></defs>
      <path d="M 8 42 A 34 34 0 0 1 72 42" fill="none" stroke="oklch(0.32 0.014 165 / 0.4)" strokeWidth={5} strokeLinecap="round" />
      <motion.path d="M 8 42 A 34 34 0 0 1 72 42" fill="none" stroke="url(#gaugeArcGrad)" strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${clamped * 107} 107`} initial={{ strokeDasharray: "0 107" }} animate={{ strokeDasharray: `${clamped * 107} 107` }} transition={{ duration: 1.2, ease: "easeOut" }} />
      <motion.line x1="40" y1="42" x2="40" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round"
        initial={{ rotate: -90, transformOrigin: "40px 42px" }} animate={{ rotate: angle, transformOrigin: "40px 42px" }} transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.3 }} />
      <circle cx="40" cy="42" r={3} fill={color} />
    </svg>
  );
}

function StateKV({ state, accent }: { state: Record<string, unknown>; accent?: string }) {
  return (
    <div className="space-y-1">
      {Object.entries(state ?? {}).length === 0 && <div className="text-[11px] text-muted-foreground italic">no state</div>}
      {Object.entries(state ?? {}).map(([k, v]) => (
        <motion.div key={k} variants={itemVariants} className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-muted/30 transition-colors">
          <span className="font-mono text-[11px] text-muted-foreground">{k}</span>
          <span className={cn("font-mono text-[11px] truncate max-w-[60%] text-right", accent ?? "text-foreground")} title={fmtVal(v)}>{fmtVal(v)}</span>
        </motion.div>
      ))}
    </div>
  );
}

function InvariantRow({ live, shadow }: { live?: InvariantEval; shadow?: InvariantEval }) {
  const name = live?.name ?? shadow?.name ?? "?";
  const divergent = !!live && !!shadow && live.passed !== shadow.passed;
  return (
    <motion.div variants={itemVariants}
      className={cn("flex items-center justify-between gap-2 rounded px-1.5 py-1 transition-colors hover:bg-muted/20", divergent && "bg-violating/10 border border-violating/30")}>
      <div className="flex min-w-0 items-center gap-2"><span className="font-mono text-[11px] text-foreground truncate">{name}</span><SeverityBadge severity={(live ?? shadow)!.severity} soft={(live ?? shadow)!.soft} /></div>
      <div className="flex items-center gap-2 text-xs">
        {([["L", live], ["S", shadow]] as const).map(([label, inv]) => (
          <TooltipProvider key={label}><UITooltip><TooltipTrigger asChild>
            <span className={cn("flex items-center gap-0.5 cursor-default", inv?.passed ? "text-verified" : "text-violating")}>
              {inv?.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}<span className="text-[10px] uppercase">{label}</span>
            </span>
          </TooltipTrigger><TooltipContent side="top" className="text-xs">{label === "L" ? "Live" : "Shadow"}: {inv?.passed ? "passed" : "failed"}</TooltipContent></UITooltip></TooltipProvider>
        ))}
      </div>
    </motion.div>
  );
}

function EventTimelineItem({ ev }: { ev: ShadowEventRow }) {
  const meta = KIND_META[ev.kind] ?? KIND_META.divergence;
  const Icon = meta.icon;
  return (
    <motion.div variants={itemVariants}
      className={cn("relative rounded-md border p-2.5 bg-card/40 transition-all hover:bg-muted/20", ev.authoritative ? cn(meta.border, "glow-violating") : "border-border/60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-6 w-6 items-center justify-center rounded border", meta.color, meta.border)}><Icon className={cn("h-3 w-3", meta.text)} /></span>
          <div className="flex flex-col"><span className={cn("text-[10px] font-semibold uppercase tracking-wide", meta.text)}>{meta.label}</span><span className="text-[11px] text-foreground">{ev.summary}</span></div>
        </div>
        {ev.authoritative && <Badge variant="outline" className="border-violating/40 bg-violating/10 text-violating text-[9px]">AUTH</Badge>}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><GitCompare className="h-2.5 w-2.5" /><span className="font-mono">div {ev.divergence.toFixed(3)}</span></span>
        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{fmtTimestamp(ev.createdAt)}</span>
      </div>
    </motion.div>
  );
}

function BridgeStatusIndicator({ shadowEnabled, authoritative, divergence }: { shadowEnabled: boolean; authoritative: boolean; divergence: number }) {
  const status = !shadowEnabled ? "disabled" : authoritative ? "takeover" : divergence < 0.001 ? "aligned" : divergence < 1 ? "drifting" : "breached";
  const cfg: Record<string, { color: string; bg: string; border: string; text: string; icon: typeof Wifi }> = {
    disabled: { color: "text-muted-foreground", bg: "bg-muted/20", border: "border-border/60", text: "DISABLED", icon: WifiOff },
    aligned: { color: "text-verified", bg: "bg-verified/10", border: "border-verified/40", text: "ALIGNED", icon: Wifi },
    drifting: { color: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/40", text: "DRIFTING", icon: TrendingUp },
    breached: { color: "text-violating", bg: "bg-violating/10", border: "border-violating/40", text: "BREACHED", icon: AlertTriangle },
    takeover: { color: "text-violating", bg: "bg-violating/15", border: "border-violating/50", text: "TAKEOVER ACTIVE", icon: ShieldAlert },
  };
  const c = cfg[status]; const Icon = c.icon;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5", c.bg, c.border)}>
      <span className="relative flex h-2.5 w-2.5">
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", (status === "takeover" || status === "breached") && "animate-epistemic-pulse", c.color.replace("text-", "bg-"))} />
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", c.color.replace("text-", "bg-"))} />
      </span>
      <Icon className={cn("h-3.5 w-3.5", c.color)} /><span className={cn("text-xs font-semibold uppercase tracking-wide", c.color)}>{c.text}</span>
    </motion.div>
  );
}

function DivergenceMeter({ divergence, authoritative, events }: { divergence: number; authoritative: boolean; events: ShadowEventRow[] }) {
  const pct = Math.min(100, Math.round(Math.sqrt(divergence) * 35));
  const armed = divergence > 0.0001 && authoritative;
  const barClass = divergence < 0.001 ? "[&>div]:bg-verified" : divergence < 1 ? "[&>div]:bg-repairing" : "[&>div]:bg-violating";
  const trend = events.length >= 2 ? events[0].divergence - events[1].divergence : 0;
  const TrendIcon = Math.abs(trend) < 0.0001 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = Math.abs(trend) < 0.0001 ? "text-muted-foreground" : trend > 0 ? "text-violating" : "text-verified";

  return (
    <GradientBorderCard gradientFrom={divergence < 0.001 ? "oklch(0.78 0.16 160 / 0.35)" : divergence < 1 ? "oklch(0.80 0.15 80 / 0.35)" : "oklch(0.64 0.21 25 / 0.4)"}
      gradientTo="oklch(0.32 0.014 165 / 0.1)" className={cn(armed && "glow-violating")}>
      <GridOverlay />
      <div className="relative flex flex-col items-center gap-1.5 p-3 w-full">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Twin Divergence</div>
        <motion.div className={cn("font-mono text-2xl font-semibold tabular-nums", divColor(divergence))}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>{divergence.toFixed(3)}</motion.div>
        <GaugeNeedle value={pct} max={100} size={100} />
        <Progress value={pct} className={cn("h-1.5 w-full", barClass)} />
        <div className={cn("flex items-center gap-1 text-[10px]", trendColor)}>
          <TrendIcon className="h-3 w-3" /><span className="font-mono">{trend >= 0 ? "+" : ""}{trend.toFixed(4)}</span><span className="text-muted-foreground">trend</span>
        </div>
        <motion.div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          armed ? "border-violating/50 bg-violating/15 text-violating animate-epistemic-pulse" : divergence > 0.0001 ? "border-repairing/40 bg-repairing/10 text-repairing" : "border-verified/40 bg-verified/10 text-verified")}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Power className="h-3 w-3" />{armed ? "TAKEOVER ARMED" : divergence > 0.0001 ? "DRIFT" : "ALIGNED"}
        </motion.div>
        <div className="text-[9px] text-muted-foreground text-center leading-tight font-mono mt-0.5">{divergence < 0.001 ? "live ≡ shadow" : divergence < 1 ? "invariant mismatch" : "authoritative breach"}</div>
      </div>
    </GradientBorderCard>
  );
}

function TwinCard({ side, state, invariants, authoritative }: { side: "live" | "shadow"; state: Record<string, unknown>; invariants: InvariantEval[]; authoritative?: boolean }) {
  const isLive = side === "live";
  const passCount = invariants.filter((iv) => iv.passed).length;
  const failCount = invariants.length - passCount;
  return (
    <GradientBorderCard gradientFrom={isLive ? "oklch(0.78 0.16 160 / 0.3)" : "oklch(0.70 0.13 40 / 0.3)"} gradientTo="oklch(0.32 0.014 165 / 0.1)">
      {!isLive && <div className="bg-grid absolute inset-0 opacity-25 pointer-events-none rounded-lg" />}
      <div className="relative space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive ? <Radio className="h-4 w-4 text-verified" /> : <Moon className="h-4 w-4 text-quarantined" />}
            <span className={cn("text-sm font-semibold uppercase tracking-wide", isLive ? "text-verified" : "text-quarantined")}>{isLive ? "Live Plant" : "Shadow Twin"}</span>
          </div>
          <span className={cn("flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            isLive ? "border-verified/40 bg-verified/10 text-verified" : "border-quarantined/40 bg-quarantined/10 text-quarantined")}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-verified animate-epistemic-pulse" : "bg-quarantined")} />{isLive ? "● LIVE" : "◐ SHADOW"}
          </span>
        </div>
        {authoritative && !isLive && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-md border border-violating/40 bg-violating/10 px-2.5 py-1.5 text-[11px] text-violating">
            <ShieldAlert className="h-3.5 w-3.5" /><span className="font-semibold uppercase tracking-wide">Authoritative</span><span className="opacity-80">— shadow holds control plane</span>
          </motion.div>
        )}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-verified"><CheckCircle2 className="h-3 w-3" />{passCount} pass</span>
          {failCount > 0 && <span className="flex items-center gap-1 text-violating"><XCircle className="h-3 w-3" />{failCount} fail</span>}
          <span className="text-muted-foreground">of {invariants.length} invariants</span>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">State snapshot</div>
          <div className="rounded-md border border-border/60 bg-background/40 p-2"><StateKV state={state} accent={isLive ? "text-foreground" : "text-quarantined/90"} /></div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Invariant evaluations</div>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-0.5">
            {invariants.length === 0 && <div className="text-[11px] text-muted-foreground italic">no invariants</div>}
            {invariants.map((iv) => (
              <motion.div key={iv.name} variants={itemVariants} className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-muted/20 transition-colors">
                <div className="flex min-w-0 items-center gap-2"><span className="font-mono text-[11px] text-foreground truncate">{iv.name}</span><SeverityBadge severity={iv.severity} soft={iv.soft} /></div>
                <span className={cn("flex items-center gap-1 text-xs", iv.passed ? "text-verified" : "text-violating")}>
                  {iv.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}<span className="text-[10px] uppercase">{iv.passed ? "pass" : "fail"}</span>
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </GradientBorderCard>
  );
}

function WhatIfDiff({ whatif }: { whatif: { ok: boolean; evaluations: InvariantEval[]; mmrRoot: string; divergence: number } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="rounded-md border border-border/60 bg-background/40 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Replayed evaluations</span>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono">div {whatif.divergence.toFixed(3)}</span><Separator orientation="vertical" className="h-3 bg-border/60" /><span className="font-mono">mmr {whatif.mmrRoot}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {whatif.evaluations.map((ev) => (
          <motion.div key={ev.name} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            className={cn("flex items-center justify-between gap-2 rounded border px-2 py-1 transition-colors hover:bg-muted/20", ev.passed ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/10")}>
            <div className="flex items-center gap-1.5 min-w-0">{ev.passed ? <CheckCircle2 className="h-3 w-3 text-verified shrink-0" /> : <XCircle className="h-3 w-3 text-violating shrink-0" />}<span className="font-mono text-[11px] text-foreground truncate">{ev.name}</span></div>
            <SeverityBadge severity={ev.severity} soft={ev.soft} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ShadowBridgeSection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [bridge, setBridge] = useState<ShadowBridgeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [deltaText, setDeltaText] = useState(DEFAULT_DELTA);
  const [predicate, setPredicate] = useState("");
  const [whatif, setWhatif] = useState<{ ok: boolean; evaluations: InvariantEval[]; mmrRoot: string; divergence: number } | null>(null);
  const [runningWhatif, setRunningWhatif] = useState(false);

  useEffect(() => {
    let c = false;
    fetch("/api/policies").then((r) => r.json()).then((d: { policies: PolicyRow[] }) => {
      if (c) return; const ps = d.policies ?? []; setPolicies(ps);
      const shadowFirst = ps.find((p) => p.shadowEnabled);
      if (shadowFirst) setPolicyId(shadowFirst.id); else if (ps.length > 0) setPolicyId(ps[0].id);
    }).catch(() => {}); return () => { c = true; };
  }, []);

  const loadBridge = useCallback(async () => {
    if (!policyId) return;
    try { const r = await fetch(`/api/shadow-bridge?policyId=${encodeURIComponent(policyId)}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); const d: { bridges: ShadowBridgeRow[] } = await r.json(); setBridge((d.bridges ?? [])[0] ?? null); }
    catch (e) { toast({ title: "Failed to load shadow bridge", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [policyId, toast]);

  useEffect(() => { if (!policyId) return; setLoading(true); loadBridge(); const t = setInterval(loadBridge, POLL_MS); return () => clearInterval(t); }, [policyId, loadBridge]);

  const doTakeover = useCallback(async () => {
    if (!policyId) return; setTakingOver(true);
    try {
      const r = await fetch("/api/shadow-bridge/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`); const d = await r.json();
      toast({ title: "Shadow takeover initiated", description: d.event?.summary ?? "Shadow bridge assumed authority." }); setTakeoverOpen(false); loadBridge();
    } catch (e) { toast({ title: "Takeover failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setTakingOver(false); }
  }, [policyId, toast, loadBridge]);

  const runWhatif = useCallback(async () => {
    if (!policyId) return; let delta: Record<string, unknown> = {};
    if (deltaText.trim()) { try { delta = JSON.parse(deltaText); } catch (e) { toast({ title: "Invalid state delta JSON", description: e instanceof Error ? e.message : "Parse error", variant: "destructive" }); return; } }
    setRunningWhatif(true);
    try {
      const body: Record<string, unknown> = { policyId, stateDelta: delta }; if (predicate.trim()) body.predicateOverride = predicate.trim();
      const r = await fetch("/api/shadow-bridge/whatif", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`); const d = await r.json();
      setWhatif({ ok: !!d.ok, evaluations: (d.evaluations ?? []).map((e: InvariantEval) => ({ name: e.name, passed: e.passed, severity: e.severity, soft: e.soft, actual: e.actual })), mmrRoot: d.mmrRoot ?? "—", divergence: d.event?.divergence ?? 0 });
      toast({ title: "What-if replay complete", description: `${(d.evaluations ?? []).filter((e: InvariantEval) => !e.passed).length} violation(s) under modified rules` }); loadBridge();
    } catch (e) { toast({ title: "What-if replay failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setRunningWhatif(false); }
  }, [policyId, deltaText, predicate, toast, loadBridge]);

  const invariantUnion = useMemo(() => {
    if (!bridge) return [] as { name: string; live?: InvariantEval; shadow?: InvariantEval }[];
    const map = new Map<string, { name: string; live?: InvariantEval; shadow?: InvariantEval }>();
    for (const iv of bridge.liveInvariants) map.set(iv.name, { name: iv.name, live: iv });
    for (const iv of bridge.shadowInvariants) { const ex = map.get(iv.name); if (ex) ex.shadow = iv; else map.set(iv.name, { name: iv.name, shadow: iv }); }
    return Array.from(map.values());
  }, [bridge]);

  const events = bridge?.events ?? [];
  const selectedPolicy = policies.find((p) => p.id === policyId);
  const shadowEnabled = !!selectedPolicy?.shadowEnabled;
  const takeoverLatency = bridge?.policy.takeoverLatencyMs ?? selectedPolicy?.takeoverLatencyMs ?? null;
  const authoritative = bridge?.policy.authoritative ?? false;
  const divergence = bridge?.divergence ?? 0;

  return (
    <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={cardVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader icon={Cpu} title="Shadow Bridge" subtitle="Digital-twin control plane · live vs shadow invariants · takeover-ready" />
        <div className="flex items-center gap-2 flex-wrap">
          <BridgeStatusIndicator shadowEnabled={shadowEnabled} authoritative={authoritative} divergence={divergence} />
          <Select value={policyId} onValueChange={setPolicyId}>
            <SelectTrigger className="w-[220px] sm:w-[260px] bg-card/60"><SelectValue placeholder="Select policy" /></SelectTrigger>
            <SelectContent>{policies.map((p) => <SelectItem key={p.id} value={p.id}><span className="flex items-center gap-2">{p.name}{p.shadowEnabled && <span className="text-[10px] text-quarantined">●shadow</span>}</span></SelectItem>)}</SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("border-border/60 transition-colors hover:border-quarantined/40", shadowEnabled ? "text-quarantined border-quarantined/40 bg-quarantined/10" : "text-muted-foreground")}><Moon className="h-3 w-3" />{shadowEnabled ? "shadow enabled" : "shadow disabled"}</Badge>
        <Badge variant="outline" className={cn("border-border/60 transition-colors hover:border-violating/40", authoritative ? "text-violating border-violating/40 bg-violating/10" : "text-muted-foreground")}><ShieldAlert className="h-3 w-3" />{authoritative ? "authoritative" : "non-authoritative"}</Badge>
        <Badge variant="outline" className="border-border/60 text-muted-foreground"><Gauge className="h-3 w-3" />takeover {takeoverLatency ?? "—"}ms</Badge>
        <Badge variant="outline" className="border-border/60 text-muted-foreground"><Activity className="h-3 w-3" />{events.length} event{events.length === 1 ? "" : "s"}</Badge>
      </motion.div>

      {!shadowEnabled && (
        <motion.div variants={cardVariants}><Card className="bg-repairing/5 border-repairing/30 p-3 text-xs text-repairing flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /><span>Selected policy does not have a shadow bridge enabled. Pick a shadow-enabled policy for full functionality.</span></Card></motion.div>
      )}

      <motion.div variants={cardVariants}>
        <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold text-foreground">Drift Monitoring</span></div><Badge variant="outline" className="border-repairing/30 bg-repairing/10 text-repairing text-[10px]">live</Badge></div>
            <DriftSparkline events={events} />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground"><span className="font-mono">last 20 events</span><span className="font-mono">divergence over time</span></div>
          </div>
        </GradientBorderCard>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr]"><Skeleton className="h-80 w-full rounded-lg bg-muted/40" /><Skeleton className="h-80 w-32 rounded-lg bg-muted/40" /><Skeleton className="h-80 w-full rounded-lg bg-muted/40" /></div>
      ) : !bridge ? (
        <motion.div variants={cardVariants}><Card className="bg-card/60 border-border/60 p-8 text-center"><Moon className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No shadow bridge data for this policy.</p></Card></motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_1fr] md:items-stretch">
          <motion.div variants={cardVariants}><TwinCard side="live" state={bridge.liveState} invariants={bridge.liveInvariants} /></motion.div>
          <motion.div variants={cardVariants} className="flex md:flex-col gap-3">
            <DivergenceMeter divergence={bridge.divergence} authoritative={authoritative} events={events} />
            <Card className="bg-card/40 border-border/60 p-2.5 relative overflow-hidden flex-1">
              <GridOverlay />
              <div className="relative">
                <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">L vs S matrix</div>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-0.5">
                  {invariantUnion.length === 0 && <div className="text-[11px] text-muted-foreground italic">no invariants</div>}
                  {invariantUnion.map((row) => <InvariantRow key={row.name} live={row.live} shadow={row.shadow} />)}
                </motion.div>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}><TwinCard side="shadow" state={bridge.shadowState} invariants={bridge.shadowInvariants} authoritative={authoritative} /></motion.div>
        </div>
      )}

      <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <motion.div variants={cardVariants}>
          <GradientBorderCard gradientFrom="oklch(0.64 0.21 25 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
            <GridOverlay />
            <div className="relative space-y-3 p-4">
              <div className="flex items-center gap-2"><Power className="h-4 w-4 text-violating" /><span className="text-sm font-semibold text-foreground">Authority transfer</span></div>
              <p className="text-[11px] text-muted-foreground">Promote shadow twin to authoritative control within <span className="font-mono text-foreground">{takeoverLatency ?? "—"}ms</span>.</p>
              <div className="flex items-center gap-3">
                <div className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold", authoritative ? "border-violating/40 bg-violating/10 text-violating" : "border-verified/40 bg-verified/10 text-verified")}>
                  <span className={cn("relative flex h-2 w-2", authoritative && "animate-epistemic-pulse")}><span className={cn("inline-flex h-2 w-2 rounded-full", authoritative ? "bg-violating" : "bg-verified")} /></span>
                  {authoritative ? "SHADOW IN CONTROL" : "LIVE IN CONTROL"}
                </div>
                <AnimatePresence mode="wait">{authoritative && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1 text-[10px] text-violating font-mono"><Eye className="h-3 w-3" />monitoring</motion.div>}</AnimatePresence>
              </div>
              <Dialog open={takeoverOpen} onOpenChange={setTakeoverOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full border-violating/40 bg-violating/10 text-violating hover:bg-violating/20 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={!shadowEnabled}><ShieldAlert className="h-4 w-4" />Initiate takeover</Button></DialogTrigger>
                <DialogContent className="bg-card border-border/60"><DialogHeader><DialogTitle className="flex items-center gap-2 text-foreground"><ShieldAlert className="h-4 w-4 text-violating" />Confirm shadow takeover</DialogTitle><DialogDescription className="text-muted-foreground">Shadow bridge will assume authority for <span className="font-mono text-foreground">{bridge?.policy.name ?? "this policy"}</span>. Continue?</DialogDescription></DialogHeader>
                  <DialogFooter><DialogClose asChild><Button variant="outline" className="border-border/60">Cancel</Button></DialogClose><Button onClick={doTakeover} disabled={takingOver} className="bg-violating/15 border border-violating/40 text-violating hover:bg-violating/25 transition-all" variant="outline">{takingOver ? <RotateCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}{takingOver ? "Transferring…" : "Assume authority"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </GradientBorderCard>
        </motion.div>

        <motion.div variants={cardVariants} className="lg:col-span-2">
          <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
            <GridOverlay />
            <div className="relative space-y-3 p-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold text-foreground">What-if replay</span></div><Badge variant="outline" className="border-repairing/30 bg-repairing/10 text-repairing text-[10px]">branch · replay</Badge></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><label className="text-[11px] uppercase tracking-wide text-muted-foreground">State delta (JSON)</label><Textarea value={deltaText} onChange={(e) => setDeltaText(e.target.value)} className="font-mono text-xs bg-background/60 min-h-[88px] epistemic-scroll" spellCheck={false} /></div>
                <div className="space-y-1.5"><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Predicate override (optional)</label><Input value={predicate} onChange={(e) => setPredicate(e.target.value)} placeholder="e.g. frequency in [49.5, 50.5]" className="font-mono text-xs bg-background/60" /><p className="text-[10px] text-muted-foreground">Rewrites an invariant predicate for this replay only.</p>
                  <Button onClick={runWhatif} disabled={runningWhatif || !shadowEnabled} variant="outline" className="w-full border-repairing/40 bg-repairing/10 text-repairing hover:bg-repairing/20 transition-all hover:scale-[1.01] active:scale-[0.99]">{runningWhatif ? <RotateCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{runningWhatif ? "Replaying…" : "Run what-if"}</Button>
                </div>
              </div>
              <AnimatePresence>{whatif && <WhatIfDiff whatif={whatif} />}</AnimatePresence>
            </div>
          </GradientBorderCard>
        </motion.div>
      </motion.div>

      <motion.div variants={cardVariants}>
        <GradientBorderCard gradientFrom="oklch(0.70 0.13 40 / 0.25)" gradientTo="oklch(0.32 0.014 165 / 0.1)">
          <GridOverlay />
          <div className="relative p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-quarantined" /><span className="text-sm font-semibold text-foreground">Event timeline</span><Badge variant="outline" className="border-border/60 text-[10px]">{events.length}</Badge></div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                {(["takeover", "whatif", "replay", "divergence", "handback"] as ShadowKind[]).map((k) => { const m = KIND_META[k]; const Icon = m.icon; return <span key={k} className="flex items-center gap-1"><Icon className={cn("h-2.5 w-2.5", m.text)} />{m.label}</span>; })}
              </div>
            </div>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center"><Clock className="h-6 w-6 text-muted-foreground/50" /><p className="mt-2 text-xs text-muted-foreground">No shadow events recorded.</p></div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-h-80 overflow-y-auto epistemic-scroll space-y-2 pr-1">{events.map((ev) => <EventTimelineItem key={ev.id} ev={ev} />)}</motion.div>
            )}
          </div>
        </GradientBorderCard>
      </motion.div>
    </motion.section>
  );
}
