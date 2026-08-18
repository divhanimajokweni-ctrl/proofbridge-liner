"use client";

import { Card } from "@/components/ui/card";
import { ParticipationRatioResult } from "@/lib/eis";
import { Sigma } from "lucide-react";

interface ParticipationRatioPanelProps {
  result: ParticipationRatioResult | null;
  threshold?: number;
  loading?: boolean;
  onRecompute?: () => void;
}

export function ParticipationRatioPanel({
  result,
  threshold = 2,
  loading,
  onRecompute,
}: ParticipationRatioPanelProps) {
  const meetsThreshold = result ? result.nInd >= threshold - 0.3 : false;
  const topEigenvalues = result
    ? result.eigenvalues.slice(0, 12)
    : [];
  const maxLambda = topEigenvalues.length > 0
    ? Math.max(...topEigenvalues, 0.001)
    : 1;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <Sigma className="h-3.5 w-3.5" />
            Participation Ratio
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            N_ind = (∑λ_i)² / ∑λ_i²
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Theorem 2
          </span>
          {onRecompute && (
            <button
              onClick={onRecompute}
              disabled={loading}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-mono font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Recompute"}
            </button>
          )}
        </div>
      </div>

      {result ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                N_ind
              </div>
              <div
                className={`font-mono text-lg font-bold ${
                  meetsThreshold
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {result.nInd.toFixed(2)}
              </div>
            </div>
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sources
              </div>
              <div className="font-mono text-lg font-bold">
                {result.numSources}
              </div>
            </div>
            <div className="rounded-md border bg-card p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                γ (RBF)
              </div>
              <div className="font-mono text-lg font-bold">
                {result.gamma.toFixed(3)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Eigenvalue Spectrum (top {topEigenvalues.length})
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                threshold: {threshold}
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-16 rounded-md border bg-muted/20 p-1.5">
              {topEigenvalues.map((lambda, i) => {
                const height = Math.max(2, (lambda / maxLambda) * 100);
                const isSignificant = lambda / maxLambda > 0.1;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${height}%`,
                      backgroundColor: isSignificant
                        ? "var(--chart-1, oklch(0.646 0.222 41.116))"
                        : "var(--muted-foreground, oklch(0.556 0 0))",
                      opacity: isSignificant ? 1 : 0.4,
                    }}
                    title={`λ_${i + 1} = ${lambda.toFixed(4)}`}
                  />
                );
              })}
              {topEigenvalues.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground italic">
                  no eigenvalues
                </div>
              )}
            </div>
          </div>

          <p className="mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed">
            Median-heuristic γ = 1 / median(‖φ_i − φ_j‖²). Monotonic in true source count m.
          </p>
        </>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground font-mono">
          No N_ind computation yet. Run /api/n-ind to compute participation ratio.
        </div>
      )}
    </Card>
  );
}
