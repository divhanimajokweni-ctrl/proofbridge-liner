'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Command as CommandIcon,
  Keyboard,
  Maximize2,
  Minimize2,
  Home,
  Search,
  Activity,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Boxes,
  FileCheck2,
  Workflow,
  Droplets,
  BrainCircuit,
  Eye,
  TrendingUp,
  Scale,
  Sparkles,
  Users,
  GitBranch,
  FlaskConical,
  Share2,
  X,
  Settings,
  FolderKanban,
  Paintbrush,
  User,
  ArrowRight,
  GraduationCap,
  Palette,
  Rocket,
  Wallet,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { useWorkspaceStore } from '@/lib/vvu/workspace-store';
import {
  PRODUCT_MANIFESTS,
  PRODUCT_MANIFEST_MAP,
  CAPABILITIES,
  CAPABILITY_MAP,
  getCapabilitiesForProduct,
  type ProductManifest,
} from '@/lib/vvu/capability-registry';
import {
  WORKSPACE_MODES,
  MATURITY_STAGES,
  MATURITY_LABELS,
  MATURITY_COLORS,
  MATURITY_DESCRIPTIONS,
  VVU_AGENTS,
  type WorkspaceMode,
  type EpistemicMaturity,
} from '@/lib/vvu/three-roots';
import { IconRail } from '@/components/vvu/icon-rail';
import { IntentScreen } from '@/components/vvu/intent-screen';
import { TrustJourneyModal } from '@/components/vvu/trust-journey-modal';
import { VvuCommandPalette } from '@/components/vvu/command-palette';
import { AuthGate, WorkspaceAuthBar } from '@/components/vvu/landing/auth-gate';
import { VvuErrorBoundary } from '@/components/vvu/error-boundary';
import { ComputeEngineWidget } from '@/components/vvu/compute-engine-widget';

// ---------------------------------------------------------------------------
// Dynamic product imports
// ---------------------------------------------------------------------------

import dynamic from 'next/dynamic';
import TrustSphere from '@/components/vvu/trust-sphere';
import { UbuntuPools } from '@/components/vvu/ubuntu-pools';
import { ProductStub } from '@/components/vvu/product-stub';
import {
  EpistemicRuntimeDashboard,
  type SectionId,
} from '@/components/vvu/epistemic-runtime-dashboard';
import { SimulationDashboard } from '@/components/simulation/simulation-dashboard';
import { HBKPipelineDashboard } from '@/components/hbk/pipeline-dashboard';

// Dynamic imports for overlay components
const TrustPassport = dynamic(
  () => import('@/components/vvu/trust-passport').then((m) => m.TrustPassport),
  { ssr: false, loading: () => <div className="p-4 text-center font-mono text-[10px] text-muted-foreground">Loading Trust Passport…</div> },
);
const AgentPanel = dynamic(
  () => import('@/components/vvu/agent-panel').then((m) => m.AgentPanel),
  { ssr: false, loading: () => <div className="p-4 text-center font-mono text-[10px] text-muted-foreground">Loading Agents…</div> },
);
const TransparencyPanel = dynamic(
  () => import('@/components/vvu/transparency-panel').then((m) => m.TransparencyPanel),
  { ssr: false, loading: () => <div className="p-4 text-center font-mono text-[10px] text-muted-foreground">Loading Transparency…</div> },
);
// Growth Infrastructure is handled via ProductStub for now
// Will be upgraded to a full dashboard component when available

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type CBState = 'NORMAL' | 'DEGRADED' | 'FAIL-CLOSED';
const CB_COLORS: Record<CBState, string> = {
  NORMAL: '#3dffb0',
  DEGRADED: '#CC7722',
  'FAIL-CLOSED': '#ff2e5f',
};

// ---------------------------------------------------------------------------
// Product icon resolver
// ---------------------------------------------------------------------------

const PRODUCT_ICON_MAP: Record<string, LucideIcon> = {
  Boxes,
  ShieldCheck,
  FileCheck2,
  Workflow,
  Droplets,
  BrainCircuit,
  Activity,
  Rocket,
};

function resolveProductIcon(iconName: string): LucideIcon {
  return PRODUCT_ICON_MAP[iconName] ?? Boxes;
}

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  Droplets,
  Users,
  BrainCircuit,
  GitBranch,
  Activity,
  FlaskConical,
  Share2,
  TrendingUp,
  FileCheck2,
  Eye,
  Scale,
  Home,
  Search,
  Boxes,
  Workflow,
  Sparkles,
  GraduationCap,
  Palette,
  Rocket,
  Wallet,
};

// ---------------------------------------------------------------------------
// Architectural Shortcuts (for the top header)
// ---------------------------------------------------------------------------

const ARCH_SHORTCUTS = [
  { id: 'ubuntu-pools', label: 'Ubuntu Pools', icon: Droplets, color: '#3dd6ff' },
  { id: 'proofbridge', label: 'ProofBridge-Liner', icon: ShieldCheck, color: '#3dffb0' },
  { id: 'hbk', label: 'HBK', icon: BrainCircuit, color: '#C9A84C' },
  { id: 'air-runtime', label: 'AIR', icon: Sparkles, color: '#b23dff' },
  { id: 'simulation', label: 'Simulation', icon: Activity, color: '#10b981' },
] as const;

// ---------------------------------------------------------------------------
// Progressive Disclosure Top Header
// ---------------------------------------------------------------------------

function TopHeader({ focusMode }: { focusMode: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const setActiveProduct = useWorkspaceStore((s) => s.setActiveProduct);
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const currentMaturity = useWorkspaceStore((s) => s.currentMaturity);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  const mainRef = useRef<HTMLElement | null>(null);

  // Listen for scroll in the main content area
  useEffect(() => {
    const mainEl = document.querySelector('[data-vvu-main]');
    if (!mainEl) return;

    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 20);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus mode: hide header entirely
  if (focusMode) return null;

  const modeConfig = WORKSPACE_MODES[workspaceMode];

  return (
    <header
      className="relative flex items-center h-12 shrink-0 border-b border-white/[0.06] bg-[rgba(15,15,24,0.85)] backdrop-blur-xl select-none"
      style={{ zIndex: 9999 }}
    >
      {/* ── Left: VVU Logo ── */}
      <div className="flex items-center gap-3 pl-4 shrink-0">
        {/* Dropdown arrow when scrolled (shortcuts hidden) */}
        <AnimatePresence>
          {scrolled && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              onClick={() => setShortcutsOpen(!shortcutsOpen)}
              className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${shortcutsOpen ? 'rotate-180' : ''}`} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* VVU Logo */}
        <div className="flex items-center gap-0.5">
          <span className="text-lg font-black tracking-tight" style={{ color: '#3dffb0' }}>V</span>
          <span className="text-lg font-black tracking-tight" style={{ color: '#C9A84C' }}>V</span>
          <span className="text-lg font-black tracking-tight" style={{ color: '#3dd6ff' }}>U</span>
        </div>
      </div>

      {/* ── Center: Architectural Shortcuts (Progressive Disclosure) ── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {!scrolled ? (
            <motion.div
              key="shortcuts"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeIn' }}
              className="flex items-center gap-1"
            >
              {ARCH_SHORTCUTS.map((shortcut, idx) => {
                const isActive = activeProduct === shortcut.id;
                return (
                  <button
                    key={shortcut.id}
                    onClick={() => setActiveProduct(shortcut.id)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150
                      ${isActive
                        ? 'bg-white/[0.08] text-foreground'
                        : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                      }
                    `}
                  >
                    <shortcut.icon className="h-3.5 w-3.5" style={{ color: isActive ? shortcut.color : undefined }} strokeWidth={1.8} />
                    <span>{shortcut.label}</span>
                    {idx < ARCH_SHORTCUTS.length - 1 && (
                      <span className="text-muted-foreground/20 ml-1.5">|</span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex items-center gap-2"
            >
              {activeProduct && PRODUCT_MANIFEST_MAP[activeProduct] && (
                <Badge
                  variant="outline"
                  className="gap-1.5 font-mono text-[9px]"
                  style={{
                    borderColor: `${PRODUCT_MANIFEST_MAP[activeProduct].color}40`,
                    background: `${PRODUCT_MANIFEST_MAP[activeProduct].color}10`,
                    color: PRODUCT_MANIFEST_MAP[activeProduct].color,
                  }}
                >
                  {(() => {
                    const Icon = resolveProductIcon(PRODUCT_MANIFEST_MAP[activeProduct].icon);
                    return <Icon className="h-2.5 w-2.5" />;
                  })()}
                  {PRODUCT_MANIFEST_MAP[activeProduct].label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="gap-1.5 font-mono text-[9px]"
                style={{
                  borderColor: `${modeConfig.color}40`,
                  background: `${modeConfig.color}10`,
                  color: modeConfig.color,
                }}
              >
                {(() => {
                  const Icon = ICON_MAP[modeConfig.icon] ?? Activity;
                  return <Icon className="h-2.5 w-2.5" />;
                })()}
                {modeConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 font-mono text-[9px]"
                style={{
                  borderColor: `${MATURITY_COLORS[currentMaturity]}40`,
                  background: `${MATURITY_COLORS[currentMaturity]}10`,
                  color: MATURITY_COLORS[currentMaturity],
                }}
              >
                {MATURITY_LABELS[currentMaturity]}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropdown menu when scrolled */}
        <AnimatePresence>
          {scrolled && shortcutsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full left-14 mt-1 rounded-lg border border-white/[0.08] bg-[rgba(15,15,24,0.95)] backdrop-blur-xl p-2 min-w-[200px]"
              style={{ zIndex: 10000 }}
            >
              {ARCH_SHORTCUTS.map((shortcut) => {
                const isActive = activeProduct === shortcut.id;
                return (
                  <button
                    key={shortcut.id}
                    onClick={() => { setActiveProduct(shortcut.id); setShortcutsOpen(false); }}
                    className={`
                      flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors duration-150 text-left
                      ${isActive
                        ? 'bg-white/[0.08] text-foreground'
                        : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                      }
                    `}
                  >
                    <shortcut.icon className="h-4 w-4" style={{ color: shortcut.color }} strokeWidth={1.8} />
                    <span>{shortcut.label}</span>
                    {isActive && <ArrowRight className="h-3 w-3 ml-auto" style={{ color: shortcut.color }} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: Wallet + Controls ── */}
      <div className="flex items-center gap-2 pr-4 shrink-0">
        {/* Focus mode toggle */}
        <button
          onClick={toggleFocusMode}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle focus mode (F)"
        >
          <Maximize2 className="h-3 w-3" />
          Focus
        </button>

        {/* Auth bar */}
        <VvuErrorBoundary label="Auth Bar" fallback={<span className="font-mono text-[10px] text-muted-foreground">Auth unavailable</span>}>
          <WorkspaceAuthBar />
        </VvuErrorBoundary>

        {/* Wallet / Ubuntu Pools ID */}
        <button
          className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          title="Ubuntu Pools Wallet"
        >
          <Wallet className="h-3.5 w-3.5" style={{ color: '#C9A84C' }} />
          <span className="hidden sm:inline">Wallet</span>
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Workspace Content — Renders the active product
// ---------------------------------------------------------------------------

function WorkspaceContent({
  activeProduct,
  sphereMode,
  onSphereMetrics,
  epistemicSection,
  onEpistemicSectionChange,
  onBackToSphere,
}: {
  activeProduct: string | null;
  sphereMode: 'global' | 'personal';
  onSphereMetrics: (m: { verified: number; density: number }) => void;
  epistemicSection: SectionId;
  onEpistemicSectionChange: (id: SectionId) => void;
  onBackToSphere: () => void;
}) {
  const [cbState] = useState<CBState>('NORMAL');

  if (activeProduct === null) {
    return null;
  }

  const product = PRODUCT_MANIFEST_MAP[activeProduct];
  if (!product) {
    // Fallback: show a product-not-found state instead of blank
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0a0a0f' }}>
        <div className="text-center space-y-3">
          <Boxes className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-mono text-[11px] text-muted-foreground/50">
            Product &quot;{activeProduct}&quot; is not yet available.
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/30">
            Select a different product from the sidebar or header.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {activeProduct === 'sphere' && (
        <div className="relative h-full">
          <TrustSphere mode={sphereMode} onMetrics={onSphereMetrics} />
          <div className="absolute right-4 top-4 z-20 rounded-lg border border-white/[0.06] p-3.5 font-mono text-[10px] text-muted-foreground backdrop-blur-md sm:right-6 sm:top-6" style={{ background: 'rgba(15,15,24,0.65)', minWidth: 195 }}>
            <div className="mb-2 font-sans text-[10.5px] font-bold uppercase tracking-[0.05em] text-foreground">Node State</div>
            {[['#2a2d3a','Unknown'],['#3d6bff','Identity Verified'],['#3dd6ff','Contribution Verified'],['#3dffb0','Receipt Generated'],['#c9a84c','Hash Linked'],['#b23dff','ZK Proof Generated'],['#ff2e5f','Trust Increased']].map(([c,l])=>(<div key={l} className="my-0.5 flex items-center gap-2"><span className="h-1.5 w-1.5 flex-none rounded-full" style={{background:c}} />{l}</div>))}
          </div>
          <div className="absolute bottom-5 left-5 z-20 flex gap-1.5 sm:bottom-8 sm:left-8">
            <button className="rounded-full border border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 px-3.5 py-1.5 font-mono text-[10px] text-[var(--vvu-gold)]">Global View</button>
            <button className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground">Personal View</button>
          </div>
          <div className="absolute bottom-5 right-4 z-20 max-w-[280px] text-right sm:bottom-8 sm:right-6">
            <div className="font-mono text-[10px] italic text-muted-foreground">{sphereMode === 'global' ? '"How healthy is the trust network right now?"' : '"Where do I fit in the network?"'}</div>
            <div className="mt-1.5 font-mono text-[9px] text-muted-foreground/50">Circuit Breaker: <span style={{ color: CB_COLORS[cbState] }}>{cbState}</span></div>
          </div>
        </div>
      )}
      {activeProduct === 'epistemic' && (
        <VvuErrorBoundary label="Epistemic Runtime">
          <AuthGate action="use the Epistemic Runtime" requiredTier="verified">
            <EpistemicRuntimeDashboard activeSection={epistemicSection} onSectionChange={onEpistemicSectionChange} onBackToSphere={onBackToSphere} />
          </AuthGate>
        </VvuErrorBoundary>
      )}
      {activeProduct === 'ubuntu-pools' && (
        <VvuErrorBoundary label="Ubuntu Pools">
          <AuthGate action="use Ubuntu Pools" requiredTier="financial">
            <UbuntuPools />
          </AuthGate>
        </VvuErrorBoundary>
      )}
      {activeProduct === 'simulation' && (
        <AuthGate action="run simulations" requiredTier="verified">
          <VvuErrorBoundary label="Simulation Dashboard">
            <SimulationDashboard />
          </VvuErrorBoundary>
        </AuthGate>
      )}
      {activeProduct === 'hbk' && (
        <VvuErrorBoundary label="HBK MK-II Pipeline">
          <HBKPipelineDashboard />
        </VvuErrorBoundary>
      )}
      {!['sphere', 'epistemic', 'ubuntu-pools', 'simulation', 'hbk'].includes(activeProduct) && (
        <VvuErrorBoundary label={product.label}>
          <AuthGate action={`use ${product.label}`} requiredTier="verified">
            <ProductStub product={{ ...product, id: activeProduct as 'proofbridge' | 'air-runtime' | 'hbk', icon: resolveProductIcon(product.icon), mission: product.tagline, tag: product.id.slice(0, 2).toUpperCase(), shortcut: PRODUCT_MANIFESTS.findIndex(p => p.id === activeProduct) + 1, signals: [], status: 'ONLINE' as const, fullPage: false }} onBackToSphere={onBackToSphere} />
          </AuthGate>
        </VvuErrorBoundary>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workbench Shell — CSS Grid Layout
// ---------------------------------------------------------------------------

export function WorkbenchShell() {
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const focusMode = useWorkspaceStore((s) => s.focusMode);
  const docks = useWorkspaceStore((s) => s.docks);
  const setActiveProduct = useWorkspaceStore((s) => s.setActiveProduct);
  const setActiveCapability = useWorkspaceStore((s) => s.setActiveCapability);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  const toggleDock = useWorkspaceStore((s) => s.toggleDock);
  const pinDock = useWorkspaceStore((s) => s.pinDock);
  const loadLayout = useWorkspaceStore((s) => s.loadLayout);
  const showTrustPassport = useWorkspaceStore((s) => s.showTrustPassport);
  const toggleTrustPassport = useWorkspaceStore((s) => s.toggleTrustPassport);
  const showAgentPanel = useWorkspaceStore((s) => s.showAgentPanel);
  const toggleAgentPanel = useWorkspaceStore((s) => s.toggleAgentPanel);

  // Local state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [trustJourneyOpen, setTrustJourneyOpen] = useState(false);
  const [trustJourneyCapabilityId, setTrustJourneyCapabilityId] = useState('');
  const [sphereMode, setSphereMode] = useState<'global' | 'personal'>('global');
  const [epistemicSection, setEpistemicSection] = useState<SectionId>('overview');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [trustDensity, setTrustDensity] = useState(0);

  // Load layout on mount
  useEffect(() => {
    loadLayout();
    setActiveProduct(null);
  }, [loadLayout, setActiveProduct]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen) return;

      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (inInput) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (focusMode) {
          toggleFocusMode();
        } else if (showTrustPassport) {
          toggleTrustPassport();
        } else if (showAgentPanel) {
          toggleAgentPanel();
        } else {
          setActiveProduct(null);
        }
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paletteOpen, focusMode, toggleFocusMode, setActiveProduct, showTrustPassport, showAgentPanel, toggleTrustPassport, toggleAgentPanel]);

  // Handle capability selection
  const handleCapabilitySelect = useCallback(
    (capabilityId: string) => {
      setActiveCapability(capabilityId);
      setTrustJourneyCapabilityId(capabilityId);
      setTrustJourneyOpen(true);
    },
    [setActiveCapability],
  );

  // Handle product selection
  const handleProductSelect = useCallback(
    (productId: string) => {
      setActiveProduct(productId);
    },
    [setActiveProduct],
  );

  // Handle sphere metrics
  const handleSphereMetrics = useCallback(
    (m: { verified: number; density: number }) => {
      setVerifiedCount(m.verified);
      setTrustDensity(m.density);
    },
    [],
  );

  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{
        background: '#0a0a0f',
        display: 'grid',
        gridTemplateRows: focusMode ? '1fr auto' : 'auto 1fr auto',
        gridTemplateColumns: docks.left.visible ? 'auto 1fr' : '1fr',
        gridTemplateAreas: focusMode
          ? '"main" "compute"'
          : docks.left.visible
            ? '"header header" "sidebar main" "compute compute"'
            : '"header" "main" "compute"',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{--vvu-gold:#C9A84C}@keyframes vvu-live-pulse{0%,100%{opacity:1}50%{opacity:.35}}`,
        }}
      />

      {/* ── Grid Area: Header ── */}
      {!focusMode && (
        <div style={{ gridArea: 'header' }}>
          <TopHeader focusMode={focusMode} />
        </div>
      )}

      {/* ── Grid Area: Sidebar (Icon Rail) ── */}
      {docks.left.visible && !focusMode && (
        <div style={{ gridArea: 'sidebar' }} className="relative overflow-hidden">
          <IconRail
            pinned={docks.left.pinned}
            onPinChange={(pinned) => pinDock('left')}
            focusMode={focusMode}
          />
        </div>
      )}

      {/* ── Grid Area: Main Content ── */}
      <main
        data-vvu-main
        style={{ gridArea: 'main' }}
        className="relative flex min-h-0 flex-col overflow-hidden"
      >
        {/* ── Content area ── */}
        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeProduct === null ? (
              <motion.div
                key="intent-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                className="min-h-full"
              >
                <IntentScreen
                  onCapabilitySelect={handleCapabilitySelect}
                  onProductSelect={handleProductSelect}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeProduct}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                className="min-h-full"
              >
                <WorkspaceContent
                  activeProduct={activeProduct}
                  sphereMode={sphereMode}
                  onSphereMetrics={handleSphereMetrics}
                  epistemicSection={epistemicSection}
                  onEpistemicSectionChange={setEpistemicSection}
                  onBackToSphere={() => setActiveProduct(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Focus mode indicator */}
        {focusMode && activeProduct && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 backdrop-blur-md">
              <Maximize2 className="h-3 w-3 text-emerald-400" />
              <span className="font-mono text-[10px] text-emerald-400">
                Focus Mode — {PRODUCT_MANIFEST_MAP[activeProduct]?.label ?? 'Unknown'}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/50">
                Esc to exit
              </span>
            </div>
          </motion.div>
        )}

        {/* Trust Passport overlay */}
        <AnimatePresence>
          {showTrustPassport && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 z-30 overflow-y-auto"
              style={{ background: 'rgba(10,10,15,0.95)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Trust Passport</span>
                </div>
                <button
                  onClick={toggleTrustPassport}
                  className="rounded-md border border-white/[0.08] px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esc
                </button>
              </div>
              <VvuErrorBoundary label="Trust Passport">
                <TrustPassport />
              </VvuErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Panel overlay */}
        <AnimatePresence>
          {showAgentPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-0 bottom-0 z-30 w-[400px] max-w-full overflow-y-auto border-l border-white/[0.06]"
              style={{ background: 'rgba(10,10,15,0.95)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">AI Collaborators</span>
                </div>
                <button
                  onClick={toggleAgentPanel}
                  className="rounded-md border border-white/[0.08] px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esc
                </button>
              </div>
              <VvuErrorBoundary label="Agent Panel">
                <AgentPanel />
              </VvuErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Grid Area: Compute Engine (permanently anchored at bottom) ── */}
      <div style={{ gridArea: 'compute' }} className="shrink-0">
        <ComputeEngineWidget />
      </div>

      {/* ── Command Palette ── */}
      <VvuCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onProductSelect={(id) => setActiveProduct(id)}
        onEpistemicSectionSelect={(id) => {
          setEpistemicSection(id);
          setActiveProduct('epistemic');
        }}
      />

      {/* ── Trust Journey Modal ── */}
      <TrustJourneyModal
        open={trustJourneyOpen}
        onOpenChange={setTrustJourneyOpen}
        capabilityId={trustJourneyCapabilityId}
      />

      {/* ── Keyboard Shortcuts Overlay ── */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-xl border border-white/[0.08] p-6"
            style={{ background: 'rgba(15,15,24,0.95)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="rounded-md border border-white/[0.08] px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                Esc
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Navigation
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    ['⌘K / Ctrl+K', 'Open command palette'],
                    ['Esc', 'Back to home / exit overlay'],
                    ['F', 'Toggle focus mode'],
                    ['?', 'Toggle this overlay'],
                  ].map(([k, l]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground/85">{l}</span>
                      <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {k}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Overlays
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    ['Trust Passport', 'Trust Passport overlay'],
                    ['AI Agents', 'Agent collaboration panel'],
                    ['Pin button', 'Pin/unpin the sidebar'],
                    ['Click shortcut', 'Jump to product'],
                  ].map(([k, l]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground/85">{l}</span>
                      <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {k}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
