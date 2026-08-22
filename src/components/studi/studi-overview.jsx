"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { StudiGateEditor } from "@/components/studi/studi-gate-editor";
import {
  Building2,
  FileCheck2,
  Gavel,
  GraduationCap,
  ScrollText,
  ShieldCheck
} from "lucide-react";
function StudiOverview() {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden border-vvu-studi/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-studi)_8%,card)]", children: [
      /* @__PURE__ */ jsx(EvolutionMatrix, { mode: "hero", dataDriven: true, stageRange: [0, 1] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-none absolute inset-0 z-[1]",
          style: {
            background: "linear-gradient(90deg, rgba(15,15,20,0.85) 0%, rgba(15,15,20,0.55) 50%, rgba(15,15,20,0.15) 100%)"
          }
        }
      ),
      /* @__PURE__ */ jsx(CardContent, { className: "relative z-[2] p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsxs(
            Badge,
            {
              className: "mb-3 font-mono uppercase tracking-wider",
              variant: "outline",
              children: [
                /* @__PURE__ */ jsx(GraduationCap, { className: "mr-1 h-3 w-3" }),
                "VVU \xB7 STUDI"
              ]
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-tight tracking-tight md:text-3xl", children: "Govern the institution that governs the engineering." }),
          /* @__PURE__ */ jsxs("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: [
            "VVU STUDI is the corporate-governance and academic-instruction workspace. It binds every engineering claim made in IVE back to a governing document, a charter clause, and a board resolution \u2014 so that release decisions are not only technically correct but",
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: " legally defensible" }),
            ". The same Evidence Independence Specification that powers IVE runs underneath STUDI; the bound is just a different shape: \u201CClaim \u2264 Document \u2264 Resolution \u2264 Filing \u2264 Compliance\u201D."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 md:w-64", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-vvu-studi/30 bg-card/70 p-3 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "STUDI status" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline gap-2", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "text-xs font-bold uppercase tracking-wider",
                  style: { color: "var(--vvu-studi)" },
                  children: "MO-GO"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "\xB7 freeze defined" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/70 p-3 text-[11px] font-mono backdrop-blur-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Charter" }),
              /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "DRAFT" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "MOI" }),
              /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "DRAFT" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "SHA" }),
              /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "PENDING" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "CIPC" }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "NOT FILED" })
            ] })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(StudiGateEditor, {}),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
      {
        icon: Gavel,
        label: "Legal",
        desc: "Charter, MOI, SHA reviewed & resolved",
        state: "0 / 3",
        tone: "amber"
      },
      {
        icon: FileCheck2,
        label: "Compliance",
        desc: "CIPC filing, SARS tax clearance, BBBEE",
        state: "0 / 5",
        tone: "red"
      },
      {
        icon: ScrollText,
        label: "Provenance",
        desc: "Document hash chain + signature ledger",
        state: "0 / 1",
        tone: "amber"
      },
      {
        icon: Building2,
        label: "Corporate",
        desc: "Director registry + share register + bank",
        state: "0 / 4",
        tone: "red"
      }
    ].map((dim) => {
      const Icon = dim.icon;
      const tone = dim.tone === "amber" ? "text-amber-400" : dim.tone === "red" ? "text-red-400" : "text-emerald-400";
      return /* @__PURE__ */ jsxs(Card, { className: "border-border/70", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }),
            dim.label
          ] }),
          /* @__PURE__ */ jsx("span", { className: `font-mono text-xs font-bold ${tone}`, children: dim.state })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] leading-relaxed text-muted-foreground", children: dim.desc }) })
      ] }, dim.label);
    }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "Corporate governance workflow" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 text-[10px] font-mono", children: [
        "Charter Draft",
        "Director Resolution",
        "MOI Filed (CIPC)",
        "Shareholders Agreement",
        "Trust Deed",
        "Bank Signatory Update",
        "Compliance Pack",
        "Annual Filing"
      ].map((step, i, arr) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/60 px-2 py-1.5 text-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/70", children: String(i + 1).padStart(2, "0") }),
          " ",
          step
        ] }),
        i < arr.length - 1 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\u2192" })
      ] }, step)) }) })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "border-vvu-studi/40", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-start gap-3 p-4", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5 text-vvu-studi shrink-0 mt-0.5", style: { color: "var(--vvu-studi)" } }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs leading-relaxed", children: [
        /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "STUDI is fail-closed by EIS Theorem 5." }),
        " ",
        "Until every required governing document is ",
        /* @__PURE__ */ jsx("em", { children: "resolved" }),
        " (not just present) and cross-referenced into the document certification seal, the engineering release in IVE stays",
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-red-400 font-mono", children: "BLOCKED" }),
        ". The two workspaces are not decorative \u2014 they are the two halves of a single fail-closed valve."
      ] })
    ] }) })
  ] });
}
export {
  StudiOverview
};
