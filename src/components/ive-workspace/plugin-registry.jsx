"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Cpu,
  Github,
  Plug,
  Webhook
} from "lucide-react";
const DEFAULT_PLUGINS = [
  {
    id: "amd-rocm",
    name: "AMD ROCm Runtime",
    vendor: "AMD \xB7 ROCm 6.4",
    version: "v1.4.2",
    state: "Running",
    category: "Compute",
    description: "GPU compute runtime for SMT solving + heat-kernel diffusion. Exposes MI300X devices to the Evidence Runtime.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: Cpu
  },
  {
    id: "zoo-engine",
    name: "Zoo Engine",
    vendor: "VVU \xB7 internal",
    version: "v0.9.0",
    state: "Running",
    category: "Runtime",
    description: "AI-assisted specification runtime \u2014 turns natural-language claims into proof obligations.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: CircuitBoard
  },
  {
    id: "github-adapter",
    name: "GitHub Adapter",
    vendor: "GitHub Inc.",
    version: "v0.4.1",
    state: "Activate",
    category: "Adapter",
    description: "Pulls commit + CI evidence into the Evidence Mesh. OAuth scope limited to read-only.",
    lifecycle: { stage: "Activated", progress: 60 },
    icon: Github
  }
];
function stateVisual(state) {
  switch (state) {
    case "Running":
      return {
        color: "text-emerald-400",
        border: "border-emerald-500/30 bg-emerald-500/5",
        icon: CheckCircle2
      };
    case "Activate":
      return {
        color: "text-amber-400",
        border: "border-amber-500/30 bg-amber-500/5",
        icon: Clock
      };
    case "Not Installed":
      return {
        color: "text-muted-foreground",
        border: "border-border bg-muted/20",
        icon: Plug
      };
    case "Error":
      return {
        color: "text-red-400",
        border: "border-red-500/30 bg-red-500/5",
        icon: Activity
      };
  }
}
function PluginRegistry({
  onSelectPlugin,
  webhookStats
}) {
  const webhookPlugin = {
    id: "webhook-subsystem",
    name: "Webhook Delivery Subsystem",
    vendor: "VVU \xB7 Reliability Contract v1.1",
    version: "v1.1.0",
    state: "Running",
    category: "Reliability",
    description: "Per-webhook Kafka partitioned delivery with circuit breaker, retry budget, DLQ, and idempotency. Locked Aug 18, launch Sept 15.",
    lifecycle: { stage: "Running", progress: 100 },
    icon: Webhook,
    pillars: ["Kafka 12P", "CB 10/300s", "Retry 4\xD7", "DLQ 30d", "Idempotent"],
    metrics: webhookStats ? [
      {
        label: "Webhooks",
        value: `${webhookStats.activeWebhooks}/${webhookStats.totalWebhooks}`,
        tone: webhookStats.totalWebhooks === 0 ? "warn" : "ok"
      },
      {
        label: "Open CBs",
        value: String(webhookStats.openBreakers),
        tone: webhookStats.openBreakers > 0 ? "danger" : "ok"
      },
      {
        label: "DLQ depth",
        value: String(webhookStats.dlqDepth),
        tone: webhookStats.dlqDepth > 0 ? "warn" : "ok"
      },
      {
        label: "Success 24h",
        value: webhookStats.successRate == null ? "\u2014" : `${(webhookStats.successRate * 100).toFixed(1)}%`,
        tone: webhookStats.successRate == null ? "warn" : webhookStats.successRate >= 0.99 ? "ok" : webhookStats.successRate >= 0.9 ? "warn" : "danger"
      }
    ] : [
      { label: "Webhooks", value: "\u2014", tone: "warn" },
      { label: "Open CBs", value: "\u2014", tone: "warn" },
      { label: "DLQ depth", value: "\u2014", tone: "warn" },
      { label: "Success 24h", value: "\u2014", tone: "warn" }
    ]
  };
  const allPlugins = [webhookPlugin, ...DEFAULT_PLUGINS];
  const counts = allPlugins.reduce(
    (acc, p) => {
      var _a;
      acc[p.state] = ((_a = acc[p.state]) != null ? _a : 0) + 1;
      return acc;
    },
    {}
  );
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Plugin Registry" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Registered runtime plugins + adapters. Lifecycle states follow the IVE plugin state machine." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: ["Running", "Activate", "Not Installed", "Error"].map((s) => {
      var _a;
      const v = stateVisual(s);
      const Icon = v.icon;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn("rounded-md border p-2.5", v.border),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx(Icon, { className: cn("h-3 w-3", v.color) }),
              s
            ] }),
            /* @__PURE__ */ jsx("div", { className: cn("mt-1 font-mono text-lg font-bold", v.color), children: (_a = counts[s]) != null ? _a : 0 })
          ]
        },
        s
      );
    }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wider", children: "Integration type:" }),
      ["Compute", "Runtime", "Adapter", "Reliability"].map((c) => /* @__PURE__ */ jsx(
        "span",
        {
          className: "rounded border border-border bg-card/40 px-1.5 py-0.5",
          children: c
        },
        c
      ))
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: allPlugins.map((p) => {
      const v = stateVisual(p.state);
      const Icon = p.icon;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onSelectPlugin == null ? void 0 : onSelectPlugin(p.id),
          className: cn(
            "group relative flex flex-col rounded-md border bg-card/60 p-3 text-left transition-colors hover:bg-accent/40",
            v.border,
            p.id === "webhook-subsystem" && "ring-1 ring-vvu-ive/40"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-background/60", children: /* @__PURE__ */ jsx(
                  Icon,
                  {
                    className: cn(
                      "h-4 w-4",
                      p.id === "webhook-subsystem" ? "text-vvu-ive" : "text-muted-foreground"
                    ),
                    style: p.id === "webhook-subsystem" ? { color: "var(--vvu-ive)" } : void 0
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold leading-tight", children: p.name }),
                  /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: p.vendor })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: cn("font-mono text-[9px] uppercase tracking-wider", v.color),
                  children: p.state
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-[11px] leading-relaxed text-muted-foreground", children: p.description }),
            p.pillars && /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: p.pillars.map((pillar) => /* @__PURE__ */ jsx(
              "span",
              {
                className: "rounded border border-vvu-ive/30 bg-vvu-ive/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                style: { color: "var(--vvu-ive)" },
                children: pillar
              },
              pillar
            )) }),
            p.metrics && p.metrics.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-2 gap-1.5", children: p.metrics.map((m) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "rounded border border-border/60 bg-background/40 px-1.5 py-1",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70", children: m.label }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "font-mono text-xs font-bold",
                        m.tone === "ok" ? "text-emerald-400" : m.tone === "warn" ? "text-amber-400" : m.tone === "danger" ? "text-red-400" : "text-foreground"
                      ),
                      children: m.value
                    }
                  )
                ]
              },
              m.label
            )) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: "Lifecycle" }),
                /* @__PURE__ */ jsx("span", { children: p.lifecycle.stage })
              ] }),
              /* @__PURE__ */ jsx(
                Progress,
                {
                  value: p.lifecycle.progress,
                  className: "h-1.5 bg-muted/40",
                  style: {
                    // @ts-expect-error CSS var — accent bar
                    "--progress-foreground": p.state === "Running" ? "var(--vvu-ive)" : p.state === "Activate" ? "oklch(0.74 0.18 65)" : "oklch(0.5 0 0)"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wider", children: p.category }),
              /* @__PURE__ */ jsx("span", { children: p.version })
            ] })
          ]
        },
        p.id
      );
    }) })
  ] });
}
export {
  PluginRegistry
};
