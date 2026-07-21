"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Download, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Lock, Cpu, GitBranch, KeyRound, FileCheck2, Printer, Copy, FileSpreadsheet, Loader2, Fingerprint, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PolicyRow } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants, fmtTimestamp, csvEscape, SeverityDot, GridOverlay, TopAccentBar } from "./primitives";
import { RadarGrid, DonutChart } from "./chart-primitives";

interface AuditInvariant { name: string; severity: string; soft: boolean; predicate: string; message?: string }
interface AuditPolicy {
  id: string; name: string; domain: string | null; version: string | null; filename: string; description: string | null; ok: boolean;
  diagnostics: { errors: number; warnings: number }; invariants: AuditInvariant[];
  shardHealth: { total: number; healthy: number; repairing: number; violating: number; healthScore: number };
  mergeHistory: { total: number; applied: number; rejected: number; successRate: number; recent: { status: string; divergence: number; iterations: number; violations: string[]; createdAt: string }[] };
  ancestry: { proofKind: string | null; zkEnabled: boolean; totalProofs: number; zkProofs: number; anchored: number };
  shadowBridge: { enabled: boolean; takeoverLatencyMs: number | null; recentEvents: number; authoritative: boolean };
  violations: { invariant: string; severity: string; soft: boolean; shardKey: string; repaired: boolean; driftDelta: number; createdAt: string }[];
  wasmFingerprint: string | null; compiledAt: string;
}
interface AuditReport {
  generatedAt: string; reportId: string; scope: string;
  summary: { policyCount: number; totalShards: number; totalInvariants: number; totalMerges: number; totalViolations: number; totalProofs: number; zkPolicies: number; shadowEnabledPolicies: number };
  policies: AuditPolicy[];
  compliance: { formalVerification: boolean; zkAnchored: number; shadowReady: number; zeroUnrepairedCriticalViolations: boolean; allShardsHealthy: boolean };
}

export function AuditReportsSection() {
  const { toast } = useToast();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [scopePolicy, setScopePolicy] = useState("all");
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);

  const load = useCallback(async () => {
    try {
      setGenerating(true); setGenerateProgress(0);
      const pi = setInterval(() => setGenerateProgress((p) => Math.min(p + Math.random() * 30, 90)), 200);
      const qs = scopePolicy !== "all" ? `?policyId=${scopePolicy}` : "";
      const r = await fetch(`/api/audit${qs}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: AuditReport = await r.json();
      clearInterval(pi); setGenerateProgress(100);
      setTimeout(() => { setReport(d); setExpandedPolicy(d.policies[0]?.id ?? null); setGenerating(false); setGenerateProgress(0); }, 300);
    } catch { setGenerating(false); setGenerateProgress(0); } finally { setLoading(false); }
  }, [scopePolicy]);

  useEffect(() => { fetch("/api/policies").then((r) => r.json()).then((d) => setPolicies(d.policies ?? [])).catch(() => {}); }, []);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${report.reportId}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded", description: `${report.reportId}.json` });
  };

  const copyReport = async () => {
    if (!report) return;
    try { await navigator.clipboard.writeText(JSON.stringify(report, null, 2)); toast({ title: "Report copied to clipboard" }); }
    catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };

  const downloadCsv = () => {
    if (!report) return;
    const rows: string[][] = [["Policy", "Domain", "Version", "Invariants", "Shards", "Shard Health %", "Merges Applied", "Merges Rejected", "Violations", "ZK Proofs", "Total Proofs", "Shadow Enabled", "Wasm Fingerprint", "Compiled At"]];
    for (const p of report.policies) rows.push([p.name, p.domain ?? "", p.version ?? "", String(p.invariants.length), String(p.shardHealth.total), String(p.shardHealth.healthScore), String(p.mergeHistory.applied), String(p.mergeHistory.rejected), String(p.violations.length), String(p.ancestry.zkProofs), String(p.ancestry.totalProofs), String(p.shadowBridge.enabled), p.wasmFingerprint ?? "", new Date(p.compiledAt).toISOString()]);
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${report.reportId}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${report.reportId}.csv` });
  };

  const complianceRadarData = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Verification", value: report.compliance.formalVerification ? 100 : 0, max: 100 },
      { label: "ZK Anchored", value: Math.min(100, (report.compliance.zkAnchored / Math.max(1, report.summary.policyCount)) * 100), max: 100 },
      { label: "Shadow Ready", value: Math.min(100, (report.compliance.shadowReady / Math.max(1, report.summary.policyCount)) * 100), max: 100 },
      { label: "No Critical", value: report.compliance.zeroUnrepairedCriticalViolations ? 100 : 20, max: 100 },
      { label: "Shard Health", value: report.compliance.allShardsHealthy ? 100 : 60, max: 100 },
    ];
  }, [report]);

  const complianceDonutData = useMemo(() => {
    if (!report) return [];
    const passed = [report.compliance.formalVerification, report.compliance.zkAnchored > 0, report.compliance.shadowReady > 0, report.compliance.zeroUnrepairedCriticalViolations, report.compliance.allShardsHealthy].filter(Boolean).length;
    return [{ label: "Passed", value: passed, color: "verified" }, { label: "Failed", value: 5 - passed, color: "violating" }];
  }, [report]);

  const trailIntegrity = useMemo(() => {
    if (!report) return { score: 0, details: [] as string[] };
    const details: string[] = []; let score = 0;
    if (report.compliance.formalVerification) { score += 20; details.push("All policies validate"); }
    if (report.compliance.zkAnchored > 0) { score += 25; details.push(`${report.compliance.zkAnchored} ZK-anchored policies`); }
    if (report.compliance.shadowReady > 0) { score += 15; details.push(`${report.compliance.shadowReady} shadow-ready`); }
    if (report.compliance.zeroUnrepairedCriticalViolations) { score += 25; details.push("No critical drift"); }
    if (report.compliance.allShardsHealthy) { score += 15; details.push("All shards healthy"); }
    return { score, details };
  }, [report]);

  if (loading || !report) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const complianceItems = [
    { label: "Formal verification", passed: report.compliance.formalVerification, detail: "All policies parse & validate", icon: FileCheck2 },
    { label: "ZK-anchored policies", passed: report.compliance.zkAnchored > 0, detail: `${report.compliance.zkAnchored} policies with ZK proofs`, icon: Lock },
    { label: "Shadow-ready", passed: report.compliance.shadowReady > 0, detail: `${report.compliance.shadowReady} policies with shadow bridge`, icon: Cpu },
    { label: "No unrepaired critical violations", passed: report.compliance.zeroUnrepairedCriticalViolations, detail: report.compliance.zeroUnrepairedCriticalViolations ? "All critical violations repaired" : "Unrepaired critical violations exist", icon: AlertTriangle },
    { label: "All shards healthy", passed: report.compliance.allShardsHealthy, detail: report.compliance.allShardsHealthy ? "Every shard satisfies its invariants" : "Some shards are repairing/violating", icon: ShieldCheck },
  ];

  const summaryStats = [
    { icon: GitBranch, label: "Policies", value: report.summary.policyCount },
    { icon: Cpu, label: "Shards", value: report.summary.totalShards },
    { icon: FileCheck2, label: "Invariants", value: report.summary.totalInvariants },
    { icon: GitBranch, label: "Merges", value: report.summary.totalMerges },
    { icon: AlertTriangle, label: "Violations", value: report.summary.totalViolations, accent: "violating" as const },
    { icon: KeyRound, label: "Proofs", value: report.summary.totalProofs },
    { icon: Lock, label: "ZK policies", value: report.summary.zkPolicies, accent: "verified" as const },
    { icon: Cpu, label: "Shadow", value: report.summary.shadowEnabledPolicies, accent: "repairing" as const },
  ];

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.4)" gradientTo="oklch(0.64 0.21 25 / 0.2)" className="p-4">
        <GridOverlay />
        <div className="relative flex flex-wrap items-center gap-3">
          <motion.div variants={cardVariants} className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0">
            <FileText className="h-5 w-5 text-verified" />
          </motion.div>
          <motion.div variants={cardVariants} className="min-w-0 flex-1">
            <h2 className="text-base font-semibold flex items-center gap-2">
              Audit Reports
              <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">{report.reportId}</Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Exportable compliance report — regulators can remotely audit the possible futures of the system without touching the live runtime.</p>
          </motion.div>
          <motion.div variants={cardVariants} className="flex items-center gap-2 flex-wrap">
            <Select value={scopePolicy} onValueChange={setScopePolicy}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All policies (global)</SelectItem>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8" onClick={copyReport}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={downloadCsv}><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> CSV</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" /> Print</Button>
            <Button size="sm" className="h-8 bg-verified/90 hover:bg-verified text-primary-foreground" onClick={downloadJson}><Download className="h-3.5 w-3.5 mr-1.5" /> JSON</Button>
          </motion.div>
        </div>
        <AnimatePresence>{generating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
            <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 text-verified animate-spin" /><span className="text-xs text-muted-foreground">Generating report…</span><span className="text-[10px] font-mono text-muted-foreground ml-auto">{Math.round(generateProgress)}%</span></div>
            <Progress value={generateProgress} className="h-1.5 mt-1.5" />
          </motion.div>
        )}</AnimatePresence>
      </GradientBorderCard>

      {/* Compliance signals */}
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.78 0.16 160 / 0.2)" className="p-4">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3"><ShieldCheck className="h-4 w-4 text-verified" /><h3 className="text-sm font-semibold">Compliance signals</h3><span className="ml-auto text-[10px] text-muted-foreground font-mono">generated {new Date(report.generatedAt).toLocaleString()}</span></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {complianceItems.map((c) => {
                const Icon = c.icon;
                return (
                  <motion.div key={c.label} variants={itemVariants} whileHover={{ scale: 1.02, x: 2 }}
                    className={cn("rounded-md border p-2.5 transition-shadow hover:shadow-md", c.passed ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5")}>
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("h-3.5 w-3.5", c.passed ? "text-verified" : "text-violating")} />
                      {c.passed ? <CheckCircle2 className="h-3 w-3 text-verified ml-auto" /> : <XCircle className="h-3 w-3 text-violating ml-auto" />}
                    </div>
                    <p className={cn("text-[11px] font-medium mt-1.5", c.passed ? "text-verified" : "text-violating")}>{c.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{c.detail}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-full max-w-[200px] flex flex-col items-center">
                <DonutChart data={complianceDonutData} size={120} thickness={16} showLabels />
                <div className="text-center -mt-1">
                  <span className={cn("text-2xl font-bold", complianceDonutData[0].value >= 4 ? "text-verified" : complianceDonutData[0].value >= 2 ? "text-repairing" : "text-violating")}>
                    {Math.round((complianceDonutData[0].value / 5) * 100)}%
                  </span>
                  <p className="text-[10px] text-muted-foreground">compliance score</p>
                </div>
              </div>
              <div className="w-full max-w-[240px] flex items-center justify-center">
                <RadarGrid data={complianceRadarData} size={180} color="verified" />
              </div>
            </div>
          </div>
        </div>
      </GradientBorderCard>

      {/* Audit trail integrity */}
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.78 0.16 160 / 0.1)" className="p-4">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Audit trail integrity</span>
            <Badge variant="outline" className={cn("ml-auto text-[9px] font-mono", trailIntegrity.score >= 80 ? "border-verified/30 bg-verified/10 text-verified" : trailIntegrity.score >= 50 ? "border-repairing/30 bg-repairing/10 text-repairing" : "border-violating/30 bg-violating/10 text-violating")}>
              {trailIntegrity.score}% integrity
            </Badge>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted/30 overflow-hidden mb-3">
            <motion.div className={cn("absolute inset-y-0 left-0 rounded-full", trailIntegrity.score >= 80 ? "bg-gradient-to-r from-verified to-verified/70" : trailIntegrity.score >= 50 ? "bg-gradient-to-r from-repairing to-repairing/70" : "bg-gradient-to-r from-violating to-violating/70")}
              initial={{ width: 0 }} animate={{ width: `${trailIntegrity.score}%` }} transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {trailIntegrity.details.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-1.5 rounded-full border border-verified/20 bg-verified/5 px-2 py-0.5 text-[10px] text-verified">
                <CheckCircle2 className="h-2.5 w-2.5" />{d}
              </motion.div>
            ))}
          </div>
        </div>
      </GradientBorderCard>

      {/* Summary stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {summaryStats.map((s) => <SummaryStat key={s.label} {...s} />)}
      </motion.div>

      {/* Per-policy report cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1"><FileText className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Policy audit trail</span><span className="text-xs text-muted-foreground">· {report.policies.length} policies</span></div>
        <div className="space-y-2">
          {report.policies.map((p) => <PolicyAuditCard key={p.id} policy={p} expanded={expandedPolicy === p.id} onToggle={() => setExpandedPolicy(expandedPolicy === p.id ? null : p.id)} />)}
        </div>
      </div>
    </motion.section>
  );
}

function PolicyAuditCard({ policy, expanded, onToggle }: { policy: AuditPolicy; expanded: boolean; onToggle: () => void }) {
  const hs = policy.shardHealth.healthScore;
  const healthGrad = hs >= 85 ? "oklch(0.78 0.16 160 / 0.4)" : hs >= 60 ? "oklch(0.80 0.15 80 / 0.4)" : "oklch(0.64 0.21 25 / 0.4)";
  return (
    <GradientBorderCard gradientFrom={healthGrad} gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-0">
      <button type="button" onClick={onToggle} className="w-full text-left p-3 hover:bg-muted/20 transition-colors">
        <motion.div className="flex items-center gap-2 flex-wrap" whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
          <motion.div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", policy.ok ? "bg-verified/10 text-verified" : "bg-violating/10 text-violating")}
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
            {policy.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          </motion.div>
          <span className="text-sm font-medium">{policy.name}</span>
          {policy.domain && <Badge variant="outline" className="text-[9px] font-mono border-border/60">{policy.domain}</Badge>}
          {policy.version && <span className="text-[10px] text-muted-foreground font-mono">v{policy.version}</span>}
          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="outline" className={cn("text-[9px]", hs >= 85 ? "border-verified/30 bg-verified/10 text-verified" : hs >= 60 ? "border-repairing/30 bg-repairing/10 text-repairing" : "border-violating/30 bg-violating/10 text-violating")}>
              {hs}% health
            </Badge>
            {policy.ancestry.zkEnabled && <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified"><Lock className="h-2.5 w-2.5 mr-0.5" /> ZK</Badge>}
            {policy.shadowBridge.enabled && <Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing"><Cpu className="h-2.5 w-2.5 mr-0.5" /> shadow</Badge>}
          </div>
        </motion.div>
      </button>
      <AnimatePresence>{expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <div className="border-t border-border/60 p-3 space-y-3 bg-muted/10">
            {policy.description && <p className="text-xs text-muted-foreground italic">{policy.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatBox label="Shards" value={`${policy.shardHealth.healthy}/${policy.shardHealth.total} healthy`} accent={policy.shardHealth.violating > 0 ? "violating" : "verified"} />
              <StatBox label="Merges" value={`${policy.mergeHistory.applied}/${policy.mergeHistory.total} applied`} accent={policy.mergeHistory.rejected > 0 ? "repairing" : "verified"} />
              <StatBox label="Proofs" value={`${policy.ancestry.zkProofs}/${policy.ancestry.totalProofs} ZK`} accent="verified" />
              <StatBox label="Violations" value={String(policy.violations.length)} accent={policy.violations.length > 0 ? "violating" : "verified"} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Compiled invariants ({policy.invariants.length})</div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {policy.invariants.map((inv) => (
                  <motion.div key={inv.name} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 2, backgroundColor: "oklch(0.25 0.015 168 / 0.3)" }}
                    className="flex items-center gap-2 rounded border border-border/40 bg-background/40 px-2 py-1">
                    <SeverityDot severity={inv.severity} />
                    <span className="font-mono text-[11px] font-medium">{inv.name}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">{inv.severity}{inv.soft && " · soft"}</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate ml-auto">{inv.predicate}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            {policy.violations.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Drift violations ({policy.violations.length})</div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto">
                  {policy.violations.map((v, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-2 rounded border border-border/40 bg-background/40 px-2 py-1 text-[11px]">
                      <SeverityDot severity={v.severity} />
                      <span className="font-mono">{v.invariant}</span>
                      <span className="text-muted-foreground">· {v.shardKey}</span>
                      {v.repaired ? <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified ml-auto">repaired</Badge> : <Badge variant="outline" className="text-[9px] border-violating/30 bg-violating/10 text-violating ml-auto">unrepaired</Badge>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" />{policy.wasmFingerprint ?? "—"}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(policy.compiledAt).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>
    </GradientBorderCard>
  );
}

function SummaryStat({ icon: Icon, label, value, accent }: { icon: typeof GitBranch; label: string; value: number; accent?: "verified" | "repairing" | "violating" }) {
  const color = accent === "verified" ? "text-verified" : accent === "repairing" ? "text-repairing" : accent === "violating" ? "text-violating" : "text-foreground";
  const gradFrom = accent === "verified" ? "oklch(0.78 0.16 160 / 0.3)" : accent === "repairing" ? "oklch(0.80 0.15 80 / 0.3)" : accent === "violating" ? "oklch(0.64 0.21 25 / 0.3)" : "oklch(0.32 0.014 165 / 0.3)";
  return (
    <GradientBorderCard gradientFrom={gradFrom} gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-2.5">
      <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <div className={cn("text-lg font-semibold tabular-nums leading-none mt-1", color)}>{value}</div>
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
      </motion.div>
    </GradientBorderCard>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: "verified" | "repairing" | "violating" }) {
  const color = accent === "verified" ? "text-verified" : accent === "repairing" ? "text-repairing" : "text-violating";
  return (
    <motion.div className="rounded border border-border/40 bg-background/40 px-2 py-1.5" whileHover={{ scale: 1.02, x: 1 }}>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-xs font-mono font-medium mt-0.5", color)}>{value}</div>
    </motion.div>
  );
}
