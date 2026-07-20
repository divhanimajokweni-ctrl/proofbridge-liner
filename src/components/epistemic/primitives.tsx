"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, ShieldOff, Circle } from "lucide-react";
import type { ShardStatus, Severity, MergeStatus } from "@/lib/types";

/* ─── Gradient-border card wrapper ─── */
export function GradientBorderCard({
  children,
  className,
  gradientFrom,
  gradientTo,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
} & React.ComponentPropsWithoutRef<typeof Card>) {
  return (
    <div
      className={cn("relative rounded-lg p-[1px]", className)}
      style={{
        background: `linear-gradient(135deg, ${gradientFrom ?? "oklch(0.78 0.16 160 / 0.25)"}, ${gradientTo ?? "oklch(0.32 0.014 165 / 0.15)"})`,
      }}
    >
      <Card className="bg-card border-0 rounded-[7px] h-full" {...props}>
        {children}
      </Card>
    </div>
  );
}

/* ─── Shared framer-motion variants ─── */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};
export const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

/* ─── Shared recharts tooltip style ─── */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  background: "oklch(0.205 0.014 168)",
  border: "1px solid oklch(0.32 0.014 165 / 0.6)",
  borderRadius: "6px",
  fontSize: "10px",
  fontFamily: "var(--font-geist-mono)",
  color: "oklch(0.96 0.01 150)",
};

/* ─── Shared time formatter ─── */
export function fmtTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Shared value formatter ─── */
export function fmtVal(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ─── Section header ─── */
export function SectionHeader({ icon: Icon, title, subtitle, iconClass = "border-quarantined/30 bg-quarantined/10 text-quarantined" }: {
  icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", iconClass)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Divergence color helper ─── */
export function divColor(v: number): string {
  return v < 0.001 ? "text-verified" : v < 1 ? "text-repairing" : "text-violating";
}
export function divGrad(from?: string): string {
  return from ?? "oklch(0.80 0.15 80 / 0.3)";
}

/* ─── Top accent bar (gradient line at top of cards) ─── */
export function TopAccentBar({ color = "oklch(0.78 0.16 160)", className }: { color?: string; className?: string }) {
  return <div className={cn("absolute top-0 left-0 right-0 h-[2px]", className)} style={{ background: `linear-gradient(to right, ${color}00, ${color}80, ${color}00)` }} />;
}

/* ─── Grid overlay (bg-grid-fine pattern) ─── */
export function GridOverlay({ opacity = "opacity-20", className }: { opacity?: string; className?: string }) {
  return <div className={cn("bg-grid-fine absolute inset-0 pointer-events-none", opacity, className)} />;
}

/* ─── Severity dot (small colored circle) ─── */
export function SeverityDot({ severity, className }: { severity: string; className?: string }) {
  const color = severity === "critical" ? "bg-violating" : severity === "high" ? "bg-repairing" : severity === "medium" ? "bg-quarantined" : "bg-muted-foreground";
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color, className)} />;
}

/* ─── Severity→accent classes ─── */
export const SEVERITY_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: "text-violating", bg: "bg-violating/10", border: "border-violating/30" },
  high: { text: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/30" },
  medium: { text: "text-quarantined", bg: "bg-quarantined/10", border: "border-quarantined/30" },
  low: { text: "text-muted-foreground", bg: "bg-muted", border: "border-border/60" },
};

/* ─── CSV escape utility ─── */
export function csvEscape(s: string): string {
  return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* ─── StatusDot ─── */
export function StatusDot({ status, className }: { status: ShardStatus | "verified" | "violating" | "repairing" | "quarantined" | "idle"; className?: string }) {
  const map: Record<string, { color: string; pulse: boolean }> = {
    healthy: { color: "bg-[var(--verified)]", pulse: false },
    verified: { color: "bg-[var(--verified)]", pulse: false },
    repairing: { color: "bg-[var(--repairing)]", pulse: true },
    violating: { color: "bg-[var(--violating)]", pulse: true },
    quarantined: { color: "bg-[var(--quarantined)]", pulse: false },
    idle: { color: "bg-muted-foreground", pulse: false },
  };
  const { color, pulse } = map[status] ?? map.idle;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)}>
        {pulse && <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-epistemic-pulse", color)} />}
      </span>
    </span>
  );
}

/* ─── StatusPill ─── */
export function StatusPill({ status, label, className }: {
  status: ShardStatus | MergeStatus | "verified" | "violating" | "repairing" | "quarantined" | "idle" | "applied" | "rejected" | "pending"; label?: string; className?: string;
}) {
  const config: Record<string, { color: string; text: string; icon: typeof CheckCircle2; defaultLabel: string }> = {
    healthy: { color: "border-verified/30 bg-verified/10", text: "text-verified", icon: CheckCircle2, defaultLabel: "Healthy" },
    verified: { color: "border-verified/30 bg-verified/10", text: "text-verified", icon: CheckCircle2, defaultLabel: "Verified" },
    applied: { color: "border-verified/30 bg-verified/10", text: "text-verified", icon: CheckCircle2, defaultLabel: "Applied" },
    repairing: { color: "border-repairing/30 bg-repairing/10", text: "text-repairing", icon: AlertTriangle, defaultLabel: "Repairing" },
    pending: { color: "border-repairing/30 bg-repairing/10", text: "text-repairing", icon: Circle, defaultLabel: "Pending" },
    violating: { color: "border-violating/30 bg-violating/10", text: "text-violating", icon: XCircle, defaultLabel: "Violating" },
    rejected: { color: "border-violating/30 bg-violating/10", text: "text-violating", icon: XCircle, defaultLabel: "Rejected" },
    quarantined: { color: "border-quarantined/30 bg-quarantined/10", text: "text-quarantined", icon: ShieldOff, defaultLabel: "Quarantined" },
    idle: { color: "border-border bg-muted", text: "text-muted-foreground", icon: Circle, defaultLabel: "Idle" },
  };
  const c = config[status] ?? config.idle;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", c.color, c.text, className)}>
      <Icon className="h-3 w-3" />{label ?? c.defaultLabel}
    </span>
  );
}

/* ─── SeverityBadge ─── */
export function SeverityBadge({ severity, soft }: { severity: Severity; soft?: boolean }) {
  const map: Record<Severity, string> = {
    critical: "border-violating/40 bg-violating/10 text-violating",
    high: "border-repairing/40 bg-repairing/10 text-repairing",
    medium: "border-quarantined/40 bg-quarantined/10 text-quarantined",
    low: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", map[severity])}>
      {severity}{soft && <span className="opacity-70">·soft</span>}
    </span>
  );
}

/* ─── Hash ─── */
export function Hash({ value, length = 10, className }: { value: string; length?: number; className?: string }) {
  const display = value.length > length ? `${value.slice(0, length)}…` : value;
  return <span className={cn("font-mono text-xs text-muted-foreground", className)} title={value}>{display}</span>;
}

/* ─── Accent-border card ─── */
export function AccentBorderCard({ children, className, accentBorder, ...props }: {
  children: React.ReactNode; className?: string; accentBorder: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div className={cn("relative rounded-lg p-px", className)} {...props}>
      <div className={cn("absolute inset-0 rounded-lg", accentBorder)} style={{ opacity: 0.7 }} />
      <div className="relative rounded-lg bg-card/80 backdrop-blur h-full">{children}</div>
    </div>
  );
}

/* ─── Stat card ─── */
export function StatCard({ label, value, color, bg, border }: {
  label: string; value: string | number; color?: string; bg?: string; border?: string;
}) {
  return (
    <div className={cn("rounded-md border px-2.5 py-2 text-center", bg ?? "bg-muted/20", border ?? "border-border/60")}>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-mono text-sm font-semibold", color ?? "text-foreground")}>{value}</div>
    </div>
  );
}
