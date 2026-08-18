"use client";

/**
 * EvolutionMatrixPage — full-control view of the Fibonacci point-cloud.
 *
 * Two modes:
 *   - LIVE  : matrix reads its target stage from the global theorem-state
 *             store and eases toward it. This is the same data-driven
 *             mode as the hero backdrops — the matrix becomes a live
 *             status surface.
 *   - EXPLORE : manual mode — auto-loop + slider + smoke, the original
 *             exploration surface.
 *
 * Stage notes give the math behind each shape and the VVU story it
 * carries. Below the matrix, a "Valve State" card shows the live theorem
 * verdicts + breaker + confidence so the operator can see exactly what
 * is driving the morph.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { useWorkspace } from "@/lib/workspace";
import { useTheoremStore } from "@/lib/theorem/theorem-store";

const STAGE_NOTES = [
  {
    title: "Global Sphere",
    math: "phi = acos(-1 + 2i/N),  theta = sqrt(N·π)·phi",
    desc: "Fibonacci lattice on the unit sphere — the lowest-discrepancy isotropic distribution of N points. Every node carries the same weight: this is STUDI's view of the institution, where every claim and every governing document is one peer among peers.",
  },
  {
    title: "Ant Mascot (Antone)",
    math: "cluster(u) = -0.6 + sqrt(r) · cos(2πa)",
    desc: "The cloud re-coheres into Antone — the worker-scholar mascot. Six legs fan out from a head cluster; the thorax and abdomen appear as separate clouds. STUDI's labour: every node is still part of the whole, but now organized into a body.",
  },
  {
    title: "Kinetic Web Spider",
    math: "leg(k) = (cos(k·π/4 + 0.2), sin(k·π/4 + 0.2))·(0.2 + p·0.6)",
    desc: "Eight radial legs — IVE's plugin network. The webhook delivery fan-out, the adapter attribution, every external system IVE can authorize-and-release into is one node on this web. The center holds; the legs reach.",
  },
  {
    title: "Miles Spider-Man",
    math: "color = node.isRed ? #ff2233 : #ffffff",
    desc: "The release form. Red nodes are the authorized cluster — claims that have crossed the fail-closed valve and are bound for engineering release. White nodes are still pending. This is IVE's terminal view: proof has accumulated into action.",
  },
] as const;

const STAGE_COLORS = ["#7c8bf5", "#c07a40", "#e67e22", "#e74c3c"];

type Mode = "live" | "explore";

export function EvolutionMatrixPage() {
  const { workspace, meta } = useWorkspace();
  const [mode, setMode] = useState<Mode>("live");

  // Live theorem-state subscription — show what's driving the morph.
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const loading = useTheoremStore((s) => s.loading);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);

  const verdict = workspace === "studi" ? studiVerdict : iveVerdict;
  const verdictColor =
    verdict === "PROVEN"
      ? "#10b981"
      : verdict === "INCONCLUSIVE"
        ? "#e74c3c"
        : "#7c8bf5";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `color-mix(in oklab, var(${meta.accentVar}) 22%, transparent)`,
                  color: `var(${meta.accentVar})`,
                }}
              >
                {meta.name}
              </span>
              VVU Evolution Matrix
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div
                className="flex items-center rounded-md border border-border bg-card/40 p-0.5"
                role="tablist"
              >
                <button
                  role="tab"
                  aria-selected={mode === "live"}
                  onClick={() => setMode("live")}
                  className={`rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    mode === "live"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    mode === "live"
                      ? { boxShadow: "inset 0 0 0 1px var(--vvu-gold)" }
                      : undefined
                  }
                >
                  Live
                </button>
                <button
                  role="tab"
                  aria-selected={mode === "explore"}
                  onClick={() => setMode("explore")}
                  className={`rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    mode === "explore"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    mode === "explore"
                      ? { boxShadow: "inset 0 0 0 1px var(--vvu-gold)" }
                      : undefined
                  }
                >
                  Explore
                </button>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase tracking-wider"
              >
                Fibonacci · 650 nodes
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            A single instanced point cloud distributed on a Fibonacci
            sphere-lattice, morphing between four canonical shapes that
            map onto the VVU trust story. In <strong className="text-foreground">Live</strong> mode,
            the cloud eases toward the current theorem-state verdict for
            the active workspace — it is the visible face of the
            fail-closed valve. In <strong className="text-foreground">Explore</strong> mode
            the cloud auto-loops and the slider gives manual control for
            inspecting any intermediate frame.
          </p>
          <div
            style={{
              height: "min(70vh, 640px)",
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #222",
            }}
          >
            <EvolutionMatrix
              mode="full"
              dataDriven={mode === "live"}
              stageRange={workspace === "studi" ? [0, 1] : [2, 3]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Live valve-state card — shows what's driving the morph */}
      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Valve State
              <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                theorem-state · {mode === "live" ? "driving" : "background"}
              </span>
            </CardTitle>
            {loading && (
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                loading
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ValveStat label="STUDI verdict" value={studiVerdict} color={verdictColorFor(studiVerdict)} />
            <ValveStat label="IVE verdict" value={iveVerdict} color={verdictColorFor(iveVerdict)} />
            <ValveStat
              label="EIS breaker"
              value={breaker}
              color={breaker === "TRIPPED" ? "#e74c3c" : "#10b981"}
            />
            <ValveStat
              label="Confidence"
              value={loading ? "—" : `${(confidence * 100).toFixed(0)}%`}
              color="#7c8bf5"
            />
          </div>
          {lastUpdatedAt && !loading && (
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              last updated: {new Date(lastUpdatedAt).toLocaleTimeString()} ·
              poll cadence 5s ·{" "}
              <span style={{ color: verdictColor }}>
                {workspace.toUpperCase()} → {verdict}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage notes */}
      <div className="grid gap-3 md:grid-cols-2">
        {STAGE_NOTES.map((stage, i) => (
          <Card key={stage.title} className="border-border/70">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: STAGE_COLORS[i] }}
                >
                  {i}.
                </span>
                <CardTitle className="text-sm font-semibold tracking-tight">
                  {stage.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {stage.math}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {stage.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70">
        <CardContent className="p-4 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Why Fibonacci:</strong> the
          golden-angle spiral <span className="font-mono">theta = sqrt(N·π)·phi</span> gives
          the lowest-discrepancy isotropic coverage of the sphere — no clumping,
          no holes. That property is what lets the cloud morph cleanly between
          shapes: every node has a unique, well-distributed origin, so the
          smoothstep lerp between stages never tears. Same point cloud, four
          faces — the dual workspace in one image.
        </CardContent>
      </Card>
    </div>
  );
}

function ValveStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-0.5 font-mono text-sm font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

function verdictColorFor(v: string): string {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e74c3c";
  return "#7c8bf5";
}
