"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  ShieldCheck, Network, GitBranch, Wrench, Cpu, KeyRound,
  Sparkles, Terminal, Boxes, Globe2, BookOpen, Zap, Search,
  Clock, GitCompare, CircuitBoard, FileText, History, Library, Activity,
  Keyboard, Sun, Moon, Monitor,
} from "lucide-react";
import { usePinnedSections } from "@/hooks/use-pinned-sections";
import { Pin, PinOff, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

type SectionId = "overview" | "studio" | "topology" | "merges" | "shadow" | "proofs" | "miner" | "cli" | "federation" | "timeline" | "diff" | "zkcircuit" | "audit" | "versions" | "templates" | "metrics";

const SECTIONS: { id: SectionId; label: string; icon: typeof ShieldCheck; hint: string }[] = [
  { id: "overview", label: "Overview", icon: Boxes, hint: "Runtime health" },
  { id: "studio", label: "Policy DSL", icon: GitBranch, hint: ".epd → enforcers" },
  { id: "templates", label: "Templates", icon: Library, hint: "Create from template" },
  { id: "topology", label: "DAG Topology", icon: Network, hint: "Sharded state" },
  { id: "merges", label: "Merge Repair", icon: Wrench, hint: "Self-healing" },
  { id: "shadow", label: "Shadow Bridge", icon: Cpu, hint: "Digital twin" },
  { id: "proofs", label: "MMR Proofs", icon: KeyRound, hint: "ZK ancestry" },
  { id: "zkcircuit", label: "ZK Circuit", icon: CircuitBoard, hint: "SNARK constraints" },
  { id: "miner", label: "Invariant Miner", icon: Sparkles, hint: "AI candidates" },
  { id: "timeline", label: "Timeline", icon: Clock, hint: "Event scrubber" },
  { id: "diff", label: "Policy Diff", icon: GitCompare, hint: "Compare .epd" },
  { id: "audit", label: "Audit Reports", icon: FileText, hint: "Compliance" },
  { id: "versions", label: "Versioning", icon: History, hint: "Revision history" },
  { id: "cli", label: "CLI Terminal", icon: Terminal, hint: "Validate .epd" },
  { id: "federation", label: "Federation", icon: Globe2, hint: "epistemic://" },
  { id: "metrics", label: "Metrics", icon: Activity, hint: "Live performance" },
];

const SECTION_META: Record<SectionId, { title: string; sub: string }> = {
  overview: { title: "Runtime Overview", sub: "Global epistemic health across all policies & shards" },
  studio: { title: "Policy DSL Studio", sub: "Author .epd, validate invariants, compile to verified enforcers" },
  topology: { title: "DAG Shard Topology", sub: "Invariant-aware sharding of the state space" },
  merges: { title: "Self-Repairing Merges", sub: "Least-divergent correction of cross-shard merge conflicts" },
  shadow: { title: "Shadow Bridge", sub: "Digital-twin shadow mode with what-if branching & takeover" },
  proofs: { title: "MMR Ancestry Proofs", sub: "Zero-knowledge verifiable merge history" },
  miner: { title: "Invariant Miner", sub: "AI-mined candidate invariants from drift telemetry" },
  cli: { title: "CLI Terminal", sub: "Run epd-cli against custom .epd policy files" },
  federation: { title: "epistemic:// Federation", sub: "Multi-organization verifiable state reconciliation" },
  timeline: { title: "Historical Replay Timeline", sub: "Scrub through merges, shadow events & invariant breaches" },
  diff: { title: "Policy Diff", sub: "Compare two .epd policies side-by-side" },
  zkcircuit: { title: "ZK Proof Circuit", sub: "SNARK constraint graph synthesized from invariants" },
  audit: { title: "Audit Reports", sub: "Exportable compliance report for regulators" },
  versions: { title: "Policy Versioning", sub: "Track .epd revisions, snapshot & restore" },
  templates: { title: "Template Library", sub: "Create policies from domain templates" },
  metrics: { title: "Performance Metrics", sub: "Real-time throughput, latency & violation analytics" },
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
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors" title="Toggle theme">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// Lazy-load all section components
const OverviewSection = dynamic(() => import("@/components/epistemic/overview").then((m) => m.OverviewSection), { ssr: false });
const PolicyStudioSection = dynamic(() => import("@/components/epistemic/policy-studio").then((m) => m.PolicyStudioSection), { ssr: false });
const DagTopologySection = dynamic(() => import("@/components/epistemic/dag-topology").then((m) => m.DagTopologySection), { ssr: false });
const MergeReconciliationSection = dynamic(() => import("@/components/epistemic/merge-reconciliation").then((m) => m.MergeReconciliationSection), { ssr: false });
const ShadowBridgeSection = dynamic(() => import("@/components/epistemic/shadow-bridge").then((m) => m.ShadowBridgeSection), { ssr: false });
const MmrProofsSection = dynamic(() => import("@/components/epistemic/mmr-proofs").then((m) => m.MmrProofsSection), { ssr: false });
const InvariantMinerSection = dynamic(() => import("@/components/epistemic/invariant-miner").then((m) => m.InvariantMinerSection), { ssr: false });
const CliTerminalSection = dynamic(() => import("@/components/epistemic/cli-terminal").then((m) => m.CliTerminalSection), { ssr: false });
const FederationSection = dynamic(() => import("@/components/epistemic/federation").then((m) => m.FederationSection), { ssr: false });
const TimelineSection = dynamic(() => import("@/components/epistemic/timeline").then((m) => m.TimelineSection), { ssr: false });
const PolicyDiffSection = dynamic(() => import("@/components/epistemic/policy-diff").then((m) => m.PolicyDiffSection), { ssr: false });
const ZkCircuitSection = dynamic(() => import("@/components/epistemic/zk-circuit").then((m) => m.ZkCircuitSection), { ssr: false });
const AuditReportsSection = dynamic(() => import("@/components/epistemic/audit-reports").then((m) => m.AuditReportsSection), { ssr: false });
const PolicyVersioningSection = dynamic(() => import("@/components/epistemic/policy-versioning").then((m) => m.PolicyVersioningSection), { ssr: false });
const TemplateLibrarySection = dynamic(() => import("@/components/epistemic/template-library").then((m) => m.TemplateLibrarySection), { ssr: false });
const PerformanceMetricsSection = dynamic(() => import("@/components/epistemic/performance-metrics").then((m) => m.PerformanceMetricsSection), { ssr: false });
const GlobalSearch = dynamic(() => import("@/components/epistemic/global-search").then((m) => m.GlobalSearch), { ssr: false });
const KeyboardShortcutsPanel = dynamic(() => import("@/components/epistemic/keyboard-shortcuts").then((m) => m.KeyboardShortcutsPanel), { ssr: false });
const NotificationCenter = dynamic(() => import("@/components/epistemic/notification-center").then((m) => m.NotificationCenter), { ssr: false });

export default function Home() {
  const [active, setActive] = useState<SectionId>("overview");
  const [health, setHealth] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen((o) => !o); return; }
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !inInput) { e.preventDefault(); setShortcutsOpen((o) => !o); return; }
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < SECTIONS.length) { setActive(SECTIONS[idx].id); window.scrollTo({ top: 0, behavior: "smooth" }); }
      }
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const ci = SECTIONS.findIndex((s) => s.id === active);
        if (e.key === "ArrowLeft" && ci > 0) { e.preventDefault(); setActive(SECTIONS[ci - 1].id); }
        else if (e.key === "ArrowRight" && ci < SECTIONS.length - 1) { e.preventDefault(); setActive(SECTIONS[ci + 1].id); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  const jump = useCallback((id: string) => { setActive(id as SectionId); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const sectionContent = useMemo(() => {
    switch (active) {
      case "overview": return <OverviewSection onJump={jump} />;
      case "studio": return <PolicyStudioSection />;
      case "topology": return <DagTopologySection />;
      case "merges": return <MergeReconciliationSection />;
      case "shadow": return <ShadowBridgeSection />;
      case "proofs": return <MmrProofsSection />;
      case "miner": return <InvariantMinerSection />;
      case "cli": return <CliTerminalSection />;
      case "federation": return <FederationSection />;
      case "timeline": return <TimelineSection />;
      case "diff": return <PolicyDiffSection />;
      case "zkcircuit": return <ZkCircuitSection />;
      case "audit": return <AuditReportsSection />;
      case "versions": return <PolicyVersioningSection />;
      case "templates": return <TemplateLibrarySection onCreate={() => jump("studio")} />;
      case "metrics": return <PerformanceMetricsSection />;
      default: return null;
    }
  }, [active, jump]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="bg-grid-fine absolute inset-0 opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center glow-verified"><ShieldCheck className="h-4.5 w-4.5 text-verified" /></div>
              <div className="leading-none">
                <div className="flex items-center gap-2"><span className="text-sm font-semibold tracking-tight">Epistemic Runtime</span><span className="hidden sm:inline-flex items-center rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">epistemic://</span></div>
                <span className="text-[10px] text-muted-foreground font-mono">invariant-enforced DAG · CRDT · ZK-merge</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1">
                <span className={"h-2 w-2 rounded-full " + (health === null ? "bg-muted-foreground" : health >= 85 ? "bg-verified" : health >= 60 ? "bg-repairing animate-epistemic-pulse" : "bg-violating animate-epistemic-pulse")} />
                <span className="text-xs font-mono tabular-nums">{health === null ? "—" : `${health}%`} health</span>
              </div>
              <NotificationCenter />
              <button type="button" onClick={() => setSearchOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">Search</span></button>
              <button type="button" onClick={() => setShortcutsOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><Keyboard className="h-3.5 w-3.5" /></button>
              <ThemeToggleBtn />
              <a href="#" onClick={(e) => e.preventDefault()} className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><BookOpen className="h-3.5 w-3.5" /> Spec</a>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono"><Zap className="h-3 w-3 text-verified" />Epistemic Runtime v0.3</span>
            <span className="h-3 w-px bg-border/40" /><span className="font-mono">MMR · CRDT · ZK-STARK</span>
            <span className="ml-auto"><span className="font-mono">policy DSL: <span className="text-verified">.epd</span></span></span>
          </div>
        </div>
      </footer>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} onNavigate={(section) => jump(section)} />
      <KeyboardShortcutsPanel open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

function SectionHeader({ id, onTogglePin, isPinned, pinnedReady }: { id: SectionId; onTogglePin?: (id: string) => void; isPinned?: boolean; pinnedReady?: boolean }) {
  const m = SECTION_META[id];
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/40 pb-3">
      <div className="min-w-0"><h1 className="text-lg font-semibold tracking-tight">{m.title}</h1><p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p></div>
      <div className="flex items-center gap-2 shrink-0">
        {pinnedReady && onTogglePin && (
          <button onClick={() => onTogglePin(id)} className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors " + (isPinned ? "border-verified/40 bg-verified/10 text-verified" : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground")} title={isPinned ? "Unpin" : "Pin"}>
            {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}
