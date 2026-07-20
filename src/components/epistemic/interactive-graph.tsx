"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Network, Move, Zap, RefreshCw, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShardRow, ShardStatus } from "@/lib/types";

interface GraphNode {
  id: string;
  label: string;
  region: string;
  status: ShardStatus;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string;
  target: string;
}

const STATUS_COLOR: Record<ShardStatus, string> = {
  healthy: "oklch(0.78 0.16 160)",
  repairing: "oklch(0.80 0.15 80)",
  violating: "oklch(0.64 0.21 25)",
};

const STATUS_FILL: Record<ShardStatus, string> = {
  healthy: "oklch(0.22 0.04 160)",
  repairing: "oklch(0.25 0.04 80)",
  violating: "oklch(0.25 0.05 25)",
};

/**
 * InteractiveDagGraph — a lightweight force-directed SVG graph of shards.
 * Nodes are draggable; edges represent peer-gossip links (shards on the same
 * node or same region). A simple force simulation runs in a rAF loop.
 */
export function InteractiveDagGraph({ shards }: { shards: ShardRow[] }) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [simulating, setSimulating] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const rafRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const W = 760;
  const H = 380;

  // Initialize nodes from shards
  useEffect(() => {
    if (shards.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    // Place nodes in a rough circle initially
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.35;
    const newNodes: GraphNode[] = shards.map((s, i) => {
      const angle = (i / shards.length) * Math.PI * 2;
      return {
        id: s.id,
        label: s.region,
        region: s.region,
        status: s.invariantStatus,
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
      };
    });

    // Build edges: connect shards on the same node (peer gossip) + same region
    const newEdges: GraphEdge[] = [];
    for (let i = 0; i < shards.length; i++) {
      for (let j = i + 1; j < shards.length; j++) {
        const a = shards[i];
        const b = shards[j];
        if (a.nodeId === b.nodeId || a.region === b.region) {
          newEdges.push({ source: a.id, target: b.id });
        }
      }
    }
    // If too few edges, add some nearest-neighbor links for visual richness
    if (newEdges.length < shards.length) {
      for (let i = 0; i < shards.length; i++) {
        const next = (i + 1) % shards.length;
        if (!newEdges.some((e) => (e.source === shards[i].id && e.target === shards[next].id) || (e.source === shards[next].id && e.target === shards[i].id))) {
          newEdges.push({ source: shards[i].id, target: shards[next].id });
        }
      }
    }

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;
    setNodes(newNodes);
    setEdges(newEdges);
  }, [shards]);

  // Force simulation loop
  useEffect(() => {
    if (!simulating || nodes.length === 0) return;

    const tick = () => {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      if (ns.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Repulsion (Coulomb) between all node pairs
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i];
          const b = ns[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;
          const force = 2400 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (a.fx === null || a.fx === undefined) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (b.fx === null || b.fx === undefined) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Attraction (spring) along edges
      for (const e of es) {
        const a = ns.find((n) => n.id === e.source);
        const b = ns.find((n) => n.id === e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 90;
        const force = (dist - targetDist) * 0.04;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.fx === null || a.fx === undefined) {
          a.vx += fx;
          a.vy += fy;
        }
        if (b.fx === null || b.fx === undefined) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Center gravity + integration + damping + bounds
      const cx = W / 2;
      const cy = H / 2;
      for (const n of ns) {
        if (n.fx !== null && n.fx !== undefined) {
          n.x = n.fx;
          n.y = n.fy ?? n.y;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        // gravity toward center
        n.vx += (cx - n.x) * 0.003;
        n.vy += (cy - n.y) * 0.003;
        // damping
        n.vx *= 0.82;
        n.vy *= 0.82;
        // integrate
        n.x += n.vx;
        n.y += n.vy;
        // bounds
        const pad = 28;
        if (n.x < pad) { n.x = pad; n.vx = 0; }
        if (n.x > W - pad) { n.x = W - pad; n.vx = 0; }
        if (n.y < pad) { n.y = pad; n.vy = 0; }
        if (n.y > H - pad) { n.y = H - pad; n.vy = 0; }
      }

      // Trigger re-render (shallow copy)
      setNodes(ns.map((n) => ({ ...n })));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [simulating, nodes.length]);

  // Pointer drag handlers
  const getPointer = (e: React.PointerEvent | PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    const p = getPointer(e);
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;
    dragRef.current = { id: nodeId, offsetX: p.x - node.x, offsetY: p.y - node.y };
    node.fx = node.x;
    node.fy = node.y;
    setSelectedNode(nodeId);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const p = getPointer(e);
    const node = nodesRef.current.find((n) => n.id === dragRef.current!.id);
    if (node) {
      node.fx = Math.max(20, Math.min(W - 20, p.x - dragRef.current.offsetX));
      node.fy = Math.max(20, Math.min(H - 20, p.y - dragRef.current.offsetY));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      const node = nodesRef.current.find((n) => n.id === dragRef.current.id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      dragRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const recenter = () => {
    for (const n of nodesRef.current) {
      n.fx = null;
      n.fy = null;
      n.vx = (Math.random() - 0.5) * 4;
      n.vy = (Math.random() - 0.5) * 4;
    }
    setSimulating(true);
  };

  const selected = nodes.find((n) => n.id === selectedNode);
  const selectedShard = shards.find((s) => s.id === selectedNode);

  if (shards.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur border-border/60 p-4 text-center">
        <Network className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">No shards to graph.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-20" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Network className="h-4 w-4 text-verified" />
          <h3 className="text-sm font-semibold">Interactive shard graph</h3>
          <Badge variant="outline" className="text-[9px] border-border/60 font-mono">
            <Move className="h-2.5 w-2.5 mr-0.5" /> drag nodes
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={() => setSimulating((s) => !s)}
            >
              <Zap className={cn("h-3 w-3 mr-1", simulating && "text-repairing")} />
              {simulating ? "pause" : "resume"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={recenter}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> recenter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Graph */}
          <div className="lg:col-span-3 rounded-md border border-border/60 bg-background/40 overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full block touch-none"
              style={{ aspectRatio: `${W} / ${H}`, cursor: "default" }}
              onPointerDown={() => setSelectedNode(null)}
              role="img"
              aria-label="Interactive shard graph"
            >
              <defs>
                <radialGradient id="node-glow-healthy" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="node-glow-violating" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.64 0.21 25)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="oklch(0.64 0.21 25)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="node-glow-repairing" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.80 0.15 80)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="oklch(0.80 0.15 80)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Edges */}
              {edges.map((e, i) => {
                const a = nodes.find((n) => n.id === e.source);
                const b = nodes.find((n) => n.id === e.target);
                if (!a || !b) return null;
                const highlighted =
                  hoveredNode === a.id || hoveredNode === b.id ||
                  selectedNode === a.id || selectedNode === b.id;
                return (
                  <line
                    key={`e-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={highlighted ? "oklch(0.78 0.16 160)" : "oklch(0.34 0.014 165)"}
                    strokeWidth={highlighted ? 1.6 : 1}
                    strokeOpacity={highlighted ? 0.7 : 0.3}
                    strokeDasharray="3 2"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => {
                const r = 11;
                const isSelected = selectedNode === n.id;
                const isHovered = hoveredNode === n.id;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    style={{ cursor: "grab" }}
                    onPointerDown={(e) => onNodePointerDown(e, n.id)}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* glow */}
                    <circle r={r + 8} fill={`url(#node-glow-${n.status})`} />
                    {/* selection ring */}
                    {isSelected && (
                      <circle r={r + 4} fill="none" stroke={STATUS_COLOR[n.status]} strokeWidth={1.5} strokeOpacity={0.6} />
                    )}
                    {/* main node */}
                    <circle
                      r={r}
                      fill={STATUS_FILL[n.status]}
                      stroke={STATUS_COLOR[n.status]}
                      strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                    />
                    {/* status dot center */}
                    <circle r={3.5} fill={STATUS_COLOR[n.status]} opacity={n.status === "healthy" ? 0.9 : 1} className={n.status !== "healthy" ? "animate-epistemic-pulse" : ""} />
                    {/* label */}
                    <text
                      y={r + 12}
                      textAnchor="middle"
                      fontSize={9}
                      fontFamily="var(--font-geist-mono), monospace"
                      fill={isHovered || isSelected ? "oklch(0.90 0.01 165)" : "oklch(0.60 0.012 165)"}
                      fontWeight={isSelected ? 600 : 400}
                      style={{ pointerEvents: "none" }}
                    >
                      {n.label.length > 14 ? n.label.slice(0, 12) + "…" : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side panel: selected node details + legend */}
          <div className="space-y-3">
            {selected && selectedShard ? (
              <div className="rounded-md border border-verified/30 bg-verified/5 p-2.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Selected node</div>
                <div className="font-mono text-sm font-semibold text-foreground">{selected.label}</div>
                <div className="mt-1.5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">node</span>
                    <span className="font-mono">{selectedShard.nodeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">status</span>
                    <span className={cn("font-mono font-semibold", selected.status === "healthy" ? "text-verified" : selected.status === "repairing" ? "text-repairing" : "text-violating")}>
                      {selected.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">peers</span>
                    <span className="font-mono">{selectedShard.peerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">mmr</span>
                    <span className="font-mono text-[10px] truncate max-w-[100px]">{selectedShard.mmrRoot.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">invariants</div>
                  <div className="space-y-0.5">
                    {selectedShard.invariantEvals.slice(0, 5).map((iv) => (
                      <div key={iv.name} className="flex items-center gap-1 text-[10px]">
                        <span className={iv.passed ? "text-verified" : "text-violating"}>{iv.passed ? "✓" : "✗"}</span>
                        <span className="font-mono truncate">{iv.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 p-3 text-center">
                <Network className="mx-auto h-6 w-6 text-muted-foreground/30" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Click a node to inspect
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="rounded-md border border-border/40 bg-background/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Legend</div>
              <div className="space-y-1">
                {(["healthy", "repairing", "violating"] as ShardStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                    <span className="capitalize">{s}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-border/40 mt-1">
                  <span className="h-px w-4 border-t border-dashed border-muted-foreground" />
                  <span className="text-muted-foreground">peer gossip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
