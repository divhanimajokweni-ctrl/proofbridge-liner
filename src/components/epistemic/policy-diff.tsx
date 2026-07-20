"use client";

import { useMemo, useState } from "react";
import {
  GitCompare, FileCode2, ArrowRight, CheckCircle2, AlertTriangle,
  Plus, Minus, Equal, Hash, ArrowLeftRight, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SAMPLE_POLICIES, validateEpd, type PolicyNode, type InvariantNode } from "@/lib/epd";
import { motion, AnimatePresence } from "framer-motion";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants } from "./primitives";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

type DiffStatus = "added" | "removed" | "changed" | "unchanged";

interface InvariantDiff {
  name: string; status: DiffStatus; left?: InvariantNode; right?: InvariantNode;
  changes: { field: string; from: string; to: string }[];
}

interface PolicyDiffResult {
  leftName: string; rightName: string; shardChanged: boolean; shardFrom?: string; shardTo?: string;
  ancestryChanged: boolean; shadowChanged: boolean; repairChanged: boolean;
  exportsAdded: string[]; exportsRemoved: string[];
  invariants: InvariantDiff[]; added: number; removed: number; changed: number; unchanged: number;
}

function diffPolicies(left: PolicyNode, right: PolicyNode): PolicyDiffResult {
  const leftInv = new Map(left.invariants.map((i) => [i.name, i]));
  const rightInv = new Map(right.invariants.map((i) => [i.name, i]));
  const allNames = Array.from(new Set([...leftInv.keys(), ...rightInv.keys()]));
  const invariants: InvariantDiff[] = allNames.map((name) => {
    const l = leftInv.get(name), r = rightInv.get(name);
    if (l && !r) return { name, status: "removed", left: l, changes: [] };
    if (!l && r) return { name, status: "added", right: r, changes: [] };
    if (l && r) {
      const changes: { field: string; from: string; to: string }[] = [];
      if (l.rawPredicate !== r.rawPredicate) changes.push({ field: "predicate", from: l.rawPredicate, to: r.rawPredicate });
      if (l.severity !== r.severity) changes.push({ field: "severity", from: l.severity, to: r.severity });
      if (l.soft !== r.soft) changes.push({ field: "soft", from: String(l.soft), to: String(r.soft) });
      return { name, status: changes.length ? "changed" : "unchanged", left: l, right: r, changes };
    }
    return { name, status: "unchanged", changes: [] };
  });
  invariants.sort((a, b) => { const o: Record<DiffStatus, number> = { changed: 0, added: 1, removed: 2, unchanged: 3 }; return o[a.status] - o[b.status]; });
  const shardFrom = left.shard ? `${left.shard.dimension ?? left.shard.key} · ${left.shard.strategy}` : "—";
  const shardTo = right.shard ? `${right.shard.dimension ?? right.shard.key} · ${right.shard.strategy}` : "—";
  return {
    leftName: left.name, rightName: right.name, shardChanged: shardFrom !== shardTo, shardFrom, shardTo,
    ancestryChanged: JSON.stringify(left.ancestry) !== JSON.stringify(right.ancestry),
    shadowChanged: JSON.stringify(left.shadowBridge) !== JSON.stringify(right.shadowBridge),
    repairChanged: JSON.stringify(left.onViolation) !== JSON.stringify(right.onViolation),
    exportsAdded: right.exports.filter((e) => !left.exports.includes(e)),
    exportsRemoved: left.exports.filter((e) => !right.exports.includes(e)),
    invariants, added: invariants.filter((i) => i.status === "added").length,
    removed: invariants.filter((i) => i.status === "removed").length,
    changed: invariants.filter((i) => i.status === "changed").length,
    unchanged: invariants.filter((i) => i.status === "unchanged").length,
  };
}

const STATUS_META: Record<DiffStatus, { icon: typeof Plus; color: string; bg: string; text: string; label: string }> = {
  added: { icon: Plus, color: "text-verified", bg: "bg-verified/10 border-verified/30", text: "text-verified", label: "ADDED" },
  removed: { icon: Minus, color: "text-violating", bg: "bg-violating/10 border-violating/30", text: "text-violating", label: "REMOVED" },
  changed: { icon: AlertTriangle, color: "text-repairing", bg: "bg-repairing/10 border-repairing/30", text: "text-repairing", label: "CHANGED" },
  unchanged: { icon: Equal, color: "text-muted-foreground", bg: "bg-muted/20 border-border/40", text: "text-muted-foreground", label: "SAME" },
};

export function PolicyDiffSection() {
  const { toast } = useToast();
  const [leftSource, setLeftSource] = useState(SAMPLE_POLICIES[0].source);
  const [rightSource, setRightSource] = useState(SAMPLE_POLICIES[1].source);
  const [leftFilename, setLeftFilename] = useState(SAMPLE_POLICIES[0].filename);
  const [rightFilename, setRightFilename] = useState(SAMPLE_POLICIES[1].filename);

  const result = useMemo<PolicyDiffResult | null>(() => {
    try {
      const l = validateEpd(leftSource), r = validateEpd(rightSource);
      if (!l.ok || !l.ast?.policies[0] || !r.ok || !r.ast?.policies[0]) return null;
      return diffPolicies(l.ast.policies[0], r.ast.policies[0]);
    } catch { return null; }
  }, [leftSource, rightSource]);

  const loadSample = (side: "left" | "right", filename: string) => {
    const s = SAMPLE_POLICIES.find((p) => p.filename === filename);
    if (!s) return;
    if (side === "left") { setLeftSource(s.source); setLeftFilename(s.filename); }
    else { setRightSource(s.source); setRightFilename(s.filename); }
  };

  const swap = () => {
    setLeftSource(rightSource); setLeftFilename(rightFilename);
    setRightSource(leftSource); setRightFilename(leftFilename);
    toast({ title: "Policies swapped" });
  };

  const lineDiff = useMemo(() => {
    if (!result) return [];
    const leftLines = leftSource.split("\n"), rightLines = rightSource.split("\n");
    const maxLen = Math.max(leftLines.length, rightLines.length);
    const lines: { leftNum: number; leftText: string; rightNum: number; rightText: string; type: "same" | "left-only" | "right-only" | "changed" }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const ll = leftLines[i], rl = rightLines[i];
      if (ll === undefined && rl !== undefined) lines.push({ leftNum: 0, leftText: "", rightNum: i + 1, rightText: rl, type: "right-only" });
      else if (rl === undefined && ll !== undefined) lines.push({ leftNum: i + 1, leftText: ll, rightNum: 0, rightText: "", type: "left-only" });
      else if (ll === rl) lines.push({ leftNum: i + 1, leftText: ll, rightNum: i + 1, rightText: rl, type: "same" });
      else lines.push({ leftNum: i + 1, leftText: ll ?? "", rightNum: i + 1, rightText: rl ?? "", type: "changed" });
    }
    return lines;
  }, [result, leftSource, rightSource]);

  const diffStatsData = useMemo(() => result ? [
    { name: "Added", value: result.added, fill: "oklch(0.78 0.16 160 / 0.7)" },
    { name: "Removed", value: result.removed, fill: "oklch(0.64 0.21 25 / 0.7)" },
    { name: "Changed", value: result.changed, fill: "oklch(0.80 0.15 80 / 0.7)" },
    { name: "Unchanged", value: result.unchanged, fill: "oklch(0.42 0.01 165 / 0.5)" },
  ] : [], [result]);

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
      {/* Header */}
      <GradientBorderCard gradient="from-verified/40 via-repairing/20 to-violating/20" className="p-4">
        <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0"><GitCompare className="h-5 w-5 text-verified" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold flex items-center gap-2">Policy Diff<Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">.epd comparison</Badge></h2>
            <p className="text-xs text-muted-foreground mt-0.5">Compare two .epd policies side-by-side — invariant additions, removals, predicate changes.</p>
          </div>
        </div>
      </GradientBorderCard>

      {/* Two-column editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DiffEditor side="left" label="Base policy" filename={leftFilename} source={leftSource} onSource={setLeftSource} onLoadSample={(f) => loadSample("left", f)} accent="violating" />
        <DiffEditor side="right" label="Proposed policy" filename={rightFilename} source={rightSource} onSource={setRightSource} onLoadSample={(f) => loadSample("right", f)} accent="verified" />
      </div>

      {/* Swap button */}
      <div className="flex justify-center -my-2 relative z-10">
        <motion.div whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.3 }}>
          <Button size="sm" variant="outline" onClick={swap} className="h-8 px-3 bg-card/80 backdrop-blur border-border/60">
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />swap sides
          </Button>
        </motion.div>
      </div>

      {/* Diff result */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="diff-result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Summary bar */}
            <GradientBorderCard gradient="from-verified/30 via-repairing/20 to-violating/20" className="p-4">
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <DiffStat icon={Plus} label="Added" value={result.added} accent="verified" />
                  <DiffStat icon={Minus} label="Removed" value={result.removed} accent="violating" />
                  <DiffStat icon={AlertTriangle} label="Changed" value={result.changed} accent="repairing" />
                  <DiffStat icon={Equal} label="Unchanged" value={result.unchanged} accent="muted" />
                </div>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diffStatsData} layout="vertical" barCategoryGap={4}>
                      <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "oklch(0.55 0.01 160)" }} axisLine={false} tickLine={false} width={65} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "oklch(0.22 0.014 168)", border: "1px solid oklch(0.32 0.014 165)", borderRadius: "6px", fontSize: "11px" }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>{diffStatsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GradientBorderCard>

            {/* Structural drift */}
            <GradientBorderCard gradient="from-repairing/30 via-verified/15 to-repairing/20" className="p-4">
              <div className="relative space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode2 className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Structural drift</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{result.leftName} → {result.rightName}</span>
                </div>
                <StructDriftBar result={result} />
                <StructRow label="Shard" from={result.shardFrom ?? "—"} to={result.shardTo ?? "—"} changed={result.shardChanged} />
                <StructRow label="Ancestry" from="config" to="config" changed={result.ancestryChanged} hideValues={!result.ancestryChanged} />
                <StructRow label="Shadow bridge" from="config" to="config" changed={result.shadowChanged} hideValues={!result.shadowChanged} />
                <StructRow label="Repair strategy" from="config" to="config" changed={result.repairChanged} hideValues={!result.repairChanged} />
                {(result.exportsAdded.length > 0 || result.exportsRemoved.length > 0) && (
                  <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5 text-xs">
                    <span className="text-muted-foreground font-mono w-28 shrink-0">Exports</span>
                    {result.exportsAdded.map((e) => <Badge key={`a-${e}`} variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified"><Plus className="h-2.5 w-2.5 mr-0.5" />{e}</Badge>)}
                    {result.exportsRemoved.map((e) => <Badge key={`r-${e}`} variant="outline" className="text-[9px] border-violating/30 bg-violating/10 text-violating"><Minus className="h-2.5 w-2.5 mr-0.5" />{e}</Badge>)}
                  </div>
                )}
              </div>
            </GradientBorderCard>

            {/* Invariant diffs */}
            <GradientBorderCard gradient="from-verified/30 via-repairing/15 to-verified/20" className="p-4">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Invariant changes</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{result.invariants.length} total</span>
                </div>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {result.invariants.map((inv, idx) => {
                    const m = STATUS_META[inv.status]; const Icon = m.icon;
                    return (
                      <motion.div key={inv.name} variants={itemVariants} custom={idx} whileHover={{ scale: 1.005, x: 2 }}
                        className={cn("rounded-md border px-2.5 py-1.5 transition-shadow hover:shadow-md", m.bg)}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", m.text)} />
                          <span className="font-mono text-xs font-medium truncate">{inv.name}</span>
                          <span className={cn("ml-auto text-[9px] font-semibold uppercase tracking-wide", m.text)}>{m.label}</span>
                        </div>
                        {inv.status === "added" && inv.right && <div className="mt-1 pl-5.5 font-mono text-[11px] text-verified bg-verified/5 rounded px-1.5 py-0.5">+ {inv.right.rawPredicate}</div>}
                        {inv.status === "removed" && inv.left && <div className="mt-1 pl-5.5 font-mono text-[11px] text-violating bg-violating/5 rounded px-1.5 py-0.5 line-through opacity-70">- {inv.left.rawPredicate}</div>}
                        {inv.status === "changed" && inv.changes.map((c, i) => (
                          <div key={i} className="mt-1 pl-5.5 space-y-0.5">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.field}</div>
                            <div className="font-mono text-[11px] flex items-center gap-1.5 flex-wrap">
                              <span className="text-violating line-through opacity-70 bg-violating/5 px-1 rounded">{c.from}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-verified bg-verified/5 px-1 rounded">{c.to}</span>
                            </div>
                          </div>
                        ))}
                        {inv.status === "unchanged" && inv.left && <div className="mt-1 pl-5.5 font-mono text-[11px] text-muted-foreground/60">{inv.left.rawPredicate}</div>}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </GradientBorderCard>

            {/* Line-by-line diff */}
            <GradientBorderCard gradient="from-violating/30 via-repairing/15 to-verified/20" className="p-4">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Line-by-line diff</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{leftSource.split("\n").length} / {rightSource.split("\n").length} lines</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto rounded-md border border-border/40 bg-background/30 font-mono text-[11px]">
                  {lineDiff.map((line, i) => (
                    <div key={i} className={cn("flex border-b border-border/20 last:border-0",
                      line.type === "left-only" && "bg-violating/5", line.type === "right-only" && "bg-verified/5", line.type === "changed" && "bg-repairing/5")}>
                      <div className="w-1/2 flex border-r border-border/20">
                        <span className={cn("select-none w-8 shrink-0 text-right pr-1.5 py-0.5 text-[9px]",
                          line.type === "left-only" ? "text-violating/70 bg-violating/10" : line.type === "changed" ? "text-repairing/70 bg-repairing/10" : "text-muted-foreground/40")}>{line.leftNum || ""}</span>
                        <span className={cn("flex-1 px-1.5 py-0.5 whitespace-pre overflow-hidden",
                          line.type === "left-only" && "text-violating", line.type === "changed" && "text-violating/80")}>
                          {(line.type === "left-only" || line.type === "changed") && <Minus className="inline h-3 w-3 mr-0.5 text-violating/50" />}{line.leftText}
                        </span>
                      </div>
                      <div className="w-1/2 flex">
                        <span className={cn("select-none w-8 shrink-0 text-right pr-1.5 py-0.5 text-[9px]",
                          line.type === "right-only" ? "text-verified/70 bg-verified/10" : line.type === "changed" ? "text-repairing/70 bg-repairing/10" : "text-muted-foreground/40")}>{line.rightNum || ""}</span>
                        <span className={cn("flex-1 px-1.5 py-0.5 whitespace-pre overflow-hidden",
                          line.type === "right-only" && "text-verified", line.type === "changed" && "text-verified/80")}>
                          {(line.type === "right-only" || line.type === "changed") && <Plus className="inline h-3 w-3 mr-0.5 text-verified/50" />}{line.rightText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GradientBorderCard>
          </motion.div>
        ) : (
          <motion.div key="diff-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GradientBorderCard gradient="from-violating/30 to-violating/10" className="p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">One or both policies failed to parse.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Fix the .epd source in the editors above to see the diff.</p>
            </GradientBorderCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function DiffEditor({ side, label, filename, source, onSource, onLoadSample, accent }: {
  side: "left" | "right"; label: string; filename: string; source: string;
  onSource: (s: string) => void; onLoadSample: (filename: string) => void; accent: "verified" | "violating";
}) {
  const lines = source.split("\n");
  const dotColor = accent === "verified" ? "bg-verified" : "bg-violating";
  const gradient = accent === "verified" ? "from-verified/40 to-verified/10" : "from-violating/40 to-violating/10";
  return (
    <GradientBorderCard gradient={gradient} className="p-0">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 bg-background/40">
        <span className={cn("h-2 w-2 rounded-full", dotColor)} />
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground truncate">{filename}</span>
        <Select value={filename} onValueChange={onLoadSample}>
          <SelectTrigger className="h-6 w-[150px] text-[10px] ml-auto"><SelectValue /></SelectTrigger>
          <SelectContent>{SAMPLE_POLICIES.map((s) => <SelectItem key={s.filename} value={s.filename}>{s.filename}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="relative flex bg-background/30 h-[360px]">
        <div className="select-none overflow-hidden py-2 pl-2.5 pr-1.5 text-right font-mono text-[10px] text-muted-foreground/50 bg-background/20 shrink-0" style={{ minWidth: 36 }} aria-hidden>
          {lines.map((_, i) => <div key={i} style={{ height: "1.5em", lineHeight: "1.5em" }}>{i + 1}</div>)}
        </div>
        <Textarea value={source} onChange={(e) => onSource(e.target.value)} spellCheck={false}
          className="codeblock flex-1 h-full resize-none border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[11px]" />
      </div>
    </GradientBorderCard>
  );
}

function DiffStat({ icon: Icon, label, value, accent }: { icon: typeof Plus; label: string; value: number; accent: "verified" | "violating" | "repairing" | "muted" }) {
  const color = accent === "verified" ? "text-verified" : accent === "violating" ? "text-violating" : accent === "repairing" ? "text-repairing" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-md bg-background/60 flex items-center justify-center shrink-0"><Icon className={cn("h-4 w-4", color)} /></div>
      <div><div className={cn("text-xl font-semibold tabular-nums leading-none", color)}>{value}</div><div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div></div>
    </div>
  );
}

function StructDriftBar({ result }: { result: PolicyDiffResult }) {
  const drifts = [{ label: "shard", changed: result.shardChanged }, { label: "ancestry", changed: result.ancestryChanged }, { label: "shadow", changed: result.shadowChanged }, { label: "repair", changed: result.repairChanged }];
  const driftCount = drifts.filter((d) => d.changed).length;
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] text-muted-foreground shrink-0">drift score</span>
      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden flex">
        {drifts.map((d, i) => <motion.div key={d.label} className={cn("h-full", d.changed ? "bg-repairing/70" : "bg-verified/30")}
          initial={{ width: 0 }} animate={{ width: "25%" }} transition={{ delay: i * 0.08 }} title={`${d.label}: ${d.changed ? "changed" : "unchanged"}`} />)}
      </div>
      <span className={cn("text-[10px] font-mono font-medium shrink-0", driftCount > 0 ? "text-repairing" : "text-verified")}>{driftCount}/4 drifted</span>
    </div>
  );
}

function StructRow({ label, from, to, changed, hideValues = false }: { label: string; from: string; to: string; changed: boolean; hideValues?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs", changed ? "border-repairing/30 bg-repairing/5" : "border-border/40 bg-background/30")}>
      <span className="text-muted-foreground font-mono w-28 shrink-0">{label}</span>
      {changed ? (
        <div className="flex items-center gap-1.5 font-mono text-[11px] min-w-0 flex-1">
          <span className="text-violating line-through opacity-70 truncate">{from}</span><ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-verified truncate">{to}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {!hideValues && <span className="font-mono text-[11px] text-muted-foreground truncate">{from}</span>}
          <CheckCircle2 className="h-3 w-3 text-verified ml-auto shrink-0" /><span className="text-[10px] text-verified">unchanged</span>
        </div>
      )}
    </div>
  );
}
