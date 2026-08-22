"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
  BookOpenCheck,
  Box,
  Boxes,
  CircuitBoard,
  Cpu,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  HelpCircle,
  Layers,
  Lock,
  Network,
  Plug,
  ScrollText,
  ShieldCheck,
  Signature,
  Sparkles,
  Workflow
} from "lucide-react";
const STUDI_SECTIONS = [
  {
    title: "CORE",
    items: [
      { id: "studi-overview", label: "Overview", abbr: "OV", icon: Layers },
      { id: "studi-gate-roadmap", label: "5-Gate Roadmap", abbr: "5G", icon: Workflow },
      { id: "studi-doc-cert", label: "Doc Certificate", abbr: "DOC", icon: FileCheck2 },
      { id: "studi-governing-docs", label: "Governing Docs", abbr: "GOV", icon: FileText }
    ]
  },
  {
    title: "RELEASE",
    items: [
      { id: "studi-charter", label: "Charter", abbr: "CHT", icon: ScrollText },
      { id: "studi-cipc", label: "CIPC Filing", abbr: "CIPC", icon: Signature },
      { id: "studi-audit", label: "Audit Trail", abbr: "AUD", icon: BookOpenCheck }
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { id: "studi-trust-bound", label: "Trust Bound", abbr: "TB", icon: Lock },
      { id: "studi-fail-closed", label: "Fail-Closed", abbr: "FC", icon: ShieldCheck },
      { id: "studi-evolution-matrix", label: "Evolution Matrix", abbr: "EM", icon: Sparkles },
      { id: "valve-cockpit", label: "Valve Cockpit", abbr: "VC", icon: Gauge }
    ]
  }
];
const IVE_SECTIONS = [
  {
    title: "CORE",
    items: [
      { id: "ive-overview", label: "IVE Overview", abbr: "OV", icon: Layers },
      { id: "ive-trust-sphere", label: "Trust Sphere", abbr: "TS", icon: Network },
      { id: "ive-claims", label: "Claims Pipeline", abbr: "CP", icon: GitBranch },
      { id: "ive-evidence-runtime", label: "Evidence Runtime", abbr: "ER", icon: Database }
    ]
  },
  {
    title: "RELEASE",
    items: [
      { id: "ive-release", label: "Release Report", abbr: "RR", icon: FileCheck2 },
      { id: "ive-adapter", label: "Adapter Attribution", abbr: "ADP", icon: Boxes },
      { id: "ive-integrity", label: "Integrity Closure", abbr: "INT", icon: Lock },
      { id: "ive-acceptance", label: "Acceptance", abbr: "ACC", icon: ShieldCheck }
    ]
  },
  {
    title: "RUNTIME",
    items: [
      { id: "ive-plugins", label: "Plugin Registry", abbr: "PR", icon: Plug },
      { id: "ive-amd", label: "AMD Runtime", abbr: "AMD", icon: Cpu },
      { id: "ive-zoo", label: "Zoo Runtime", abbr: "ZOO", icon: CircuitBoard }
    ]
  },
  {
    title: "CASE STUDY",
    items: [
      { id: "ive-hbk", label: "HBK Workspace", abbr: "HBA", icon: Box },
      { id: "ive-cad", label: "CAD Viewer", abbr: "CAD", icon: Boxes }
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { id: "ive-webhook", label: "Webhook Delivery", abbr: "WH", icon: CircuitBoard },
      { id: "ive-evolution-matrix", label: "Evolution Matrix", abbr: "EM", icon: Sparkles },
      { id: "valve-cockpit", label: "Valve Cockpit", abbr: "VC", icon: Gauge },
      { id: "ive-help", label: "Help & FAQ", abbr: "FAQ", icon: HelpCircle }
    ]
  }
];
function SidebarNav({ activeSection, onSectionChange }) {
  const { workspace } = useWorkspace();
  const sections = workspace === "studi" ? STUDI_SECTIONS : IVE_SECTIONS;
  return /* @__PURE__ */ jsx("nav", { className: "flex flex-col gap-5 px-2 py-3", children: sections.map((section) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx("h3", { className: "px-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70", children: section.title }),
    /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: section.items.map((item) => {
      const Icon = item.icon;
      const active = activeSection === item.id;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onSectionChange(item.id),
          className: cn(
            "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
            active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          ),
          style: active ? { boxShadow: "inset 2px 0 0 0 var(--vvu-gold)" } : void 0,
          children: [
            /* @__PURE__ */ jsx(
              Icon,
              {
                className: cn(
                  "h-3.5 w-3.5 shrink-0",
                  active ? "text-vvu-gold" : "text-muted-foreground"
                ),
                style: active ? { color: "var(--vvu-gold)" } : void 0
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: item.label }),
            /* @__PURE__ */ jsx("span", { className: "ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60", children: item.abbr })
          ]
        },
        item.id
      );
    }) })
  ] }, section.title)) });
}
export {
  SidebarNav
};
