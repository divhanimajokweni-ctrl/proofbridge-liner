"use client";

/**
 * WorkspaceSwitcher — segmented control toggle between VVU STUDI and VVU IVE.
 * Sits in the top-right of the AppShell header. Persists choice via context.
 */

import { Check, GraduationCap, HardHat } from "lucide-react";
import { WORKSPACE_ORDER, WORKSPACES, useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace();

  return (
    <div
      role="tablist"
      aria-label="VVU workspace"
      className="inline-flex items-center rounded-md border border-border bg-card/60 p-0.5 text-xs font-mono"
    >
      {WORKSPACE_ORDER.map((id) => {
        const meta = WORKSPACES[id];
        const active = workspace === id;
        const Icon = id === "studi" ? GraduationCap : HardHat;
        const accent =
          id === "studi" ? "var(--vvu-studi)" : "var(--vvu-ive)";
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => setWorkspace(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
            style={
              active
                ? {
                    color: "oklch(0.145 0 0)",
                    backgroundColor: `var(${meta.accentVar})`,
                  }
                : undefined
            }
            title={`Switch to ${meta.full}`}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: active ? "oklch(0.145 0 0)" : accent }} />
            <span className="tracking-wider font-bold">{meta.name}</span>
            {active && <Check className="h-3 w-3 opacity-80" />}
          </button>
        );
      })}
    </div>
  );
}
