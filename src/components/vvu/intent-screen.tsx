'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShieldCheck,
  Droplets,
  Users,
  BrainCircuit,
  GitBranch,
  Activity,
  FlaskConical,
  Share2,
  Eye,
  Lock,
  Building2,
  Wallet,
  TrendingUp,
  FileCheck2,
  GraduationCap,
  Palette,
  Home,
  Rocket,
  ChevronRight,
  Sparkles,
  Heart,
  BookOpen,
  Music,
  Camera,
  Lightbulb,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CAPABILITIES,
  CAPABILITY_MAP,
  PRODUCT_MANIFEST_MAP,
  getProductsForCapability,
  searchCapabilities,
  type Capability,
} from '@/lib/vvu/capability-registry';
import {
  WORKSPACE_CONTEXTS,
  WORKSPACE_MODES,
  INTENT_CATEGORIES,
  MATURITY_STAGES,
  MATURITY_LABELS,
  MATURITY_COLORS,
  MATURITY_DESCRIPTIONS,
  VVU_AGENTS,
  type WorkspaceContext,
  type EpistemicMaturity,
  type IntentCategory,
} from '@/lib/vvu/three-roots';
import { useWorkspaceStore } from '@/lib/vvu/workspace-store';

// ---------------------------------------------------------------------------
// Icon Resolution
// ---------------------------------------------------------------------------

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
  GraduationCap,
  Palette,
  Home,
  Rocket,
  Search,
  Heart,
  BookOpen,
  Music,
  Camera,
  Lightbulb,
};

function DynamicIcon({
  name,
  ...props
}: { name: string } & React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  const Icon = ICON_MAP[name] ?? ShieldCheck;
  return <Icon {...props} />;
}

// ---------------------------------------------------------------------------
// Trust Tier Badge
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon; bg: string }> = {
  browse: { label: 'Browse', color: 'text-muted-foreground', icon: Eye, bg: 'bg-white/[0.04]' },
  verified: { label: 'Verified', color: 'text-emerald-400', icon: ShieldCheck, bg: 'bg-emerald-500/10' },
  financial: { label: 'Financial', color: 'text-amber-400', icon: Building2, bg: 'bg-amber-500/10' },
  web3: { label: 'Web3', color: 'text-purple-400', icon: Wallet, bg: 'bg-purple-500/10' },
};

function TrustTierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.browse;
  const TierIcon = config.icon;
  return (
    <Badge
      variant="outline"
      className={`${config.color} ${config.bg} border-current/20 gap-1 font-mono text-[9px]`}
    >
      <TierIcon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Intent Category Card
// ---------------------------------------------------------------------------

function IntentCategoryCard({
  category,
  isSelected,
  onClick,
}: {
  category: IntentCategory;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = INTENT_CATEGORIES[category];
  const CatIcon = ICON_MAP[config.icon] ?? ShieldCheck;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
        isSelected
          ? 'border-white/15 bg-white/[0.06] shadow-lg'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
      }`}
      style={isSelected ? { boxShadow: `0 0 20px ${config.color}15` } : undefined}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
          isSelected ? 'border-white/15' : 'border-white/[0.06]'
        }`}
        style={{
          background: isSelected ? `${config.color}15` : 'transparent',
          borderColor: isSelected ? `${config.color}30` : undefined,
        }}
      >
        <CatIcon
          className="h-5 w-5"
          style={{ color: isSelected ? config.color : undefined }}
          strokeWidth={1.6}
        />
      </div>
      <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
        {config.label}
      </span>
      {isSelected && (
        <div
          className="absolute -bottom-px left-3 right-3 h-px rounded-full"
          style={{ background: config.color }}
        />
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Capability Card
// ---------------------------------------------------------------------------

interface CapabilityCardProps {
  capability: Capability;
  onSelect: (capabilityId: string) => void;
  index: number;
}

function CapabilityCard({ capability, onSelect, index }: CapabilityCardProps) {
  const products = getProductsForCapability(capability.id);
  const trustPassport = useWorkspaceStore((s) => s.trustPassport);
  const progress = trustPassport[capability.id];
  const completedCount = progress?.completedSteps.length ?? 0;
  const totalSteps = capability.trustJourney.length;
  const percentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(capability.id)}
      className="group relative flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]"
    >
      <div className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-emerald-500/0 transition-colors group-hover:bg-emerald-500/40" />

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15">
          <DynamicIcon name={capability.icon} className="h-5 w-5 text-emerald-400" strokeWidth={1.6} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{capability.label}</h3>
            <TrustTierBadge tier={capability.trustTier} />
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
        {capability.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {products.map((product) => (
          <span
            key={product.id}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] text-muted-foreground/80 transition-colors group-hover:border-white/[0.1]"
          >
            <DynamicIcon name={product.icon} className="h-2.5 w-2.5" style={{ color: product.color }} strokeWidth={1.8} />
            {product.label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {capability.trustJourney.map((step) => {
            const isCompleted = progress?.completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className={`h-1 w-3 rounded-full transition-colors ${
                  isCompleted ? 'bg-emerald-500' : 'bg-white/[0.06]'
                }`}
              />
            );
          })}
        </div>
        <span className="font-mono text-[9px] text-emerald-400/70">
          {completedCount}/{totalSteps}
        </span>
        {percentage === 100 && (
          <Lock className="h-2.5 w-2.5 text-emerald-400" />
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <ChevronRight className="h-4 w-4 text-emerald-400/50" />
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Maturity Stage Indicator
// ---------------------------------------------------------------------------

function MaturityStageIndicator() {
  const currentMaturity = useWorkspaceStore((s) => s.currentMaturity);
  const currentIdx = MATURITY_STAGES.indexOf(currentMaturity);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
          Your Progress
        </span>
        <span className="font-mono text-[9px] text-emerald-400/70">
          Stage {currentIdx + 1} of {MATURITY_STAGES.length}
        </span>
      </div>
      <div className="relative flex items-center gap-1">
        {MATURITY_STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-all ${
                  isCurrent ? 'animate-pulse' : ''
                }`}
                style={{
                  background: isCompleted
                    ? isCurrent
                      ? MATURITY_COLORS[stage]
                      : `${MATURITY_COLORS[stage]}80`
                    : undefined,
                  boxShadow: isCurrent ? `0 0 8px ${MATURITY_COLORS[stage]}60` : undefined,
                }}
              />
              <span
                className={`font-mono text-[7px] leading-tight text-center ${
                  isCurrent ? 'text-foreground font-medium' : isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground/30'
                }`}
              >
                {MATURITY_LABELS[stage].length > 10
                  ? MATURITY_LABELS[stage].split(' ').map((w, i) => (
                      <span key={i}>{w}{i < MATURITY_LABELS[stage].split(' ').length - 1 ? ' ' : ''}</span>
                    ))
                  : MATURITY_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/60">
        {MATURITY_DESCRIPTIONS[currentMaturity]}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Agents Preview
// ---------------------------------------------------------------------------

function ActiveAgentsPreview() {
  const activeAgents = VVU_AGENTS.filter(a => a.status === 'running' || a.status === 'watching');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
          AI Collaborators
        </span>
        <span className="font-mono text-[9px] text-emerald-400/70">
          {activeAgents.length} active
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {activeAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <div className="relative">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: agent.color,
                  boxShadow: `0 0 6px ${agent.color}80`,
                  animation: 'vvu-live-pulse 2s ease-in-out infinite',
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-foreground">{agent.name}</span>
              <span className="font-mono text-[8px] text-muted-foreground/50">{agent.role}</span>
            </div>
            {agent.confidence !== undefined && (
              <span className="ml-auto font-mono text-[9px] text-emerald-400/70">{agent.confidence}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intent Screen — Universal "What would you like to do?"
// ---------------------------------------------------------------------------

interface IntentScreenProps {
  onCapabilitySelect: (capabilityId: string) => void;
  onProductSelect: (productId: string) => void;
}

export function IntentScreen({ onCapabilitySelect, onProductSelect }: IntentScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<IntentCategory | 'all'>('all');
  const workspaceMode = useWorkspaceStore((s) => s.workspaceMode);
  const setWorkspaceMode = useWorkspaceStore((s) => s.setWorkspaceMode);

  // Filter capabilities based on search
  const filteredCapabilities = useMemo(() => {
    let caps = searchQuery ? searchCapabilities(searchQuery) : CAPABILITIES;
    return caps;
  }, [searchQuery]);

  // Handle capability selection
  const handleCapabilitySelect = (capabilityId: string) => {
    const products = getProductsForCapability(capabilityId);
    if (products.length > 0) {
      onProductSelect(products[0].id);
    }
    onCapabilitySelect(capabilityId);
  };

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: '#0a0a0f' }}>
      {/* Hero section */}
      <div className="relative px-6 pb-6 pt-10 sm:px-10 sm:pt-14">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[300px]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06), transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mx-auto max-w-4xl"
        >
          {/* VVU Logo */}
          <div className="mb-6 flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" aria-hidden>
              <defs>
                <linearGradient id="rg1is" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A9A5B" />
                  <stop offset="100%" stopColor="#6B7A3E" />
                </linearGradient>
                <linearGradient id="rg2is" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CC7722" />
                  <stop offset="100%" stopColor="#A85E15" />
                </linearGradient>
                <linearGradient id="rg3is" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2E3DB" />
                  <stop offset="100%" stopColor="#C4C5BD" />
                </linearGradient>
              </defs>
              <circle cx="35" cy="40" r="16" stroke="url(#rg1is)" strokeWidth="5.5" />
              <circle cx="65" cy="40" r="16" stroke="url(#rg2is)" strokeWidth="5.5" />
              <circle cx="50" cy="64" r="16" stroke="url(#rg3is)" strokeWidth="5.5" />
              <circle cx="50" cy="50" r="2" fill="#C9A84C" opacity="0.8" />
            </svg>
            <div className="leading-none">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Venture Vision <span style={{ color: '#C9A84C' }}>Ubuntu</span>
              </h1>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Operating Environment
              </span>
            </div>
          </div>

          {/* Title - universal greeting */}
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {getGreeting()}. What would you like to do?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/80">
            Choose a direction and the environment assembles itself around your goal.
          </p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search for anything — study, cook, build, create, organize..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-white/[0.08] bg-white/[0.03] pl-10 text-sm placeholder:text-muted-foreground/50 focus:border-emerald-500/40 focus:ring-emerald-500/20"
            />
          </div>

          {/* Intent Category Selector */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                What are you looking to do?
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <IntentCategoryCardAll
                isSelected={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {(Object.entries(INTENT_CATEGORIES) as [IntentCategory, typeof INTENT_CATEGORIES[IntentCategory]][]).map(
                ([key, config]) => (
                  <IntentCategoryCard
                    key={key}
                    category={key}
                    isSelected={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                  />
                ),
              )}
            </div>
          </div>

          {/* Workspace Context Selector */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                Workspace
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/40">
                — How do you want to work?
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(WORKSPACE_CONTEXTS) as [WorkspaceContext, typeof WORKSPACE_CONTEXTS[WorkspaceContext]][]).map(
                ([key, config]) => {
                  const isActive = workspaceMode === key;
                  const CtxIcon = ICON_MAP[config.icon] ?? Activity;
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setWorkspaceMode(key)}
                      className={`group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all ${
                        isActive
                          ? 'border-white/15 bg-white/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                      }`}
                      style={isActive ? { boxShadow: `0 0 16px ${config.color}15` } : undefined}
                    >
                      <CtxIcon
                        className="h-3.5 w-3.5"
                        style={{ color: isActive ? config.color : undefined }}
                        strokeWidth={1.8}
                      />
                      <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {config.label}
                      </span>
                      {isActive && (
                        <div
                          className="absolute -bottom-px left-2 right-2 h-px rounded-full"
                          style={{ background: config.color }}
                        />
                      )}
                    </motion.button>
                  );
                },
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content grid */}
      <div className="relative flex-1 px-6 pb-10 sm:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Maturity Stage + Active Agents row */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MaturityStageIndicator />
            <ActiveAgentsPreview />
          </div>

          {/* Capability grid */}
          {searchQuery && filteredCapabilities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No capabilities found for &ldquo;{searchQuery}&rdquo;
              </p>
            </motion.div>
          )}

          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
              Capabilities
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/40">
              {filteredCapabilities.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCapabilities.map((cap, idx) => (
              <CapabilityCard
                key={cap.id}
                capability={cap}
                onSelect={handleCapabilitySelect}
                index={idx}
              />
            ))}
          </div>

          {/* Persona Stories — Visual examples of who uses VVU */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                Who uses VVU?
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { emoji: '🎓', name: 'Sally', role: 'Student', color: '#3dd6ff' },
                { emoji: '📷', name: 'Bob', role: 'Photographer', color: '#b23dff' },
                { emoji: '👵', name: 'Granny', role: 'Family Keeper', color: '#C9A84C' },
                { emoji: '🚀', name: 'Entrepreneur', role: 'Builder', color: '#CC7722' },
                { emoji: '🌍', name: 'Community', role: 'Leader', color: '#8A9A5B' },
              ].map((persona) => (
                <motion.div
                  key={persona.name}
                  whileHover={{ scale: 1.03 }}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <span className="text-2xl">{persona.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{persona.name}</span>
                  <span className="font-mono text-[9px]" style={{ color: persona.color }}>{persona.role}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IntentCategoryCard for "all" category
// ---------------------------------------------------------------------------

function IntentCategoryCardAll({
  isSelected,
  onClick,
}: {
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
        isSelected
          ? 'border-emerald-500/30 bg-emerald-500/10 shadow-lg'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
        isSelected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/[0.06]'
      }`}>
        <Sparkles className={`h-5 w-5 ${isSelected ? 'text-emerald-400' : 'text-muted-foreground'}`} strokeWidth={1.6} />
      </div>
      <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
        All
      </span>
      {isSelected && (
        <div className="absolute -bottom-px left-3 right-3 h-px rounded-full bg-emerald-500" />
      )}
    </motion.button>
  );
}
