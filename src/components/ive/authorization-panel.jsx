"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
const CONJUNCTS = [
  { key: "claimOk", label: "Claim", symbol: "C", description: "Claim state \u2265 SUPPORTED (auth threshold)" },
  { key: "evidenceOk", label: "Evidence", symbol: "E", description: "\u22652 distinct sources OR \u22653 evidence items" },
  { key: "integrityOk", label: "Integrity", symbol: "I", description: "N_ind \u2265 2 (safety-critical) or \u22651 (otherwise)" },
  { key: "safetyOk", label: "Safety", symbol: "S", description: "SafeGrid / SafeStacks clearance" },
  { key: "reviewOk", label: "Review", symbol: "R", description: "Second-reviewer signoff" }
];
function AuthorizationPanel({
  auth,
  safetyCritical,
  onAuthorize,
  loading
}) {
  return /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight", children: "Authorization" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground font-mono mt-0.5", children: "A = C \u2227 E \u2227 I \u2227 S \u2227 R" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 1, 4" })
    ] }),
    auth ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-2", children: CONJUNCTS.map(({ key, label, symbol, description }) => {
        const ok = auth[key];
        const required = key === "safetyOk" || key === "reviewOk" ? safetyCritical : true;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "rounded-md border p-2 text-center transition-colors",
              ok ? "border-emerald-500/40 bg-emerald-500/10" : required ? "border-red-500/40 bg-red-500/10" : "border-muted bg-muted/30 opacity-60"
            ),
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-1", children: ok ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-600 dark:text-emerald-400" }) : required ? /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 text-red-600 dark:text-red-400" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-muted-foreground" }) }),
              /* @__PURE__ */ jsx("div", { className: "font-mono text-base font-bold", children: symbol }),
              /* @__PURE__ */ jsx("div", { className: "text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5", children: label })
            ]
          },
          key
        );
      }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "mt-3 rounded-md border p-3 text-center",
            auth.authorized ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              auth.authorized ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-emerald-600 dark:text-emerald-400" }) : /* @__PURE__ */ jsx(ShieldAlert, { className: "h-5 w-5 text-red-600 dark:text-red-400" }),
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: cn(
                    "font-mono text-lg font-bold tracking-wider",
                    auth.authorized ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                  ),
                  children: [
                    "A = ",
                    auth.authorized ? "TRUE" : "FALSE"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-[11px] text-muted-foreground font-mono leading-relaxed", children: auth.reason })
          ]
        }
      ),
      safetyCritical && onAuthorize && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onAuthorize(true, false),
              disabled: loading,
              className: "flex-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50",
              children: "Approve Safety (S)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onAuthorize(false, true),
              disabled: loading,
              className: "flex-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50",
              children: "Sign Review (R)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onAuthorize(true, true),
              disabled: loading,
              className: "flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50",
              children: "Approve Both"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onAuthorize(false, false),
            disabled: loading,
            className: "rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-mono font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50",
            children: "Re-run (no overrides)"
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-xs text-muted-foreground font-mono", children: "No authorization record yet. Run /api/authorize to evaluate A = C \u2227 E \u2227 I \u2227 S \u2227 R." })
  ] });
}
export {
  AuthorizationPanel
};
