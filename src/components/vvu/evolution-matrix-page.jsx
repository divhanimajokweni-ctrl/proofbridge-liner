"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { useWorkspace } from "@/lib/workspace";
import { useTheoremStore } from "@/lib/theorem/theorem-store";
const STAGE_NOTES = [
  {
    title: "Global Sphere",
    math: "phi = acos(-1 + 2i/N),  theta = sqrt(N\xB7\u03C0)\xB7phi",
    desc: "Fibonacci lattice on the unit sphere \u2014 the lowest-discrepancy isotropic distribution of N points. Every node carries the same weight: this is STUDI's view of the institution, where every claim and every governing document is one peer among peers."
  },
  {
    title: "Ant Mascot (Antone)",
    math: "cluster(u) = -0.6 + sqrt(r) \xB7 cos(2\u03C0a)",
    desc: "The cloud re-coheres into Antone \u2014 the worker-scholar mascot. Six legs fan out from a head cluster; the thorax and abdomen appear as separate clouds. STUDI's labour: every node is still part of the whole, but now organized into a body."
  },
  {
    title: "Kinetic Web Spider",
    math: "leg(k) = (cos(k\xB7\u03C0/4 + 0.2), sin(k\xB7\u03C0/4 + 0.2))\xB7(0.2 + p\xB70.6)",
    desc: "Eight radial legs \u2014 IVE's plugin network. The webhook delivery fan-out, the adapter attribution, every external system IVE can authorize-and-release into is one node on this web. The center holds; the legs reach."
  },
  {
    title: "Miles Spider-Man",
    math: "color = node.isRed ? #ff2233 : #ffffff",
    desc: "The release form. Red nodes are the authorized cluster \u2014 claims that have crossed the fail-closed valve and are bound for engineering release. White nodes are still pending. This is IVE's terminal view: proof has accumulated into action."
  }
];
const STAGE_COLORS = ["#7c8bf5", "#c07a40", "#e67e22", "#e74c3c"];
function EvolutionMatrixPage() {
  const { workspace, meta } = useWorkspace();
  const [mode, setMode] = useState("live");
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const loading = useTheoremStore((s) => s.loading);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const verdict = workspace === "studi" ? studiVerdict : iveVerdict;
  const verdictColor = verdict === "PROVEN" ? "#10b981" : verdict === "INCONCLUSIVE" ? "#e74c3c" : "#7c8bf5";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
              style: {
                backgroundColor: `color-mix(in oklab, var(${meta.accentVar}) 22%, transparent)`,
                color: `var(${meta.accentVar})`
              },
              children: meta.name
            }
          ),
          "VVU Evolution Matrix"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center rounded-md border border-border bg-card/40 p-0.5",
              role: "tablist",
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    role: "tab",
                    "aria-selected": mode === "live",
                    onClick: () => setMode("live"),
                    className: `rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${mode === "live" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`,
                    style: mode === "live" ? { boxShadow: "inset 0 0 0 1px var(--vvu-gold)" } : void 0,
                    children: "Live"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    role: "tab",
                    "aria-selected": mode === "explore",
                    onClick: () => setMode("explore"),
                    className: `rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${mode === "explore" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`,
                    style: mode === "explore" ? { boxShadow: "inset 0 0 0 1px var(--vvu-gold)" } : void 0,
                    children: "Explore"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: "font-mono text-[10px] uppercase tracking-wider",
              children: "Fibonacci \xB7 650 nodes"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs("p", { className: "mb-4 max-w-3xl text-xs leading-relaxed text-muted-foreground", children: [
          "A single instanced point cloud distributed on a Fibonacci sphere-lattice, morphing between four canonical shapes that map onto the VVU trust story. In ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "Live" }),
          " mode, the cloud eases toward the current theorem-state verdict for the active workspace \u2014 it is the visible face of the fail-closed valve. In ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "Explore" }),
          " mode the cloud auto-loops and the slider gives manual control for inspecting any intermediate frame."
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              height: "min(70vh, 640px)",
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #222"
            },
            children: /* @__PURE__ */ jsx(
              EvolutionMatrix,
              {
                mode: "full",
                dataDriven: mode === "live",
                stageRange: workspace === "studi" ? [0, 1] : [2, 3]
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-border/70", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-semibold", children: [
          "Valve State",
          /* @__PURE__ */ jsxs("span", { className: "ml-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
            "theorem-state \xB7 ",
            mode === "live" ? "driving" : "background"
          ] })
        ] }),
        loading && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase tracking-wider text-amber-400", children: "loading" })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsx(ValveStat, { label: "STUDI verdict", value: studiVerdict, color: verdictColorFor(studiVerdict) }),
          /* @__PURE__ */ jsx(ValveStat, { label: "IVE verdict", value: iveVerdict, color: verdictColorFor(iveVerdict) }),
          /* @__PURE__ */ jsx(
            ValveStat,
            {
              label: "EIS breaker",
              value: breaker,
              color: breaker === "TRIPPED" ? "#e74c3c" : "#10b981"
            }
          ),
          /* @__PURE__ */ jsx(
            ValveStat,
            {
              label: "Confidence",
              value: loading ? "\u2014" : `${(confidence * 100).toFixed(0)}%`,
              color: "#7c8bf5"
            }
          )
        ] }),
        lastUpdatedAt && !loading && /* @__PURE__ */ jsxs("div", { className: "mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
          "last updated: ",
          new Date(lastUpdatedAt).toLocaleTimeString(),
          " \xB7 poll cadence 5s \xB7",
          " ",
          /* @__PURE__ */ jsxs("span", { style: { color: verdictColor }, children: [
            workspace.toUpperCase(),
            " \u2192 ",
            verdict
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: STAGE_NOTES.map((stage, i) => /* @__PURE__ */ jsxs(Card, { className: "border-border/70", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "font-mono text-xs font-bold",
            style: { color: STAGE_COLORS[i] },
            children: [
              i,
              "."
            ]
          }
        ),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: stage.title })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground", children: stage.math }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] leading-relaxed text-muted-foreground", children: stage.desc })
      ] })
    ] }, stage.title)) }),
    /* @__PURE__ */ jsx(Card, { className: "border-border/70", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-[11px] leading-relaxed text-muted-foreground", children: [
      /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "Why Fibonacci:" }),
      " the golden-angle spiral ",
      /* @__PURE__ */ jsx("span", { className: "font-mono", children: "theta = sqrt(N\xB7\u03C0)\xB7phi" }),
      " gives the lowest-discrepancy isotropic coverage of the sphere \u2014 no clumping, no holes. That property is what lets the cloud morph cleanly between shapes: every node has a unique, well-distributed origin, so the smoothstep lerp between stages never tears. Same point cloud, four faces \u2014 the dual workspace in one image."
    ] }) })
  ] });
}
function ValveStat({
  label,
  value,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 px-3 py-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "mt-0.5 font-mono text-sm font-bold uppercase tracking-wider",
        style: { color },
        children: value
      }
    )
  ] });
}
function verdictColorFor(v) {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e74c3c";
  return "#7c8bf5";
}
export {
  EvolutionMatrixPage
};
