"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, Zap, Pause, Play, RotateCcw, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GossipNode {
  id: string;
  name: string;
  x: number;
  y: number;
  zk: boolean;
}

interface GossipMessage {
  id: number;
  from: string;
  to: string;
  progress: number; // 0..1
  kind: "merge" | "proof" | "state";
  zk: boolean;
}

interface FederationGossipSimProps {
  orgs: { id: string; name: string; zkPolicies: number }[];
}

const W = 620;
const H = 280;

// Layout orgs in a circle
function layoutOrgs(orgs: FederationGossipSimProps["orgs"]): GossipNode[] {
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.35;
  return orgs.map((o, i) => {
    const angle = (i / Math.max(1, orgs.length)) * Math.PI * 2 - Math.PI / 2;
    return {
      id: o.id,
      name: o.name,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      zk: o.zkPolicies > 0,
    };
  });
}

const MSG_COLORS: Record<GossipMessage["kind"], string> = {
  merge: "oklch(0.78 0.16 160)",
  proof: "oklch(0.74 0.13 190)",
  state: "oklch(0.80 0.15 80)",
};

const MSG_LABELS: Record<GossipMessage["kind"], string> = {
  merge: "M",
  proof: "P",
  state: "S",
};

export function FederationGossipSim({ orgs }: FederationGossipSimProps) {
  const [nodes, setNodes] = useState<GossipNode[]>([]);
  const [messages, setMessages] = useState<GossipMessage[]>([]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, zkProofs: 0 });
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const msgIdRef = useRef<number>(0);
  const nodesRef = useRef<GossipNode[]>([]);
  const messagesRef = useRef<GossipMessage[]>([]);

  // Initialize layout
  useEffect(() => {
    const laid = layoutOrgs(orgs);
    nodesRef.current = laid;
    setNodes(laid);
  }, [orgs]);

  // Animation loop
  useEffect(() => {
    if (!playing || nodes.length < 2) return;

    const tick = (ts: number) => {
      // Spawn new messages periodically
      if (ts - lastSpawnRef.current > 900 / speed) {
        lastSpawnRef.current = ts;
        const ns = nodesRef.current;
        if (ns.length >= 2) {
          const fromIdx = Math.floor(Math.random() * ns.length);
          let toIdx = Math.floor(Math.random() * ns.length);
          while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * ns.length);
          const from = ns[fromIdx];
          const to = ns[toIdx];
          const kinds: GossipMessage["kind"][] = ["merge", "proof", "state"];
          const kind = kinds[Math.floor(Math.random() * kinds.length)];
          const zk = from.zk && to.zk && Math.random() > 0.4;
          msgIdRef.current += 1;
          messagesRef.current = [
            ...messagesRef.current,
            {
              id: msgIdRef.current,
              from: from.id,
              to: to.id,
              progress: 0,
              kind,
              zk,
            },
          ];
          setStats((s) => ({
            sent: s.sent + 1,
            delivered: s.delivered,
            zkProofs: s.zkProofs + (zk ? 1 : 0),
          }));
        }
      }

      // Advance messages
      const dt = 0.012 * speed;
      const remaining: GossipMessage[] = [];
      let delivered = 0;
      for (const m of messagesRef.current) {
        m.progress += dt;
        if (m.progress >= 1) {
          delivered++;
        } else {
          remaining.push(m);
        }
      }
      messagesRef.current = remaining;
      if (delivered > 0) {
        setStats((s) => ({ ...s, delivered: s.delivered + delivered }));
      }
      setMessages(messagesRef.current.map((m) => ({ ...m })));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, nodes.length]);

  const reset = () => {
    messagesRef.current = [];
    setMessages([]);
    setStats({ sent: 0, delivered: 0, zkProofs: 0 });
    setActiveNode(null);
  };

  if (orgs.length < 2) {
    return (
      <Card className="bg-card/60 backdrop-blur border-border/60 p-4 text-center">
        <Radio className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">Need ≥2 orgs to simulate gossip.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-20" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-repairing" />
          <h3 className="text-sm font-semibold">Gossip simulation</h3>
          <Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing font-mono">
            <Activity className="h-2.5 w-2.5 mr-0.5" /> live
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={() => setSpeed((s) => (s >= 3 ? 1 : s + 0.5))}
            >
              <Zap className="h-3 w-3 mr-1 text-repairing" />
              {speed}×
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              {playing ? "pause" : "play"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={reset}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Simulation canvas */}
          <div className="lg:col-span-3 rounded-md border border-border/60 bg-background/40 overflow-hidden">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full block"
              style={{ aspectRatio: `${W} / ${H}` }}
              role="img"
              aria-label="Federation gossip simulation"
            >
              <defs>
                <radialGradient id="org-glow-zk" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 160)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="org-glow-plain" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.70 0.13 40)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="oklch(0.70 0.13 40)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Faint connection mesh (all-to-all) */}
              {nodes.map((a, i) =>
                nodes.slice(i + 1).map((b, j) => (
                  <line
                    key={`mesh-${i}-${j}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="oklch(0.34 0.014 165)"
                    strokeWidth={0.5}
                    strokeOpacity={0.2}
                  />
                )),
              )}

              {/* Active message trails */}
              {messages.map((m) => {
                const from = nodes.find((n) => n.id === m.from);
                const to = nodes.find((n) => n.id === m.to);
                if (!from || !to) return null;
                const x = from.x + (to.x - from.x) * m.progress;
                const y = from.y + (to.y - from.y) * m.progress;
                const color = MSG_COLORS[m.kind];
                return (
                  <g key={m.id}>
                    {/* trail line */}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={x}
                      y2={y}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                    />
                    {/* message packet */}
                    <circle cx={x} cy={y} r={6} fill={color} fillOpacity={0.9} className="animate-epistemic-pulse" />
                    <text
                      x={x}
                      y={y + 2}
                      textAnchor="middle"
                      fontSize={7}
                      fontWeight={700}
                      fill="oklch(0.15 0 0)"
                      style={{ pointerEvents: "none" }}
                    >
                      {MSG_LABELS[m.kind]}
                    </text>
                    {m.zk && (
                      <circle cx={x} cy={y} r={9} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.5} />
                    )}
                  </g>
                );
              })}

              {/* Org nodes */}
              {nodes.map((n) => {
                const isActive = activeNode === n.id;
                const r = 20;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActiveNode(n.id)}
                    onMouseLeave={() => setActiveNode(null)}
                  >
                    <circle r={r + 10} fill={`url(#${n.zk ? "org-glow-zk" : "org-glow-plain"})`} />
                    {isActive && (
                      <circle r={r + 5} fill="none" stroke={n.zk ? "oklch(0.78 0.16 160)" : "oklch(0.70 0.13 40)"} strokeWidth={1} strokeOpacity={0.6} />
                    )}
                    <circle
                      r={r}
                      fill={n.zk ? "oklch(0.22 0.04 160)" : "oklch(0.22 0.03 40)"}
                      stroke={n.zk ? "oklch(0.78 0.16 160)" : "oklch(0.70 0.13 40)"}
                      strokeWidth={1.5}
                    />
                    <text
                      y={-2}
                      textAnchor="middle"
                      fontSize={8.5}
                      fontFamily="var(--font-geist-mono), monospace"
                      fontWeight={600}
                      fill={n.zk ? "oklch(0.85 0.10 160)" : "oklch(0.85 0.08 40)"}
                      style={{ pointerEvents: "none" }}
                    >
                      {n.name.length > 14 ? n.name.slice(0, 12) + "…" : n.name}
                    </text>
                    <text
                      y={8}
                      textAnchor="middle"
                      fontSize={6.5}
                      fill="oklch(0.55 0.01 165)"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.zk ? "zk-gossip" : "mmr-gossip"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stats + legend */}
          <div className="space-y-2.5">
            <div className="rounded-md border border-border/40 bg-background/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Throughput</div>
              <div className="space-y-1.5">
                <StatRow label="sent" value={stats.sent} color="text-foreground" />
                <StatRow label="delivered" value={stats.delivered} color="text-verified" />
                <StatRow label="ZK proofs" value={stats.zkProofs} color="text-verified" />
                <StatRow label="in-flight" value={messages.length} color="text-repairing" />
              </div>
            </div>

            <div className="rounded-md border border-border/40 bg-background/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Message types</div>
              <div className="space-y-1">
                {(["merge", "proof", "state"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MSG_COLORS[k] }} />
                    <span className="capitalize">{k}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{MSG_LABELS[k]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border/40 bg-background/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Protocol</div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                P2P gossip propagates merge proposals, ancestry proofs, and state deltas across orgs. ZK-enabled peers exchange SNARK proofs — trustless reconciliation without revealing raw state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}
