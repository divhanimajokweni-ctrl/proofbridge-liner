"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Flag
} from "lucide-react";
const ROADMAP = [
  {
    id: "G1",
    label: "Gate 1 \u2014 Charter",
    trackA: "Charter signed by founding directors",
    trackB: "Cap table v1 + bank account opened",
    status: "in-progress"
  },
  {
    id: "G2",
    label: "Gate 2 \u2014 Incorporation",
    trackA: "MOI filed with CIPC, CoR14.3 received",
    trackB: "Shareholders Agreement (SHA) executed",
    status: "blocked"
  },
  {
    id: "G3",
    label: "Gate 3 \u2014 Compliance",
    trackA: "SARS tax clearance + BBBEE affidavit",
    trackB: "Vendor master + IP assignment contracts",
    status: "pending"
  },
  {
    id: "G4",
    label: "Gate 4 \u2014 Audit",
    trackA: "First AGM minutes + auditor appointed",
    trackB: "Internal controls documented + SOX-style checklist",
    status: "pending"
  },
  {
    id: "G5",
    label: "Gate 5 \u2014 Annual Filing",
    trackA: "Annual return filed with CIPC",
    trackB: "Public disclosure + trust ledger reconciliation",
    status: "pending"
  }
];
const EXIT_REVIEW = [
  { id: "ER-02", label: "Charter scope & clauses", status: "go", note: "Approved by directors 2026-08-15" },
  { id: "ER-03", label: "Director registry + ID verification", status: "go", note: "3/3 directors verified" },
  { id: "ER-04", label: "CIPC reservation CoR9.1", status: "review", note: "Awaiting name reservation response" },
  { id: "ER-05", label: "Shareholders Agreement draft", status: "no-go", note: "Pre-emptive rights clause unresolved" },
  { id: "ER-06", label: "Bank signatory matrix", status: "no-go", note: "Two-signatory rule pending sign-off" }
];
function statusVisual(status) {
  switch (status) {
    case "done":
      return { label: "DONE", color: "text-emerald-400", bg: "bg-emerald-500/15", icon: CheckCircle2 };
    case "in-progress":
      return { label: "IN-PROGRESS", color: "text-amber-400", bg: "bg-amber-500/15", icon: Clock };
    case "blocked":
      return { label: "BLOCKED", color: "text-red-400", bg: "bg-red-500/15", icon: FileWarning };
    case "pending":
      return { label: "PENDING", color: "text-muted-foreground", bg: "bg-muted/40", icon: Flag };
  }
}
function GateRoadmap() {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "5-Gate Roadmap" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Two parallel tracks \u2014 Legal/Governance (A) and Commercial/Technical (B) \u2014 meet at each gate. No gate is exited until both tracks pass their exit review." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-2 lg:grid-cols-5", children: ROADMAP.map((step) => {
      const v = statusVisual(step.status);
      const Icon = v.icon;
      return /* @__PURE__ */ jsx(
        Card,
        {
          className: cn("relative border-l-2", v.bg),
          style: { borderLeftColor: "var(--vvu-studi)" },
          children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: "font-mono text-[10px] uppercase tracking-wider",
                  children: step.id
                }
              ),
              /* @__PURE__ */ jsx(Icon, { className: cn("h-3.5 w-3.5", v.color) })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "mt-2 text-xs font-semibold leading-tight", children: step.label }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70", children: "Track A \xB7 Legal" }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] leading-snug text-foreground/80", children: step.trackA })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70", children: "Track B \xB7 Commercial" }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] leading-snug text-foreground/80", children: step.trackB })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: cn("mt-2 font-mono text-[10px] font-bold", v.color), children: v.label })
          ] })
        },
        step.id
      );
    }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "Gate 1 \u2014 Exit Review" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider", children: [
          /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "NO-GO" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\xB7" }),
          /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "2 of 5 items unresolved" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: EXIT_REVIEW.map((item) => {
        const tone = item.status === "go" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : item.status === "review" ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-red-500/30 bg-red-500/5 text-red-400";
        const Icon = item.status === "go" ? CheckCircle2 : item.status === "review" ? Clock : AlertTriangle;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn("rounded-md border p-2.5", tone),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] font-bold uppercase tracking-wider", children: item.id }),
                /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] font-semibold leading-tight text-foreground", children: item.label }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-[10px] leading-snug text-muted-foreground", children: item.note }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 font-mono text-[10px] font-bold uppercase tracking-wider", children: item.status === "go" ? "GO" : item.status === "review" ? "REVIEW" : "NO-GO" })
            ]
          },
          item.id
        );
      }) }) })
    ] })
  ] });
}
export {
  GateRoadmap
};
