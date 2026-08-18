"use client";

/**
 * PluginRegistry — grid of registered plugins in the IVE workspace.
 *
 * The Webhook Subsystem is registered here as a plugin (v1.1, Running)
 * alongside AMD ROCm, Zoo Engine, and GitHub adapter. Clicking a plugin
 * card opens the plugin's detail view (or shows inline).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Cpu,
  GitBranch,
  Github,
  Layers,
  Lock,
  Plug,
  RefreshCw,
  Webhook,
} from "lucide-react";

export type PluginState = "Running" | "Activate" | "Not Installed" | "Error";

export interface PluginEntry {
  id: string;
  name: string;
  vendor: string;
  version: string;
  state: PluginState;
  category: "Runtime" | "Adapter" | "Reliability" | "Compute";
  description: string;
  /** Lifecycle state machine — 0..100 progress */
  lifecycle: {
    stage: "Init" | "Registered" | "Activated" | "Running" | "Paused" | "Failed";
    progress: number;
  };
  /** For the webhook subsystem: live metrics from the dashboard widget */
  metrics?: {
    label: string;
    value: string;
    tone?: "ok" | "warn" | "danger";
  }[];
  /** Pillar badges — only the webhook subsystem has these */
  pillars?: string[];
  icon: LucideIcon;
}

interface PluginRegistryProps {
  /** Called when a plugin card is clicked (e.g. to open its detail view). */
  onSelectPlugin?: (pluginId: string) => void;
  /** Optional live webhook stats to surface in the webhook plugin card. */
  webhookStats?: {
    totalWebhooks: number;
    activeWebhooks: number;
    openBreakers: number;
    dlqDepth: number;
    successRate: number | null;
  } | null;
}

const DEFAULT_PLUGINS: Omit<PluginEntry, "metrics">[] = [
  {
    id: "amd-rocm",
    name: "AMD ROCm Runtime",
    vendor: "AMD · ROCm 6.4",
    version: "v1.4.2",
    state: "Running",
    category: "Compute",
    description:
      "GPU compute runtime for SMT solving + heat-kernel diffusion. Exposes MI300X devices to the Evidence Runtime.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: Cpu,
  },
  {
    id: "zoo-engine",
    name: "Zoo Engine",
    vendor: "VVU · internal",
    version: "v0.9.0",
    state: "Running",
    category: "Runtime",
    description:
      "AI-assisted specification runtime — turns natural-language claims into proof obligations.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: CircuitBoard,
  },
  {
    id: "github-adapter",
    name: "GitHub Adapter",
    vendor: "GitHub Inc.",
    version: "v0.4.1",
    state: "Activate",
    category: "Adapter",
    description:
      "Pulls commit + CI evidence into the Evidence Mesh. OAuth scope limited to read-only.",
    lifecycle: { stage: "Activated", progress: 60 },
    icon: Github,
  },
];

function stateVisual(state: PluginState) {
  switch (state) {
    case "Running":
      return {
        color: "text-emerald-400",
        border: "border-emerald-500/30 bg-emerald-500/5",
        icon: CheckCircle2,
      };
    case "Activate":
      return {
        color: "text-amber-400",
        border: "border-amber-500/30 bg-amber-500/5",
        icon: Clock,
      };
    case "Not Installed":
      return {
        color: "text-muted-foreground",
        border: "border-border bg-muted/20",
        icon: Plug,
      };
    case "Error":
      return {
        color: "text-red-400",
        border: "border-red-500/30 bg-red-500/5",
        icon: Activity,
      };
  }
}

export function PluginRegistry({
  onSelectPlugin,
  webhookStats,
}: PluginRegistryProps) {
  // Compose the webhook plugin entry — pulls in live stats if available.
  const webhookPlugin: PluginEntry = {
    id: "webhook-subsystem",
    name: "Webhook Delivery Subsystem",
    vendor: "VVU · Reliability Contract v1.1",
    version: "v1.1.0",
    state: "Running",
    category: "Reliability",
    description:
      "Per-webhook Kafka partitioned delivery with circuit breaker, retry budget, DLQ, and idempotency. Locked Aug 18, launch Sept 15.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: Webhook,
    pillars: ["Kafka 12P", "CB 10/300s", "Retry 4×", "DLQ 30d", "Idempotent"],
    metrics: webhookStats
      ? [
          {
            label: "Webhooks",
            value: `${webhookStats.activeWebhooks}/${webhookStats.totalWebhooks}`,
            tone: webhookStats.totalWebhooks === 0 ? "warn" : "ok",
          },
          {
            label: "Open CBs",
            value: String(webhookStats.openBreakers),
            tone:
              webhookStats.openBreakers > 0
                ? "danger"
                : "ok",
          },
          {
            label: "DLQ depth",
            value: String(webhookStats.dlqDepth),
            tone:
              webhookStats.dlqDepth > 0
                ? "warn"
                : "ok",
          },
          {
            label: "Success 24h",
            value: webhookStats.successRate == null
              ? "—"
              : `${(webhookStats.successRate * 100).toFixed(1)}%`,
            tone:
              webhookStats.successRate == null
                ? "warn"
                : webhookStats.successRate >= 0.99
                  ? "ok"
                  : webhookStats.successRate >= 0.9
                    ? "warn"
                    : "danger",
          },
        ]
      : [
          { label: "Webhooks", value: "—", tone: "warn" as const },
          { label: "Open CBs", value: "—", tone: "warn" as const },
          { label: "DLQ depth", value: "—", tone: "warn" as const },
          { label: "Success 24h", value: "—", tone: "warn" as const },
        ],
  };

  const allPlugins: PluginEntry[] = [webhookPlugin, ...DEFAULT_PLUGINS];

  const counts = allPlugins.reduce(
    (acc, p) => {
      acc[p.state] = (acc[p.state] ?? 0) + 1;
      return acc;
    },
    {} as Record<PluginState, number>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Plugin Registry</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Registered runtime plugins + adapters. Lifecycle states follow the
            IVE plugin state machine.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["Running", "Activate", "Not Installed", "Error"] as PluginState[]).map((s) => {
          const v = stateVisual(s);
          const Icon = v.icon;
          return (
            <div
              key={s}
              className={cn("rounded-md border p-2.5", v.border)}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                <Icon className={cn("h-3 w-3", v.color)} />
                {s}
              </div>
              <div className={cn("mt-1 font-mono text-lg font-bold", v.color)}>
                {counts[s] ?? 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="uppercase tracking-wider">Integration type:</span>
            {(["Compute", "Runtime", "Adapter", "Reliability"] as const).map((c) => (
              <span
                key={c}
                className="rounded border border-border bg-card/40 px-1.5 py-0.5"
              >
                {c}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plugin cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allPlugins.map((p) => {
          const v = stateVisual(p.state);
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlugin?.(p.id)}
              className={cn(
                "group relative flex flex-col rounded-md border bg-card/60 p-3 text-left transition-colors hover:bg-accent/40",
                v.border,
                p.id === "webhook-subsystem" && "ring-1 ring-vvu-ive/40"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/60">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        p.id === "webhook-subsystem"
                          ? "text-vvu-ive"
                          : "text-muted-foreground"
                      )}
                      style={
                        p.id === "webhook-subsystem"
                          ? { color: "var(--vvu-ive)" }
                          : undefined
                      }
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">
                      {p.name}
                    </h3>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {p.vendor}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("font-mono text-[9px] uppercase tracking-wider", v.color)}
                >
                  {p.state}
                </Badge>
              </div>

              {/* Description */}
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>

              {/* Pillars (webhook only) */}
              {p.pillars && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.pillars.map((pillar) => (
                    <span
                      key={pillar}
                      className="rounded border border-vvu-ive/30 bg-vvu-ive/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: "var(--vvu-ive)" }}
                    >
                      {pillar}
                    </span>
                  ))}
                </div>
              )}

              {/* Metrics (webhook only, when stats available) */}
              {p.metrics && p.metrics.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {p.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded border border-border/60 bg-background/40 px-1.5 py-1"
                    >
                      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                        {m.label}
                      </div>
                      <div
                        className={cn(
                          "font-mono text-xs font-bold",
                          m.tone === "ok"
                            ? "text-emerald-400"
                            : m.tone === "warn"
                              ? "text-amber-400"
                              : m.tone === "danger"
                                ? "text-red-400"
                                : "text-foreground"
                        )}
                      >
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lifecycle */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span>Lifecycle</span>
                  <span>{p.lifecycle.stage}</span>
                </div>
                <Progress
                  value={p.lifecycle.progress}
                  className="h-1.5 bg-muted/40"
                  style={{
                    // @ts-expect-error CSS var — accent bar
                    "--progress-foreground":
                      p.state === "Running"
                        ? "var(--vvu-ive)"
                        : p.state === "Activate"
                          ? "oklch(0.74 0.18 65)"
                          : "oklch(0.5 0 0)",
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span className="uppercase tracking-wider">{p.category}</span>
                <span>{p.version}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
