"use client";

import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircuitBreakerRecord {
  id: string;
  triggered: boolean;
  reason: string;
  trippedAt: string | Date;
}

interface CircuitBreakerPanelProps {
  events: CircuitBreakerRecord[];
  safetyCritical: boolean;
}

const REASON_LABELS: Record<string, string> = {
  evidence_lost: "Evidence Lost",
  verification_failed: "Verification Failed",
  safety_violation: "Safety Violation",
  stale_evidence: "Stale Evidence",
  integrity_breach: "Integrity Breach",
  "": "No Trip",
};

export function CircuitBreakerPanel({ events, safetyCritical }: CircuitBreakerPanelProps) {
  const latest = events[0];
  const isTripped = latest?.triggered === true;

  return (
    <Card className={cn(
      "p-4 transition-colors",
      isTripped
        ? "border-red-500/50 bg-red-500/5"
        : "border-emerald-500/30 bg-emerald-500/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Circuit Breaker
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            fail-closed: loss of E → loss of V → loss of A
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Theorem 5</span>
      </div>
      <div className={cn(
        "rounded-md border px-3 py-2 text-center transition-colors",
        isTripped
          ? "border-red-500/40 bg-red-500/8"
          : "border-emerald-500/30 bg-emerald-500/8"
      )}>
        <div className={cn(
          "font-mono text-sm font-semibold tracking-wider",
          isTripped
            ? "text-red-700 dark:text-red-300"
            : "text-emerald-700 dark:text-emerald-300"
        )}>
          {isTripped ? "● TRIPPED — FAIL CLOSE" : "● CLOSED — AUTHORIZING"}
        </div>
        {isTripped && latest && (
          <p className="mt-1 text-[11px] text-red-700 dark:text-red-300 font-mono">
            {REASON_LABELS[latest.reason] ?? latest.reason}
          </p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="rounded border bg-card p-1.5">
          <div className="text-muted-foreground uppercase tracking-wider">Safety-critical</div>
          <div className="font-semibold">{safetyCritical ? "YES" : "no"}</div>
        </div>
        <div className="rounded border bg-card p-1.5">
          <div className="text-muted-foreground uppercase tracking-wider">Events</div>
          <div className="font-semibold">{events.length}</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed">
        When tripped, all authorization revoked until reverification restores the evidence bound.
      </p>
    </Card>
  );
}
