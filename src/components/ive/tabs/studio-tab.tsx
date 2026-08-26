"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Link2,
  Boxes,
  Lock,
  CheckCircle2,
  Gamepad2,
  Network,
  ArrowRight,
  Lock as LockIcon,
} from "lucide-react";
import { STUDIO_WORKSHEETS, STUDIO_RIBBON } from "@/lib/ive/architecture";

const WORKSHEET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "ws-studi": FileText,
  "ws-proofbridge": Link2,
  "ws-construct": Boxes,
  "ws-mint": Lock,
  "ws-validate": CheckCircle2,
  "ws-sandbox": Gamepad2,
};

export function StudioTab() {
  const [activeWorksheet, setActiveWorksheet] = useState<string>("ws-studi");
  const active = STUDIO_WORKSHEETS.find((w) => w.id === activeWorksheet) ?? STUDIO_WORKSHEETS[0];

  return (
    <div className="space-y-4">
      {/* Top Ribbon */}
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Network className="h-4 w-4 ive-text-gold" />
            Studio Worksheets · Landscape View
          </CardTitle>
          <CardDescription className="text-xs">
            Word-inspired full landscape studio. Top ribbon:{" "}
            {STUDIO_RIBBON.map((r, i) => (
              <span key={r.id}>
                {i > 0 && " · "}
                <span className="ive-text-gold">{r.label}</span>
              </span>
            ))}
            . Centre canvas. Right dock for Facilitator & Document Agents + Live Graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Ribbon */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-secondary/30 p-2">
            {STUDIO_RIBBON.map((r) => (
              <Button
                key={r.id}
                variant="ghost"
                size="sm"
                className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
              >
                <span>{r.icon}</span>
                {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worksheet selector */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left: worksheet list */}
        <div className="space-y-2">
          {STUDIO_WORKSHEETS.map((ws) => {
            const Icon = WORKSHEET_ICONS[ws.id] ?? FileText;
            const isActive = ws.id === activeWorksheet;
            const isLocked = ws.id === "ws-mint"; // Mint locked until subscription
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => setActiveWorksheet(ws.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  isActive
                    ? "border-[oklch(0.82_0.16_75/60%)] bg-primary/10 ive-glow-gold"
                    : "border-border/40 bg-secondary/30 hover:border-border"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "ive-text-gold" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <div className="font-mono text-xs font-semibold">{ws.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">
                    {ws.purpose.slice(0, 50)}…
                  </div>
                </div>
                {isLocked && <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>

        {/* Right: active worksheet detail */}
        <Card className="ive-glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
                {(() => {
                  const Icon = WORKSHEET_ICONS[active.id] ?? FileText;
                  return <Icon className="h-4 w-4 ive-text-gold" />;
                })()}
                {active.name}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
                Worksheet {STUDIO_WORKSHEETS.indexOf(active) + 1} / {STUDIO_WORKSHEETS.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">{active.purpose}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pipeline */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pipeline
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {active.pipeline.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2 font-mono text-xs">
                      {i + 1}. {step}
                    </div>
                    {i < active.pipeline.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Integration Layer (Graph) */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Visual Integration Layer · Live Architecture Graph
              </div>
              <div className="rounded-lg border border-[oklch(0.82_0.16_75/20%)] bg-black/20 p-4">
                <div className="mb-3 text-xs text-muted-foreground">
                  {active.graphDescription}
                </div>
                <WorksheetGraphSVG worksheetId={active.id} />
              </div>
            </div>

            {/* Right Dock (Agents + Graph) */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Right Dock · Facilitator Agent
                </div>
                <p className="text-xs text-muted-foreground">
                  The Facilitator Agent tracks agendas, co-authors meeting
                  notes, and surfaces stale evidence in real time.
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Right Dock · Document Agent
                </div>
                <p className="text-xs text-muted-foreground">
                  The Document Agent connects the current worksheet to its
                  source data — CAD files, data resources, and quality gate
                  status.
                </p>
              </div>
            </div>

            {/* Toggle Graph button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 font-mono text-[10px] uppercase tracking-widest"
            >
              <Network className="h-3 w-3" />
              Toggle Graph View
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline overview — the full E2E flow */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <ArrowRight className="h-4 w-4 ive-text-gold" />
            E2E Pipeline · CAD Upload → ProofBridge-Liner → EIS AIR → 3D Construction → Export (Git)
          </CardTitle>
          <CardDescription className="text-xs">
            The exact graphical pipeline visualized as the Hydro-Gateway flow.
            Every step adds a new node to the Live Architecture Graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {["CAD Upload", "ProofBridge-Liner", "EIS AIR", "3D Construction", "Mint", "Validate", "Export (Git)"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2 font-mono text-xs">
                  <span className="text-muted-foreground">{i + 1}.</span>{" "}
                  <span className="ive-text-gold">{step}</span>
                </div>
                {i < 6 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Worksheet-specific SVG graph — each worksheet gets a different node layout.
 */
function WorksheetGraphSVG({ worksheetId }: { worksheetId: string }) {
  const graphs: Record<string, { nodes: { x: number; y: number; label: string; color: string }[]; edges: [number, number][] }> = {
    "ws-studi": {
      nodes: [
        { x: 50, y: 40, label: "Document", color: "#d4af37" },
        { x: 200, y: 30, label: "CAD Source", color: "#1d8aa3" },
        { x: 200, y: 60, label: "Data Resource", color: "#1d8aa3" },
        { x: 350, y: 40, label: "Save / Sync", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [0, 2], [1, 3], [2, 3]],
    },
    "ws-proofbridge": {
      nodes: [
        { x: 30, y: 40, label: "CAD", color: "#d4af37" },
        { x: 130, y: 40, label: "ProofBridge", color: "#6c3a6e" },
        { x: 230, y: 40, label: "EIS AIR", color: "#1d8aa3" },
        { x: 330, y: 40, label: "3D Construct", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [1, 2], [2, 3]],
    },
    "ws-construct": {
      nodes: [
        { x: 100, y: 30, label: "Construct", color: "#d4af37" },
        { x: 200, y: 50, label: "Design", color: "#1d8aa3" },
        { x: 300, y: 30, label: "Generate", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [1, 2]],
    },
    "ws-mint": {
      nodes: [
        { x: 50, y: 40, label: "Compress", color: "#d4af37" },
        { x: 150, y: 40, label: "Fernet Key", color: "#6c3a6e" },
        { x: 250, y: 40, label: "AES-256", color: "#a8312a" },
        { x: 350, y: 40, label: "Artifact", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [1, 2], [2, 3]],
    },
    "ws-validate": {
      nodes: [
        { x: 30, y: 40, label: "Watchdog", color: "#a8312a" },
        { x: 130, y: 40, label: "Brier <0.02", color: "#d4af37" },
        { x: 230, y: 40, label: "Decay", color: "#1d8aa3" },
        { x: 330, y: 40, label: "Git/DWS", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [1, 2], [2, 3]],
    },
    "ws-sandbox": {
      nodes: [
        { x: 50, y: 30, label: "Node Editor", color: "#d4af37" },
        { x: 150, y: 50, label: "Game Engine", color: "#1d8aa3" },
        { x: 250, y: 30, label: "Thermal", color: "#a8312a" },
        { x: 350, y: 40, label: "AI Overlay", color: "#2f7a4d" },
      ],
      edges: [[0, 1], [1, 2], [2, 3]],
    },
  };

  const graph = graphs[worksheetId] ?? graphs["ws-studi"];

  return (
    <svg viewBox="0 0 400 80" className="w-full">
      {graph.edges.map(([from, to], i) => {
        const f = graph.nodes[from];
        const t = graph.nodes[to];
        return (
          <line
            key={i}
            x1={f.x}
            y1={f.y}
            x2={t.x}
            y2={t.y}
            stroke="oklch(0.82 0.16 75 / 0.4)"
            strokeWidth="1.5"
          />
        );
      })}
      {graph.nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="14" fill={`${n.color}33`} stroke={n.color} strokeWidth="1.5" />
          <text x={n.x} y={n.y + 28} textAnchor="middle" fontSize="8" fill="oklch(0.7 0.012 60)" fontFamily="monospace">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
