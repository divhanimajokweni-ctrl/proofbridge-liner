"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Shield, Activity, TrendingUp, TrendingDown, Minus, CheckCircle2,
  AlertTriangle, XCircle, Clock, Cpu, KeyRound, GitBranch,
  Zap, BarChart3, Target, Layers, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownRight, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SparkLine, DonutChart, MetricGauge } from "./chart-primitives";
import type { TrustRuntimeState } from "@/lib/dashboard/types";

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };

/* ─── Helpers ─── */
function fmtTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

/* ─── Card Shell ─── */
function Shell({ children, accent, className }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm border-border/60 p-4 relative overflow-hidden ${className ?? ""}`}>
      {accent && <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: accent }} />}
      <div className="bg-grid-fine absolute inset-0 opacity-15" />
      <div className="relative">{children}</div>
    </Card>
  );
}

/* ─── Section Header ─── */
function H3({ icon: Icon, title, extra }: { icon: typeof Activity; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
        <Icon className="h-3.5 w-3.5 text-verified" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {extra}
    </div>
  );
}

/* ─── Confidence Bar ─── */
function ConfidenceBar({ confidence, label, color, explanation }: {
  confidence: number; label: string; color: string; explanation: string;
}) {
  const pct = Math.round(confidence * 100);
  const labelConfig: Record<string, { bg: string; border: string; text: string; icon: typeof Shield }> = {
    SAFE: { bg: "bg-verified/10", border: "border-verified/30", text: "text-verified", icon: CheckCircle2 },
    WARNING: { bg: "bg-repairing/10", border: "border-repairing/30", text: "text-repairing", icon: AlertTriangle },
    TRIP: { bg: "bg-violating/10", border: "border-violating/30", text: "text-violating", icon: XCircle },
  };
  const cfg = labelConfig[label] ?? labelConfig.WARNING;
  const Icon = cfg.icon;
  return (
    <Shell accent={`linear-gradient(to right, ${color}00, ${color}80, ${color}00)`}>
      <H3 icon={Shield} title="Trust Confidence" extra={
        <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <Icon className="h-3 w-3" />{label}
        </span>
      } />
      <div className="space-y-3">
        {/* Big confidence number */}
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold font-mono tabular-nums" style={{ color }}>{pct}</div>
          <div className="text-sm text-muted-foreground mb-1">/ 100</div>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>live</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}40, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {/* Threshold markers */}
          <div className="absolute top-0 bottom-0 w-px bg-repairing/50" style={{ left: "50%" }} title="WARNING threshold (50%)" />
          <div className="absolute top-0 bottom-0 w-px bg-violating/50" style={{ left: "80%" }} title="SAFE threshold (80%)" />
        </div>
        {/* Scale labels */}
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
          <span>TRIP</span>
          <span>WARNING</span>
          <span>SAFE</span>
        </div>
        {/* Explanation */}
        <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
      </div>
    </Shell>
  );
}

/* ─── Evidence Panel ─── */
function EvidencePanel({ currentValue, history, threshold, status }: {
  currentValue: number; history: Array<{ timestamp: string; value: number }>;
  threshold: number; status: string;
}) {
  const statusConfig: Record<string, { bg: string; text: string; icon: typeof Activity }> = {
    normal: { bg: "bg-verified/10", text: "text-verified", icon: CheckCircle2 },
    elevated: { bg: "bg-repairing/10", text: "text-repairing", icon: AlertTriangle },
    critical: { bg: "bg-violating/10", text: "text-violating", icon: XCircle },
  };
  const cfg = statusConfig[status] ?? statusConfig.normal;
  const Icon = cfg.icon;
  const sparkData = history.slice(0, 20).map(h => h.value).reverse();
  const maxVal = Math.max(...sparkData, threshold) * 1.2;

  return (
    <Shell accent={status === "normal" ? "oklch(0.78 0.16 160 / 0.6)" : status === "elevated" ? "oklch(0.75 0.15 80 / 0.6)" : "oklch(0.65 0.22 25 / 0.6)"}>
      <H3 icon={Activity} title="Evidence Panel" extra={
        <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
          <Icon className="h-3 w-3" />{status.toUpperCase()}
        </span>
      } />
      <div className="space-y-3">
        {/* Current value */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums">{currentValue.toFixed(3)}</span>
          <span className="text-xs text-muted-foreground">current divergence</span>
        </div>
        {/* Sparkline of divergence history */}
        <div className="relative">
          <SparkLine data={sparkData} width={280} height={48} fill />
          {/* Threshold line overlay */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-repairing/50"
            style={{ bottom: `${Math.max(0, Math.min(100, (1 - threshold / maxVal) * 100))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
          <span>threshold: {threshold.toFixed(3)}</span>
          <span>{history.length} observations</span>
        </div>
      </div>
    </Shell>
  );
}

/* ─── Likelihood Panel ─── */
function LikelihoodPanel({ prior, likelihood, posterior, delta, components }: {
  prior: number; likelihood: number; posterior: number; delta: number;
  components: Array<{ name: string; value: number }>;
}) {
  const deltaPositive = delta >= 0;
  return (
    <Shell accent="oklch(0.75 0.15 80 / 0.5)">
      <H3 icon={Target} title="Bayesian Likelihood" />
      <div className="space-y-4">
        {/* Three key metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border/40 bg-background/40 px-2 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Prior</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-muted-foreground">{fmtPct(prior)}</div>
          </div>
          <div className="rounded-md border border-border/40 bg-background/40 px-2 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Likelihood</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-repairing">{fmtPct(likelihood)}</div>
          </div>
          <div className="rounded-md border border-verified/30 bg-verified/5 px-2 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wide text-verified">Posterior</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-verified">{fmtPct(posterior)}</div>
          </div>
        </div>
        {/* Delta indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Belief shift:</span>
          <span className={`inline-flex items-center gap-1 font-mono font-semibold ${deltaPositive ? "text-verified" : "text-violating"}`}>
            {deltaPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {deltaPositive ? "+" : ""}{fmtPct(delta)}
          </span>
        </div>
        {/* Component bars */}
        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.name} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-mono tabular-nums">{fmtPct(c.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-verified/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, c.value * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ─── Historical Delta ─── */
function HistoricalDeltaPanel({ recentChanges, trend, summary }: {
  recentChanges: Array<{ timestamp: string; delta: number; type: string }>;
  trend: string; summary: string;
}) {
  const trendConfig: Record<string, { icon: typeof TrendingUp; text: string; color: string }> = {
    up: { icon: TrendingUp, text: "Improving", color: "text-verified" },
    down: { icon: TrendingDown, text: "Degrading", color: "text-violating" },
    stable: { icon: Minus, text: "Stable", color: "text-muted-foreground" },
  };
  const cfg = trendConfig[trend] ?? trendConfig.stable;
  const Icon = cfg.icon;

  return (
    <Shell>
      <H3 icon={GitBranch} title="Historical Δ" extra={
        <span className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
          <Icon className="h-3.5 w-3.5" />{cfg.text}
        </span>
      } />
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {recentChanges.slice(0, 12).map((change, i) => {
          const positive = change.delta >= 0;
          return (
            <motion.div
              key={i}
              variants={itemV}
              className="flex items-center gap-2 rounded-md border border-border/30 bg-background/30 px-2.5 py-1.5 text-xs"
            >
              <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full ${positive ? "bg-verified/10 text-verified" : "bg-violating/10 text-violating"}`}>
                {positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              </span>
              <span className="font-mono text-muted-foreground shrink-0">{fmtTime(change.timestamp)}</span>
              <span className={`font-mono font-semibold shrink-0 ${positive ? "text-verified" : "text-violating"}`}>
                {positive ? "+" : ""}{change.delta.toFixed(3)}
              </span>
              <span className="text-muted-foreground truncate text-[10px]">{change.type}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">{summary}</p>
    </Shell>
  );
}

/* ─── Posterior Distribution Curve (SVG) ─── */
function PosteriorCurve({ data }: { data: Array<{ x: number; y: number }> }) {
  if (data.length < 2) return null;
  const width = 280, height = 60, pad = 4;
  const maxY = Math.max(...data.map(d => d.y), 0.001);
  const pts = data.map(d => ({
    x: pad + d.x * (width - pad * 2),
    y: pad + (1 - d.y / maxY) * (height - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)!.x.toFixed(1)},${height - pad} L${pts[0].x.toFixed(1)},${height - pad} Z`;

  return (
    <div className="space-y-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" role="img" aria-label="Posterior distribution curve">
        <path d={area} fill="oklch(0.78 0.16 160 / 0.1)" />
        <path d={line} fill="none" stroke="oklch(0.78 0.16 160 / 0.8)" strokeWidth={1.5} strokeLinecap="round" />
        {/* Peak marker */}
        {pts.length > 0 && (() => {
          const peak = pts.reduce((a, b) => b.y < a.y ? b : a);
          return <circle cx={peak.x} cy={peak.y} r={3} fill="oklch(0.78 0.16 160)" />;
        })()}
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
        <span>0.0</span>
        <span>Posterior Distribution</span>
        <span>1.0</span>
      </div>
    </div>
  );
}

/* ─── Circuit Status ─── */
function CircuitStatuses({ circuits }: { circuits: Array<{ id: string; name: string; status: string; constraints: number; lastVerified: string }> }) {
  const statusCfg: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
    active: { bg: "bg-verified/10", text: "text-verified", border: "border-verified/20", icon: CheckCircle2 },
    pending: { bg: "bg-repairing/10", text: "text-repairing", border: "border-repairing/20", icon: Clock },
    failed: { bg: "bg-violating/10", text: "text-violating", border: "border-violating/20", icon: XCircle },
  };
  return (
    <Shell>
      <H3 icon={Cpu} title="Circuit Statuses" />
      <div className="space-y-2">
        {circuits.map((c) => {
          const cfg = statusCfg[c.status] ?? statusCfg.pending;
          const Icon = cfg.icon;
          return (
            <div key={c.id} className={`flex items-center gap-2 rounded-md border ${cfg.border} ${cfg.bg} px-2.5 py-2`}>
              <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">{c.name}</span>
                  <span className={`text-[9px] font-mono uppercase ${cfg.text}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>{c.constraints} constraints</span>
                  <span className="text-border/50">·</span>
                  <span>verified {fmtTime(c.lastVerified)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── Verification Gates ─── */
function VerificationGates({ gates }: { gates: Array<{ name: string; wave: number; status: string; timestamp: string }> }) {
  const statusCfg: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    passed: { bg: "bg-verified/10", text: "text-verified", icon: CheckCircle2 },
    pending: { bg: "bg-repairing/10", text: "text-repairing", icon: Clock },
    failed: { bg: "bg-violating/10", text: "text-violating", icon: XCircle },
  };
  return (
    <Shell>
      <H3 icon={Layers} title="Verification Gates" extra={
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{gates.filter(g => g.status === "passed").length}/{gates.length} passed</span>
      } />
      <div className="space-y-1.5">
        {gates.map((g) => {
          const cfg = statusCfg[g.status] ?? statusCfg.pending;
          const Icon = cfg.icon;
          return (
            <div key={g.name} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-border/40 bg-muted/30 text-[9px] font-mono text-muted-foreground">
                W{g.wave}
              </span>
              <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
              <span className="flex-1 truncate">{g.name}</span>
              <span className={`text-[10px] font-mono ${cfg.text}`}>{g.status}</span>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── Runtime Health Gauge ─── */
function RuntimeHealthGauge({ health }: { health: number }) {
  const pct = Math.round(health * 100);
  const color = health >= 0.7 ? "var(--verified)" : health >= 0.4 ? "var(--repairing)" : "var(--violating)";
  return (
    <div className="flex flex-col items-center gap-1">
      <MetricGauge value={pct} max={100} size={64} color={color} label="Health" />
      <span className="text-[9px] font-mono text-muted-foreground">{pct}% runtime health</span>
    </div>
  );
}

/* ─── Main Section Component ─── */
export function TrustRuntimeSection() {
  const [state, setState] = useState<TrustRuntimeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/trust-runtime");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TrustRuntimeState = await res.json();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      setCountdown(c => (c <= 1 ? 10 : c - 1));
      if (countdown <= 1) fetchData();
    }, 1000);
    return () => clearInterval(t);
  }, [autoRefresh, countdown, fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-verified/10 border border-verified/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-verified/60" />
          </div>
          <div className="absolute inset-0 rounded-lg animate-ping bg-verified/10 opacity-30" />
        </div>
        <span className="text-sm text-muted-foreground">Loading Trust Runtime…</span>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="h-8 w-8 text-violating" />
        <span className="text-sm text-violating">{error ?? "Failed to load Trust Runtime data"}</span>
        <button onClick={fetchData} className="text-xs text-muted-foreground hover:text-foreground underline">Retry</button>
      </div>
    );
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="space-y-4">
      {/* Top row: Confidence + Runtime Health + Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardV} className="lg:col-span-2">
          <ConfidenceBar
            confidence={state.confidence.confidence}
            label={state.confidence.label}
            color={state.confidence.color}
            explanation={state.confidence.explanation}
          />
        </motion.div>
        <motion.div variants={cardV}>
          <Shell>
            <H3 icon={Zap} title="Runtime Meta" />
            <div className="flex items-center justify-center py-2">
              <RuntimeHealthGauge health={state.runtimeHealth} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Epoch</div>
                <div className="font-mono text-xs font-semibold truncate">{state.epochId}</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Genesis</div>
                <div className="font-mono text-xs font-semibold truncate">{state.genesisId}</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Proof Chain</div>
                <div className="font-mono text-xs font-semibold">{state.proofChainLength} blocks</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Updated</div>
                <div className="font-mono text-xs font-semibold">{fmtTime(state.timestamp)}</div>
              </div>
            </div>
            {/* Auto-refresh control */}
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
                Auto-refresh: {autoRefresh ? "ON" : "OFF"}
              </button>
              {autoRefresh && (
                <span className="text-[10px] font-mono text-muted-foreground">{countdown}s</span>
              )}
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* Second row: Evidence + Likelihood + Posterior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardV}>
          <EvidencePanel
            currentValue={state.evidence.currentValue}
            history={state.evidence.history}
            threshold={state.evidence.threshold}
            status={state.evidence.status}
          />
        </motion.div>
        <motion.div variants={cardV}>
          <LikelihoodPanel
            prior={state.likelihood.prior}
            likelihood={state.likelihood.likelihood}
            posterior={state.likelihood.posterior}
            delta={state.likelihood.delta}
            components={state.likelihood.components}
          />
        </motion.div>
        <motion.div variants={cardV}>
          <Shell>
            <H3 icon={BarChart3} title="Posterior Distribution" />
            <div className="flex items-center justify-center py-3">
              <PosteriorCurve data={state.posteriorDistribution} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-center">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Mean</div>
                <div className="font-mono text-xs font-semibold">{state.likelihood.posterior.toFixed(3)}</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-center">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Prior</div>
                <div className="font-mono text-xs font-semibold">{state.likelihood.prior.toFixed(3)}</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-center">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Δ shift</div>
                <div className={`font-mono text-xs font-semibold ${state.likelihood.delta >= 0 ? "text-verified" : "text-violating"}`}>
                  {state.likelihood.delta >= 0 ? "+" : ""}{state.likelihood.delta.toFixed(3)}
                </div>
              </div>
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* Third row: Circuit Status + Verification Gates + Historical Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardV}>
          <CircuitStatuses circuits={state.circuitStatuses} />
        </motion.div>
        <motion.div variants={cardV}>
          <VerificationGates gates={state.verificationGates} />
        </motion.div>
        <motion.div variants={cardV}>
          <HistoricalDeltaPanel
            recentChanges={state.historicalDelta.recentChanges}
            trend={state.historicalDelta.trend}
            summary={state.historicalDelta.summary}
          />
        </motion.div>
      </div>

      {/* Detailed view toggle */}
      <motion.div variants={cardV}>
        <Shell>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showDetails ? "Hide" : "Show"} raw trust state
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <pre className="mt-3 rounded-md border border-border/40 bg-background/60 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-80 scrollbar-thin">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </Shell>
      </motion.div>
    </motion.div>
  );
}
