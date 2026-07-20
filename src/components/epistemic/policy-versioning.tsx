"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, GitCommit, ArrowRight, RotateCcw, Clock, CheckCircle2,
  AlertTriangle, Fingerprint, User, ChevronDown, ChevronRight,
  GitCompare, Plus, Camera, ShieldCheck, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { PolicyRow } from "@/lib/types";

interface Revision { id: string; version: number; wasmFingerprint: string | null; invariantCount: number; changeSummary: string | null; author: string | null; createdAt: string }
interface RevisionsData { revisions: Revision[]; policy: { name: string; source: string; wasmFingerprint: string | null; invariantCount: number; updatedAt: string } | null }

function InvariantChange({ from, to }: { from: number; to: number }) {
  const diff = to - from;
  if (diff === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="h-2.5 w-2.5" />no change</span>;
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 text-[10px] text-verified"><TrendingUp className="h-2.5 w-2.5" />+{diff}</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] text-violating"><TrendingDown className="h-2.5 w-2.5" />{diff}</span>;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PolicyVersioningSection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [policyId, setPolicyId] = useState<string>("");
  const [data, setData] = useState<RevisionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRev, setExpandedRev] = useState<string | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [diffRevisions, setDiffRevisions] = useState<{ a: Revision; b: Revision } | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<Revision | null>(null);
  const [hoveredRev, setHoveredRev] = useState<string | null>(null);

  useEffect(() => { fetch("/api/policies").then((r) => r.json()).then((d) => { setPolicies(d.policies ?? []); if (d.policies?.[0]) setPolicyId(d.policies[0].id); }).catch(() => {}); }, []);

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try { const r = await fetch(`/api/policies/revisions?policyId=${policyId}`); if (!r.ok) throw new Error(); const d: RevisionsData = await r.json(); setData(d); setExpandedRev(d.revisions[0]?.id ?? null); }
    catch {} finally { setLoading(false); }
  }, [policyId]);

  useEffect(() => { load(); }, [load]);

  const snapshot = async () => {
    try {
      const r = await fetch("/api/policies/revisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId, changeSummary: snapshotSummary || undefined }) });
      const d = await r.json();
      if (!r.ok) toast({ title: "Snapshot failed", description: d.error, variant: "destructive" });
      else { toast({ title: "Revision snapshot saved", description: `v${d.revision.version}` }); setSnapshotOpen(false); setSnapshotSummary(""); load(); }
    } catch (e) { toast({ title: "Snapshot failed", description: String(e), variant: "destructive" }); }
  };

  const restore = async (rev: Revision) => {
    setRestoring(rev.id);
    try {
      const r = await fetch("/api/policies/revisions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revisionId: rev.id }) });
      const d = await r.json();
      if (!r.ok) toast({ title: "Restore failed", description: d.error, variant: "destructive" });
      else { toast({ title: "Policy restored", description: `Reverted to v${rev.version}` }); load(); }
    } catch (e) { toast({ title: "Restore failed", description: String(e), variant: "destructive" }); }
    finally { setRestoring(null); setRestoreConfirm(null); }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-verified/0 via-verified/50 to-verified/0" />
          <div className="bg-grid absolute inset-0 opacity-20" />
          <div className="relative flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0"><History className="h-5 w-5 text-verified" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold flex items-center gap-2">Policy Versioning<Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">revision history</Badge></h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track .epd revisions — snapshot, restore, diff any two.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Select policy" /></SelectTrigger>
                <SelectContent>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-verified/90 hover:bg-verified text-primary-foreground" onClick={() => setSnapshotOpen(true)} disabled={!policyId}>
                <Camera className="h-3.5 w-3.5 mr-1.5" />Snapshot
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Current version summary */}
      {data?.policy && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-verified/0 via-verified/40 to-verified/0" />
            <div className="bg-grid-fine absolute inset-0 opacity-20" />
            <div className="relative flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2"><GitCommit className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Current (HEAD)</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">invariants:</span><span className="font-mono text-verified">{data.policy.invariantCount}</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">fingerprint:</span><span className="font-mono text-foreground">{data.policy.wasmFingerprint ?? "—"}</span></div>
              <div className="flex items-center gap-2 text-xs"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">updated {timeAgo(data.policy.updatedAt)}</span></div>
              <Badge variant="outline" className="ml-auto text-[9px] border-verified/30 bg-verified/10 text-verified">{data.revisions.length} revision{data.revisions.length === 1 ? "" : "s"}</Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Revision timeline */}
      {loading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.revisions.length === 0 ? (
        <Card className="bg-card/60 border-dashed border-border/60 p-8 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No revisions yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Click <span className="font-mono text-verified">Snapshot</span> to capture the current version.</p>
        </Card>
      ) : (
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-repairing/0 via-repairing/30 to-repairing/0" />
          <div className="bg-grid-fine absolute inset-0 opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3"><History className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Revision history</span><span className="ml-auto text-[10px] text-muted-foreground font-mono">newest first</span></div>
            <div className="relative space-y-2">
              <motion.div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-verified/60 via-repairing/40 to-border/30" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5 }} style={{ transformOrigin: "top" }} />
              {data.revisions.map((rev, i) => {
                const isLatest = i === 0;
                const expanded = expandedRev === rev.id;
                const prevRev = data.revisions[i + 1];
                const isHovered = hoveredRev === rev.id;
                return (
                  <motion.div key={rev.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }} className="relative pl-9" onMouseEnter={() => setHoveredRev(rev.id)} onMouseLeave={() => setHoveredRev(null)}>
                    <motion.div className={cn("absolute left-[8px] top-2 h-3.5 w-3.5 rounded-full border-2 z-10 transition-all", isLatest ? "border-verified bg-verified" : expanded ? "border-repairing bg-repairing" : "border-muted-foreground bg-background")}
                      animate={{ scale: isHovered ? 1.3 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} />
                    <div className={cn("rounded-md border bg-background/40 transition-all", expanded ? "border-verified/30 shadow-[0_0_12px_-3px_var(--verified)]" : isHovered ? "border-repairing/30" : "border-border/40")}>
                      {expanded && <div className="h-[2px] bg-gradient-to-r from-verified/0 via-verified/50 to-verified/0 rounded-t-md" />}
                      <button type="button" onClick={() => setExpandedRev(expanded ? null : rev.id)} className="w-full text-left p-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="font-mono text-sm font-semibold">v{rev.version}</span>
                          {isLatest && <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified">HEAD</Badge>}
                          {prevRev && <InvariantChange from={prevRev.invariantCount} to={rev.invariantCount} />}
                          <span className="text-xs text-foreground truncate flex-1 min-w-0">{rev.changeSummary ?? "—"}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {rev.author && <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 text-[10px] text-muted-foreground"><User className="h-2.5 w-2.5" />{rev.author}</span></TooltipTrigger><TooltipContent>Author: {rev.author}</TooltipContent></Tooltip></TooltipProvider>}
                            <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(rev.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="border-t border-border/40 p-2.5 space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Meta label="invariants" value={String(rev.invariantCount)} mono icon={<ShieldCheck className="h-2.5 w-2.5 text-verified" />} />
                                <Meta label="fingerprint" value={rev.wasmFingerprint ?? "—"} mono icon={<Fingerprint className="h-2.5 w-2.5 text-muted-foreground" />} />
                                <Meta label="author" value={rev.author ?? "—"} mono icon={<User className="h-2.5 w-2.5 text-muted-foreground" />} />
                                <Meta label="created" value={formatTimestamp(rev.createdAt)} mono icon={<Clock className="h-2.5 w-2.5 text-muted-foreground" />} />
                              </div>
                              {prevRev && prevRev.invariantCount !== rev.invariantCount && (
                                <div className={cn("rounded-md border px-2.5 py-1.5 text-xs flex items-center gap-2",
                                  rev.invariantCount > prevRev.invariantCount ? "border-verified/30 bg-verified/5 text-verified" : "border-violating/30 bg-violating/5 text-violating")}>
                                  {rev.invariantCount > prevRev.invariantCount ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  <span>{prevRev.invariantCount} → {rev.invariantCount} invariants ({rev.invariantCount > prevRev.invariantCount ? "+" : ""}{rev.invariantCount - prevRev.invariantCount})</span>
                                </div>
                              )}
                              <Separator className="bg-border/40" />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {prevRev && <Button size="sm" variant="outline" className="h-7 text-[10px] border-repairing/30 bg-repairing/10 text-repairing hover:bg-repairing/20" onClick={() => setDiffRevisions({ a: prevRev, b: rev })}><GitCompare className="h-3 w-3 mr-1" />diff v{prevRev.version}→v{rev.version}</Button>}
                                <Button size="sm" variant="outline" className="h-7 text-[10px] border-verified/30 bg-verified/10 text-verified hover:bg-verified/20" onClick={() => setRestoreConfirm(rev)} disabled={restoring === rev.id || isLatest}>
                                  <RotateCcw className="h-3 w-3 mr-1" />{restoring === rev.id ? "restoring…" : isLatest ? "current" : "restore"}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Snapshot dialog */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-4 w-4 text-verified" />Snapshot current version</DialogTitle>
            <DialogDescription>Capture the current .epd source as a new revision.</DialogDescription></DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Change summary</label>
            <Textarea value={snapshotSummary} onChange={(e) => setSnapshotSummary(e.target.value)} placeholder="e.g. Tightened freq_bounds" className="min-h-[70px] text-xs" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button size="sm" variant="outline">Cancel</Button></DialogClose>
            <Button size="sm" className="bg-verified/90 hover:bg-verified text-primary-foreground" onClick={snapshot}><Plus className="h-3.5 w-3.5 mr-1.5" />Create revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation dialog */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={(open) => !open && setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-repairing" />Confirm restore</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreConfirm && (<>Are you sure you want to restore policy to <span className="font-mono font-semibold">v{restoreConfirm.version}</span>?
                {restoreConfirm.changeSummary && <span className="block mt-1 text-xs">"{restoreConfirm.changeSummary}"</span>}
                <span className="block mt-2">This will replace the current source with the snapshot from {formatTimestamp(restoreConfirm.createdAt)}.</span></>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => restoreConfirm && restore(restoreConfirm)} className="bg-verified/90 hover:bg-verified text-primary-foreground">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 inline" />Restore v{restoreConfirm?.version}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diff dialog */}
      <Dialog open={!!diffRevisions} onOpenChange={(o) => !o && setDiffRevisions(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-repairing" />Revision diff</DialogTitle>
            <DialogDescription>{diffRevisions && (<>Comparing <span className="font-mono">v{diffRevisions.a.version}</span> → <span className="font-mono">v{diffRevisions.b.version}</span></>)}</DialogDescription>
          </DialogHeader>
          {diffRevisions && (
            <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border/40 bg-background/40 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">v{diffRevisions.a.version}</div>
                  <div className="text-2xl font-mono font-bold text-foreground">{diffRevisions.a.invariantCount}</div>
                  <div className="text-[10px] text-muted-foreground">invariants</div>
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">v{diffRevisions.b.version}</div>
                  <div className={cn("text-2xl font-mono font-bold", diffRevisions.b.invariantCount > diffRevisions.a.invariantCount ? "text-verified" : diffRevisions.b.invariantCount < diffRevisions.a.invariantCount ? "text-violating" : "text-foreground")}>{diffRevisions.b.invariantCount}</div>
                  <div className="text-[10px] text-muted-foreground">invariants</div>
                </div>
              </div>
              <DiffRow label="invariants" from={String(diffRevisions.a.invariantCount)} to={String(diffRevisions.b.invariantCount)} />
              <DiffRow label="fingerprint" from={diffRevisions.a.wasmFingerprint ?? "—"} to={diffRevisions.b.wasmFingerprint ?? "—"} mono />
              <DiffRow label="summary" from={diffRevisions.a.changeSummary ?? "—"} to={diffRevisions.b.changeSummary ?? "—"} />
              <DiffRow label="author" from={diffRevisions.a.author ?? "—"} to={diffRevisions.b.author ?? "—"} />
              <DiffRow label="created" from={formatTimestamp(diffRevisions.a.createdAt)} to={formatTimestamp(diffRevisions.b.createdAt)} />
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button size="sm" variant="outline">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Meta({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className={cn("text-xs truncate mt-0.5", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function DiffRow({ label, from, to, mono }: { label: string; from: string; to: string; mono?: boolean }) {
  const changed = from !== to;
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs", changed ? "border-repairing/30 bg-repairing/5" : "border-border/40 bg-background/30")}>
      <span className="text-muted-foreground font-mono w-20 shrink-0">{label}</span>
      {changed ? (
        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
          <span className={cn("text-violating line-through opacity-70 truncate", mono && "font-mono")}>{from}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className={cn("text-verified truncate", mono && "font-mono")}>{to}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={cn("text-muted-foreground truncate", mono && "font-mono")}>{from}</span>
          <CheckCircle2 className="h-3 w-3 text-verified ml-auto shrink-0" /><span className="text-[10px] text-verified shrink-0">unchanged</span>
        </div>
      )}
    </div>
  );
}
