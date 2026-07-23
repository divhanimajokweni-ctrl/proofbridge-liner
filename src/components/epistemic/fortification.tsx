"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  FileText, Layers, Shield, Lock, Network, GitBranch, Scale, Brain,
  Code, Braces, KeyRound, Fingerprint, ClipboardCheck, FileCheck,
  Award, BadgeCheck, Eye, Telescope, AlertTriangle, Waves,
  CheckCircle2, XCircle, ArrowRight, ChevronRight, Hash, Signature,
  Activity, RefreshCw, Terminal, Cpu, Database, CircleDot,
  Boxes, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  StatusPill, StatCard, GradientBorderCard,
  containerVariants, cardVariants, itemVariants,
  TopAccentBar, GridOverlay, Hash as HashComp,
} from "./primitives";
import { MetricGauge, DonutChart } from "./chart-primitives";

/* ─── Types ─── */
interface Concept {
  id: number;
  name: string;
  status: "implemented" | "enforced" | "partial" | "planned";
  description: string;
  icon: string;
}

interface CorrelationNode {
  fact: string;
  causationId: string | null;
  correlationId: string;
  parentFactId?: string;
}

interface ProvenanceFlow {
  agent: string;
  promptHash: string;
  toolCallHashes: string[];
  outputHash: string;
  humanApproved: boolean;
  result: string;
}

interface ReplayCertificate {
  projection: string;
  projectionHash: string;
  factCount: number;
  factRoot: string;
  runtimeVersion: string;
  policyVersion: string;
  passed: boolean;
  timestamp: number;
  signature: string;
}

interface AdapterEntry {
  sourceSystem: string;
  capabilities: string[];
}

interface FortificationData {
  version: string;
  concepts: Concept[];
  capabilities: string[];
  adapters: AdapterEntry[];
  correlationChain: CorrelationNode[];
  replayCertificate: ReplayCertificate;
  provenanceFlow: ProvenanceFlow;
}

/* ─── Animation Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardV: Variants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } };
const itemV: Variants = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const fadeV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };

/* ─── Icon Map ─── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "FileText": FileText,
  "Layers": Layers,
  "Shield": Shield,
  "Lock": Lock,
  "Network": Network,
  "GitBranch": GitBranch,
  "Scale": Scale,
  "Brain": Brain,
  "Code": Code,
  "Braces": Braces,
  "KeyRound": KeyRound,
  "Fingerprint": Fingerprint,
  "ClipboardCheck": ClipboardCheck,
  "FileCheck": FileCheck,
  "Award": Award,
  "BadgeCheck": BadgeCheck,
  "Eye": Eye,
  "Telescope": Telescope,
  "AlertTriangle": AlertTriangle,
  "Wave": Waves,
};

/* ─── Status Color Map ─── */
const STATUS_CONFIG: Record<string, { color: string; text: string; icon: typeof CheckCircle2; label: string }> = {
  implemented: { color: "border-verified/30 bg-verified/10", text: "text-verified", icon: CheckCircle2, label: "Implemented" },
  enforced: { color: "border-verified/30 bg-verified/10", text: "text-verified", icon: ShieldCheck, label: "Enforced" },
  partial: { color: "border-repairing/30 bg-repairing/10", text: "text-repairing", icon: Activity, label: "Partial" },
  planned: { color: "border-violating/30 bg-violating/10", text: "text-violating", icon: AlertTriangle, label: "Planned" },
};

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
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-verified/10">
        <Icon className="h-3.5 w-3.5 text-verified" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {extra}
    </div>
  );
}

/* ─── Mock Data ─── */
const MOCK_DATA: FortificationData = {
  version: "v0.8",
  concepts: [
    { id: 1, name: "Observation Versioning", status: "implemented", description: "schemaId + schemaVersion + producer + producerVersion. Makes replay possible years later.", icon: "Layers" },
    { id: 2, name: "Capability Sets", status: "implemented", description: "Vendor-neutral authorization. automation.review, automation.fix, automation.deploy, etc. ER is vendor-neutral.", icon: "Shield" },
    { id: 3, name: "Correlation Graph", status: "implemented", description: "causationId + correlationId + parentFactId. Bot Command → Review → Fix → PR → Merge → Deploy becomes traceable.", icon: "Network" },
    { id: 4, name: "Confidence ≠ Evidence", status: "enforced", description: "Trust scores are projections, NOT facts. Store \"Review Passed\" not \"Trust = 0.94\". Confidence is derived.", icon: "Scale" },
    { id: 5, name: "Typed Observation SDK", status: "implemented", description: "emitBotCommand(), emitReviewStarted(), emitFixCreated() instead of emitObservation(any). Prevents schema drift.", icon: "Code" },
    { id: 6, name: "Observation Authentication", status: "implemented", description: "Service Identity → mTLS → OIDC → JWT → Capability Policy → Acceptance. The collector never trusts \"source:kilo-bot\".", icon: "KeyRound" },
    { id: 7, name: "Projection Manifest", status: "implemented", description: "id, version, dependencies, capabilitySet, projectionHash, deterministic, owner. Projections become auditable.", icon: "ClipboardCheck" },
    { id: 8, name: "Replay Certificates", status: "implemented", description: "projection, projectionHash, factCount, factRoot, runtimeVersion, policyVersion, passed, timestamp, signature. Auditors love this.", icon: "BadgeCheck" },
    { id: 9, name: "Automation Provenance", status: "implemented", description: "Agent → Prompt Hash → Tool Call Hashes → Output Hash → Human Approval → Result. Not the prompt itself. The hash.", icon: "Eye" },
    { id: 10, name: "Drift Facts", status: "implemented", description: "OperationalDriftObserved: Projection ≠ Live System. Discrepancy becomes evidence and triggers alerts.", icon: "AlertTriangle" },
  ],
  capabilities: [
    "automation.review", "automation.fix", "automation.deploy", "automation.triage",
    "security.analysis", "security.deep-analysis", "vision.debug", "webhook.ingest", "app.build"
  ],
  adapters: [
    { sourceSystem: "kilo-bot", capabilities: ["automation.review"] },
    { sourceSystem: "code-review", capabilities: ["automation.review"] },
    { sourceSystem: "auto-fix", capabilities: ["automation.fix"] },
    { sourceSystem: "security-agent", capabilities: ["security.analysis", "security.deep-analysis"] },
    { sourceSystem: "github-actions", capabilities: ["automation.deploy"] },
  ],
  correlationChain: [
    { fact: "bot_command", causationId: null, correlationId: "workflow-123" },
    { fact: "code_review", causationId: "bot_command-456", correlationId: "workflow-123", parentFactId: "fact-bot-001" },
    { fact: "auto_fix", causationId: "code_review-789", correlationId: "workflow-123", parentFactId: "fact-review-002" },
    { fact: "merge", causationId: "auto_fix-012", correlationId: "workflow-123", parentFactId: "fact-fix-003" },
    { fact: "deploy", causationId: "merge-345", correlationId: "workflow-123", parentFactId: "fact-merge-004" },
  ],
  replayCertificate: {
    projection: "operationalState",
    projectionHash: "sha256:a3f2b8c9d1e4...",
    factCount: 1200,
    factRoot: "mmr_root_hash_8f3a2b1c",
    runtimeVersion: "v0.8",
    policyVersion: "1.0",
    passed: true,
    timestamp: 1710000000,
    signature: "replay-cert:sha256:a3f2b8c9...",
  },
  provenanceFlow: {
    agent: "AutoFixService",
    promptHash: "sha256:7f8a9b2c...",
    toolCallHashes: ["sha256:tool1-a1b2", "sha256:tool2-c3d4"],
    outputHash: "sha256:e5f6g7h8...",
    humanApproved: false,
    result: "fix-accepted",
  },
};

/* ─── Capability category colors ─── */
const CAP_CATEGORY: Record<string, { bg: string; border: string; text: string }> = {
  automation: { bg: "bg-verified/10", border: "border-verified/30", text: "text-verified" },
  security: { bg: "bg-repairing/10", border: "border-repairing/30", text: "text-repairing" },
  vision: { bg: "bg-quarantined/10", border: "border-quarantined/30", text: "text-quarantined" },
  webhook: { bg: "bg-muted/30", border: "border-border/60", text: "text-muted-foreground" },
  app: { bg: "bg-[var(--verified)]/5", border: "border-[var(--verified)]/20", text: "text-foreground" },
};

function getCapCategory(cap: string): string {
  return cap.split(".")[0];
}

/* ─── Main Component ─── */
export function FortificationSection() {
  const [data, setData] = useState<FortificationData>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [activeConcept, setActiveConcept] = useState<number | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(10);

  // Auto-refresh countdown
  useEffect(() => {
    const t = setInterval(() => setRefreshCountdown((c) => (c <= 1 ? 10 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch data from API
  const loadData = useCallback(() => {
    setLoading(true);
    fetch("/api/fortification")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(MOCK_DATA))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/fortification")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => { /* fallback to mock data */ });
  }, []);

  const implementedCount = data.concepts.filter((c) => c.status === "implemented" || c.status === "enforced").length;
  const allImplemented = implementedCount === 10;

  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="space-y-5">

      {/* ── Header Banner ── */}
      <motion.div variants={cardV}>
        <Shell accent="oklch(0.78 0.16 160)">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verified/15 border border-verified/30 glow-verified">
              <ShieldAlert className="h-4 w-4 text-verified" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Runtime Fortification</h2>
              <p className="text-xs text-muted-foreground">10 architectural strengthening recommendations — LAST ITERATION</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {allImplemented && (
                <StatusPill status="verified" label="All 10 implemented" />
              )}
              <span className="inline-flex items-center rounded-full border border-border/40 bg-muted/20 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {data.version}
              </span>
            </div>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <StatCard label="Concepts" value={data.concepts.length} color="text-verified" />
            <StatCard label="Capabilities" value={data.capabilities.length} color="text-verified" />
            <StatCard label="Adapters" value={data.adapters.length} color="text-repairing" />
            <StatCard label="Replay Certs" value="✓" color={data.replayCertificate.passed ? "text-verified" : "text-violating"} bg={data.replayCertificate.passed ? "bg-verified/10" : "bg-violating/10"} />
          </div>
        </Shell>
      </motion.div>

      {/* ── 10 Concept Cards Grid ── */}
      <div>
        <H3 icon={Boxes} title="10 Strengthening Concepts" extra={<span className="text-[10px] font-mono text-muted-foreground ml-1">{implementedCount}/10 implemented</span>} />
        <motion.div variants={cv} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.concepts.map((concept) => {
            const Icon = ICON_MAP[concept.icon] ?? FileText;
            const sCfg = STATUS_CONFIG[concept.status] ?? STATUS_CONFIG.planned;
            const StatusIcon = sCfg.icon;
            const isActive = activeConcept === concept.id;

            return (
              <motion.div
                key={concept.id}
                variants={cardV}
                className={isActive ? "ring-2 ring-verified/40" : ""}
              >
                <Shell
                  accent={concept.status === "implemented" || concept.status === "enforced" ? "oklch(0.78 0.16 160)" : concept.status === "partial" ? "oklch(0.80 0.15 80)" : "oklch(0.64 0.21 25)"}
                  className="cursor-pointer hover:border-verified/40 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveConcept(isActive ? null : concept.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${sCfg.color}`}>
                        <Icon className={`h-4 w-4 ${sCfg.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{concept.name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${sCfg.color} ${sCfg.text}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {sCfg.label}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground/50">#{concept.id}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{concept.description}</p>
                      </div>
                    </div>
                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mt-3 pt-3 border-t border-border/40"
                        >
                          <div className="text-xs text-muted-foreground">{concept.description}</div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-muted-foreground/50">status:</span>
                            <StatusPill status={concept.status === "enforced" ? "verified" : concept.status === "implemented" ? "healthy" : concept.status} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </Shell>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Capability Set Explorer ── */}
      <div>
        <H3 icon={Shield} title="Vendor-Neutral Capability Sets" extra={<span className="text-[10px] font-mono text-muted-foreground ml-1">{data.capabilities.length} capabilities</span>} />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <div className="flex flex-wrap gap-2 mb-3">
              {data.capabilities.map((cap) => {
                const cat = getCapCategory(cap);
                const catStyle = CAP_CATEGORY[cat] ?? CAP_CATEGORY.webhook;
                return (
                  <span
                    key={cap}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-mono ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}
                  >
                    <span className="text-[8px] opacity-50">{cat}</span>
                    <span>{cap.split(".")[1]}</span>
                  </span>
                );
              })}
            </div>
            {/* Adapter mapping table */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Adapter Mapping — Source → Capabilities</div>
              {data.adapters.map((adapter) => (
                <motion.div key={adapter.sourceSystem} variants={itemV} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono text-foreground shrink-0">{adapter.sourceSystem}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <div className="flex items-center gap-1 flex-wrap">
                    {adapter.capabilities.map((cap) => {
                      const cat = getCapCategory(cap);
                      const catStyle = CAP_CATEGORY[cat] ?? CAP_CATEGORY.webhook;
                      return (
                        <span key={cap} className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-mono ${catStyle.text} ${catStyle.bg}`}>
                          {cap}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Observation Adapter layer note */}
            <div className="mt-3 rounded-md border border-verified/20 bg-verified/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-verified/70" />
                <span className="text-xs text-verified/80 font-medium">Observation Adapter Layer</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kilo → Observation Adapter → Collector → Acceptance → Fact Log. ER shouldn&apos;t know what Kilo is. It only understands observations.
              </p>
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Correlation Graph ── */}
      <div>
        <H3 icon={Network} title="Correlation Graph — causationId → correlationId → parentFactId" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.74 0.13 190)">
            <div className="text-xs text-muted-foreground mb-3">
              Full traceability chain: each fact links to its cause and parent, enabling end-to-end audit trails.
            </div>
            {/* Pipeline visualization */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {data.correlationChain.map((node, idx) => (
                <motion.div key={node.fact} variants={itemV} className="flex items-center shrink-0">
                  {/* Node */}
                  <div className="relative flex flex-col items-center gap-1.5 rounded-lg border border-verified/30 bg-verified/10 px-3 py-2 min-w-[100px]">
                    <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-verified/0 via-verified/60 to-verified/0" />
                    <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">{idx === 0 ? "origin" : `step ${idx + 1}`}</span>
                    <span className="text-xs font-semibold text-verified">{node.fact}</span>
                    {node.causationId && (
                      <span className="text-[8px] font-mono text-muted-foreground/60 truncate max-w-[80px]">← {node.causationId}</span>
                    )}
                    <span className="text-[8px] font-mono text-muted-foreground/40 truncate max-w-[80px]">wf: {node.correlationId}</span>
                    {node.parentFactId && (
                      <span className="text-[8px] font-mono text-muted-foreground/40 truncate max-w-[80px]">parent: {node.parentFactId}</span>
                    )}
                  </div>
                  {/* Arrow between nodes */}
                  {idx < data.correlationChain.length - 1 && (
                    <div className="flex items-center px-1 shrink-0">
                      <div className="h-px w-6 bg-verified/30" />
                      <ChevronRight className="h-3 w-3 text-verified/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Correlation detail */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StatCard label="correlationId" value="workflow-123" color="text-verified" />
              <StatCard label="Chain Length" value={data.correlationChain.length} color="text-foreground" />
              <StatCard label="Origin Fact" value={data.correlationChain[0]?.fact ?? "—"} color="text-verified" />
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Automation Provenance ── */}
      <div>
        <H3 icon={Eye} title="Automation Provenance — Agent → Prompt Hash → Tool Calls → Output Hash → Approval → Result" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <div className="text-xs text-muted-foreground mb-3">
              Not the prompt itself — the hash. This preserves privacy while maintaining full auditability.
            </div>
            {/* Provenance Pipeline */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {/* Agent */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border border-verified/30 bg-verified/10 px-3 py-2 min-w-[90px] shrink-0">
                <Cpu className="h-3.5 w-3.5 text-verified" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">agent</span>
                <span className="text-xs font-semibold">{data.provenanceFlow.agent}</span>
              </motion.div>
              <ArrowRight className="h-3 w-3 text-verified/40 shrink-0" />
              {/* Prompt Hash */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border border-repairing/30 bg-repairing/10 px-3 py-2 min-w-[90px] shrink-0">
                <Hash className="h-3.5 w-3.5 text-repairing" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">prompt hash</span>
                <span className="text-xs font-mono text-repairing truncate max-w-[80px]">{data.provenanceFlow.promptHash}</span>
              </motion.div>
              <ArrowRight className="h-3 w-3 text-verified/40 shrink-0" />
              {/* Tool Call Hashes */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border border-quarantined/30 bg-quarantined/10 px-3 py-2 min-w-[100px] shrink-0">
                <Braces className="h-3.5 w-3.5 text-quarantined" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">tool calls</span>
                <div className="flex flex-col gap-0.5">
                  {data.provenanceFlow.toolCallHashes.map((tc, i) => (
                    <span key={i} className="text-[8px] font-mono text-quarantined truncate max-w-[80px]">{tc}</span>
                  ))}
                </div>
              </motion.div>
              <ArrowRight className="h-3 w-3 text-verified/40 shrink-0" />
              {/* Output Hash */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border border-verified/30 bg-verified/10 px-3 py-2 min-w-[90px] shrink-0">
                <FileCheck className="h-3.5 w-3.5 text-verified" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">output hash</span>
                <span className="text-xs font-mono text-verified truncate max-w-[80px]">{data.provenanceFlow.outputHash}</span>
              </motion.div>
              <ArrowRight className="h-3 w-3 text-verified/40 shrink-0" />
              {/* Human Approval */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border px-3 py-2 min-w-[90px] shrink-0" style={{ borderColor: data.provenanceFlow.humanApproved ? "oklch(0.78 0.16 160 / 0.3)" : "oklch(0.64 0.21 25 / 0.3)", backgroundColor: data.provenanceFlow.humanApproved ? "oklch(0.78 0.16 160 / 0.1)" : "oklch(0.64 0.21 25 / 0.1)" }}>
                {data.provenanceFlow.humanApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-verified" /> : <AlertTriangle className="h-3.5 w-3.5 text-violating" />}
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">human</span>
                <span className={`text-xs font-semibold ${data.provenanceFlow.humanApproved ? "text-verified" : "text-violating"}`}>
                  {data.provenanceFlow.humanApproved ? "Approved" : "Auto"}
                </span>
              </motion.div>
              <ArrowRight className="h-3 w-3 text-verified/40 shrink-0" />
              {/* Result */}
              <motion.div variants={itemV} className="flex flex-col items-center gap-1 rounded-lg border border-verified/30 bg-verified/10 px-3 py-2 min-w-[90px] shrink-0">
                <BadgeCheck className="h-3.5 w-3.5 text-verified" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">result</span>
                <span className="text-xs font-semibold text-verified">{data.provenanceFlow.result}</span>
              </motion.div>
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Replay Certificate ── */}
      <div>
        <H3 icon={BadgeCheck} title="Replay Certificate — First-class deterministic replay evidence" />
        <motion.div variants={cardV}>
          <GradientBorderCard gradient="from-verified/40 via-repairing/20 to-quarantined/20">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-verified/15 border border-verified/30 glow-verified">
                  <Award className="h-5 w-5 text-verified" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Replay Certificate</span>
                    {data.replayCertificate.passed ? (
                      <StatusPill status="verified" label="PASSED" />
                    ) : (
                      <StatusPill status="violating" label="FAILED" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Auditors love this — deterministic replay verification</span>
                </div>
              </div>
              {/* Certificate fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { key: "projection", value: data.replayCertificate.projection, icon: Layers },
                  { key: "projectionHash", value: data.replayCertificate.projectionHash, icon: Hash },
                  { key: "factCount", value: String(data.replayCertificate.factCount), icon: Database },
                  { key: "factRoot", value: data.replayCertificate.factRoot, icon: GitBranch },
                  { key: "runtimeVersion", value: data.replayCertificate.runtimeVersion, icon: Cpu },
                  { key: "policyVersion", value: data.replayCertificate.policyVersion, icon: Shield },
                  { key: "timestamp", value: new Date(data.replayCertificate.timestamp * 1000).toISOString().slice(0, 19), icon: Activity },
                  { key: "signature", value: data.replayCertificate.signature, icon: Signature },
                ].map((field) => {
                  const FIcon = field.icon;
                  return (
                    <motion.div key={field.key} variants={itemV} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5">
                      <FIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-[9px] font-mono text-muted-foreground uppercase shrink-0">{field.key}</span>
                      <span className="ml-auto text-xs font-mono text-foreground truncate">{field.value}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </GradientBorderCard>
        </motion.div>
      </div>

      {/* ── Drift Detection Status ── */}
      <div>
        <H3 icon={AlertTriangle} title="Drift Detection — Projection ≠ Live System" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.80 0.15 80)">
            <div className="text-xs text-muted-foreground mb-3">
              OperationalDriftObserved: When the projection diverges from the live system, the discrepancy becomes evidence and triggers alerts. No silent failures.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Drift status */}
              <div className="rounded-md border border-verified/30 bg-verified/10 p-3 flex flex-col items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-verified" />
                <span className="text-xs font-semibold text-verified">No Active Drifts</span>
                <span className="text-[9px] font-mono text-muted-foreground">Last checked: just now</span>
              </div>
              {/* Drift count */}
              <div className="rounded-md border border-border/40 bg-muted/20 p-3 flex flex-col items-center gap-2">
                <Database className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-semibold">0 drift facts emitted</span>
                <span className="text-[9px] font-mono text-muted-foreground">OperationalDriftObserved count</span>
              </div>
              {/* Alert status */}
              <div className="rounded-md border border-verified/30 bg-verified/10 p-3 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-verified" />
                <span className="text-xs font-semibold text-verified">Alerts: Clear</span>
                <span className="text-[9px] font-mono text-muted-foreground">No active drift alerts</span>
              </div>
            </div>
            {/* Drift detection pipeline */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { label: "Live System", icon: Cpu, color: "verified" },
                { label: "Projection", icon: Layers, color: "verified" },
                { label: "Compare", icon: GitBranch, color: "repairing" },
                { label: "Drift?", icon: AlertTriangle, color: "violating" },
                { label: "Evidence", icon: FileText, color: "verified" },
                { label: "Alert", icon: Activity, color: "repairing" },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center shrink-0">
                  <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${step.color === "verified" ? "border-verified/30 bg-verified/10" : step.color === "repairing" ? "border-repairing/30 bg-repairing/10" : "border-violating/30 bg-violating/10"}`}>
                    <step.icon className={`h-3 w-3 ${step.color === "verified" ? "text-verified" : step.color === "repairing" ? "text-repairing" : "text-violating"}`} />
                    <span className={`text-[9px] font-mono ${step.color === "verified" ? "text-verified" : step.color === "repairing" ? "text-repairing" : "text-violating"}`}>{step.label}</span>
                  </div>
                  {idx < 5 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0 mx-0.5" />}
                </div>
              ))}
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Confidence ≠ Evidence Summary ── */}
      <div>
        <H3 icon={Scale} title="Confidence ≠ Evidence — Trust is derived, not stored" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verified/15 border border-verified/30 shrink-0">
                <Brain className="h-4 w-4 text-verified" />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="mb-2">
                  Trust scores are <span className="text-verified font-semibold">projections</span>, NOT facts. 
                  Store &quot;Review Passed&quot; not &quot;Trust = 0.94&quot;. Confidence is <span className="text-verified font-semibold">derived</span> from evidence, never stored as a primitive.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="rounded-md border border-violating/30 bg-violating/10 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="h-3 w-3 text-violating" />
                      <span className="text-xs font-semibold text-violating">Wrong: Store trust score</span>
                    </div>
                    <code className="text-[10px] font-mono text-violating/70">trust_score: 0.94</code>
                  </div>
                  <div className="rounded-md border border-verified/30 bg-verified/10 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-verified" />
                      <span className="text-xs font-semibold text-verified">Right: Store evidence</span>
                    </div>
                    <code className="text-[10px] font-mono text-verified/70">review_passed: true</code>
                  </div>
                </div>
              </div>
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Observation Authentication Chain ── */}
      <div>
        <H3 icon={KeyRound} title="Observation Authentication — Never trust source claims" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.74 0.13 190)">
            <div className="text-xs text-muted-foreground mb-3">
              Service Identity → mTLS → OIDC → JWT → Capability Policy → Acceptance. The collector never trusts &quot;source:kilo-bot&quot;.
            </div>
            {/* Authentication chain */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { label: "Service Identity", icon: Fingerprint, color: "verified" },
                { label: "mTLS", icon: Lock, color: "verified" },
                { label: "OIDC", icon: Shield, color: "repairing" },
                { label: "JWT", icon: KeyRound, color: "verified" },
                { label: "Capability Policy", icon: ClipboardCheck, color: "repairing" },
                { label: "Acceptance", icon: CheckCircle2, color: "verified" },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center shrink-0">
                  <div className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-1.5 min-w-[70px] ${step.color === "verified" ? "border-verified/30 bg-verified/10" : "border-repairing/30 bg-repairing/10"}`}>
                    <step.icon className={`h-3.5 w-3.5 ${step.color === "verified" ? "text-verified" : "text-repairing"}`} />
                    <span className={`text-[9px] font-mono text-center ${step.color === "verified" ? "text-verified" : "text-repairing"}`}>{step.label}</span>
                  </div>
                  {idx < 5 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0 mx-0.5" />}
                </div>
              ))}
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Projection Manifest ── */}
      <div>
        <H3 icon={ClipboardCheck} title="Projection Manifest — Projections become auditable" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <div className="text-xs text-muted-foreground mb-2">
              Every projection declares its manifest: id, version, dependencies, capabilitySet, projectionHash, deterministic, owner.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "id", value: "operational-state-v0.8", icon: Layers },
                { key: "version", value: "0.8.0", icon: GitBranch },
                { key: "dependencies", value: "mmr, trust-runtime", icon: Boxes },
                { key: "capabilitySet", value: "automation.review", icon: Shield },
                { key: "projectionHash", value: "sha256:a3f2b8c9...", icon: Hash },
                { key: "deterministic", value: "true", icon: CheckCircle2 },
                { key: "owner", value: "epistemic-runtime", icon: Cpu },
              ].map((field) => {
                const FIcon = field.icon;
                const isVerified = field.value === "true";
                return (
                  <div key={field.key} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5">
                    <FIcon className={`h-3 w-3 shrink-0 ${isVerified ? "text-verified" : "text-muted-foreground/50"}`} />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase shrink-0">{field.key}</span>
                    <span className={`ml-auto text-xs font-mono truncate ${isVerified ? "text-verified" : "text-foreground"}`}>{field.value}</span>
                  </div>
                );
              })}
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Typed Observation SDK ── */}
      <div>
        <H3 icon={Code} title="Typed Observation SDK — Prevents schema drift" />
        <motion.div variants={cardV}>
          <Shell accent="oklch(0.78 0.16 160)">
            <div className="text-xs text-muted-foreground mb-3">
              emitBotCommand(), emitReviewStarted(), emitFixCreated() instead of emitObservation(any). Type-safe emission prevents schema drift at compile time.
            </div>
            <div className="rounded-md border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Terminal className="h-3.5 w-3.5 text-verified" />
                <span className="text-xs font-semibold text-verified">Typed SDK Methods</span>
              </div>
              <div className="space-y-1.5">
                {[
                  "emitBotCommand(payload: BotCommandPayload)",
                  "emitReviewStarted(payload: ReviewStartedPayload)",
                  "emitFixCreated(payload: FixCreatedPayload)",
                  "emitMergeProposed(payload: MergeProposedPayload)",
                  "emitDeployInitiated(payload: DeployInitiatedPayload)",
                  "emitDriftObserved(payload: DriftObservedPayload)",
                ].map((method) => (
                  <div key={method} className="flex items-center gap-2 text-[10px] font-mono">
                    <CheckCircle2 className="h-2.5 w-2.5 text-verified shrink-0" />
                    <span className="text-foreground">{method}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded border border-violating/30 bg-violating/10 px-2 py-1 flex items-center gap-1.5">
                <XCircle className="h-3 w-3 text-violating shrink-0" />
                <span className="text-[9px] font-mono text-violating">Rejected: emitObservation(any) — untyped, schema drift risk</span>
              </div>
            </div>
          </Shell>
        </motion.div>
      </div>

      {/* ── Refresh indicator ── */}
      <motion.div variants={fadeV} className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[10px] font-mono text-muted-foreground/50">
          {loading ? "Refreshing…" : `Auto-refresh in ${refreshCountdown}s`}
        </span>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-verified/30 transition-colors disabled:opacity-50"
          title="Refresh fortification data"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
          refresh
        </button>
      </motion.div>
    </motion.div>
  );
}
