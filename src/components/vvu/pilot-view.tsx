"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ThreeRingsLogo } from "@/components/vvu/three-rings-logo";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Rocket,
  Search,
  CheckCircle2,
  ChevronDown,
  FileText,
  Network,
  Shield,
  History,
  Scale,
  GraduationCap,
  Users,
  Clock,
  DollarSign,
  Layers,
  Mail,
  Download,
  Target,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

type View = "landing" | "docs" | "ive" | "roles" | "pilot";

type PhaseColor = "emerald" | "amber" | "cyan" | "zinc";

interface Phase {
  id: number;
  name: string;
  days: string;
  color: PhaseColor;
  description: string;
  deliverables: string[];
  successCriteria: string;
  stakeholders: string[];
  progress: number;
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  phaseRef: string;
  icon: LucideIcon;
}

// ─── Phase Data ────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: 1,
    name: "Discovery",
    days: "Days 1–15",
    color: "emerald",
    description:
      "Foundational assessment phase. VVU engineers and the client's risk team map the organization's existing evidence landscape, identify critical claims, and audit the sources currently feeding authorization decisions. The output is a calibrated risk profile that drives every subsequent threshold.",
    deliverables: [
      "Risk profile assessment with claim-state taxonomy",
      "Stakeholder interview synthesis (8–12 sessions)",
      "Evidence source audit with independence matrix",
      "Discovery readout deck and threshold hypotheses",
    ],
    successCriteria:
      "Risk profile signed by CISO + Chief Epistemic Officer; ≥8 stakeholder interviews completed; evidence source inventory covers ≥90% of in-scope claims.",
    stakeholders: [
      "Chief Epistemic Officer",
      "CISO",
      "Verification Lead",
      "Risk & Compliance",
    ],
    progress: 100,
  },
  {
    id: 2,
    name: "Calibration",
    days: "Days 16–45",
    color: "amber",
    description:
      "The mathematical heart of the pilot. VVU calibrates the EIS engine to the client's risk tolerance: tuning AUTH_THRESHOLD, N_IND_SAFETY_THRESHOLD, and the heat kernel diffusion parameter κ. Each tuning pass is run against historical claim corpora and validated against the Discovery risk profile.",
    deliverables: [
      "Threshold tuning report with sensitivity analysis",
      "N_ind calibration across 3 claim corpora",
      "Heat kernel κ optimization with diffusion traces",
      "Calibrated threshold document (draft)",
    ],
    successCriteria:
      "AUTH_THRESHOLD matches risk profile; N_ind ≥ 2 on 100% of safety-critical test claims; κ tuned so structural signal preserved ≥95%.",
    stakeholders: [
      "Verification Lead",
      "Evidence Engineer",
      "Calibration Analyst",
      "Chief Epistemic Officer",
    ],
    progress: 60,
  },
  {
    id: 3,
    name: "Integration",
    days: "Days 46–75",
    color: "cyan",
    description:
      "Production-grade integration. The calibrated EIS engine is wired into the client's SafeGrid safety net and SafeStacks clearance pipeline. The four-source evidence mesh (you.com, brave, firecrawl, watchdog) is deployed with the client's retention and provenance policies.",
    deliverables: [
      "SafeGrid integration with circuit-breaker wiring",
      "SafeStacks clearance pipeline handoff",
      "Evidence mesh deployment with 4-source provenance",
      "Integration test report (≥50 claim scenarios)",
    ],
    successCriteria:
      "SafeGrid trips on every injected fault scenario; SafeStacks clears in <250ms p95; evidence mesh reports N_ind ≥2 for ≥80% of multi-source claims.",
    stakeholders: [
      "Evidence Engineer",
      "Safety Reviewer",
      "Mesh Operator",
      "Platform SRE",
    ],
    progress: 0,
  },
  {
    id: 4,
    name: "Validation",
    days: "Days 76–90",
    color: "zinc",
    description:
      "Final phase — the audit trail is validated end-to-end against regulatory requirements, the client's compliance team signs off on the alignment matrix, and VVU produces handoff documentation covering operating procedures, escalation paths, and recertification cadence.",
    deliverables: [
      "Audit trail validation report (EU AI Act, NIST, SEC, SOC2)",
      "Regulatory compliance matrix with evidence citations",
      "Operating procedures & escalation playbook",
      "Handoff documentation and training package",
    ],
    successCriteria:
      "100% of audit trail entries reconstructible; compliance matrix signed by General Counsel; training delivered to ≥90% of RTCAS role holders.",
    stakeholders: [
      "Chief Epistemic Officer",
      "General Counsel",
      "Compliance Officer",
      "VVU Engagement Lead",
    ],
    progress: 0,
  },
];

const DELIVERABLES: Deliverable[] = [
  {
    id: "threshold-doc",
    title: "Calibrated Threshold Document",
    description:
      "Authoritative reference for AUTH_THRESHOLD, N_IND thresholds, stale window, and κ — with sensitivity analysis and signed risk-justification.",
    phaseRef: "Phase 2 — Calibration",
    icon: FileText,
  },
  {
    id: "mesh-config",
    title: "Evidence Mesh Configuration",
    description:
      "Production-ready configuration for the 4-source provenance mesh, including source weights, retention policy, and N_ind floor enforcement.",
    phaseRef: "Phase 3 — Integration",
    icon: Network,
  },
  {
    id: "auth-policy",
    title: "Authorization Policy Specification",
    description:
      "Complete specification of the A = C·E·I·S·R conjunct evaluation, safety-critical gating, and circuit-breaker revocation rules.",
    phaseRef: "Phase 3 — Integration",
    icon: Shield,
  },
  {
    id: "audit-arch",
    title: "Audit Trail Architecture",
    description:
      "Append-only audit trail design covering every authorization decision, conjunct signoff, and circuit-breaker event with cryptographic integrity.",
    phaseRef: "Phase 4 — Validation",
    icon: History,
  },
  {
    id: "compliance-matrix",
    title: "Regulatory Compliance Matrix",
    description:
      "Cross-reference of SEARM capabilities to EU AI Act, NIST AI RMF, SEC 17a-4, and SOC 2 controls — with evidence citations per requirement.",
    phaseRef: "Phase 4 — Validation",
    icon: Scale,
  },
  {
    id: "training-package",
    title: "Training Materials Package",
    description:
      "Role-based training curriculum for all 15 RTCAS roles, including self-paced modules, certification exams, and recertification cadence.",
    phaseRef: "Phase 4 — Validation",
    icon: GraduationCap,
  },
];

const COLOR_META: Record<
  PhaseColor,
  {
    dot: string;
    ring: string;
    border: string;
    bg: string;
    text: string;
    progress: string;
    softBg: string;
    label: string;
  }
> = {
  emerald: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
    softBg: "bg-emerald-500/5",
    label: "Emerald",
  },
  amber: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
    softBg: "bg-amber-500/5",
    label: "Amber",
  },
  cyan: {
    dot: "bg-cyan-500",
    ring: "ring-cyan-500/40",
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-300",
    progress: "[&_[data-slot=progress-indicator]]:bg-cyan-500",
    softBg: "bg-cyan-500/5",
    label: "Cyan",
  },
  zinc: {
    dot: "bg-zinc-500",
    ring: "ring-zinc-500/40",
    border: "border-zinc-500/40",
    bg: "bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    progress: "[&_[data-slot=progress-indicator]]:bg-zinc-500",
    softBg: "bg-zinc-500/5",
    label: "Zinc",
  },
};

// ─── Sample SOW content ────────────────────────────────────────────────

const SOW_CONTENT = `VVU — BA-1 CALIBRATION PILOT
Statement of Work (Sample)
============================================================

Engagement: BA-1 Calibration Pilot
Client: [Client Name]
Duration: 90 days (4 phases)
Fixed Investment: $150,000 USD
Effective Date: [TBD]

------------------------------------------------------------
1. ENGAGEMENT OVERVIEW
------------------------------------------------------------
The BA-1 Calibration Pilot is a 90-day, 4-phase professional
services engagement in which VVU calibrates the SEARM Platform's
evidence thresholds to the client's risk profile. The pilot
produces a calibrated threshold document, a deployed evidence
mesh, and an audit-trail architecture validated against EU AI
Act, NIST AI RMF, SEC, and SOC 2 requirements.

------------------------------------------------------------
2. PHASES & DELIVERABLES
------------------------------------------------------------
Phase 1 — Discovery (Days 1-15)
  • Risk profile assessment
  • Stakeholder interviews (8-12 sessions)
  • Evidence source audit with independence matrix
  • Discovery readout deck

Phase 2 — Calibration (Days 16-45)
  • Threshold tuning report (sensitivity analysis)
  • N_ind calibration across 3 claim corpora
  • Heat kernel parameter (κ) optimization
  • Calibrated threshold document (draft)

Phase 3 — Integration (Days 46-75)
  • SafeGrid integration with circuit-breaker wiring
  • SafeStacks clearance pipeline handoff
  • Evidence mesh deployment (4-source provenance)
  • Integration test report (≥50 scenarios)

Phase 4 — Validation (Days 76-90)
  • Audit trail validation report
  • Regulatory compliance matrix (EU AI Act, NIST, SEC, SOC2)
  • Operating procedures & escalation playbook
  • Handoff documentation & training package

------------------------------------------------------------
3. SUCCESS CRITERIA
------------------------------------------------------------
• AUTH_THRESHOLD matches the client's signed risk profile.
• N_ind ≥ 2 on 100% of safety-critical test claims.
• κ tuned so structural signal is preserved ≥ 95%.
• SafeGrid trips on every injected fault scenario.
• 100% of audit trail entries reconstructible end-to-end.
• Training delivered to ≥ 90% of RTCAS role holders.

------------------------------------------------------------
4. INVESTMENT & TERMS
------------------------------------------------------------
Fixed fee: $150,000 USD (all-inclusive).
Travel and expenses: included.
Payment schedule: 30% on signature, 40% at Phase 2 close,
                  30% on final handoff.

------------------------------------------------------------
5. ASSUMPTIONS
------------------------------------------------------------
• Client provides named stakeholders for 8-12 interviews.
• Client provides ≥3 historical claim corpora for calibration.
• Client environment supports the EIS engine system requirements.
• Client legal counsel reviews the compliance matrix within
  Phase 4 (5-business-day turnaround SLA).

------------------------------------------------------------
6. CONTACT
------------------------------------------------------------
VVU Inc. — Professional Services
sales@vvu.example
+1 (555) 010-2025

============================================================
© 2025 VVU Inc. — Three Rings™ and SEARM™ are trademarks of
VVU Inc. This document is a sample and not a binding offer.
`;

// ─── View ──────────────────────────────────────────────────────────────

interface PilotViewProps {
  onNavigate: (v: View) => void;
}

export function PilotView({ onNavigate }: PilotViewProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const { toast } = useToast();

  const togglePhase = useCallback((id: number) => {
    setExpandedPhase((curr) => (curr === id ? null : id));
  }, []);

  const handleContactSales = useCallback(() => {
    toast({
      title: "Sales inquiry received",
      description:
        "A VVU Professional Services representative will reach out within 1 business day.",
    });
  }, [toast]);

  const handleDownloadSOW = useCallback(() => {
    try {
      const blob = new Blob([SOW_CONTENT], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "VVU-BA1-Calibration-Pilot-SOW.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "SOW downloaded",
        description: "Sample Statement of Work saved as VVU-BA1-Calibration-Pilot-SOW.txt",
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not generate the SOW file. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const totalProgress = useMemo(
    () => Math.round(PHASES.reduce((s, p) => s + p.progress, 0) / PHASES.length),
    [],
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Toolbar */}
      <div className="border-b bg-muted/20 px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("landing")}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3 w-3" />
            Home
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-mono text-muted-foreground">
            BA-1 — 90-Day Calibration Pilot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            Alt+P
          </Badge>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          {/* Summary Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Rocket className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  BA-1 Calibration Pilot
                </h1>
                <p className="text-sm text-muted-foreground">
                  90-day structured engagement to calibrate VVU evidence thresholds
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <Card className="border-t-2 border-t-emerald-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Duration
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">90 days</p>
                  </div>
                  <Clock className="h-8 w-8 text-emerald-500/40" />
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-amber-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Phases
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">4</p>
                  </div>
                  <Layers className="h-8 w-8 text-amber-500/40" />
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-cyan-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Investment
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">$150k</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-cyan-500/40" />
                </CardContent>
              </Card>
            </div>

            {/* Overall progress bar */}
            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Overall Pilot Progress
                </p>
                <span className="text-xs font-mono font-semibold">
                  {totalProgress}%
                </span>
              </div>
              <Progress value={totalProgress} className="h-2" />
              {/* Phase mini-bars */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {PHASES.map((phase) => {
                  const meta = COLOR_META[phase.color];
                  const statusLabel = phase.progress === 100 ? "Complete" : phase.progress > 0 ? "In flight" : "Not started";
                  return (
                    <div key={phase.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-mono font-semibold ${meta.text}`}>P{phase.id}</span>
                        <span className="text-[8px] font-mono text-muted-foreground">{phase.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${meta.dot}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${phase.progress}%` }}
                          transition={{ duration: 1, delay: 0.3 + phase.id * 0.15, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[8px] text-muted-foreground/70 text-center">{statusLabel}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Phase 1 (Discovery) complete · Phase 2 (Calibration) in flight ·
                Phases 3–4 scheduled.
              </p>
            </div>
          </motion.div>

          {/* Interactive Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold tracking-tight">Engagement Timeline</h2>
              <Badge variant="outline" className="text-[10px] font-mono ml-1">
                4 phases
              </Badge>
            </div>

            <div className="relative">
              {/* Vertical connecting line */}
              <div
                aria-hidden
                className="absolute left-[18px] sm:left-[22px] top-2 bottom-2 w-px bg-border"
              />

              <ol className="space-y-4">
                {PHASES.map((phase, idx) => (
                  <motion.li
                    key={phase.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 + idx * 0.08, ease: "easeOut" }}
                    className="relative pl-10 sm:pl-14"
                  >
                    {/* Dot */}
                    <span
                      aria-hidden
                      className={`absolute left-0 top-3 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-background border-2 ${COLOR_META[phase.color].border} ${COLOR_META[phase.color].ring} ring-2 ring-offset-2 ring-offset-background`}
                    >
                      <span className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full ${COLOR_META[phase.color].dot}`} />
                    </span>

                    <PhaseCard
                      phase={phase}
                      expanded={expandedPhase === phase.id}
                      onToggle={() => togglePhase(phase.id)}
                    />
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.section>

          {/* Deliverables Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-bold tracking-tight">Client Deliverables</h2>
              <Badge variant="outline" className="text-[10px] font-mono ml-1">
                6 artifacts
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-5 max-w-3xl leading-relaxed">
              Every BA-1 engagement ships with a fixed deliverable set. Each artifact
              is owned by a named VVU lead, reviewed by the client, and handed off at
              the close of the referenced phase.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DELIVERABLES.map((d, idx) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  >
                    <Card className="h-full border-t-2 border-t-emerald-500/60 transition-shadow hover:shadow-md">
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono shrink-0"
                          >
                            {d.phaseRef.split("—")[0].trim()}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold leading-tight mb-1.5">
                          {d.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                          {d.description}
                        </p>
                        <Separator className="my-3" />
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {d.phaseRef}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* CTA Footer */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/5 p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3 max-w-2xl">
                <ThreeRingsLogo size={40} />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-1.5">
                    Ready to begin your BA-1 Calibration Pilot?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Engagements kick off on the first and third Monday of each month.
                    A 30-minute scoping call is required before SOW signature.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  onClick={handleDownloadSOW}
                  className="gap-2 shadow-sm w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download SOW
                </Button>
                <Button
                  onClick={handleContactSales}
                  className="gap-2 shadow-sm w-full sm:w-auto"
                >
                  <Mail className="h-4 w-4" />
                  Contact Sales
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

// ─── Phase Card (expandable) ───────────────────────────────────────────

function PhaseCard({
  phase,
  expanded,
  onToggle,
}: {
  phase: Phase;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = COLOR_META[phase.color];
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={expanded}
      aria-controls={`phase-${phase.id}-content`}
      className={`cursor-pointer overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 hover:shadow-md ${meta.border} border-l-4`}
    >
      <div className={`p-4 sm:p-5 ${expanded ? meta.softBg : ""}`}>
        {/* Header row */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center justify-center h-5 px-2 rounded-md text-[10px] font-mono font-bold ${meta.bg} ${meta.text}`}>
                Phase {phase.id}
              </span>
              <h3 className="text-sm sm:text-base font-semibold tracking-tight">
                {phase.name}
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {phase.days}
              </span>
            </div>
            {!expanded && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                {phase.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini progress badge */}
            <div className="hidden sm:flex flex-col items-end min-w-[80px]">
              <span className="text-[10px] font-mono text-muted-foreground">
                {phase.progress === 100
                  ? "Complete"
                  : phase.progress === 0
                  ? "Not started"
                  : "In flight"}
              </span>
              <span className={`text-sm font-mono font-bold ${meta.text}`}>
                {phase.progress}%
              </span>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </div>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={`phase-${phase.id}-content`}
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/60 space-y-4">
                {/* Description */}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {phase.description}
                </p>

                {/* Progress bar (mobile + desktop) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Phase Progress
                    </p>
                    <span className={`text-xs font-mono font-semibold ${meta.text}`}>
                      {phase.progress}%
                    </span>
                  </div>
                  <Progress
                    value={phase.progress}
                    className={`h-2 ${meta.progress}`}
                  />
                </div>

                {/* Two-column grid: deliverables + success criteria */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Deliverables */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Target className="h-3 w-3" />
                      Key Deliverables
                    </p>
                    <ul className="space-y-1.5">
                      {phase.deliverables.map((d, i) => (
                        <li
                          key={i}
                          className="text-xs text-foreground/80 leading-relaxed flex gap-2"
                        >
                          <CheckCircle2 className={`h-3.5 w-3.5 ${meta.text} mt-0.5 shrink-0`} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Success criteria */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Success Criteria
                    </p>
                    <div className={`rounded-md border-l-2 ${meta.border} bg-muted/30 px-3 py-2`}>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {phase.successCriteria}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stakeholders */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    Stakeholders Involved
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.stakeholders.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className={`text-[10px] font-mono ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
