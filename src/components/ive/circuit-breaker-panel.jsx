"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
const REASON_LABELS = {
  evidence_lost: "Evidence Lost",
  verification_failed: "Verification Failed",
  safety_violation: "Safety Violation",
  stale_evidence: "Stale Evidence",
  integrity_breach: "Integrity Breach",
  "": "No Trip"
};
function CircuitBreakerPanel({ events, safetyCritical }) {
  var _a;
  const latest = events[0];
  const isTripped = (latest == null ? void 0 : latest.triggered) === true;
  return /* @__PURE__ */ jsxs(
    Card,
    {
      className: cn(
        "p-4 transition-colors",
        isTripped ? "border-red-500/50 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold tracking-tight flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Zap, { className: "h-3.5 w-3.5" }),
              "Circuit Breaker"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground font-mono mt-0.5", children: "fail-closed: loss of E \u2192 loss of V \u2192 loss of A" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground uppercase tracking-wider", children: "Theorem 5" })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "rounded-md border-2 p-3 text-center transition-colors",
              isTripped ? "border-red-500/60 bg-red-500/10" : "border-emerald-500/50 bg-emerald-500/10"
            ),
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "font-mono text-base font-bold tracking-wider",
                    isTripped ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
                  ),
                  children: isTripped ? "\u25CF TRIPPED \u2014 FAIL CLOSED" : "\u25CF CLOSED \u2014 AUTHORIZING"
                }
              ),
              isTripped && latest && /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-red-700 dark:text-red-300 font-mono", children: (_a = REASON_LABELS[latest.reason]) != null ? _a : latest.reason })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded border bg-card p-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground uppercase tracking-wider", children: "Safety-critical" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: safetyCritical ? "YES" : "no" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded border bg-card p-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground uppercase tracking-wider", children: "Events" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: events.length })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed", children: "When tripped, all authorization revoked until reverification restores the evidence bound." })
      ]
    }
  );
}
export {
  CircuitBreakerPanel
};
