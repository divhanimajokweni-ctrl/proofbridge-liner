"use client";

import { Card } from "@/components/ui/card";
import { EvidenceItem } from "@/lib/eis";
import { Globe, Search, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceMeshPanelProps {
  evidence: EvidenceItem[];
  onIngest?: () => void;
  loading?: boolean;
}

const SOURCE_META: Record<string, { icon: typeof Globe; color: string; bg: string }> = {
  "you.com":    { icon: Search,    color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-500/10" },
  "brave":      { icon: Globe,     color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
  "firecrawl":  { icon: FileText,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10" },
  "watchdog":   { icon: Activity,  color: "text-cyan-600 dark:text-cyan-400",    bg: "bg-cyan-500/10" },
};

export function EvidenceMeshPanel({ evidence, onIngest, loading }: EvidenceMeshPanelProps) {
  // Group by source
  const bySource: Record<string, EvidenceItem[]> = {};
  for (const e of evidence) {
    if (!bySource[e.source]) bySource[e.source] = [];
    bySource[e.source].push(e);
  }

  const sources = ["you.com", "brave", "firecrawl", "watchdog"];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Evidence Mesh</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            E(c) = E_you ∪ E_brave ∪ E_firecrawl ∪ E_watchdog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Theorem 4 §4
          </span>
          {onIngest && (
            <button
              onClick={onIngest}
              disabled={loading}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-mono font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Ingest"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sources.map((src) => {
          const meta = SOURCE_META[src];
          const Icon = meta.icon;
          const items = bySource[src] ?? [];
          return (
            <div
              key={src}
              className={cn(
                "rounded-md border p-2.5 transition-colors",
                items.length > 0
                  ? "border-border bg-card"
                  : "border-dashed border-border/60 bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={cn("rounded p-1", meta.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                </div>
                <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="text-[11px] font-mono font-semibold">{src}</div>
              <div className="mt-1.5 space-y-1">
                {items.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground italic">no evidence</div>
                ) : (
                  items.slice(0, 2).map((e) => (
                    <div key={e.id} className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {e.content.slice(0, 70)}
                      {e.content.length > 70 ? "…" : ""}
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, items[0].weight * 100))}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    w={items[0].weight.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
        <p className="text-[10px] text-amber-800 dark:text-amber-200 font-mono leading-relaxed">
          ⚠ Multiple sources ≠ independent. N_ind identifies true latent source count.
        </p>
      </div>
    </Card>
  );
}
