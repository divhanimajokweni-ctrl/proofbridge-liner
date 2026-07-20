"use client";

import { useMemo, useState } from "react";
import {
  GitCompare, ArrowUpRight, ArrowDownRight, Minus, Check, X,
  Download, ShieldCheck, Activity, Layers, Lock, AlertTriangle,
  GitBranch, Clock, Gauge,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants, StatusPill, GridOverlay, TopAccentBar, CHART_TOOLTIP_STYLE } from "./primitives";

type EnforcementMode = "strict" | "moderate" | "permissive";

interface ComparisonPolicy {
  id: string; name: string; domain: string; invariantCount: number; shardCount: number;
  healthScore: number; mergeSuccessRate: number; shadowEnabled: boolean;
  activeViolations: number; violationSeverities: string[]; avgDivergence: number;
  divergenceTrend: "up" | "down" | "flat"; zkProofs: number; lastModified: string;
  enforcementMode: EnforcementMode; version: string;
}

const H = 3600000, D = 86400000;
const ALL_POLICIES: ComparisonPolicy[] = [
  { id: "pol-a7f3", name: "Payment Gateway v3", domain: "finance", invariantCount: 24, shardCount: 8, healthScore: 96, mergeSuccessRate: 98.2, shadowEnabled: true, activeViolations: 0, violationSeverities: [], avgDivergence: 0.002, divergenceTrend: "down", zkProofs: 18, lastModified: new Date(Date.now() - 2 * H).toISOString(), enforcementMode: "strict", version: "3.2.1" },
  { id: "pol-b2e1", name: "User Auth Policy", domain: "identity", invariantCount: 16, shardCount: 5, healthScore: 91, mergeSuccessRate: 94.7, shadowEnabled: true, activeViolations: 1, violationSeverities: ["medium"], avgDivergence: 0.018, divergenceTrend: "flat", zkProofs: 12, lastModified: new Date(Date.now() - 6 * H).toISOString(), enforcementMode: "strict", version: "2.1.0" },
  { id: "pol-c9d4", name: "Inventory Tracker", domain: "supply-chain", invariantCount: 10, shardCount: 12, healthScore: 73, mergeSuccessRate: 82.3, shadowEnabled: false, activeViolations: 4, violationSeverities: ["high", "medium", "low", "low"], avgDivergence: 0.142, divergenceTrend: "up", zkProofs: 3, lastModified: new Date(Date.now() - 1 * D).toISOString(), enforcementMode: "moderate", version: "1.4.3" },
  { id: "pol-d5a8", name: "Event Sourcing Core", domain: "infrastructure", invariantCount: 31, shardCount: 6, healthScore: 88, mergeSuccessRate: 91.5, shadowEnabled: true, activeViolations: 2, violationSeverities: ["medium", "low"], avgDivergence: 0.034, divergenceTrend: "down", zkProofs: 22, lastModified: new Date(Date.now() - 45 * 60000).toISOString(), enforcementMode: "strict", version: "4.0.0" },
  { id: "pol-e1f6", name: "Rate Limiter", domain: "platform", invariantCount: 7, shardCount: 3, healthScore: 54, mergeSuccessRate: 68.9, shadowEnabled: false, activeViolations: 6, violationSeverities: ["critical", "high", "high", "medium", "low", "low"], avgDivergence: 0.891, divergenceTrend: "up", zkProofs: 0, lastModified: new Date(Date.now() - 3 * D).toISOString(), enforcementMode: "permissive", version: "0.9.2" },
  { id: "pol-f8c2", name: "Data Pipeline Guard", domain: "data", invariantCount: 19, shardCount: 9, healthScore: 82, mergeSuccessRate: 87.1, shadowEnabled: true, activeViolations: 2, violationSeverities: ["medium", "low"], avgDivergence: 0.067, divergenceTrend: "flat", zkProofs: 9, lastModified: new Date(Date.now() - 12 * H).toISOString(), enforcementMode: "moderate", version: "2.3.0" },
  { id: "pol-g3b7", name: "Compliance Monitor", domain: "regulatory", invariantCount: 42, shardCount: 4, healthScore: 99, mergeSuccessRate: 99.8, shadowEnabled: true, activeViolations: 0, violationSeverities: [], avgDivergence: 0.001, divergenceTrend: "flat", zkProofs: 38, lastModified: new Date(Date.now() - 30 * 60000).toISOString(), enforcementMode: "strict", version: "5.1.0" },
  { id: "pol-h6e9", name: "ML Feature Store", domain: "ml-ops", invariantCount: 13, shardCount: 7, healthScore: 65, mergeSuccessRate: 76.4, shadowEnabled: false, activeViolations: 3, violationSeverities: ["high", "medium", "medium"], avgDivergence: 0.312, divergenceTrend: "up", zkProofs: 2, lastModified: new Date(Date.now() - 2 * D).toISOString(), enforcementMode: "permissive", version: "1.0.5" },
];

const MAX_SELECT = 4;
const RADAR_COLORS = ["oklch(0.78 0.16 160)", "oklch(0.74 0.13 190)", "oklch(0.80 0.15 80)", "oklch(0.68 0.16 320)"];

function fmtRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

interface Dim { key: keyof ComparisonPolicy; label: string; icon: React.ComponentType<{ className?: string }>; fmt: (v: unknown, p: ComparisonPolicy) => React.ReactNode; cmp: (v: unknown[]) => [number, number]; hi: boolean }

const numCmp = (v: unknown[], hi: boolean) => { const n = v as number[]; return hi ? [n.indexOf(Math.max(...n)), n.indexOf(Math.min(...n))] : [n.indexOf(Math.min(...n)), n.indexOf(Math.max(...n))]; };
const hc = (v: number) => v >= 85 ? "text-verified" : v >= 60 ? "text-repairing" : "text-violating";

const DIMS: Dim[] = [
  { key: "invariantCount", label: "Invariant Count", icon: ShieldCheck, fmt: (v) => <span className="font-mono text-sm">{v as number}</span>, cmp: (v) => numCmp(v, true), hi: true },
  { key: "shardCount", label: "Shard Count", icon: Layers, fmt: (v) => <span className="font-mono text-sm">{v as number}</span>, cmp: (v) => numCmp(v, true), hi: true },
  { key: "healthScore", label: "Health Score", icon: Activity, fmt: (v) => <span className={cn("font-mono text-sm font-semibold", hc(v as number))}>{v}%</span>, cmp: (v) => numCmp(v, true), hi: true },
  { key: "mergeSuccessRate", label: "Merge Rate", icon: GitBranch, fmt: (v) => { const n = v as number; return <span className={cn("font-mono text-sm", n >= 90 ? "text-verified" : n >= 75 ? "text-repairing" : "text-violating")}>{n.toFixed(1)}%</span>; }, cmp: (v) => numCmp(v, true), hi: true },
  { key: "shadowEnabled", label: "Shadow", icon: Gauge, fmt: (v) => v ? <StatusPill status="verified" label="Yes" className="text-[10px] px-2 py-0" /> : <StatusPill status="idle" label="No" className="text-[10px] px-2 py-0" />, cmp: (v) => { const b = v as boolean[]; return [b.indexOf(true) ?? 0, b.indexOf(false) ?? 0]; }, hi: true },
  { key: "activeViolations", label: "Violations", icon: AlertTriangle, fmt: (v, p) => <span className={cn("font-mono text-sm", (v as number) === 0 ? "text-verified" : p.violationSeverities.includes("critical") ? "text-violating" : "text-repairing")}>{v as number}</span>, cmp: (v) => numCmp(v, false), hi: false },
  { key: "avgDivergence", label: "Avg Divergence", icon: Activity, fmt: (v, p) => { const n = v as number; const T = p.divergenceTrend === "up" ? ArrowUpRight : p.divergenceTrend === "down" ? ArrowDownRight : Minus; return <span className="inline-flex items-center gap-1"><span className={cn("font-mono text-sm", n < 0.01 ? "text-verified" : n < 0.1 ? "text-repairing" : "text-violating")}>{n.toFixed(3)}</span><T className={cn("h-3 w-3", p.divergenceTrend === "down" ? "text-verified" : p.divergenceTrend === "up" ? "text-violating" : "text-muted-foreground")} /></span>; }, cmp: (v) => numCmp(v, false), hi: false },
  { key: "zkProofs", label: "ZK Proofs", icon: Lock, fmt: (v) => <span className="font-mono text-sm">{v as number}</span>, cmp: (v) => numCmp(v, true), hi: true },
  { key: "lastModified", label: "Last Modified", icon: Clock, fmt: (v) => <span className="font-mono text-xs text-muted-foreground">{fmtRel(v as string)}</span>, cmp: (v) => { const t = (v as string[]).map(s => new Date(s).getTime()); return [t.indexOf(Math.max(...t)), t.indexOf(Math.min(...t))]; }, hi: true },
  { key: "enforcementMode", label: "Enforcement", icon: ShieldCheck, fmt: (v) => { const c: Record<EnforcementMode, string> = { strict: "border-verified/30 bg-verified/10 text-verified", moderate: "border-repairing/30 bg-repairing/10 text-repairing", permissive: "border-violating/30 bg-violating/10 text-violating" }; return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", c[v as EnforcementMode])}>{(v as string).charAt(0).toUpperCase() + (v as string).slice(1)}</span>; }, cmp: (v) => { const o: EnforcementMode[] = ["strict", "moderate", "permissive"]; const r = (v as EnforcementMode[]).map(x => o.indexOf(x)); return [r.indexOf(Math.min(...r)), r.indexOf(Math.max(...r))]; }, hi: true },
];

function buildRadarData(policies: ComparisonPolicy[]) {
  if (!policies.length) return [];
  const maxInv = Math.max(...ALL_POLICIES.map(p => p.invariantCount));
  const maxZk = Math.max(...ALL_POLICIES.map(p => p.zkProofs));
  return [
    { axis: "Health", key: "healthScore" as const, max: 100 },
    { axis: "Merge Rate", key: "mergeSuccessRate" as const, max: 100 },
    { axis: "Invariant Cov.", key: "invariantCount" as const, max: maxInv },
    { axis: "ZK Coverage", key: "zkProofs" as const, max: maxZk },
    { axis: "Violation-Free", key: "violationFree" as const, max: 100 },
  ].map(({ axis, key, max }) => {
    const entry: Record<string, string | number> = { axis };
    for (const p of policies) entry[p.name] = Math.round(((key === "violationFree" ? Math.max(0, 100 - p.activeViolations * 15) : p[key] as number) / max) * 100);
    return entry;
  });
}

function generateDiffSummary(policies: ComparisonPolicy[]): string[] {
  if (policies.length < 2) return [];
  const s: string[] = [];
  const best = policies.reduce((a, b) => a.healthScore > b.healthScore ? a : b);
  const worst = policies.reduce((a, b) => a.healthScore < b.healthScore ? a : b);
  if (best.id !== worst.id) s.push(`${best.name} leads in health at ${best.healthScore}%, while ${worst.name} trails at ${worst.healthScore}% — a ${best.healthScore - worst.healthScore} point gap.`);
  const strict = policies.filter(p => p.enforcementMode === "strict");
  const permissive = policies.filter(p => p.enforcementMode === "permissive");
  if (strict.length && permissive.length) s.push(`Enforcement differs: ${strict.map(p => p.name).join(", ")} run strict, while ${permissive.map(p => p.name).join(", ")} are permissive.`);
  const shadowOn = policies.filter(p => p.shadowEnabled);
  const shadowOff = policies.filter(p => !p.shadowEnabled);
  if (shadowOn.length && shadowOff.length) s.push(`${shadowOn.length}/${policies.length} policies have shadow bridges (${shadowOn.map(p => p.name).join(", ")}), ${shadowOff.map(p => p.name).join(", ")} do not.`);
  const hiV = policies.filter(p => p.activeViolations >= 3);
  if (hiV.length) s.push(`${hiV.map(p => p.name).join(", ")} ${hiV.length === 1 ? "has" : "have"} elevated violations (≥3).`);
  const bestM = policies.reduce((a, b) => a.mergeSuccessRate > b.mergeSuccessRate ? a : b);
  const worstM = policies.reduce((a, b) => a.mergeSuccessRate < b.mergeSuccessRate ? a : b);
  if (bestM.id !== worstM.id) s.push(`Merge rates span ${worstM.mergeSuccessRate.toFixed(1)}% (${worstM.name}) to ${bestM.mergeSuccessRate.toFixed(1)}% (${bestM.name}).`);
  return s;
}

export function ComparisonMatrixSection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([ALL_POLICIES[0].id, ALL_POLICIES[1].id, ALL_POLICIES[3].id]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectedPolicies = useMemo(() => ALL_POLICIES.filter(p => selectedIds.includes(p.id)), [selectedIds]);
  const radarData = useMemo(() => buildRadarData(selectedPolicies), [selectedPolicies]);
  const diffSummary = useMemo(() => generateDiffSummary(selectedPolicies), [selectedPolicies]);
  const togglePolicy = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= MAX_SELECT ? prev : [...prev, id]);

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.4)" gradientTo="oklch(0.74 0.13 190 / 0.2)" className="p-4">
        <GridOverlay />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0"><GitCompare className="h-5 w-5 text-verified" /></div>
          <div className="min-w-0 flex-1"><h2 className="text-base font-semibold flex items-center gap-2">Comparison Matrix<Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">{selectedPolicies.length}/{MAX_SELECT}</Badge></h2><p className="text-xs text-muted-foreground mt-0.5">Side-by-side multi-policy comparison — identify gaps and drift.</p></div>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" className="h-8" onClick={() => setSelectorOpen(!selectorOpen)}><GitCompare className="h-3.5 w-3.5 mr-1.5" />Select Policies</Button><Button size="sm" variant="outline" className="h-8 opacity-60 cursor-default" onClick={() => {}}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button></div>
        </div>
      </GradientBorderCard>

      <AnimatePresence>
        {selectorOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <GradientBorderCard gradientFrom="oklch(0.74 0.13 190 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.15)" className="p-4">
              <div className="flex items-center gap-2 mb-3"><Layers className="h-4 w-4 text-repairing" /><h3 className="text-sm font-semibold">Select up to {MAX_SELECT} policies</h3><span className="ml-auto text-[10px] text-muted-foreground font-mono">{selectedIds.length} selected</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ALL_POLICIES.map((p) => {
                  const sel = selectedIds.includes(p.id);
                  const dis = !sel && selectedIds.length >= MAX_SELECT;
                  return (
                    <motion.button key={p.id} type="button" disabled={dis} onClick={() => togglePolicy(p.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all", sel ? "border-verified/50 bg-verified/10" : dis ? "border-border/30 bg-muted/10 opacity-40 cursor-not-allowed" : "border-border/40 bg-background/40 hover:border-verified/30")}>
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded border shrink-0", sel ? "border-verified bg-verified text-primary-foreground" : "border-border/60 bg-muted/20")}>{sel ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-0" />}</div>
                      <div className="min-w-0 flex-1"><div className="text-xs font-medium truncate">{p.name}</div><div className="text-[10px] text-muted-foreground truncate">{p.domain} · v{p.version}</div></div>
                      <div className={cn("h-2 w-2 rounded-full shrink-0", p.healthScore >= 85 ? "bg-verified" : p.healthScore >= 60 ? "bg-repairing" : "bg-violating")} />
                    </motion.button>
                  );
                })}
              </div>
            </GradientBorderCard>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPolicies.length === 0 && (
        <GradientBorderCard gradientFrom="oklch(0.32 0.014 165 / 0.2)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-8">
          <div className="relative text-center"><GitCompare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Select at least one policy to begin comparison.</p><Button size="sm" variant="outline" className="mt-3 h-8" onClick={() => setSelectorOpen(true)}><GitCompare className="h-3.5 w-3.5 mr-1.5" />Open Selector</Button></div>
        </GradientBorderCard>
      )}

      {selectedPolicies.length > 0 && (
        <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.15)" className="p-0 overflow-hidden">
          <TopAccentBar color="oklch(0.78 0.16 160)" />
          <div className="relative noise-overlay"><div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-border/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[160px]">Dimension</th>
                {selectedPolicies.map((p, i) => (
                  <th key={p.id} className="text-center px-4 py-3 min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: RADAR_COLORS[i] }} />
                      <span className="text-xs font-semibold">{p.name}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{p.domain} · v{p.version}</span>
                    </div>
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {DIMS.map((dim, rowIdx) => {
                  const vals = selectedPolicies.map(p => p[dim.key]);
                  const [bestI, worstI] = dim.cmp(vals);
                  const Icon = dim.icon;
                  return (
                    <motion.tr key={dim.key} variants={itemVariants} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="px-4 py-2.5 sticky left-0 bg-card z-10"><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{dim.label}</span></div></td>
                      {selectedPolicies.map((p, colI) => {
                        const isB = colI === bestI && selectedPolicies.length > 1;
                        const isW = colI === worstI && selectedPolicies.length > 1 && bestI !== worstI;
                        return (
                          <motion.td key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: rowIdx * 0.02 + colI * 0.03 }}
                            className={cn("px-4 py-2.5 text-center", isB && "bg-verified/8", isW && "bg-violating/8")}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1">
                                {isB && <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-verified/20 text-verified"><ArrowUpRight className="h-2.5 w-2.5" /></span>}
                                {isW && <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-violating/20 text-violating"><ArrowDownRight className="h-2.5 w-2.5" /></span>}
                                {dim.fmt(p[dim.key], p)}
                              </div>
                              {isB && <span className="text-[8px] font-mono text-verified/70 uppercase">best</span>}
                              {isW && <span className="text-[8px] font-mono text-violating/70 uppercase">worst</span>}
                            </div>
                          </motion.td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </GradientBorderCard>
      )}

      {selectedPolicies.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GradientBorderCard gradientFrom="oklch(0.74 0.13 190 / 0.3)" gradientTo="oklch(0.78 0.16 160 / 0.15)" className="p-4">
            <TopAccentBar color="oklch(0.74 0.13 190)" />
            <div className="relative"><div className="noise-overlay rounded-lg" />
              <div className="relative rounded-xl bg-card/60 backdrop-blur-xl border border-border/30 p-4">
                <div className="flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-repairing" /><h3 className="text-sm font-semibold">Normalized Radar</h3><span className="text-[10px] text-muted-foreground font-mono ml-auto">0–100</span></div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                    <PolarGrid stroke="oklch(0.32 0.014 165 / 0.5)" strokeDasharray="2 3" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "oklch(0.68 0.015 160)" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: "oklch(0.55 0.01 160)" }} tickCount={5} />
                    {selectedPolicies.map((p, i) => <Radar key={p.id} name={p.name} dataKey={p.name} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: RADAR_COLORS[i], stroke: RADAR_COLORS[i], strokeWidth: 1 }} />)}
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={8} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  {selectedPolicies.map((p, i) => <div key={p.id} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RADAR_COLORS[i] }} /><span className="text-[10px] text-muted-foreground font-mono">{p.name}</span></div>)}
                </div>
              </div>
            </div>
          </GradientBorderCard>

          <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.15)" className="p-4">
            <TopAccentBar color="oklch(0.80 0.15 80)" />
            <div className="relative"><div className="noise-overlay rounded-lg" /><div className="relative">
              <div className="flex items-center gap-2 mb-3"><GitCompare className="h-4 w-4 text-repairing" /><h3 className="text-sm font-semibold">Difference Summary</h3><Badge variant="outline" className="ml-auto text-[9px] font-mono border-repairing/30 bg-repairing/10 text-repairing">{diffSummary.length} insights</Badge></div>
              {diffSummary.length === 0 ? <div className="text-center py-8"><Check className="h-8 w-8 text-verified mx-auto mb-2" /><p className="text-xs text-muted-foreground">Policies are nearly identical.</p></div> : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                  {diffSummary.map((text, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2.5 rounded-lg border border-border/30 bg-background/30 p-3">
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 text-[10px] font-bold", i === 0 ? "bg-verified/15 text-verified" : i <= 2 ? "bg-repairing/15 text-repairing" : "bg-muted/20 text-muted-foreground")}>{i + 1}</div>
                      <p className="text-xs leading-relaxed">{text}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {selectedPolicies.map((p, i) => (
                  <div key={p.id} className="rounded-lg border border-border/30 bg-background/30 p-2 text-center">
                    <span className="inline-block h-2 w-2 rounded-full mb-1" style={{ backgroundColor: RADAR_COLORS[i] }} />
                    <div className={cn("text-lg font-bold font-mono leading-none", hc(p.healthScore))}>{p.healthScore}%</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{p.name}</div>
                  </div>
                ))}
              </div>
            </div></div>
          </GradientBorderCard>
        </div>
      )}
    </motion.section>
  );
}
