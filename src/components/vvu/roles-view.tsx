"use client";

import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThreeRingsLogo } from "@/components/vvu/three-rings-logo";
import {
  ArrowLeft,
  Search,
  X,
  Crown,
  ShieldAlert,
  FileCheck,
  Gavel,
  Building2,
  FileCode2,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Zap,
  Database,
  Network,
  Activity,
  BookOpen,
  GraduationCap,
  Check,
  XCircle,
  Users,
  ChevronRight,
  Award,
  Workflow,
  ArrowUpRight,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

type Tier = "strategic" | "operational" | "support";
type Conjunct = "C" | "E" | "I" | "S" | "R";
type TierFilter = "all" | Tier;

interface Role {
  id: string;
  name: string;
  tier: Tier;
  icon: LucideIcon;
  responsibilities: string[];
  /** Conjuncts of A = C·E·I·S·R this role is authorized to sign off on */
  conjuncts: Conjunct[];
  /** Longer narrative description shown in the detail modal. */
  fullDescription: string;
  /** Required certifications / training (fictional but realistic). */
  certifications: string[];
  /** Which role this position reports to (id of another Role, or null for top). */
  reportsTo: string | null;
  /** 2–3 example workflow bullets describing typical tasks. */
  workflows: string[];
}

// ─── Role Data ─────────────────────────────────────────────────────────

const ROLES: Role[] = [
  // Tier 1 — Strategic (emerald)
  {
    id: "ceo-epi",
    name: "Chief Epistemic Officer",
    tier: "strategic",
    icon: Crown,
    responsibilities: [
      "Sets enterprise epistemic policy and claim-state thresholds",
      "Owns the SEARM governance charter and Three Rings doctrine",
      "Final escalation for falsified-claim disputes",
    ],
    conjuncts: ["C"],
    fullDescription:
      "The Chief Epistemic Officer (CEO-Epi) is the executive accountable for the truthfulness posture of every AI claim the enterprise makes. The CEO-Epi owns the SEARM charter, sets system-wide thresholds for the claim-state lattice (e.g. when OBSERVED is acceptable, when SUPPORTED is mandatory), and is the final internal escalation path when a claim is FALSIFIED or when the Audit Committee disputes a verification outcome. This role signs the Claim-state conjunct (C) only — never Evidence, Integrity, Safety, or Review — to preserve separation of duties at the very top of the org.",
    certifications: [
      "VVU SEARM Executive Briefing (8h, annual)",
      "EU AI Act — Article 14 Human Oversight for Senior Leadership",
      "ISO/IEC 42001 AI Management System — Executive Track",
      "NIST AI RMF — Organizational Context Workshop",
    ],
    reportsTo: null,
    workflows: [
      "Quarterly SEARM posture review: ratify claim-state thresholds and approve any changes to the lattice policy.",
      "Falsified-claim escalation: review the Audit Committee's findings and either accept the falsification or commission a re-verification.",
      "Annual charter refresh: co-author the SEARM governance charter with the CRO and Compliance Director.",
    ],
  },
  {
    id: "cro",
    name: "Chief Risk Officer",
    tier: "strategic",
    icon: ShieldAlert,
    responsibilities: [
      "Owns SafeGrid / SafeStacks risk-acceptance framework",
      "Approves safety-critical overrides (S conjunct)",
      "Signs off on circuit-breaker trip reviews",
    ],
    conjuncts: ["S"],
    fullDescription:
      "The Chief Risk Officer owns the SafeGrid / SafeStacks risk-acceptance framework and is the only role authorized to approve a safety-critical override (S conjunct) after a Circuit Breaker trip. The CRO reviews every trip, decides whether to re-arm the breaker or escalate to a full fail-closed posture, and signs the Safety conjunct for Tier-1 incidents. The CRO never signs Claim, Evidence, Integrity, or Review conjuncts — those are delegated to operational roles to enforce separation between risk acceptance and risk execution.",
    certifications: [
      "VVU SafeGrid / SafeStacks Practitioner (24h)",
      "ISO 31000 Enterprise Risk Management",
      "IEC 61508 Functional Safety — SIL Determination",
      "Circuit-Breaker Trip Review Simulation (annual recert)",
    ],
    reportsTo: "ceo-epi",
    workflows: [
      "Post-trip review: within 4h of any breaker event, review trip telemetry with the Circuit Breaker Operator and decide re-arm vs. fail-closed.",
      "Safety override hearing: when an operational team requests an S-override, convene a 30-min SafeGrid panel and issue the signed attestation or denial.",
      "Quarterly SafeGrid posture report to the Audit Committee.",
    ],
  },
  {
    id: "compliance-dir",
    name: "Compliance Director",
    tier: "strategic",
    icon: FileCheck,
    responsibilities: [
      "Maps EIS outputs to EU AI Act, NIST AI RMF, SOC 2 controls",
      "Issues compliance attestation for second-reviewer signoff (R)",
      "Maintains regulatory evidence binders for audit",
    ],
    conjuncts: ["R"],
    fullDescription:
      "The Compliance Director translates EIS outputs (claim states, evidence mesh, N_ind, breaker records) into mapped evidence for EU AI Act Articles 9–15, NIST AI RMF GOVERN/MAP/MEASURE/MANAGE functions, and SOC 2 Trust Services Criteria. This role issues the formal compliance attestation that satisfies the Reviewer (R) conjunct for second-reviewer signoff, and maintains the regulatory evidence binder that auditors inspect during Type II engagements. The Compliance Director signs only the R conjunct — never C, E, I, or S — preserving independence between compliance attestation and operational verification.",
    certifications: [
      "EU AI Act — Conformity Assessment & Article 9 Documentation",
      "NIST AI RMF — Profile Development Workshop",
      "SOC 2 Type II — Auditor Liaison Training",
      "VVU Regulatory Binder Hygiene (annual)",
    ],
    reportsTo: "ceo-epi",
    workflows: [
      "Annual EU AI Act mapping refresh: cross-walk every claim-state transition to Article 9 risk-management evidence.",
      "Quarterly SOC 2 walkthrough: hand the regulatory binder to the external auditor and resolve any control exceptions.",
      "R-conjunct signoff: review the Authorization Officer's draft attestation and either sign R or kick back with notes.",
    ],
  },
  {
    id: "audit-chair",
    name: "Audit Committee Chair",
    tier: "strategic",
    icon: Gavel,
    responsibilities: [
      "Independent audit of claim-state progression (C)",
      "Final reviewer signoff on safety-critical authorizations (R)",
      "Reports to the Board on SEARM posture quarterly",
    ],
    conjuncts: ["C", "R"],
    fullDescription:
      "The Audit Committee Chair is the Board's independent check on the SEARM Platform. The Chair performs an independent audit of claim-state progression (C conjunct), giving the Board assurance that verification outcomes were not manipulated by operational teams. The Chair also provides the final Reviewer signoff (R conjunct) on any safety-critical authorization — the only role allowed to sign both C and R, and only when paired together on a safety-critical dossier. This dual-conjunct authority is narrowly scoped to prevent unilateral authorization: the Chair cannot sign E, I, or S.",
    certifications: [
      "Certified Information Systems Auditor (CISA)",
      "VVU Independent Audit of EIS Lattice (16h)",
      "Board-Level Risk Communication for AI Systems",
      "EU AI Act — Article 14 Oversight for Board Members",
    ],
    reportsTo: null,
    workflows: [
      "Quarterly lattice audit: independently re-derive a sample of 20 claim-state transitions and confirm agreement with IVE.",
      "Safety-critical dossier review: convene a 2-member quorum (Chair + Compliance Director) to sign R on any S-conjunct authorization.",
      "Board briefing: present the quarterly SEARM posture scorecard with falsification rate, breaker events, and remediation status.",
    ],
  },
  {
    id: "board-liaison",
    name: "Board Liaison",
    tier: "strategic",
    icon: Building2,
    responsibilities: [
      "Translates SEARM telemetry into Board-ready briefings",
      "Escalates systemic integrity failures to the Board",
      "Owns board-level risk acceptance for Tier-1 incidents (S)",
    ],
    conjuncts: ["S"],
    fullDescription:
      "The Board Liaison is the structural interface between the SEARM operational stack and the Board of Directors. The Liaison translates IVE telemetry (N_ind trends, breaker events, falsification rate, authorization throughput) into Board-ready briefings and owns board-level risk acceptance for Tier-1 incidents via the S conjunct. The Liaison never signs operational conjuncts — the S authority here is narrowly scoped to risk acceptance on behalf of the Board, distinct from the CRO's operational safety override.",
    certifications: [
      "VVU Board Briefing Calibration (8h)",
      "Tier-1 Incident Risk Acceptance Simulation",
      "Strategic Communication for AI Risk (Wharton executive)",
      "NIST AI RMF — Board-Level GOVERN Function",
    ],
    reportsTo: "audit-chair",
    workflows: [
      "Monthly Board telemetry pack: distill IVE dashboards into a 1-page scorecard and a 5-minute verbal brief.",
      "Tier-1 incident risk acceptance: when a breaker event meets Tier-1 criteria, convene the Board's risk sub-committee and sign S on behalf of the Board.",
      "Systemic integrity escalation: if N_ind trends drop below threshold for 2 consecutive weeks, escalate to a full Board review.",
    ],
  },

  // Tier 2 — Operational (amber)
  {
    id: "evidence-eng",
    name: "Evidence Engineer",
    tier: "operational",
    icon: FileCode2,
    responsibilities: [
      "Configures evidence mesh ingestion (you.com, brave, firecrawl, watchdog)",
      "Validates source weighting and embedding pipelines",
      "Attests to evidence sufficiency (E conjunct)",
    ],
    conjuncts: ["E"],
    fullDescription:
      "The Evidence Engineer operates the 4-source evidence mesh ingestion pipeline (you.com, brave, firecrawl, watchdog), configures source weights, and validates embedding quality before evidence enters the IVE. The Engineer is the sole signer of the Evidence (E) conjunct — the attestation that enough independent evidence exists to satisfy the lattice. The Engineer never signs Claim, Integrity, Safety, or Review conjuncts, preserving the boundary between evidence collection and evidence evaluation.",
    certifications: [
      "VVU Evidence Mesh Operations (24h)",
      "Embedding Pipeline QA — Vector DB & Re-ranker Tuning",
      "Source Independence Assessment Workshop",
      "Data Provenance & Lineage (OpenLineage Practitioner)",
    ],
    reportsTo: "verification-lead",
    workflows: [
      "New-source onboarding: configure the API adapter, run 24h ingestion soak test, and submit weight calibration report to the Verification Lead.",
      "E-conjunct attestation: for each claim, confirm ≥3 distinct sources (or ≥2 with N_ind ≥ 2) and sign E in the IVE.",
      "Quarterly weight recalibration: re-fit source weights against the gold-standard evaluation set.",
    ],
  },
  {
    id: "verification-lead",
    name: "Verification Lead",
    tier: "operational",
    icon: ShieldCheck,
    responsibilities: [
      "Runs IVE verification and computes claim state lattice (C)",
      "Cross-checks evidence coverage thresholds (E)",
      "Owns the state-lattice → authorization handoff",
    ],
    conjuncts: ["C", "E"],
    fullDescription:
      "The Verification Lead runs the IVE verification engine, computes the claim-state lattice, and is the operational owner of both the Claim-state (C) and Evidence (E) conjuncts. The dual-conjunct authority is allowed because C and E are tightly coupled — you cannot attest a claim state without attesting the underlying evidence sufficiency. The Lead never signs I, S, or R, which keeps the integrity / safety / reviewer checks structurally independent of the team that ran verification.",
    certifications: [
      "VVU IVE Operator — Lattice Computation (32h)",
      "EIS Theorems 1–5 Practitioner (Evidence Bound, N_ind, Heat Kernel, Closure, Fail-closed)",
      "Claim-State Taxonomy & Edge Cases Workshop",
      "Internal Verifier Audit (semi-annual recert)",
    ],
    reportsTo: "auth-officer",
    workflows: [
      "Daily verification run: ingest evidence, compute the lattice, and sign C and E for every claim that clears the SUPPORTED threshold.",
      "Lattice handoff: package the claim-state record and hand to the Authorization Officer with a per-claim verification memo.",
      "Weekly lattice-edge review: triage INCONCLUSIVE and UNTESTED claims with the Evidence Engineer.",
    ],
  },
  {
    id: "auth-officer",
    name: "Authorization Officer",
    tier: "operational",
    icon: Lock,
    responsibilities: [
      "Executes the A = C·E·I·S·R authorization evaluation",
      "Issues or denies the formal authorization attestation (R)",
      "Coordinates second-reviewer signoff workflow",
    ],
    conjuncts: ["R"],
    fullDescription:
      "The Authorization Officer executes the A = C·E·I·S·R evaluation against a claim's collected conjunct signoffs and either issues or denies the formal authorization attestation (R conjunct). The Officer coordinates the second-reviewer workflow with the Compliance Director and, for safety-critical claims, with the Audit Committee Chair. The Officer never signs C, E, I, or S — the R authority here is narrowly scoped to issuing the final attestation once the other four conjuncts are already collected.",
    certifications: [
      "VVU Authorization Officer — A = C·E·I·S·R (24h)",
      "Second-Reviewer Workflow & Conflict-of-Interest Detection",
      "EU AI Act — Article 15 Accuracy, Robustness & Cybersecurity",
      "Attestation Issuance & Cryptographic Sealing (annual)",
    ],
    reportsTo: "compliance-dir",
    workflows: [
      "Authorization evaluation: assemble the 5 conjunct signoffs, evaluate A, and issue or deny the sealed attestation.",
      "Second-reviewer coordination: route the dossier to the Compliance Director (and Audit Chair for safety-critical) for R signoff.",
      "Denial memo: on a denial, issue a structured memo citing which conjunct failed and the recommended remediation.",
    ],
  },
  {
    id: "safety-reviewer",
    name: "Safety Reviewer",
    tier: "operational",
    icon: AlertTriangle,
    responsibilities: [
      "Performs SafeGrid safety clearance for safety-critical claims (S)",
      "Runs hazard analysis and SIL determination",
      "Can veto authorization via the S conjunct",
    ],
    conjuncts: ["S"],
    fullDescription:
      "The Safety Reviewer performs SafeGrid safety clearance on every safety-critical claim, runs the hazard analysis and Safety Integrity Level (SIL) determination, and is the operational signer of the Safety (S) conjunct. The Reviewer holds an absolute veto — withholding S denies authorization regardless of C, E, I, or R status. The Reviewer never signs Claim, Evidence, Integrity, or Review conjuncts, preserving the separation between safety clearance and the rest of the verification stack.",
    certifications: [
      "VVU SafeGrid Safety Clearance (32h)",
      "IEC 61508 — SIL Determination & Hazard Analysis",
      "ISO 21448 SOTIF — Safety of the Intended Functionality",
      "Veto Authority & Safety Override Simulation (annual)",
    ],
    reportsTo: "cro",
    workflows: [
      "Safety-critical clearance: run the 8-step SafeGrid hazard analysis, determine SIL, and either sign S or issue a veto.",
      "Joint review with the CRO: for any safety-critical claim requiring an override, brief the CRO before the override hearing.",
      "Quarterly SIL calibration: re-score the SIL matrix against incident telemetry.",
    ],
  },
  {
    id: "circuit-breaker-op",
    name: "Circuit Breaker Operator",
    tier: "operational",
    icon: Zap,
    responsibilities: [
      "Monitors fail-closed triggers and trips the circuit breaker",
      "Owns real-time safety-critical override (S) and kill switch (R)",
      "Coordinates post-trip review with the CRO",
    ],
    conjuncts: ["S", "R"],
    fullDescription:
      "The Circuit Breaker Operator monitors the fail-closed trigger set in real time, trips the circuit breaker when a trigger fires, and holds the kill-switch authority. The Operator is the only role authorized to sign both S (real-time safety-critical override) and R (kill-switch execution) conjuncts together — but only during an active trip event. This narrowly scoped dual-conjunct authority lets the Operator re-arm or fully shut down without waiting for separate signoffs during an incident.",
    certifications: [
      "VVU Circuit Breaker Operations (24h)",
      "Fail-Closed Trigger Calibration & Trip Simulation",
      "Incident Command System (ICS-100, ICS-200)",
      "Kill-Switch Authority & Real-Time Override Recert (semi-annual)",
    ],
    reportsTo: "cro",
    workflows: [
      "Live trip response: within 60s of a trigger, trip the breaker, sign S + R, and notify the CRO for post-trip review.",
      "Re-arm hearing: present trip telemetry to the CRO and request either re-arm or sustained fail-closed.",
      "Quarterly trip drill: run a simulated fail-closed scenario with the Safety Reviewer and CRO.",
    ],
  },

  // Tier 3 — Support (zinc)
  {
    id: "data-steward",
    name: "Data Steward",
    tier: "support",
    icon: Database,
    responsibilities: [
      "Maintains provenance metadata and source-quality registers",
      "Owns data lineage for the integrity conjunct (I)",
      "Performs retention and tamper-evidence checks",
    ],
    conjuncts: ["I"],
    fullDescription:
      "The Data Steward maintains provenance metadata, source-quality registers, and tamper-evidence logs for the integrity (I) conjunct. The Steward signs I when the data lineage, retention, and tamper-evidence checks all pass for a claim's evidence set. The Steward never signs C, E, S, or R — those stay with the verification, safety, and authorization roles — keeping the integrity check structurally independent of the team that collected or evaluated the evidence.",
    certifications: [
      "VVU Data Stewardship & Provenance (16h)",
      "Tamper-Evidence Logging — Append-Only Ledger Operations",
      "Data Lineage with OpenLineage & Apache Atlas",
      "GDPR / CCPA Retention & Right-to-Erasure",
    ],
    reportsTo: "auth-officer",
    workflows: [
      "Daily provenance check: verify every new evidence record carries a complete lineage chain and a fresh tamper-evidence seal.",
      "I-conjunct signoff: for each claim, run the lineage and retention checks and sign I in the IVE.",
      "Quarterly tamper-evidence audit: re-verify the append-only ledger against the source-of-truth hash chain.",
    ],
  },
  {
    id: "mesh-operator",
    name: "Mesh Operator",
    tier: "support",
    icon: Network,
    responsibilities: [
      "Operates the 4-source evidence mesh ingestion pipeline",
      "Monitors source independence for the integrity conjunct (I)",
      "Triages mesh outages and source drift",
    ],
    conjuncts: ["I"],
    fullDescription:
      "The Mesh Operator runs the day-to-day operations of the 4-source evidence mesh, monitors source independence (a key input to N_ind and the integrity conjunct), and triages mesh outages and source drift. The Operator co-signs I with the Data Steward when a claim's evidence has demonstrably independent sources. The Operator never signs C, E, S, or R — the I authority here is narrowly scoped to source-independence attestation, distinct from the Steward's lineage attestation.",
    certifications: [
      "VVU Mesh Operations & Triage (16h)",
      "Source Independence & N_ind Calibration",
      "API Reliability Engineering — SLO & Error Budgets",
      "Mesh Outage Incident Response (annual)",
    ],
    reportsTo: "evidence-eng",
    workflows: [
      "Continuous mesh health check: monitor source SLOs and alert the Evidence Engineer when a source drops below its error budget.",
      "Independence attestation: for each claim, confirm ≥3 distinct sources (or ≥2 with N_ind ≥ 2) and co-sign I with the Data Steward.",
      "Source-drift triage: when a source's distribution drifts >2σ, file a drift report and quarantine affected claims.",
    ],
  },
  {
    id: "calibration-analyst",
    name: "Calibration Analyst",
    tier: "support",
    icon: Activity,
    responsibilities: [
      "Computes and calibrates N_ind against the participation ratio",
      "Runs heat-kernel diffusion traces to detect latent clustering (I)",
      "Produces the 90-day BA-1 Calibration Pilot report",
    ],
    conjuncts: ["I"],
    fullDescription:
      "The Calibration Analyst computes and calibrates N_ind (the independence count from the participation ratio), runs heat-kernel diffusion traces to detect latent clustering in the evidence mesh, and produces the quarterly BA-1 Calibration Pilot report. The Analyst signs I when a claim's evidence set passes both the N_ind threshold and the heat-kernel clustering test. The Analyst never signs C, E, S, or R — keeping the integrity check structurally separate from the verification, safety, and authorization chains.",
    certifications: [
      "VVU N_ind & Heat-Kernel Calibration (24h)",
      "EIS Theorem 2 — Participation Ratio Practitioner",
      "EIS Theorem 3 — Heat Kernel Diffusion on Evidence Graphs",
      "BA-1 Calibration Pilot Reporting (annual)",
    ],
    reportsTo: "evidence-eng",
    workflows: [
      "N_ind computation: for each claim, compute N_ind from the participation ratio and the eigenvalue decomposition of the source-overlap matrix.",
      "Heat-kernel trace: run the diffusion trace and flag any claim whose evidence graph shows latent clustering above the threshold.",
      "Quarterly BA-1 report: assemble the calibration results into the BA-1 Pilot deliverable for the Compliance Director.",
    ],
  },
  {
    id: "doc-keeper",
    name: "Documentation Keeper",
    tier: "support",
    icon: BookOpen,
    responsibilities: [
      "Maintains the EIS specification, theorems, and glossary",
      "Records every authorization decision in the audit trail",
      "Does not sign conjuncts directly — preserves separation of duties",
    ],
    conjuncts: [],
    fullDescription:
      "The Documentation Keeper maintains the EIS specification, theorems, glossary, and the audit trail that records every authorization decision. The Keeper does not sign any conjunct directly — this preserves the separation of duties between the team that records decisions and the team that makes them. The Keeper's authority is purely procedural: ensuring that every C, E, I, S, and R signoff is captured, timestamped, and immutable in the audit trail.",
    certifications: [
      "VVU EIS Specification Maintenance (8h)",
      "Audit Trail Integrity & Cryptographic Timestamping",
      "Technical Writing for AI Governance",
      "ISO 27001 — Documentation Control",
    ],
    reportsTo: "compliance-dir",
    workflows: [
      "Decision capture: within 5 minutes of any authorization decision, append the sealed attestation to the audit trail.",
      "Quarterly spec refresh: update the EIS specification to reflect any new theorems, thresholds, or role changes.",
      "Glossary maintenance: triage terminology requests from operational teams and update the glossary monthly.",
    ],
  },
  {
    id: "training-coord",
    name: "Training Coordinator",
    tier: "support",
    icon: GraduationCap,
    responsibilities: [
      "Runs RTCAS role-certification curriculum and exams",
      "Tracks competency expiry and recertification cadence",
      "Does not sign conjuncts directly — administers the program",
    ],
    conjuncts: [],
    fullDescription:
      "The Training Coordinator administers the RTCAS role-certification curriculum and exams, tracks competency expiry, and manages the recertification cadence for every conjunct-authorized role. The Coordinator does not sign any conjunct directly — preserving the separation between the team that certifies competence and the team that exercises it. The Coordinator's authority is procedural: ensuring every signatory holds a current, in-scope certification before they can sign.",
    certifications: [
      "VVU RTCAS Program Administration (16h)",
      "Competency Management & LMS Operations",
      "Exam Authoring & Psychometric Validity",
      "ISO 30414 — Human Capital Reporting",
    ],
    reportsTo: "compliance-dir",
    workflows: [
      "Annual recertification cycle: notify each conjunct-authorized role 60 days before their competency expires, schedule the recert exam, and revoke signing authority on expiry.",
      "New-role onboarding: run the 2-week RTCAS bootcamp for any newly created conjunct-authorized role.",
      "Quarterly competency audit: cross-check the live signer registry against the LMS and flag any signer whose certification has lapsed.",
    ],
  },
];

const TIER_META: Record<
  Tier,
  { label: string; badgeClass: string; accentClass: string; leftAccentClass: string; dotClass: string }
> = {
  strategic: {
    label: "Strategic",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    accentClass: "border-t-emerald-500",
    leftAccentClass: "border-l-emerald-500",
    dotClass: "bg-emerald-500",
  },
  operational: {
    label: "Operational",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    accentClass: "border-t-amber-500",
    leftAccentClass: "border-l-amber-500",
    dotClass: "bg-amber-500",
  },
  support: {
    label: "Support",
    badgeClass:
      "bg-zinc-400/20 text-zinc-600 dark:text-zinc-200 border-zinc-400/40 font-semibold",
    accentClass: "border-t-zinc-400",
    leftAccentClass: "border-l-zinc-400",
    dotClass: "bg-zinc-400",
  },
};

const CONJUNCT_LABELS: Record<Conjunct, string> = {
  C: "Claim state",
  E: "Evidence sufficiency",
  I: "Integrity (N_ind)",
  S: "Safety clearance",
  R: "Reviewer signoff",
};

const CONJUNCT_DESCRIPTIONS: Record<Conjunct, string> = {
  C: "Claim state meets threshold (≥ SUPPORTED)",
  E: "Sufficient evidence exists (≥ 3 distinct sources, or ≥ 2 with N_ind ≥ 2)",
  I: "Provenance integrity (N_ind ≥ 1; ≥ 2 for safety-critical)",
  S: "SafeGrid / SafeStacks safety clearance",
  R: "Second-reviewer signoff",
};

// ─── View ──────────────────────────────────────────────────────────────

interface RolesViewProps {
  onNavigate: (v: "landing" | "docs" | "ive" | "roles") => void;
}

export function RolesView({ onNavigate }: RolesViewProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ROLES.filter((r) => {
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tierFilter, search]);

  const selectedRole =
    ROLES.find((r) => r.id === selectedRoleId) ?? null;

  const strategicCount = ROLES.filter((r) => r.tier === "strategic").length;
  const operationalCount = ROLES.filter((r) => r.tier === "operational").length;
  const supportCount = ROLES.filter((r) => r.tier === "support").length;

  return (
    <div className="flex flex-col flex-1">
      {/* Toolbar */}
      <div className="border-b bg-muted/20 px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("docs")}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3 w-3" />
            Docs
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-mono text-muted-foreground">
            RTCAS — Role-Based Training, Certification & Authorization System
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            Alt+R
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
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  RTCAS Role Matrix
                </h1>
                <p className="text-sm text-muted-foreground">
                  Role-Based Training, Certification &amp; Authorization System
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <Card className="border-t-2 border-t-emerald-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Total Roles
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                      {ROLES.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-emerald-500/40" />
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-emerald-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Strategic Tier
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                      {strategicCount}
                    </p>
                  </div>
                  <Crown className="h-8 w-8 text-emerald-500/40" />
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-amber-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Operational + Support
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                      {operationalCount + supportCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-6 w-6 text-amber-500/40" />
                    <Activity className="h-6 w-6 text-zinc-400/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formula Note */}
            <div className="mt-4 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <ThreeRingsLogo size={28} />
                <div className="text-sm leading-relaxed">
                  <p className="font-mono font-semibold text-foreground">
                    A = C · E · I · S · R
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Each conjunct of the authorization formula maps to one or
                    more RTCAS roles. No single role may sign off on all five
                    conjuncts — this{" "}
                    <strong className="text-foreground">
                      separation of duties
                    </strong>{" "}
                    is the governance backbone of the SEARM Platform. The
                    matrix below shows which roles are authorized to attest
                    each conjunct.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Legend */}
          <RoleLegend />

          {/* Controls: Search + Tier Filter — sticky on scroll */}
          <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles by name..."
                className="h-9 text-sm pl-8 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "strategic", label: "Strategic" },
                  { id: "operational", label: "Operational" },
                  { id: "support", label: "Support" },
                ] as { id: TierFilter; label: string }[]
              ).map((opt) => {
                const active = tierFilter === opt.id;
                const tierDot =
                  opt.id === "strategic"
                    ? "bg-emerald-500"
                    : opt.id === "operational"
                    ? "bg-amber-500"
                    : opt.id === "support"
                    ? "bg-zinc-400"
                    : null;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTierFilter(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tierDot && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${tierDot}`}
                      />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground font-mono sm:ml-auto">
              {filteredRoles.length} / {ROLES.length} roles
            </div>
          </div>
          </div>

          {/* Role Grid */}
          {filteredRoles.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No roles match your filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoles.map((role, idx) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: idx * 0.06,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <RoleCard
                    role={role}
                    onOpen={() => setSelectedRoleId(role.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Role Authorization Mapping Table */}
          <AuthorizationMappingTable roles={ROLES} />

          {/* Footer CTA */}
          <div className="mt-12 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-semibold">
                    Explore the Authorization Engine
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  See the role matrix in action inside the IVE dashboard —
                  every authorization decision is recorded with its conjunct
                  signoffs, audit trail, and circuit-breaker state.
                </p>
              </div>
              <Button
                onClick={() => onNavigate("ive")}
                className="gap-2 shadow-sm shrink-0"
              >
                Launch IVE
                <ArrowLeft className="h-4 w-3 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Role Detail Modal */}
      <RoleDetailModal
        role={selectedRole}
        open={selectedRole !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedRoleId(null);
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ─── Role Card ─────────────────────────────────────────────────────────

function RoleCard({
  role,
  onOpen,
}: {
  role: Role;
  onOpen: () => void;
}) {
  const tier = TIER_META[role.tier];
  const Icon = role.icon;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`View details for ${role.name}`}
      className={`group cursor-pointer overflow-hidden border-t-2 border-l-2 ${tier.accentClass} ${tier.leftAccentClass} h-full flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0 transition-colors group-hover:bg-muted">
              <Icon className="h-5 w-5 text-foreground/80" />
            </div>
            <CardTitle className="text-sm font-semibold leading-tight">
              {role.name}
            </CardTitle>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/70" />
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] font-mono w-fit ${tier.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tier.dotClass} mr-1`} />
          {tier.label}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        <div className="mb-3 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Key Responsibilities
          </p>
          <ul className="space-y-1">
            {role.responsibilities.map((r, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground leading-relaxed flex gap-1.5"
              >
                <span className="text-foreground/40 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <Separator className="mb-3" />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Authorized Conjuncts (A = C·E·I·S·R)
          </p>
          {role.conjuncts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No direct conjunct signoff — support role
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {role.conjuncts.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="text-[10px] font-mono bg-foreground/5"
                  title={CONJUNCT_DESCRIPTIONS[c]}
                >
                  {c} — {CONJUNCT_LABELS[c]}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <p className="mt-auto pt-3 text-[10px] font-mono text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          Click for full role details →
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Role Legend ───────────────────────────────────────────────────────

function RoleLegend() {
  const tiers: { id: Tier; label: string; dot: string; desc: string }[] = [
    {
      id: "strategic",
      label: "Strategic",
      dot: "bg-emerald-500",
      desc: "Board & C-suite — sets policy and signs off on tier-1 incidents",
    },
    {
      id: "operational",
      label: "Operational",
      dot: "bg-amber-500",
      desc: "Day-to-day execution — runs verification, safety, and authorization",
    },
    {
      id: "support",
      label: "Support",
      dot: "bg-zinc-400",
      desc: "Integrity, mesh, calibration & admin — does not always sign conjuncts",
    },
  ];

  const conjuncts: Conjunct[] = ["C", "E", "I", "S", "R"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-6 rounded-xl border bg-muted/20 p-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Tier legend */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Tier Colors
          </p>
          <div className="flex flex-wrap gap-3">
            {tiers.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-1.5"
                title={t.desc}
              >
                <span
                  className={`mt-1 h-2 w-2 rounded-full ${t.dot} shrink-0`}
                />
                <div className="min-w-0">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1.5 py-0"
                  >
                    <span className={`h-1 w-1 rounded-full ${t.dot} mr-1`} />
                    {t.label}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1 max-w-[200px]">
                    {t.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator
          orientation="vertical"
          className="hidden lg:block h-16 mx-2"
        />

        {/* Conjunct legend */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Conjunct Badges — <span className="font-mono">A = C·E·I·S·R</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {conjuncts.map((c) => (
              <span
                key={c}
                title={CONJUNCT_DESCRIPTIONS[c]}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-1 text-[10px] font-mono"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  {c}
                </span>
                <span className="text-muted-foreground">
                  {CONJUNCT_LABELS[c]}
                </span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight mt-2">
            No single role signs all five — separation of duties is enforced.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Role Detail Modal ─────────────────────────────────────────────────

function RoleDetailModal({
  role,
  open,
  onOpenChange,
  onNavigate,
}: {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (v: "landing" | "docs" | "ive" | "roles") => void;
}) {
  const allConjuncts: Conjunct[] = ["C", "E", "I", "S", "R"];
  const reportsToRole = role?.reportsTo
    ? ROLES.find((r) => r.id === role.reportsTo) ?? null
    : null;

  // Determine whether the "View in IVE" CTA is meaningful for this role.
  // Operational roles (verification / authorization / safety / breaker) and
  // integrity-signing support roles map directly to IVE conjuncts.
  const hasIVEAffinity =
    role !== null &&
    (role.tier === "operational" || role.conjuncts.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {role && (
          <AnimatePresence mode="wait">
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Header band — tier-colored */}
              <div
                className={`relative px-6 pt-6 pb-4 border-b ${
                  role.tier === "strategic"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : role.tier === "operational"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-zinc-500/5 border-zinc-500/20"
                }`}
              >
                <div className="flex items-start gap-3 pr-8">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-background border shadow-sm shrink-0">
                    <role.icon className="h-6 w-6 text-foreground/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogHeader className="gap-1.5">
                      <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                        {role.name}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Full details for the {role.name} role.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          TIER_META[role.tier].badgeClass
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            TIER_META[role.tier].dotClass
                          } mr-1`}
                        />
                        {TIER_META[role.tier].label} Tier
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Role ID: {role.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Full description */}
                <section>
                  <SectionLabel icon={BookOpen}>Role Description</SectionLabel>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {role.fullDescription}
                  </p>
                </section>

                {/* Authorized conjuncts — visual badges */}
                <section>
                  <SectionLabel icon={Lock}>
                    Authorized Conjuncts{" "}
                    <span className="font-mono text-muted-foreground">
                      (A = C·E·I·S·R)
                    </span>
                  </SectionLabel>
                  <div className="grid grid-cols-5 gap-2">
                    {allConjuncts.map((c) => {
                      const signed = role.conjuncts.includes(c);
                      return (
                        <div
                          key={c}
                          title={CONJUNCT_DESCRIPTIONS[c]}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                            signed
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-md font-mono text-sm font-bold ${
                              signed
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground/40"
                            }`}
                          >
                            {c}
                          </div>
                          {signed ? (
                            <Check
                              className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                              strokeWidth={3}
                            />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                          <span className="text-[9px] font-mono text-muted-foreground text-center leading-tight">
                            {CONJUNCT_LABELS[c].split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {role.conjuncts.length === 0 && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      This is a support role — it does not sign conjuncts
                      directly, preserving separation of duties.
                    </p>
                  )}
                </section>

                {/* Visual separator between authorization & operational details */}
                <div className="relative py-1">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                    Operational Details
                  </span>
                </div>

                {/* Responsibilities */}
                <section>
                  <SectionLabel icon={Users}>Key Responsibilities</SectionLabel>
                  <ul className="space-y-1.5">
                    {role.responsibilities.map((r, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/80 leading-relaxed flex gap-2"
                      >
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Reports to */}
                <section>
                  <SectionLabel icon={ArrowUpRight}>Reports To</SectionLabel>
                  {reportsToRole ? (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background border shrink-0">
                        <reportsToRole.icon className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {reportsToRole.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {TIER_META[reportsToRole.tier].label} Tier ·{" "}
                          {reportsToRole.conjuncts.length === 0
                            ? "no direct conjuncts"
                            : `signs ${reportsToRole.conjuncts.join("·")}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Reports directly to the Board — no upstream SEARM role.
                    </p>
                  )}
                </section>

                {/* Required certifications / training */}
                <section>
                  <SectionLabel icon={Award}>
                    Required Certifications &amp; Training
                  </SectionLabel>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {role.certifications.map((cert, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/80 leading-relaxed flex gap-1.5 rounded-md border bg-background px-2 py-1.5"
                      >
                        <Award className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Example workflows */}
                <section>
                  <SectionLabel icon={Workflow}>Example Workflows</SectionLabel>
                  <ul className="space-y-2">
                    {role.workflows.map((w, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/80 leading-relaxed flex gap-2.5 rounded-md border-l-2 border-emerald-500/40 bg-muted/20 pl-3 py-1.5"
                      >
                        <span className="text-[10px] font-mono text-muted-foreground mt-1 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Footer with View in IVE button */}
              <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                {hasIVEAffinity && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onNavigate("ive");
                    }}
                    className="gap-1.5 shadow-sm"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    View in IVE
                  </Button>
                )}
              </DialogFooter>
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Section label helper ─────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {children}
      </p>
    </div>
  );
}


// ─── Authorization Mapping Table ───────────────────────────────────────

function AuthorizationMappingTable({ roles }: { roles: Role[] }) {
  const conjuncts: Conjunct[] = ["C", "E", "I", "S", "R"];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mt-12"
    >
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-5 w-5 text-amber-600" />
        <h2 className="text-xl font-bold tracking-tight">
          Role Authorization Mapping
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl leading-relaxed">
        Separation-of-duties matrix showing which RTCAS roles are authorized to
        sign off on each conjunct of{" "}
        <span className="font-mono font-semibold text-foreground">
          A = C · E · I · S · R
        </span>
        . No single role may sign all five conjuncts, preventing unilateral
        authorization.
      </p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-11 px-3 text-xs font-mono uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-mono uppercase tracking-wider">
                  Tier
                </TableHead>
                {conjuncts.map((c) => (
                  <TableHead
                    key={c}
                    className="h-11 px-3 text-center text-xs font-mono uppercase tracking-wider w-16"
                    title={CONJUNCT_DESCRIPTIONS[c]}
                  >
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const tier = TIER_META[role.tier];
                return (
                  <TableRow key={role.id} className={`hover:bg-muted/30 even:bg-muted/20 border-l-2 ${tier.leftAccentClass}`}>
                    <TableCell className="px-3 py-2.5 text-sm font-medium">
                      {role.name}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${tier.dotClass}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {tier.label}
                        </span>
                      </span>
                    </TableCell>
                    {conjuncts.map((c) => {
                      const signed = role.conjuncts.includes(c);
                      return (
                        <TableCell
                          key={c}
                          className="px-3 py-2.5 text-center align-middle"
                        >
                          {signed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground/40">
                              <X className="h-3 w-3" strokeWidth={2.5} />
                            </span>
                          )}
                          <span className="sr-only">
                            {signed ? "authorized" : "not authorized"}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          Role is authorized to sign this conjunct
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground/40">
            <X className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
          Role may not sign this conjunct (separation enforced)
        </div>
        <div className="flex items-center gap-3 ml-auto font-mono">
          {(["C", "E", "I", "S", "R"] as Conjunct[]).map((c) => (
            <span key={c} className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{c}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{CONJUNCT_LABELS[c]}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
