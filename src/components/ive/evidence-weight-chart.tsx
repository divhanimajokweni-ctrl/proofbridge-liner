"use client";

import { Card } from "@/components/ui/card";
import { EvidenceItem } from "@/lib/eis";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceWeightChartProps {
  evidence: EvidenceItem[];
}

const SOURCE_COLORS: Record<string, string> = {
  "you.com": "#f43f5e",    // rose
  "brave": "#f97316",      // orange
  "firecrawl": "#f59e0b",  // amber
  "watchdog": "#06b6d4",   // cyan
};

const SOURCE_LABELS: Record<string, string> = {
  "you.com": "You.com",
  "brave": "Brave",
  "firecrawl": "Firecrawl",
  "watchdog": "Watchdog",
};

export function EvidenceWeightChart({ evidence }: EvidenceWeightChartProps) {
  // Group by source and compute aggregate weight
  const bySource: Record<string, { items: EvidenceItem[]; totalWeight: number; avgWeight: number }> = {};
  for (const e of evidence) {
    if (!bySource[e.source]) {
      bySource[e.source] = { items: [], totalWeight: 0, avgWeight: 0 };
    }
    bySource[e.source].items.push(e);
    bySource[e.source].totalWeight += e.weight;
  }

  const sources = Object.keys(bySource);
  for (const s of sources) {
    bySource[s].avgWeight = bySource[s].totalWeight / bySource[s].items.length;
  }

  const maxWeight = Math.max(...Object.values(bySource).map((v) => v.avgWeight), 1);
  const totalItems = evidence.length;
  const totalWeight = evidence.reduce((s, e) => s + e.weight, 0);
  const avgWeight = totalItems > 0 ? totalWeight / totalItems : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Evidence Weight Distribution
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Per-source average confidence
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span>n={totalItems}</span>
          <span>μ={avgWeight.toFixed(2)}</span>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-md">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-xs font-medium text-muted-foreground">No evidence collected yet</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">Ingest evidence to see weight distribution</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="space-y-2 mb-3">
            {sources.map((source) => {
              const data = bySource[source];
              const heightPct = (data.avgWeight / maxWeight) * 100;
              const color = SOURCE_COLORS[source] ?? "#6b7280";
              return (
                <div key={source} className="flex items-center gap-2">
                  <div className="w-20 shrink-0">
                    <span className="text-[11px] font-mono font-semibold">
                      {SOURCE_LABELS[source] ?? source}
                    </span>
                  </div>
                  <div className="flex-1 h-6 rounded-md bg-muted/30 overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${heightPct}%`,
                        backgroundColor: color,
                        minWidth: "2rem",
                      }}
                    >
                      <span className="text-[9px] font-mono font-bold text-white">
                        {data.items.length}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 shrink-0 text-right">
                    <span className="text-[10px] font-mono font-semibold">
                      {data.avgWeight.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border bg-card/50 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sources
              </div>
              <div className="font-mono text-sm font-bold">
                {sources.length}
              </div>
            </div>
            <div className="rounded border bg-card/50 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total
              </div>
              <div className="font-mono text-sm font-bold">
                {totalItems}
              </div>
            </div>
            <div className="rounded border bg-card/50 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Σ Weight
              </div>
              <div className="font-mono text-sm font-bold">
                {totalWeight.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {sources.map((source) => (
              <div key={source} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[source] ?? "#6b7280" }}
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {SOURCE_LABELS[source] ?? source}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground font-mono leading-relaxed">
            Weight ∈ [0,1] modulates contribution to N_ind. Higher weight = stronger provenance confidence.
          </p>
        </>
      )}
    </Card>
  );
}
