"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Sigma } from "lucide-react";
function ParticipationRatioPanel({
  result,
  threshold = 2,
  loading,
  onRecompute
}) {
  const meetsThreshold = result ? result.nInd >= threshold - 0.3 : false;
  const topEigenvalues = result ? result.eigenvalues.slice(0, 12) : [];
  const maxLambda = topEigenvalues.length > 0 ? Math.max(...topEigenvalues, 1e-3) : 1;
  return /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold tracking-tight flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Sigma, { className: "h-3.5 w-3.5" }),
          "Participation Ratio"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground font-mono mt-0.5", children: "N_ind = (\u2211\u03BB_i)\xB2 / \u2211\u03BB_i\xB2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 2" }),
        onRecompute && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onRecompute,
            disabled: loading,
            className: "rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-mono font-semibold hover:bg-muted transition-colors disabled:opacity-50",
            children: loading ? "..." : "Recompute"
          }
        )
      ] })
    ] }),
    result ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "N_ind" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `font-mono text-lg font-bold ${meetsThreshold ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`,
              children: result.nInd.toFixed(2)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Sources" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-lg font-bold", children: result.numSources })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "\u03B3 (RBF)" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-lg font-bold", children: result.gamma.toFixed(3) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
            "Eigenvalue Spectrum (top ",
            topEigenvalues.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-muted-foreground", children: [
            "threshold: ",
            threshold
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-0.5 h-16 rounded-md border bg-muted/20 p-1.5", children: [
          topEigenvalues.map((lambda, i) => {
            const height = Math.max(2, lambda / maxLambda * 100);
            const isSignificant = lambda / maxLambda > 0.1;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex-1 rounded-t-sm transition-all",
                style: {
                  height: `${height}%`,
                  backgroundColor: isSignificant ? "var(--chart-1, oklch(0.646 0.222 41.116))" : "var(--muted-foreground, oklch(0.556 0 0))",
                  opacity: isSignificant ? 1 : 0.4
                },
                title: `\u03BB_${i + 1} = ${lambda.toFixed(4)}`
              },
              i
            );
          }),
          topEigenvalues.length === 0 && /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-[10px] text-muted-foreground italic", children: "no eigenvalues" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed", children: "Median-heuristic \u03B3 = 1 / median(\u2016\u03C6_i \u2212 \u03C6_j\u2016\xB2). Monotonic in true source count m." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-xs text-muted-foreground font-mono", children: "No N_ind computation yet. Run /api/n-ind to compute participation ratio." })
  ] });
}
export {
  ParticipationRatioPanel
};
