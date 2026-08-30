"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EvidenceItem } from "@/lib/eis";

interface EvidenceTopologyProps {
  evidence: EvidenceItem[];
  claimState: string;
}

/**
 * EvidenceTopology renders an SVG visualization of the evidence graph
 * showing claim → evidence nodes with provenance edges.
 */
export function EvidenceTopology({ evidence, claimState }: EvidenceTopologyProps) {
  const sourceColors: Record<string, string> = {
    "you.com": "#059669",    // emerald-600
    "brave": "#D97706",      // amber-600
    "firecrawl": "#0891B2",  // cyan-600
    "watchdog": "#7C3AED",   // violet-600
  };

  const sourceLabels: Record<string, string> = {
    "you.com": "YOU",
    "brave": "BRV",
    "firecrawl": "FC",
    "watchdog": "WD",
  };

  // Deduplicate by source
  const sources = Array.from(new Set(evidence.map((e) => e.source)));
  const hasEvidence = evidence.length > 0;

  // SVG layout constants
  const W = 320;
  const H = 180;
  const cx = W / 2;
  const cy = H / 2;

  // Claim node position (left)
  const claimX = 50;
  const claimY = cy;

  // Evidence hub position (center)
  const hubX = cx;
  const hubY = cy;

  // Source nodes arranged in a semi-circle on the right
  const sourceRadius = 55;
  const sourceStartAngle = -Math.PI / 3;
  const sourceEndAngle = Math.PI / 3;

  const sourcePositions = sources.map((_, i) => {
    const angle = sources.length === 1
      ? 0
      : sourceStartAngle + (sourceEndAngle - sourceStartAngle) * (i / (sources.length - 1));
    return {
      x: hubX + sourceRadius * Math.cos(angle) + 20,
      y: hubY + sourceRadius * Math.sin(angle),
    };
  });

  // N_ind indicator
  const nInd = sources.length;
  const nIndColor = nInd >= 2 ? "#059669" : nInd >= 1 ? "#D97706" : "#9CA3AF";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Evidence Topology</h3>
          <Badge variant="outline" className="text-[9px] font-mono">
            N_ind = {nInd}
          </Badge>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Graph View
        </span>
      </div>

      {hasEvidence ? (
        <div className="flex justify-center">
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="text-foreground"
            role="img"
            aria-label="Evidence topology graph"
          >
            {/* Background grid dots */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 14 }).map((_, col) => (
                <circle
                  key={`grid-${row}-${col}`}
                  cx={col * 24 + 12}
                  cy={row * 24 + 12}
                  r={0.5}
                  fill="currentColor"
                  opacity={0.06}
                />
              ))
            )}

            {/* Edge: Claim → Hub */}
            <line
              x1={claimX + 18}
              y1={claimY}
              x2={hubX - 18}
              y2={hubY}
              stroke="currentColor"
              strokeWidth={1.5}
              opacity={0.25}
              strokeDasharray="4 2"
            />
            {/* Arrow head */}
            <polygon
              points={`${hubX - 18},${hubY - 4} ${hubX - 12},${hubY} ${hubX - 18},${hubY + 4}`}
              fill="currentColor"
              opacity={0.3}
            />

            {/* Edges: Hub → Sources */}
            {sources.map((source, i) => {
              const pos = sourcePositions[i];
              const color = sourceColors[source] || "#6B7280";
              return (
                <g key={`edge-${source}`}>
                  <line
                    x1={hubX + 18}
                    y1={hubY}
                    x2={pos.x - 14}
                    y2={pos.y}
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                  {/* Small arrow */}
                  <circle
                    cx={pos.x - 16}
                    cy={pos.y}
                    r={2}
                    fill={color}
                    opacity={0.5}
                  />
                </g>
              );
            })}

            {/* Claim Node */}
            <g>
              <circle
                cx={claimX}
                cy={claimY}
                r={16}
                fill="currentColor"
                opacity={0.08}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeOpacity={0.2}
              />
              <text
                x={claimX}
                y={claimY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={700}
                fontFamily="monospace"
                fill="currentColor"
                opacity={0.7}
              >
                C
              </text>
            </g>

            {/* Hub Node (Evidence aggregation) */}
            <g>
              <circle
                cx={hubX}
                cy={hubY}
                r={16}
                fill="currentColor"
                opacity={0.06}
                stroke={nIndColor}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
              <text
                x={hubX}
                y={hubY - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fontWeight={600}
                fontFamily="monospace"
                fill={nIndColor}
              >
                E
              </text>
              <text
                x={hubX}
                y={hubY + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={7}
                fontFamily="monospace"
                fill="currentColor"
                opacity={0.5}
              >
                {evidence.length}
              </text>
            </g>

            {/* Source Nodes */}
            {sources.map((source, i) => {
              const pos = sourcePositions[i];
              const color = sourceColors[source] || "#6B7280";
              const label = sourceLabels[source] || source.slice(0, 3).toUpperCase();
              const count = evidence.filter((e) => e.source === source).length;
              return (
                <g key={`source-${source}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={14}
                    fill={color}
                    opacity={0.08}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7}
                    fontWeight={700}
                    fontFamily="monospace"
                    fill={color}
                  >
                    {label}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={6}
                    fontFamily="monospace"
                    fill="currentColor"
                    opacity={0.5}
                  >
                    ×{count}
                  </text>
                </g>
              );
            })}

            {/* Legend: N_ind indicator */}
            <g transform={`translate(${W - 60}, ${H - 18})`}>
              <rect
                x={0}
                y={0}
                width={56}
                height={14}
                rx={3}
                fill="currentColor"
                opacity={0.04}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeOpacity={0.1}
              />
              <circle cx={8} cy={7} r={3} fill={nIndColor} opacity={0.7} />
              <text
                x={15}
                y={7}
                dominantBaseline="middle"
                fontSize={7}
                fontFamily="monospace"
                fill="currentColor"
                opacity={0.6}
              >
                N_ind={nInd}
              </text>
            </g>
          </svg>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-lg">
          <svg
            width={40}
            height={40}
            viewBox="0 0 40 40"
            className="text-muted-foreground/40 mb-2"
          >
            <circle cx={20} cy={20} r={8} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 2" />
            <circle cx={20} cy={20} r={3} fill="currentColor" opacity={0.3} />
          </svg>
          <p className="text-xs font-medium text-muted-foreground">No evidence topology</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">
            Ingest evidence to visualize the provenance graph
          </p>
        </div>
      )}

      {/* Source legend */}
      {hasEvidence && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/30">
          {sources.map((source) => {
            const color = sourceColors[source] || "#6B7280";
            const count = evidence.filter((e) => e.source === source).length;
            return (
              <div
                key={source}
                className="flex items-center gap-1 rounded-sm border border-border/30 px-1.5 py-0.5"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] font-mono text-muted-foreground">
                  {source}
                </span>
                <span className="text-[8px] font-mono text-muted-foreground/60">
                  ({count})
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
