"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Globe, Search, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
const SOURCE_META = {
  "you.com": { icon: Search, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  "brave": { icon: Globe, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
  "firecrawl": { icon: FileText, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  "watchdog": { icon: Activity, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10" }
};
function EvidenceMeshPanel({ evidence, onIngest, loading }) {
  const bySource = {};
  for (const e of evidence) {
    if (!bySource[e.source]) bySource[e.source] = [];
    bySource[e.source].push(e);
  }
  const sources = ["you.com", "brave", "firecrawl", "watchdog"];
  return /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight", children: "Evidence Mesh" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground font-mono mt-0.5", children: "E(c) = E_you \u222A E_brave \u222A E_firecrawl \u222A E_watchdog" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 4 \xA74" }),
        onIngest && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onIngest,
            disabled: loading,
            className: "rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-mono font-semibold hover:bg-muted transition-colors disabled:opacity-50",
            children: loading ? "..." : "Ingest"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: sources.map((src) => {
      var _a;
      const meta = SOURCE_META[src];
      const Icon = meta.icon;
      const items = (_a = bySource[src]) != null ? _a : [];
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "rounded-md border p-2.5 transition-colors",
            items.length > 0 ? "border-border bg-card" : "border-dashed border-border/60 bg-muted/30"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
              /* @__PURE__ */ jsx("div", { className: cn("rounded p-1", meta.bg), children: /* @__PURE__ */ jsx(Icon, { className: cn("h-3.5 w-3.5", meta.color) }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono font-semibold text-muted-foreground", children: items.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] font-mono font-semibold", children: src }),
            /* @__PURE__ */ jsx("div", { className: "mt-1.5 space-y-1", children: items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground italic", children: "no evidence" }) : items.slice(0, 2).map((e) => /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground leading-tight line-clamp-2", children: [
              e.content.slice(0, 70),
              e.content.length > 70 ? "\u2026" : ""
            ] }, e.id)) }),
            items.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("div", { className: "h-1 flex-1 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-emerald-500",
                  style: { width: `${Math.min(100, Math.max(0, items[0].weight * 100))}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-mono text-muted-foreground", children: [
                "w=",
                items[0].weight.toFixed(2)
              ] })
            ] })
          ]
        },
        src
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-800 dark:text-amber-200 font-mono leading-relaxed", children: "\u26A0 Multiple sources \u2260 independent. N_ind identifies true latent source count." }) })
  ] });
}
export {
  EvidenceMeshPanel
};
