"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface HeatKernelStepData {
  step: number;
  l2Norm: number;
  highFreqEnergy: number;
}

interface HeatKernelResult {
  topology: string;
  n: number;
  kappa: number;
  steps: number;
  finalL2Norm: number;
  finalHighFreqEnergy: number;
  retention: number;
  trace: HeatKernelStepData[];
  signature?: { expectedRetentionAt25?: number; expectedHighFreqRatio?: number; theorem?: string };
}

interface HeatKernelPanelProps {
  claimId?: string;
  topology?: "cycle" | "evidence";
}

export function HeatKernelPanel({ claimId, topology = "cycle" }: HeatKernelPanelProps) {
  const [result, setResult] = useState<HeatKernelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const body: Record<string, unknown> = { topology, kappa: 0.25, steps: 50 };
        if (topology === "evidence" && claimId) {
          body.claimId = claimId;
        } else if (topology === "cycle") {
          body.n = 128;
        }
        const res = await fetch("/api/heat-kernel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as Record<string, string>).error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as HeatKernelResult;
        if (!cancelled) setResult(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (topology === "cycle" || (topology === "evidence" && claimId)) {
      run();
    }
    return () => { cancelled = true; };
  }, [claimId, topology]);

  const trace = result?.trace ?? [];
  const maxL2 = Math.max(...trace.map((s) => s.l2Norm), 0.001);
  const maxHighFreq = Math.max(...trace.map((s) => s.highFreqEnergy), 0.001);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5" /> Heat Kernel Diffusion
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            u_t = −κ L u (graph Laplacian L = D − A)
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Theorem 3</span>
      </div>
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-md">
          <Flame className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
          <p className="text-xs font-medium text-muted-foreground">Running diffusion</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">Computing heat kernel trace on graph Laplacian</p>
        </div>
      )}
      {error && (
        <div className="py-4 text-center text-xs text-red-600 dark:text-red-400 font-mono">{error}</div>
      )}
      {result && !loading && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">L2 retention</div>
              <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {(result.retention * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">High-freq</div>
              <div className="font-mono text-lg font-bold text-red-600 dark:text-red-400">
                {result.finalHighFreqEnergy.toFixed(3)}×
              </div>
            </div>
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">κ / N</div>
              <div className="font-mono text-lg font-bold">{result.kappa}/{result.n}</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Diffusion trace
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> L2 norm
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-orange-500" /> High-freq
                </span>
              </div>
            </div>
            <div className="relative h-24 rounded-md border bg-muted/20 p-1.5">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full p-1.5"
              >
                <polyline
                  fill="none"
                  stroke="oklch(0.646 0.222 41.116)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  points={trace
                    .map(
                      (s, i) =>
                        `${(i / Math.max(1, trace.length - 1)) * 100},${100 - (s.l2Norm / maxL2) * 95}`
                    )
                    .join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="oklch(0.7 0.18 50)"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  vectorEffect="non-scaling-stroke"
                  points={trace
                    .map(
                      (s, i) =>
                        `${(i / Math.max(1, trace.length - 1)) * 100},${100 - (s.highFreqEnergy / maxHighFreq) * 95}`
                    )
                    .join(" ")}
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed">
            Heat kernel decays monotonically; high-frequency modes suppressed.
          </p>
        </>
      )}
    </Card>
  );
}
