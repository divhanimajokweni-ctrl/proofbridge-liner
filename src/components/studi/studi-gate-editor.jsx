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
import { useTheoremStore } from "@/lib/theorem/theorem-store";
import { RotateCcw, Loader2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
const STATUS_GROUPS = [
  {
    bucket: "PROVEN",
    label: "Met",
    statuses: ["GO", "FILED", "RESOLVED"],
    color: "#10b981"
  },
  {
    bucket: "INCONCLUSIVE",
    label: "Draft",
    statuses: ["DRAFT", "READY"],
    color: "#e67e22"
  },
  {
    bucket: "UNKNOWN",
    label: "Blocked",
    statuses: ["PENDING", "NOT-FILED", "BLOCKED"],
    color: "#e74c3c"
  }
];
function statusBucket(s) {
  for (const g of STATUS_GROUPS) {
    if (g.statuses.includes(s)) return g.bucket;
  }
  return "UNKNOWN";
}
function bucketColor(b) {
  if (b === "PROVEN") return "#10b981";
  if (b === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}
const ALL_STATUSES = STATUS_GROUPS.flatMap((g) => g.statuses);
function StudiGateEditor() {
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const [gates, setGates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState(null);
  const [error, setError] = useState(null);
  const fetchGates = async () => {
    var _a;
    try {
      const res = await fetch("/api/theorem-state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGates((_a = data.studiGates) != null ? _a : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void fetchGates();
  }, []);
  const handleFlip = async (slug, nextStatus) => {
    if (!gates) return;
    const prev = gates.find((g) => g.slug === slug);
    if (!prev || prev.status === nextStatus) return;
    setUpdatingSlug(slug);
    setGates(
      (cur) => (cur != null ? cur : []).map((g) => g.slug === slug ? __spreadProps(__spreadValues({}, g), { status: nextStatus }) : g)
    );
    try {
      const res = await fetch(
        `/api/theorem-state/gates/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await fetchGates();
    } catch (e) {
      setGates(
        (cur) => (cur != null ? cur : []).map(
          (g) => g.slug === slug && prev ? __spreadProps(__spreadValues({}, g), { status: prev.status }) : g
        )
      );
      setError(e instanceof Error ? e.message : "patch failed");
    } finally {
      setUpdatingSlug(null);
    }
  };
  const handleResetAll = async () => {
    var _a;
    if (!gates) return;
    setUpdatingSlug("__all__");
    const baseline = {
      charter: "DRAFT",
      moi: "DRAFT",
      sha: "PENDING",
      cipc: "NOT-FILED",
      audit: "READY",
      "trust-bound": "READY"
    };
    for (const g of gates) {
      const target = (_a = baseline[g.slug]) != null ? _a : "PENDING";
      if (g.status !== target) {
        await fetch(`/api/theorem-state/gates/${g.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target })
        });
      }
    }
    await fetchGates();
    setUpdatingSlug(null);
  };
  if (loading && !gates) {
    return /* @__PURE__ */ jsx(Card, { className: "border-border/70", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center gap-2 py-8 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      "Loading gates\u2026"
    ] }) });
  }
  if (error && !gates) {
    return /* @__PURE__ */ jsx(Card, { className: "border-red-500/40", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center gap-2 py-6 text-xs text-red-400", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
      error
    ] }) });
  }
  const allMet = (gates != null ? gates : []).every(
    (g) => ["GO", "FILED", "RESOLVED"].includes(g.status)
  );
  return /* @__PURE__ */ jsxs(Card, { className: "border-vvu-studi/30", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5 text-vvu-studi", style: { color: "var(--vvu-studi)" } }),
        "Governance Gate Editor",
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "\xB7 valve demo" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleResetAll,
          disabled: updatingSlug !== null,
          className: "flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50",
          title: "Reset all gates to baseline seed status",
          children: [
            /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
            "Reset"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between rounded-md border px-3 py-2",
          style: {
            borderColor: `color-mix(in oklab, ${bucketColor(studiVerdict)} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${bucketColor(studiVerdict)} 8%, transparent)`
          },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              studiVerdict === "PROVEN" ? /* @__PURE__ */ jsx(
                CheckCircle2,
                {
                  className: "h-4 w-4",
                  style: { color: bucketColor(studiVerdict) }
                }
              ) : /* @__PURE__ */ jsx(
                AlertTriangle,
                {
                  className: "h-4 w-4",
                  style: { color: bucketColor(studiVerdict) }
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "STUDI verdict \xB7 driving the matrix" }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "font-mono text-sm font-bold uppercase tracking-wider",
                    style: { color: bucketColor(studiVerdict) },
                    children: studiVerdict
                  }
                )
              ] })
            ] }),
            allMet ? /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "border-emerald-500/40 text-[10px] font-mono uppercase tracking-wider text-emerald-400",
                children: "valve open"
              }
            ) : /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "border-red-500/40 text-[10px] font-mono uppercase tracking-wider text-red-400",
                children: "valve closed"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: (gates != null ? gates : []).map((g) => {
        const b = statusBucket(g.status);
        const isUpdating = updatingSlug === g.slug || updatingSlug === "__all__";
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[200px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold tracking-tight text-foreground", children: g.label }),
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60", children: g.slug })
                ] }),
                g.description && /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-[10px] leading-relaxed text-muted-foreground", children: g.description })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-1", children: ALL_STATUSES.map((s) => {
                const sg = STATUS_GROUPS.find((g2) => g2.statuses.includes(s));
                const active = g.status === s;
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleFlip(g.slug, s),
                    disabled: isUpdating,
                    className: "rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-50",
                    style: {
                      background: active ? `color-mix(in oklab, ${sg.color} 22%, transparent)` : "transparent",
                      border: `1px solid color-mix(in oklab, ${sg.color} ${active ? "55%" : "25%"}, transparent)`,
                      color: active ? sg.color : "var(--muted-foreground)",
                      cursor: isUpdating ? "wait" : "pointer",
                      fontWeight: active ? 700 : 400
                    },
                    title: `Set ${g.label} \u2192 ${s}`,
                    children: s
                  },
                  s
                );
              }) })
            ]
          },
          g.slug
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
  StudiGateEditor
};
