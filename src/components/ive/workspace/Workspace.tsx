"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Command as CommandIcon, Keyboard, Layers, ShieldCheck, Cpu, Droplets, Server } from "lucide-react";
import { useIveStore, PANELS, PANEL_MAP, type PanelMeta } from "@/store/useIveStore";
import { VVULogo } from "../VVULogo";
import { StatusPill, Kbd } from "../primitives";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { PanelRouter } from "./PanelRouter";

const GROUP_LABELS: Record<PanelMeta["group"], string> = {
  core: "Core",
  release: "Release",
  runtime: "Runtime",
  "case-study": "Case Study",
  system: "System",
};

const GROUP_ICONS: Record<PanelMeta["group"], typeof Layers> = {
  core: Layers,
  release: ShieldCheck,
  runtime: Cpu,
  "case-study": Droplets,
  system: Server,
};

const GROUP_ACCENTS: Record<PanelMeta["group"], string> = {
  core: "#C9A84C",
  release: "#ff4d5f",
  runtime: "#CC7722",
  "case-study": "#ff4d5f",
  system: "#8b949e",
};

const GROUP_ORDER: PanelMeta["group"][] = ["core", "release", "runtime", "case-study", "system"];

export function Workspace() {
  const activePanel = useIveStore((s) => s.activePanel);
  const setActivePanel = useIveStore((s) => s.setActivePanel);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeMeta = PANEL_MAP[activePanel];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen) return;
      const t = e.target as HTMLElement;
      const inInput =
        t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    },
    [paletteOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <style>{`:root{--vvu-gold:#C9A84C}`}</style>

      {/* HEADER */}
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 ive-surface sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="rounded-md border border-white/10 p-1.5 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <VVULogo size={30} />
          <div className="leading-none">
            <h1 className="font-sans text-sm font-extrabold tracking-tight text-foreground sm:text-base">
              VVU <span className="text-[var(--ive-gold)]">IVE</span>
            </h1>
            <div className="ive-mono mt-0.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
              Integrated Verification Environment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border px-2.5 py-1 sm:inline-flex" style={{ borderColor: `${activeMeta.accent}40`, background: `${activeMeta.accent}10` }}>
            <span className="ive-mono text-[9px] font-semibold uppercase tracking-wider" style={{ color: activeMeta.accent }}>
              {activeMeta.tag}
            </span>
            <span className="text-foreground/40">·</span>
            <span className="ive-mono text-[10px] text-foreground/80">{activeMeta.label}</span>
          </span>
          <span className="hidden items-center gap-1.5 ive-mono text-[10px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-proven)] ive-live-pulse" style={{ boxShadow: "0 0 8px rgba(61,255,176,0.5)" }} />
            LIVE
          </span>
          <button
            onClick={() => setPaletteOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[var(--ive-gold)]/40 hover:text-foreground"
            title="Open command palette (⌘K)"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
          <button
            onClick={() => setShortcutsOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* BODY: sidebar + stage */}
      <div className="relative flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <nav
          aria-label="IVE panels"
          className={`z-20 flex flex-col gap-3 border-r border-white/[0.06] p-2 ive-surface transition-all md:w-[228px] md:p-3 ${
            mobileNavOpen ? "w-[228px]" : "w-0 overflow-hidden md:w-[228px] md:overflow-visible"
          }`}
        >
          <div className="flex flex-col gap-3">
            {GROUP_ORDER.map((group) => (
              <div key={group} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 px-2 pb-0.5">
                  {(() => {
                    const GIcon = GROUP_ICONS[group];
                    const accent = GROUP_ACCENTS[group];
                    return <GIcon className="h-3 w-3" style={{ color: `${accent}99` }} strokeWidth={1.8} />;
                  })()}
                  <span className="ive-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
                    {GROUP_LABELS[group]}
                  </span>
                  <span className="ml-auto h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                </div>
                {PANELS.filter((p) => p.group === group).map((p) => {
                  const isActive = activePanel === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePanel(p.id);
                        setMobileNavOpen(false);
                      }}
                      className={`group relative flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-all ${
                        isActive
                          ? "border-white/10 bg-white/[0.05] text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                      }`}
                      title={p.mission}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-1 left-0 w-[2px] rounded-full"
                          style={{ background: p.accent, boxShadow: `0 0 6px ${p.accent}80` }}
                          aria-hidden
                        />
                      )}
                      <span
                        className="ive-mono flex h-6 w-6 flex-none items-center justify-center rounded border text-[8.5px] font-bold transition-colors"
                        style={{
                          borderColor: isActive ? `${p.accent}50` : "rgba(255,255,255,0.06)",
                          background: isActive ? `${p.accent}12` : "transparent",
                          color: isActive ? p.accent : undefined,
                        }}
                      >
                        {p.tag}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.label}</span>
                      <ChevronRight
                        className={`h-3 w-3 flex-none transition-transform ${
                          isActive ? "text-[var(--ive-gold)]" : "text-muted-foreground/30 group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-auto hidden border-t border-white/[0.06] pt-2 md:block">
            <StatusPill state="Engineering Release: BLOCKED" accent="var(--ive-blocked)" pulse />
            <div className="ive-mono mt-2 px-2 text-[8.5px] leading-relaxed text-muted-foreground/50">
              HBK MK-II is the demonstration case study. IVE is the platform.
            </div>
          </div>
        </nav>

        {/* STAGE */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <PanelRouter panel={activePanel} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <StatusBar />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {shortcutsOpen && <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />}

      {/* Mobile nav backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-xl border border-white/[0.08] p-6"
        style={{ background: "rgba(15,15,24,0.95)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-base font-bold tracking-tight">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="ive-mono rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">
            Esc
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="ive-mono mb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Global</div>
            <div className="flex flex-col gap-1.5">
              {[["⌘K", "Command palette"], ["?", "This overlay"], ["Esc", "Skip boot / close"]].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-foreground/85">{l}</span>
                  <Kbd>{k}</Kbd>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="ive-mono mb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Navigation</div>
            <div className="flex flex-col gap-1.5">
              {[["Sidebar", "Click any panel"], ["Status bar", "Live telemetry"]].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-foreground/85">{l}</span>
                  <Kbd>{k}</Kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
