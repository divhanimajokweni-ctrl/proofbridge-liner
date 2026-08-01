'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Boxes,
  FolderKanban,
  Paintbrush,
  Settings,
  ShieldCheck,
  Share2,
  User,
  ArrowRight,
  ChevronDown,
  Pin,
  PinOff,
  X,
  GraduationCap,
  BrainCircuit,
  FileCheck2,
  Eye,
  TrendingUp,
  FlaskConical,
  Droplets,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { useWorkspaceStore } from '@/lib/vvu/workspace-store';
import {
  PRODUCT_MANIFESTS,
  PRODUCT_MANIFEST_MAP,
  getCapabilitiesForProduct,
} from '@/lib/vvu/capability-registry';
import {
  WORKSPACE_MODES,
  type WorkspaceMode,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IconRailProps {
  pinned: boolean;
  onPinChange: (pinned: boolean) => void;
  focusMode?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RAIL_WIDTH_COLLAPSED = 68;
const RAIL_WIDTH_EXPANDED = 250;
const COLLAPSE_DELAY_MS = 300;

/** Workspace mode items shown in the Workspace Mode dropdown */
const RAIL_WORKSPACE_MODES: {
  key: WorkspaceMode;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: 'engineering', label: 'Custom', icon: FlaskConical },
  { key: 'learning', label: 'Academics', icon: GraduationCap },
  { key: 'engineering', label: 'Developers', icon: BrainCircuit },
  { key: 'compliance', label: 'Regulators', icon: FileCheck2 },
  { key: 'operations', label: 'Operators', icon: Activity },
  { key: 'review', label: 'Researchers', icon: Eye },
  { key: 'executive', label: 'Organisations', icon: TrendingUp },
];

/** Map string icon names from product manifests to Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  Boxes,
  ShieldCheck,
  FileCheck2,
  Workflow,
  Droplets,
  BrainCircuit,
  Activity,
  GraduationCap,
  Eye,
  TrendingUp,
  FlaskConical,
  Share2,
  Paintbrush,
  FolderKanban,
  Settings,
  User,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Boxes;
}

// ---------------------------------------------------------------------------
// VVU Logo
// ---------------------------------------------------------------------------

function VVULogo({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex items-center gap-1 select-none">
      <span
        className="text-2xl font-black tracking-tight"
        style={{ color: '#3dffb0' }}
      >
        V
      </span>
      <span
        className="text-2xl font-black tracking-tight"
        style={{ color: '#C9A84C' }}
      >
        V
      </span>
      <span
        className="text-2xl font-black tracking-tight"
        style={{ color: '#3dd6ff' }}
      >
        U
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rail Item Button
// ---------------------------------------------------------------------------

interface RailItemProps {
  icon: LucideIcon;
  label: string;
  expanded: boolean;
  active?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

function RailItem({
  icon: Icon,
  label,
  expanded,
  active = false,
  accentColor,
  onClick,
}: RailItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center w-full rounded-md transition-colors duration-150
        ${expanded ? 'px-3 py-2 gap-3' : 'px-0 py-2 justify-center'}
        ${active
          ? 'bg-white/[0.08]'
          : 'hover:bg-white/[0.06]'
        }
      `}
      title={label}
    >
      <Icon
        className={`
          h-[18px] w-[18px] shrink-0 transition-colors duration-150
          ${active
            ? (accentColor ? '' : 'text-foreground')
            : 'text-muted-foreground group-hover:text-foreground'
          }
        `}
        style={active && accentColor ? { color: accentColor } : undefined}
      />
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={`
              text-sm truncate transition-colors duration-150
              ${active
                ? 'text-foreground font-medium'
                : 'text-muted-foreground group-hover:text-foreground'
              }
            `}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function IconRail({ pinned, onPinChange, focusMode }: IconRailProps) {
  const [hovered, setHovered] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Collapsible dropdown open states
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Workspace store
  const {
    workspaceMode,
    setWorkspaceMode,
    activeProduct,
    setActiveProduct,
    toggleDock,
    toggleTrustPassport,
    showTrustPassport,
  } = useWorkspaceStore();

  // Derive expanded from hover or pinned (computed, not state)
  const isExpanded = hovered || pinned;

  // Mouse enter — clear any pending collapse and expand
  const handleMouseEnter = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setHovered(true);
  }, []);

  // Mouse leave — delay collapse to prevent accidental flicker
  const handleMouseLeave = useCallback(() => {
    if (pinned) return; // pinned stays open
    collapseTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, COLLAPSE_DELAY_MS);
  }, [pinned]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

  // Pin toggle
  const handlePinToggle = useCallback(() => {
    onPinChange(!pinned);
  }, [pinned, onPinChange]);

  // Close button — hide the left dock entirely
  const handleClose = useCallback(() => {
    toggleDock('left');
  }, [toggleDock]);

  // Focus mode hides the rail
  if (focusMode) return null;

  // Resolve the active product manifest for accent color
  const activeManifest = activeProduct
    ? PRODUCT_MANIFEST_MAP[activeProduct]
    : null;

  // Determine current width
  const railWidth = isExpanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH_COLLAPSED;

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={false}
      animate={{
        width: railWidth,
      }}
      transition={{
        width: isExpanded
          ? { duration: 0.15, ease: 'easeOut' }
          : { duration: 0.12, ease: 'easeIn' },
      }}
      className={`
        absolute left-0 top-0 bottom-0 z-50
        flex flex-col
        bg-[rgba(10,10,15,0.92)] backdrop-blur-xl
        border-r border-white/[0.06]
        overflow-hidden
        select-none
      `}
      style={{
        boxShadow: isExpanded
          ? '4px 0 24px rgba(0,0,0,0.5)'
          : '2px 0 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* ── Top Section: Logo + Controls ── */}
      <div className="flex items-center shrink-0 px-3 py-3 min-h-[52px]">
        <VVULogo expanded={isExpanded} />
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="ml-auto flex items-center gap-1"
            >
              {/* Pin button */}
              <button
                onClick={handlePinToggle}
                className="p-1.5 rounded-md hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
                title={pinned ? 'Unpin rail' : 'Pin rail open'}
              >
                {pinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </button>
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
                title="Close rail"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

      {/* ── Middle Section: Scrollable Nav Items ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 space-y-0.5">
        {/* Workspace Mode */}
        {isExpanded ? (
          <Collapsible open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex items-center w-full px-3 py-2 gap-3 rounded-md hover:bg-white/[0.06] transition-colors">
                <Activity className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  Workspace
                </span>
                <ChevronDown
                  className={`
                    h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground
                    transition-transform duration-200
                    ${workspaceOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-3 py-1 space-y-0.5">
                {RAIL_WORKSPACE_MODES.map((mode) => {
                  const ModeIcon = mode.icon;
                  const isActive = workspaceMode === mode.key;
                  return (
                    <button
                      key={mode.label}
                      onClick={() => setWorkspaceMode(mode.key)}
                      className={`
                        group flex items-center w-full px-2 py-1.5 gap-2 rounded-md text-left
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-white/[0.08] text-foreground'
                          : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                        }
                      `}
                    >
                      <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs truncate">{mode.label}</span>
                      {isActive && (
                        <ArrowRight className="h-3 w-3 ml-auto shrink-0 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <RailItem
            icon={Activity}
            label="Workspace"
            expanded={false}
            active={false}
          />
        )}

        {/* Products */}
        {isExpanded ? (
          <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex items-center w-full px-3 py-2 gap-3 rounded-md hover:bg-white/[0.06] transition-colors">
                <Boxes className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  Products
                </span>
                <ChevronDown
                  className={`
                    h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground
                    transition-transform duration-200
                    ${productsOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-3 py-1 space-y-0.5">
                {PRODUCT_MANIFESTS.map((product) => {
                  const ProductIcon = resolveIcon(product.icon);
                  const isActive = activeProduct === product.id;
                  return (
                    <button
                      key={product.id}
                      onClick={() => setActiveProduct(product.id)}
                      className={`
                        group flex items-center w-full px-2 py-1.5 gap-2 rounded-md text-left
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-white/[0.08]'
                          : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                        }
                      `}
                    >
                      <ProductIcon
                        className="h-3.5 w-3.5 shrink-0"
                        style={isActive ? { color: product.color } : undefined}
                      />
                      <span
                        className={`text-xs truncate ${isActive ? 'text-foreground font-medium' : ''}`}
                      >
                        {product.label}
                      </span>
                      {isActive && (
                        <ArrowRight
                          className="h-3 w-3 ml-auto shrink-0"
                          style={{ color: product.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <RailItem
            icon={Boxes}
            label="Products"
            expanded={false}
            active={!!activeProduct}
            accentColor={activeManifest?.color}
          />
        )}

        {/* Projects */}
        {isExpanded ? (
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex items-center w-full px-3 py-2 gap-3 rounded-md hover:bg-white/[0.06] transition-colors">
                <FolderKanban className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  Projects
                </span>
                <ChevronDown
                  className={`
                    h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground
                    transition-transform duration-200
                    ${projectsOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-3 py-1.5">
                <span className="text-xs text-muted-foreground/60 italic">
                  No projects yet
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <RailItem
            icon={FolderKanban}
            label="Projects"
            expanded={false}
          />
        )}

        {/* Customize */}
        {isExpanded ? (
          <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex items-center w-full px-3 py-2 gap-3 rounded-md hover:bg-white/[0.06] transition-colors">
                <Paintbrush className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  Customize
                </span>
                <ChevronDown
                  className={`
                    h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground
                    transition-transform duration-200
                    ${customizeOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-3 py-1.5">
                <span className="text-xs text-muted-foreground/60 italic">
                  Appearance & layout
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <RailItem
            icon={Paintbrush}
            label="Customize"
            expanded={false}
          />
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

      {/* ── Bottom Section: Anchored Items ── */}
      <div className="shrink-0 py-2 px-1.5 space-y-0.5">
        {/* Trust Passport */}
        <RailItem
          icon={ShieldCheck}
          label="Trust Passport"
          expanded={isExpanded}
          active={showTrustPassport}
          accentColor="#3dffb0"
          onClick={() => toggleTrustPassport()}
        />

        {/* Partner With Us */}
        <RailItem
          icon={Share2}
          label="Partner With Us"
          expanded={isExpanded}
        />

        {/* Settings */}
        {isExpanded ? (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex items-center w-full px-3 py-2 gap-3 rounded-md hover:bg-white/[0.06] transition-colors">
                <Settings className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  Settings
                </span>
                <ChevronDown
                  className={`
                    h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground
                    transition-transform duration-200
                    ${settingsOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-3 py-1.5 space-y-0.5">
                <button className="group flex items-center w-full px-2 py-1.5 gap-2 rounded-md text-left text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors">
                  <span className="text-xs">General</span>
                </button>
                <button className="group flex items-center w-full px-2 py-1.5 gap-2 rounded-md text-left text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors">
                  <span className="text-xs">Privacy</span>
                </button>
                <button className="group flex items-center w-full px-2 py-1.5 gap-2 rounded-md text-left text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors">
                  <span className="text-xs">Workspace</span>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <RailItem
            icon={Settings}
            label="Settings"
            expanded={false}
          />
        )}

        {/* User Account */}
        <RailItem
          icon={User}
          label="Account"
          expanded={isExpanded}
        />
      </div>
    </motion.div>
  );
}
