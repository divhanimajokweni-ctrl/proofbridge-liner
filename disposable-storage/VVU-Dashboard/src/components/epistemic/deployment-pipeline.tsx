"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Rocket, CheckCircle2, AlertTriangle, XCircle, Circle, ChevronDown,
  ArrowRight, Clock, ShieldCheck, Activity, RefreshCw, Layers,
  GitBranch, Terminal, Database, KeyRound, Cpu, Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GradientBorderCard, StatusPill, Hash, containerVariants, cardVariants, itemVariants,
  GridOverlay, TopAccentBar, SeverityDot, StatCard, SectionHeader,
} from "./primitives";
import { SparkLine, MetricGauge } from "./chart-primitives";

/* ─── Types ─── */
type WaveStatus = "synced" | "syncing" | "out-of-sync" | "pending";

interface Wave {
  wave: number;
  name: string;
  components: string[];
  status: WaveStatus;
}

/* ─── Mock Data ─── */
const WAVES: Wave[] = [
  { wave: -5, name: "Namespaces", components: ["argocd", "database", "messaging", "epistemic", "verification"], status: "synced" },
  { wave: -4, name: "CRDs", components: ["cert-manager", "ingress", "monitoring"], status: "synced" },
  { wave: -3, name: "Operators", components: ["cert-manager-operator", "ingress-nginx", "prometheus-operator"], status: "synced" },
  { wave: -2, name: "Infrastructure", components: ["storage-classes", "networking", "monitoring-dashboards"], status: "synced" },
  { wave: -1, name: "Databases", components: ["postgresql-primary", "redis-cache", "wal-g-backup"], status: "synced" },
  { wave: 0, name: "Messaging", components: ["nats-core", "kafka-streaming"], status: "syncing" },
  { wave: 1, name: "Secrets", components: ["sealed-secrets", "external-secrets"], status: "pending" },
  { wave: 2, name: "Verification", components: ["type-check", "lint", "build", "qa-pipeline"], status: "pending" },
  { wave: 3, name: "Platform Core", components: ["runtime-engine", "projector", "governance", "shadow-bridge"], status: "pending" },
  { wave: 4, name: "Applications", components: ["production", "staging", "development"], status: "pending" },
];

interface DeployedApp {
  name: string;
  namespace: string;
  syncStatus: WaveStatus;
  healthStatus: "healthy" | "degraded" | "progressing" | "missing";
  lastDeployed: string;
  wave: number;
}

const DEPLOYED_APPS: DeployedApp[] = [
  { name: "argocd", namespace: "argocd", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:30:00Z", wave: -5 },
  { name: "database", namespace: "epistemic", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:31:00Z", wave: -5 },
  { name: "messaging", namespace: "epistemic", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:32:00Z", wave: -5 },
  { name: "cert-manager", namespace: "cert-manager", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:33:00Z", wave: -4 },
  { name: "ingress-nginx", namespace: "ingress-nginx", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:34:00Z", wave: -3 },
  { name: "postgresql-primary", namespace: "epistemic", syncStatus: "synced", healthStatus: "healthy", lastDeployed: "2025-01-15T08:35:00Z", wave: -1 },
  { name: "redis-cache", namespace: "epistemic", syncStatus: "synced", healthStatus: "degraded", lastDeployed: "2025-01-15T08:35:30Z", wave: -1 },
  { name: "nats-core", namespace: "epistemic", syncStatus: "syncing", healthStatus: "progressing", lastDeployed: "2025-01-15T08:36:00Z", wave: 0 },
  { name: "kafka-streaming", namespace: "epistemic", syncStatus: "syncing", healthStatus: "progressing", lastDeployed: "2025-01-15T08:36:15Z", wave: 0 },
  { name: "sealed-secrets", namespace: "epistemic", syncStatus: "pending", healthStatus: "missing", lastDeployed: "—", wave: 1 },
  { name: "external-secrets", namespace: "epistemic", syncStatus: "pending", healthStatus: "missing", lastDeployed: "—", wave: 1 },
  { name: "runtime-engine", namespace: "epistemic", syncStatus: "pending", healthStatus: "missing", lastDeployed: "—", wave: 3 },
  { name: "production", namespace: "epistemic", syncStatus: "pending", healthStatus: "missing", lastDeployed: "—", wave: 4 },
];

interface SyncEvent {
  id: string;
  timestamp: string;
  wave: number;
  action: string;
  result: "success" | "failure" | "in-progress";
  duration: string;
  triggeredBy: string;
}

const SYNC_HISTORY: SyncEvent[] = [
  { id: "s-001", timestamp: "2025-01-15T08:30:00Z", wave: -5, action: "Auto-sync", result: "success", duration: "12s", triggeredBy: "git-push" },
  { id: "s-002", timestamp: "2025-01-15T08:31:00Z", wave: -4, action: "Auto-sync", result: "success", duration: "8s", triggeredBy: "git-push" },
  { id: "s-003", timestamp: "2025-01-15T08:32:00Z", wave: -3, action: "Auto-sync", result: "success", duration: "15s", triggeredBy: "git-push" },
  { id: "s-004", timestamp: "2025-01-15T08:33:00Z", wave: -2, action: "Auto-sync", result: "success", duration: "6s", triggeredBy: "git-push" },
  { id: "s-005", timestamp: "2025-01-15T08:34:00Z", wave: -1, action: "Auto-sync", result: "success", duration: "18s", triggeredBy: "git-push" },
  { id: "s-006", timestamp: "2025-01-15T08:35:00Z", wave: 0, action: "Auto-sync", result: "in-progress", duration: "—", triggeredBy: "git-push" },
  { id: "s-007", timestamp: "2025-01-15T07:15:00Z", wave: -5, action: "Manual sync", result: "success", duration: "14s", triggeredBy: "admin" },
  { id: "s-008", timestamp: "2025-01-15T06:00:00Z", wave: -3, action: "Auto-sync", result: "failure", duration: "22s", triggeredBy: "git-push" },
  { id: "s-009", timestamp: "2025-01-15T05:45:00Z", wave: -1, action: "Retry", result: "success", duration: "16s", triggeredBy: "auto-retry" },
  { id: "s-010", timestamp: "2025-01-14T22:30:00Z", wave: 0, action: "Manual sync", result: "failure", duration: "30s", triggeredBy: "admin" },
];

/* ─── Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const secV: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const expandV: Variants = { collapsed: { height: 0, opacity: 0 }, expanded: { height: "auto", opacity: 1, transition: { duration: 0.3 } } };

/* ─── Helpers ─── */
function statusToPillStatus(status: WaveStatus): "verified" | "repairing" | "violating" | "pending" {
  if (status === "synced") return "verified";
  if (status === "syncing") return "repairing";
  if (status === "out-of-sync") return "violating";
  return "pending";
}

function healthToLabel(h: DeployedApp["healthStatus"]): string {
  const map: Record<string, string> = { healthy: "Healthy", degraded: "Degraded", progressing: "Progressing", missing: "Missing" };
  return map[h] ?? h;
}

function healthToStatus(h: DeployedApp["healthStatus"]): "healthy" | "repairing" | "violating" | "idle" {
  const map: Record<string, "healthy" | "repairing" | "violating" | "idle"> = { healthy: "healthy", degraded: "repairing", progressing: "repairing", missing: "idle" };
  return map[h] ?? "idle";
}

function resultIcon(r: SyncEvent["result"]) {
  if (r === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-verified" />;
  if (r === "failure") return <XCircle className="h-3.5 w-3.5 text-violating" />;
  return <RefreshCw className="h-3.5 w-3.5 text-repairing animate-spin" />;
}

function fmtTime(iso: string): string {
  if (iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtRelative(iso: string): string {
  if (iso === "—") return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Sub-components ─── */

function WaveIcon({ status }: { status: WaveStatus }) {
  if (status === "synced") return <CheckCircle2 className="h-4 w-4 text-verified" />;
  if (status === "syncing") return <RefreshCw className="h-4 w-4 text-repairing animate-spin" />;
  if (status === "out-of-sync") return <XCircle className="h-4 w-4 text-violating" />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

function WaveCard({ wave, isExpanded, onToggle }: { wave: Wave; isExpanded: boolean; onToggle: () => void }) {
  const borderColor = wave.status === "synced"
    ? "border-verified/30"
    : wave.status === "syncing"
    ? "border-repairing/30"
    : wave.status === "out-of-sync"
    ? "border-violating/30"
    : "border-border/40";

  const bgColor = wave.status === "synced"
    ? "bg-verified/5"
    : wave.status === "syncing"
    ? "bg-repairing/5"
    : wave.status === "out-of-sync"
    ? "bg-violating/5"
    : "bg-muted/10";

  const glowClass = wave.status === "syncing"
    ? "shadow-[0_0_16px_-4px_oklch(0.75_0.15_80/0.25)]"
    : wave.status === "out-of-sync"
    ? "shadow-[0_0_16px_-4px_oklch(0.65_0.2_25/0.25)]"
    : "";

  return (
    <div className="flex flex-col items-center gap-0">
      <motion.button
        type="button"
        onClick={onToggle}
        className={`relative flex flex-col items-center gap-1.5 rounded-lg border ${borderColor} ${bgColor} ${glowClass} px-3 py-2.5 min-w-[90px] transition-all hover:scale-105 cursor-pointer`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground/60">wave</span>
          <span className="text-xs font-bold font-mono">{wave.wave}</span>
        </div>
        <WaveIcon status={wave.status} />
        <span className="text-[10px] font-medium text-center leading-tight">{wave.name}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </motion.button>
      {/* Animated connector line */}
      {wave.wave < 4 && (
        <div className="flex items-center justify-center mt-2">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

function WaveDetails({ wave }: { wave: Wave }) {
  return (
    <motion.div variants={expandV} initial="collapsed" animate="expanded" exit="collapsed" className="overflow-hidden">
      <div className="mt-3 rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <StatusPill status={statusToPillStatus(wave.status)} />
          <span className="text-xs text-muted-foreground">{wave.components.length} components</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {wave.components.map((comp) => (
            <div key={comp} className="flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2 py-1">
              <SeverityDot severity={wave.status === "synced" ? "low" : wave.status === "syncing" ? "high" : wave.status === "out-of-sync" ? "critical" : "medium"} />
              <span className="text-[10px] font-mono truncate">{comp}</span>
            </div>
          ))}
        </div>
        {/* Health checks mock */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
            <ShieldCheck className="h-3 w-3 text-verified" /> All health checks passing
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
            <Clock className="h-3 w-3" /> Last synced 2m ago
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function DeploymentHealthBar({ waves }: { waves: Wave[] }) {
  const synced = waves.filter((w) => w.status === "synced").length;
  const syncing = waves.filter((w) => w.status === "syncing").length;
  const total = waves.length;
  const pct = Math.round(((synced + syncing * 0.5) / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Deployment Health</span>
        <span className="text-sm font-bold font-mono text-verified">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 160), oklch(0.75 0.15 80))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
          <span className="h-2 w-2 rounded-full bg-verified" /> {synced} synced
        </span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
          <span className="h-2 w-2 rounded-full bg-repairing animate-pulse" /> {syncing} syncing
        </span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> {total - synced - syncing} pending
        </span>
      </div>
    </div>
  );
}

function ApplicationList({ apps }: { apps: DeployedApp[] }) {
  const [filter, setFilter] = useState<WaveStatus | "all">("all");
  const filtered = filter === "all" ? apps : apps.filter((a) => a.syncStatus === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Filter:</span>
        {(["all", "synced", "syncing", "pending"] as const).map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f)}
            className={`h-6 px-2 text-[10px] font-mono ${filter === f ? "bg-verified/10 text-verified border border-verified/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            <Badge variant="secondary" className="ml-1 h-3.5 px-1 text-[8px]">
              {f === "all" ? apps.length : apps.filter((a) => a.syncStatus === f).length}
            </Badge>
          </Button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          {filtered.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2 hover:border-border/60 hover:bg-background/50 transition-all"
            >
              <div className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center border ${
                app.syncStatus === "synced" ? "bg-verified/10 border-verified/30" :
                app.syncStatus === "syncing" ? "bg-repairing/10 border-repairing/30" :
                "bg-muted/20 border-border/40"
              }`}>
                {app.syncStatus === "synced" ? <CheckCircle2 className="h-3.5 w-3.5 text-verified" /> :
                 app.syncStatus === "syncing" ? <RefreshCw className="h-3.5 w-3.5 text-repairing animate-spin" /> :
                 <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{app.name}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/50">ns:{app.namespace}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono">wave {app.wave}</span>
                  <span className="text-border/40">·</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{fmtRelative(app.lastDeployed)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={statusToPillStatus(app.syncStatus)} />
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  app.healthStatus === "healthy" ? "border-verified/30 bg-verified/10 text-verified" :
                  app.healthStatus === "degraded" ? "border-repairing/30 bg-repairing/10 text-repairing" :
                  app.healthStatus === "progressing" ? "border-repairing/30 bg-repairing/10 text-repairing" :
                  "border-border bg-muted text-muted-foreground"
                }`}>
                  {healthToLabel(app.healthStatus)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncHistoryTimeline({ events }: { events: SyncEvent[] }) {
  return (
    <div className="max-h-80 overflow-y-auto custom-scrollbar">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/40" />
        <div className="space-y-0">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex items-start gap-3 pl-8 pb-4"
            >
              {/* Timeline dot */}
              <div className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                event.result === "success" ? "bg-verified" :
                event.result === "failure" ? "bg-violating" :
                "bg-repairing animate-pulse"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {resultIcon(event.result)}
                  <span className="text-xs font-medium">{event.action}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/50">wave {event.wave}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono">{fmtTime(event.timestamp)}</span>
                  <span className="text-border/40">·</span>
                  <span className="text-[10px] text-muted-foreground font-mono">by {event.triggeredBy}</span>
                  <span className="text-border/40">·</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{event.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section Component ─── */
export function DeploymentPipelineSection() {
  const [expandedWave, setExpandedWave] = useState<number | null>(null);

  const overallHealth = useMemo(() => {
    const synced = WAVES.filter((w) => w.status === "synced").length;
    const syncing = WAVES.filter((w) => w.status === "syncing").length;
    return Math.round(((synced + syncing * 0.5) / WAVES.length) * 100);
  }, []);

  const syncStats = useMemo(() => ({
    synced: WAVES.filter((w) => w.status === "synced").length,
    syncing: WAVES.filter((w) => w.status === "syncing").length,
    pending: WAVES.filter((w) => w.status === "pending").length,
    outOfSync: WAVES.filter((w) => w.status === "out-of-sync").length,
  }), []);

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={cv}>
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Synced Waves" value={syncStats.synced} color="text-verified" bg="bg-verified/5" border="border-verified/20" />
        <StatCard label="Syncing" value={syncStats.syncing} color="text-repairing" bg="bg-repairing/5" border="border-repairing/20" />
        <StatCard label="Pending" value={syncStats.pending} color="text-muted-foreground" bg="bg-muted/20" border="border-border/40" />
        <StatCard label="Total Apps" value={DEPLOYED_APPS.length} color="text-foreground" bg="bg-muted/20" border="border-border/40" />
      </div>

      {/* ── Sync Wave Visualization ── */}
      <motion.div variants={secV}>
        <GradientBorderCard gradient="from-verified/30 via-repairing/20 to-violating/10" className="overflow-hidden">
          <div className="relative p-4 sm:p-5">
            <TopAccentBar color="oklch(0.78 0.16 160)" />
            <GridOverlay opacity="opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verified/10 border border-verified/30">
                  <Layers className="h-3.5 w-3.5 text-verified" />
                </div>
                <h3 className="text-sm font-semibold">Sync Wave Pipeline</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">Argo CD App-of-Apps</span>
              </div>

              {/* Horizontal wave pipeline */}
              <div className="overflow-x-auto custom-scrollbar pb-2">
                <div className="flex items-start gap-2 min-w-max">
                  {WAVES.map((wave) => (
                    <div key={wave.wave} className="flex flex-col">
                      <WaveCard
                        wave={wave}
                        isExpanded={expandedWave === wave.wave}
                        onToggle={() => setExpandedWave(expandedWave === wave.wave ? null : wave.wave)}
                      />
                      <AnimatePresence>
                        {expandedWave === wave.wave && <WaveDetails wave={wave} />}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Health Bar */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <DeploymentHealthBar waves={WAVES} />
              </div>
            </div>
          </div>
        </GradientBorderCard>
      </motion.div>

      {/* ── Application List + Sync History ── */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-4" variants={secV}>
        {/* Application List */}
        <motion.div className="lg:col-span-3" variants={cardV}>
          <GradientBorderCard gradient="from-verified/20 via-repairing/10 to-transparent" className="h-full">
            <div className="relative p-4">
              <TopAccentBar color="oklch(0.78 0.16 160 / 0.5)" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10"><Activity className="h-3.5 w-3.5 text-verified" /></div>
                  <h3 className="text-sm font-semibold">Deployed Applications</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{DEPLOYED_APPS.length} total</span>
                </div>
                <ApplicationList apps={DEPLOYED_APPS} />
              </div>
            </div>
          </GradientBorderCard>
        </motion.div>

        {/* Sync History */}
        <motion.div className="lg:col-span-2" variants={cardV}>
          <GradientBorderCard gradient="from-repairing/20 via-verified/10 to-transparent" className="h-full">
            <div className="relative p-4">
              <TopAccentBar color="oklch(0.75 0.15 80 / 0.5)" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-repairing/10"><Clock className="h-3.5 w-3.5 text-repairing" /></div>
                  <h3 className="text-sm font-semibold">Sync History</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{SYNC_HISTORY.length} events</span>
                </div>
                <SyncHistoryTimeline events={SYNC_HISTORY} />
              </div>
            </div>
          </GradientBorderCard>
        </motion.div>
      </motion.div>

      {/* ── Pipeline Metrics Row ── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" variants={secV}>
        <motion.div variants={cardV}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/60 p-4 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 to-transparent" />
            <div className="flex items-center gap-3">
              <MetricGauge value={overallHealth} max={100} label="Health" color="var(--verified)" size={70} />
              <div>
                <span className="text-xs text-muted-foreground">Deployment</span>
                <p className="text-sm font-semibold">Pipeline Health</p>
                <span className="text-[9px] text-muted-foreground font-mono">{syncStats.synced}/{WAVES.length} waves complete</span>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={cardV}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/60 p-4 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-repairing/40 to-transparent" />
            <div className="flex items-center gap-3">
              <SparkLine data={[65, 70, 68, 75, 80, 78, 82, 85, 83, 88, 85, 90]} width={100} height={40} color="var(--repairing)" fill />
              <div>
                <span className="text-xs text-muted-foreground">Sync</span>
                <p className="text-sm font-semibold">Rollout Progress</p>
                <span className="text-[9px] text-muted-foreground font-mono">avg 12s per wave</span>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={cardV}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/60 p-4 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 to-transparent" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Components</span>
              <span className="text-2xl font-bold font-mono tabular-nums">{WAVES.reduce((sum, w) => sum + w.components.length, 0)}</span>
              <span className="text-[9px] text-muted-foreground font-mono">across {WAVES.length} waves</span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={cardV}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/60 p-4 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/40 to-transparent" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Last Sync</span>
              <span className="text-sm font-semibold font-mono">2m ago</span>
              <span className="text-[9px] text-verified font-mono">auto-sync active</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
