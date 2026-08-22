"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { StateBadge } from "@/components/ive/state-badge";
import { StateLattice } from "@/components/ive/state-lattice";
import { AuthorizationPanel } from "@/components/ive/authorization-panel";
import { EvidenceMeshPanel } from "@/components/ive/evidence-mesh-panel";
import { ParticipationRatioPanel } from "@/components/ive/participation-ratio-panel";
import { HeatKernelPanel } from "@/components/ive/heat-kernel-panel";
import { CircuitBreakerPanel } from "@/components/ive/circuit-breaker-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Database,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal
} from "lucide-react";
function IveClaimsPipeline() {
  var _a, _b, _c, _d, _e;
  const { toast } = useToast();
  const [state, setState] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(data);
      if (!selectedId && data.claims.length > 0) {
        setSelectedId(data.claims[0].id);
      }
    } catch (e) {
      toast({
        title: "Failed to load state",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedId, toast]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const seed = async () => {
    setActionLoading("seed");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Database seeded",
        description: `${data.count} demonstration claims created with full VVU stack.`
      });
      setSelectedId(null);
      await refresh();
    } catch (e) {
      toast({
        title: "Seed failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const ingestEvidence = async (claimId) => {
    setActionLoading(`ingest-${claimId}`);
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, seed: Math.floor(Math.random() * 1e4) })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Evidence ingested",
        description: `${Array.isArray(data.evidence) ? data.evidence.length : 1} item(s) from Evidence Mesh.`
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Ingest failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const verify = async (claimId) => {
    setActionLoading(`verify-${claimId}`);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Verification complete",
        description: `${data.trace.previousState} \u2192 ${data.trace.newState}`
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Verify failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const recomputeNInd = async (claimId) => {
    setActionLoading(`nind-${claimId}`);
    try {
      const res = await fetch("/api/n-ind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
      toast({
        title: "N_ind recomputed",
        description: "Participation ratio updated from current evidence set."
      });
    } catch (e) {
      toast({
        title: "N_ind failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const authorize = async (claimId, safetyOverride, reviewSignedOff) => {
    setActionLoading(`auth-${claimId}`);
    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, safetyOverride, reviewSignedOff })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: data.authorized ? "Authorized \u2713" : "Authorization blocked",
        description: data.authorized ? "A = C\u2227E\u2227I\u2227S\u2227R = true \u2014 action permitted." : "A = false \u2014 fail-closed. See reason for details.",
        variant: data.authorized ? "default" : "destructive"
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Authorize failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const createClaim = async (form) => {
    setActionLoading("create");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Claim created",
        description: `New ${form.claimType} claim: ${form.title}`
      });
      setShowCreate(false);
      setSelectedId(data.claim.id);
      await refresh();
    } catch (e) {
      toast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const selected = (_a = state == null ? void 0 : state.claims.find((c) => c.id === selectedId)) != null ? _a : null;
  const latestAuth = (_b = selected == null ? void 0 : selected.authorizations[0]) != null ? _b : null;
  const latestNInd = (_c = selected == null ? void 0 : selected.nIndRecords[0]) != null ? _c : null;
  const nIndResult = latestNInd ? {
    nInd: latestNInd.nInd,
    numEvidence: latestNInd.numEvidence,
    numSources: latestNInd.numSources,
    gamma: latestNInd.gamma,
    eigenvalues: latestNInd.eigenvalues
  } : null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/40 px-4 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(GitBranch, { className: "h-3 w-3" }),
          (_d = state == null ? void 0 : state.summary.evidenceBound) != null ? _d : "Claim \u2264 Evidence \u2264 Verification \u2264 Authorization \u2264 Action"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3 w-3" }),
          (_e = state == null ? void 0 : state.summary.authorizationFormula) != null ? _e : "A = C \u2227 E \u2227 I \u2227 S \u2227 R"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-emerald-400", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-3 w-3" }),
          "fail-closed"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: seed,
            disabled: actionLoading === "seed",
            children: [
              actionLoading === "seed" ? /* @__PURE__ */ jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "mr-1.5 h-3.5 w-3.5" }),
              "Seed demo"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => setShowCreate(true),
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
              "New claim"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: refresh, children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Refresh"
        ] })
      ] })
    ] }),
    state && /* @__PURE__ */ jsx("div", { className: "border-b bg-muted/20", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-[1600px] px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(Database, { className: "h-3.5 w-3.5" }),
          label: "Claims",
          value: state.summary.totalClaims
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
          label: "Authorized",
          value: state.summary.authorizedClaims,
          tone: "emerald"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(Activity, { className: "h-3.5 w-3.5" }),
          label: "Breakers tripped",
          value: state.summary.breakerTripped,
          tone: state.summary.breakerTripped > 0 ? "red" : "emerald"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(Terminal, { className: "h-3.5 w-3.5" }),
          label: "Evidence items",
          value: state.summary.totalEvidence
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(Layers, { className: "h-3.5 w-3.5" }),
          label: "Claim types",
          value: Object.keys(state.summary.stateCounts).length
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          icon: /* @__PURE__ */ jsx(GitBranch, { className: "h-3.5 w-3.5" }),
          label: "State values",
          value: Object.keys(state.summary.stateCounts).length
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 mx-auto max-w-[1400px] w-full px-4 py-4", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-24 gap-3", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground font-mono", children: "Loading IVE state from EIS backend\u2026" })
    ] }) : !state || state.claims.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { onSeed: seed, loading: actionLoading === "seed" }) : /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-[320px_1fr]", children: [
      /* @__PURE__ */ jsxs("aside", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between px-1 mb-1", children: /* @__PURE__ */ jsxs("h2", { className: "text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground", children: [
          "Claims (",
          state.claims.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-1.5", children: state.claims.map((c) => {
          const auth = c.authorizations[0];
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedId(c.id),
              className: `w-full text-left rounded-md border p-2.5 transition-colors ${selectedId === c.id ? "border-foreground bg-accent" : "border-border bg-card hover:bg-accent/50"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold leading-tight line-clamp-2 flex-1", children: c.title }),
                  /* @__PURE__ */ jsx(StateBadge, { state: c.state, size: "sm" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] font-mono text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wider", children: c.claimType }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      c.evidence.length,
                      " ev"
                    ] }),
                    auth && /* @__PURE__ */ jsxs(
                      "span",
                      {
                        className: auth.authorized ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                        children: [
                          "A=",
                          auth.authorized ? "\u2713" : "\u2717"
                        ]
                      }
                    )
                  ] })
                ] })
              ]
            },
            c.id
          );
        }) })
      ] }),
      selected && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: selected.claimType }),
                selected.safetyCritical && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded", children: "safety-critical" })
              ] }),
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base leading-tight", children: selected.title })
            ] }),
            /* @__PURE__ */ jsx(StateBadge, { state: selected.state, size: "lg" })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed mb-3", children: selected.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => ingestEvidence(selected.id),
                  disabled: actionLoading == null ? void 0 : actionLoading.startsWith("ingest-"),
                  children: [
                    /* @__PURE__ */ jsx(Database, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "Ingest evidence"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => verify(selected.id),
                  disabled: actionLoading == null ? void 0 : actionLoading.startsWith("verify-"),
                  children: [
                    /* @__PURE__ */ jsx(GitBranch, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "Verify (IVE)"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => recomputeNInd(selected.id),
                  disabled: actionLoading == null ? void 0 : actionLoading.startsWith("nind-"),
                  children: [
                    /* @__PURE__ */ jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "N_ind"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  onClick: () => authorize(selected.id, false, false),
                  disabled: actionLoading == null ? void 0 : actionLoading.startsWith("auth-"),
                  children: [
                    /* @__PURE__ */ jsx(ShieldCheck, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "Authorize"
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Tabs, { defaultValue: "pipeline", className: "w-full", children: [
          /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2 sm:grid-cols-4 h-auto", children: [
            /* @__PURE__ */ jsx(TabsTrigger, { value: "pipeline", className: "text-xs", children: "Pipeline" }),
            /* @__PURE__ */ jsx(TabsTrigger, { value: "lattice", className: "text-xs", children: "State Lattice" }),
            /* @__PURE__ */ jsx(TabsTrigger, { value: "diffusion", className: "text-xs", children: "Diffusion" }),
            /* @__PURE__ */ jsx(TabsTrigger, { value: "raw", className: "text-xs", children: "Raw State" })
          ] }),
          /* @__PURE__ */ jsx(TabsContent, { value: "pipeline", className: "mt-4 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsx(
              EvidenceMeshPanel,
              {
                evidence: selected.evidence,
                onIngest: () => ingestEvidence(selected.id),
                loading: actionLoading == null ? void 0 : actionLoading.startsWith("ingest-")
              }
            ),
            /* @__PURE__ */ jsx(
              AuthorizationPanel,
              {
                auth: latestAuth,
                safetyCritical: selected.safetyCritical,
                onAuthorize: (s, r) => authorize(selected.id, s, r),
                loading: actionLoading == null ? void 0 : actionLoading.startsWith("auth-")
              }
            ),
            /* @__PURE__ */ jsx(
              ParticipationRatioPanel,
              {
                result: nIndResult,
                threshold: selected.safetyCritical ? 2 : 1,
                loading: actionLoading == null ? void 0 : actionLoading.startsWith("nind-"),
                onRecompute: () => recomputeNInd(selected.id)
              }
            ),
            /* @__PURE__ */ jsx(
              CircuitBreakerPanel,
              {
                events: selected.circuitEvents,
                safetyCritical: selected.safetyCritical
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(TabsContent, { value: "lattice", className: "mt-4", children: [
            /* @__PURE__ */ jsx(StateLattice, { currentState: selected.state }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight mb-2", children: "Evidence Contribution" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: selected.evidence.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground font-mono py-4 text-center", children: [
                  "No evidence yet. Click ",
                  /* @__PURE__ */ jsx("em", { children: "Ingest evidence" }),
                  "."
                ] }) : selected.evidence.map((e) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "flex items-center justify-between rounded border bg-card p-2 text-xs",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: e.source }),
                        /* @__PURE__ */ jsxs("span", { className: "truncate text-muted-foreground", children: [
                          e.content.slice(0, 50),
                          e.content.length > 50 ? "\u2026" : ""
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx(StateBadge, { state: e.state, size: "sm" })
                    ]
                  },
                  e.id
                )) })
              ] }),
              /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight mb-2", children: "Authorization History" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: selected.authorizations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground font-mono py-4 text-center", children: "No authorization records yet." }) : selected.authorizations.slice(0, 10).map((a) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "rounded border bg-card p-2 text-xs",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                        /* @__PURE__ */ jsxs(
                          "span",
                          {
                            className: `font-mono font-bold ${a.authorized ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`,
                            children: [
                              "A = ",
                              a.authorized ? "TRUE" : "FALSE"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-mono", children: new Date(a.createdAt).toLocaleTimeString() })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 font-mono text-[10px]", children: [
                        ["C", a.claimOk],
                        ["E", a.evidenceOk],
                        ["I", a.integrityOk],
                        ["S", a.safetyOk],
                        ["R", a.reviewOk]
                      ].map(([sym, ok]) => /* @__PURE__ */ jsxs(
                        "span",
                        {
                          className: ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                          children: [
                            sym,
                            "=",
                            ok ? "\u2713" : "\u2717"
                          ]
                        },
                        sym
                      )) })
                    ]
                  },
                  a.id
                )) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(TabsContent, { value: "diffusion", className: "mt-4", children: [
            /* @__PURE__ */ jsx(HeatKernelPanel, { claimId: selected.id, topology: "evidence" }),
            /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(HeatKernelPanel, { topology: "cycle" }) })
          ] }),
          /* @__PURE__ */ jsx(TabsContent, { value: "raw", className: "mt-4", children: /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight mb-3", children: "Raw EIS state" }),
            /* @__PURE__ */ jsx("pre", { className: "text-[10px] font-mono leading-relaxed overflow-x-auto rounded border bg-muted/30 p-3 max-h-[600px] overflow-y-auto", children: JSON.stringify(selected, null, 2) })
          ] }) })
        ] })
      ] })
    ] }) }),
    showCreate && /* @__PURE__ */ jsx(
      CreateClaimModal,
      {
        onClose: () => setShowCreate(false),
        onCreate: createClaim,
        loading: actionLoading === "create"
      }
    )
  ] });
}
function SummaryCard({
  icon,
  label,
  value,
  tone = "default"
}) {
  const toneClass = tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : tone === "red" ? "text-red-600 dark:text-red-400" : "text-foreground";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card p-2.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: `font-mono text-lg font-bold ${toneClass}`, children: value })
  ] });
}
function EmptyState({ onSeed, loading }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-24 gap-4 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-muted", children: /* @__PURE__ */ jsx(Layers, { className: "h-8 w-8 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight mb-1", children: "No claims in the IVE yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground max-w-md", children: "Seed the database with three demonstration claims that exercise the full VVU stack \u2014 or create a new claim from scratch." })
    ] }),
    /* @__PURE__ */ jsxs(Button, { onClick: onSeed, disabled: loading, children: [
      loading ? /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
      "Seed demonstration claims"
    ] })
  ] });
}
function CreateClaimModal({
  onClose,
  onCreate,
  loading
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claimType, setClaimType] = useState("empirical");
  const [intendedAction, setIntendedAction] = useState("deploy");
  const [safetyCritical, setSafetyCritical] = useState(true);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "w-full max-w-md rounded-lg border bg-card p-6 shadow-lg",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight mb-4", children: "New claim" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-mono uppercase tracking-wider text-muted-foreground", children: "Title" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: title,
                    onChange: (e) => setTitle(e.target.value),
                    className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm",
                    placeholder: "e.g. Model accuracy \u2265 95%"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-mono uppercase tracking-wider text-muted-foreground", children: "Description" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: description,
                    onChange: (e) => setDescription(e.target.value),
                    className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]",
                    placeholder: "Describe the proposition that needs verification\u2026"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-mono uppercase tracking-wider text-muted-foreground", children: "Claim type" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: claimType,
                      onChange: (e) => setClaimType(e.target.value),
                      className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "mathematical", children: "mathematical (cap: PROVEN)" }),
                        /* @__PURE__ */ jsx("option", { value: "semantic", children: "semantic (cap: VERIFIED)" }),
                        /* @__PURE__ */ jsx("option", { value: "empirical", children: "empirical (cap: SUPPORTED)" }),
                        /* @__PURE__ */ jsx("option", { value: "operational", children: "operational (cap: OBSERVED)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-mono uppercase tracking-wider text-muted-foreground", children: "Intended action" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: intendedAction,
                      onChange: (e) => setIntendedAction(e.target.value),
                      className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: safetyCritical,
                    onChange: (e) => setSafetyCritical(e.target.checked),
                    className: "rounded"
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: "Safety-critical (requires S + R conjuncts)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "Cancel" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  onClick: () => onCreate({ title, description, claimType, intendedAction, safetyCritical }),
                  disabled: !title || loading,
                  children: loading ? "Creating\u2026" : "Create claim"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
export {
  IveClaimsPipeline
};
