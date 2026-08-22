"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, History, Plus } from "lucide-react";
const DOCS = [
  {
    id: "DOC-MOI",
    name: "Memorandum of Incorporation",
    abbr: "MOI",
    version: "v0.3-draft",
    status: "Draft",
    custodian: "Founding directors",
    updated: "2026-08-17"
  },
  {
    id: "DOC-SHA",
    name: "Shareholders Agreement",
    abbr: "SHA",
    version: "v0.2-draft",
    status: "Draft",
    custodian: "Founding directors",
    updated: "2026-08-14"
  },
  {
    id: "DOC-CHT",
    name: "Founding Charter",
    abbr: "CHT",
    version: "v1.0",
    status: "Certified",
    custodian: "VVU STUDI Engine",
    updated: "2026-08-15"
  },
  {
    id: "DOC-TRD",
    name: "Trust Deed \u2014 VVU Trust",
    abbr: "TRD",
    version: "v0.1-draft",
    status: "Pending",
    custodian: "Trustees (TBD)",
    updated: "\u2014"
  },
  {
    id: "DOC-DIR",
    name: "Director Registry",
    abbr: "DIR",
    version: "v1.0",
    status: "Certified",
    custodian: "VVU STUDI Engine",
    updated: "2026-08-15"
  },
  {
    id: "DOC-BNK",
    name: "Bank Signatory Matrix",
    abbr: "BNK",
    version: "v0.1-draft",
    status: "Draft",
    custodian: "CFO",
    updated: "2026-08-12"
  }
];
function tone(status) {
  switch (status) {
    case "Certified":
      return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
    case "Draft":
      return "border-amber-500/30 bg-amber-500/5 text-amber-400";
    case "Pending":
      return "border-red-500/30 bg-red-500/5 text-red-400";
    case "Superseded":
      return "border-muted/30 bg-muted/5 text-muted-foreground line-through";
  }
}
function GoverningDocs() {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Governing Documents" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "The canonical document set bound into the STUDI certification seal." })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent/40", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
        "New document"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: DOCS.map((d) => /* @__PURE__ */ jsxs(Card, { className: "border-border/70", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold leading-tight", children: d.name })
        ] }),
        /* @__PURE__ */ jsx(
          Badge,
          {
            variant: "outline",
            className: "font-mono text-[9px] uppercase",
            children: d.abbr
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 pt-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] font-mono", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: d.version }),
          /* @__PURE__ */ jsx("span", { className: `rounded border px-1.5 py-0.5 font-bold uppercase ${tone(d.status)}`, children: d.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
          "Custodian: ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: d.custodian })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70", children: [
          /* @__PURE__ */ jsx(History, { className: "h-3 w-3" }),
          "Last update: ",
          d.updated
        ] })
      ] })
    ] }, d.id)) })
  ] });
}
export {
  GoverningDocs
};
