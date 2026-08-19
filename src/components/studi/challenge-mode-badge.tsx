"use client";

/**
 * Challenge Mode Badge — small explanatory indicator that the system
 * challenges assumptions to improve accuracy.
 *
 * Per operator directive: "I recommend auto-enabled, with a small
 * explanatory badge: 'This system challenges assumptions to improve
 * accuracy.'"
 *
 * Locked as the core UX principle for the Study Release.
 */

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles } from "lucide-react";
import {
  getEpistemicStats,
} from "@/lib/studi/epistemic-objects";
import { useEffect, useState } from "react";

interface Props {
  variant?: "compact" | "full";
  className?: string;
}

export function ChallengeModeBadge({ variant = "compact", className }: Props) {
  const [stats, setStats] = useState({
    total: 0,
    resolution_rate: 0,
  });

  useEffect(() => {
    setStats(getEpistemicStats());
    // Refresh on focus (in case user interacted with epistemic objects in
    // another tab).
    const onFocus = () => setStats(getEpistemicStats());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (variant === "compact") {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border-vvu-studi/40 bg-vvu-studi/5 font-mono text-[10px] uppercase tracking-wider ${className ?? ""}`}
        style={{ color: "var(--vvu-studi)" }}
        title="This system challenges assumptions to improve accuracy."
      >
        <ShieldCheck className="h-3 w-3" />
        Challenge Mode
      </Badge>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-vvu-studi/30 bg-vvu-studi/5 px-2.5 py-1 ${className ?? ""}`}
    >
      <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--vvu-studi)" }} />
      <div className="flex flex-col">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--vvu-studi)" }}
        >
          Challenge Mode Active
        </span>
        <span className="text-[10px] text-muted-foreground">
          This system challenges assumptions to improve accuracy.
        </span>
      </div>
      {stats.total > 0 && (
        <Badge
          variant="outline"
          className="ml-2 font-mono text-[9px] uppercase tracking-wider"
        >
          {stats.total} challenges · {Math.round(stats.resolution_rate * 100)}% resolved
        </Badge>
      )}
    </div>
  );
}
