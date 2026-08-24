"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Layers,
  MapPin,
  FileBox,
  Boxes,
  Radio,
  ShieldAlert,
  GitBranch,
} from "lucide-react";
import {
  INTEGRATION_SOURCES,
  VERIFICATION_PHASES,
  computeAhpTotals,
  AHP_CRITERIA,
} from "@/lib/ive/data";

const SOURCE_ICONS = {
  CAD: FileBox,
  GIS: MapPin,
  BIM: Boxes,
  IoT: Radio,
  External: Layers,
};

const SOURCE_TONES = {
  synced: "ive-text-emerald",
  drifted: "ive-text-gold",
  ingesting: "ive-text-jade",
  quarantined: "ive-text-rose",
};

const PHASE_TONES = {
  verified: "ive-text-emerald",
  in_progress: "ive-text-gold",
  blocked: "ive-text-rose",
  pending: "text-muted-foreground",
};

export function IntegrationTab() {
  const alts = computeAhpTotals();
  const winner = alts.find((a) => a.recommended) ?? alts[0];

  return (
    <div className="space-y-6">
      {/* Sources */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Layers className="h-4 w-4 ive-text-gold" />
            Agnostic Data Sources
          </CardTitle>
          <CardDescription className="text-xs">
            CAD DWG, GIS SHP, BIM RVT and IoT MQTT streams fused into a single
            unified platform. Eliminates manual transfers — external teams
            overlay spatial data for real-time visualization of real-world
            conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATION_SOURCES.map((s) => {
              const Icon = SOURCE_ICONS[s.type];
              const tone = SOURCE_TONES[s.status];
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-border/40 bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${tone}`} />
                      <span className="font-mono text-xs font-medium">
                        {s.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] uppercase tracking-widest ${tone}`}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>{s.type} · {s.format}</span>
                    <span>{s.nodes.toLocaleString()} nodes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* V-model diagram */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <GitBranch className="h-4 w-4 ive-text-emerald" />
            Model-Driven V-Design · Triple V
          </CardTitle>
          <CardDescription className="text-xs">
            Requirements on the left are systematically verified by interwoven
            test phases on the right to prevent coordination collapse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left side */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                ◤ Requirements
              </div>
              {VERIFICATION_PHASES.filter((p) => p.side === "left").map((p, i) => (
                <VRow key={p.id} phase={p} indent={i * 12} />
              ))}
            </div>
            {/* Right side */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Verification ◥
              </div>
              {VERIFICATION_PHASES.filter((p) => p.side === "right").map((p, i) => (
                <VRow
                  key={p.id}
                  phase={p}
                  indent={(4 - i) * 12}
                  mirrored
                />
              ))}
            </div>
          </div>
          {/* Center diagonal */}
          <div className="relative mt-4 h-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[oklch(0.82_0.16_75/50%)] to-transparent" />
            </div>
            <div className="relative flex items-center justify-center">
              <Badge
                variant="outline"
                className="border-[oklch(0.82_0.16_75/40%)] bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-widest ive-text-gold"
              >
                Traceable bidirectional verification
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CAD/GIS convergence map (SVG) */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <MapPin className="h-4 w-4 ive-text-gold" />
            CAD + GIS Convergence
          </CardTitle>
          <CardDescription className="text-xs">
            Resolves spatial difficulties — CAD geometry and GIS features
            aligned to common coordinate reference system (Hartebeesthoek94 /
            EPSG:9221).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-lg border border-border/40 bg-black/40 ive-bg-grid">
            <ConvergenceViz />
          </div>
        </CardContent>
      </Card>

      {/* AHP multi-criteria */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Boxes className="h-4 w-4 ive-text-gold" />
              Multi-Criteria Decision · Analytical Hierarchy Process
            </CardTitle>
            <CardDescription className="text-xs">
              OmniClass-classified criteria ranked with AHP weights. Design
              alternatives scored against weighted criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-3 ${
                    a.recommended
                      ? "border-[oklch(0.82_0.16_75/40%)] bg-primary/10 ive-glow-gold"
                      : "border-border/40 bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium">
                      {a.name}
                    </span>
                    {a.recommended && (
                      <Badge
                        variant="outline"
                        className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold"
                      >
                        RECOMMENDED
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {AHP_CRITERIA.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-32 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {c.name}
                        </span>
                        <Progress
                          value={a.criteria[c.id] ?? 0}
                          className="h-1.5 flex-1"
                        />
                        <span className="w-8 text-right font-mono text-[10px] ive-text-gold">
                          {a.criteria[c.id] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Weighted total
                    </span>
                    <span className="font-mono text-lg font-bold ive-text-gold">
                      {a.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <ShieldAlert className="h-4 w-4 ive-text-emerald" />
              Clash Detection &amp; Load Simulation
            </CardTitle>
            <CardDescription className="text-xs">
              Automated verification pipeline. Early conflict resolution
              reduces construction delays and rework.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              {
                label: "Hard clashes resolved",
                val: "1,847",
                tone: "ive-text-emerald",
              },
              {
                label: "Soft clashes flagged",
                val: "63",
                tone: "ive-text-gold",
              },
              {
                label: "Load simulations run",
                val: "412",
                tone: "ive-text-gold",
              },
              {
                label: "Spatial misalignments corrected",
                val: "28",
                tone: "ive-text-emerald",
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/30 p-2.5"
              >
                <span className="text-muted-foreground">{r.label}</span>
                <span className={`font-mono text-2xl font-bold ${r.tone}`}>
                  {r.val}
                </span>
              </div>
            ))}
            <div className="rounded-md border border-[oklch(0.82_0.16_75/30%)] bg-primary/5 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest ive-text-gold">
                Recommended alternative
              </div>
              <div className="mt-1 font-mono text-sm font-semibold">
                {winner.name}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                AHP weighted score: {winner.total} / 100
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VRow({
  phase,
  indent,
  mirrored,
}: {
  phase: (typeof VERIFICATION_PHASES)[number];
  indent: number;
  mirrored?: boolean;
}) {
  const tone = PHASE_TONES[phase.status];
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-border/40 bg-secondary/30 p-2"
      style={{ marginLeft: mirrored ? 0 : indent, marginRight: mirrored ? indent : 0 }}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest ive-text-gold">
        {phase.stage}
      </span>
      <div className="flex-1">
        <div className="font-mono text-xs font-medium">{phase.layer}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          owner · {phase.owner}
        </div>
      </div>
      <span className={`font-mono text-[10px] uppercase tracking-widest ${tone}`}>
        {phase.status.replace("_", " ")}
      </span>
    </div>
  );
}

function ConvergenceViz() {
  // simple SVG: cadastral grid + BIM footprint + IoT sensors
  return (
    <svg viewBox="0 0 800 350" className="h-full w-full" role="img" aria-label="CAD-GIS convergence map">
      {/* base terrain grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.7 0.05 75 / 0.18)" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="bim-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.82 0.16 75 / 0.9)" />
          <stop offset="100%" stopColor="oklch(0.82 0.16 75 / 0)" />
        </radialGradient>
      </defs>
      <rect width="800" height="350" fill="url(#grid)" />
      {/* contour lines (GIS SHP) */}
      {[40, 90, 150, 220, 290].map((y, i) => (
        <path
          key={i}
          d={`M 0 ${y} Q 200 ${y - 20} 400 ${y} T 800 ${y}`}
          fill="none"
          stroke="oklch(0.72 0.17 162 / 0.5)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      ))}
      {/* CAD alignment (DWG) */}
      <path
        d="M 120 280 L 280 200 L 460 240 L 620 160 L 760 200"
        fill="none"
        stroke="oklch(0.55 0 0)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      {/* BIM building footprint */}
      <g transform="translate(330 150)">
        <rect
          x="0"
          y="0"
          width="160"
          height="100"
          fill="url(#bim-glow)"
          stroke="oklch(0.85 0.16 75)"
          strokeWidth="2"
        />
        <rect x="20" y="20" width="40" height="30" fill="none" stroke="oklch(0.85 0.16 75 / 0.6)" />
        <rect x="80" y="20" width="60" height="60" fill="none" stroke="oklch(0.85 0.16 75 / 0.6)" />
        <text x="80" y="120" textAnchor="middle" fill="oklch(0.85 0.16 75)" fontSize="10" fontFamily="monospace">
          BIM · RVT (48,291 nodes)
        </text>
      </g>
      {/* IoT sensors */}
      {[
        [180, 120],
        [620, 90],
        [150, 260],
        [680, 240],
        [400, 60],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="oklch(0.72 0.17 162)" opacity="0.9" />
          <circle cx={x} cy={y} r="9" fill="none" stroke="oklch(0.72 0.17 162 / 0.4)">
            <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* labels */}
      <text x="12" y="20" fill="oklch(0.55 0 0)" fontSize="9" fontFamily="monospace">
        DWG alignment
      </text>
      <text x="12" y="40" fill="oklch(0.72 0.17 162)" fontSize="9" fontFamily="monospace">
        SHP contours (GIS)
      </text>
      <text x="12" y="60" fill="oklch(0.72 0.17 162)" fontSize="9" fontFamily="monospace">
        IoT mesh
      </text>
      <text x="788" y="20" textAnchor="end" fill="oklch(0.7 0.05 75 / 0.8)" fontSize="9" fontFamily="monospace">
        CRS · Hartebeesthoek94 · EPSG:9221
      </text>
    </svg>
  );
}
