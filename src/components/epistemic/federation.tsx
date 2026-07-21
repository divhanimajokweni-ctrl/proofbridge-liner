"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe2, Network, KeyRound, ShieldCheck, ArrowRight, Link2, Lock, Zap,
  Building2, Boxes, RefreshCw, CheckCircle2, AlertTriangle, Fingerprint,
  Server, Handshake, Activity, CircleDot, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FederationGossipSim } from "./gossip-sim";
import { RadarGrid, DonutChart } from "./chart-primitives";
import { containerVariants, cardVariants, itemVariants, SectionHeader, StatCard } from "./primitives";

interface FedOrg { id: string; domain: string; name: string; policyCount: number; shardCount: number; zkPolicies: number; rootHash: string; anchored: number; totalProofs: number; handshake: string; trustLevel: "verifiable" | "anchored" | "unverified"; policies: { id: string; name: string; invariantCount: number; shadowEnabled: boolean; zkEnabled: boolean; shardCount: number; proofKind: string | null }[] }
interface FedChannel { from: string; to: string; fromName: string; toName: string; kind: "zk_merge" | "mmr_reconcile" | "gossip_sync"; status: "verified" | "negotiating" | "drift"; rootHash: string }
interface FederationData { federation: FedOrg[]; channels: FedChannel[]; totals: { organizations: number; policies: number; channels: number; zkOrgs: number; globalRoot: string } }

const TRUST_META: Record<FedOrg["trustLevel"], { color: string; border: string; text: string; label: string; icon: typeof ShieldCheck; gradient: string; accentBorder: string }> = {
  verifiable: { color: "bg-verified/10", border: "border-verified/40", text: "text-verified", label: "ZK-Verifiable", icon: ShieldCheck, gradient: "from-verified/20 via-transparent to-transparent", accentBorder: "bg-gradient-to-r from-verified/60 via-verified/20 to-transparent" },
  anchored: { color: "bg-repairing/10", border: "border-repairing/40", text: "text-repairing", label: "Anchored", icon: KeyRound, gradient: "from-repairing/20 via-transparent to-transparent", accentBorder: "bg-gradient-to-r from-repairing/60 via-repairing/20 to-transparent" },
  unverified: { color: "bg-muted", border: "border-border", text: "text-muted-foreground", label: "Unverified", icon: AlertTriangle, gradient: "from-muted/20 via-transparent to-transparent", accentBorder: "bg-gradient-to-r from-muted-foreground/40 via-muted-foreground/10 to-transparent" },
};

const KIND_META: Record<FedChannel["kind"], { color: string; text: string; label: string; icon: typeof Lock }> = {
  zk_merge: { color: "bg-verified/10 border-verified/40", text: "text-verified", label: "ZK Merge", icon: Lock },
  mmr_reconcile: { color: "bg-repairing/10 border-repairing/40", text: "text-repairing", label: "MMR Reconcile", icon: KeyRound },
  gossip_sync: { color: "bg-quarantined/10 border-quarantined/40", text: "text-quarantined", label: "Gossip Sync", icon: Zap },
};

const STATUS_META: Record<FedChannel["status"], { text: string; label: string; progressPct: number }> = {
  verified: { text: "text-verified", label: "verified", progressPct: 100 },
  negotiating: { text: "text-repairing", label: "negotiating", progressPct: 60 },
  drift: { text: "text-violating", label: "drift", progressPct: 25 },
};

function AccentBorderCard({ children, className, accentBorder, ...props }: { children: React.ReactNode; className?: string; accentBorder: string } & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div className={cn("relative rounded-lg p-px", className)} {...props}>
      <div className={cn("absolute inset-0 rounded-lg", accentBorder)} style={{ opacity: 0.7 }} />
      <div className="relative rounded-lg bg-card/80 backdrop-blur h-full">{children}</div>
    </div>
  );
}

function HandshakeVisualization({ status, isActive }: { from: string; to: string; status: FedChannel["status"]; isActive: boolean }) {
  const barColor = status === "verified" ? "bg-verified/60" : status === "negotiating" ? "bg-repairing/60" : "bg-violating/60";
  return (
    <div className="flex items-center gap-1 my-1">
      <div className="h-1 flex-1 rounded-full bg-muted/30 overflow-hidden">
        {isActive && <motion.div className={cn("h-full rounded-full", barColor)} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />}
      </div>
      <motion.div animate={isActive ? { scale: [1, 1.2, 1] } : {}} transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}>
        <Handshake className={cn("h-3 w-3 shrink-0", status === "verified" ? "text-verified" : status === "negotiating" ? "text-repairing" : "text-violating")} />
      </motion.div>
      <div className="h-1 flex-1 rounded-full bg-muted/30 overflow-hidden">
        {isActive && <motion.div className={cn("h-full rounded-full", barColor)} initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />}
      </div>
    </div>
  );
}

function TrustPostureGauge({ orgs }: { orgs: FedOrg[] }) {
  const radarData = orgs.map((o) => ({
    label: o.name.length > 12 ? o.name.slice(0, 10) + "…" : o.name,
    value: o.trustLevel === "verifiable" ? 95 : o.trustLevel === "anchored" ? 60 : 25,
    max: 100,
  }));
  if (radarData.length < 3) {
    // Pad to minimum 3 for radar
    while (radarData.length < 3) radarData.push({ label: "—", value: 0, max: 100 });
  }
  return (
    <div className="w-full flex items-center justify-center">
      <RadarGrid data={radarData} size={200} color="verified" />
    </div>
  );
}

function FederationHealthGauge({ channels }: { channels: FedChannel[] }) {
  const verified = channels.filter((c) => c.status === "verified").length;
  const negotiating = channels.filter((c) => c.status === "negotiating").length;
  const drift = channels.filter((c) => c.status === "drift").length;
  const data = [{ label: "verified", value: verified, color: "verified" }, { label: "negotiating", value: negotiating, color: "repairing" }, { label: "drift", value: drift, color: "violating" }].filter((d) => d.value > 0);
  const total = verified + negotiating + drift;
  const healthPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  if (!data.length) return <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground italic">No channels</div>;
  return (
    <div className="relative flex flex-col items-center justify-center h-[120px]">
      <DonutChart data={data} size={100} thickness={14} showLabels />
      <div className="mt-1 text-center">
        <motion.div className={cn("text-lg font-bold font-mono", healthPct >= 80 ? "text-verified" : healthPct >= 50 ? "text-repairing" : "text-violating")}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>{healthPct}%</motion.div>
        <div className="text-[8px] uppercase tracking-wide text-muted-foreground">health</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded bg-muted/30 py-1"><div className="text-sm font-semibold tabular-nums">{value}</div><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div></div>;
}

function ProtoRow({ step, label, detail }: { step: string; label: string; detail: string }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ x: 3, scale: 1.01 }}
      className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-2 py-1">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-verified/15 text-verified text-[10px] font-mono font-semibold shrink-0">{step}</span>
      <div className="min-w-0 flex-1"><div className="text-xs font-medium">{label}</div><div className="font-mono text-[10px] text-muted-foreground truncate">{detail}</div></div>
    </motion.div>
  );
}

function ZKFlowStep({ from, to, proofType, status }: { from: string; to: string; proofType: string; status: "verified" | "negotiating" }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className={cn("rounded-md border px-2 py-1.5 flex items-center gap-2", status === "verified" ? "border-verified/30 bg-verified/5" : "border-repairing/30 bg-repairing/5")}>
      <Lock className={cn("h-3 w-3 shrink-0", status === "verified" ? "text-verified" : "text-repairing")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[11px]">
          <span className="font-medium truncate">{from}</span>
          <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" /></motion.span>
          <span className="font-medium truncate">{to}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mt-0.5">
          <span className="font-mono">{proofType}</span><span className={cn("font-mono uppercase", status === "verified" ? "text-verified" : "text-repairing")}>{status}</span>
        </div>
      </div>
      {status === "verified" && <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />}
      {status === "negotiating" && <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><RefreshCw className="h-3.5 w-3.5 text-repairing shrink-0" /></motion.div>}
    </motion.div>
  );
}

function OrgCard({ org }: { org: FedOrg }) {
  const tm = TRUST_META[org.trustLevel];
  const TIcon = tm.icon;
  return (
    <motion.div variants={cardVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
      <AccentBorderCard accentBorder={tm.accentBorder} className={tm.border}>
        <div className="p-3 relative overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tm.gradient)} />
          <div className="relative">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="text-sm font-semibold truncate">{org.name}</span></div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{org.handshake}</div>
              </div>
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase shrink-0", tm.color, tm.border, tm.text)}>
                <TIcon className="h-2.5 w-2.5" />{tm.label}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
              <MiniStat label="policies" value={org.policyCount} />
              <MiniStat label="shards" value={org.shardCount} />
              <MiniStat label="proofs" value={org.totalProofs} />
            </div>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {org.zkPolicies > 0 && <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] gap-0.5 px-1.5"><Lock className="h-2.5 w-2.5" /> ZK</Badge>}
              {org.anchored > 0 && <Badge variant="outline" className="border-repairing/30 bg-repairing/10 text-repairing text-[9px] gap-0.5 px-1.5 whitespace-nowrap"><KeyRound className="h-2.5 w-2.5" /> {org.anchored} anch</Badge>}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground" title={org.rootHash}>{org.rootHash.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </AccentBorderCard>
    </motion.div>
  );
}

export function FederationSection() {
  const { toast } = useToast();
  const [data, setData] = useState<FederationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [activeChannelIdx, setActiveChannelIdx] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/federation").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 12000); return () => clearInterval(t); }, [load]);

  const reconcile = async (fromDomain: string, toDomain: string, fromName: string, toName: string) => {
    setReconciling(true);
    try {
      const res = await fetch("/api/federation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromDomain, toDomain }) });
      const d = await res.json();
      if (!res.ok) { toast({ title: "Reconciliation failed", description: d.error, variant: "destructive" }); }
      else { const r = d.reconciliation; toast({ title: `${r.kind === "zk_merge" ? "ZK" : "MMR"} reconciliation complete`, description: `${fromName} ↔ ${toName} · ${r.privacy}` }); }
    } catch (e) { toast({ title: "Reconciliation failed", description: String(e), variant: "destructive" }); }
    finally { setReconciling(false); }
  };

  if (loading || !data) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div></div>;

  const { totals, federation, channels } = data;

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={cardVariants}>
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/60 via-repairing/30 to-violating/30" />
          <div className="bg-grid absolute inset-0 opacity-20" />
          <div className="relative flex flex-wrap items-center gap-4">
            <motion.div className="flex h-11 w-11 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 glow-verified shrink-0" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
              <Globe2 className="h-5 w-5 text-verified" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold flex items-center gap-2">epistemic:// Federation
                <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">verifiable state sync</Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Competing organizations reconciling operational realities — the TCP/IP of trustworthy multi-agent coordination.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Global root</div><div className="font-mono text-sm text-verified">{totals.globalRoot}</div></div>
              <div className="h-10 w-px bg-border/60" />
              <div className="text-right"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Orgs / ZK-enabled</div>
                <div className="font-mono text-sm"><span className="text-foreground">{totals.organizations}</span><span className="text-muted-foreground mx-1">/</span><span className="text-verified">{totals.zkOrgs}</span></div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Organizations" value={totals.organizations} color="text-verified" bg="bg-verified/10" border="border-verified/30" />
        <StatCard label="Policies" value={totals.policies} />
        <StatCard label="Reconcile channels" value={totals.channels} color="text-repairing" bg="bg-repairing/10" border="border-repairing/30" />
        <StatCard label="ZK-verifiable orgs" value={totals.zkOrgs} color="text-verified" bg="bg-verified/10" border="border-verified/30" />
      </motion.div>

      <motion.div variants={cardVariants}>
        <FederationGossipSim orgs={federation.map((o) => ({ id: o.id, name: o.name, zkPolicies: o.zkPolicies }))} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/50 via-repairing/30 to-violating/30" />
            <div className="bg-grid-fine absolute inset-0 opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3"><Network className="h-4 w-4 text-verified" /><h3 className="text-sm font-semibold">Federation topology</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{federation.length} peers · {channels.length} channels</span>
              </div>
              <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {federation.map((org) => <OrgCard key={org.id} org={org} />)}
              </motion.div>
              {channels.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mb-3 px-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-verified/20 to-transparent" />
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">reconciliation channels</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-verified/20 to-transparent" />
                </motion.div>
              )}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2"><Link2 className="h-3.5 w-3.5 text-repairing" /><span className="text-xs font-semibold">Cross-org reconciliation channels</span></div>
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {channels.length === 0 && <p className="text-xs text-muted-foreground italic">No channels — need ≥2 organizations.</p>}
                  {channels.map((ch, i) => {
                    const km = KIND_META[ch.kind]; const sm = STATUS_META[ch.status]; const KIcon = km.icon; const isActive = activeChannelIdx === i;
                    return (
                      <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.01, x: 2 }}
                        onMouseEnter={() => setActiveChannelIdx(i)} onMouseLeave={() => setActiveChannelIdx(null)}
                        className={cn("rounded-md border bg-background/40 px-2.5 py-1.5 transition-colors", km.color, isActive && "ring-1 ring-verified/20")}>
                        <div className="flex items-center gap-2">
                          <KIcon className={cn("h-3.5 w-3.5 shrink-0", km.text)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs"><span className="font-medium truncate">{ch.fromName}</span><ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" /><span className="font-medium truncate">{ch.toName}</span></div>
                            <div className="flex items-center gap-2 mt-0.5"><span className="font-mono text-[10px] text-muted-foreground">{ch.rootHash}</span><span className={cn("text-[10px] font-mono uppercase", sm.text)}>· {sm.label}</span></div>
                            <div className="mt-1"><Progress value={sm.progressPct} className={cn("h-1", ch.status === "verified" ? "[&>div]:bg-verified" : ch.status === "negotiating" ? "[&>div]:bg-repairing" : "[&>div]:bg-violating")} /></div>
                          </div>
                          <Button size="sm" variant="outline" disabled={reconciling}
                            onClick={() => { const f = federation.find((o) => o.id === ch.from); const t2 = federation.find((o) => o.id === ch.to); if (f && t2) reconcile(f.domain, t2.domain, f.name, t2.name); }}
                            className="h-6 px-2 text-[10px] border-verified/30 bg-verified/10 text-verified hover:bg-verified/20 shrink-0">
                            <RefreshCw className={cn("h-3 w-3 mr-1", reconciling && "animate-spin")} />reconcile
                          </Button>
                        </div>
                        {isActive && <HandshakeVisualization from={ch.fromName} to={ch.toName} status={ch.status} isActive={isActive} />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <motion.div variants={cardVariants}>
            <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/50 to-transparent" /><div className="bg-grid-fine absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2"><Server className="h-4 w-4 text-verified" /><h3 className="text-sm font-semibold">epistemic:// protocol</h3></div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">MMR ancestry proofs let any peer verify a merge without seeing full history; with ZK enabled, the proof is a SNARK over the state delta — enabling trustless, privacy-preserving reconciliation.</p>
                <div className="mt-3 space-y-1.5">
                  <ProtoRow step="1" label="handshake" detail="epistemic://<domain>/<root>" />
                  <ProtoRow step="2" label="ancestry proof" detail="MMR path + ZK-SNARK" />
                  <ProtoRow step="3" label="invariant check" detail="compiled enforcer (Wasm)" />
                  <ProtoRow step="4" label="merge" detail="least-divergent correction" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-repairing/50 to-transparent" /><div className="bg-grid-fine absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2"><Fingerprint className="h-4 w-4 text-repairing" /><h3 className="text-sm font-semibold">Trust posture</h3>
                  <Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing font-mono ml-auto">radar</Badge>
                </div>
                <TrustPostureGauge orgs={federation} />
                <div className="mt-2 space-y-1.5">
                  {federation.map((o) => { const tm = TRUST_META[o.trustLevel]; const TIcon = tm.icon; return (
                    <motion.div key={o.id} variants={itemVariants} className="flex items-center gap-2 text-xs" whileHover={{ x: 3 }}>
                      <TIcon className={cn("h-3.5 w-3.5 shrink-0", tm.text)} /><span className="truncate flex-1">{o.name}</span>
                      <span className={cn("font-mono text-[10px]", tm.text)}>{tm.label}</span>
                      {o.trustLevel === "verifiable" && <Sparkles className="h-3 w-3 text-verified" />}
                    </motion.div>
                  ); })}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/40 via-repairing/30 to-violating/30" /><div className="bg-grid-fine absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-verified" /><h3 className="text-sm font-semibold">Channel health</h3>
                  <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified font-mono ml-auto"><CircleDot className="h-2.5 w-2.5 mr-0.5" /> live</Badge>
                </div>
                <FederationHealthGauge channels={channels} />
                <div className="mt-1 flex items-center justify-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.78 0.16 160)" }} /><span className="text-muted-foreground">verified</span></div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.80 0.15 80)" }} /><span className="text-muted-foreground">negotiating</span></div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.64 0.21 25)" }} /><span className="text-muted-foreground">drift</span></div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-verified/40 to-transparent" /><div className="bg-grid-fine absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2"><Lock className="h-4 w-4 text-verified" /><h3 className="text-sm font-semibold">ZK proof exchange</h3>
                  <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified font-mono">SNARK</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">Zero-knowledge proofs enable trustless verification across organizational boundaries without revealing underlying state.</p>
                <div className="space-y-2">
                  <ZKFlowStep from={federation.find((o) => o.zkPolicies > 0)?.name ?? "Org A"} to={federation.filter((o) => o.zkPolicies > 0)[1]?.name ?? "Org B"} proofType="Groth16" status="verified" />
                  {federation.filter((o) => o.zkPolicies > 0).length > 2 && (
                    <ZKFlowStep from={federation.filter((o) => o.zkPolicies > 0)[1]?.name ?? "Org B"} to={federation.filter((o) => o.zkPolicies > 0)[2]?.name ?? "Org C"} proofType="PLONK" status="negotiating" />
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-verified" /><span>{federation.filter((o) => o.zkPolicies > 0).length} ZK-enabled orgs</span>
                  <span className="ml-auto font-mono">{channels.filter((c) => c.kind === "zk_merge").length} ZK channels</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
