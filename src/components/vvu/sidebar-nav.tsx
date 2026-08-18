"use client";

/**
 * SidebarNav — section-grouped navigation that changes per workspace.
 *
 * Sections (from deployed Vercel IVE):
 *   STUDI:  CORE (Overview, 5-Gate Roadmap, Doc Certificate, Governing Docs)
 *           RELEASE (Charter, CIPC Filing, Audit Trail)
 *           SYSTEM (Trust Bound, Fail-Closed)
 *   IVE:    CORE (Overview, Trust Sphere, Proof Graph, Evidence Runtime)
 *           RELEASE (Release Report, Adapter Attribution, Integrity Closure, Acceptance, Identity Registry)
 *           RUNTIME (Plugin Registry, AMD Runtime, Zoo Runtime)
 *           CASE STUDY (HBK Workspace, CAD Viewer)
 *           SYSTEM (Help & FAQ, Webhook Delivery)
 *
 * In this single-page app, nav items set the active "section" state in the
 * parent shell — they don't (yet) route to separate URLs.
 */

import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
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
  Workflow,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  abbr: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const STUDI_SECTIONS: NavSection[] = [
  {
    title: "CORE",
    items: [
      { id: "studi-overview", label: "Overview", abbr: "OV", icon: Layers },
      { id: "studi-gate-roadmap", label: "5-Gate Roadmap", abbr: "5G", icon: Workflow },
      { id: "studi-doc-cert", label: "Doc Certificate", abbr: "DOC", icon: FileCheck2 },
      { id: "studi-governing-docs", label: "Governing Docs", abbr: "GOV", icon: FileText },
    ],
  },
  {
    title: "RELEASE",
    items: [
      { id: "studi-charter", label: "Charter", abbr: "CHT", icon: ScrollText },
      { id: "studi-cipc", label: "CIPC Filing", abbr: "CIPC", icon: Signature },
      { id: "studi-audit", label: "Audit Trail", abbr: "AUD", icon: BookOpenCheck },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { id: "studi-trust-bound", label: "Trust Bound", abbr: "TB", icon: Lock },
      { id: "studi-fail-closed", label: "Fail-Closed", abbr: "FC", icon: ShieldCheck },
      { id: "studi-evolution-matrix", label: "Evolution Matrix", abbr: "EM", icon: Sparkles },
      { id: "valve-cockpit", label: "Valve Cockpit", abbr: "VC", icon: Gauge },
    ],
  },
];

const IVE_SECTIONS: NavSection[] = [
  {
    title: "CORE",
    items: [
      { id: "ive-overview", label: "IVE Overview", abbr: "OV", icon: Layers },
      { id: "ive-trust-sphere", label: "Trust Sphere", abbr: "TS", icon: Network },
      { id: "ive-claims", label: "Claims Pipeline", abbr: "CP", icon: GitBranch },
      { id: "ive-evidence-runtime", label: "Evidence Runtime", abbr: "ER", icon: Database },
    ],
  },
  {
    title: "RELEASE",
    items: [
      { id: "ive-release", label: "Release Report", abbr: "RR", icon: FileCheck2 },
      { id: "ive-adapter", label: "Adapter Attribution", abbr: "ADP", icon: Boxes },
      { id: "ive-integrity", label: "Integrity Closure", abbr: "INT", icon: Lock },
      { id: "ive-acceptance", label: "Acceptance", abbr: "ACC", icon: ShieldCheck },
    ],
  },
  {
    title: "RUNTIME",
    items: [
      { id: "ive-plugins", label: "Plugin Registry", abbr: "PR", icon: Plug },
      { id: "ive-amd", label: "AMD Runtime", abbr: "AMD", icon: Cpu },
      { id: "ive-zoo", label: "Zoo Runtime", abbr: "ZOO", icon: CircuitBoard },
    ],
  },
  {
    title: "CASE STUDY",
    items: [
      { id: "ive-hbk", label: "HBK Workspace", abbr: "HBA", icon: Box },
      { id: "ive-cad", label: "CAD Viewer", abbr: "CAD", icon: Boxes },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { id: "ive-webhook", label: "Webhook Delivery", abbr: "WH", icon: CircuitBoard },
      { id: "ive-evolution-matrix", label: "Evolution Matrix", abbr: "EM", icon: Sparkles },
      { id: "valve-cockpit", label: "Valve Cockpit", abbr: "VC", icon: Gauge },
      { id: "ive-help", label: "Help & FAQ", abbr: "FAQ", icon: HelpCircle },
    ],
  },
];

interface SidebarNavProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export function SidebarNav({ activeSection, onSectionChange }: SidebarNavProps) {
  const { workspace } = useWorkspace();
  const sections = workspace === "studi" ? STUDI_SECTIONS : IVE_SECTIONS;

  return (
    <nav className="flex flex-col gap-5 px-2 py-3">
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <h3 className="px-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            {section.title}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                    active
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  )}
                  style={
                    active
                      ? { boxShadow: "inset 2px 0 0 0 var(--vvu-gold)" }
                      : undefined
                  }
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      active ? "text-vvu-gold" : "text-muted-foreground"
                    )}
                    style={active ? { color: "var(--vvu-gold)" } : undefined}
                  />
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                    {item.abbr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
