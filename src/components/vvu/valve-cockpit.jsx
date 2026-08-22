"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { StudiGateEditor } from "@/components/studi/studi-gate-editor";
import { IveClaimInjector } from "@/components/ive-workspace/ive-claim-injector";
import { useTheoremStore } from "@/lib/theorem/theorem-store";
import { stageForCockpit } from "@/lib/theorem/theorem-store";
import {
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Workflow
} from "lucide-react";
function verdictColor(v) {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}
function breakerColor(b) {
  return b === "TRIPPED" ? "#e74c3c" : "#10b981";
}
const STAGE_LABELS = [
  { id: 0, label: "0 \xB7 SPHERE", desc: "STUDI gates blocked \xB7 valve input not ready" },
  { id: 1, label: "1 \xB7 ANTONE", desc: "STUDI PROVEN \xB7 IVE waiting" },
  { id: 2, label: "2 \xB7 WEB-SPIDER", desc: "IVE INCONCLUSIVE \xB7 pulsing red if breaker tripped" },
  { id: 3, label: "3 \xB7 MILES", desc: "IVE PROVEN \xB7 full engineering release GO" }
];
function ValveCockpit() {
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const stage = useTheoremStore((s) => stageForCockpit(s));
  const combinedVerdict = studiVerdict !== "PROVEN" ? "UNKNOWN" : iveVerdict === "PROVEN" ? "PROVEN" : iveVerdict === "INCONCLUSIVE" ? "INCONCLUSIVE" : "UNKNOWN";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden border-vvu-gold/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-gold)_8%,card)]", children: [
      /* @__PURE__ */ jsx(
        EvolutionMatrix,
        {
          mode: "hero",
          dataDriven: true,
          combinedStage: true,
          stageRange: [0, 3]
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-none absolute inset-0 z-[1]",
          style: {
            background: "linear-gradient(90deg, rgba(15,12,12,0.88) 0%, rgba(15,12,12,0.45) 50%, rgba(15,12,12,0.12) 100%)"
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
                /* @__PURE__ */ jsx(Gauge, { className: "mr-1 h-3 w-3" }),
                "VVU \xB7 Valve Cockpit"
              ]
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-tight tracking-tight md:text-3xl", children: "One valve, two halves, four stages." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: "The fail-closed valve that binds VVU STUDI (governance) to VVU IVE (engineering release) is one coherent machine. STUDI gates feed forward into IVE; IVE's breaker feeds backward to block release. The Fibonacci matrix above is the visible face of the entire valve \u2014 flip a gate below, authorise a claim, trip a breaker; watch the morph respond within the 5s poll cadence." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 md:w-72", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-md border px-3 py-2 backdrop-blur-sm",
              style: {
                borderColor: `color-mix(in oklab, ${verdictColor(combinedVerdict)} 40%, transparent)`,
                backgroundColor: `color-mix(in oklab, ${verdictColor(combinedVerdict)} 8%, transparent)`
              },
              children: [
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
                  "Combined valve verdict \xB7 stage ",
                  stage
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex items-center gap-2", children: [
                  combinedVerdict === "PROVEN" ? /* @__PURE__ */ jsx(
                    CheckCircle2,
                    {
                      className: "h-4 w-4",
                      style: { color: verdictColor(combinedVerdict) }
                    }
                  ) : /* @__PURE__ */ jsx(
                    AlertTriangle,
                    {
                      className: "h-4 w-4",
                      style: { color: verdictColor(combinedVerdict) }
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "font-mono text-sm font-bold uppercase tracking-wider",
                      style: { color: verdictColor(combinedVerdict) },
                      children: combinedVerdict
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-[10px] leading-relaxed text-muted-foreground", children: STAGE_LABELS[stage].desc })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [
            /* @__PURE__ */ jsx(
              ReadoutTile,
              {
                label: "STUDI",
                value: studiVerdict,
                color: verdictColor(studiVerdict)
              }
            ),
            /* @__PURE__ */ jsx(
              ReadoutTile,
              {
                label: "IVE",
                value: iveVerdict,
                color: verdictColor(iveVerdict)
              }
            ),
            /* @__PURE__ */ jsx(
              ReadoutTile,
              {
                label: "breaker",
                value: breaker,
                color: breakerColor(breaker)
              }
            ),
            /* @__PURE__ */ jsx(
              ReadoutTile,
              {
                label: "confidence",
                value: `${(confidence * 100).toFixed(0)}%`,
                color: "#7c8bf5"
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Workflow, { className: "h-3.5 w-3.5 text-vvu-gold", style: { color: "var(--vvu-gold)" } }),
        "Stage morph",
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "\xB7 combined verdict across both workspaces" })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-2 md:grid-cols-4", children: STAGE_LABELS.map((s) => {
        const active = s.id === stage;
        const passed = s.id < stage;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "rounded-md border px-3 py-2 transition-all",
            style: {
              borderColor: active ? "color-mix(in oklab, var(--vvu-gold) 55%, transparent)" : passed ? "color-mix(in oklab, #10b981 30%, transparent)" : "var(--border)",
              backgroundColor: active ? "color-mix(in oklab, var(--vvu-gold) 10%, transparent)" : "transparent"
            },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "font-mono text-[10px] uppercase tracking-wider",
                    style: {
                      color: active ? "var(--vvu-gold)" : passed ? "#10b981" : "var(--muted-foreground)",
                      fontWeight: active || passed ? 700 : 400
                    },
                    children: s.label
                  }
                ),
                active && /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "text-[9px] font-mono uppercase tracking-wider",
                    style: { color: "var(--vvu-gold)" },
                    children: "\u25CF here"
                  }
                ),
                passed && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono uppercase tracking-wider text-emerald-400", children: "\u2713" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-[10px] leading-relaxed text-muted-foreground", children: s.desc })
            ]
          },
          s.id
        );
      }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(StudiGateEditor, {}),
      /* @__PURE__ */ jsx(IveClaimInjector, {})
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "border-border/60", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center justify-between gap-2 p-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: "patch \u2192 poll \u2192 store \u2192 matrix \xB7 5s cadence \xB7 fail-closed by EIS Theorem 5" }),
      lastUpdatedAt && /* @__PURE__ */ jsxs("span", { children: [
        "store: ",
        new Date(lastUpdatedAt).toLocaleTimeString()
      ] })
    ] }) })
  ] });
}
function ReadoutTile({
  label,
  value,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/60 px-2 py-1.5 backdrop-blur-sm", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "mt-0.5 font-mono text-[11px] font-bold uppercase tracking-wider",
        style: { color },
        children: value
      }
    )
  ] });
}
export {
  ValveCockpit
};
