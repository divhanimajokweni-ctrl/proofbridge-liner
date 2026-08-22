"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TRACKS,
  runVerification,
  EIS_HEX
} from "@/lib/study/artifacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { ResearchTrack } from "@/components/study/research-track";
import { EngineeringTrack } from "@/components/study/engineering-track";
import { SportsTrack } from "@/components/study/sports-track";
function StudyWorkspace() {
  var _a;
  const [trackId, setTrackId] = useState("engineering");
  const [artifact, setArtifact] = useState(
    () => TRACKS[1].generator()
  );
  const [verifying, setVerifying] = useState(false);
  const [verifications, setVerifications] = useState(/* @__PURE__ */ new Map());
  const [selected, setSelected] = useState(null);
  const current = useMemo(
    () => TRACKS.find((t) => t.id === trackId),
    [trackId]
  );
  const switchTrack = useCallback((id) => {
    const t = TRACKS.find((t2) => t2.id === id);
    setTrackId(id);
    setArtifact(t.generator());
    setVerifications(/* @__PURE__ */ new Map());
    setSelected(null);
  }, []);
  const resetStudy = useCallback(() => {
    setArtifact(current.generator());
    setVerifications(/* @__PURE__ */ new Map());
    setSelected(null);
  }, [current]);
  const runIve = useCallback(() => {
    setVerifying(true);
    setVerifications(/* @__PURE__ */ new Map());
    runVerification(artifact, 3e3).then((map) => {
      setVerifications(map);
      setVerifying(false);
    });
  }, [artifact]);
  useEffect(() => {
    setVerifications(/* @__PURE__ */ new Map());
  }, [artifact]);
  const counts = useMemo(() => {
    const total = artifact.components.length;
    const verified = Array.from(verifications.values()).filter(
      (s) => ["PROVEN", "VERIFIED", "SUPPORTED"].includes(s)
    ).length;
    const inconclusive = Array.from(verifications.values()).filter(
      (s) => s === "INCONCLUSIVE"
    ).length;
    const falsified = Array.from(verifications.values()).filter(
      (s) => s === "FALSIFIED"
    ).length;
    const unverified = total - verified - inconclusive - falsified;
    return { total, verified, inconclusive, falsified, unverified };
  }, [artifact, verifications]);
  const selectedComponent = selected ? (_a = artifact.components.find((c) => c.id === selected)) != null ? _a : null : null;
  const selectedState = selected ? verifications.get(selected) : void 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: artifact.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1 max-w-3xl", children: artifact.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: resetStudy, children: "Reset Study" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: runIve,
              disabled: verifying,
              className: "min-w-32",
              children: verifying ? "IVE verifying\u2026" : "Run IVE Verification"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 text-sm", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Components", value: counts.total }),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Verified",
            value: counts.verified,
            color: "#22c55e"
          }
        ),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Inconclusive",
            value: counts.inconclusive,
            color: "#f97316"
          }
        ),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Falsified",
            value: counts.falsified,
            color: "#ef4444"
          }
        ),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Unverified",
            value: counts.unverified,
            color: "#64748b"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Pipeline:" }),
          /* @__PURE__ */ jsx("code", { className: "text-xs bg-muted px-2 py-1 rounded", children: "PARSE \u2192 RENDER(A) \u2192 IVE \u2192 OVERLAY(B)" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(
      Tabs,
      {
        value: trackId,
        onValueChange: (v) => switchTrack(v),
        className: "w-full",
        children: [
          /* @__PURE__ */ jsx(TabsList, { children: TRACKS.map((t) => /* @__PURE__ */ jsx(TabsTrigger, { value: t.id, children: t.label }, t.id)) }),
          /* @__PURE__ */ jsx(TabsContent, { value: trackId, className: "mt-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [
            /* @__PURE__ */ jsx(Card, { className: "min-h-[480px]", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-0 h-[480px] relative overflow-hidden rounded-lg", children: [
              trackId === "research" && /* @__PURE__ */ jsx(
                ResearchTrack,
                {
                  artifact,
                  verifications,
                  verifying,
                  onSelect: setSelected,
                  selected
                }
              ),
              trackId === "engineering" && /* @__PURE__ */ jsx(
                EngineeringTrack,
                {
                  artifact,
                  verifications,
                  verifying,
                  onSelect: setSelected,
                  selected
                }
              ),
              trackId === "sports" && /* @__PURE__ */ jsx(
                SportsTrack,
                {
                  artifact,
                  verifications,
                  verifying,
                  onSelect: setSelected,
                  selected
                }
              ),
              verifying && /* @__PURE__ */ jsxs("div", { className: "absolute top-3 right-3 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-xs border", children: [
                /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-amber-500 animate-pulse" }),
                "IVE running \u2014 UI remains interactive"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs(Card, { className: "h-[480px] overflow-auto", children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Inspector" }) }),
              /* @__PURE__ */ jsx(CardContent, { className: "text-sm space-y-3", children: selectedComponent ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Label" }),
                  /* @__PURE__ */ jsx("div", { className: "font-mono", children: selectedComponent.label })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "ID" }),
                  /* @__PURE__ */ jsx("div", { className: "font-mono text-xs", children: selectedComponent.id })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Kind" }),
                  /* @__PURE__ */ jsx("div", { className: "font-mono", children: selectedComponent.kind })
                ] }),
                selectedComponent.anomaly && /* @__PURE__ */ jsxs("div", { className: "rounded border border-red-500/40 bg-red-500/5 p-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-red-500", children: [
                    "Anomaly: ",
                    selectedComponent.anomaly.kind
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs mt-1", children: selectedComponent.anomaly.description })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "IVE verdict" }),
                  selectedState ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: "h-3 w-3 rounded-full",
                        style: { background: EIS_HEX[selectedState] }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "font-mono", children: selectedState })
                  ] }) : verifying ? /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-500", children: "Verifying\u2026" }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Not yet verified \u2014 click Run IVE" })
                ] }),
                selectedComponent.base.meta && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Meta" }),
                  /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-2 rounded overflow-auto", children: JSON.stringify(selectedComponent.base.meta, null, 2) })
                ] })
              ] }) : /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Click any component in the renderer to inspect it." }) })
            ] })
          ] }) })
        ]
      }
    )
  ] });
}
function Stat({
  label,
  value,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    color && /* @__PURE__ */ jsx(
      "span",
      {
        className: "h-2 w-2 rounded-full",
        style: { background: color }
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold", children: value })
  ] });
}
export {
  StudyWorkspace
};
