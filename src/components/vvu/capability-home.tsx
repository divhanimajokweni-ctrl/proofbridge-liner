'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
};

/**
 * Renders a Lucide icon by name. This is a stable component so the
 * `react-hooks/static-components` lint rule doesn't flag it.
 */
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
// Edition Badge
// ---------------------------------------------------------------------------

const EDITION_CONFIG: Record<string, { label: string; color: string }> = {
  community: { label: 'Community', color: 'text-muted-foreground' },
  professional: { label: 'Professional', color: 'text-amber-400' },
  enterprise: { label: 'Enterprise', color: 'text-rose-400' },
};

function EditionBadge({ edition }: { edition: string }) {
  const config = EDITION_CONFIG[edition] ?? EDITION_CONFIG.community;
  return (
    <span className={`font-mono text-[8px] uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Trust Journey Progress Indicator
// ---------------------------------------------------------------------------

function TrustProgressIndicator({ capabilityId }: { capabilityId: string }) {
  const progress = useWorkspaceStore((s) => s.trustPassport[capabilityId]);
  const capability = CAPABILITY_MAP[capabilityId];

  if (!capability || !progress) {
    // Show empty progress
    const totalSteps = capability?.trustJourney.length ?? 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-3 rounded-full bg-white/[0.06]"
            />
          ))}
        </div>
        <span className="font-mono text-[9px] text-muted-foreground/50">Not started</span>
      </div>
    );
  }

  const completedCount = progress.completedSteps.length;
  const totalSteps = capability.trustJourney.length;
  const percentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {capability.trustJourney.map((step) => {
          const isCompleted = progress.completedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              className={`h-1 w-3 rounded-full transition-colors ${
                isCompleted ? 'bg-emerald-500' : 'bg-white/[0.06]'
              }`}
              title={`${step.title} ${isCompleted ? '(completed)' : ''}`}
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
  );
}

// ---------------------------------------------------------------------------
// Category Grouping
// ---------------------------------------------------------------------------

type Category = 'verification' | 'infrastructure' | 'community' | 'research';

const CATEGORY_MAP: Record<Category, { label: string; color: string; icon: LucideIcon }> = {
  verification: { label: 'Verification', color: 'text-emerald-400', icon: ShieldCheck },
  infrastructure: { label: 'Infrastructure', color: 'text-amber-400', icon: Activity },
  community: { label: 'Community', color: 'text-rose-400', icon: Users },
  research: { label: 'Research & Simulation', color: 'text-cyan-400', icon: FlaskConical },
};

function getCapabilityCategory(cap: Capability): Category {
  if (cap.id === 'verify-authenticity' || cap.id === 'trace-provenance') return 'verification';
  if (cap.id === 'monitor-circuit-health' || cap.id === 'run-inference') return 'infrastructure';
  if (cap.id === 'manage-community-pools') return 'community';
  return 'research';
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
  const category = getCapabilityCategory(capability);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(capability.id)}
      className="group relative flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]"
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-emerald-500/0 transition-colors group-hover:bg-emerald-500/40" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15">
          <DynamicIcon name={capability.icon} className="h-5 w-5 text-emerald-400" strokeWidth={1.6} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{capability.label}</h3>
            <TrustTierBadge tier={capability.trustTier} />
          </div>
          <EditionBadge edition={capability.edition} />
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
        {capability.description}
      </p>

      {/* Products used */}
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

      {/* Trust journey progress */}
      <TrustProgressIndicator capabilityId={capability.id} />

      {/* Category tag */}
      <div className="flex items-center gap-1.5">
        {(() => {
          const catConfig = CATEGORY_MAP[category];
          const CatIcon = catConfig.icon;
          return (
            <>
              <CatIcon className={`h-2.5 w-2.5 ${catConfig.color}`} />
              <span className={`font-mono text-[9px] ${catConfig.color}`}>{catConfig.label}</span>
            </>
          );
        })()}
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Capability Home Screen
// ---------------------------------------------------------------------------

interface CapabilityHomeProps {
  onCapabilitySelect: (capabilityId: string) => void;
  onProductSelect: (productId: string) => void;
}

export function CapabilityHome({ onCapabilitySelect, onProductSelect }: CapabilityHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  // Filter capabilities
  const filteredCapabilities = useMemo(() => {
    let caps = searchQuery ? searchCapabilities(searchQuery) : CAPABILITIES;

    if (activeCategory !== 'all') {
      caps = caps.filter((c) => getCapabilityCategory(c) === activeCategory);
    }

    return caps;
  }, [searchQuery, activeCategory]);

  // Group by category
  const groupedCapabilities = useMemo(() => {
    const groups: Record<Category, Capability[]> = {
      verification: [],
      infrastructure: [],
      community: [],
      research: [],
    };

    filteredCapabilities.forEach((cap) => {
      const cat = getCapabilityCategory(cap);
      groups[cat].push(cap);
    });

    return groups;
  }, [filteredCapabilities]);

  // Handle capability selection — activate the first product that provides it
  const handleCapabilitySelect = (capabilityId: string) => {
    const products = getProductsForCapability(capabilityId);
    if (products.length > 0) {
      onProductSelect(products[0].id);
    }
    onCapabilitySelect(capabilityId);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: '#0a0a0f' }}>
      {/* Hero section */}
      <div className="relative px-6 pb-6 pt-12 sm:px-10 sm:pt-16">
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
                <linearGradient id="rg1h" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A9A5B" />
                  <stop offset="100%" stopColor="#6B7A3E" />
                </linearGradient>
                <linearGradient id="rg2h" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CC7722" />
                  <stop offset="100%" stopColor="#A85E15" />
                </linearGradient>
                <linearGradient id="rg3h" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2E3DB" />
                  <stop offset="100%" stopColor="#C4C5BD" />
                </linearGradient>
              </defs>
              <circle cx="35" cy="40" r="16" stroke="url(#rg1h)" strokeWidth="5.5" />
              <circle cx="65" cy="40" r="16" stroke="url(#rg2h)" strokeWidth="5.5" />
              <circle cx="50" cy="64" r="16" stroke="url(#rg3h)" strokeWidth="5.5" />
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

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            What do you want to do?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/80">
            Choose a capability to get started. Each one maps to a product in the VVU ecosystem.
          </p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-white/[0.08] bg-white/[0.03] pl-10 text-sm placeholder:text-muted-foreground/50 focus:border-emerald-500/40 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all ${
                activeCategory === 'all'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {(Object.entries(CATEGORY_MAP) as [Category, typeof CATEGORY_MAP[Category]][]).map(
              ([key, config]) => {
                const CatIcon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all ${
                      activeCategory === key
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CatIcon className="h-3 w-3" />
                    {config.label}
                  </button>
                );
              },
            )}
          </div>
        </motion.div>
      </div>

      {/* Capability grid */}
      <div className="relative flex-1 px-6 pb-10 sm:px-10">
        <div className="mx-auto max-w-4xl">
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

          {activeCategory === 'all' ? (
            // Show grouped by category
            (Object.entries(groupedCapabilities) as [Category, Capability[]][]).map(
              ([category, caps]) => {
                if (caps.length === 0) return null;
                const catConfig = CATEGORY_MAP[category];
                const CatIcon = catConfig.icon;
                return (
                  <div key={category} className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                      <CatIcon className={`h-4 w-4 ${catConfig.color}`} />
                      <h3 className={`text-sm font-semibold ${catConfig.color}`}>
                        {catConfig.label}
                      </h3>
                      <span className="font-mono text-[9px] text-muted-foreground/50">
                        {caps.length} capabilities
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {caps.map((cap, idx) => (
                        <CapabilityCard
                          key={cap.id}
                          capability={cap}
                          onSelect={handleCapabilitySelect}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                );
              },
            )
          ) : (
            // Show flat grid for selected category
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
          )}
        </div>
      </div>
    </div>
  );
}
