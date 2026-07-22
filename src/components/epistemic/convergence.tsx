"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  FileWarning, GitBranch, Activity, Shield, Eye, EyeOff,
  ChevronRight, CircleDot, Flag, Layers, Cpu, Lock,
  Fingerprint, ScrollText, Network, Terminal, LayoutDashboard,
  RotateCcw, TestTube2, Boxes, Milestone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  GradientBorderCard,
  SectionHeader,
  StatusPill,
  SeverityBadge,
  StatCard,
  containerVariants,
  cardVariants,
  itemVariants,
  TopAccentBar,
  SEVERITY_CLASSES,
} from "./primitives";
import { MetricGauge, DonutChart } from "./chart-primitives";

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };

/* ─── Card Shell ─── */
function Shell({ children, accent, className }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <Card className={`bg-card/80 backdrop-blur-sm border-border/60 p-4 relative overflow-hidden ${className ?? ""}`}>
      {accent && <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: accent }} />}
      <div className="bg-grid-fine absolute inset-0 opacity-15" />
      <div className="relative">{children}</div>
    </Card>
  );
}

/* ─── Sub-section Header ─── */
function H3({ icon: Icon, title, extra }: { icon: typeof Activity; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violating/10">
        <Icon className="h-3.5 w-3.5 text-violating" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {extra}
    </div>
  );
}

/* ─── Data ─── */

type ArchStatus = "CONTRADICTS SPEC" | "ARCHITECTURAL ONLY" | "PARTIALLY IMPLEMENTED" | "IMPLEMENTED" | "UNKNOWN" | "MOCK";
type RowColor = "violating" | "quarantined" | "repairing" | "verified" | "muted";

interface SpecRow {
  component: string;
  archStatus: ArchStatus;
  implStatus: string;
  readiness: number;
  color: RowColor;
}

const SPEC_MATRIX: SpecRow[] = [
  { component: "RFC8785 Canonicalizer", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "SHA256 Hash Engine", archStatus: "CONTRADICTS SPEC", implStatus: "WRONG ALGORITHM (FNV-1a)", readiness: 5, color: "violating" },
  { component: "Ed25519 Signatures", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Acceptance Pipeline", archStatus: "ARCHITECTURAL ONLY", implStatus: "MOCK DATA ONLY", readiness: 0, color: "quarantined" },
  { component: "Schema Registry", archStatus: "UNKNOWN", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "muted" },
  { component: "Identity Verifier", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Policy Engine", archStatus: "PARTIALLY IMPLEMENTED", implStatus: "Works for simple predicates", readiness: 35, color: "repairing" },
  { component: "Deterministic Sequencer", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Fact Log", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Proof Engine", archStatus: "CONTRADICTS SPEC", implStatus: "WRONG ALGORITHM", readiness: 10, color: "violating" },
  { component: "Projection Engine", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Trust Layer", archStatus: "PARTIALLY IMPLEMENTED", implStatus: "Simplistic scoring", readiness: 15, color: "repairing" },
  { component: "MMR", archStatus: "CONTRADICTS SPEC", implStatus: "WRONG ALGORITHM (binary Merkle)", readiness: 10, color: "violating" },
  { component: "Git Adapter", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Kubernetes Adapter", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "Argo Adapter", archStatus: "ARCHITECTURAL ONLY", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "quarantined" },
  { component: "CLI", archStatus: "MOCK", implStatus: "BROWSER TERMINAL", readiness: 5, color: "quarantined" },
  { component: "Dashboard", archStatus: "IMPLEMENTED", implStatus: "FULLY FUNCTIONAL", readiness: 90, color: "verified" },
  { component: "Replay", archStatus: "PARTIALLY IMPLEMENTED", implStatus: "UI-only, no state reconstruction", readiness: 10, color: "repairing" },
  { component: "QA", archStatus: "UNKNOWN", implStatus: "NOT IMPLEMENTED", readiness: 0, color: "muted" },
];

interface NonDeterminism {
  description: string;
  location: string;
  severity: "critical" | "high";
}

const CRITICAL_ND: NonDeterminism[] = [
  { description: "Date.now() in MMR root computation", location: "mmr-proofs", severity: "critical" },
  { description: "Math.random() for ZK proof generation (instance 1)", location: "zk-circuit", severity: "critical" },
  { description: "Math.random() for ZK proof generation (instance 2)", location: "zk-circuit", severity: "critical" },
  { description: "Date.now() in proof leaf hash", location: "mmr-proofs", severity: "critical" },
  { description: "Math.random() for shadow bridge perturbation", location: "shadow-bridge", severity: "critical" },
  { description: "Date.now() in expression evaluator now() function", location: "policy-studio", severity: "critical" },
  { description: "JSON.stringify for state hashing (key ordering not deterministic)", location: "acceptance-engine", severity: "critical" },
  { description: "Math.random() in seed data for ZK proofs", location: "seed.ts", severity: "critical" },
];

const HIGH_ND: NonDeterminism[] = [
  { description: "Math.random() for latency metrics", location: "performance-metrics", severity: "high" },
  { description: "JSON.stringify for MMR input (non-canonical)", location: "mmr-proofs", severity: "high" },
  { description: "CUID IDs include timestamps", location: "prisma schema", severity: "high" },
];

interface Drift {
  title: string;
  description: string;
  impact: string;
  reconciliation: string;
}

const DRIFTS: Drift[] = [
  { title: "Multiple Write Paths", description: "Policies created via POST and seed.ts with different side effects", impact: "State divergence between seed and runtime paths", reconciliation: "Unify through acceptance pipeline" },
  { title: "No Acceptance Pipeline", description: "Every write goes directly to SQLite, no pipeline", impact: "No validation gate, no fact lifecycle", reconciliation: "Implement canonical acceptance pipeline as kernel" },
  { title: "Non-deterministic Hashing", description: "FNV-1a + Date.now() + JSON.stringify", impact: "Hashes change between runs, no reproducibility", reconciliation: "Replace with SHA-256 + RFC8785 canonicalization" },
  { title: "Mutable State", description: "Prisma update allows direct mutation, no event sourcing", impact: "No audit trail, no replay, no time-travel", reconciliation: "Append-only fact log with projection engine" },
  { title: "Duplicate Projection Logic", description: "Invariant evaluation in 4+ independent routes", impact: "Divergent evaluation results, maintenance burden", reconciliation: "Single projection engine as source of truth" },
  { title: "Duplicate Proof Generation", description: "MMR root in 3 separate paths", impact: "Different roots for same data, trust failure", reconciliation: "Single MMR implementation with canonical interface" },
  { title: "No Identity System", description: "Only CUID primary keys", impact: "No verifiable identity, no cryptographic proofs", reconciliation: "Ed25519 key generation + identity verifier" },
  { title: "No Event Store", description: "Separate tables, no unified fact log", impact: "No temporal queries, no replay, no provenance", reconciliation: "Unified fact log with deterministic sequencing" },
  { title: "No Policy Version Pinning", description: "EPD evaluator re-parses on every call", impact: "Non-deterministic evaluation if DSL changes", reconciliation: "Version-aware schema registry + pinned evaluation" },
];

interface RealItem {
  title: string;
  description: string;
}

const WHAT_IS_REAL: RealItem[] = [
  { title: "EPD DSL", description: "Tokenizer → Parser → Validator → Evaluator → Self-repair is functional" },
  { title: "Dashboard", description: "17 sections, dark/light mode, keyboard shortcuts, command palette" },
  { title: "Prisma Schema", description: "8 models with seeded data" },
  { title: "Trust Scoring", description: "Gaussian PDF + Bayesian posterior on seeded data" },
];

interface RoadmapItem {
  step: number;
  title: string;
  description: string;
  dependencies: string;
  complexity: "HIGH" | "MEDIUM";
  dependsOnSteps: number[];
}

const ROADMAP: RoadmapItem[] = [
  { step: 1, title: "Complete Acceptance Pipeline", description: "The kernel. Everything depends on this.", dependencies: "None (foundational)", complexity: "HIGH", dependsOnSteps: [] },
  { step: 2, title: "Replace FNV-1a with SHA-256", description: "Fix the hash contradiction", dependencies: "None", complexity: "MEDIUM", dependsOnSteps: [] },
  { step: 3, title: "Implement RFC8785 Canonicalizer", description: "Deterministic serialization", dependencies: "None", complexity: "MEDIUM", dependsOnSteps: [] },
  { step: 4, title: "Implement Fact Log", description: "Append-only event store", dependencies: "Acceptance Pipeline", complexity: "HIGH", dependsOnSteps: [1] },
  { step: 5, title: "Implement Deterministic Sequencer", description: "Logical sequence + vector clocks", dependencies: "Fact Log", complexity: "MEDIUM", dependsOnSteps: [4] },
  { step: 6, title: "Implement Projection Engine", description: "State(t) = Projection(facts, t)", dependencies: "Fact Log", complexity: "HIGH", dependsOnSteps: [4] },
  { step: 7, title: "Implement Ed25519 Signatures", description: "Key generation + verification", dependencies: "Canonicalizer", complexity: "MEDIUM", dependsOnSteps: [3] },
  { step: 8, title: "Fix MMR Implementation", description: "Replace binary Merkle with proper MMR", dependencies: "SHA-256", complexity: "HIGH", dependsOnSteps: [2] },
  { step: 9, title: "Implement Schema Registry", description: "Version-aware schema validation", dependencies: "Fact Log", complexity: "MEDIUM", dependsOnSteps: [4] },
  { step: 10, title: "Implement Policy Time-Travel", description: "Evaluate at fact.acceptedAt", dependencies: "Schema Registry", complexity: "MEDIUM", dependsOnSteps: [9] },
];

/* ─── Color helpers ─── */
function archStatusColor(status: ArchStatus): RowColor {
  switch (status) {
    case "CONTRADICTS SPEC": return "violating";
    case "ARCHITECTURAL ONLY": return "quarantined";
    case "PARTIALLY IMPLEMENTED": return "repairing";
    case "IMPLEMENTED": return "verified";
    case "MOCK": return "quarantined";
    case "UNKNOWN": return "muted";
  }
}

function archStatusPill(status: ArchStatus) {
  const color = archStatusColor(status);
  const map: Record<RowColor, string> = {
    violating: "border-violating/40 bg-violating/10 text-violating",
    quarantined: "border-quarantined/40 bg-quarantined/10 text-quarantined",
    repairing: "border-repairing/40 bg-repairing/10 text-repairing",
    verified: "border-verified/40 bg-verified/10 text-verified",
    muted: "border-border bg-muted text-muted-foreground",
  };
  return map[color];
}

function readinessBarColor(readiness: number): string {
  if (readiness >= 80) return "bg-verified";
  if (readiness >= 30) return "bg-repairing";
  if (readiness >= 5) return "bg-quarantined";
  return "bg-violating";
}

/* ─── 1. Executive Summary Panel ─── */
function ExecutiveSummaryPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.65 0.2 25), oklch(0.55 0.18 40))">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violating/10 border border-violating/30">
          <ShieldAlert className="h-4 w-4 text-violating" />
        </div>
        <h3 className="text-base font-semibold">Executive Summary</h3>
      </div>

      <motion.div
        className="rounded-lg border border-violating/30 bg-violating/5 p-3 mb-4"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-2">
          <XCircle className="h-4 w-4 text-violating mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violating">VERDICT</p>
            <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
              This project is a <strong>DASHBOARD/VISUALIZATION</strong> that <strong>SIMULATES</strong> an Epistemic Runtime.
              It is <strong>NOT</strong> a working implementation.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="flex flex-col items-center">
          <MetricGauge value={8} max={100} label="Spec Implementation" color="violating" size={120} />
        </div>
        <StatCard label="Remaining" value="~92%" color="text-violating" bg="bg-violating/5" border="border-violating/20" />
        <StatCard label="Dashboard" value="90%" color="text-verified" bg="bg-verified/5" border="border-verified/20" />
        <StatCard label="Kernel" value="~5%" color="text-violating" bg="bg-violating/5" border="border-violating/20" />
      </div>

      <div className="text-[10px] text-muted-foreground leading-relaxed">
        <strong className="text-violating/80">Remaining ~92%:</strong> acceptance pipeline, canonicalization, SHA-256, Ed25519, fact lifecycle, sequencing, event sourcing, projection engine, identity, distributed consensus, adapters
      </div>
    </Shell>
  );
}

/* ─── 2. Specification Mapping Matrix ─── */
function SpecMappingMatrix() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.70 0.14 75), oklch(0.55 0.12 80))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-quarantined/10 border border-quarantined/30">
          <Layers className="h-4 w-4 text-quarantined" />
        </div>
        <h3 className="text-base font-semibold">Specification Mapping Matrix</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{SPEC_MATRIX.length} components</span>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border border-border/40 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border/40">
              <th className="text-left py-2 px-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Spec Component</th>
              <th className="text-left py-2 px-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Architecture Status</th>
              <th className="text-left py-2 px-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Implementation Status</th>
              <th className="text-right py-2 px-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {SPEC_MATRIX.map((row, i) => (
              <motion.tr
                key={row.component}
                className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="py-2 px-2.5 font-medium text-foreground/90">{row.component}</td>
                <td className="py-2 px-2.5">
                  <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${archStatusPill(row.archStatus)}`}>
                    {row.archStatus === "CONTRADICTS SPEC" && <XCircle className="h-2.5 w-2.5" />}
                    {row.archStatus === "ARCHITECTURAL ONLY" && <FileWarning className="h-2.5 w-2.5" />}
                    {row.archStatus === "PARTIALLY IMPLEMENTED" && <AlertTriangle className="h-2.5 w-2.5" />}
                    {row.archStatus === "IMPLEMENTED" && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {row.archStatus === "MOCK" && <EyeOff className="h-2.5 w-2.5" />}
                    {row.archStatus === "UNKNOWN" && <CircleDot className="h-2.5 w-2.5" />}
                    {row.archStatus}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-muted-foreground">{row.implStatus}</td>
                <td className="py-2 px-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${readinessBarColor(row.readiness)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${row.readiness}%` }}
                        transition={{ duration: 0.6, delay: i * 0.03 }}
                      />
                    </div>
                    <span className="font-mono text-[10px] w-7 text-right">{row.readiness}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><XCircle className="h-2.5 w-2.5 text-violating" /> Contradicts Spec</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><FileWarning className="h-2.5 w-2.5 text-quarantined" /> Architectural Only</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><AlertTriangle className="h-2.5 w-2.5 text-repairing" /> Partial</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CheckCircle2 className="h-2.5 w-2.5 text-verified" /> Implemented</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CircleDot className="h-2.5 w-2.5 text-muted-foreground" /> Unknown</span>
      </div>
    </Shell>
  );
}

/* ─── 3. Determinism Audit Panel ─── */
function DeterminismAuditPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.65 0.2 25), oklch(0.60 0.18 35))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violating/10 border border-violating/30">
          <AlertTriangle className="h-4 w-4 text-violating" />
        </div>
        <h3 className="text-base font-semibold">Determinism Audit</h3>
        <div className="ml-auto flex items-center gap-2">
          <SeverityBadge severity="critical" />
          <span className="text-[10px] text-muted-foreground">{CRITICAL_ND.length} critical · {HIGH_ND.length} high</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <p className="text-[10px] uppercase tracking-wide text-violating font-semibold">CRITICAL non-determinism ({CRITICAL_ND.length})</p>
        <div className="max-h-48 overflow-y-auto rounded-md border border-violating/20 bg-violating/5 p-2 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {CRITICAL_ND.map((nd, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-violating/10 transition-colors"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <SeverityBadge severity="critical" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground/90 leading-tight">{nd.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{nd.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wide text-repairing font-semibold">HIGH instances ({HIGH_ND.length})</p>
        <div className="rounded-md border border-repairing/20 bg-repairing/5 p-2 space-y-1.5">
          {HIGH_ND.map((nd, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-repairing/10 transition-colors"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <SeverityBadge severity="high" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground/90 leading-tight">{nd.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{nd.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ─── 4. Drift Detection Panel ─── */
function DriftDetectionPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.72 0.14 70), oklch(0.60 0.12 75))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-quarantined/10 border border-quarantined/30">
          <GitBranch className="h-4 w-4 text-quarantined" />
        </div>
        <h3 className="text-base font-semibold">Drift Detection</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{DRIFTS.length} drifts identified</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {DRIFTS.map((drift, i) => (
          <motion.div
            key={drift.title}
            className="rounded-lg border border-quarantined/20 bg-quarantined/5 p-3 hover:bg-quarantined/10 transition-colors"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-quarantined/20 text-[10px] font-bold text-quarantined">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground/90">{drift.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{drift.description}</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                  <div className="flex items-center gap-1 text-[10px]">
                    <Flag className="h-3 w-3 text-violating" />
                    <span className="text-muted-foreground">Impact:</span>
                    <span className="text-foreground/80">{drift.impact}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <ArrowRight className="h-3 w-3 text-verified" />
                    <span className="text-muted-foreground">Fix:</span>
                    <span className="text-verified/80">{drift.reconciliation}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  );
}

/* ─── 5. What IS Real Panel ─── */
function WhatIsRealPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.78 0.16 160), oklch(0.65 0.14 165))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verified/10 border border-verified/30">
          <CheckCircle2 className="h-4 w-4 text-verified" />
        </div>
        <h3 className="text-base font-semibold">What IS Real</h3>
        <span className="ml-auto">
          <StatusPill status="verified" label="Genuinely Implemented" />
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {WHAT_IS_REAL.map((item, i) => (
          <motion.div
            key={item.title}
            className="rounded-lg border border-verified/20 bg-verified/5 p-3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
              <p className="text-xs font-semibold text-verified">{item.title}</p>
            </div>
            <p className="text-[11px] text-muted-foreground pl-5.5">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </Shell>
  );
}

/* ─── 6. Execution Roadmap Panel ─── */
function RoadmapPanel() {
  return (
    <Shell accent="linear-gradient(to right, oklch(0.75 0.14 165), oklch(0.60 0.12 170))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-repairing/10 border border-repairing/30">
          <Milestone className="h-4 w-4 text-repairing" />
        </div>
        <h3 className="text-base font-semibold">Execution Roadmap</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">10 steps · 8-12 months</span>
      </div>

      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {ROADMAP.map((item) => (
          <motion.div
            key={item.step}
            className="rounded-lg border border-border/40 bg-muted/10 p-3 hover:bg-muted/20 transition-colors relative"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.step * 0.05 }}
          >
            {/* Dependency arrows */}
            {item.dependsOnSteps.length > 0 && (
              <div className="absolute -top-2 left-6 flex items-center gap-0.5">
                {item.dependsOnSteps.map((depStep) => (
                  <span key={depStep} className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground bg-muted/60 px-1 py-0.5 rounded">
                    <ArrowRight className="h-2 w-2" />
                    Step {depStep}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                item.complexity === "HIGH" ? "bg-violating/10 text-violating border border-violating/30" : "bg-repairing/10 text-repairing border border-repairing/30"
              }`}>
                {item.step}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-foreground/90">{item.title}</p>
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    item.complexity === "HIGH"
                      ? "bg-violating/10 text-violating border border-violating/20"
                      : "bg-repairing/10 text-repairing border border-repairing/20"
                  }`}>
                    {item.complexity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Depends on:</span>
                  <span className="text-foreground/70">{item.dependencies}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dependency flow visualization */}
      <div className="mt-3 p-2 rounded-md border border-border/30 bg-muted/10">
        <p className="text-[10px] text-muted-foreground mb-1.5">Dependency chain:</p>
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <span className="font-mono text-violating">1</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-repairing">4</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-repairing">5</span>
          <span className="text-muted-foreground mx-0.5">/</span>
          <span className="font-mono text-repairing">6</span>
          <span className="text-muted-foreground mx-0.5">/</span>
          <span className="font-mono text-repairing">9</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-verified">10</span>
          <span className="text-muted-foreground mx-1">|</span>
          <span className="font-mono text-violating">2</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-repairing">8</span>
          <span className="text-muted-foreground mx-1">|</span>
          <span className="font-mono text-repairing">3</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-repairing">7</span>
        </div>
      </div>
    </Shell>
  );
}

/* ─── 7. Final Verdict Panel ─── */
function FinalVerdictPanel() {
  const verdicts = [
    {
      question: "Are we building the same system described by the Epistemic Runtime specification?",
      answer: "PARTIALLY. The specification describes a deterministic evidence kernel. The current implementation is a visualization that simulates such a kernel. The .epd DSL evaluator is real and aligned with the spec. Everything else is architectural only, contradicts the spec, or does not exist.",
      status: "quarantined" as const,
    },
    {
      question: "Is the implementation converging toward that architecture?",
      answer: "NO. The current trajectory adds more dashboard sections and mock APIs, not kernel implementation. Each new section adds visualization of concepts that have no executable backing. Without implementing the acceptance pipeline first, the project will continue to diverge from the spec.",
      status: "violating" as const,
    },
    {
      question: "Are there architectural contradictions?",
      answer: "YES. Three components CONTRADICT the specification:\n• Hash engine uses FNV-1a (not SHA-256)\n• \"MMR\" is a simple binary Merkle tree (not a Merkle Mountain Range)\n• ZK proofs are random strings with hardcoded verification (not cryptographic proofs)",
      status: "violating" as const,
    },
    {
      question: "What is the minimum remaining work before production-grade?",
      answer: "The 10-item execution roadmap above. Estimated total: 8-12 months of focused kernel development, starting with the acceptance pipeline.",
      status: "repairing" as const,
    },
  ];

  const statusIcon = {
    quarantined: FileWarning,
    violating: XCircle,
    repairing: AlertTriangle,
    verified: CheckCircle2,
  };

  return (
    <Shell accent="linear-gradient(to right, oklch(0.60 0.18 30), oklch(0.55 0.16 35))">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violating/10 border border-violating/30">
          <Flag className="h-4 w-4 text-violating" />
        </div>
        <h3 className="text-base font-semibold">Final Verdict</h3>
      </div>

      <div className="space-y-3">
        {verdicts.map((v, i) => {
          const Icon = statusIcon[v.status];
          const borderColor = v.status === "violating" ? "border-violating/30" : v.status === "quarantined" ? "border-quarantined/30" : v.status === "repairing" ? "border-repairing/30" : "border-verified/30";
          const bgColor = v.status === "violating" ? "bg-violating/5" : v.status === "quarantined" ? "bg-quarantined/5" : v.status === "repairing" ? "bg-repairing/5" : "bg-verified/5";

          return (
            <motion.div
              key={i}
              className={`rounded-lg border ${borderColor} ${bgColor} p-3`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 text-${v.status}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground/90 mb-1">Q: {v.question}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">A: {v.answer}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ─── Main Section Component ─── */
export function ConvergenceSection() {
  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section header */}
      <SectionHeader
        icon={ShieldAlert}
        title="Convergence Report"
        subtitle="Brutally honest assessment: does the implementation match the specification?"
        iconClass="border-violating/30 bg-violating/10 text-violating"
      />

      {/* 1. Executive Summary */}
      <motion.div variants={cardVariants}>
        <ExecutiveSummaryPanel />
      </motion.div>

      {/* 2. Spec Mapping Matrix */}
      <motion.div variants={cardVariants}>
        <SpecMappingMatrix />
      </motion.div>

      {/* 3. Determinism Audit + Drift Detection side-by-side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={cardVariants}>
          <DeterminismAuditPanel />
        </motion.div>
        <motion.div variants={cardVariants}>
          <DriftDetectionPanel />
        </motion.div>
      </div>

      {/* 4. What IS Real */}
      <motion.div variants={cardVariants}>
        <WhatIsRealPanel />
      </motion.div>

      {/* 5. Execution Roadmap */}
      <motion.div variants={cardVariants}>
        <RoadmapPanel />
      </motion.div>

      {/* 6. Final Verdict */}
      <motion.div variants={cardVariants}>
        <FinalVerdictPanel />
      </motion.div>
    </motion.div>
  );
}
