"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Fingerprint, ShieldCheck, Stamp } from "lucide-react";
const DOCUMENTS = [
  {
    id: "DOC-MOI",
    name: "Memorandum of Incorporation",
    abbr: "MOI",
    version: "v0.3-draft",
    checksum: "0x7af2\u2026b913",
    status: "Draft",
    certifiedAt: null
  },
  {
    id: "DOC-SHA",
    name: "Shareholders Agreement",
    abbr: "SHA",
    version: "v0.2-draft",
    checksum: "0x4e21\u20269c40",
    status: "Draft",
    certifiedAt: null
  },
  {
    id: "DOC-CHT",
    name: "Founding Charter",
    abbr: "CHT",
    version: "v1.0",
    checksum: "0xab12\u2026cd34",
    status: "Certified",
    certifiedAt: "2026-08-15"
  },
  {
    id: "DOC-TRD",
    name: "Trust Deed \u2014 Venture Vision Ubuntu Trust",
    abbr: "TRD",
    version: "v0.1-draft",
    checksum: "0xfe98\u202610aa",
    status: "Pending",
    certifiedAt: null
  },
  {
    id: "DOC-DIR",
    name: "Director Registry & ID Pack",
    abbr: "DIR",
    version: "v1.0",
    checksum: "0x9911\u20262233",
    status: "Certified",
    certifiedAt: "2026-08-15"
  },
  {
    id: "DOC-BNK",
    name: "Bank Signatory Matrix \u2014 FNB Business",
    abbr: "BNK",
    version: "v0.1-draft",
    checksum: "0x44aa\u202677cc",
    status: "Draft",
    certifiedAt: null
  },
  {
    id: "DOC-IP",
    name: "IP Assignment \u2014 EIS Theorems",
    abbr: "IP",
    version: "v0.1-draft",
    checksum: "0x0c11\u2026beef",
    status: "Pending",
    certifiedAt: null
  },
  {
    id: "DOC-OLD-MOI",
    name: "Pre-merger CoR14.1 (VVU Eng.)",
    abbr: "OLD",
    version: "v1.0",
    checksum: "0xdead\u2026beef",
    status: "Superseded",
    certifiedAt: "2026-04-10"
  }
];
function statusBadge(status) {
  switch (status) {
    case "Certified":
      return /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "Certified" });
    case "Draft":
      return /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "Draft" });
    case "Pending":
      return /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "Pending" });
    case "Superseded":
      return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground line-through", children: "Superseded" });
  }
}
function DocCertificate() {
  const certified = DOCUMENTS.filter((d) => d.status === "Certified").length;
  const total = DOCUMENTS.length;
  const sealStatus = certified === total ? "CERTIFIED" : "DRAFT";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Doc Certificate" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Master certification seal binding every governing document to its hash, version, and signature chain. Issued by the VVU STUDI Governance Engine." })
    ] }),
    /* @__PURE__ */ jsx(
      Card,
      {
        className: "border-vvu-studi/40 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-studi)_10%,card)]",
        children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex h-32 w-32 shrink-0 items-center justify-center", children: [
            /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 120 120", className: "h-32 w-32", children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "seal-grad", x1: "0", y1: "0", x2: "120", y2: "120", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--vvu-studi)" }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--vvu-gold)" })
              ] }) }),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: "60",
                  cy: "60",
                  r: "55",
                  stroke: "url(#seal-grad)",
                  strokeWidth: "2.5",
                  fill: "none"
                }
              ),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: "60",
                  cy: "60",
                  r: "48",
                  stroke: "url(#seal-grad)",
                  strokeWidth: "1",
                  fill: "none",
                  opacity: "0.5"
                }
              ),
              Array.from({ length: 24 }).map((_, i) => {
                const angle = i / 24 * Math.PI * 2;
                const r1 = 51;
                const r2 = 55;
                const x1 = 60 + Math.cos(angle) * r1;
                const y1 = 60 + Math.sin(angle) * r1;
                const x2 = 60 + Math.cos(angle) * r2;
                const y2 = 60 + Math.sin(angle) * r2;
                return /* @__PURE__ */ jsx(
                  "line",
                  {
                    x1,
                    y1,
                    x2,
                    y2,
                    stroke: "url(#seal-grad)",
                    strokeWidth: "1"
                  },
                  i
                );
              }),
              /* @__PURE__ */ jsx(
                ShieldCheck,
                {
                  x: "36",
                  y: "36",
                  width: "48",
                  height: "48",
                  style: { color: "var(--vvu-gold)" }
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "absolute -bottom-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                style: {
                  backgroundColor: sealStatus === "CERTIFIED" ? "var(--vvu-ive)" : "oklch(0.7 0.18 65)",
                  color: "oklch(0.145 0 0)"
                },
                children: sealStatus
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Stamp, { className: "h-4 w-4 text-vvu-studi", style: { color: "var(--vvu-studi)" } }),
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight", children: "Document Certification Seal" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Venture Vision Ubuntu (PTY) LTD \u2014 CoR pending \xB7 Issued by the VVU STUDI Governance Engine" }),
            /* @__PURE__ */ jsxs("dl", { className: "mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-mono", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Issuer" }),
                /* @__PURE__ */ jsx("dd", { className: "text-foreground", children: "VVU STUDI Governance Engine" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Status" }),
                /* @__PURE__ */ jsx(
                  "dd",
                  {
                    className: cn(
                      sealStatus === "CERTIFIED" ? "text-emerald-400" : "text-amber-400"
                    ),
                    children: sealStatus === "CERTIFIED" ? "CERTIFIED \u2014 filed" : "DRAFT \u2014 not yet filed with CIPC"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Bound documents" }),
                /* @__PURE__ */ jsxs("dd", { className: "text-foreground", children: [
                  certified,
                  " / ",
                  total
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Seal ID" }),
                /* @__PURE__ */ jsx("dd", { className: "text-foreground", children: "SEAL-2026-08-18-001" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Seal root hash" }),
                /* @__PURE__ */ jsx("dd", { className: "text-foreground truncate", children: "0x9c4f1a\u202677e2b0" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground/70", children: "Previous seal" }),
                /* @__PURE__ */ jsx("dd", { className: "text-muted-foreground", children: "none (initial)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-1.5 rounded border border-vvu-studi/30 bg-card/60 px-2.5 py-1.5 text-[10px] font-mono", children: [
              /* @__PURE__ */ jsx(Fingerprint, { className: "h-3 w-3", style: { color: "var(--vvu-studi)" } }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Merkle root over the document set \u2014 recomputed on every status change. Any retroactive edit invalidates the seal." })
            ] })
          ] })
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold tracking-tight", children: "Cross-Reference Table \u2014 All Governing Documents" }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "pl-4 text-[10px] uppercase tracking-wider", children: "ID" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Document" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Abbr" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Version" }),
          /* @__PURE__ */ jsx(TableHead, { className: "font-mono text-[10px] uppercase tracking-wider", children: "Checksum" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-[10px] uppercase tracking-wider", children: "Certified" }),
          /* @__PURE__ */ jsx(TableHead, { className: "pr-4 text-right text-[10px] uppercase tracking-wider", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: DOCUMENTS.map((d) => {
          var _a;
          return /* @__PURE__ */ jsxs(
            TableRow,
            {
              className: "text-xs hover:bg-accent/40",
              children: [
                /* @__PURE__ */ jsx(TableCell, { className: "pl-4 font-mono text-[11px] text-muted-foreground", children: d.id }),
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: d.name }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: "font-mono text-[10px]",
                    children: d.abbr
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[11px] text-muted-foreground", children: d.version }),
                /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[11px] text-muted-foreground", children: d.checksum }),
                /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-[11px] text-muted-foreground", children: (_a = d.certifiedAt) != null ? _a : "\u2014" }),
                /* @__PURE__ */ jsx(TableCell, { className: "pr-4 text-right font-mono text-[11px] font-bold", children: statusBadge(d.status) })
              ]
            },
            d.id
          );
        }) })
      ] }) })
    ] })
  ] });
}
export {
  DocCertificate
};
