'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Droplets,
  Users,
  BrainCircuit,
  GitBranch,
  Activity,
  FlaskConical,
  Share2,
  Shield,
  FileCheck2,
  Award,
  type LucideIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Cpu,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type EpistemicMaturity,
  type TrustPassportEntry,
  MATURITY_STAGES,
  MATURITY_LABELS,
  MATURITY_COLORS,
  MATURITY_TAILWIND,
  calculateOverallMaturity,
  calculateTrustScore,
  getMaturityIndex,
} from '@/lib/vvu/three-roots';
import { useWorkspaceStore } from '@/lib/vvu/workspace-store';
import {
  CAPABILITIES,
  CAPABILITY_MAP,
  type Capability,
} from '@/lib/vvu/capability-registry';

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

function DynamicIcon({
  name,
  ...props
}: { name: string } & React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  const Icon = ICON_MAP[name] ?? ShieldCheck;
  return <Icon {...props} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a TrustPassportEntry from workspace store data + capability registry */
function buildPassportEntry(
  capabilityId: string,
  trustProgress: { completedSteps: string[]; completed: boolean; lastUpdated: string } | undefined,
): TrustPassportEntry {
  const capability = CAPABILITY_MAP[capabilityId];
  const totalSteps = capability?.trustJourney.length ?? 0;
  const completedSteps = trustProgress?.completedSteps ?? [];
  const lastUpdated = trustProgress?.lastUpdated ?? new Date().toISOString();

  // Determine maturity based on completed steps
  const progressRatio = totalSteps > 0 ? completedSteps.length / totalSteps : 0;
  let maturity: EpistemicMaturity = 'unknown';
  if (progressRatio >= 1) maturity = 'institutional-memory';
  else if (progressRatio >= 0.85) maturity = 'operational';
  else if (progressRatio >= 0.7) maturity = 'attested';
  else if (progressRatio >= 0.5) maturity = 'verified';
  else if (progressRatio >= 0.3) maturity = 'investigated';
  else if (progressRatio > 0) maturity = 'observed';

  // Simulated event/attestation counts based on progress (deterministic)
  const seed = capabilityId.length + completedSteps.length;
  const eventCount = Math.floor(completedSteps.length * 3.7 + (seed % 3));
  const attestationCount = maturity === 'attested' || maturity === 'operational' || maturity === 'institutional-memory'
    ? Math.floor(completedSteps.length * 0.6)
    : 0;

  return {
    capabilityId,
    maturity,
    completedSteps,
    totalSteps,
    lastUpdated,
    eventCount,
    attestationCount,
    environmentSound: progressRatio > 0.1,
  };
}

// ---------------------------------------------------------------------------
// Trust Score Circle (SVG Gauge)
// ---------------------------------------------------------------------------

function TrustScoreCircle({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = size * 0.06;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  // Color based on score
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#C9A84C' : score >= 25 ? '#CC7722' : '#4a4d5a';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 8px ${scoreColor}40)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-3xl font-bold tabular-nums"
          style={{ color: scoreColor }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-0.5">
          Trust Score
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Trust Score Circle (for dock)
// ---------------------------------------------------------------------------

function TrustScoreMiniCircle({ score }: { score: number }) {
  const size = 56;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#C9A84C' : score >= 25 ? '#CC7722' : '#4a4d5a';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xs font-bold tabular-nums" style={{ color: scoreColor }}>
          {score}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Epistemic Maturity Timeline
// ---------------------------------------------------------------------------

function MaturityTimeline({ currentMaturity }: { currentMaturity: EpistemicMaturity }) {
  const currentIndex = getMaturityIndex(currentMaturity);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-emerald-400" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          Epistemic Maturity
        </h3>
      </div>

      {/* Timeline track */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-3 h-px bg-white/[0.06]" />

        {/* Stage nodes */}
        <div className="relative flex justify-between">
          {MATURITY_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const color = MATURITY_COLORS[stage];

            return (
              <div key={stage} className="flex flex-col items-center gap-1.5" style={{ minWidth: 0 }}>
                {/* Node dot */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.06 }}
                  className="relative z-10"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                      isCurrent
                        ? 'border-current bg-current/20 shadow-[0_0_12px_currentColor]'
                        : isCompleted
                          ? 'border-current/40 bg-current/10'
                          : 'border-white/[0.08] bg-[#0f0f18]'
                    }`}
                    style={{
                      color: isFuture ? undefined : color,
                      borderColor: isFuture ? undefined : isCurrent ? color : `${color}66`,
                      boxShadow: isCurrent ? `0 0 12px ${color}40` : undefined,
                    }}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="h-3 w-3" style={{ color }} />
                    )}
                    {isCurrent && (
                      <motion.div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    {isFuture && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white/[0.08]" />
                    )}
                  </div>
                </motion.div>

                {/* Label */}
                <span
                  className={`font-mono text-[8px] leading-tight text-center transition-colors ${
                    isCurrent
                      ? MATURITY_TAILWIND[stage]
                      : isCompleted
                        ? 'text-muted-foreground/60'
                        : 'text-muted-foreground/30'
                  }`}
                  style={{ maxWidth: 72 }}
                >
                  {MATURITY_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capability Entry Card
// ---------------------------------------------------------------------------

function CapabilityEntryCard({
  entry,
  capability,
  index,
}: {
  entry: TrustPassportEntry;
  capability: Capability;
  index: number;
}) {
  const maturityIndex = getMaturityIndex(entry.maturity);
  const progressPercent = entry.totalSteps > 0
    ? (entry.completedSteps.length / entry.totalSteps) * 100
    : 0;
  const color = MATURITY_COLORS[entry.maturity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]"
    >
      {/* Left accent line */}
      <div
        className="absolute left-0 top-2 bottom-2 w-px rounded-full transition-opacity opacity-60 group-hover:opacity-100"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start gap-3">
        {/* Capability icon */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors"
          style={{
            borderColor: `${color}30`,
            backgroundColor: `${color}10`,
          }}
        >
          <DynamicIcon
            name={capability.icon}
            className="h-4 w-4"
            style={{ color }}
            strokeWidth={1.6}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: name + maturity badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-foreground truncate">
              {capability.label}
            </span>
            <span
              className={`shrink-0 font-mono text-[8px] uppercase tracking-wider ${MATURITY_TAILWIND[entry.maturity]}`}
            >
              {MATURITY_LABELS[entry.maturity]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground/60 shrink-0 tabular-nums">
              {entry.completedSteps.length}/{entry.totalSteps}
            </span>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50">
              <Activity className="h-2.5 w-2.5" />
              {entry.eventCount} events
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50">
              <FileCheck2 className="h-2.5 w-2.5" />
              {entry.attestationCount} attestations
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50">
              {entry.environmentSound ? (
                <Volume2 className="h-2.5 w-2.5 text-emerald-400/60" />
              ) : (
                <VolumeX className="h-2.5 w-2.5 text-red-400/40" />
              )}
              {entry.environmentSound ? 'Sound' : 'Unsound'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Three-Root Status
// ---------------------------------------------------------------------------

function ThreeRootStatus({
  entries,
  overallMaturity,
}: {
  entries: TrustPassportEntry[];
  overallMaturity: EpistemicMaturity;
}) {
  const historyIntact = overallMaturity !== 'unknown';
  const semanticSound = entries.every((e) => e.environmentSound);
  const totalAttestations = entries.reduce((sum, e) => sum + e.attestationCount, 0);
  const trustCertificates = totalAttestations;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-amber-400" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          Three-Root Architecture
        </h3>
      </div>

      <div className="space-y-3">
        {/* History Root */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-mono text-[10px] text-muted-foreground/70">History Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            {historyIntact ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-amber-400" />
            )}
            <span className={`font-mono text-[10px] font-semibold ${historyIntact ? 'text-emerald-400' : 'text-amber-400'}`}>
              {historyIntact ? 'Intact' : 'No Evidence'}
            </span>
          </div>
        </div>

        {/* Semantic Root */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-mono text-[10px] text-muted-foreground/70">Semantic Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            {semanticSound ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            ) : (
              <XCircle className="h-3 w-3 text-red-400" />
            )}
            <span className={`font-mono text-[10px] font-semibold ${semanticSound ? 'text-emerald-400' : 'text-red-400'}`}>
              {semanticSound ? 'SOUND' : 'DEFECTIVE'}
            </span>
          </div>
        </div>

        {/* Trust Root */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-mono text-[10px] text-muted-foreground/70">Trust Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3 w-3 text-amber-400/60" />
            <span className="font-mono text-[10px] text-amber-400/80">
              {trustCertificates} cert{trustCertificates !== 1 ? 's' : ''}
            </span>
            <span className={`font-mono text-[10px] font-semibold ${trustCertificates > 0 ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
              {trustCertificates > 0 ? 'Active' : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TrustPassport Component
// ---------------------------------------------------------------------------

export function TrustPassport() {
  const trustPassport = useWorkspaceStore((s) => s.trustPassport);

  // Build entries from workspace store data
  const entries = useMemo(() => {
    return CAPABILITIES.map((cap) =>
      buildPassportEntry(cap.id, trustPassport[cap.id])
    );
  }, [trustPassport]);

  // Calculate aggregate metrics
  const entriesMap = useMemo(() => {
    const map: Record<string, TrustPassportEntry> = {};
    entries.forEach((e) => {
      map[e.capabilityId] = e;
    });
    return map;
  }, [entries]);

  const overallMaturity = useMemo(() => calculateOverallMaturity(entriesMap), [entriesMap]);
  const trustScore = useMemo(() => calculateTrustScore(entriesMap), [entriesMap]);
  const totalEvents = useMemo(() => entries.reduce((s, e) => s + e.eventCount, 0), [entries]);
  const totalAttestations = useMemo(() => entries.reduce((s, e) => s + e.attestationCount, 0), [entries]);

  const maturityColor = MATURITY_COLORS[overallMaturity];

  return (
    <div
      className="flex h-full flex-col overflow-y-auto"
      style={{ background: '#0a0a0f' }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${maturityColor}08, transparent 70%)`,
        }}
      />

      <div className="relative px-6 pb-8 pt-8 sm:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-foreground">Trust Passport</h2>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Your epistemic maturity across all VVU capabilities
            </p>
          </motion.div>

          {/* Top section: Score + Maturity + Roots */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
            {/* Left: Trust Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <TrustScoreCircle score={trustScore} />

              {/* Stats row */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                    {totalEvents}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">
                    Events
                  </span>
                </div>
                <div className="h-6 w-px bg-white/[0.06]" />
                <div className="flex flex-col items-center">
                  <span className="font-mono text-sm font-bold text-amber-400/80 tabular-nums">
                    {totalAttestations}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">
                    Attestations
                  </span>
                </div>
              </div>

              {/* Current maturity label */}
              <div className="mt-3 flex items-center gap-1.5">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: maturityColor }}
                />
                <span className={`font-mono text-[9px] uppercase tracking-wider ${MATURITY_TAILWIND[overallMaturity]}`}>
                  {MATURITY_LABELS[overallMaturity]}
                </span>
              </div>
            </motion.div>

            {/* Right: Timeline + Three-Root */}
            <div className="flex flex-col gap-6">
              {/* Maturity Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
              >
                <MaturityTimeline currentMaturity={overallMaturity} />
              </motion.div>

              {/* Three-Root Status */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ThreeRootStatus entries={entries} overallMaturity={overallMaturity} />
              </motion.div>
            </div>
          </div>

          {/* Capability Entries */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-emerald-400/60" />
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                Capability Entries
              </h3>
              <span className="font-mono text-[9px] text-muted-foreground/40">
                {entries.length} capabilities
              </span>
            </div>

            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const capability = CAPABILITY_MAP[entry.capabilityId];
                if (!capability) return null;
                return (
                  <CapabilityEntryCard
                    key={entry.capabilityId}
                    entry={entry}
                    capability={capability}
                    index={idx}
                  />
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrustPassportMini — Compact version for right dock
// ---------------------------------------------------------------------------

export function TrustPassportMini() {
  const trustPassport = useWorkspaceStore((s) => s.trustPassport);

  const entries = useMemo(() => {
    return CAPABILITIES.map((cap) =>
      buildPassportEntry(cap.id, trustPassport[cap.id])
    );
  }, [trustPassport]);

  const entriesMap = useMemo(() => {
    const map: Record<string, TrustPassportEntry> = {};
    entries.forEach((e) => {
      map[e.capabilityId] = e;
    });
    return map;
  }, [entries]);

  const overallMaturity = useMemo(() => calculateOverallMaturity(entriesMap), [entriesMap]);
  const trustScore = useMemo(() => calculateTrustScore(entriesMap), [entriesMap]);
  const maturityColor = MATURITY_COLORS[overallMaturity];

  return (
    <div className="flex flex-col items-center gap-3 py-3">
      {/* Trust score circle */}
      <TrustScoreMiniCircle score={trustScore} />

      {/* Maturity stage indicator */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: maturityColor }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className={`font-mono text-[9px] font-semibold ${MATURITY_TAILWIND[overallMaturity]}`}>
            {MATURITY_LABELS[overallMaturity]}
          </span>
        </div>
        <span className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground/40">
          Maturity Stage
        </span>
      </div>

      {/* Mini maturity dots */}
      <div className="flex items-center gap-1">
        {MATURITY_STAGES.map((stage, idx) => {
          const isCompleted = idx < getMaturityIndex(overallMaturity);
          const isCurrent = idx === getMaturityIndex(overallMaturity);
          return (
            <div
              key={stage}
              className={`h-1 rounded-full transition-all ${
                isCurrent ? 'w-3' : 'w-1.5'
              }`}
              style={{
                backgroundColor: isCompleted || isCurrent
                  ? MATURITY_COLORS[stage]
                  : 'rgba(255,255,255,0.06)',
                boxShadow: isCurrent ? `0 0 6px ${MATURITY_COLORS[stage]}60` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
