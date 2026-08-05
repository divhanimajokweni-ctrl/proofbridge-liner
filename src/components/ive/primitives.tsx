"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared IVE panel primitives.
 * Establishes the engineering-OS visual language: frosted surfaces, mono
 * telemetry labels, gold accents, subtle dividers. All panels compose
 * from these to guarantee visual consistency.
 */

export function PanelFrame({
  title,
  tag,
  accent,
  mission,
  children,
  actions,
  scroll = true,
}: {
  title: string;
  tag?: string;
  accent?: string;
  mission?: string;
  children: ReactNode;
  actions?: ReactNode;
  scroll?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {tag && (
              <span
                className="ive-mono rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `${accent ?? "#C9A84C"}40`,
                  background: `${accent ?? "#C9A84C"}10`,
                  color: accent ?? "#C9A84C",
                }}
              >
                {tag}
              </span>
            )}
            <h2 className="truncate font-sans text-base font-bold tracking-tight text-foreground sm:text-lg">
              {title}
            </h2>
          </div>
          {mission && (
            <p className="ive-mono mt-1 max-w-[640px] truncate text-[10.5px] text-muted-foreground">
              {mission}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("min-h-0 flex-1", scroll && "ive-scroll overflow-y-auto")}>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "#C9A84C",
  status,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
  status?: "ok" | "warn" | "error" | "pending";
}) {
  const statusColor =
    status === "ok"
      ? "var(--ive-proven)"
      : status === "warn"
        ? "#CC7722"
        : status === "error"
          ? "var(--ive-blocked)"
          : status === "pending"
            ? "var(--ive-pending)"
            : accent;
  return (
    <div className="ive-surface rounded-lg border border-white/[0.06] p-3.5">
      <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </div>
      <div
        className="mt-1.5 font-sans text-lg font-bold leading-tight"
        style={{ color: statusColor }}
      >
        {value}
      </div>
      {hint && (
        <div className="ive-mono mt-1 text-[9.5px] leading-relaxed text-muted-foreground/60">
          {hint}
        </div>
      )}
    </div>
  );
}

export function StatusPill({
  state,
  accent,
  pulse = false,
}: {
  state: string;
  accent?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className="ive-mono inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
      style={{
        borderColor: `${accent ?? "#8b949e"}40`,
        background: `${accent ?? "#8b949e"}10`,
        color: accent ?? "#8b949e",
      }}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", pulse && "ive-live-pulse")}
        style={{ background: accent ?? "#8b949e" }}
      />
      {state}
    </span>
  );
}

export function MonoTable({
  rows,
  cols,
}: {
  rows: Record<string, ReactNode>[];
  cols: { key: string; label: string; className?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {cols.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "ive-mono px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70",
                  c.className,
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={cn("ive-mono px-3 py-2 text-[11px] text-foreground/85", c.className)}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="ive-mono mb-2.5 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
      <span className="h-1 w-3 rounded-full bg-[var(--ive-gold)]/50" />
      {children}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ive-mono rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
      {children}
    </kbd>
  );
}
