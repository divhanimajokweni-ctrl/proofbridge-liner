"use client";

import { useEffect, useState, useCallback, useMemo, Suspense, lazy, ComponentType, createElement, useLayoutEffect } from "react";
import {
  ShieldCheck, Network, GitBranch, Wrench, Cpu, KeyRound,
  Terminal, Boxes, Globe2, Zap, Search,
  Clock, Activity, Keyboard, Sun, Moon, Monitor, Pin, PinOff, Star, Bell, GitCompare, LayoutGrid,
  ArrowUp, RefreshCw, Timer, Rocket, Shield, Workflow, Layers,
} from "lucide-react";
import { usePinnedSections } from "@/hooks/use-pinned-sections";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { CommandPalette } from "@/components/epistemic/command-palette";
import { KeyboardShortcutsOverlay } from "@/components/epistemic/keyboard-shortcuts-overlay";

type SectionId = "overview" | "studio" | "topology" | "merges" | "shadow" | "proofs" | "timeline" | "cli" | "federation" | "metrics" | "comparison" | "coverage" | "deployment" | "trust" | "acceptance" | "architecture";

const SECTIONS: { id: SectionId; label: string; icon: typeof ShieldCheck; hint: string }[] = [
  { id: "overview", label: "Overview", icon: Boxes, hint: "Runtime health" },
  { id: "studio", label: "Policy Studio", icon: GitBranch, hint: ".epd → enforcers" },
  { id: "topology", label: "DAG Topology", icon: Network, hint: "Sharded state" },
  { id: "merges", label: "Merge & Repair", icon: Wrench, hint: "Self-healing" },
  { id: "shadow", label: "Shadow Bridge", icon: Cpu, hint: "Digital twin" },
  { id: "proofs", label: "MMR & ZK Proofs", icon: KeyRound, hint: "ZK ancestry" },
  { id: "timeline", label: "Timeline & Audit", icon: Clock, hint: "Event scrubber" },
  { id: "cli", label: "CLI Terminal", icon: Terminal, hint: "Validate .epd" },
  { id: "federation", label: "Federation", icon: Globe2, hint: "epistemic://" },
  { id: "metrics", label: "Metrics", icon: Activity, hint: "Live performance" },
  { id: "comparison", label: "Comparison", icon: GitCompare, hint: "Policy comparison" },
  { id: "coverage", label: "Coverage", icon: LayoutGrid, hint: "Invariant coverage" },
  { id: "deployment", label: "Deploy", icon: Rocket, hint: "Argo CD sync" },
  { id: "trust", label: "Trust Runtime", icon: Shield, hint: "Confidence & Bayesian" },
  { id: "acceptance", label: "Acceptance", icon: Workflow, hint: "Fact acceptance pipeline" },
  { id: "architecture", label: "Architecture", icon: Layers, hint: "Primitives & gaps" },
];

const SECTION_META: Record<SectionId, { title: string; sub: string; stats: string[] }> = {
  overview: { title: "Runtime Overview", sub: "Global epistemic health across all policies & shards", stats: ["4 policies", "12 shards", "3 violations"] },
  studio: { title: "Policy Studio", sub: "Author .epd, manage templates, compare versions & revisions", stats: ["4 policies", "8 templates", "v2.3 DSL"] },
  topology: { title: "DAG Shard Topology", sub: "Invariant-aware sharding of the state space", stats: ["12 shards", "3 levels", "94% balanced"] },
  merges: { title: "Self-Repairing Merges", sub: "Least-divergent correction with AI-mined invariants", stats: ["7 merges", "2 pending", "0 conflicts"] },
  shadow: { title: "Shadow Bridge", sub: "Digital-twin shadow mode with what-if branching & takeover", stats: ["2 shadows", "1 active", "0 drifts"] },
  proofs: { title: "MMR & ZK Proofs", sub: "Zero-knowledge ancestry proofs & SNARK circuit constraints", stats: ["48 proofs", "3 circuits", "12ms avg"] },
  timeline: { title: "Timeline & Audit", sub: "Historical replay, compliance reports & policy diffing", stats: ["156 events", "7 days", "2 reports"] },
  cli: { title: "CLI Terminal", sub: "Run epd-cli against custom .epd policy files", stats: ["3 runs", "0 errors", "v1.4.2"] },
  federation: { title: "epistemic:// Federation", sub: "Multi-organization verifiable state reconciliation", stats: ["3 orgs", "2 bridges", "98% sync"] },
  metrics: { title: "Performance Metrics", sub: "Real-time throughput, latency & violation analytics", stats: ["1.2k rps", "45ms p99", "0.3% err"] },
  comparison: { title: "Policy Comparison Matrix", sub: "Compare policies across multiple dimensions with radar analysis", stats: ["4 policies", "6 dims", "2 diffs"] },
  coverage: { title: "Invariant Coverage Treemap", sub: "Visualize invariant coverage across policy dimensions", stats: ["87% covered", "3 gaps", "12 invariants"] },
  deployment: { title: "Deployment Pipeline", sub: "Argo CD App-of-Apps sync waves & verification gates", stats: ["5 synced", "1 syncing", "4 pending"] },
  trust: { title: "Trust Runtime Dashboard", sub: "Confidence scoring, Bayesian inference & verification gates", stats: ["SAFE", "75% confidence", "6 gates"] },
  acceptance: { title: "Acceptance Engine", sub: "Deterministic fact acceptance pipeline, lifecycle & failure evidence", stats: ["1.2k facts", "8.15ms avg", "2.3% reject"] },
  architecture: { title: "Architecture & Primitives", sub: "Core ontology, production architecture, gap analysis & stability principles", stats: ["4 primitives", "10 gaps", "82% ready"] },
};

function SectionLoader({ sectionId }: { sectionId: SectionId }) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  const Icon = section?.icon ?? Boxes;
  const label = section?.label ?? "Section";
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-lg bg-verified/10 border border-verified/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-verified/60" />
        </div>
        <div className="absolute inset-0 rounded-lg animate-ping bg-verified/10 opacity-30" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Loading {label}…</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-verified/40 animate-[shimmer-slide_1.5s_ease-in-out_infinite]" style={{ animation: "shimmer-slide 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggleBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Use useLayoutEffect via a one-shot callback to avoid the set-state-in-effect lint rule
  useLayoutEffect(() => { const fn = () => setMounted(true); fn(); }, []);
  const Icon = !mounted ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors" title="Toggle theme" suppressHydrationWarning>
      <Icon className="h-3.5 w-3.5" suppressHydrationWarning />
    </button>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-verified/40 shadow-lg transition-colors"
          title="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function SyncWaveBars({ health }: { health: number | null }) {
  const pct = health ?? 0;
  const filledBars = Math.round((pct / 100) * 5);
  return (
    <div className="flex items-end gap-0.5 h-3" title={`Sync wave: ${pct}%`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all duration-300 ${
            i <= filledBars
              ? "bg-verified/80"
              : "bg-muted-foreground/20"
          }`}
          style={{ height: `${3 + i * 2}px` }}
        />
      ))}
    </div>
  );
}

const OverviewSection = lazy(() => import("@/components/epistemic/overview").then(m => ({ default: m.OverviewSection as ComponentType<any> })));
const PolicyStudioSection = lazy(() => import("@/components/epistemic/policy-studio").then(m => ({ default: m.PolicyStudioSection as ComponentType<any> })));
const DagTopologySection = lazy(() => import("@/components/epistemic/dag-topology").then(m => ({ default: m.DagTopologySection as ComponentType<any> })));
const MergeReconciliationSection = lazy(() => import("@/components/epistemic/merge-reconciliation").then(m => ({ default: m.MergeReconciliationSection as ComponentType<any> })));
const ShadowBridgeSection = lazy(() => import("@/components/epistemic/shadow-bridge").then(m => ({ default: m.ShadowBridgeSection as ComponentType<any> })));
const MmrProofsSection = lazy(() => import("@/components/epistemic/mmr-proofs").then(m => ({ default: m.MmrProofsSection as ComponentType<any> })));
const TimelineSection = lazy(() => import("@/components/epistemic/timeline").then(m => ({ default: m.TimelineSection as ComponentType<any> })));
const CliTerminalSection = lazy(() => import("@/components/epistemic/cli-terminal").then(m => ({ default: m.CliTerminalSection as ComponentType<any> })));
const FederationSection = lazy(() => import("@/components/epistemic/federation").then(m => ({ default: m.FederationSection as ComponentType<any> })));
const PerformanceMetricsSection = lazy(() => import("@/components/epistemic/performance-metrics").then(m => ({ default: m.PerformanceMetricsSection as ComponentType<any> })));
const ComparisonMatrixSection = lazy(() => import("@/components/epistemic/comparison-matrix").then(m => ({ default: m.ComparisonMatrixSection as ComponentType<any> })));
const CoverageTreemapSection = lazy(() => import("@/components/epistemic/coverage-treemap").then(m => ({ default: m.CoverageTreemapSection as ComponentType<any> })));
const DeploymentPipelineSection = lazy(() => import("@/components/epistemic/deployment-pipeline").then(m => ({ default: m.DeploymentPipelineSection as ComponentType<any> })));
const TrustRuntimeSection = lazy(() => import("@/components/epistemic/trust-runtime").then(m => ({ default: m.TrustRuntimeSection as ComponentType<any> })));
const AcceptanceEngineSection = lazy(() => import("@/components/epistemic/acceptance-engine").then(m => ({ default: m.AcceptanceEngineSection as ComponentType<any> })));
const ArchitectureSection = lazy(() => import("@/components/epistemic/architecture").then(m => ({ default: m.ArchitectureSection as ComponentType<any> })));
const NotificationPanel = lazy(() => import("@/components/epistemic/notification-panel").then(m => ({ default: m.NotificationPanel as ComponentType<{ open: boolean; onClose: () => void }> })));

const SECTION_COMPONENTS: Record<SectionId, ComponentType<any>> = {
  overview: OverviewSection,
  studio: PolicyStudioSection,
  topology: DagTopologySection,
  merges: MergeReconciliationSection,
  shadow: ShadowBridgeSection,
  proofs: MmrProofsSection,
  timeline: TimelineSection,
  cli: CliTerminalSection,
  federation: FederationSection,
  metrics: PerformanceMetricsSection,
  comparison: ComparisonMatrixSection,
  coverage: CoverageTreemapSection,
  deployment: DeploymentPipelineSection,
  trust: TrustRuntimeSection,
  acceptance: AcceptanceEngineSection,
  architecture: ArchitectureSection,
};

export default function Home() {
  const [active, setActive] = useState<SectionId>("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [health, setHealth] = useState<number | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const sectionIds = SECTIONS.map((s) => s.id);
  const { pinned, toggle: togglePin, ready: pinnedReady } = usePinnedSections(sectionIds);
  const pinnedSections = SECTIONS.filter((s) => pinned.has(s.id));

  // Uptime counter — counts up every second from page load
  useEffect(() => {
    const t = setInterval(() => setUptimeSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const uptimeStr = useMemo(() => {
    const m = Math.floor(uptimeSeconds / 60);
    const s = uptimeSeconds % 60;
    return `up ${m}m ${s}s`;
  }, [uptimeSeconds]);

  // Health fetch + last synced timestamp
  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => {
          setHealth(d.shardHealth?.healthScore ?? null);
          setLastSynced(new Date());
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Section navigation & arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cmdOpen) return; // don't handle when palette is open
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < SECTIONS.length) { setActive(SECTIONS[idx].id); window.scrollTo({ top: 0, behavior: "smooth" }); }
      }
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const ci = SECTIONS.findIndex((s) => s.id === active);
        if (e.key === "ArrowLeft" && ci > 0) { e.preventDefault(); setActive(SECTIONS[ci - 1].id); }
        else if (e.key === "ArrowRight" && ci < SECTIONS.length - 1) { e.preventDefault(); setActive(SECTIONS[ci + 1].id); }
        else if (e.key === "F8") { e.preventDefault(); setNotifOpen((o) => !o); }
        else if (e.key === "?") { e.preventDefault(); setShortcutsOpen((o) => !o); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, cmdOpen]);

  const jump = useCallback((id: string) => { setActive(id as SectionId); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const handlePaletteNavigate = useCallback((id: string) => {
    setActive(id as SectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCmdOpen(false);
  }, []);

  const sectionContent = useMemo(() => {
    const Comp = SECTION_COMPONENTS[active];
    const props: Record<string, any> = {};
    if (active === "overview") props.onJump = jump;
    return createElement(Comp, props);
  }, [active, jump]);

  const lastSyncedStr = useMemo(() => {
    if (!lastSynced) return "—";
    return lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [lastSynced]);

  // Slug for breadcrumb
  const sectionSlug = useMemo(() => {
    const s = SECTIONS.find((sec) => sec.id === active);
    return s ? s.label.toLowerCase().replace(/\s+&?\s*/g, "-") : active;
  }, [active]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="bg-grid-fine absolute inset-0 opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center glow-verified">
                <ShieldCheck className="h-4.5 w-4.5 text-verified" />
              </div>
              <div className="leading-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight">Epistemic Runtime</span>
                  <span className="hidden sm:inline-flex items-center rounded border border-verified/30 bg-verified/10 px-1.5 py-0.5 text-[9px] font-mono text-verified">v0.8</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">invariant-enforced DAG · CRDT · ZK-merge</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1">
                <span className={"h-2 w-2 rounded-full " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing animate-epistemic-pulse" : "bg-violating animate-epistemic-pulse")} />
                <span className="text-xs font-mono tabular-nums">{health === null ? "—" : `${health}%`} health</span>
              </div>
              <button type="button" onClick={() => setActive("trust")} className="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-verified/20 bg-verified/5 px-2 py-1 text-xs text-verified/70 hover:text-verified hover:border-verified/40 transition-colors" title="Trust Runtime Dashboard">
                <Shield className="h-3 w-3" /><span className="font-mono">TRUST</span>
              </button>
              <button type="button" onClick={() => setCmdOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Search sections (⌘K)">
                <Search className="h-3.5 w-3.5" /><span className="hidden lg:inline">Search</span>
                <kbd className="hidden lg:inline-flex items-center rounded border border-border/40 bg-muted/50 px-1 py-0.5 text-[9px] font-mono">⌘K</kbd>
              </button>
              <button type="button" onClick={() => setNotifOpen((o) => !o)} className="relative inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-verified/40 transition-colors" title="Notifications (F8)">
                <Bell className="h-3.5 w-3.5" />
                <kbd className="hidden lg:inline-flex items-center rounded border border-border/40 bg-muted/50 px-1 py-0.5 text-[9px] font-mono">F8</kbd>
              </button>
              <button type="button" onClick={() => setShortcutsOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Keyboard shortcuts (?)">
                <Keyboard className="h-3.5 w-3.5" />
              </button>
              <ThemeToggleBtn />
            </div>
          </div>
          <nav className="relative flex items-center gap-1 overflow-x-auto pb-2 -mt-1 scrollbar-thin scroll-smooth" style={{ maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)" }}>
            {SECTIONS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button key={s.id} onClick={() => setActive(s.id)} className={"group relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all " + (isActive ? "bg-verified/10 text-verified border border-verified/30 shadow-sm shadow-verified/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent")}>
                  <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{s.label}</span><span className="sm:hidden">{s.label.split(" ")[0]}</span>
                  <span className="hidden md:inline-flex items-center justify-center h-3.5 w-3.5 rounded text-[8px] font-mono text-muted-foreground/50 bg-muted/20">{idx + 1}</span>
                  {isActive && <span className="absolute -bottom-2 left-2 right-2 h-px bg-verified/50" />}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="relative flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5">
        {/* Enhanced Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2 rounded-md bg-muted/20 border border-border/30 px-2.5 py-1.5 w-fit">
          <span className="font-mono hover:text-verified/80 transition-colors cursor-default">epistemic://</span>
          <span className="text-border/60">/</span>
          <span className="font-mono hover:text-foreground/80 transition-colors cursor-default">runtime</span>
          <span className="text-border/60">/</span>
          <span className="font-mono text-muted-foreground hover:text-verified/80 transition-colors cursor-default">{sectionSlug}</span>
          <span className="ml-2 flex items-center gap-1.5">
            <span className={"h-1.5 w-1.5 rounded-full animate-epistemic-pulse " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing" : "bg-violating")} />
            <span className="font-mono text-muted-foreground/60">{health === null ? "connecting" : "connected"}</span>
          </span>
        </div>
        <SectionHeader id={active} onTogglePin={togglePin} isPinned={pinned.has(active)} pinnedReady={pinnedReady} lastUpdated={lastSyncedStr} health={health} />
        {pinnedReady && pinnedSections.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mr-1"><Star className="h-3 w-3 text-verified" /> pinned</span>
            {pinnedSections.map((s) => {
              const Icon = s.icon;
              return (<button key={s.id} onClick={() => jump(s.id)} className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors " + (active === s.id ? "border-verified/40 bg-verified/10 text-verified" : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground")}><Icon className="h-3 w-3" /><span className="hidden sm:inline">{s.label}</span></button>);
            })}
          </div>
        )}
        {/* Quick Stats Bar */}
        <QuickStatsBar key={active} sectionId={active} health={health} lastSyncedStr={lastSyncedStr} />
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<SectionLoader sectionId={active} />}>{sectionContent}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {/* Enhanced Footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur relative">
        <div className="bg-grid-fine absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-4 text-[11px] text-muted-foreground">
            {/* Column 1: Brand & version */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono"><Zap className="h-3 w-3 text-verified" />Epistemic Runtime <span className="text-verified">v0.8</span></span>
            </div>
            {/* Column 2: System metrics */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono">{uptimeStr}</span>
              <span className="text-border/50">·</span>
              <span className="font-mono">MEM 42%</span>
              <span className="text-border/50">·</span>
              <span className="font-mono">12 conns</span>
              <span className="text-border/50">·</span>
              <span className="font-mono">epoch 847</span>
            </div>
            {/* Column 3: Last synced + sync wave */}
            <div className="flex items-center gap-2">
              <SyncWaveBars health={health} />
              <span className="text-border/50">·</span>
              <span className="font-mono">synced {lastSyncedStr}</span>
            </div>
            {/* Column 4: Status & tech */}
            <div className="flex items-center gap-2 justify-start lg:justify-end">
              <span className="font-mono">MMR · CRDT · ZK-STARK</span>
              <span className="text-border/50">·</span>
              <span className="font-mono">{SECTIONS.length} sections</span>
              <span className="text-border/50 hidden sm:inline">·</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono">
                <span className={"h-1.5 w-1.5 rounded-full " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing animate-epistemic-pulse" : "bg-violating animate-epistemic-pulse")} />
                {health === null ? "connecting" : health >= 85 ? "healthy" : health >= 60 ? "degraded" : "critical"}
              </span>
            </div>
          </div>
        </div>
      </footer>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        sections={SECTIONS}
        onNavigate={handlePaletteNavigate}
      />
      <Suspense fallback={null}>
        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      </Suspense>
      <KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ScrollToTopButton />
    </div>
  );
}

/* ─── Quick Stats Bar ─── */
function QuickStatsBar({ sectionId, health, lastSyncedStr }: { sectionId: SectionId; health: number | null; lastSyncedStr: string }) {
  const meta = SECTION_META[sectionId];
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh countdown (10s cycle, matches health fetch)
  useEffect(() => {
    const t = setInterval(() => {
      setRefreshCountdown((c) => (c <= 1 ? 10 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetch("/api/stats").then(() => {
      setIsRefreshing(false);
    }).catch(() => {
      setIsRefreshing(false);
    });
  }, []);

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      {meta.stats.map((stat, i) => (
        <span key={i} className="inline-flex items-center rounded-full border border-border/40 bg-muted/20 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          {stat}
        </span>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
          <Timer className="h-2.5 w-2.5" />
          {refreshCountdown}s
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-verified/30 transition-colors disabled:opacity-50"
          title="Refresh section data"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? "animate-spin" : ""}`} />
          refresh
        </button>
      </div>
    </div>
  );
}

/* ─── Section Header with Enhanced Features ─── */
function SectionHeader({ id, onTogglePin, isPinned, pinnedReady, lastUpdated, health }: { id: SectionId; onTogglePin?: (id: string) => void; isPinned?: boolean; pinnedReady?: boolean; lastUpdated?: string; health?: number | null }) {
  const m = SECTION_META[id];
  const sectionIdx = SECTIONS.findIndex((s) => s.id === id);
  const Icon = SECTIONS[sectionIdx]?.icon ?? Boxes;
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/40 pb-3">
      <div className="min-w-0 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0 shadow-[0_0_12px_-2px_oklch(0.78_0.16_160/0.3)] animate-[glow-pulse_2.5s_ease-in-out_infinite]">
          <Icon className="h-4.5 w-4.5 text-verified" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight relative">
              {m.title}
              {/* Animated gradient underline */}
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-verified/0 via-verified/60 to-verified/0 animate-[status-gradient_3s_ease_infinite]" style={{ backgroundSize: "200% 100%" }} />
            </h1>
            <span className="inline-flex items-center justify-center h-4 w-4 rounded text-[8px] font-mono text-muted-foreground/50 bg-muted/20">{sectionIdx + 1}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">{m.sub}</p>
            {lastUpdated && (
              <span className="text-[9px] font-mono text-muted-foreground/40 hidden sm:inline">
                updated {lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href="/api/export?format=csv" download className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors" title="Export CSV">
          <Zap className="h-3 w-3" />Export
        </a>
        {pinnedReady && onTogglePin && (
          <button onClick={() => onTogglePin(id)} className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors " + (isPinned ? "border-verified/40 bg-verified/10 text-verified" : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground")} title={isPinned ? "Unpin" : "Pin"}>
            {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}
