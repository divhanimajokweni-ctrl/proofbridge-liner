"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadInterestInception,
  saveInterestInception,
  classifyInterest,
  generateBridgingPrompt,
  generateProjectId,
  INTEREST_QUICK_SELECTS,
  categoryLabel,
  categoryEmoji
} from "@/lib/studi/interest-inception-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, HelpCircle, Loader2 } from "lucide-react";
function InterestInceptionModal({ children, onComplete }) {
  var _a, _b;
  const [interest, setInterest] = useState("");
  const [category, setCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    var _a2;
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  }, []);
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && interest.trim() && !submitting) {
        e.preventDefault();
        handleSubmit(interest.trim());
      }
    },
    [interest, submitting]
  );
  const handleSubmit = useCallback(
    async (rawInterest) => {
      setSubmitting(true);
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      let localCategory = classifyInterest(rawInterest);
      let prompt = generateBridgingPrompt(rawInterest, localCategory);
      let usedAi = false;
      try {
        const res = await fetch("/api/studi/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest: rawInterest })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.interest_category && data.bridging_prompt) {
            localCategory = data.interest_category;
            prompt = data.bridging_prompt;
            usedAi = true;
          }
        }
      } catch (e) {
      }
      const projectId = generateProjectId(rawInterest, timestamp);
      const state = {
        completed: true,
        interest: rawInterest,
        interestCategory: localCategory,
        bridgingPrompt: prompt,
        projectId,
        timestamp
      };
      saveInterestInception(state);
      setCategory(localCategory);
      setAiAssisted(usedAi);
      setSubmitting(false);
      setTimeout(() => onComplete(state), 1200);
    },
    [onComplete]
  );
  const handleQuickSelect = useCallback(
    (cat) => {
      var _a2, _b2;
      const label = (_b2 = (_a2 = INTEREST_QUICK_SELECTS.find((q) => q.value === cat)) == null ? void 0 : _a2.label) != null ? _b2 : cat;
      setInterest(label);
      handleSubmit(label);
    },
    [handleSubmit]
  );
  const handleDontKnow = useCallback(() => {
    handleSubmit("I'm just curious.");
  }, [handleSubmit]);
  const showReveal = category !== null;
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen w-full overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        "aria-hidden": true,
        className: "pointer-events-none absolute inset-0 scale-105 select-none opacity-60 blur-md",
        children
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-background/70 backdrop-blur-[1px]" }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 flex min-h-screen items-center justify-center p-4", children: /* @__PURE__ */ jsx(Card, { className: "w-full max-w-2xl border-vvu-studi/30 bg-card/95 shadow-2xl backdrop-blur-md", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 md:p-10", children: !showReveal ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-vvu-studi", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-xs uppercase tracking-widest", children: "VVU \xB7 Interest Inception" })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-tight tracking-tight md:text-3xl", children: "What are you interested in?" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "One question, infinite paths. Your answer shapes everything VVU shows you next \u2014 no projects to create, no claims to file, just curiosity." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            ref: inputRef,
            type: "text",
            value: interest,
            onChange: (e) => setInterest(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: "I'm curious about...",
            disabled: submitting,
            className: "h-12 border-vvu-studi/30 bg-background/60 text-base"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: "Press Enter to submit" }),
          /* @__PURE__ */ jsxs("span", { children: [
            interest.length,
            "/200"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Or pick a common starting point" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: INTEREST_QUICK_SELECTS.map((q) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleQuickSelect(q.value),
            disabled: submitting,
            className: "flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium transition-colors hover:border-vvu-studi/50 hover:bg-vvu-studi/5 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: q.emoji }),
              q.label
            ]
          },
          q.value
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 border-t border-border/60 pt-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Don't have a specific interest yet? That's the best place to start." }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: handleDontKnow,
            disabled: submitting,
            className: "gap-2 border-vvu-studi/40 text-vvu-studi hover:bg-vvu-studi/10",
            children: [
              submitting ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(HelpCircle, { className: "h-4 w-4" }),
              "I don't know. I'm just curious."
            ]
          }
        )
      ] }),
      interest.trim() && /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          onClick: () => handleSubmit(interest.trim()),
          disabled: submitting,
          className: "gap-2",
          children: [
            submitting ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }),
            "Continue"
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ jsx(
      RevealBridgingPrompt,
      {
        interest,
        category,
        bridgingPrompt: (_a = loadInterestInception().bridgingPrompt) != null ? _a : "",
        projectId: (_b = loadInterestInception().projectId) != null ? _b : "",
        aiAssisted
      }
    ) }) }) })
  ] });
}
function RevealBridgingPrompt({
  interest,
  category,
  bridgingPrompt,
  projectId,
  aiAssisted
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-vvu-studi", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs uppercase tracking-widest", children: "Project Initialized" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-4xl", children: categoryEmoji(category) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Interest Category" }),
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: categoryLabel(category) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mx-auto max-w-md text-sm leading-relaxed text-foreground/90", children: bridgingPrompt }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md rounded-md border border-vvu-studi/30 bg-vvu-studi/5 p-3", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Implicit Project ID" }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-sm font-semibold text-vvu-studi", children: projectId })
    ] }),
    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase tracking-wider", children: aiAssisted ? "\u2726 AI-assisted classification" : "Heuristic classification" }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Taking you to your workspace\u2026" })
  ] });
}
export {
  InterestInceptionModal
};
