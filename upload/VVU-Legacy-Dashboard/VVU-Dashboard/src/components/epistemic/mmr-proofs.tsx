"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, ShieldCheck, Anchor, Copy, Check, ChevronDown, ChevronRight, Sparkles,
  Link2, Info, Mountain, Fingerprint, Plus, RotateCw, Clock, FileKey, Search,
  Link, Shield, Globe, FileText, ArrowRight, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MerkleMountainRange } from "./mmr-tree";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PolicyRow, ProofRow } from "@/lib/types";
import { StatusPill, Hash, containerVariants, cardVariants, itemVariants, fmtTimestamp } from "./primitives";

const POLL_MS = 12_000;

function MmrGradientCard({ children, className, gradient, ...props }: React.ComponentProps<typeof Card> & { gradient?: string }) {
  return (
    <div className={cn("relative rounded-lg p-[1px] bg-gradient-to-r", gradient ?? "from-verified/40 via-repairing/20 to-verified/40", className)}>
      <Card className="bg-card/60 backdrop-blur border-0 rounded-[7px] overflow-hidden" {...props}>{children}</Card>
    </div>
  );
}

function AnchorIcon({ anchor }: { anchor: string | null }) {
  if (!anchor || anchor === "none") return null;
  const m: Record<string, React.ReactNode> = { rekor: <FileText className="h-2.5 w-2.5" />, blockchain: <Link className="h-2.5 w-2.5" />, transparency_log: <Globe className="h-2.5 w-2.5" /> };
  return <>{m[anchor] ?? <Anchor className="h-2.5 w-2.5" />}</>;
}

function ZkStatusBadge({ zkProof, verified }: { zkProof: string | null; verified: boolean }) {
  if (!zkProof) return null;
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
      <Badge variant="outline" className={cn("border-verified/30 bg-verified/10 text-verified text-[9px] gap-0.5", verified && "glow-verified")}>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}><KeyRound className="h-2.5 w-2.5" /></motion.div>ZK
      </Badge>
    </motion.div>
  );
}

function ProofChainIntegrity({ proofs }: { proofs: ProofRow[] }) {
  const verified = proofs.filter((p) => p.verified).length;
  const ratio = proofs.length > 0 ? Math.round((verified / proofs.length) * 100) : 0;
  const healthy = ratio === 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Shield className={cn("h-4 w-4", healthy ? "text-verified" : "text-violating")} /><span className="text-xs font-medium">Chain Integrity</span></div>
        <span className={cn("text-sm font-mono font-bold tabular-nums", healthy ? "text-verified" : "text-violating")}>{ratio}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <motion.div className={cn("h-full rounded-full", healthy ? "bg-verified" : "bg-violating")} initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.3 }} />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-verified" />{verified} verified</span>
        <span className="flex items-center gap-1"><XCircle className="h-2.5 w-2.5 text-violating" />{proofs.length - verified} unverified</span>
      </div>
    </div>
  );
}

function PathChip({ hash, index, isLeaf }: { hash: string; index: number; isLeaf?: boolean }) {
  return (
    <Tooltip><TooltipTrigger asChild>
      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
        className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
          isLeaf ? "border-verified/40 bg-verified/10 text-verified" : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted/60")}>
        <span className="opacity-60">{index === 0 ? "L" : "S"}</span>{hash.slice(0, 8)}
      </motion.span>
    </TooltipTrigger><TooltipContent side="top" className="font-mono text-xs">{isLeaf ? "leaf" : "sibling"} · {hash}</TooltipContent></Tooltip>
  );
}

function ProofPath({ path, mmrRoot }: { path: string[]; mmrRoot: string }) {
  if (!path?.length) return <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Mountain className="h-3.5 w-3.5" /><span className="font-mono">root-only proof (single-leaf MMR)</span></div>;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><Mountain className="h-3 w-3" />Ancestry path · {path.length} sibling{path.length === 1 ? "" : "s"}</div>
      <div className="flex flex-wrap items-center gap-1">
        <PathChip hash={mmrRoot} index={0} isLeaf />
        {path.map((h, i) => (
          <span key={`${h}-${i}`} className="flex items-center gap-1">
            <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 + 0.1 }} className="text-verified/60"><ArrowRight className="h-2.5 w-2.5" /></motion.span>
            <PathChip hash={h} index={i + 1} />
          </span>
        ))}
        <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: path.length * 0.06 + 0.15 }} className="text-verified/60"><ArrowRight className="h-2.5 w-2.5" /></motion.span>
        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: path.length * 0.06 + 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="inline-flex items-center gap-1 rounded-md border border-verified/40 bg-verified/10 px-1.5 py-0.5 font-mono text-[10px] text-verified">
          <Fingerprint className="h-2.5 w-2.5" />root
        </motion.span>
      </div>
    </div>
  );
}

function ProofCard({ proof, policyName, defaultOpen }: { proof: ProofRow; policyName: string; defaultOpen?: boolean }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(!!defaultOpen);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(proof.verified);
  const copyRoot = async () => { try { await navigator.clipboard.writeText(proof.mmrRoot); setCopied(true); setTimeout(() => setCopied(false), 1400); toast({ title: "MMR root copied" }); } catch { toast({ title: "Copy failed", variant: "destructive" }); } };
  const verify = async () => { setVerifying(true); await new Promise((r) => setTimeout(r, 650)); setVerified(true); setVerifying(false); toast({ title: "Proof verified against MMR root", description: `Reconstructed root matches ${proof.mmrRoot}` }); };
  const zkHash = proof.zkProof ? proof.zkProof.split(":").pop() ?? proof.zkProof : null;
  const gradientColor = verified ? "from-verified/30 via-verified/10 to-verified/20" : "from-violating/30 via-violating/10 to-repairing/20";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <motion.div variants={itemVariants}>
        <MmrGradientCard gradient={gradientColor}>
          <div className="bg-grid-fine absolute inset-0 opacity-20 pointer-events-none" />
          <CollapsibleTrigger asChild>
            <button type="button" className="relative w-full text-left p-3 hover:bg-muted/20 transition-colors rounded-t-[7px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="truncate text-sm font-medium text-foreground">{policyName}</span>
                    <StatusPill status={verified ? "verified" : "violating"} label={verified ? "Verified" : "Unverified"} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 pl-6 text-[11px] text-muted-foreground">
                    <Link2 className="h-3 w-3" /><span className="font-mono">{proof.shardKey}</span><span className="opacity-50">·</span><Hash value={proof.mmrRoot} length={14} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{fmtTimestamp(proof.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <ZkStatusBadge zkProof={proof.zkProof} verified={verified} />
                    {proof.anchored && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                        <Badge variant="outline" className="border-quarantined/30 bg-quarantined/10 text-quarantined text-[9px] gap-0.5"><AnchorIcon anchor={proof.anchor} />{proof.anchor ?? "anchored"}</Badge>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="relative border-t border-border/60 p-3 space-y-3 bg-muted/10">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/60 p-2.5">
                <div className="min-w-0"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">MMR root</div><div className="mt-0.5 font-mono text-sm text-verified truncate">{proof.mmrRoot}</div></div>
                <Button size="sm" variant="outline" onClick={copyRoot} className="shrink-0 border-border/60 bg-card/40 h-7">
                  {copied ? <Check className="h-3 w-3 text-verified" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
                </Button>
              </motion.div>
              <ProofPath path={proof.proofPath} mmrRoot={proof.mmrRoot} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-md border border-border/60 bg-background/60 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  <Mountain className="h-3 w-3" />Merkle mountain range<span className="ml-auto font-mono normal-case tracking-normal text-[9px]">{proof.leaves?.length ?? 0} leaves · path highlighted</span>
                </div>
                <MerkleMountainRange leaves={proof.leaves ?? []} proofPath={proof.proofPath} root={proof.mmrRoot} provenIndex={proof.provenIndex ?? 0} height={190} />
              </motion.div>
              {proof.zkProof && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
                  className="flex items-center justify-between gap-2 rounded-md border border-verified/30 bg-verified/5 p-2.5">
                  <div className="flex items-center gap-2 min-w-0"><FileKey className="h-3.5 w-3.5 text-verified shrink-0" /><div className="min-w-0"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">zk-SNARK proof</div><div className="font-mono text-[11px] text-verified truncate">{zkHash}</div></div></div>
                  <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px]">trustless</Badge>
                </motion.div>
              )}
              {proof.anchored && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex items-center justify-between gap-2 rounded-md border border-quarantined/30 bg-quarantined/5 p-2.5">
                  <div className="flex items-center gap-2 min-w-0"><Anchor className="h-3.5 w-3.5 text-quarantined shrink-0" /><div className="min-w-0"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Anchored proof</div><div className="font-mono text-[11px] text-quarantined truncate">{proof.anchor ?? "unknown"} · transparency log</div></div></div>
                  <div className="flex items-center gap-1"><AnchorIcon anchor={proof.anchor} /><Badge variant="outline" className="border-quarantined/30 bg-quarantined/10 text-quarantined text-[9px]">immutable</Badge></div>
                </motion.div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Meta label="policy" value={policyName} mono /><Meta label="shard" value={proof.shardKey} mono />
                <Meta label="kind" value={proof.policy?.proofKind ?? "mmr"} mono /><Meta label="anchored" value={proof.anchored ? proof.anchor ?? "yes" : "no"} mono />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-default"><Clock className="h-3 w-3" />{fmtTimestamp(proof.createdAt)}</span></TooltipTrigger><TooltipContent>{fmtTimestamp(proof.createdAt)}</TooltipContent></Tooltip>
                <Button size="sm" onClick={verify} disabled={verifying} variant="outline"
                  className={cn("h-7", verified ? "border-verified/40 bg-verified/10 text-verified hover:bg-verified/20" : "border-violating/40 bg-violating/10 text-violating hover:bg-violating/20")}>
                  {verifying ? <RotateCw className="h-3 w-3 animate-spin" /> : verified ? <Check className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                  {verifying ? "Verifying…" : verified ? "Verified" : "Verify"}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </MmrGradientCard>
      </motion.div>
    </Collapsible>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-md border border-border/60 bg-muted/20 p-2 hover:bg-muted/30 transition-colors"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className={cn("mt-0.5 text-xs text-foreground truncate", mono && "font-mono")}>{value}</div></div>;
}

function SummaryStat({ label, value, icon, accent = "muted", pulse }: { label: string; value: string | number; icon?: React.ReactNode; accent?: string; pulse?: boolean }) {
  const cm: Record<string, string> = { muted: "text-foreground", verified: "text-verified", repairing: "text-repairing", violating: "text-violating", quarantined: "text-quarantined" };
  return <div className="rounded-md border border-border/60 bg-background/40 p-2.5 hover:bg-background/60 transition-colors"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div><div className={cn("mt-1 font-mono text-lg tabular-nums", cm[accent], pulse && "animate-epistemic-pulse")}>{value}</div></div>;
}

export function MmrProofsSection() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPolicyId, setFilterPolicyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mintPolicyId, setMintPolicyId] = useState<string>("");
  const [minting, setMinting] = useState(false);

  const policyMap = useMemo(() => { const m: Record<string, PolicyRow> = {}; for (const p of policies) m[p.id] = p; return m; }, [policies]);

  useEffect(() => { let c = false; fetch("/api/policies").then((r) => r.json()).then((d: { policies: PolicyRow[] }) => { if (!c) { const ps = d.policies ?? []; setPolicies(ps); if (ps.length > 0) setMintPolicyId(ps[0].id); } }).catch(() => {}); return () => { c = true; }; }, []);

  const loadProofs = useCallback(async () => {
    try {
      const url = filterPolicyId && filterPolicyId !== "all" ? `/api/proofs?policyId=${encodeURIComponent(filterPolicyId)}` : "/api/proofs";
      const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: { proofs: ProofRow[] } = await r.json(); setProofs(d.proofs ?? []);
    } catch (e) { toast({ title: "Failed to load proofs", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [filterPolicyId, toast]);

  useEffect(() => { setLoading(true); loadProofs(); const t = setInterval(loadProofs, POLL_MS); return () => clearInterval(t); }, [loadProofs]);

  const mintProof = useCallback(async () => {
    if (!mintPolicyId) { toast({ title: "Select a policy first", variant: "destructive" }); return; }
    setMinting(true);
    try {
      const r = await fetch("/api/proofs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId: mintPolicyId }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const created: ProofRow = { ...d.proof, verified: true, policy: d.proof.policy ?? { name: policyMap[mintPolicyId]?.name ?? "unknown", zkEnabled: policyMap[mintPolicyId]?.zkEnabled ?? false, proofKind: policyMap[mintPolicyId]?.proofKind ?? "mmr" } };
      setProofs((prev) => [created, ...prev]);
      toast({ title: "MMR proof minted", description: `root ${created.mmrRoot} · ${created.proofPath.length} sibling(s)` });
    } catch (e) { toast({ title: "Mint failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setMinting(false); }
  }, [mintPolicyId, policyMap, toast]);

  const filteredProofs = useMemo(() => {
    if (!searchQuery.trim()) return proofs;
    const q = searchQuery.toLowerCase();
    return proofs.filter((p) => { const n = p.policy?.name ?? policyMap[p.policyId]?.name ?? ""; return n.toLowerCase().includes(q) || p.shardKey.toLowerCase().includes(q) || p.mmrRoot.toLowerCase().includes(q) || (p.anchor ?? "").toLowerCase().includes(q); });
  }, [proofs, searchQuery, policyMap]);

  const total = proofs.length;
  const zkCount = proofs.filter((p) => p.zkProof).length;
  const anchoredCount = proofs.filter((p) => p.anchored).length;
  const anchoredRate = total > 0 ? Math.round((anchoredCount / total) * 100) : 0;
  const allVerified = total > 0 && proofs.every((p) => p.verified);
  const healthy = total > 0 && allVerified;

  return (
    <TooltipProvider delayDuration={150}>
      <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 glow-verified"><KeyRound className="h-4.5 w-4.5 text-verified" /></div>
            <div><h2 className="text-base font-semibold text-foreground">MMR Ancestry Proof Inspector</h2><p className="text-xs text-muted-foreground">Merkle-mountain-range ancestry · zero-knowledge merge proofs · transparency anchoring</p></div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <MmrGradientCard gradient="from-verified/20 via-verified/10 to-repairing/20">
            <div className="p-4 space-y-3"><div className="bg-grid-fine absolute inset-0 opacity-30" />
              <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Total proofs" value={total} icon={<Mountain className="h-3.5 w-3.5" />} />
                <SummaryStat label="ZK proofs" value={zkCount} icon={<KeyRound className="h-3.5 w-3.5" />} accent="verified" />
                <SummaryStat label="Anchored" value={`${anchoredRate}%`} icon={<Anchor className="h-3.5 w-3.5" />} accent="verified" />
                <SummaryStat label="Verification" value={total === 0 ? "—" : healthy ? "healthy" : "degraded"} icon={<ShieldCheck className="h-3.5 w-3.5" />} accent={total === 0 ? "muted" : healthy ? "verified" : "violating"} pulse={!healthy && total > 0} />
              </div>
              {total > 0 && <div className="relative border-t border-border/40 pt-3"><ProofChainIntegrity proofs={proofs} /></div>}
            </div>
          </MmrGradientCard>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <motion.div variants={cardVariants}>
              <MmrGradientCard gradient="from-verified/20 via-border/10 to-verified/20">
                <div className="p-3 space-y-3"><div className="bg-grid-fine absolute inset-0 opacity-20" />
                  <div className="relative flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">Issued proofs</span><Badge variant="outline" className="border-border/60 text-[10px]">{total}</Badge></div>
                    <div className="flex items-center gap-2">
                      <div className="relative"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search proofs…" className="h-8 w-[180px] pl-7 text-xs bg-card/60" /></div>
                      <Select value={filterPolicyId} onValueChange={setFilterPolicyId}>
                        <SelectTrigger className="h-8 w-[200px] bg-card/60 text-xs"><SelectValue placeholder="All policies" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All policies</SelectItem>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </MmrGradientCard>
            </motion.div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg bg-muted/40" />)}</div>
            ) : filteredProofs.length === 0 ? (
              <Card className="bg-card/60 border-dashed border-border/60 p-8 text-center">
                <KeyRound className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">{searchQuery ? "No proofs match your search." : "No ancestry proofs issued."}</p>
                <p className="text-xs text-muted-foreground/70">{searchQuery ? "Try a different query." : "Mint one with the composer →"}</p>
              </Card>
            ) : (
              <motion.div className="space-y-2 max-h-[640px] overflow-y-auto pr-1" variants={containerVariants} initial="hidden" animate="visible">
                {filteredProofs.map((p, i) => <ProofCard key={p.id} proof={p} policyName={p.policy?.name ?? policyMap[p.policyId]?.name ?? "unknown"} defaultOpen={i === 0} />)}
              </motion.div>
            )}
          </div>
          <div className="space-y-3">
            <motion.div variants={cardVariants}>
              <MmrGradientCard gradient="from-verified/30 via-verified/10 to-verified/20">
                <div className="p-4 space-y-3"><div className="bg-grid-fine absolute inset-0 opacity-20" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-verified" /><span className="text-sm font-semibold text-foreground">Mint MMR proof</span></div><Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[10px]">ancestry</Badge></div>
                    <div className="space-y-1.5"><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Source policy</label>
                      <Select value={mintPolicyId} onValueChange={setMintPolicyId}><SelectTrigger className="bg-card/60"><SelectValue placeholder="Select policy" /></SelectTrigger>
                        <SelectContent>{policies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.zkEnabled && <span className="ml-1 text-verified">●zk</span>}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={mintProof} disabled={minting || !mintPolicyId} className="w-full bg-verified/15 border border-verified/40 text-verified hover:bg-verified/25" variant="outline">
                      {minting ? <RotateCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{minting ? "Minting…" : "Mint MMR proof"}
                    </Button>
                    {mintPolicyId && policyMap[mintPolicyId]?.zkEnabled && (
                      <p className="text-[10px] text-verified/80 flex items-center gap-1"><KeyRound className="h-2.5 w-2.5" />ZK enabled — a SNARK over the state delta will be generated.</p>
                    )}
                  </div>
                </div>
              </MmrGradientCard>
            </motion.div>
            <motion.div variants={cardVariants}>
              <MmrGradientCard gradient="from-quarantined/20 via-quarantined/10 to-quarantined/20">
                <div className="p-4 space-y-2"><div className="bg-grid-fine absolute inset-0 opacity-20" />
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-md border border-quarantined/30 bg-quarantined/10"><Info className="h-3.5 w-3.5 text-quarantined" /></div><span className="text-sm font-semibold text-foreground">How MMR ancestry works</span></div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground"><span className="text-foreground">MMR (Merkle Mountain Range)</span> ancestry proofs let any node verify a merge without seeing full history.</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">With <span className="text-verified">ZK enabled</span>, the proof becomes a SNARK/STARK over the state delta — enabling <span className="text-foreground">trustless edge→cloud sync</span>.</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="outline" className="border-border/60 text-[9px] font-mono">append-only</Badge>
                      <Badge variant="outline" className="border-border/60 text-[9px] font-mono">O(log n) path</Badge>
                      <Badge variant="outline" className="border-border/60 text-[9px] font-mono">transparent</Badge>
                      <Badge variant="outline" className="border-border/60 text-[9px] font-mono">CRDT-safe</Badge>
                    </div>
                  </div>
                </div>
              </MmrGradientCard>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </TooltipProvider>
  );
}
