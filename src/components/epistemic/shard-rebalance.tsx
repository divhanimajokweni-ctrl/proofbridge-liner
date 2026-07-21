"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Scale,
  ArrowRight,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NodeLoad {
  id: string;
  load: number;
}

interface RebalanceCandidate {
  shardId: string;
  region: string;
  policyName: string;
  fromNode: string;
  toNode: string;
  preservesInvariants: boolean;
  newMmrRoot: string;
}

interface RebalanceData {
  nodes: NodeLoad[];
  candidates: RebalanceCandidate[];
  totalShards: number;
  hottestNode: string;
  coolestNode: string;
}

export function ShardRebalancePanel({ onMigrated }: { onMigrated?: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<RebalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<RebalanceCandidate | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/shards/rebalance");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: RebalanceData = await r.json();
      setData(d);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [load]);

  const migrate = async (c: RebalanceCandidate) => {
    setMigrating(c.shardId);
    try {
      const r = await fetch("/api/shards/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shardId: c.shardId, toNode: c.toNode }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({
          title: "Migration rejected",
          description: d.error ?? "invariants would be violated",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Shard migrated",
          description: `${c.region}: ${c.fromNode} → ${c.toNode}`,
        });
        setConfirmCandidate(null);
        load();
        onMigrated?.();
      }
    } catch (e) {
      toast({ title: "Migration failed", description: String(e), variant: "destructive" });
    } finally {
      setMigrating(null);
    }
  };

  if (loading || !data) {
    return (
      <Card className="bg-card/60 backdrop-blur border-border/60 p-4">
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const maxLoad = Math.max(1, ...data.nodes.map((n) => n.load));
  const balanced = data.candidates.length === 0;
  const imbalance = data.nodes.length >= 2 ? data.nodes[0].load - data.nodes[data.nodes.length - 1].load : 0;

  return (
    <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
      <div className="bg-grid-fine absolute inset-0 opacity-20" />
      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-verified" />
          <h3 className="text-sm font-semibold">Shard rebalancing</h3>
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[9px] font-mono",
              balanced
                ? "border-verified/30 bg-verified/10 text-verified"
                : "border-repairing/30 bg-repairing/10 text-repairing",
            )}
          >
            {balanced ? (
              <>
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> balanced
              </>
            ) : (
              <>
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {imbalance} imbalance
              </>
            )}
          </Badge>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Invariant-aware shard migration: move shards from the hottest node to the coolest, verifying all hard invariants are preserved on the new host. Locality-preserving.
        </p>

        {/* Node load bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            <Server className="h-3 w-3" /> Node load distribution
          </div>
          {data.nodes.map((n) => {
            const isHot = n.id === data.hottestNode;
            const isCool = n.id === data.coolestNode;
            return (
              <div key={n.id} className="flex items-center gap-2">
                <span className="font-mono text-[11px] w-20 truncate shrink-0">{n.id}</span>
                <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded transition-all",
                      isHot ? "bg-violating/60" : isCool ? "bg-verified/60" : "bg-repairing/50",
                    )}
                    style={{ width: `${(n.load / maxLoad) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-semibold">
                    {n.load} shard{n.load === 1 ? "" : "s"}
                    {isHot && <span className="ml-auto text-violating">HOT</span>}
                    {isCool && <span className="ml-auto text-verified">COOL</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Migration candidates */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Zap className="h-3 w-3" /> Migration candidates · {data.candidates.length}
          </div>
          {data.candidates.length === 0 ? (
            <div className="rounded-md border border-verified/20 bg-verified/5 px-2.5 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
              <span className="text-xs text-verified">All nodes balanced — no migration needed.</span>
            </div>
          ) : (
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {data.candidates.map((c) => (
                <div
                  key={c.shardId}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                    c.preservesInvariants
                      ? "border-border/40 bg-background/40"
                      : "border-violating/30 bg-violating/5",
                  )}
                >
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono truncate">{c.region}</span>
                      <span className="text-muted-foreground text-[10px] truncate">{c.policyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono">
                      <span className="text-violating">{c.fromNode}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-verified">{c.toNode}</span>
                      {c.preservesInvariants ? (
                        <span className="text-verified ml-1">✓ invariants safe</span>
                      ) : (
                        <span className="text-violating ml-1">✗ would violate</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!c.preservesInvariants || migrating === c.shardId}
                    onClick={() => setConfirmCandidate(c)}
                    className="h-6 px-2 text-[10px] border-verified/30 bg-verified/10 text-verified hover:bg-verified/20 shrink-0"
                  >
                    <ArrowRight className="h-3 w-3 mr-0.5" />
                    migrate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={load}
            className="h-7 text-[11px] text-muted-foreground"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            recompute
          </Button>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
            {data.totalShards} shards · {data.nodes.length} nodes
          </span>
        </div>
      </div>

      {/* Confirm migration dialog */}
      <Dialog open={!!confirmCandidate} onOpenChange={(o) => !o && setConfirmCandidate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-verified" />
              Confirm shard migration
            </DialogTitle>
            <DialogDescription>
              This will migrate a shard to a different node. The runtime re-verifies all hard invariants before committing.
            </DialogDescription>
          </DialogHeader>
          {confirmCandidate && (
            <div className="space-y-2.5 py-2">
              <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-1.5">
                <Row label="Shard" value={confirmCandidate.region} mono />
                <Row label="Policy" value={confirmCandidate.policyName} mono />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-16">Route</span>
                  <span className="font-mono text-xs text-violating">{confirmCandidate.fromNode}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs text-verified">{confirmCandidate.toNode}</span>
                </div>
                <Row label="New MMR root" value={confirmCandidate.newMmrRoot} mono />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-verified/30 bg-verified/5 px-2.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
                <span className="text-xs text-verified">All hard invariants preserved — safe to migrate.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-verified/90 hover:bg-verified text-primary-foreground"
              disabled={migrating !== null}
              onClick={() => confirmCandidate && migrate(confirmCandidate)}
            >
              {migrating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Migrating…
                </>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Migrate shard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-16">{label}</span>
      <span className={cn("text-xs truncate", mono && "font-mono")}>{value}</span>
    </div>
  );
}
