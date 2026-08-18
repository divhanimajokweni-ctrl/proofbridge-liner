"use client";

/**
 * IveOverview — landing page for the VVU IVE workspace.
 *
 * Mirrors the deployed Vercel IVE overview page:
 *   - Hero: "Engineer systems that can prove themselves."
 *     (with <EvolutionMatrix mode="hero" stageRange=[2,3]> as a backdrop —
 *      the Fibonacci point cloud morphs between the kinetic-web-spider and
 *      Miles-Spider-Man stages, the red nodes echoing IVE's "authorized
 *      release" theme. The same matrix sits behind STUDI's hero but loops
 *      the earlier sphere→ant stages — same point cloud, two faces.)
 *   - Release decision badge (BLOCKED until STUDI gates pass)
 *   - Core workflow strip
 *   - 4 metric cards
 *   - System map grid grouped by section
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { IveClaimInjector } from "@/components/ive-workspace/ive-claim-injector";
import { cn } from "@/lib/utils";
import {
  Activity,
  Box,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Lock,
  Network,
  Plug,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const WORKFLOW_STEPS = [
  { label: "Procedural CAD", icon: Box },
  { label: "AI-assisted Specification", icon: Layers },
  { label: "Proof Obligation Generation", icon: GitBranch },
  { label: "SMT Verification", icon: CheckCircle2 },
  { label: "Evidence Runtime", icon: Database },
  { label: "Ledger + Provenance", icon: ShieldCheck },
  { label: "Engineering Release Decision", icon: Workflow },
];

const SYSTEM_MAP: Array<{
  section: "CORE" | "RELEASE" | "RUNTIME" | "CASE STUDY" | "SYSTEM";
  items: Array<{ name: string; abbr: string; status: string }>;
}> = [
  {
    section: "CORE",
    items: [
      { name: "IVE Overview", abbr: "OV", status: "READY" },
      { name: "Trust Sphere", abbr: "TS", status: "READY" },
      { name: "Claims Pipeline", abbr: "CP", status: "READY" },
      { name: "Evidence Runtime", abbr: "ER", status: "READY" },
    ],
  },
  {
    section: "RELEASE",
    items: [
      { name: "Release Report", abbr: "RR", status: "GO" },
      { name: "Adapter Attribution", abbr: "ADP", status: "5/6" },
      { name: "Integrity Closure", abbr: "INT", status: "WRAPPED" },
      { name: "Acceptance", abbr: "ACC", status: "BLOCKED" },
      { name: "Identity Registry", abbr: "IDR", status: "READY" },
    ],
  },
  {
    section: "RUNTIME",
    items: [
      { name: "Plugin Registry", abbr: "PR", status: "3 run" },
      { name: "AMD Runtime", abbr: "AMD", status: "RUNNING" },
      { name: "Zoo Runtime", abbr: "ZOO", status: "RUNNING" },
    ],
  },
  {
    section: "CASE STUDY",
    items: [
      { name: "HBK Workspace", abbr: "HBA", status: "DEMO" },
      { name: "CAD Viewer", abbr: "CAD", status: "READY" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { name: "Webhook Delivery", abbr: "WH", status: "READY · v1.1" },
      { name: "Help & FAQ", abbr: "FAQ", status: "READY" },
    ],
  },
];

interface IveOverviewProps {
  /** Allow clicking items in the system map to jump to that section. */
  onNavigate?: (sectionId: string) => void;
}

export function IveOverview({ onNavigate }: IveOverviewProps) {
  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="relative overflow-hidden border-vvu-ive/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-ive)_8%,card)]">
        {/* 3D Fibonacci point-cloud backdrop — DATA-DRIVEN by theorem-state store.
            IVE breaker tripped ⇒ web-spider + pulsing red; release GO ⇒ Miles. */}
        <EvolutionMatrix mode="hero" dataDriven stageRange={[2, 3]} />
        {/* Scrim so foreground text stays legible over the morph */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,12,12,0.88) 0%, rgba(15,12,12,0.58) 55%, rgba(15,12,12,0.18) 100%)",
          }}
        />
        <CardContent className="relative z-[2] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <Badge
                className="mb-3 font-mono uppercase tracking-wider"
                variant="outline"
              >
                <Layers className="mr-1 h-3 w-3" />
                VVU · IVE
              </Badge>
              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                Engineer systems that can prove themselves.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                IVE combines procedural CAD, AI-assisted specification, and
                formal verification to give every engineering decision an
                auditable proof. Every claim passes through{" "}
                <span className="font-mono text-foreground">Claim → Evidence → Verification → Authorization → Action</span>{" "}
                — bound by the Evidence Independence Specification and held
                to fail-closed operation by Theorem 5.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:w-64">
              <div className="rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 backdrop-blur-sm">
                <div className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                  Engineering release
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold uppercase tracking-wider text-red-400">
                  BLOCKED
                </div>
                <div className="text-[10px] text-muted-foreground">
                  STUDI gates not yet met
                </div>
              </div>
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 backdrop-blur-sm">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  MO-GO · freeze defined
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Bootstrap: OK · Day-7 gate
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IVE half of the fail-closed valve. Authorise / trip / reset
          below; the hero matrix above morphs from web-spider → Miles
          as you cross the 50% authorisation ratio, and to
          web-spider+pulsing-red the moment any breaker trips. */}
      <IveClaimInjector />

      {/* Core workflow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Core workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            {WORKFLOW_STEPS.map((step, i, arr) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1.5">
                    <Icon className="h-3 w-3 text-vvu-ive" style={{ color: "var(--vvu-ive)" }} />
                    <span>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-muted-foreground/40">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Metric strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Trust dimensions", value: "3 / 6", icon: ShieldCheck, tone: "amber" },
          { label: "Proof obligations", value: "0 / 0", icon: CheckCircle2, tone: "muted" },
          { label: "Hardware", value: "ROCm", icon: Cpu, tone: "muted" },
          { label: "Run ID", value: "ive-20260818", icon: Activity, tone: "ive" },
        ].map((m) => {
          const Icon = m.icon;
          const tone =
            m.tone === "amber"
              ? "text-amber-400"
              : m.tone === "ive"
                ? "text-vvu-ive"
                : "text-foreground";
          return (
            <Card key={m.label} className="border-border/70">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {m.label}
                </div>
                <div className={cn("mt-1 font-mono text-lg font-bold", tone)}>
                  {m.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">
            System map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {SYSTEM_MAP.map((group) => (
              <div key={group.section} className="space-y-1.5">
                <h4 className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.section}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.abbr}
                      onClick={() =>
                        onNavigate?.(
                          `ive-${
                            item.abbr === "OV"
                              ? "overview"
                              : item.abbr === "TS"
                                ? "trust-sphere"
                                : item.abbr === "CP"
                                  ? "claims"
                                  : item.abbr === "ER"
                                    ? "evidence-runtime"
                                    : item.abbr === "PR"
                                      ? "plugins"
                                      : item.abbr === "WH"
                                        ? "webhook"
                                        : "overview"
                          }`
                        )
                      }
                      className="flex w-full items-center justify-between rounded border border-border/70 bg-card/40 px-2 py-1.5 text-[11px] hover:bg-accent/40"
                    >
                      <span className="truncate text-foreground/80">
                        {item.name}
                      </span>
                      <span className="ml-2 shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {item.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
