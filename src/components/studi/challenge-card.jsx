"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import {
  challengeTypeEmoji,
  challengeTypeLabel,
  responseTypeLabel
} from "@/lib/studi/challenge-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  X
} from "lucide-react";
function ChallengeCard({ challenge, onResponse, onDismiss }) {
  const [selected, setSelected] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleRespond = async () => {
    if (!selected) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 250));
    onResponse(challenge, selected, responseText.trim());
    setSubmitting(false);
  };
  return /* @__PURE__ */ jsxs(Card, { className: "border-amber-500/40 bg-amber-500/5 shadow-lg", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: challengeTypeEmoji(challenge.type) }),
            "CHALLENGE: ",
            challengeTypeLabel(challenge.type)
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: challenge.description })
        ] })
      ] }),
      onDismiss && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: onDismiss,
          className: "h-7 w-7 shrink-0",
          "aria-label": "Dismiss",
          children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1 rounded-md border border-border/60 bg-card/60 p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Your claim" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs italic leading-relaxed text-foreground/90", children: [
          "\u201C",
          challenge.claim_excerpt,
          "\u201D"
        ] })
      ] }),
      challenge.evidence_excerpt && /* @__PURE__ */ jsxs("div", { className: "space-y-1 rounded-md border border-border/60 bg-card/60 p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Evidence provided" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs italic leading-relaxed text-foreground/90", children: [
          "\u201C",
          challenge.evidence_excerpt,
          "\u201D"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-amber-500", children: "IVE\u2019s assessment" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed text-foreground/90", children: challenge.assessment }),
        /* @__PURE__ */ jsxs(
          Badge,
          {
            variant: "outline",
            className: "mt-2 font-mono text-[10px] uppercase tracking-wider",
            children: [
              "Confidence: ",
              Math.round(challenge.confidence * 100),
              "%"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "How do you respond?" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: ["provide_stronger_evidence", "adjust_claim", "proceed_with_uncertainty", "abandon_claim"].map(
          (rt) => {
            const isSelected = selected === rt;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSelected(rt),
                className: `flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors ${isSelected ? "border-vvu-studi bg-vvu-studi/10" : "border-border bg-card/60 hover:border-vvu-studi/40 hover:bg-vvu-studi/5"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: responseTypeLabel(rt) }),
                  isSelected && /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5 text-vvu-studi" })
                ]
              },
              rt
            );
          }
        ) })
      ] }),
      selected && selected !== "abandon_claim" && /* @__PURE__ */ jsx(
        Textarea,
        {
          value: responseText,
          onChange: (e) => setResponseText(e.target.value),
          placeholder: "Optional: explain your response, or paste stronger evidence here\u2026",
          className: "min-h-[80px] text-xs",
          disabled: submitting
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 border-t border-border/60 pt-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            onClick: () => {
              setSelected(null);
              setResponseText("");
            },
            disabled: !selected || submitting,
            className: "text-xs",
            children: "Reset"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            onClick: handleRespond,
            disabled: !selected || submitting,
            className: "gap-2 text-xs",
            children: [
              submitting ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" }),
              "Respond & continue"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  ChallengeCard
};
