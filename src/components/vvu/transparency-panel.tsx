'use client';

/**
 * Ubuntu Pools Transparency Panel — Phase 4
 * -------------------------------------------
 * Confidence indicators, explainability data, and dynamic risk indicators
 * for Ubuntu Pools and other VVU products.
 *
 * Components:
 *   ConfidenceIndicator  — circular gauge (0–100%) with color transitions
 *   ExplainabilityPanel  — SHAP/LIME feature importance + "What if" scenarios
 *   RiskIndicator        — dynamic risk level with trend & factors
 *   MaturityProgress     — 7-stage epistemic maturity progress bar
 *
 * Design: VVU dark aesthetic (#0a0a0f / #0f0f18), glassmorphism,
 * emerald primary (#10b981), amber/gold accent (#C9A84C), font-mono for labels.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Slider,
} from '@/components/ui/slider';
import {
  type EpistemicMaturity,
  MATURITY_STAGES,
  MATURITY_LABELS,
  MATURITY_COLORS,
  MATURITY_DESCRIPTIONS,
  getMaturityIndex,
  getMaturityProgress,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function confidenceColor(value: number): string {
  if (value < 30) return '#ef4444'; // red
  if (value <= 70) return '#f59e0b'; // amber
  return '#10b981'; // emerald
}

function confidenceColorClass(value: number): string {
  if (value < 30) return 'text-red-400';
  if (value <= 70) return 'text-amber-400';
  return 'text-emerald-400';
}

function riskLevelColor(level: string): string {
  switch (level) {
    case 'Low': return '#10b981';
    case 'Medium': return '#f59e0b';
    case 'High': return '#ef4444';
    case 'Critical': return '#dc2626';
    default: return '#4a4d5a';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureContribution {
  /** Feature name */
  feature: string;
  /** SHAP value (positive = increases confidence, negative = decreases) */
  shapValue: number;
  /** Human-readable explanation */
  description: string;
  /** Current value of this feature */
  currentValue: number;
  /** Adjustable range for "What if" scenarios */
  range: [number, number];
  /** Step for slider adjustments */
  step: number;
  /** Unit label */
  unit: string;
}

export interface RiskFactor {
  /** Factor name */
  name: string;
  /** Individual risk score (0–100) */
  score: number;
  /** Human-readable explanation */
  description: string;
}

export type RiskTrend = 'up' | 'down' | 'stable';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// ---------------------------------------------------------------------------
// ConfidenceIndicator
// ---------------------------------------------------------------------------

export interface ConfidenceIndicatorProps {
  /** Confidence level 0–100 */
  value: number;
  /** What this confidence measures */
  label?: string;
  /** Subtitle explaining the measurement */
  subtitle?: string;
  /** Size in pixels */
  size?: number;
  /** Animate on mount */
  animate?: boolean;
  /** Additional class */
  className?: string;
}

export function ConfidenceIndicator({
  value,
  label = 'Confidence',
  subtitle = 'Model prediction confidence based on evidence quality',
  size = 160,
  animate = true,
  className = '',
}: ConfidenceIndicatorProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));

  // Use Framer Motion's motion value for the animated number
  const motionValue = useMotionValue(animate ? 0 : clampedValue);
  const displayValue = useTransform(motionValue, (v) => Math.round(v));
  const fillOffset = useTransform(
    motionValue,
    (v) => circumference - (v / 100) * circumference
  );
  const color = useTransform(motionValue, (v) => confidenceColor(v));

  // Subscribe to motion values for rendering (React won't re-render on motion value changes)
  const [displayNumber, setDisplayNumber] = useState(animate ? 0 : clampedValue);
  const [currentColor, setCurrentColor] = useState(confidenceColor(animate ? 0 : clampedValue));
  const [currentOffset, setCurrentOffset] = useState(
    circumference - ((animate ? 0 : clampedValue) / 100) * circumference
  );

  useEffect(() => {
    const controls = motionAnimate(motionValue, clampedValue, {
      duration: animate ? 1.2 : 0,
      ease: [0.22, 1, 0.36, 1],
    });

    // Subscribe to motion values for display
    const unsubValue = displayValue.on('change', (v) => setDisplayNumber(v));
    const unsubColor = color.on('change', (v) => setCurrentColor(v));
    const unsubOffset = fillOffset.on('change', (v) => setCurrentOffset(v));

    return () => {
      controls.stop();
      unsubValue();
      unsubColor();
      unsubOffset();
    };
  }, [clampedValue, animate, motionValue, displayValue, color, fillOffset]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${currentColor}18 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* SVG Gauge */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative z-10 -rotate-90"
          role="img"
          aria-label={`${label}: ${clampedValue}%`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            style={{
              filter: `drop-shadow(0 0 8px ${currentColor}55)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ color: currentColor }}
          >
            {displayNumber}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
            {label}
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="max-w-[220px] text-center font-mono text-[10px] leading-relaxed text-white/40">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExplainabilityPanel
// ---------------------------------------------------------------------------

export interface ExplainabilityPanelProps {
  /** Feature contributions with SHAP values */
  features: FeatureContribution[];
  /** Overall confidence value (for the "What if" recalculated output) */
  confidence: number;
  /** Panel title */
  title?: string;
  /** Additional class */
  className?: string;
}

export function ExplainabilityPanel({
  features,
  confidence,
  title = 'Decision Explainability',
  className = '',
}: ExplainabilityPanelProps) {
  const [whatIfValues, setWhatIfValues] = useState<Record<string, number>>(
    () => Object.fromEntries(features.map((f) => [f.feature, f.currentValue]))
  );
  const [showWhatIf, setShowWhatIf] = useState(false);

  const maxAbsShap = useMemo(
    () => Math.max(...features.map((f) => Math.abs(f.shapValue)), 0.01),
    [features]
  );

  // Recalculate "What if" confidence (simplified linear model)
  const whatIfConfidence = useMemo(() => {
    const originalTotal = features.reduce((s, f) => s + f.shapValue, 0);
    const adjustedTotal = features.reduce((s, f) => {
      const delta = (whatIfValues[f.feature] ?? f.currentValue) - f.currentValue;
      const sensitivity = f.shapValue / (f.currentValue || 1);
      return s + f.shapValue + delta * sensitivity * 0.5;
    }, 0);
    const scale = originalTotal !== 0 ? adjustedTotal / originalTotal : 1;
    return Math.max(0, Math.min(100, Math.round(confidence * scale)));
  }, [features, whatIfValues, confidence]);

  const handleWhatIfChange = useCallback(
    (feature: string, value: number[]) => {
      setWhatIfValues((prev) => ({ ...prev, [feature]: value[0] }));
    },
    []
  );

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">
            {title}
          </h3>
        </div>
        <button
          onClick={() => setShowWhatIf(!showWhatIf)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[9.5px] uppercase tracking-wider text-white/60 transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.06] hover:text-amber-400"
        >
          <Sparkles className="h-3 w-3" />
          {showWhatIf ? 'Hide What If' : 'What If'}
        </button>
      </div>

      {/* SHAP value bars */}
      <div className="flex flex-col gap-2.5">
        {features.map((f) => {
          const isPositive = f.shapValue >= 0;
          const barWidth = (Math.abs(f.shapValue) / maxAbsShap) * 100;
          const barColor = isPositive ? '#10b981' : '#ef4444';

          return (
            <div key={f.feature} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1.5 text-left">
                      <span className="font-mono text-[11px] text-white/70">
                        {f.feature}
                      </span>
                      <HelpCircle className="h-3 w-3 text-white/20" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[260px] border-white/10 bg-[#0f0f18] text-[11px] text-white/80"
                  >
                    {f.description}
                  </TooltipContent>
                </Tooltip>
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: barColor }}
                >
                  {isPositive ? '+' : ''}
                  {f.shapValue.toFixed(3)}
                </span>
              </div>
              {/* Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                {/* Center line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
                <motion.div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    background: isPositive
                      ? `linear-gradient(90deg, ${barColor}88, ${barColor})`
                      : `linear-gradient(270deg, ${barColor}88, ${barColor})`,
                    boxShadow: `0 0 6px ${barColor}44`,
                    width: `${barWidth / 2}%`,
                    transformOrigin: isPositive ? 'left' : 'right',
                    ...(isPositive
                      ? { left: '50%', right: 'auto' }
                      : { right: '50%', left: 'auto' }),
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {/* What-if slider */}
              <AnimatePresence>
                {showWhatIf && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <div className="mt-1.5 flex items-center gap-3 pl-1">
                      <span className="font-mono text-[9px] text-white/30">
                        {f.unit}
                      </span>
                      <Slider
                        min={f.range[0]}
                        max={f.range[1]}
                        step={f.step}
                        value={[whatIfValues[f.feature] ?? f.currentValue]}
                        onValueChange={(v) => handleWhatIfChange(f.feature, v)}
                        className="flex-1"
                      />
                      <span className="min-w-[36px] text-right font-mono text-[10px] tabular-nums text-white/50">
                        {(whatIfValues[f.feature] ?? f.currentValue).toFixed(
                          f.step < 1 ? 1 : 0
                        )}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-[9px] text-white/40">
            Increases confidence
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="font-mono text-[9px] text-white/40">
            Decreases confidence
          </span>
        </div>
      </div>

      {/* What-if result */}
      <AnimatePresence>
        {showWhatIf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400/80">
                  What-if confidence
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-lg font-bold tabular-nums"
                  style={{ color: confidenceColor(whatIfConfidence) }}
                >
                  {whatIfConfidence}%
                </span>
                <ArrowRight className="h-3 w-3 text-white/20" />
                <span className="font-mono text-sm text-white/30">
                  was {confidence}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiskIndicator
// ---------------------------------------------------------------------------

export interface RiskIndicatorProps {
  /** Current risk level */
  level: RiskLevel;
  /** Risk trend */
  trend: RiskTrend;
  /** Risk factors with individual scores */
  factors: RiskFactor[];
  /** Overall risk score (0–100) for "What if" comparison */
  riskScore: number;
  /** Title */
  title?: string;
  /** Additional class */
  className?: string;
}

export function RiskIndicator({
  level,
  trend,
  factors,
  riskScore,
  title = 'Dynamic Risk Assessment',
  className = '',
}: RiskIndicatorProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfFactors, setWhatIfFactors] = useState<Record<string, number>>(
    () => Object.fromEntries(factors.map((f) => [f.name, f.score]))
  );

  const levelColor = riskLevelColor(level);

  const whatIfScore = useMemo(() => {
    const originalSum = factors.reduce((s, f) => s + f.score, 0);
    const adjustedSum = factors.reduce(
      (s, f) => s + (whatIfFactors[f.name] ?? f.score),
      0
    );
    if (originalSum === 0) return riskScore;
    return Math.max(0, Math.min(100, Math.round(riskScore * (adjustedSum / originalSum))));
  }, [factors, whatIfFactors, riskScore]);

  const whatIfLevel = useMemo((): RiskLevel => {
    if (whatIfScore < 25) return 'Low';
    if (whatIfScore < 50) return 'Medium';
    if (whatIfScore < 75) return 'High';
    return 'Critical';
  }, [whatIfScore]);

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? '#ef4444'
      : trend === 'down'
        ? '#10b981'
        : '#f59e0b';

  const handleFactorChange = useCallback(
    (name: string, value: number[]) => {
      setWhatIfFactors((prev) => ({ ...prev, [name]: value[0] }));
    },
    []
  );

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" style={{ color: levelColor }} />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">
            {title}
          </h3>
        </div>
        <button
          onClick={() => setShowWhatIf(!showWhatIf)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[9.5px] uppercase tracking-wider text-white/60 transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.06] hover:text-amber-400"
        >
          <Sparkles className="h-3 w-3" />
          {showWhatIf ? 'Hide What If' : 'What If'}
        </button>
      </div>

      {/* Current risk level */}
      <div className="flex items-center gap-4">
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${levelColor}40`,
            background: `${levelColor}10`,
            boxShadow: `0 0 24px ${levelColor}18`,
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span
            className="font-mono text-sm font-bold"
            style={{ color: levelColor }}
          >
            {level}
          </span>
        </motion.div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-white/90">
              {riskScore}
            </span>
            <span className="font-mono text-[10px] text-white/30">
              / 100
            </span>
            <div className="ml-1 flex items-center gap-1" style={{ color: trendColor }}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
              </span>
            </div>
          </div>
          {/* Risk score bar */}
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${levelColor}88, ${levelColor})`,
                boxShadow: `0 0 8px ${levelColor}44`,
                width: `${riskScore}%`,
                transformOrigin: 'left',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Risk factors */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
          Risk Factors
        </span>
        {factors.map((f) => {
          const factorColor =
            f.score < 30 ? '#10b981' : f.score < 60 ? '#f59e0b' : '#ef4444';
          return (
            <div key={f.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1.5 text-left">
                      <span className="font-mono text-[11px] text-white/70">
                        {f.name}
                      </span>
                      <HelpCircle className="h-3 w-3 text-white/20" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[240px] border-white/10 bg-[#0f0f18] text-[11px] text-white/80"
                  >
                    {f.description}
                  </TooltipContent>
                </Tooltip>
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: factorColor }}
                >
                  {f.score}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: factorColor,
                    boxShadow: `0 0 4px ${factorColor}44`,
                    width: `${f.score}%`,
                    transformOrigin: 'left',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {/* What-if slider */}
              <AnimatePresence>
                {showWhatIf && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div className="mt-1 flex items-center gap-3 pl-1">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[whatIfFactors[f.name] ?? f.score]}
                        onValueChange={(v) => handleFactorChange(f.name, v)}
                        className="flex-1"
                      />
                      <span className="min-w-[28px] text-right font-mono text-[10px] tabular-nums text-white/40">
                        {whatIfFactors[f.name] ?? f.score}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* What-if comparison */}
      <AnimatePresence>
        {showWhatIf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400/80">
                  What-if risk
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-lg font-bold tabular-nums"
                  style={{ color: riskLevelColor(whatIfLevel) }}
                >
                  {whatIfScore}
                </span>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: riskLevelColor(whatIfLevel) }}
                >
                  ({whatIfLevel})
                </span>
                <ArrowRight className="h-3 w-3 text-white/20" />
                <span className="font-mono text-sm text-white/30">
                  was {riskScore} ({level})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MaturityProgress
// ---------------------------------------------------------------------------

export interface MaturityProgressProps {
  /** Current epistemic maturity stage */
  currentStage: EpistemicMaturity;
  /** Title */
  title?: string;
  /** Additional class */
  className?: string;
}

export function MaturityProgress({
  currentStage,
  title = 'Epistemic Maturity',
  className = '',
}: MaturityProgressProps) {
  const currentIndex = getMaturityIndex(currentStage);
  const progress = getMaturityProgress(currentStage);
  const currentColor = MATURITY_COLORS[currentStage];

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: currentColor }} />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider"
            style={{
              borderColor: `${currentColor}40`,
              background: `${currentColor}10`,
              color: currentColor,
            }}
          >
            {MATURITY_LABELS[currentStage]}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-white/30">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${MATURITY_COLORS.unknown}, ${currentColor})`,
              boxShadow: `0 0 8px ${currentColor}44`,
              width: `${progress * 100}%`,
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Stage markers */}
        <div className="relative mt-3">
          <div className="absolute inset-x-0 top-0 flex justify-between">
            {MATURITY_STAGES.map((stage, i) => {
              const isCurrent = i === currentIndex;
              const isPast = i < currentIndex;
              const stageColor = MATURITY_COLORS[stage];
              const position = (i / (MATURITY_STAGES.length - 1)) * 100;

              return (
                <div
                  key={stage}
                  className="flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Dot */}
                  <motion.div
                    className="rounded-full border"
                    style={{
                      width: isCurrent ? 12 : 8,
                      height: isCurrent ? 12 : 8,
                      borderColor: isCurrent
                        ? currentColor
                        : isPast
                          ? `${stageColor}80`
                          : 'rgba(255,255,255,0.08)',
                      background: isCurrent
                        ? currentColor
                        : isPast
                          ? `${stageColor}55`
                          : 'rgba(255,255,255,0.03)',
                      boxShadow: isCurrent
                        ? `0 0 12px ${currentColor}55`
                        : 'none',
                    }}
                    animate={
                      isCurrent
                        ? { scale: [1, 1.15, 1] }
                        : undefined
                    }
                    transition={
                      isCurrent
                        ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                        : undefined
                    }
                  />
                  {/* Label */}
                  <span
                    className="mt-1.5 text-center font-mono text-[8px] leading-tight"
                    style={{
                      color: isCurrent
                        ? currentColor
                        : isPast
                          ? 'rgba(255,255,255,0.45)'
                          : 'rgba(255,255,255,0.18)',
                      fontWeight: isCurrent ? 600 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {MATURITY_LABELS[stage]}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Spacer for labels */}
          <div className="h-10" />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-none" style={{ color: currentColor }} />
          <p className="font-mono text-[10px] leading-relaxed text-white/50">
            {MATURITY_DESCRIPTIONS[currentStage]}
          </p>
        </div>
      </div>

      {/* Transition arrows */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex flex-col items-center gap-0.5">
          {currentIndex > 0 && (
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 rotate-180 text-white/20" />
              <span className="font-mono text-[9px] text-white/30">
                {MATURITY_LABELS[MATURITY_STAGES[currentIndex - 1]]}
              </span>
            </div>
          )}
          {currentIndex === 0 && (
            <span className="font-mono text-[9px] text-white/15">
              Origin
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-white/20" />
          <span
            className="font-mono text-[9px] font-semibold"
            style={{ color: currentColor }}
          >
            {MATURITY_LABELS[currentStage]}
          </span>
          <ChevronRight className="h-3 w-3 text-white/20" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          {currentIndex < MATURITY_STAGES.length - 1 && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-white/30">
                {MATURITY_LABELS[MATURITY_STAGES[currentIndex + 1]]}
              </span>
              <ChevronRight className="h-3 w-3 text-white/20" />
            </div>
          )}
          {currentIndex === MATURITY_STAGES.length - 1 && (
            <span className="font-mono text-[9px] text-emerald-500/60">
              Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composite: TransparencyPanel
// ---------------------------------------------------------------------------

export interface TransparencyPanelProps {
  /** Confidence value (0–100) */
  confidence: number;
  /** Feature contributions */
  features: FeatureContribution[];
  /** Risk level */
  riskLevel: RiskLevel;
  /** Risk trend */
  riskTrend: RiskTrend;
  /** Risk factors */
  riskFactors: RiskFactor[];
  /** Overall risk score (0–100) */
  riskScore: number;
  /** Current epistemic maturity stage */
  maturity: EpistemicMaturity;
  /** Additional class */
  className?: string;
}

/**
 * Full transparency panel combining all four indicators.
 * This is the main export for the Ubuntu Pools Transparency Panel (Phase 4).
 */
export function TransparencyPanel({
  confidence,
  features,
  riskLevel,
  riskTrend,
  riskFactors,
  riskScore,
  maturity,
  className = '',
}: TransparencyPanelProps) {
  return (
    <div
      className={`flex flex-col gap-5 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, #0f0f18, #09090f 75%)',
      }}
    >
      {/* Top accent line */}
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, #10b981, #C9A84C, transparent)',
        }}
        aria-hidden
      />

      {/* Section header */}
      <div className="flex items-center gap-3 px-1">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/70">
          Ubuntu Pools &middot; Transparency Panel
        </h2>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* Confidence + Risk row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <ConfidenceIndicator
            value={confidence}
            label="Pool Confidence"
            subtitle="Aggregate confidence based on contribution verification, attestation coverage, and evidence quality across all pool members."
            size={180}
          />
        </div>
        <RiskIndicator
          level={riskLevel}
          trend={riskTrend}
          factors={riskFactors}
          riskScore={riskScore}
        />
      </div>

      {/* Explainability */}
      <ExplainabilityPanel features={features} confidence={confidence} />

      {/* Maturity */}
      <MaturityProgress currentStage={maturity} />
    </div>
  );
}
