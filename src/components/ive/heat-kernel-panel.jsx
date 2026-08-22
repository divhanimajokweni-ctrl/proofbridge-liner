"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
function HeatKernelPanel({ claimId, topology = "cycle" }) {
  var _a;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      var _a2;
      setLoading(true);
      setError(null);
      try {
        const body = {
          topology,
          kappa: 0.25,
          steps: 50
        };
        if (topology === "evidence" && claimId) {
          body.claimId = claimId;
        } else if (topology === "cycle") {
          body.n = 128;
        }
        const res = await fetch("/api/heat-kernel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((_a2 = err.error) != null ? _a2 : `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (topology === "cycle" || topology === "evidence" && claimId) {
      run();
    }
    return () => {
      cancelled = true;
    };
  }, [claimId, topology]);
  const trace = (_a = result == null ? void 0 : result.trace) != null ? _a : [];
  const maxL2 = Math.max(...trace.map((s) => s.l2Norm), 1e-3);
  const maxHighFreq = Math.max(...trace.map((s) => s.highFreqEnergy), 1e-3);
  return /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold tracking-tight flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5" }),
          "Heat Kernel Diffusion"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground font-mono mt-0.5", children: "u_t = \u2212\u03BA L u  (graph Laplacian L = D \u2212 A)" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 3" })
    ] }),
    loading && /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-xs text-muted-foreground font-mono", children: "Running diffusion\u2026" }),
    error && /* @__PURE__ */ jsx("div", { className: "py-4 text-center text-xs text-red-600 dark:text-red-400 font-mono", children: error }),
    result && !loading && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "L2 retention" }),
          /* @__PURE__ */ jsxs("div", { className: "font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400", children: [
            (result.retention * 100).toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "High-freq" }),
          /* @__PURE__ */ jsxs("div", { className: "font-mono text-lg font-bold text-red-600 dark:text-red-400", children: [
            result.finalHighFreqEnergy.toFixed(3),
            "\xD7"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "\u03BA / N" }),
          /* @__PURE__ */ jsxs("div", { className: "font-mono text-lg font-bold", children: [
            result.kappa,
            "/",
            result.n
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Diffusion trace" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[10px] font-mono", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "inline-block h-2 w-2 rounded-sm bg-emerald-500" }),
              "L2 norm"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "inline-block h-2 w-2 rounded-sm bg-orange-500" }),
              "High-freq"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative h-24 rounded-md border bg-muted/20 p-1.5", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 100 100", preserveAspectRatio: "none", className: "absolute inset-0 h-full w-full p-1.5", children: [
          /* @__PURE__ */ jsx(
            "polyline",
            {
              fill: "none",
              stroke: "oklch(0.646 0.222 41.116)",
              strokeWidth: "1.5",
              vectorEffect: "non-scaling-stroke",
              points: trace.map((s, i) => {
                const x = i / Math.max(1, trace.length - 1) * 100;
                const y = 100 - s.l2Norm / maxL2 * 95;
                return `${x},${y}`;
              }).join(" ")
            }
          ),
          /* @__PURE__ */ jsx(
            "polyline",
            {
              fill: "none",
              stroke: "oklch(0.7 0.18 50)",
              strokeWidth: "1.5",
              strokeDasharray: "2,2",
              vectorEffect: "non-scaling-stroke",
              points: trace.map((s, i) => {
                const x = i / Math.max(1, trace.length - 1) * 100;
                const y = 100 - s.highFreqEnergy / maxHighFreq * 95;
                return `${x},${y}`;
              }).join(" ")
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed", children: "Heat kernel decays monotonically; high-frequency modes suppressed. Wave eq (u_tt + c\xB2Lu = 0) conserves energy (drift = 0.000e+00) but is inappropriate for dissipative evidence systems." })
    ] })
  ] });
}
export {
  HeatKernelPanel
};
