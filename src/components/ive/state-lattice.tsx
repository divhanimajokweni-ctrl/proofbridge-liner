"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { STATE_RANK, VerificationState, statesInOrder } from "@/lib/eis";
import { GlossaryTerm } from "@/components/vvu/glossary-term";

interface StateLatticeProps {
  currentState: VerificationState;
  compact?: boolean;
}

const STATE_DESCRIPTIONS: Record<VerificationState, string> = {
  PROVEN: "Mathematical proof. Highest epistemic strength. Only mathematical claims can reach this state.",
  VERIFIED: "Semantic validity established. Reserved for mathematical + semantic claims.",
  SUPPORTED: "Empirical validation. Default threshold for authorization (AUTH_THRESHOLD).",
  OBSERVED: "Operational observation. Default state for fresh evidence from the Mesh.",
  INCONCLUSIVE: "Evidence present but ambiguous. Authorization blocked.",
  UNVALIDATED: "Claim exists but no verification has been run.",
  UNTESTED: "Freshly created claim — no evidence yet.",
  STALE: "Evidence exceeded the staleness window. Circuit breaker may trip.",
  FALSIFIED: "Terminal denial. Incomparable in the lattice. All authorization revoked.",
};

export function StateLattice({ currentState, compact = false }: StateLatticeProps) {
  const ordered = statesInOrder();
  const currentRank = STATE_RANK[currentState];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight">
          <GlossaryTerm term="State Lattice">Verification State Lattice</GlossaryTerm>
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Theorem 4</span>
      </div>
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {ordered.map((s, idx) => {
            const isActive = s === currentState;
            const isReached = s !== "FALSIFIED" && currentState !== "FALSIFIED" && STATE_RANK[s] <= currentRank;
            const isFalsified = currentState === "FALSIFIED" && s === "FALSIFIED";
            const color = isFalsified
              ? "bg-red-500 text-white border-red-600"
              : isActive
                ? "bg-foreground text-background border-foreground"
                : isReached
                  ? "bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/60"
                  : "bg-muted/50 text-muted-foreground border-border";
            return (
              <div key={s} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "rounded-md border px-2 py-1 text-[10px] font-mono font-semibold tracking-wide cursor-help",
                      color,
                      compact && "px-1.5 py-0.5"
                    )}>
                      {s}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[180px] md:max-w-[260px]">
                    <p className="font-mono text-[11px] font-semibold mb-1">{s}</p>
                    <p className="text-[11px] leading-relaxed">{STATE_DESCRIPTIONS[s]}</p>
                  </TooltipContent>
                </Tooltip>
                {idx < ordered.length - 1 && (
                  <span className={cn(
                    "text-muted-foreground/40 mx-0.5 text-xs",
                    ordered[idx + 1] === "FALSIFIED" ? "font-bold text-red-500/70 text-sm" : ""
                  )}>
                    {ordered[idx + 1] === "FALSIFIED" ? "⊥" : "≥"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="mt-3 overflow-x-auto -mx-1 px-1">
        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono leading-relaxed whitespace-nowrap">
          PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono leading-relaxed break-words">
          FALSIFIED (incomparable, terminal denial)
        </p>
      </div>
    </Card>
  );
}
