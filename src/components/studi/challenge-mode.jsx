"use client";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import {
  scanClaim,
  challengeTypeLabel,
  challengeTypeEmoji
} from "@/lib/studi/challenge-scanner";
import {
  generateEpistemicObjectId,
  loadEpistemicObjects,
  saveEpistemicObject,
  updateEpistemicObject,
  getEpistemicStats
} from "@/lib/studi/epistemic-objects";
import { loadInterestInception } from "@/lib/studi/interest-inception-state";
import { ChallengeCard } from "@/components/studi/challenge-card";
import { ChallengeModeBadge } from "@/components/studi/challenge-mode-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ListChecks,
  Send,
  RotateCcw
} from "lucide-react";
function ChallengeMode({ onClaimResolved }) {
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [scanning, setScanning] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [resolvedChallenges, setResolvedChallenges] = useState([]);
  const [currentObj, setCurrentObj] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(getEpistemicStats());
  useEffect(() => {
    setHistory(loadEpistemicObjects());
    setStats(getEpistemicStats());
  }, []);
  const refreshStats = useCallback(() => {
    setStats(getEpistemicStats());
    setHistory(loadEpistemicObjects());
  }, []);
  const handleScan = useCallback(async () => {
    if (!claim.trim()) return;
    setScanning(true);
    setActiveChallenges([]);
    setResolvedChallenges([]);
    let challenges = scanClaim(claim.trim(), evidence.trim() || null);
    try {
      const res = await fetch("/api/studi/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claim.trim(),
          evidence: evidence.trim() || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          challenges = data.challenges;
        }
      }
    } catch (e) {
    }
    const inception = loadInterestInception();
    const obj = {
      id: generateEpistemicObjectId(),
      claim: claim.trim(),
      evidence: evidence.trim() || null,
      challenges,
      user_responses: [],
      final_resolution: "pending",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      project_id: inception.projectId,
      interest_category: inception.interestCategory
    };
    saveEpistemicObject(obj);
    setCurrentObj(obj);
    setActiveChallenges(challenges);
    setScanning(false);
    refreshStats();
  }, [claim, evidence, refreshStats]);
  const handleChallengeResponse = useCallback(
    (challenge, responseType, responseText) => {
      setResolvedChallenges((prev) => [
        ...prev,
        { challenge, responseType, responseText }
      ]);
      setActiveChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      if (currentObj) {
        const updated = __spreadProps(__spreadValues({}, currentObj), {
          user_responses: [
            ...currentObj.user_responses,
            {
              challenge_id: challenge.id,
              response_type: responseType,
              response_text: responseText
            }
          ]
        });
        if (responseType === "abandon_claim") {
          updated.final_resolution = "abandoned";
        } else if (updated.user_responses.length === updated.challenges.length) {
          updated.final_resolution = "revised";
        }
        updateEpistemicObject(updated.id, updated);
        setCurrentObj(updated);
        if (updated.final_resolution !== "pending") {
          onClaimResolved == null ? void 0 : onClaimResolved(updated);
          refreshStats();
        }
      }
    },
    [currentObj, onClaimResolved, refreshStats]
  );
  const handleProceedWithUncertainty = useCallback(() => {
    if (!currentObj) return;
    const remainingResponses = activeChallenges.map((c) => ({
      challenge_id: c.id,
      response_type: "proceed_with_uncertainty",
      response_text: ""
    }));
    const updated = __spreadProps(__spreadValues({}, currentObj), {
      user_responses: [
        ...currentObj.user_responses,
        ...remainingResponses
      ],
      final_resolution: "unresolved"
    });
    updateEpistemicObject(updated.id, updated);
    setCurrentObj(updated);
    setActiveChallenges([]);
    onClaimResolved == null ? void 0 : onClaimResolved(updated);
    refreshStats();
  }, [currentObj, activeChallenges, onClaimResolved, refreshStats]);
  const handleReset = useCallback(() => {
    setClaim("");
    setEvidence("");
    setActiveChallenges([]);
    setResolvedChallenges([]);
    setCurrentObj(null);
  }, []);
  const hasActiveChallenges = activeChallenges.length > 0;
  const allResolved = currentObj && !hasActiveChallenges && currentObj.final_resolution !== "pending";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Challenge Mode" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "IVE scans every claim for contradictions, unsupported assumptions, alternative explanations, and overconfidence \u2014 before proceeding to verification." })
      ] }),
      /* @__PURE__ */ jsx(ChallengeModeBadge, { variant: "full" })
    ] }),
    stats.total > 0 && /* @__PURE__ */ jsx(Card, { className: "border-vvu-studi/20 bg-vvu-studi/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center gap-6 p-3 text-xs", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Total challenges", value: stats.total }),
      /* @__PURE__ */ jsx(
        Stat,
        {
          label: "Resolution rate",
          value: `${Math.round(stats.resolution_rate * 100)}%`
        }
      ),
      Object.entries(stats.by_challenge_type).map(([type, count]) => /* @__PURE__ */ jsx(
        Stat,
        {
          label: challengeTypeLabel(type),
          value: count,
          emoji: challengeTypeEmoji(type)
        },
        type
      ))
    ] }) }),
    !currentObj && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Enter a claim to challenge" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Your claim" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: claim,
              onChange: (e) => setClaim(e.target.value),
              placeholder: "e.g., This investment will double in 6 months.",
              className: "min-h-[60px]",
              disabled: scanning
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Evidence (optional)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: evidence,
              onChange: (e) => setEvidence(e.target.value),
              placeholder: "Paste a screenshot, link, article excerpt, or anything that supports your claim.",
              className: "min-h-[80px]",
              disabled: scanning
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: handleScan,
            disabled: !claim.trim() || scanning,
            className: "gap-2",
            children: [
              scanning ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
              "Scan for challenges"
            ]
          }
        ) })
      ] })
    ] }),
    hasActiveChallenges && currentObj && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-amber-500" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold", children: [
            activeChallenges.length,
            " challenge",
            activeChallenges.length === 1 ? "" : "s",
            " awaiting your response"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: handleProceedWithUncertainty,
            className: "text-xs",
            children: "Proceed with uncertainty \u2192"
          }
        )
      ] }),
      activeChallenges.map((c) => /* @__PURE__ */ jsx(
        ChallengeCard,
        {
          challenge: c,
          onResponse: handleChallengeResponse
        },
        c.id
      ))
    ] }),
    allResolved && /* @__PURE__ */ jsx(Card, { className: "border-emerald-500/40 bg-emerald-500/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-start gap-3 p-5", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 shrink-0 text-emerald-500" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "Challenges resolved \u2014 claim moves to verification" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Resolution:",
          " ",
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-1 font-mono text-[10px] uppercase tracking-wider", children: currentObj.final_resolution })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          resolvedChallenges.length,
          " of ",
          currentObj.challenges.length,
          " ",
          "challenges addressed."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2 pt-2", children: /* @__PURE__ */ jsx(Button, { onClick: handleReset, size: "sm", variant: "outline", children: "Submit another claim" }) })
      ] })
    ] }) }),
    history.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx(ListChecks, { className: "h-4 w-4" }),
        "Boundary dataset (",
        history.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Every challenge and response is stored as a structured epistemic object \u2014 the most valuable data for improving the system." }),
        history.slice(0, 5).map((obj) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card/60 p-2.5 text-xs",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                /* @__PURE__ */ jsxs("p", { className: "italic text-foreground/80", children: [
                  "\u201C",
                  obj.claim.slice(0, 120),
                  obj.claim.length > 120 ? "\u2026" : "",
                  "\u201D"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: obj.challenges.map((c) => /* @__PURE__ */ jsxs(
                  Badge,
                  {
                    variant: "outline",
                    className: "font-mono text-[9px] uppercase tracking-wider",
                    children: [
                      challengeTypeEmoji(c.type),
                      " ",
                      challengeTypeLabel(c.type)
                    ]
                  },
                  c.id
                )) })
              ] }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: `font-mono text-[9px] uppercase tracking-wider ${obj.final_resolution === "verified" || obj.final_resolution === "revised" ? "border-emerald-500/40 text-emerald-500" : obj.final_resolution === "abandoned" ? "border-red-500/40 text-red-500" : "border-amber-500/40 text-amber-500"}`,
                  children: obj.final_resolution
                }
              )
            ]
          },
          obj.id
        )),
        history.length > 5 && /* @__PURE__ */ jsxs("div", { className: "text-center text-[10px] text-muted-foreground", children: [
          "+ ",
          history.length - 5,
          " more in localStorage"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => {
              if (window.confirm("Reset the entire boundary dataset? This cannot be undone.")) {
                window.localStorage.removeItem("vvu-epistemic-objects");
                refreshStats();
              }
            },
            className: "mt-2 gap-1.5 text-[10px] text-muted-foreground",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
              "Reset boundary dataset"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value,
  emoji
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
      emoji && /* @__PURE__ */ jsx("span", { className: "mr-1", children: emoji }),
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "font-mono text-base font-semibold", children: value })
  ] });
}
export {
  ChallengeMode
};
