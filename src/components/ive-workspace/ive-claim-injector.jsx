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
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useTheoremStore
} from "@/lib/theorem/theorem-store";
import {
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldOff,
  ShieldCheck,
  Activity
} from "lucide-react";
function verdictColor(v) {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}
function IveClaimInjector() {
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const storeClaims = useTheoremStore((s) => s.iveClaims);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const hydrate = useTheoremStore((s) => s.hydrate);
  const [overlay, setOverlay] = useState({});
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    (async () => {
      try {
        const res = await fetch("/api/theorem-state", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        hydrate({
          studiVerdict: data.studiVerdict,
          iveVerdict: data.iveVerdict,
          breaker: data.breaker,
          confidence: data.confidence,
          iveClaims: Array.isArray(data.iveClaims) ? data.iveClaims : []
        });
      } catch (e) {
      }
    })();
  }, [bootstrapped]);
  const claims = storeClaims.map((c) => {
    var _a;
    return __spreadValues(__spreadValues({}, c), (_a = overlay[c.id]) != null ? _a : {});
  });
  const callAuthorize = async (claimId, authorized) => {
    const res = await fetch(
      `/api/theorem-state/claims/${encodeURIComponent(claimId)}/authorize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorized })
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  };
  const callBreaker = async (claimId, tripped) => {
    const res = await fetch(
      `/api/theorem-state/claims/${encodeURIComponent(claimId)}/breaker`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripped })
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  };
  const handleAuthorize = async (claimId, next) => {
    const prev = claims.find((c) => c.id === claimId);
    if (!prev || prev.authorized === next) return;
    setPending({ claimId, type: next ? "authorize" : "revoke" });
    setOverlay((cur) => __spreadProps(__spreadValues({}, cur), {
      [claimId]: __spreadProps(__spreadValues({}, cur[claimId]), {
        authorized: next,
        authorizationUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        authorizationReason: next ? "operator override \u2014 all five conjuncts asserted" : "operator revoke \u2014 claim no longer meets threshold"
      })
    }));
    try {
      await callAuthorize(claimId, next);
      setError(null);
    } catch (e) {
      setOverlay((cur) => __spreadProps(__spreadValues({}, cur), {
        [claimId]: __spreadProps(__spreadValues({}, cur[claimId]), {
          authorized: prev.authorized,
          authorizationUpdatedAt: prev.authorizationUpdatedAt,
          authorizationReason: prev.authorizationReason
        })
      }));
      setError(e instanceof Error ? e.message : "authorize failed");
    } finally {
      setPending(null);
    }
  };
  const handleBreaker = async (claimId, next) => {
    const prev = claims.find((c) => c.id === claimId);
    if (!prev || prev.breakerTripped === next) return;
    setPending({ claimId, type: next ? "trip" : "reset" });
    setOverlay((cur) => __spreadProps(__spreadValues({}, cur), {
      [claimId]: __spreadProps(__spreadValues({}, cur[claimId]), {
        breakerTripped: next,
        breakerUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        breakerReason: "operator_override"
      })
    }));
    try {
      await callBreaker(claimId, next);
      setError(null);
    } catch (e) {
      setOverlay((cur) => __spreadProps(__spreadValues({}, cur), {
        [claimId]: __spreadProps(__spreadValues({}, cur[claimId]), {
          breakerTripped: prev.breakerTripped,
          breakerUpdatedAt: prev.breakerUpdatedAt,
          breakerReason: prev.breakerReason
        })
      }));
      setError(e instanceof Error ? e.message : "breaker failed");
    } finally {
      setPending(null);
    }
  };
  const handleAuthoriseAll = async () => {
    setPending({ claimId: "__all__", type: "authorize" });
    try {
      for (const c of claims) {
        if (!c.authorized) await callAuthorize(c.id, true);
        if (c.breakerTripped) await callBreaker(c.id, false);
      }
      const stamp = (/* @__PURE__ */ new Date()).toISOString();
      const nextOverlay = {};
      for (const c of claims) {
        nextOverlay[c.id] = {
          authorized: true,
          breakerTripped: false,
          authorizationUpdatedAt: stamp,
          breakerUpdatedAt: stamp,
          authorizationReason: "operator override \u2014 all five conjuncts asserted",
          breakerReason: "operator_override"
        };
      }
      setOverlay(nextOverlay);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "bulk action failed");
    } finally {
      setPending(null);
    }
  };
  const handleResetAll = async () => {
    setPending({ claimId: "__all__", type: "revoke" });
    try {
      for (const c of claims) {
        if (c.authorized) await callAuthorize(c.id, false);
        if (c.breakerTripped) await callBreaker(c.id, false);
      }
      const stamp = (/* @__PURE__ */ new Date()).toISOString();
      const nextOverlay = {};
      for (const c of claims) {
        nextOverlay[c.id] = {
          authorized: false,
          breakerTripped: false,
          authorizationUpdatedAt: stamp,
          breakerUpdatedAt: stamp,
          authorizationReason: "operator revoke \u2014 claim no longer meets threshold",
          breakerReason: "operator_override"
        };
      }
      setOverlay(nextOverlay);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "bulk action failed");
    } finally {
      setPending(null);
    }
  };
  if (claims.length === 0) {
    return /* @__PURE__ */ jsxs(Card, { className: "border-vvu-ive/30", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(
          Activity,
          {
            className: "h-3.5 w-3.5 text-vvu-ive",
            style: { color: "var(--vvu-ive)" }
          }
        ),
        "IVE Claim Verification Injector",
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "\xB7 valve demo \xB7 other half" })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-6 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Loading claims \u2014 run",
        " ",
        /* @__PURE__ */ jsx("code", { className: "rounded bg-card/60 px-1 py-0.5 font-mono text-[10px]", children: "bun run scripts/seed-ive-claims.ts" }),
        " ",
        "if none appear."
      ] }) })
    ] });
  }
  const totalClaims = claims.length;
  const authorizedCount = claims.filter((c) => c.authorized).length;
  const trippedCount = claims.filter((c) => c.breakerTripped).length;
  const authRatio = totalClaims > 0 ? authorizedCount / totalClaims : 0;
  return /* @__PURE__ */ jsxs(Card, { className: "border-vvu-ive/30", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(
          Activity,
          {
            className: "h-3.5 w-3.5 text-vvu-ive",
            style: { color: "var(--vvu-ive)" }
          }
        ),
        "IVE Claim Verification Injector",
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "\xB7 other half of the valve" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleAuthoriseAll,
            disabled: pending !== null,
            "data-test": "all-go",
            "data-pending": pending ? "true" : "false",
            className: "flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50",
            title: "Authorise all claims + reset all breakers \u2192 IVE PROVEN",
            children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
              "All GO"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleResetAll,
            disabled: pending !== null,
            "data-test": "reset-all",
            className: "flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50",
            title: "Revoke all authorisations + reset all breakers",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
              "Reset"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between rounded-md border px-3 py-2",
          style: {
            borderColor: `color-mix(in oklab, ${verdictColor(iveVerdict)} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${verdictColor(iveVerdict)} 8%, transparent)`
          },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              iveVerdict === "PROVEN" ? /* @__PURE__ */ jsx(
                CheckCircle2,
                {
                  className: "h-4 w-4",
                  style: { color: verdictColor(iveVerdict) }
                }
              ) : /* @__PURE__ */ jsx(
                AlertTriangle,
                {
                  className: "h-4 w-4",
                  style: { color: verdictColor(iveVerdict) }
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
                  "IVE verdict \xB7 driving the matrix \xB7 breaker ",
                  breaker
                ] }),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "font-mono text-sm font-bold uppercase tracking-wider",
                    style: { color: verdictColor(iveVerdict) },
                    children: [
                      iveVerdict,
                      /* @__PURE__ */ jsxs("span", { className: "ml-2 text-[10px] font-normal text-muted-foreground", children: [
                        "\xB7 ",
                        authorizedCount,
                        "/",
                        totalClaims,
                        " authorised \xB7",
                        " ",
                        (authRatio * 100).toFixed(0),
                        "%",
                        trippedCount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-red-400", children: [
                          " \xB7 ",
                          trippedCount,
                          " breaker",
                          trippedCount !== 1 && "s",
                          " tripped"
                        ] })
                      ] })
                    ]
                  }
                )
              ] })
            ] }),
            iveVerdict === "PROVEN" ? /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "border-emerald-500/40 text-[10px] font-mono uppercase tracking-wider text-emerald-400",
                children: "valve open \xB7 miles"
              }
            ) : breaker === "TRIPPED" ? /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "border-red-500/40 text-[10px] font-mono uppercase tracking-wider text-red-400",
                children: "valve tripped \xB7 pulsing red"
              }
            ) : /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "border-amber-500/40 text-[10px] font-mono uppercase tracking-wider text-amber-400",
                children: "valve held \xB7 web-spider"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: claims.map((c) => {
        const isPending = (pending == null ? void 0 : pending.claimId) === c.id || (pending == null ? void 0 : pending.claimId) === "__all__";
        const authInflight = isPending && (pending.type === "authorize" || pending.type === "revoke");
        const breakerInflight = isPending && (pending.type === "trip" || pending.type === "reset");
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex flex-col gap-2 rounded-md border border-border bg-card/40 px-3 py-2 md:flex-row md:items-center md:justify-between",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold tracking-tight text-foreground", children: c.title }),
                  c.safetyCritical && /* @__PURE__ */ jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "border-red-500/40 px-1 py-0 text-[9px] font-mono uppercase tracking-wider text-red-400",
                      children: "safety"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70", children: [
                  /* @__PURE__ */ jsx("span", { children: c.claimType }),
                  /* @__PURE__ */ jsx("span", { children: "\xB7" }),
                  /* @__PURE__ */ jsx("span", { children: c.intendedAction }),
                  /* @__PURE__ */ jsx("span", { children: "\xB7" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "state=",
                    c.state
                  ] })
                ] }),
                c.description && /* @__PURE__ */ jsx("div", { className: "mt-1 text-[10px] leading-relaxed text-muted-foreground", children: c.description })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 md:flex-nowrap", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1", children: [
                  c.authorized ? /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3 w-3 text-emerald-400" }) : /* @__PURE__ */ jsx(ShieldOff, { className: "h-3 w-3 text-muted-foreground" }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "font-mono text-[10px] uppercase tracking-wider",
                      style: {
                        color: c.authorized ? "#10b981" : "var(--muted-foreground)",
                        fontWeight: c.authorized ? 700 : 400
                      },
                      children: c.authorized ? "AUTH" : "no-auth"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "ml-1 flex gap-0.5", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleAuthorize(c.id, true),
                        disabled: isPending || c.authorized,
                        className: "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30",
                        style: {
                          background: c.authorized ? "color-mix(in oklab, #10b981 22%, transparent)" : "transparent",
                          border: "1px solid color-mix(in oklab, #10b981 35%, transparent)",
                          color: c.authorized ? "#10b981" : "var(--muted-foreground)",
                          cursor: isPending || c.authorized ? "default" : "pointer"
                        },
                        title: "Authorise this claim",
                        children: authInflight && (pending == null ? void 0 : pending.type) === "authorize" ? /* @__PURE__ */ jsx(Loader2, { className: "h-2.5 w-2.5 animate-spin" }) : "AUTH"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleAuthorize(c.id, false),
                        disabled: isPending || !c.authorized,
                        className: "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30",
                        style: {
                          background: !c.authorized ? "color-mix(in oklab, #e74c3c 22%, transparent)" : "transparent",
                          border: "1px solid color-mix(in oklab, #e74c3c 35%, transparent)",
                          color: !c.authorized ? "#e74c3c" : "var(--muted-foreground)",
                          cursor: isPending || !c.authorized ? "default" : "pointer"
                        },
                        title: "Revoke authorisation",
                        children: authInflight && (pending == null ? void 0 : pending.type) === "revoke" ? /* @__PURE__ */ jsx(Loader2, { className: "h-2.5 w-2.5 animate-spin" }) : "REVOKE"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1", children: [
                  c.breakerTripped ? /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 text-red-400" }) : /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 text-muted-foreground" }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "font-mono text-[10px] uppercase tracking-wider",
                      style: {
                        color: c.breakerTripped ? "#e74c3c" : "var(--muted-foreground)",
                        fontWeight: c.breakerTripped ? 700 : 400
                      },
                      children: c.breakerTripped ? "TRIP" : "normal"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "ml-1 flex gap-0.5", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleBreaker(c.id, true),
                        disabled: isPending || c.breakerTripped,
                        className: "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30",
                        style: {
                          background: c.breakerTripped ? "color-mix(in oklab, #e74c3c 22%, transparent)" : "transparent",
                          border: "1px solid color-mix(in oklab, #e74c3c 35%, transparent)",
                          color: c.breakerTripped ? "#e74c3c" : "var(--muted-foreground)",
                          cursor: isPending || c.breakerTripped ? "default" : "pointer"
                        },
                        title: "Trip the breaker on this claim",
                        children: breakerInflight && (pending == null ? void 0 : pending.type) === "trip" ? /* @__PURE__ */ jsx(Loader2, { className: "h-2.5 w-2.5 animate-spin" }) : "TRIP"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleBreaker(c.id, false),
                        disabled: isPending || !c.breakerTripped,
                        className: "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30",
                        style: {
                          background: !c.breakerTripped ? "color-mix(in oklab, #10b981 22%, transparent)" : "transparent",
                          border: "1px solid color-mix(in oklab, #10b981 35%, transparent)",
                          color: !c.breakerTripped ? "#10b981" : "var(--muted-foreground)",
                          cursor: isPending || !c.breakerTripped ? "default" : "pointer"
                        },
                        title: "Reset the breaker on this claim",
                        children: breakerInflight && (pending == null ? void 0 : pending.type) === "reset" ? /* @__PURE__ */ jsx(Loader2, { className: "h-2.5 w-2.5 animate-spin" }) : "RESET"
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          },
          c.id
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { children: error ? /* @__PURE__ */ jsx("span", { className: "text-red-400", children: error }) : "patch \u2192 poll \u2192 store \u2192 matrix" }),
        lastUpdatedAt && /* @__PURE__ */ jsxs("span", { children: [
          "store: ",
          new Date(lastUpdatedAt).toLocaleTimeString()
        ] })
      ] })
    ] })
  ] });
}
export {
  IveClaimInjector
};
