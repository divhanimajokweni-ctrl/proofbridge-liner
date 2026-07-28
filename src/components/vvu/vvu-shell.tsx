"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command as CommandIcon, Keyboard, ChevronRight } from "lucide-react";
import {
  PRODUCTS, PRODUCT_MAP, type ProductId,
} from "./products";
import TrustSphere from "./trust-sphere";
import { UbuntuPools } from "./ubuntu-pools";
import { ProductStub } from "./product-stub";
import {
  EpistemicRuntimeDashboard, ESSENTIAL_SECTIONS, type SectionId,
} from "./epistemic-runtime-dashboard";
import { VvuCommandPalette } from "./command-palette";
import { SimulationDashboard } from "@/components/simulation/simulation-dashboard";

type CBState = "NORMAL" | "DEGRADED" | "FAIL-CLOSED";
const CB_COLORS: Record<CBState, string> = { NORMAL: "#3dffb0", DEGRADED: "#CC7722", "FAIL-CLOSED": "#ff2e5f" };

export function VvuShell() {
  const [activeProduct, setActiveProduct] = useState<ProductId>("sphere");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [trustDensity, setTrustDensity] = useState(0);
  const [sphereMode, setSphereMode] = useState<"global" | "personal">("global");
  const [epistemicSection, setEpistemicSection] = useState<SectionId>("overview");
  const [cbState] = useState<CBState>("NORMAL");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); return; }
      if (paletteOpen) return;
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.key >= "1" && e.key <= "7") {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < PRODUCTS.length) { e.preventDefault(); setActiveProduct(PRODUCTS[idx].id); }
        return;
      }
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") { if (activeProduct !== "sphere") { e.preventDefault(); setActiveProduct("sphere"); } return; }
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, activeProduct]);

  const handleProductSelect = useCallback((id: ProductId) => setActiveProduct(id), []);
  const handleEpistemicSectionSelect = useCallback((id: SectionId) => { setEpistemicSection(id); setActiveProduct("epistemic"); }, []);
  const handleSphereMetrics = useCallback((m: { verified: number; density: number }) => { setVerifiedCount(m.verified); setTrustDensity(m.density); }, []);

  const contextNav = useMemo<{ label: string; hint?: string; onSelect: () => void; active?: boolean; kbd?: string }[]>(() => {
    if (activeProduct === "sphere") {
      return [
        { label: "Global View", hint: "Whole network", onSelect: () => setSphereMode("global"), active: sphereMode === "global", kbd: "G" },
        { label: "Personal View", hint: "Where do I fit?", onSelect: () => setSphereMode("personal"), active: sphereMode === "personal", kbd: "P" },
      ];
    }
    if (activeProduct === "epistemic") {
      return ESSENTIAL_SECTIONS.map((s, idx) => ({ label: s.label, hint: s.hint, onSelect: () => setEpistemicSection(s.id), active: epistemicSection === s.id, kbd: String(idx + 1) }));
    }
    const product = PRODUCT_MAP[activeProduct];
    return product.signals.map(sig => ({ label: sig.label, hint: sig.hint, onSelect: () => {} }));
  }, [activeProduct, sphereMode, epistemicSection]);

  const activeMeta = PRODUCT_MAP[activeProduct];

  return (
    <div className="relative flex h-screen flex-col overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)" }}>
      <style dangerouslySetInnerHTML={{ __html: `:root{--vvu-gold:#C9A84C}@keyframes vvu-live-pulse{0%,100%{opacity:1}50%{opacity:.35}}` }} />

      {/* HEADER */}
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 backdrop-blur-xl sm:px-6" style={{ background: "rgba(15,15,24,0.65)" }}>
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" aria-hidden className="flex-none">
            <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5" /><circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5" /><circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5" />
          </svg>
          <div className="leading-none">
            <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>Venture Vision <span style={{ color: "var(--vvu-gold)" }}>Ubuntu</span></h1>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Production Dashboard · Trust Runtime</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] sm:inline-flex" style={{ borderColor: `${activeMeta.accent}40`, background: `${activeMeta.accent}10`, color: activeMeta.accent }}>
            <activeMeta.icon className="h-3 w-3" strokeWidth={1.8} />
            <span className="font-semibold uppercase tracking-wider">{activeMeta.tag}</span>
            <span className="text-foreground/70">·</span><span className="text-foreground/80">{activeMeta.label}</span>
          </span>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#3dffb0", boxShadow: "0 0 8px rgba(61,255,176,0.5)", animation: "vvu-live-pulse 2s ease-in-out infinite" }} />LIVE
          </span>
          <button onClick={() => setPaletteOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[var(--vvu-gold)]/40 hover:text-foreground" title="Open command palette (⌘K)">
            <CommandIcon className="h-3.5 w-3.5" /><span className="hidden lg:inline">Search</span>
            <kbd className="hidden items-center rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] lg:inline-flex">⌘K</kbd>
          </button>
          <button onClick={() => setShortcutsOpen(o => !o)} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground" title="Keyboard shortcuts (?)">
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* BODY: sidebar + stage */}
      <div className="relative flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <nav aria-label="VVU products" className="z-20 flex w-[56px] flex-none flex-col gap-2 border-r border-white/[0.06] p-2 backdrop-blur-xl md:w-[220px] md:p-3 lg:w-[240px]" style={{ background: "rgba(15,15,24,0.65)" }}>
          <div className="flex flex-col gap-1">
            <div className="hidden px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 md:block">Products</div>
            {PRODUCTS.map((p) => {
              const Icon = p.icon; const isActive = activeProduct === p.id;
              return (
                <button key={p.id} onClick={() => setActiveProduct(p.id)}
                  className={`group relative flex items-center justify-center gap-2.5 rounded-md border px-2 py-2 text-left transition-all md:justify-start md:px-2.5 ${isActive ? "border-white/10 bg-white/[0.05] text-foreground" : "border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"}`}
                  title={`${p.label} (Alt+${p.shortcut})`} aria-label={p.label}>
                  {isActive && <span className="absolute inset-y-1 left-0 w-[2px] rounded-full" style={{ background: p.accent }} aria-hidden />}
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md border" style={{ borderColor: isActive ? `${p.accent}50` : "rgba(255,255,255,0.06)", background: isActive ? `${p.accent}12` : "transparent" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: isActive ? p.accent : undefined }} strokeWidth={1.8} />
                  </span>
                  <div className="hidden min-w-0 flex-1 flex-col leading-none md:flex">
                    <span className="truncate text-xs font-medium">{p.label}</span>
                    <span className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground/70">{p.tagline}</span>
                  </div>
                  <kbd className="hidden flex-none rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[8.5px] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 md:block">{p.shortcut}</kbd>
                </button>
              );
            })}
          </div>
          <div className="mt-2 hidden flex-col gap-0.5 border-t border-white/[0.06] pt-3 md:flex">
            <div className="px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              {activeProduct === "sphere" ? "Sphere View" : activeProduct === "epistemic" ? "Epistemic Essentials" : "Signals"}
            </div>
            <div className="flex max-h-[calc(100vh-260px)] flex-col gap-0.5 overflow-y-auto pr-1">
              {contextNav.map((entry, idx) => (
                <button key={`${entry.label}-${idx}`} onClick={entry.onSelect}
                  className={`group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${entry.active ? "bg-white/[0.05] text-foreground" : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"}`}>
                  <ChevronRight className={`h-3 w-3 flex-none transition-transform ${entry.active ? "text-[var(--vvu-gold)]" : "text-muted-foreground/40 group-hover:translate-x-0.5"}`} />
                  <span className="flex-1 truncate">{entry.label}</span>
                  {entry.kbd && <kbd className="flex-none rounded border border-white/[0.06] bg-white/[0.02] px-1 py-0.5 font-mono text-[8.5px] text-muted-foreground/50">{entry.kbd}</kbd>}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto hidden border-t border-white/[0.06] pt-3 md:block">
            <div className="px-2 font-mono text-[9px] leading-relaxed text-muted-foreground/60">
              <div className="flex items-center gap-1.5"><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[8.5px]">⌘K</kbd><span>palette</span></div>
              <div className="mt-1 flex items-center gap-1.5"><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[8.5px]">Esc</kbd><span>← Sphere</span></div>
              <div className="mt-1 flex items-center gap-1.5"><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[8.5px]">?</kbd><span>shortcuts</span></div>
            </div>
          </div>
        </nav>

        {/* STAGE */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={activeProduct} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
              {activeProduct === "sphere" && (
                <div className="absolute inset-0">
                  <TrustSphere mode={sphereMode} onMetrics={handleSphereMetrics} />
                  <div className="absolute right-4 top-4 z-20 rounded-lg border border-white/[0.06] p-3.5 font-mono text-[10px] text-muted-foreground backdrop-blur-md sm:right-6 sm:top-6" style={{ background: "rgba(15,15,24,0.65)", minWidth: 195 }}>
                    <div className="mb-2 font-sans text-[10.5px] font-bold uppercase tracking-[0.05em] text-foreground">Node State</div>
                    {[["#2a2d3a","Unknown"],["#3d6bff","Identity Verified"],["#3dd6ff","Contribution Verified"],["#3dffb0","Receipt Generated"],["#c9a84c","Hash Linked"],["#b23dff","ZK Proof Generated"],["#ff2e5f","Trust Increased"]].map(([c,l])=>(<div key={l} className="my-0.5 flex items-center gap-2"><span className="h-1.5 w-1.5 flex-none rounded-full" style={{background:c}} />{l}</div>))}
                  </div>
                  <div className="absolute bottom-5 left-5 z-20 flex gap-1.5 sm:bottom-8 sm:left-8">
                    <button onClick={() => setSphereMode("global")} className={`rounded-full border px-3.5 py-1.5 font-mono text-[10px] transition-all ${sphereMode==="global"?"border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 text-[var(--vvu-gold)]":"border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"}`}>Global View</button>
                    <button onClick={() => setSphereMode("personal")} className={`rounded-full border px-3.5 py-1.5 font-mono text-[10px] transition-all ${sphereMode==="personal"?"border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 text-[var(--vvu-gold)]":"border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"}`}>Personal View</button>
                  </div>
                  <div className="absolute bottom-5 right-4 z-20 max-w-[280px] text-right sm:bottom-8 sm:right-6">
                    <div className="font-mono text-[10px] italic text-muted-foreground">{sphereMode === "global" ? '"How healthy is the trust network right now?"' : '"Where do I fit in the network?"'}</div>
                    <div className="mt-1.5 font-mono text-[9px] text-muted-foreground/50">Circuit Breaker: <span style={{ color: CB_COLORS[cbState] }}>{cbState}</span></div>
                  </div>
                </div>
              )}
              {activeProduct === "epistemic" && (
                <EpistemicRuntimeDashboard activeSection={epistemicSection} onSectionChange={setEpistemicSection} onBackToSphere={() => setActiveProduct("sphere")} />
              )}
              {activeProduct === "ubuntu-pools" && <UbuntuPools />}
              {activeProduct === "simulation" && <SimulationDashboard />}
              {!["sphere", "epistemic", "ubuntu-pools", "simulation"].includes(activeProduct) && (
                <ProductStub product={activeMeta} onBackToSphere={() => setActiveProduct("sphere")} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* TASKBAR */}
      <footer className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-t border-white/[0.06] px-4 py-2 font-mono text-[10px] text-muted-foreground backdrop-blur-xl sm:px-6" style={{ background: "rgba(15,15,24,0.7)" }}>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: CB_COLORS[cbState], boxShadow: `0 0 6px ${CB_COLORS[cbState]}80`, animation: "vvu-live-pulse 2s ease-in-out infinite" }} />
          <span className="text-muted-foreground/80">Circuit Breaker:</span><span className="font-medium" style={{ color: CB_COLORS[cbState] }}>{cbState}</span>
        </div>
        <div className="flex items-center gap-2"><span className="text-muted-foreground/80">Verified identities:</span><span className="font-medium" style={{ color: "var(--vvu-gold)" }}>{verifiedCount}</span></div>
        <div className="flex items-center gap-2"><span className="text-muted-foreground/80">Trust density:</span><span className="font-medium" style={{ color: "var(--vvu-gold)" }}>{trustDensity.toFixed(1)}%</span></div>
        <div className="flex items-center gap-2"><span className="text-muted-foreground/80">Active product:</span><span className="font-medium" style={{ color: activeMeta.accent }}>{activeMeta.label}</span></div>
        <div className="ml-auto hidden items-center gap-2 font-mono text-[9.5px] text-muted-foreground/60 md:flex">
          <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px]">Alt</kbd><span>+</span><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px]">1-6</kbd><span className="ml-1">jump</span>
          <span className="mx-1 text-white/10">·</span><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px]">⌘K</kbd><span>palette</span>
        </div>
      </footer>

      <VvuCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onProductSelect={handleProductSelect} onEpistemicSectionSelect={handleEpistemicSectionSelect} />

      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)}>
          <div className="w-full max-w-[560px] rounded-xl border border-white/[0.08] p-6" style={{ background: "rgba(15,15,24,0.95)" }} onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>Keyboard Shortcuts</h2>
              <button onClick={() => setShortcutsOpen(false)} className="rounded-md border border-white/[0.08] px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground">Esc</button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Global navigation</div>
                <div className="flex flex-col gap-1.5">
                  {[["⌘K / Ctrl+K","Open command palette"],["Alt+1","Trust Sphere"],["Alt+2","Epistemic Runtime"],["Alt+3","ProofBridge"],["Alt+4","AIR Runtime"],["Alt+5","Ubuntu Pools"],["Alt+6","HBK"],["Esc","Back to Trust Sphere"],["?","Toggle this overlay"]].map(([k,l])=>(<div key={k} className="flex items-center justify-between gap-3"><span className="text-xs text-foreground/85">{l}</span><kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}</kbd></div>))}
                </div>
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Epistemic Runtime (when active)</div>
                <div className="flex flex-col gap-1.5">
                  {[["1-8","Jump to essential section"],["←/→","Prev / next essential"],["F8","Toggle notifications"],["?","Toggle this overlay"]].map(([k,l])=>(<div key={k} className="flex items-center justify-between gap-3"><span className="text-xs text-foreground/85">{l}</span><kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}</kbd></div>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
