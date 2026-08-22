"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  STATE_RANK,
  statesInOrder
} from "@/lib/eis";
const STATE_DESCRIPTIONS = {
  PROVEN: "Mathematical proof. Highest epistemic strength. Only mathematical claims can reach this state.",
  VERIFIED: "Semantic validity established. Reserved for mathematical + semantic claims.",
  SUPPORTED: "Empirical validation. Default threshold for authorization (AUTH_THRESHOLD).",
  OBSERVED: "Operational observation. Default state for fresh evidence from the Mesh.",
  INCONCLUSIVE: "Evidence present but ambiguous. Authorization blocked.",
  UNVALIDATED: "Claim exists but no verification has been run.",
  UNTESTED: "Freshly created claim \u2014 no evidence yet.",
  STALE: "Evidence exceeded the staleness window. Circuit breaker may trip.",
  FALSIFIED: "Terminal denial. Incomparable in the lattice. All authorization revoked."
};
function StateLattice({ currentState, compact = false }) {
  const ordered = statesInOrder();
  const currentRank = STATE_RANK[currentState];
  return /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight", children: "Verification State Lattice" }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 4" })
    ] }),
    /* @__PURE__ */ jsx(TooltipProvider, { delayDuration: 150, children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-1", children: ordered.map((s, idx) => {
      const isActive = s === currentState;
      const isReached = s !== "FALSIFIED" && currentState !== "FALSIFIED" && STATE_RANK[s] <= currentRank;
      const isFalsified = currentState === "FALSIFIED" && s === "FALSIFIED";
      const color = isFalsified ? "bg-red-500 text-white border-red-600" : isActive ? "bg-foreground text-background border-foreground" : isReached ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" : "bg-muted/50 text-muted-foreground border-border";
      return /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "rounded-md border px-2 py-1 text-[10px] font-mono font-semibold tracking-wide cursor-help",
                color,
                compact && "px-1.5 py-0.5"
              ),
              children: s
            }
          ) }),
          /* @__PURE__ */ jsxs(TooltipContent, { side: "top", className: "max-w-[240px]", children: [
            /* @__PURE__ */ jsx("p", { className: "font-mono text-xs font-semibold mb-1", children: s }),
            /* @__PURE__ */ jsx("p", { className: "text-xs", children: STATE_DESCRIPTIONS[s] })
          ] })
        ] }),
        idx < ordered.length - 1 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40 mx-0.5 text-xs", children: ordered[idx + 1] === "FALSIFIED" ? "\u22A5" : "\u2265" })
      ] }, s);
    }) }) }),
    /* @__PURE__ */ jsxs("p", { className: "mt-3 text-[11px] text-muted-foreground font-mono leading-relaxed", children: [
      "PROVEN \u2265 VERIFIED \u2265 SUPPORTED \u2265 OBSERVED \u2265 INCONCLUSIVE",
      /* @__PURE__ */ jsx("br", {}),
      "FALSIFIED (incomparable, terminal denial)"
    ] })
  ] });
}
export {
  StateLattice
};
