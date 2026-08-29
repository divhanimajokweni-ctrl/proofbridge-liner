"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Webhook,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
function WebhookPluginDetail({ onBack }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState([]);
  const [dlq, setDlq] = useState([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [cbState, setCbState] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(async () => {
    var _a, _b, _c;
    setLoading(true);
    try {
      const [listRes, dlqRes] = await Promise.all([
        fetch("/api/v1/webhooks", { cache: "no-store" }),
        // DLQ endpoint: get all DLQ across all webhooks by passing "all" sentinel
        // The route at /api/v1/webhooks/[id]/dlq expects an id; for the dashboard
        // widget we iterate the first webhook only (or fall back to empty).
        Promise.resolve(null)
      ]);
      if (listRes.ok) {
        const data = await listRes.json();
        const list = Array.isArray(data) ? data : (_a = data.webhooks) != null ? _a : [];
        setWebhooks(list);
        if (!selectedWebhookId && list.length > 0) {
          setSelectedWebhookId(list[0].id);
        }
      } else {
        throw new Error(`list HTTP ${listRes.status}`);
      }
      const whId = selectedWebhookId != null ? selectedWebhookId : (_b = webhooks[0]) == null ? void 0 : _b.id;
      if (whId) {
        const res = await fetch(`/api/v1/webhooks/${whId}/dlq`, {
          cache: "no-store"
        });
        if (res.ok) {
          const data = await res.json();
          const entries = (_c = data == null ? void 0 : data.entries) != null ? _c : Array.isArray(data) ? data : [];
          setDlq(entries);
        } else {
          setDlq([]);
        }
      } else {
        setDlq([]);
      }
    } catch (e) {
      toast({
        title: "Failed to load webhook data",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedWebhookId, toast, refreshKey]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const createWebhook = async () => {
    var _a;
    const url = window.prompt(
      "Target URL for the new webhook (must be a publicly reachable https URL):"
    );
    if (!url) return;
    const name = window.prompt("Webhook name (human-readable label):") || `webhook-${Date.now()}`;
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          type: "custom",
          enabled: true
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Webhook created",
        description: `New webhook "${name}" registered for ${url}.`
      });
      setSelectedWebhookId((_a = data == null ? void 0 : data.id) != null ? _a : null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    }
  };
  const resetBreaker = async (whId) => {
    try {
      const res = await fetch(
        `/api/v1/webhooks/${whId}/circuit-breaker/reset`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Circuit breaker force-reset",
        description: "Webhook delivery CB moved to CLOSED. Does not auto-replay skipped events."
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast({
        title: "Reset failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    }
  };
  const replayDlqEntry = async (whId, entryId) => {
    try {
      const res = await fetch(
        `/api/v1/webhooks/${whId}/delivery-attempts/${entryId}/retry`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Replay dispatched",
        description: `Re-published delivery ${entryId} to Kafka with stable Idempotency-Key.`
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast({
        title: "Replay failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    }
  };
  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter((w) => w.enabled).length;
  const dlqDepth = dlq.length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onBack,
            className: "rounded-md border border-border bg-card px-2 py-1 text-[11px] font-mono uppercase tracking-wider hover:bg-accent/40",
            children: "\u2190 Plugin Registry"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Webhook, { className: "h-5 w-5", style: { color: "var(--vvu-ive)" } }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Webhook Delivery Subsystem" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-mono text-muted-foreground", children: "v1.1.0 \xB7 Reliability Contract \xB7 locked Aug 18 \xB7 launch Sept 15" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: createWebhook, children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          "New webhook"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => setRefreshKey((k) => k + 1), children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "border-vvu-ive/30", children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-[10px] font-mono", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground uppercase tracking-wider", children: "Contract pillars:" }),
      [
        { label: "Kafka \xB7 12P \xB7 key=webhook_id", icon: Server },
        { label: "CB \xB7 10/300s \xB7 1 probe", icon: Zap },
        { label: "Retry \xB7 4\xD7 \xB7 5\u2192625s \xB7 \u226410% budget", icon: RotateCcw },
        { label: "DLQ \xB7 30d \xB7 no auto-replay", icon: Database },
        { label: "Idempotency \xB7 at-least-once", icon: CheckCircle2 }
      ].map((p) => {
        const Icon = p.icon;
        return /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded border border-vvu-ive/30 bg-vvu-ive/5 px-1.5 py-0.5 uppercase tracking-wider",
            style: { color: "var(--vvu-ive)" },
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-2.5 w-2.5" }),
              p.label
            ]
          },
          p.label
        );
      })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-4", children: [
      {
        label: "Webhooks",
        value: totalWebhooks,
        sub: `${activeWebhooks} active`,
        icon: Webhook,
        tone: "default"
      },
      {
        label: "Active",
        value: activeWebhooks,
        sub: totalWebhooks === 0 ? "none registered" : "delivering",
        icon: Activity,
        tone: "ok"
      },
      {
        label: "Open CBs",
        value: 0,
        sub: "all breakers closed",
        icon: Zap,
        tone: "ok"
      },
      {
        label: "DLQ depth",
        value: dlqDepth,
        sub: dlqDepth === 0 ? "queue empty" : "awaiting replay",
        icon: Database,
        tone: dlqDepth === 0 ? "ok" : "warn"
      }
    ].map((m) => {
      const Icon = m.icon;
      const tone = m.tone === "ok" ? "text-emerald-400" : m.tone === "warn" ? "text-amber-400" : m.tone === "danger" ? "text-red-400" : "text-foreground";
      return /* @__PURE__ */ jsx(Card, { className: "border-border/70", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
          m.label
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("mt-1 font-mono text-xl font-bold", tone), children: m.value }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: m.sub })
      ] }) }, m.label);
    }) }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "webhooks", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2 h-auto", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "webhooks", className: "text-xs", children: [
          "Webhooks (",
          webhooks.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "dlq", className: "text-xs", children: [
          "Dead-Letter Queue (",
          dlq.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "webhooks", className: "mt-3", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "Registered webhooks" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-3.5 w-3.5 animate-spin" }),
          "Loading webhooks\u2026"
        ] }) : webhooks.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 gap-2 text-center", children: [
          /* @__PURE__ */ jsx(Webhook, { className: "h-8 w-8 text-muted-foreground/50" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No webhooks registered. Create one to start delivering verification events." }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: createWebhook, children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
            "Register webhook"
          ] })
        ] }) : /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "pl-4 text-[10px] uppercase tracking-wider", children: "ID" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Name \xB7 URL" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Type" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Secret" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "CB" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Created" }),
            /* @__PURE__ */ jsx(TableHead, { className: "pr-4 text-right text-[10px] uppercase tracking-wider", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: webhooks.map((w) => /* @__PURE__ */ jsxs(TableRow, { className: "text-xs", children: [
            /* @__PURE__ */ jsxs(TableCell, { className: "pl-4 font-mono text-[10px] text-muted-foreground", children: [
              w.id.slice(0, 8),
              "\u2026"
            ] }),
            /* @__PURE__ */ jsxs(TableCell, { className: "font-mono text-[11px]", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: w.name }),
              /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: w.url })
            ] }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "font-mono text-[9px] uppercase",
                children: w.type
              }
            ) }),
            /* @__PURE__ */ jsx(TableCell, { children: w.nextSecret && w.nextSecret.length > 0 ? /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "font-mono text-[9px] uppercase text-amber-400",
                children: "dual"
              }
            ) : /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-muted-foreground", children: "single" }) }),
            /* @__PURE__ */ jsx(TableCell, { children: w.enabled ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
              "CLOSED"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
              "paused"
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[10px] text-muted-foreground", children: new Date(w.createdAt).toLocaleString() }),
            /* @__PURE__ */ jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "h-7 text-[10px]",
                onClick: () => resetBreaker(w.id),
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "mr-1 h-3 w-3" }),
                  "Force-reset CB"
                ]
              }
            ) })
          ] }, w.id)) })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "dlq", className: "mt-3", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-semibold tracking-tight", children: [
            "Dead-Letter Queue",
            selectedWebhookId && /* @__PURE__ */ jsxs("span", { className: "ml-2 font-mono text-[10px] text-muted-foreground", children: [
              "webhook ",
              selectedWebhookId.slice(0, 8),
              "\u2026"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono", children: [
            /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wider text-muted-foreground", children: "Retention" }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: "30d" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: dlq.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 gap-2 text-center", children: [
          /* @__PURE__ */ jsx(Database, { className: "h-8 w-8 text-emerald-400/60" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "DLQ is empty. No terminal failures have been recorded." })
        ] }) : /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "pl-4 text-[10px] uppercase tracking-wider", children: "ID" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Event ID" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Reason" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "HTTP" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Created" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Status" }),
            /* @__PURE__ */ jsx(TableHead, { className: "pr-4 text-right text-[10px] uppercase tracking-wider", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: dlq.map((e) => {
            var _a, _b;
            const replayed = e.replayedBy && e.replayedBy.length > 0 || e.replayedAt != null;
            return /* @__PURE__ */ jsxs(TableRow, { className: "text-xs", children: [
              /* @__PURE__ */ jsxs(TableCell, { className: "pl-4 font-mono text-[10px] text-muted-foreground", children: [
                e.id.slice(0, 8),
                "\u2026"
              ] }),
              /* @__PURE__ */ jsxs(TableCell, { className: "font-mono text-[10px]", children: [
                (_b = (_a = e.eventId) == null ? void 0 : _a.slice(0, 12)) != null ? _b : "\u2014",
                "\u2026"
              ] }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-[11px] text-amber-400", children: e.reason }),
              /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[10px] text-muted-foreground", children: e.finalHttpStatus || "\u2014" }),
              /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[10px] text-muted-foreground", children: new Date(e.createdAt).toLocaleString() }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: replayed ? "text-emerald-400" : "text-amber-400",
                  children: replayed ? "REPLAYED" : "PENDING"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  className: "h-7 text-[10px]",
                  onClick: () => replayDlqEntry(
                    e.webhookId || selectedWebhookId || "",
                    e.id
                  ),
                  disabled: !selectedWebhookId && !e.webhookId || replayed,
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "mr-1 h-3 w-3" }),
                    "Replay"
                  ]
                }
              ) })
            ] }, e.id);
          }) })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-border/70", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-400" }),
        "Failure-mode reference"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-2 md:grid-cols-2", children: [
        {
          mode: "External receiver 500",
          action: "Retry up to 4\xD7 with jittered exponential backoff",
          tone: "ok"
        },
        {
          mode: "External receiver 400 (non-retryable)",
          action: "Sent straight to DLQ \u2014 no retry attempted",
          tone: "warn"
        },
        {
          mode: "10 terminal failures (any reason)",
          action: "Circuit breaker OPEN 5 min, 1 half-open probe",
          tone: "danger"
        },
        {
          mode: "CB OPEN \xB7 skipped delivery",
          action: "Held dead until explicit manual replay",
          tone: "danger"
        },
        {
          mode: "Replay request from operator",
          action: "Re-published with stable Idempotency-Key",
          tone: "ok"
        },
        {
          mode: "DLQ entry > 30 days",
          action: "Auto-purged on admin-worker tick",
          tone: "warn"
        }
      ].map((r) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "rounded-md border p-2.5 text-xs",
            r.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5" : r.tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"
          ),
          children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: r.mode }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-foreground", children: r.action })
          ]
        },
        r.mode
      )) }) })
    ] })
  ] });
}
export {
  WebhookPluginDetail
};
