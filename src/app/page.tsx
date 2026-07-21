"use client";

import { useEffect, useState, useCallback, useMemo, Suspense, lazy, ComponentType, createElement } from "react";
import {
  ShieldCheck, Network, GitBranch, Wrench, Cpu, KeyRound,
  Terminal, Boxes, Globe2, Zap, Search,
  Clock, Activity, Keyboard, Sun, Moon, Monitor, Pin, PinOff, Star, Bell, GitCompare, LayoutGrid,
} from "lucide-react";
import { usePinnedSections } from "@/hooks/use-pinned-sections";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { CommandPalette } from "@/components/epistemic/command-palette";
import { KeyboardShortcutsOverlay } from "@/components/epistemic/keyboard-shortcuts-overlay";

type SectionId = "overview" | "studio" | "topology" | "merges" | "shadow" | "proofs" | "timeline" | "cli" | "federation" | "metrics" | "comparison" | "coverage";

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
];

const SECTION_META: Record<SectionId, { title: string; sub: string }> = {
  overview: { title: "Runtime Overview", sub: "Global epistemic health across all policies & shards" },
  studio: { title: "Policy Studio", sub: "Author .epd, manage templates, compare versions & revisions" },
  topology: { title: "DAG Shard Topology", sub: "Invariant-aware sharding of the state space" },
  merges: { title: "Self-Repairing Merges", sub: "Least-divergent correction with AI-mined invariants" },
  shadow: { title: "Shadow Bridge", sub: "Digital-twin shadow mode with what-if branching & takeover" },
  proofs: { title: "MMR & ZK Proofs", sub: "Zero-knowledge ancestry proofs & SNARK circuit constraints" },
  timeline: { title: "Timeline & Audit", sub: "Historical replay, compliance reports & policy diffing" },
  cli: { title: "CLI Terminal", sub: "Run epd-cli against custom .epd policy files" },
  federation: { title: "epistemic:// Federation", sub: "Multi-organization verifiable state reconciliation" },
  metrics: { title: "Performance Metrics", sub: "Real-time throughput, latency & violation analytics" },
  comparison: { title: "Policy Comparison Matrix", sub: "Compare policies across multiple dimensions with radar analysis" },
  coverage: { title: "Invariant Coverage Treemap", sub: "Visualize invariant coverage across policy dimensions" },
};

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-verified" />
        <span className="text-sm">Loading section…</span>
      </div>
    </div>
  );
}

function ThemeToggleBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : resolvedTheme === "light" ? Sun : Monitor;
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors" title="Toggle theme" suppressHydrationWarning>
      <Icon className="h-3.5 w-3.5" />
    </button>
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
};

export default function Home() {
  const [active, setActive] = useState<SectionId>("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [health, setHealth] = useState<number | null>(null);
  const sectionIds = SECTIONS.map((s) => s.id);
  const { pinned, toggle: togglePin, ready: pinnedReady } = usePinnedSections(sectionIds);
  const pinnedSections = SECTIONS.filter((s) => pinned.has(s.id));

  useEffect(() => {
    const load = () =>
      fetch("/api/stats").then((r) => r.json()).then((d) => setHealth(d.shardHealth?.healthScore ?? null)).catch(() => {});
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
                  <span className="hidden sm:inline-flex items-center rounded border border-verified/30 bg-verified/10 px-1.5 py-0.5 text-[9px] font-mono text-verified">v0.5</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">invariant-enforced DAG · CRDT · ZK-merge</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1">
                <span className={"h-2 w-2 rounded-full " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing animate-epistemic-pulse" : "bg-violating animate-epistemic-pulse")} />
                <span className="text-xs font-mono tabular-nums">{health === null ? "—" : `${health}%`} health</span>
              </div>
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
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
          <span className="font-mono">epistemic://</span><span className="text-border/60">/</span><span className="font-mono text-muted-foreground">{active}</span>
          <span className="ml-auto flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-verified/60 animate-epistemic-pulse" /><span className="font-mono">live</span></span>
        </div>
        <SectionHeader id={active} onTogglePin={togglePin} isPinned={pinned.has(active)} pinnedReady={pinnedReady} />
        {pinnedReady && pinnedSections.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mr-1"><Star className="h-3 w-3 text-verified" /> pinned</span>
            {pinnedSections.map((s) => {
              const Icon = s.icon;
              return (<button key={s.id} onClick={() => jump(s.id)} className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors " + (active === s.id ? "border-verified/40 bg-verified/10 text-verified" : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground")}><Icon className="h-3 w-3" /><span className="hidden sm:inline">{s.label}</span></button>);
            })}
          </div>
        )}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<SectionLoader />}>{sectionContent}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur relative">
        <div className="bg-grid-fine absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono"><Zap className="h-3 w-3 text-verified" />Epistemic Runtime <span className="text-verified">v0.5</span></span>
            <span className="h-3 w-px bg-border/40" />
            <span className="font-mono">MMR · CRDT · ZK-STARK</span>
            <span className="h-3 w-px bg-border/40" />
            <span className="font-mono">{SECTIONS.length} sections</span>
            <span className="h-3 w-px bg-border/40" />
            <span className="font-mono hidden sm:inline">7 SVG charts</span>
            <span className="h-3 w-px bg-border/40 hidden sm:inline" />
            <span className="font-mono hidden sm:inline">⌘K search</span>
            <span className="ml-auto flex items-center gap-3">
              <span className="font-mono">policy DSL: <span className="text-verified">.epd</span></span>
              <span className="h-3 w-px bg-border/40 hidden sm:inline" />
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono">
                <span className={"h-1.5 w-1.5 rounded-full " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing animate-epistemic-pulse" : "bg-violating animate-epistemic-pulse")} />
                {health === null ? "connecting" : health >= 85 ? "healthy" : health >= 60 ? "degraded" : "critical"}
              </span>
            </span>
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
    </div>
  );
}

function SectionHeader({ id, onTogglePin, isPinned, pinnedReady }: { id: SectionId; onTogglePin?: (id: string) => void; isPinned?: boolean; pinnedReady?: boolean }) {
  const m = SECTION_META[id];
  const sectionIdx = SECTIONS.findIndex((s) => s.id === id);
  const Icon = SECTIONS[sectionIdx]?.icon ?? Boxes;
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/40 pb-3">
      <div className="min-w-0 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0">
          <Icon className="h-4.5 w-4.5 text-verified" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{m.title}</h1>
            <span className="inline-flex items-center justify-center h-4 w-4 rounded text-[8px] font-mono text-muted-foreground/50 bg-muted/20">{sectionIdx + 1}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
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
