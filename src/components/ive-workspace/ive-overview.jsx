"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { IveClaimInjector } from "@/components/ive-workspace/ive-claim-injector";
import { cn } from "@/lib/utils";
import {
  Activity,
  Box,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  ShieldCheck,
  Workflow
} from "lucide-react";
const WORKFLOW_STEPS = [
  { label: "Procedural CAD", icon: Box },
  { label: "AI-assisted Specification", icon: Layers },
  { label: "Proof Obligation Generation", icon: GitBranch },
  { label: "SMT Verification", icon: CheckCircle2 },
  { label: "Evidence Runtime", icon: Database },
  { label: "Ledger + Provenance", icon: ShieldCheck },
  { label: "Engineering Release Decision", icon: Workflow }
];
const SYSTEM_MAP = [
  {
    section: "CORE",
    items: [
      { name: "IVE Overview", abbr: "OV", status: "READY" },
      { name: "Trust Sphere", abbr: "TS", status: "READY" },
      { name: "Claims Pipeline", abbr: "CP", status: "READY" },
      { name: "Evidence Runtime", abbr: "ER", status: "READY" }
    ]
  },
  {
    section: "RELEASE",
    items: [
      { name: "Release Report", abbr: "RR", status: "GO" },
      { name: "Adapter Attribution", abbr: "ADP", status: "5/6" },
      { name: "Integrity Closure", abbr: "INT", status: "WRAPPED" },
      { name: "Acceptance", abbr: "ACC", status: "BLOCKED" },
      { name: "Identity Registry", abbr: "IDR", status: "READY" }
    ]
  },
  {
    section: "RUNTIME",
    items: [
      { name: "Plugin Registry", abbr: "PR", status: "3 run" },
      { name: "AMD Runtime", abbr: "AMD", status: "RUNNING" },
      { name: "Zoo Runtime", abbr: "ZOO", status: "RUNNING" }
    ]
  },
  {
    section: "CASE STUDY",
    items: [
      { name: "HBK Workspace", abbr: "HBA", status: "DEMO" },
      { name: "CAD Viewer", abbr: "CAD", status: "READY" }
    ]
  },
  {
    section: "SYSTEM",
    items: [
      { name: "Webhook Delivery", abbr: "WH", status: "READY \xB7 v1.1" },
      { name: "Help & FAQ", abbr: "FAQ", status: "READY" }
    ]
  }
];
function IveOverview({ onNavigate }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden border-vvu-ive/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-ive)_8%,card)]", children: [
      /* @__PURE__ */ jsx(EvolutionMatrix, { mode: "hero", dataDriven: true, stageRange: [2, 3] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-none absolute inset-0 z-[1]",
          style: {
            background: "linear-gradient(90deg, rgba(15,12,12,0.88) 0%, rgba(15,12,12,0.58) 55%, rgba(15,12,12,0.18) 100%)"
          }
        }
      ),
      /* @__PURE__ */ jsx(CardContent, { className: "relative z-[2] p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-start md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsxs(
            Badge,
            {
              className: "mb-3 font-mono uppercase tracking-wider",
              variant: "outline",
              children: [
                /* @__PURE__ */ jsx(Layers, { className: "mr-1 h-3 w-3" }),
                "VVU \xB7 IVE"
              ]
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-tight tracking-tight md:text-3xl", children: "Engineer systems that can prove themselves." }),
          /* @__PURE__ */ jsxs("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: [
            "IVE combines procedural CAD, AI-assisted specification, and formal verification to give every engineering decision an auditable proof. Every claim passes through",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: "Claim \u2192 Evidence \u2192 Verification \u2192 Authorization \u2192 Action" }),
            " ",
            "\u2014 bound by the Evidence Independence Specification and held to fail-closed operation by Theorem 5."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 md:w-64", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-red-400", children: "Engineering release" }),
            /* @__PURE__ */ jsx("div", { className: "mt-0.5 font-mono text-sm font-bold uppercase tracking-wider text-red-400", children: "BLOCKED" }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "STUDI gates not yet met" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-amber-400", children: "MO-GO \xB7 freeze defined" }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: "Bootstrap: OK \xB7 Day-7 gate" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(IveClaimInjector, {}),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "Core workflow" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 text-[10px] font-mono", children: WORKFLOW_STEPS.map((step, i, arr) => {
        const Icon = step.icon;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1.5", children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3 text-vvu-ive", style: { color: "var(--vvu-ive)" } }),
            /* @__PURE__ */ jsx("span", { children: step.label })
          ] }),
          i < arr.length - 1 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\u2192" })
        ] }, step.label);
      }) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
      { label: "Trust dimensions", value: "3 / 6", icon: ShieldCheck, tone: "amber" },
      { label: "Proof obligations", value: "0 / 0", icon: CheckCircle2, tone: "muted" },
      { label: "Hardware", value: "ROCm", icon: Cpu, tone: "muted" },
      { label: "Run ID", value: "ive-20260818", icon: Activity, tone: "ive" }
    ].map((m) => {
      const Icon = m.icon;
      const tone = m.tone === "amber" ? "text-amber-400" : m.tone === "ive" ? "text-vvu-ive" : "text-foreground";
      return /* @__PURE__ */ jsx(Card, { className: "border-border/70", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
          m.label
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("mt-1 font-mono text-lg font-bold", tone), children: m.value })
      ] }) }, m.label);
    }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "System map" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-5", children: SYSTEM_MAP.map((group) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70", children: group.section }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1", children: group.items.map((item) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onNavigate == null ? void 0 : onNavigate(
              `ive-${item.abbr === "OV" ? "overview" : item.abbr === "TS" ? "trust-sphere" : item.abbr === "CP" ? "claims" : item.abbr === "ER" ? "evidence-runtime" : item.abbr === "PR" ? "plugins" : item.abbr === "WH" ? "webhook" : "overview"}`
            ),
            className: "flex w-full items-center justify-between rounded border border-border/70 bg-card/40 px-2 py-1.5 text-[11px] hover:bg-accent/40",
            children: [
              /* @__PURE__ */ jsx("span", { className: "truncate text-foreground/80", children: item.name }),
              /* @__PURE__ */ jsx("span", { className: "ml-2 shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground", children: item.status })
            ]
          },
          item.abbr
        )) })
      ] }, group.section)) }) })
    ] })
  ] });
}
export {
  IveOverview
};
