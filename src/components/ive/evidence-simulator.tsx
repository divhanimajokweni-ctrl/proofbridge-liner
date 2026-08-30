"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Minus,
  RotateCcw,
  Dices,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SourceKey = "you_com" | "brave" | "firecrawl" | "watchdog";

type EvidenceState = Record<SourceKey, number>;

interface SourceConfig {
  label: string;
  /** hex color used for SVG dots */
  dot: string;
  /** tailwind class for the color chip */
  chip: string;
}

const SOURCE_CONFIG: Record<SourceKey, SourceConfig> = {
  you_com: {
    label: "you.com",
    dot: "#10b981", // emerald-500
    chip: "bg-emerald-500",
  },
  brave: {
    label: "brave",
    dot: "#f59e0b", // amber-500
    chip: "bg-amber-500",
  },
  firecrawl: {
    label: "firecrawl",
    dot: "#06b6d4", // cyan-500
    chip: "bg-cyan-500",
  },
  watchdog: {
    label: "watchdog",
    dot: "#ef4444", // red-500
    chip: "bg-red-500",
  },
};

const SOURCE_ORDER: SourceKey[] = ["you_com", "brave", "firecrawl", "watchdog"];

const TARGET_THRESHOLD = 2.0;

/**
 * Compute the simplified participation ratio N_ind from per-source evidence
 * counts.
 *
 *   N_ind ≈ (Σ_s √n_s)² / Σ_s n_s
 *
 * where n_s is the count of evidence items from source s. This is a discrete
 * approximation of the continuous participation ratio used by the EIS math
 * engine:
 *
 *   N_ind = (Σ λ_i)² / Σ λ_i²
 *
 * computed from heat-kernel eigenvalues of the evidence mesh. Each source
 * class contributes one "effective eigenvalue" equal to its count.
 *
 * Examples (matches the spec):
 *   [4,0,0,0] → (2)² / 4         = 1.0  (only one effective source)
 *   [1,1,1,1] → (4)² / 4         = 4.0  (full independence)
 *   [2,2,0,0] → (2·√2)² / 4      = 2.0  (two balanced sources)
 *   [3,1,0,0] → (√3+1)² / 4      ≈ 1.87 (one source dominates → near-threshold)
 */
function computeNInd(evidence: EvidenceState): number {
  const counts = SOURCE_ORDER.map((k) => evidence[k]).filter((n) => n > 0);
  const total = counts.reduce((s, n) => s + n, 0);
  if (total === 0) return 0;
  const sumSqrt = counts.reduce((s, n) => s + Math.sqrt(n), 0);
  return (sumSqrt * sumSqrt) / total;
}

interface DotPos {
  x: number;
  y: number;
  color: string;
  source: SourceKey;
}

interface SourceGroup {
  source: SourceKey;
  positions: { x: number; y: number }[];
}

/**
 * Layout dots in a horizontal row of source clusters. Each active source gets
 * a vertical lane; dots within a lane are stacked vertically. Items from the
 * same source are connected by thin lines (illustrating within-source
 * correlation — the structural fact N_ind penalises).
 */
function layoutDots(
  evidence: EvidenceState,
  width: number,
  height: number
): { dots: DotPos[]; groups: SourceGroup[] } {
  const dots: DotPos[] = [];
  const groups: SourceGroup[] = [];

  const activeSources = SOURCE_ORDER.filter((k) => evidence[k] > 0);
  if (activeSources.length === 0) return { dots, groups };

  const segmentWidth = width / activeSources.length;
  const topPad = 14;
  const bottomPad = 14;
  const usableH = height - topPad - bottomPad;

  activeSources.forEach((src, groupIdx) => {
    const cx = segmentWidth * (groupIdx + 0.5);
    const count = evidence[src];
    const positions: { x: number; y: number }[] = [];
    const spacing = count > 1 ? Math.min(12, usableH / (count - 1)) : 0;
    const startY =
      count > 1 ? topPad + usableH / 2 - ((count - 1) * spacing) / 2 : height / 2;

    for (let i = 0; i < count; i++) {
      const pos = { x: cx, y: startY + i * spacing };
      positions.push(pos);
      dots.push({ ...pos, color: SOURCE_CONFIG[src].dot, source: src });
    }
    groups.push({ source: src, positions });
  });

  return { dots, groups };
}

/**
 * EvidenceSimulator — interactive demo of how evidence ingestion from the
 * four VVU sources affects N_ind (spectral diversification) via the
 * participation ratio. Fully self-contained: zero props, no API calls.
 */
export function EvidenceSimulator() {
  const [evidence, setEvidence] = useState<EvidenceState>({
    you_com: 0,
    brave: 0,
    firecrawl: 0,
    watchdog: 0,
  });

  const nInd = useMemo(() => computeNInd(evidence), [evidence]);

  const totalEvidence = useMemo(
    () => SOURCE_ORDER.reduce((s, k) => s + evidence[k], 0),
    [evidence]
  );

  const adjust = useCallback((key: SourceKey, delta: number) => {
    setEvidence((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  }, []);

  const reset = useCallback(() => {
    setEvidence({ you_com: 0, brave: 0, firecrawl: 0, watchdog: 0 });
  }, []);

  const randomize = useCallback(() => {
    // Random integer in [0, 4] per source.
    const r = () => Math.floor(Math.random() * 5);
    setEvidence({
      you_com: r(),
      brave: r(),
      firecrawl: r(),
      watchdog: r(),
    });
  }, []);

  const verdict = useMemo(() => {
    if (nInd >= TARGET_THRESHOLD) {
      return {
        label: `PASS — Meets safety-critical threshold (N_ind ≥ ${TARGET_THRESHOLD.toFixed(1)})`,
        Icon: CheckCircle2,
        className:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
      };
    }
    if (nInd >= 1) {
      return {
        label:
          "WARN — Below safety-critical threshold; authorization blocked for safety-critical claims.",
        Icon: AlertTriangle,
        className:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
      };
    }
    return {
      label:
        "FAIL — Insufficient evidence diversification. Authorization blocked.",
      Icon: XCircle,
      className:
        "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    };
  }, [nInd]);

  const nIndColorClass =
    nInd >= TARGET_THRESHOLD
      ? "text-emerald-600 dark:text-emerald-400"
      : nInd >= 1
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const barFillPct = Math.min(100, (nInd / TARGET_THRESHOLD) * 100);
  const barColor =
    nInd >= TARGET_THRESHOLD
      ? "bg-emerald-500"
      : nInd >= 1
      ? "bg-amber-500"
      : "bg-red-500";

  // SVG layout
  const svgWidth = 320;
  const svgHeight = 80;
  const { dots, groups } = useMemo(
    () => layoutDots(evidence, svgWidth, svgHeight),
    [evidence]
  );

  return (
    <Card className="p-4 gap-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight truncate">
            Evidence Source Simulator
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
        >
          Interactive
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Add evidence from each source to see N_ind recalculate via participation
        ratio.
      </p>

      {/* Source control cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        {SOURCE_ORDER.map((key, idx) => {
          const cfg = SOURCE_CONFIG[key];
          const count = evidence[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05, ease: "easeOut" }}
              className="rounded-md border bg-card p-2.5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${cfg.chip}`}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-mono font-semibold truncate">
                    {cfg.label}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums leading-none">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="inline-block"
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-0 text-xs"
                  onClick={() => adjust(key, -1)}
                  disabled={count === 0}
                  aria-label={`Remove one evidence item from ${cfg.label}`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-0 text-xs"
                  onClick={() => adjust(key, 1)}
                  aria-label={`Add one evidence item from ${cfg.label}`}
                >
                  +1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-0 text-xs"
                  onClick={() => adjust(key, 5)}
                  aria-label={`Add five evidence items from ${cfg.label}`}
                >
                  +5
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reset / Randomize */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={reset} className="h-8">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={randomize}
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Dices className="h-3.5 w-3.5" />
          Randomize
        </Button>
      </div>

      {/* Live N_ind display */}
      <div className="bg-muted/20 rounded-md p-3 mt-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={nInd.toFixed(2)}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 320, damping: 22 },
                }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ duration: 0.2 }}
                className={`text-3xl font-bold tabular-nums leading-none ${nIndColorClass}`}
              >
                {nInd.toFixed(2)}
              </motion.div>
            </AnimatePresence>
            <span className="text-[11px] text-muted-foreground mt-1">
              N_ind (spectral diversification)
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Evidence
            </div>
            <div className="text-sm font-mono font-semibold tabular-nums">
              {totalEvidence}
            </div>
          </div>
        </div>

        {/* Threshold bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Threshold
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              target = {TARGET_THRESHOLD.toFixed(1)}
            </span>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={false}
              animate={{ width: `${barFillPct}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            />
            {/* threshold tick at 100% */}
            <div className="absolute top-0 right-0 h-full w-px bg-foreground/30" />
          </div>
        </div>

        <p className="mt-2.5 text-[10px] text-muted-foreground font-mono leading-relaxed">
          Formula: N_ind = (Σ √λ_i)² / Σ λ_i — computed from heat-kernel
          eigenvalues of the evidence mesh.
        </p>
      </div>

      {/* Live evidence mesh mini-visualization */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Evidence Mesh
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            lines = within-source correlation
          </span>
        </div>
        <div className="rounded-md border bg-background/60 p-1">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            height={svgHeight}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Evidence mesh visualization"
          >
            {/* background dotted grid */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 16 }).map((_, col) => (
                <circle
                  key={`grid-${row}-${col}`}
                  cx={col * 20 + 10}
                  cy={row * 20 + 10}
                  r={0.5}
                  fill="currentColor"
                  className="text-foreground"
                  opacity={0.05}
                />
              ))
            )}

            {dots.length === 0 ? (
              <text
                x={svgWidth / 2}
                y={svgHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontFamily="monospace"
                className="fill-muted-foreground"
                opacity={0.6}
              >
                no evidence — add items above
              </text>
            ) : (
              <>
                {/* within-source correlation lines (K_n per source) */}
                {groups.map((g) => {
                  const color = SOURCE_CONFIG[g.source].dot;
                  return g.positions.flatMap((a, i) =>
                    g.positions.slice(i + 1).map((b, j) => (
                      <line
                        key={`line-${g.source}-${i}-${j}`}
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={color}
                        strokeWidth={1}
                        strokeOpacity={0.35}
                      />
                    ))
                  );
                })}
                {/* dots */}
                {dots.map((d, i) => (
                  <motion.circle
                    key={`dot-${i}-${d.source}`}
                    cx={d.x}
                    cy={d.y}
                    r={4}
                    fill={d.color}
                    stroke={d.color}
                    strokeOpacity={0.3}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                      delay: i * 0.02,
                    }}
                    style={{ transformOrigin: `${d.x}px ${d.y}px` }}
                  />
                ))}
              </>
            )}
          </svg>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-2 mt-2">
          {SOURCE_ORDER.map((key) => {
            const cfg = SOURCE_CONFIG[key];
            const count = evidence[key];
            return (
              <div
                key={`legend-${key}`}
                className="flex items-center gap-1.5 rounded-sm border border-border/40 px-1.5 py-0.5"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dot }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {cfg.label}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/70 tabular-nums">
                  ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdict footer */}
      <div
        className={`rounded-md p-2.5 mt-3 flex items-start gap-2 ${verdict.className}`}
      >
        <verdict.Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <p className="text-[11px] font-medium leading-snug">{verdict.label}</p>
      </div>
    </Card>
  );
}

export default EvidenceSimulator;
