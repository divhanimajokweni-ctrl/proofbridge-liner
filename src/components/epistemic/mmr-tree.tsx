"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * MerkleMountainRange — an SVG visualization of an MMR with the inclusion
 * proof path highlighted.
 *
 * Given a set of leaf hashes and a proof path (sibling hashes), this renders
 * a binary-tree-style mountain range: leaves at the bottom, peaks at the top,
 * connected by edges. The proof path leaves/siblings are highlighted in
 * emerald; the reconstructed root is shown at the top.
 *
 * Pure SVG + Tailwind, no deps. Deterministic layout.
 */

interface NodePos {
  x: number;
  y: number;
  hash: string;
  kind: "leaf" | "peak" | "root" | "sibling";
  onPath: boolean;
}

interface MmrTreeProps {
  /** Leaf hashes (the items hashed into the MMR). */
  leaves: string[];
  /** Sibling hashes that form the inclusion proof path. */
  proofPath: string[];
  /** The MMR root hash. */
  root: string;
  /** The index of the leaf being proven (0-based). */
  provenIndex?: number;
  className?: string;
  height?: number;
}

export function MerkleMountainRange({
  leaves,
  proofPath,
  root,
  provenIndex = 0,
  className,
  height = 200,
}: MmrTreeProps) {
  const { nodes, edges, width } = useMemo(() => {
    // Build a simplified MMR structure: pair up leaves into peaks.
    // For visualization we show up to 8 leaves; if more, we bucket.
    const maxLeaves = 8;
    const displayLeaves = leaves.slice(0, maxLeaves);
    const siblingSet = new Set(proofPath);

    const W = Math.max(360, displayLeaves.length * 56 + 40);
    const H = height;
    const leafY = H - 24;
    const peakY = 44;
    const rootY = 16;

    const nodes: NodePos[] = [];
    const edges: { from: NodePos; to: NodePos; onPath: boolean }[] = [];

    // Place leaves
    const leafPositions: NodePos[] = displayLeaves.map((h, i) => {
      const x = 28 + i * ((W - 56) / Math.max(1, displayLeaves.length - 1));
      const onPath = i === provenIndex;
      const np: NodePos = {
        x,
        y: leafY,
        hash: h,
        kind: "leaf",
        onPath,
      };
      nodes.push(np);
      return np;
    });

    // Build peaks by pairing adjacent leaves (single mountain for clarity)
    let layer = leafPositions;
    let layerIndex = 0;
    while (layer.length > 1) {
      const next: NodePos[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = layer[i + 1];
        if (!right) {
          // odd one out — carry up
          next.push(left);
          continue;
        }
        const peakHash = combineHash(left.hash, right.hash);
        const isPeak = layerIndex < 2;
        const onPath = left.onPath || right.onPath;
        const isSibling = siblingSet.has(peakHash);
        const np: NodePos = {
          x: (left.x + right.x) / 2,
          y: isPeak ? peakY : leafY - (layerIndex + 1) * 36,
          hash: peakHash,
          kind: isPeak ? "peak" : "sibling",
          onPath,
        };
        nodes.push(np);
        next.push(np);
        edges.push({ from: left, to: np, onPath: left.onPath });
        edges.push({ from: right, to: np, onPath: right.onPath });
      }
      layer = next;
      layerIndex++;
    }

    // Root node
    const rootNode: NodePos = {
      x: W / 2,
      y: rootY,
      hash: root,
      kind: "root",
      onPath: true,
    };
    nodes.push(rootNode);
    if (layer[0]) {
      edges.push({ from: layer[0], to: rootNode, onPath: layer[0].onPath });
    }

    return { nodes, edges, width: W };
  }, [leaves, proofPath, root, provenIndex, height]);

  if (leaves.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground italic">
        no leaves in this MMR
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        role="img"
        aria-label="Merkle mountain range tree"
      >
        <defs>
          <linearGradient id="mmr-path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Edges */}
        {edges.map((e, i) => (
          <line
            key={`e-${i}`}
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke={
              e.onPath ? "oklch(0.78 0.16 160)" : "oklch(0.34 0.014 165)"
            }
            strokeWidth={e.onPath ? 1.8 : 1}
            strokeOpacity={e.onPath ? 0.9 : 0.5}
          />
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => {
          const r =
            n.kind === "root" ? 9 : n.kind === "peak" ? 6.5 : 5;
          const fill =
            n.kind === "root"
              ? "oklch(0.78 0.16 160)"
              : n.onPath
                ? "oklch(0.78 0.16 160 / 0.85)"
                : n.kind === "peak"
                  ? "oklch(0.30 0.02 165)"
                  : "oklch(0.26 0.014 168)";
          const stroke =
            n.onPath || n.kind === "root"
              ? "oklch(0.78 0.16 160)"
              : "oklch(0.40 0.02 160)";
          const strokeWidth = n.onPath || n.kind === "root" ? 1.6 : 1;
          return (
            <g key={`n-${i}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              {n.kind === "root" && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r + 3}
                  fill="none"
                  stroke="oklch(0.78 0.16 160)"
                  strokeWidth={0.8}
                  strokeOpacity={0.5}
                />
              )}
              <text
                x={n.x}
                y={n.y - r - 4}
                textAnchor="middle"
                className="font-mono"
                fontSize={7.5}
                fill={
                  n.onPath || n.kind === "root"
                    ? "oklch(0.85 0.12 160)"
                    : "oklch(0.62 0.015 160)"
                }
              >
                {shortHash(n.hash)}
              </text>
              {(n.kind === "leaf" || n.kind === "root") && (
                <text
                  x={n.x}
                  y={n.y + r + 9}
                  textAnchor="middle"
                  fontSize={7}
                  fill="oklch(0.55 0.015 160)"
                  className="uppercase tracking-wide"
                >
                  {n.kind === "root" ? "root" : `leaf`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function combineHash(a: string, b: string): string {
  // Deterministic non-crypto combine for visualization only
  let h = 0x811c9dc5;
  const s = a + b;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function shortHash(h: string): string {
  if (!h) return "∅";
  return h.length > 8 ? `${h.slice(0, 4)}…${h.slice(-2)}` : h;
}
