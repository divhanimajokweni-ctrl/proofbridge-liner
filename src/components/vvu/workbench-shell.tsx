'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { EdgeDock, type DockPosition } from '@/components/vvu/edge-dock';
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

// Dynamic imports for new components
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
};

function resolveProductIcon(iconName: string): LucideIcon {
  return PRODUCT_ICON_MAP[iconName] ?? Boxes;
}

// ---------------------------------------------------------------------------
// Workspace Mode Badge
// ---------------------------------------------------------------------------

function WorkspaceModeBadge() {
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const config = WORKSPACE_MODES[workspaceMode];
  const ModeIcon = ICON_MAP[config.icon] ?? Activity;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
      <ModeIcon className="h-3.5 w-3.5" style={{ color: config.color }} strokeWidth={1.8} />
      <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
    </div>
  );
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
};

// ---------------------------------------------------------------------------
// Left Dock Content — Workspace Navigation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sidebar workspace mode items (the 7 dropdown items)
// ---------------------------------------------------------------------------

const SIDEBAR_WORKSPACE_MODES: {
  key: WorkspaceMode;
  label: string;
  icon: string;
}[] = [
  { key: 'engineering', label: 'Custom', icon: 'FlaskConical' },
  { key: 'learning', label: 'Academics', icon: 'GraduationCap' },
  { key: 'engineering', label: 'Developers', icon: 'BrainCircuit' },
  { key: 'compliance', label: 'Regulators', icon: 'FileCheck2' },
  { key: 'operations', label: 'Operators', icon: 'Activity' },
  { key: 'review', label: 'Researchers', icon: 'Eye' },
  { key: 'executive', label: 'Organisations', icon: 'TrendingUp' },
];

function LeftDockContent() {
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const setActiveProduct = useWorkspaceStore((s) => s.setActiveProduct);
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const setWorkspaceMode = useWorkspaceStore((s) => s.setWorkspaceMode);
  const toggleTrustPassport = useWorkspaceStore((s) => s.toggleTrustPassport);
  const toggleDock = useWorkspaceStore((s) => s.toggleDock);

  // Collapsible dropdown states — collapsed by default
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const modeConfig = WORKSPACE_MODES[workspaceMode];

  return (
    <div className="flex h-full flex-col gap-0 p-0">
      {/* ── VVU Logo + Close ── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          {/* VVU Logo — styled monospace */}
          <div className="flex items-center gap-0.5">
            <span
              className="font-mono text-base font-black tracking-[0.18em]"
              style={{ color: '#3dffb0' }}
            >
              V
            </span>
            <span
              className="font-mono text-base font-black tracking-[0.18em]"
              style={{ color: '#C9A84C' }}
            >
              V
            </span>
            <span
              className="font-mono text-base font-black tracking-[0.18em]"
              style={{ color: '#3dd6ff' }}
            >
              U
            </span>
          </div>
        </div>
        <button
          onClick={() => toggleDock('left')}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-colors"
          title="Close sidebar"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
        {/* ── Workspace Mode dropdown ── */}
        <Collapsible open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
              <Activity
                className="h-3.5 w-3.5 flex-none"
                style={{ color: modeConfig.color }}
                strokeWidth={1.8}
              />
              <span className="flex-1 text-xs font-medium">Workspace Mode</span>
              <ChevronDown
                className={`h-3 w-3 flex-none text-muted-foreground/40 transition-transform duration-200 ${workspaceOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0.5 pl-2 pb-1 pt-0.5"
            >
              {SIDEBAR_WORKSPACE_MODES.map((item) => {
                const isActive = workspaceMode === item.key;
                const ItemIcon = ICON_MAP[item.icon] ?? Activity;

                return (
                  <button
                    key={item.label}
                    onClick={() => setWorkspaceMode(item.key)}
                    className={`group relative flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-all ${
                      isActive
                        ? 'border-white/10 bg-white/[0.05] text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-0.5 left-0 w-[2px] rounded-full"
                        style={{ background: modeConfig.color }}
                      />
                    )}
                    <ItemIcon
                      className="h-3 w-3 flex-none"
                      style={{ color: isActive ? modeConfig.color : undefined }}
                      strokeWidth={1.8}
                    />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Products dropdown ── */}
        <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
              <Boxes className="h-3.5 w-3.5 flex-none" strokeWidth={1.8} />
              <span className="flex-1 text-xs font-medium">Products</span>
              <ChevronDown
                className={`h-3 w-3 flex-none text-muted-foreground/40 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0.5 pl-2 pb-1 pt-0.5"
            >
              {PRODUCT_MANIFESTS.map((product) => {
                const Icon = resolveProductIcon(product.icon);
                const isActive = activeProduct === product.id;

                return (
                  <button
                    key={product.id}
                    onClick={() => setActiveProduct(product.id)}
                    className={`group relative flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-all ${
                      isActive
                        ? 'border-white/10 bg-white/[0.05] text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-0.5 left-0 w-[2px] rounded-full"
                        style={{ background: product.color }}
                      />
                    )}
                    <Icon
                      className="h-3 w-3 flex-none"
                      style={{ color: isActive ? product.color : undefined }}
                      strokeWidth={1.8}
                    />
                    <div className="flex min-w-0 flex-1 flex-col leading-none">
                      <span className="truncate text-xs font-medium">{product.label}</span>
                      <span className="mt-0.5 truncate font-mono text-[8px] text-muted-foreground/50">
                        {product.tagline}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Projects dropdown (placeholder) ── */}
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
              <FolderKanban className="h-3.5 w-3.5 flex-none" strokeWidth={1.8} />
              <span className="flex-1 text-xs font-medium">Projects</span>
              <ChevronDown
                className={`h-3 w-3 flex-none text-muted-foreground/40 transition-transform duration-200 ${projectsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-4 py-2">
              <span className="font-mono text-[9px] text-muted-foreground/40">
                No projects yet
              </span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Customize dropdown (placeholder) ── */}
        <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
              <Paintbrush className="h-3.5 w-3.5 flex-none" strokeWidth={1.8} />
              <span className="flex-1 text-xs font-medium">Customize</span>
              <ChevronDown
                className={`h-3 w-3 flex-none text-muted-foreground/40 transition-transform duration-200 ${customizeOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-4 py-2">
              <span className="font-mono text-[9px] text-muted-foreground/40">
                Appearance & preferences
              </span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Settings dropdown (placeholder) ── */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
              <Settings className="h-3.5 w-3.5 flex-none" strokeWidth={1.8} />
              <span className="flex-1 text-xs font-medium">Settings</span>
              <ChevronDown
                className={`h-3 w-3 flex-none text-muted-foreground/40 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-4 py-2">
              <span className="font-mono text-[9px] text-muted-foreground/40">
                System configuration
              </span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Standalone: Trust Passport ── */}
        <button
          onClick={toggleTrustPassport}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5 flex-none text-emerald-400/70" strokeWidth={1.8} />
          <span className="text-xs font-medium">Trust Passport</span>
        </button>

        {/* ── Standalone: Partner With Us ── */}
        <button
          className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors"
          title="Partner With Us"
        >
          <Share2 className="h-3.5 w-3.5 flex-none text-amber-400/70" strokeWidth={1.8} />
          <span className="flex-1 text-xs font-medium">Partner With Us</span>
          <ArrowRight className="h-3 w-3 flex-none text-muted-foreground/30" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Bottom anchored: User Account ── */}
      <div className="border-t border-white/[0.06] px-2 py-2">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-white/[0.03] hover:text-foreground transition-colors">
          <User className="h-3.5 w-3.5 flex-none" strokeWidth={1.8} />
          <span className="flex-1 text-xs font-medium">User Account</span>
          <Settings className="h-3 w-3 flex-none text-muted-foreground/30" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right Dock Content — Context-Aware
// ---------------------------------------------------------------------------

function RightDockContent() {
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const trustPassport = useWorkspaceStore((s) => s.trustPassport);
  const currentMaturity = useWorkspaceStore((s) => s.currentMaturity);

  const capabilities = activeProduct
    ? getCapabilitiesForProduct(activeProduct)
    : CAPABILITIES;

  const product = activeProduct ? PRODUCT_MANIFEST_MAP[activeProduct] : null;
  const modeConfig = WORKSPACE_MODES[workspaceMode];

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Workspace mode indicator */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Mode
          </span>
          <span className="font-mono text-[9px]" style={{ color: modeConfig.color }}>
            {modeConfig.label}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/70">{modeConfig.description}</p>
      </div>

      {/* Product header */}
      {product && (
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border"
            style={{ borderColor: `${product.color}40`, background: `${product.color}10` }}
          >
            {(() => {
              const Icon = resolveProductIcon(product.icon);
              return <Icon className="h-4 w-4" style={{ color: product.color }} strokeWidth={1.8} />;
            })()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">{product.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground/60">{product.tagline}</span>
          </div>
        </div>
      )}

      {/* Maturity indicator */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 mb-2">
          Trust Maturity
        </div>
        <div className="flex gap-1">
          {MATURITY_STAGES.map((stage, idx) => {
            const currentIdx = MATURITY_STAGES.indexOf(currentMaturity);
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div
                key={stage}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  isCurrent ? 'animate-pulse' : ''
                }`}
                style={{
                  background: isCompleted
                    ? isCurrent
                      ? MATURITY_COLORS[stage]
                      : `${MATURITY_COLORS[stage]}80`
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: isCurrent ? `0 0 6px ${MATURITY_COLORS[stage]}60` : undefined,
                }}
                title={MATURITY_LABELS[stage]}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70">Current</span>
          <span className="font-mono text-[9px]" style={{ color: MATURITY_COLORS[currentMaturity] }}>
            {MATURITY_LABELS[currentMaturity]}
          </span>
        </div>
      </div>

      {/* AI Agents (compact) */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Agents
          </span>
        </div>
        {VVU_AGENTS.filter(a => a.status === 'running' || a.status === 'watching').map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 mb-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                background: agent.color,
                boxShadow: `0 0 4px ${agent.color}80`,
                animation: 'vvu-live-pulse 2s ease-in-out infinite',
              }}
            />
            <span className="text-[10px] text-foreground">{agent.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground/50">{agent.role}</span>
            {agent.confidence !== undefined && (
              <span className="ml-auto font-mono text-[9px] text-emerald-400/70">{agent.confidence}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
        Capabilities
      </div>
      {capabilities.slice(0, 3).map((cap) => {
        const progress = trustPassport[cap.id];
        const completedCount = progress?.completedSteps.length ?? 0;
        const totalSteps = cap.trustJourney.length;
        const percentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

        return (
          <div
            key={cap.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground">{cap.label}</span>
              <Badge
                variant="outline"
                className={`font-mono text-[8px] ${
                  cap.trustTier === 'browse'
                    ? 'text-muted-foreground border-white/[0.08]'
                    : cap.trustTier === 'verified'
                      ? 'text-emerald-400 border-emerald-500/20'
                      : cap.trustTier === 'financial'
                        ? 'text-amber-400 border-amber-500/20'
                        : 'text-purple-400 border-purple-500/20'
                }`}
              >
                {cap.trustTier}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground/60">
                {completedCount}/{totalSteps}
              </span>
            </div>
          </div>
        );
      })}

      {/* Trust metrics */}
      <div className="mt-auto border-t border-white/[0.06] pt-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 mb-2">
          Three Roots
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">History</span>
            <span className="font-mono text-[10px] text-emerald-400">Intact</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">Semantic</span>
            <span className="font-mono text-[10px] text-emerald-400">SOUND</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">Trust</span>
            <span className="font-mono text-[10px] text-amber-400">3 certs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top Dock Content — Global Actions Bar
// ---------------------------------------------------------------------------

function TopDockContent() {
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const focusMode = useWorkspaceStore((s) => s.focusMode);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const currentMaturity = useWorkspaceStore((s) => s.currentMaturity);

  const product = activeProduct ? PRODUCT_MANIFEST_MAP[activeProduct] : null;
  const modeConfig = WORKSPACE_MODES[workspaceMode];

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/50">Search</span>
      </div>

      {/* Active product indicator */}
      {product && (
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
          <Badge
            variant="outline"
            className="gap-1.5 font-mono text-[9px]"
            style={{
              borderColor: `${product.color}40`,
              background: `${product.color}10`,
              color: product.color,
            }}
          >
            {(() => {
              const Icon = resolveProductIcon(product.icon);
              return <Icon className="h-2.5 w-2.5" />;
            })()}
            {product.label}
          </Badge>
        </div>
      )}

      {/* Workspace mode indicator */}
      <div className="flex items-center gap-2">
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
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
      </div>

      {/* Maturity indicator */}
      <div className="flex items-center gap-2">
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
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
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Focus mode toggle */}
      <button
        onClick={toggleFocusMode}
        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9px] transition-all ${
          focusMode
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground'
        }`}
        title={focusMode ? 'Exit focus mode (Esc)' : 'Enter focus mode (F)'}
      >
        {focusMode ? (
          <Minimize2 className="h-3 w-3" />
        ) : (
          <Maximize2 className="h-3 w-3" />
        )}
        {focusMode ? 'Exit Focus' : 'Focus'}
      </button>

      {/* Auth bar */}
      <VvuErrorBoundary label="Auth Bar" fallback={<span className="font-mono text-[10px] text-muted-foreground">Auth unavailable</span>}>
        <WorkspaceAuthBar />
      </VvuErrorBoundary>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom Dock Content — Status Bar
// ---------------------------------------------------------------------------

function BottomDockContent() {
  const activeProduct = useWorkspaceStore((s) => s.activeProduct);
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const currentMaturity = useWorkspaceStore((s) => s.currentMaturity);
  const focusMode = useWorkspaceStore((s) => s.focusMode);
  const product = activeProduct ? PRODUCT_MANIFEST_MAP[activeProduct] : null;

  const activeAgentCount = VVU_AGENTS.filter(a => a.status === 'running' || a.status === 'watching').length;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-1 font-mono text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        {/* Circuit breaker */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: CB_COLORS.NORMAL,
              boxShadow: `0 0 6px ${CB_COLORS.NORMAL}80`,
              animation: 'vvu-live-pulse 2s ease-in-out infinite',
            }}
          />
          <span className="text-muted-foreground/80">CB:</span>
          <span className="font-medium" style={{ color: CB_COLORS.NORMAL }}>NORMAL</span>
        </div>

        {/* Maturity */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/80">Maturity:</span>
          <span className="font-medium" style={{ color: MATURITY_COLORS[currentMaturity] }}>
            {MATURITY_LABELS[currentMaturity]}
          </span>
        </div>

        {/* Workspace mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/80">Mode:</span>
          <span className="font-medium" style={{ color: WORKSPACE_MODES[workspaceMode].color }}>
            {WORKSPACE_MODES[workspaceMode].label}
          </span>
        </div>

        {/* Active product */}
        {product && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/80">Active:</span>
            <span className="font-medium" style={{ color: product.color }}>{product.label}</span>
          </div>
        )}

        {/* Agents */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-emerald-400/70" />
          <span className="text-muted-foreground/80">Agents:</span>
          <span className="font-medium text-emerald-400">{activeAgentCount} active</span>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="hidden items-center gap-2 md:flex">
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[9px]">⌘K</kbd>
        <span>palette</span>
        <span className="text-white/10">·</span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[9px]">F</kbd>
        <span>focus</span>
        <span className="text-white/10">·</span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 text-[9px]">Esc</kbd>
        <span>home</span>
      </div>
    </div>
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
  if (!product) return null;

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
      {!['sphere', 'epistemic', 'ubuntu-pools', 'simulation'].includes(activeProduct) && (
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
// Workbench Shell
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
  const setDockWidth = useWorkspaceStore((s) => s.setDockWidth);
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
      className="relative flex h-screen flex-col overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{--vvu-gold:#C9A84C}@keyframes vvu-live-pulse{0%,100%{opacity:1}50%{opacity:.35}}`,
        }}
      />

      {/* ── Top Dock ── */}
      <EdgeDock
        position="top"
        pinned={docks.top.pinned}
        visible={docks.top.visible}
        size={docks.top.width}
        onPinChange={(pinned) => pinDock('top')}
        onSizeChange={(size) => setDockWidth('top', size)}
        onVisibleChange={(visible) => toggleDock('top')}
        label="Global Actions"
        focusMode={focusMode}
        hideInFocusMode={true}
        className="border-b border-white/[0.06]"
        style={{ background: 'rgba(15,15,24,0.65)' }}
      >
        <TopDockContent />
      </EdgeDock>

      {/* ── Main area ── */}
      <div className="relative flex min-h-0 flex-1">
        {/* ── Left Dock ── */}
        <EdgeDock
          position="left"
          pinned={docks.left.pinned}
          visible={docks.left.visible}
          size={docks.left.width}
          onPinChange={(pinned) => pinDock('left')}
          onSizeChange={(size) => setDockWidth('left', size)}
          onVisibleChange={(visible) => toggleDock('left')}
          label="Workspace"
          focusMode={focusMode}
          hideInFocusMode={true}
          className="border-r border-white/[0.06]"
          style={{ background: 'rgba(15,15,24,0.65)' }}
        >
          <LeftDockContent />
        </EdgeDock>

        {/* ── Stage ── */}
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* ── Compute Engine Widget (always visible, above content) ── */}
          <ComputeEngineWidget />

          {/* ── Content area ── */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeProduct === null ? (
                <motion.div
                  key="intent-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-0"
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
                  className="absolute inset-0"
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

        {/* ── Right Dock ── */}
        <EdgeDock
          position="right"
          pinned={docks.right.pinned}
          visible={docks.right.visible}
          size={docks.right.width}
          onPinChange={(pinned) => pinDock('right')}
          onSizeChange={(size) => setDockWidth('right', size)}
          onVisibleChange={(visible) => toggleDock('right')}
          label="Context"
          focusMode={focusMode}
          hideInFocusMode={true}
          className="border-l border-white/[0.06]"
          style={{ background: 'rgba(15,15,24,0.65)' }}
        >
          <RightDockContent />
        </EdgeDock>
      </div>

      {/* ── Bottom Dock ── */}
      <EdgeDock
        position="bottom"
        pinned={docks.bottom.pinned}
        visible={docks.bottom.visible}
        size={docks.bottom.width}
        onPinChange={(pinned) => pinDock('bottom')}
        onSizeChange={(size) => setDockWidth('bottom', size)}
        onVisibleChange={(visible) => toggleDock('bottom')}
        label="Status"
        focusMode={focusMode}
        hideInFocusMode={false}
        className="border-t border-white/[0.06]"
        style={{ background: 'rgba(15,15,24,0.7)' }}
      >
        <BottomDockContent />
      </EdgeDock>

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
                    ['Pin button', 'Pin/unpin a dock'],
                    ['Drag edge', 'Resize dock width'],
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
