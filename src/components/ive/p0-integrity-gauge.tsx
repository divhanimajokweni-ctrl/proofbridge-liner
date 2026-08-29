"use client";

import { Card } from "@/components/ui/card";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlossaryTerm } from "@/components/vvu/glossary-term";

interface P0IntegrityGaugeProps {
  nInd: number | null;
  evidenceCount: number;
  sourceCount: number;
  threshold: number;
  safetyCritical: boolean;
  breakerTripped: boolean;
}

type PostureLevel = "green" | "amber" | "red" | "gray";

function computePosture(input: {
  nInd: number | null;
  evidenceCount: number;
  sourceCount: number;
  threshold: number;
  safetyCritical: boolean;
  breakerTripped: boolean;
}): { level: PostureLevel; score: number; label: string; description: string } {
  const { nInd, evidenceCount, sourceCount, threshold, safetyCritical, breakerTripped } = input;

  if (breakerTripped) {
    return {
      level: "red",
      score: 0,
      label: "SUSPENDED",
      description: "Circuit breaker tripped — all operational trust suspended per Theorem 5.",
    };
  }

  if (evidenceCount === 0 || nInd === null) {
    return {
      level: "gray",
      score: 0,
      label: "UNTESTED",
      description: "No evidence collected. P0 integrity cannot be evaluated.",
    };
  }

  const integrityMet = nInd >= threshold - 0.3;
  const redundancyStrong = sourceCount >= 3;
  const redundancyAdequate = sourceCount >= 2;

  if (!integrityMet) {
    return {
      level: "red",
      score: 25,
      label: "BREACHED",
      description: `N_ind=${nInd.toFixed(2)} below threshold ${threshold}. Provenance integrity compromised.`,
    };
  }

  if (safetyCritical && !redundancyAdequate) {
    return {
      level: "amber",
      score: 55,
      label: "DEGRADED",
      description: `Integrity met but only ${sourceCount} source(s). Safety-critical requires ≥2.`,
    };
  }

  if (!redundancyStrong) {
    return {
      level: "amber",
      score: 70,
      label: "ADEQUATE",
      description: `Integrity met with ${sourceCount} sources. Add a third source for full strength.`,
    };
  }

  return {
    level: "green",
    score: 100,
    label: "VERIFIED",
    description: `P0 satisfied. N_ind=${nInd.toFixed(2)}, ${sourceCount} independent sources confirmed.`,
  };
}

const LEVEL_STYLES: Record<PostureLevel, {
  bg: string;
  border: string;
  text: string;
  ring: string;
  glow: string;
  icon: typeof Shield;
  iconColor: string;
}> = {
  green: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "stroke-emerald-500",
    glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "stroke-amber-500",
    glow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    icon: ShieldAlert,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  red: {
    bg: "bg-red-500/5",
    border: "border-red-500/40",
    text: "text-red-700 dark:text-red-300",
    ring: "stroke-red-500",
    glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]",
    icon: ShieldX,
    iconColor: "text-red-600 dark:text-red-400",
  },
  gray: {
    bg: "bg-zinc-500/5",
    border: "border-zinc-500/40",
    text: "text-zinc-700 dark:text-zinc-300",
    ring: "stroke-zinc-500",
    glow: "",
    icon: Shield,
    iconColor: "text-zinc-600 dark:text-zinc-400",
  },
};

export function P0IntegrityGauge({
  nInd,
  evidenceCount,
  sourceCount,
  threshold,
  safetyCritical,
  breakerTripped,
}: P0IntegrityGaugeProps) {
  const posture = computePosture({ nInd, evidenceCount, sourceCount, threshold, safetyCritical, breakerTripped });
  const styles = LEVEL_STYLES[posture.level];
  const Icon = styles.icon;

  // SVG gauge parameters
  const size = 140;
  const center = size / 2;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (posture.score / 100) * circumference * 0.75; // 270deg arc
  const rotation = -225; // Start from bottom-left

  return (
    <Card className={cn("p-4 transition-all", styles.bg, styles.border)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
            <GlossaryTerm term="P0 Integrity">P0 Integrity Posture</GlossaryTerm>
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Provenance Integrity Precondition
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          MSA §4
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={8}
              strokeLinecap="round"
              className="text-muted/30"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
              transform={`rotate(${rotation} ${center} ${center})`}
            />
            {/* Score arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={8}
              strokeLinecap="round"
              className={cn(styles.ring, styles.glow)}
              strokeDasharray={`${arcLength} ${circumference}`}
              transform={`rotate(${rotation} ${center} ${center})`}
              style={{ transition: "stroke-dasharray 0.6s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className={cn("h-7 w-7 mb-1", styles.iconColor, styles.glow)} />
            <span className={cn("font-mono text-xs font-bold", styles.text)}>
              {posture.score}
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <div className={cn("font-mono text-base font-bold tracking-wider mb-1", styles.text)}>
            {posture.label}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
            {posture.description}
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="rounded border bg-card/50 px-1.5 py-1">
              <span className="text-muted-foreground"><GlossaryTerm term="N_ind">N_ind</GlossaryTerm></span>
              <span className="ml-1 font-semibold">
                {nInd !== null ? nInd.toFixed(2) : "—"}
              </span>
            </div>
            <div className="rounded border bg-card/50 px-1.5 py-1">
              <span className="text-muted-foreground">Sources</span>
              <span className="ml-1 font-semibold">{sourceCount}</span>
            </div>
            <div className="rounded border bg-card/50 px-1.5 py-1">
              <span className="text-muted-foreground">Evidence</span>
              <span className="ml-1 font-semibold">{evidenceCount}</span>
            </div>
            <div className="rounded border bg-card/50 px-1.5 py-1">
              <span className="text-muted-foreground">Threshold</span>
              <span className="ml-1 font-semibold">{threshold}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground font-mono leading-relaxed">
        P0 = provenance metadata complete, uncorrupted, accurately reflects lineage, not adversarially poisoned.
        When P0 fails, operational trust is suspended and the circuit breaker enforces fail-closed.
      </p>
    </Card>
  );
}
