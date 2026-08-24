"use client";

import { useEffect, useMemo, useState } from "react";
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
  Atom,
  Cpu,
  Gauge,
  Activity,
  Boxes,
  Waves,
  LineChart,
  Zap,
} from "lucide-react";
import { HBK_RUNS } from "@/lib/ive/data";

function speedup(run: (typeof HBK_RUNS)[number]) {
  return run.mcmcMs / run.hbkMs;
}

/**
 * Canvas-rendered supervised random Fourier basis visualization.
 * Two superimposed waveforms:
 *  - dim grey: legacy MCMC chain trajectory
 *  - amber:    HBK Mk-II supervised Fourier features
 * The amber waveform converges faster with lower variance.
 */
function FourierViz() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, []);

  const width = 720;
  const height = 220;

  const points = useMemo(() => {
    const n = 240;
    const mcmc: [number, number][] = [];
    const hbk: [number, number][] = [];
    const t = tick * 0.06;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * width;
      // MCMC: noisy slow-converging chain
      const mcmcY =
        height / 2 +
        Math.sin((i / n) * Math.PI * 8 + t) * 28 +
        Math.sin((i / n) * Math.PI * 19 + t * 0.3) * 14 +
        (Math.random() - 0.5) * 22;
      // HBK: smoother, faster-converging Fourier features
      const hbkY =
        height / 2 +
        Math.sin((i / n) * Math.PI * 8 + t * 1.8) * 22 +
        Math.sin((i / n) * Math.PI * 3 + t * 0.9) * 10;
      mcmc.push([x, mcmcY]);
      hbk.push([x, hbkY]);
    }
    return { mcmc, hbk };
  }, [tick]);

  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border/40 bg-black/40 ive-bg-grid">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Supervised random Fourier basis visualization: HBK Mk-II vs MCMC"
      >
        <path
          d={toPath(points.mcmc)}
          fill="none"
          stroke="oklch(0.55 0 0)"
          strokeWidth={1.2}
          opacity={0.55}
        />
        <path
          d={toPath(points.hbk)}
          fill="none"
          stroke="oklch(0.85 0.16 75)"
          strokeWidth={2}
          filter="url(#glow)"
        />
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div className="absolute left-2 top-2 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-widest">
        <span className="ive-text-gold">— HBK Mk-II (Fourier features)</span>
        <span className="text-muted-foreground">— MCMC chain (legacy)</span>
      </div>
    </div>
  );
}

export function HbkTab() {
  const avgSpeedup =
    HBK_RUNS.reduce((s, r) => s + speedup(r), 0) / HBK_RUNS.length;
  const pct = Math.round((1 - 1 / avgSpeedup) * 100);
  const maxNodes = Math.max(...HBK_RUNS.map((r) => r.nodes));

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="ive-glass-gold">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
              Avg Speedup vs MCMC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold ive-text-gold">
                ×{avgSpeedup.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {pct}% faster
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Replaces Markov chain Monte Carlo with supervised random Fourier
              basis functions, scaling ~linearly with exposure count.
            </p>
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
              Hybrid Physics Prior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold ive-text-emerald">
                GP-inferred
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Iterative Bayesian learning fused with partially-known
              mechanistic priors (mass conservation, load tolerances). Missing
              equations inferred via Gaussian Processes.
            </p>
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
              Active Kernel Runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold ive-text-gold">
                {HBK_RUNS.length}
              </span>
              <span className="text-xs text-muted-foreground">
                concurrent GPs
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Each run supervises a Fourier feature map over thousands of
              exposure samples or geometric node deviations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fourier viz */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Waves className="h-4 w-4 ive-text-gold" />
            Supervised Random Fourier Basis
          </CardTitle>
          <CardDescription className="text-xs">
            Live trace: amber waveform = HBK Mk-II supervised features; grey
            waveform = legacy MCMC chain. HBK converges in fewer iterations
            with lower posterior variance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FourierViz />
        </CardContent>
      </Card>

      {/* Performance scaling table */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <LineChart className="h-4 w-4 ive-text-emerald" />
            Performance Scaling · MCMC vs HBK Mk-II
          </CardTitle>
          <CardDescription className="text-xs">
            All runs verified against AIR evidence decay tracker — variance
            reported as posterior σ².
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ive-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pr-4">Run</th>
                  <th className="py-2 pr-4">Exposures</th>
                  <th className="py-2 pr-4">Nodes</th>
                  <th className="py-2 pr-4">MCMC (ms)</th>
                  <th className="py-2 pr-4">HBK (ms)</th>
                  <th className="py-2 pr-4">Speedup</th>
                  <th className="py-2 pr-4">Variance σ²</th>
                  <th className="py-2 pr-4">Load</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {HBK_RUNS.map((r) => {
                  const su = speedup(r);
                  const load = (r.nodes / maxNodes) * 100;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/30 hover:bg-secondary/40"
                    >
                      <td className="py-2 pr-4">
                        <span className="ive-text-gold">{r.label}</span>
                      </td>
                      <td className="py-2 pr-4">{r.exposure.toLocaleString()}</td>
                      <td className="py-2 pr-4">{r.nodes.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.mcmcMs.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 ive-text-emerald">
                        {r.hbkMs.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold ive-text-gold">
                          ×{su.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.variance.toFixed(3)}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Progress value={load} className="h-1.5 w-16" />
                          <span className="text-[10px] text-muted-foreground">
                            {load.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Architecture cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Cpu className="h-4 w-4 ive-text-gold" />
              Kernel Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <Atom className="mt-0.5 h-4 w-4 ive-text-gold" />
              <div>
                <div className="font-mono text-sm font-medium">
                  Supervised Random Fourier Features
                </div>
                <p className="text-muted-foreground">
                  Approximates stationary covariance kernels via random Fourier
                  bases. Eliminates per-step MCMC walk — features are computed
                  once per exposure batch.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Boxes className="mt-0.5 h-4 w-4 ive-text-emerald" />
              <div>
                <div className="font-mono text-sm font-medium">
                  Hybrid Physics Formulation
                </div>
                <p className="text-muted-foreground">
                  Partially-known mechanistic priors (mass conservation,
                  structural load tolerances) anchor the GP posterior. Missing
                  equations are inferred from observed residuals.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gauge className="mt-0.5 h-4 w-4 ive-text-jade" />
              <div>
                <div className="font-mono text-sm font-medium">
                  Linear Exposure Scaling
                </div>
                <p className="text-muted-foreground">
                  Handles thousands of exposures or geometric node deviations
                  nearly linearly — no quadratic blow-up as in legacy MCMC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Zap className="h-4 w-4 ive-text-emerald" />
              Reduction by Dataset Size
            </CardTitle>
            <CardDescription className="text-xs">
              Computation time reduction when migrating from MCMC to HBK Mk-II.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { size: "2 048 exposures", red: 93 },
              { size: "8 192 exposures", red: 95 },
              { size: "32 768 exposures", red: 96 },
              { size: "131 072 exposures", red: 96 },
            ].map((r) => (
              <div key={r.size}>
                <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                  <span className="text-muted-foreground">{r.size}</span>
                  <span className="ive-text-gold">−{r.red}%</span>
                </div>
                <Progress value={r.red} className="h-1.5" />
              </div>
            ))}
            <Badge
              variant="outline"
              className="mt-2 border-[oklch(0.72_0.17_162/40%)] ive-text-emerald"
            >
              Range: 85–96% reduction
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
