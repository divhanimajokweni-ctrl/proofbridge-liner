"use client";

/**
 * GateRoadmap — the 5-Gate corporate-governance roadmap.
 *
 * Two parallel tracks meet at each gate:
 *   Track A — Legal / Governance   (charter, MOI, SHA, CIPC, audit)
 *   Track B — Commercial / Technical (cap table, bank, IP, vendor, release)
 *
 * Each gate has a GO / NO-GO matrix of exit-review items.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Flag,
} from "lucide-react";

interface GateStep {
  id: string;
  label: string;
  trackA: string;
  trackB: string;
  status: "done" | "in-progress" | "blocked" | "pending";
}

const ROADMAP: GateStep[] = [
  {
    id: "G1",
    label: "Gate 1 — Charter",
    trackA: "Charter signed by founding directors",
    trackB: "Cap table v1 + bank account opened",
    status: "in-progress",
  },
  {
    id: "G2",
    label: "Gate 2 — Incorporation",
    trackA: "MOI filed with CIPC, CoR14.3 received",
    trackB: "Shareholders Agreement (SHA) executed",
    status: "blocked",
  },
  {
    id: "G3",
    label: "Gate 3 — Compliance",
    trackA: "SARS tax clearance + BBBEE affidavit",
    trackB: "Vendor master + IP assignment contracts",
    status: "pending",
  },
  {
    id: "G4",
    label: "Gate 4 — Audit",
    trackA: "First AGM minutes + auditor appointed",
    trackB: "Internal controls documented + SOX-style checklist",
    status: "pending",
  },
  {
    id: "G5",
    label: "Gate 5 — Annual Filing",
    trackA: "Annual return filed with CIPC",
    trackB: "Public disclosure + trust ledger reconciliation",
    status: "pending",
  },
];

interface ExitReviewItem {
  id: string;
  label: string;
  status: "go" | "no-go" | "review";
  note: string;
}

const EXIT_REVIEW: ExitReviewItem[] = [
  { id: "ER-02", label: "Charter scope & clauses", status: "go", note: "Approved by directors 2026-08-15" },
  { id: "ER-03", label: "Director registry + ID verification", status: "go", note: "3/3 directors verified" },
  { id: "ER-04", label: "CIPC reservation CoR9.1", status: "review", note: "Awaiting name reservation response" },
  { id: "ER-05", label: "Shareholders Agreement draft", status: "no-go", note: "Pre-emptive rights clause unresolved" },
  { id: "ER-06", label: "Bank signatory matrix", status: "no-go", note: "Two-signatory rule pending sign-off" },
];

function statusVisual(status: GateStep["status"]) {
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

export function GateRoadmap() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">5-Gate Roadmap</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Two parallel tracks — Legal/Governance (A) and Commercial/Technical
          (B) — meet at each gate. No gate is exited until both tracks pass
          their exit review.
        </p>
      </div>

      {/* Roadmap rail */}
      <div className="grid gap-2 lg:grid-cols-5">
        {ROADMAP.map((step) => {
          const v = statusVisual(step.status);
          const Icon = v.icon;
          return (
            <Card
              key={step.id}
              className={cn("relative border-l-2", v.bg)}
              style={{ borderLeftColor: "var(--vvu-studi)" }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-wider"
                  >
                    {step.id}
                  </Badge>
                  <Icon className={cn("h-3.5 w-3.5", v.color)} />
                </div>
                <h3 className="mt-2 text-xs font-semibold leading-tight">
                  {step.label}
                </h3>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                      Track A · Legal
                    </div>
                    <div className="text-[11px] leading-snug text-foreground/80">
                      {step.trackA}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                      Track B · Commercial
                    </div>
                    <div className="text-[11px] leading-snug text-foreground/80">
                      {step.trackB}
                    </div>
                  </div>
                </div>
                <div className={cn("mt-2 font-mono text-[10px] font-bold", v.color)}>
                  {v.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gate 1 Exit Review */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Gate 1 — Exit Review
            </CardTitle>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className="text-red-400">NO-GO</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-amber-400">2 of 5 items unresolved</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXIT_REVIEW.map((item) => {
              const tone =
                item.status === "go"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  : item.status === "review"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
                    : "border-red-500/30 bg-red-500/5 text-red-400";
              const Icon =
                item.status === "go"
                  ? CheckCircle2
                  : item.status === "review"
                    ? Clock
                    : AlertTriangle;
              return (
                <div
                  key={item.id}
                  className={cn("rounded-md border p-2.5", tone)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      {item.id}
                    </span>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
                    {item.note}
                  </div>
                  <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {item.status === "go"
                      ? "GO"
                      : item.status === "review"
                        ? "REVIEW"
                        : "NO-GO"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
