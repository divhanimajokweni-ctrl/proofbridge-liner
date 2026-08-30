"use client";

import { ClaimWithRelations } from "@/lib/eis";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlossaryTerm } from "@/components/vvu/glossary-term";
import {
  CheckCircle2,
  AlertTriangle,
  Activity,
  Shield,
  Zap,
  Clock,
} from "lucide-react";

interface ClaimAuditTrailProps {
  claim: ClaimWithRelations | null;
}

interface TimelineEvent {
  icon: React.ElementType;
  timestamp: Date;
  title: string;
  detail: string;
  color: "green" | "amber" | "red";
}

const COLOR_MAP = {
  green: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    line: "bg-emerald-500/40",
  },
  amber: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    icon: "text-amber-600 dark:text-amber-400",
    line: "bg-amber-500/40",
  },
  red: {
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    icon: "text-red-600 dark:text-red-400",
    line: "bg-red-500/40",
  },
} as const;

export function ClaimAuditTrail({ claim }: ClaimAuditTrailProps) {
  if (!claim) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Select a claim to view its audit trail
      </div>
    );
  }

  const events: TimelineEvent[] = [];

  // 1. Claim Created
  events.push({
    icon: Clock,
    timestamp: new Date(claim.createdAt),
    title: "Claim Created",
    detail: `"${claim.title}" — type: ${claim.claimType}${claim.safetyCritical ? " (safety-critical)" : ""}`,
    color: "green",
  });

  // 2. Evidence Ingested
  if (claim.evidence.length > 0) {
    const sources = [...new Set(claim.evidence.map((e) => e.source))];
    events.push({
      icon: Activity,
      timestamp: new Date(
        Math.max(...claim.evidence.map((e) => new Date(e.collectedAt).getTime()))
      ),
      title: "Evidence Ingested",
      detail: `${claim.evidence.length} items from ${sources.join(", ")}`,
      color: "green",
    });
  }

  // 3. Verification Computed
  if (claim.state !== "UNTESTED" && claim.state !== "UNVALIDATED") {
    events.push({
      icon: CheckCircle2,
      timestamp: new Date(claim.updatedAt),
      title: "Verification Computed",
      detail: `State: ${claim.state}`,
      color: claim.state === "FALSIFIED" ? "red" : claim.state === "INCONCLUSIVE" ? "amber" : "green",
    });
  }

  // 4. N_ind Computed
  if (claim.nIndRecords.length > 0) {
    const latestNInd = claim.nIndRecords[claim.nIndRecords.length - 1];
    events.push({
      icon: Activity,
      timestamp: new Date(latestNInd.createdAt),
      title: "N_ind Computed",
      detail: `N_ind = ${latestNInd.nInd.toFixed(2)} (${latestNInd.numSources} latent sources, γ = ${latestNInd.gamma.toFixed(3)})`,
      color: latestNInd.nInd >= 2 ? "green" : latestNInd.nInd >= 1 ? "amber" : "red",
    });
  }

  // 5. Authorization Evaluated
  if (claim.authorizations.length > 0) {
    const latestAuth = claim.authorizations[claim.authorizations.length - 1];
    events.push({
      icon: Shield,
      timestamp: new Date(latestAuth.createdAt),
      title: "Authorization Evaluated",
      detail: latestAuth.authorized
        ? `Authorized — ${latestAuth.reason}`
        : `Denied — ${latestAuth.reason}`,
      color: latestAuth.authorized ? "green" : "red",
    });
  }

  // 6. Circuit Breaker Events
  for (const ce of claim.circuitEvents) {
    if (ce.triggered) {
      events.push({
        icon: Zap,
        timestamp: new Date(ce.trippedAt),
        title: "Circuit Breaker Tripped",
        detail: `Reason: ${ce.reason || "unknown"}`,
        color: "red",
      });
    }
  }

  // Sort events by timestamp
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold tracking-tight">Audit Trail</h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {events.length} events
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono">
          <GlossaryTerm term="Circuit Breaker">CB</GlossaryTerm> · <GlossaryTerm term="Authorization">Auth</GlossaryTerm> · <GlossaryTerm term="N_ind">N_ind</GlossaryTerm>
        </span>
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        {events.length > 1 && (
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        )}

        <div className="space-y-4">
          {events.map((event, i) => {
            const Icon = event.icon;
            const c = COLOR_MAP[event.color];
            const isLast = i === events.length - 1;

            return (
              <div key={i} className="relative">
                {/* Dot on the timeline */}
                <div
                  className={cn(
                    "absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full ring-2",
                    c.dot,
                    c.ring
                  )}
                />

                {/* Event content */}
                <div className="flex items-start gap-2">
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", c.icon)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{event.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {event.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
