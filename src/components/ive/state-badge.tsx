"use client";

import { cn } from "@/lib/utils";
import { VerificationState, stateColor } from "@/lib/eis";

const STATE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  green:   { bg: "bg-green-500/10",   text: "text-green-700 dark:text-green-300",   border: "border-green-500/30",   dot: "bg-green-500" },
  lime:    { bg: "bg-lime-500/10",    text: "text-lime-700 dark:text-lime-300",     border: "border-lime-500/30",    dot: "bg-lime-500" },
  amber:   { bg: "bg-amber-500/15",   text: "text-amber-800 dark:text-amber-200",   border: "border-amber-500/30",   dot: "bg-amber-500" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-700 dark:text-orange-300", border: "border-orange-500/30", dot: "bg-orange-500" },
  zinc:    { bg: "bg-zinc-500/15",    text: "text-zinc-800 dark:text-zinc-200",     border: "border-zinc-500/30",    dot: "bg-zinc-500" },
  slate:   { bg: "bg-slate-500/10",   text: "text-slate-700 dark:text-slate-300",   border: "border-slate-500/30",   dot: "bg-slate-500" },
  stone:   { bg: "bg-stone-500/10",   text: "text-stone-700 dark:text-stone-300",   border: "border-stone-500/30",   dot: "bg-stone-500" },
  cyan:    { bg: "bg-cyan-500/15",    text: "text-cyan-800 dark:text-cyan-200",     border: "border-cyan-500/30",    dot: "bg-cyan-500" },
  red:     { bg: "bg-red-500/10",     text: "text-red-700 dark:text-red-300",       border: "border-red-500/30",     dot: "bg-red-500" },
};

interface StateBadgeProps {
  state: VerificationState;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StateBadge({ state, size = "md", className }: StateBadgeProps) {
  const colorName = stateColor(state);
  const c = STATE_COLORS[colorName] ?? STATE_COLORS.zinc;
  const sizeCls =
    size === "sm" ? "text-[10px] px-2 py-0.5" :
    size === "lg" ? "text-sm px-3 py-1.5" :
    "text-xs px-2.5 py-1";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wide",
        c.bg, c.text, c.border, sizeCls, className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {state}
    </span>
  );
}
