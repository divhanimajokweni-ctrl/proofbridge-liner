// IVE v2.0 — Shared domain data and types.
// All content reflects the IVE usage model + HBK Mk-II Hydro-Bayesian Kernel
// upgrade specification.

export type GateStatus = "PASS" | "PENDING" | "NOT_STARTED" | "FAIL";

export interface WatchdogGate {
  id: string;
  label: string;
  status: GateStatus;
  score: number; // 0..100
  detail: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  accent: "gold" | "emerald" | "rose" | "jade";
  icon: string;
}

export interface IntegrationSource {
  id: string;
  name: string;
  type: "CAD" | "GIS" | "BIM" | "IoT" | "External";
  format: string;
  status: "synced" | "drifted" | "ingesting" | "quarantined";
  nodes: number;
  lastSync: string;
}

export interface VerificationPhase {
  id: string;
  side: "left" | "right";
  stage: string;
  layer: string;
  status: "verified" | "in_progress" | "blocked" | "pending";
  owner: string;
}

export interface FacilitatorMessage {
  id: string;
  role: "user" | "facilitator" | "system";
  content: string;
  ts: string;
  citations?: { label: string; href: string }[];
}

export interface AhpCriterion {
  id: string;
  name: string;
  weight: number; // 0..1
  score: number; // 0..100
}

export interface DesignAlternative {
  id: string;
  name: string;
  criteria: Record<string, number>; // criterionId -> score
  total: number;
  recommended: boolean;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  source: string;
  confidence: number; // 0..1
  decayed: number; // days since last verified
  state: "verified" | "stale" | "decayed" | "conjecture";
}

export interface AirEvent {
  id: string;
  ts: string;
  layer: "orchestration" | "serving" | "intervention" | "evidence";
  severity: "info" | "warn" | "critical";
  message: string;
  action?: string;
}

export interface CryptoStage {
  id: string;
  name: string;
  description: string;
  status: "complete" | "running" | "queued" | "failed";
  durationMs: number;
  cipher: string;
}

export interface GovernanceArtifact {
  id: string;
  title: string;
  type: "Decision Essay" | "Compliance Export" | "Minted Audit" | "OmniClass Map";
  regulator: "SOC2" | "FIC/FICA" | "HPCSA" | "SAICA" | "NSC" | "Constitution";
  status: "minted" | "draft" | "attested" | "expired";
  hash: string;
  ts: string;
}

export interface HbkRun {
  id: string;
  label: string;
  exposure: number;
  nodes: number;
  mcmcMs: number;
  hbkMs: number;
  variance: number;
}

// ---------- Static data ----------

export const WATCHDOG_GATES: WatchdogGate[] = [
  {
    id: "G1",
    label: "Fraud Detection",
    status: "PASS",
    score: 100,
    detail: "BLS batch attestation + ZK-SNARK proofs verified for all 1,204 nodes.",
  },
  {
    id: "G2",
    label: "Revenue Collection",
    status: "PENDING",
    score: 80,
    detail: "FICA alignment confirmed; SAICA reconciliation awaiting 2 invoices.",
  },
  {
    id: "G3",
    label: "Legal Opinion",
    status: "PENDING",
    score: 85,
    detail: "Constitutionality check passed; HPCSA scope-of-practice review in flight.",
  },
  {
    id: "G4",
    label: "Soak Test (72h)",
    status: "NOT_STARTED",
    score: 0,
    detail: "Awaiting green light from AIR runtime evidence decay tracker.",
  },
  {
    id: "G5",
    label: "Kill-Switch Drill",
    status: "NOT_STARTED",
    score: 0,
    detail: "Scheduled post-soak. Verifies cryptographic self-destruct propagation.",
  },
];

export const KPIS: Kpi[] = [
  {
    id: "k1",
    label: "HBK Speedup vs MCMC",
    value: "94.2%",
    delta: "+2.1%",
    trend: "up",
    accent: "gold",
    icon: "Gauge",
  },
  {
    id: "k2",
    label: "Clashes Resolved",
    value: "1,847",
    delta: "+38",
    trend: "up",
    accent: "emerald",
    icon: "ShieldCheck",
  },
  {
    id: "k3",
    label: "Evidence Decay (stale)",
    value: "12",
    delta: "-4",
    trend: "down",
    accent: "rose",
    icon: "Hourglass",
  },
  {
    id: "k4",
    label: "Governance Artifacts Minted",
    value: "63",
    delta: "+7",
    trend: "up",
    accent: "jade",
    icon: "Scroll",
  },
];

export const INTEGRATION_SOURCES: IntegrationSource[] = [
  {
    id: "s1",
    name: "Structural Revit Model",
    type: "BIM",
    format: ".rvt",
    status: "synced",
    nodes: 48291,
    lastSync: "2025-04-18T08:14:00Z",
  },
  {
    id: "s2",
    name: "Cadastral SHP Layer",
    type: "GIS",
    format: ".shp",
    status: "synced",
    nodes: 1284421,
    lastSync: "2025-04-18T07:02:00Z",
  },
  {
    id: "s3",
    name: "Civil DWG Alignment",
    type: "CAD",
    format: ".dwg",
    status: "drifted",
    nodes: 9821,
    lastSync: "2025-04-17T22:48:00Z",
  },
  {
    id: "s4",
    name: "Forma Concept Mass",
    type: "BIM",
    format: ".rvt",
    status: "ingesting",
    nodes: 4203,
    lastSync: "2025-04-18T08:30:00Z",
  },
  {
    id: "s5",
    name: "Field IoT Sensor Mesh",
    type: "IoT",
    format: "MQTT/JSON",
    status: "synced",
    nodes: 312,
    lastSync: "2025-04-18T08:31:00Z",
  },
  {
    id: "s6",
    name: "Legacy DWG Footprints",
    type: "CAD",
    format: ".dwg",
    status: "quarantined",
    nodes: 1842,
    lastSync: "2025-03-29T11:20:00Z",
  },
];

export const VERIFICATION_PHASES: VerificationPhase[] = [
  // Left side: requirements
  { id: "v1", side: "left", stage: "R1", layer: "Conceptual Requirements", status: "verified", owner: "Architect" },
  { id: "v2", side: "left", stage: "R2", layer: "Stakeholder Goals", status: "verified", owner: "Facilitator" },
  { id: "v3", side: "left", stage: "R3", layer: "System Requirements", status: "verified", owner: "Systems Eng" },
  { id: "v4", side: "left", stage: "R4", layer: "Subsystem Specs", status: "in_progress", owner: "Discipline Lead" },
  { id: "v5", side: "left", stage: "R5", layer: "Component Design", status: "pending", owner: "Designer" },
  // Right side: verification
  { id: "v6", side: "right", stage: "T1", layer: "Operational Acceptance", status: "verified", owner: "QA" },
  { id: "v7", side: "right", stage: "T2", layer: "System Verification", status: "verified", owner: "QA" },
  { id: "v8", side: "right", stage: "T3", layer: "Subsystem Integration", status: "in_progress", owner: "Integrator" },
  { id: "v9", side: "right", stage: "T4", layer: "Bench Verification", status: "in_progress", owner: "Test Eng" },
  { id: "v10", side: "right", stage: "T5", layer: "Unit Tests", status: "pending", owner: "Developer" },
];

export const AHP_CRITERIA: AhpCriterion[] = [
  { id: "c1", name: "Structural Integrity", weight: 0.32, score: 88 },
  { id: "c2", name: "Cost Efficiency", weight: 0.24, score: 76 },
  { id: "c3", name: "Constructability", weight: 0.18, score: 82 },
  { id: "c4", name: "Sustainability", weight: 0.14, score: 71 },
  { id: "c5", name: "Maintainability", weight: 0.12, score: 79 },
];

export const DESIGN_ALTERNATIVES: DesignAlternative[] = [
  {
    id: "a1",
    name: "Alt-A · Hybrid Steel-Timber",
    criteria: { c1: 92, c2: 74, c3: 85, c4: 88, c5: 80 },
    total: 0,
    recommended: true,
  },
  {
    id: "a2",
    name: "Alt-B · Pure RC Frame",
    criteria: { c1: 88, c2: 81, c3: 79, c4: 62, c5: 76 },
    total: 0,
    recommended: false,
  },
  {
    id: "a3",
    name: "Alt-C · Composite Deck",
    criteria: { c1: 84, c2: 78, c3: 88, c4: 70, c5: 82 },
    total: 0,
    recommended: false,
  },
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "e1",
    claim: "Lateral load path verified against wind tunnel data",
    source: "BoundaryLayer report 2024-Q4",
    confidence: 0.92,
    decayed: 4,
    state: "verified",
  },
  {
    id: "e2",
    claim: "Foundation bearing capacity ≥ 320 kPa",
    source: "Geotech borehole log BH-09",
    confidence: 0.81,
    decayed: 21,
    state: "stale",
  },
  {
    id: "e3",
    claim: "Façade fire rating meets SANS 10400",
    source: "Manufacturer datasheet (unverified)",
    confidence: 0.4,
    decayed: 67,
    state: "decayed",
  },
  {
    id: "e4",
    claim: "VR nausea threshold below ISO tolerable band",
    source: "Conjecture (no measurement)",
    confidence: 0.12,
    decayed: 0,
    state: "conjecture",
  },
];

export const AIR_EVENTS: AirEvent[] = [
  {
    id: "a1",
    ts: "08:31:14",
    layer: "intervention",
    severity: "warn",
    message: "Evidence item e3 (façade fire rating) flagged stale — re-verification queued.",
    action: "queue_reverify",
  },
  {
    id: "a2",
    ts: "08:30:02",
    layer: "serving",
    severity: "info",
    message: "HBK Mk-II inference served 1,204 nodes in 38ms.",
  },
  {
    id: "a3",
    ts: "08:28:47",
    layer: "orchestration",
    severity: "info",
    message: "Facilitator agent authored meeting minutes for agenda item 4.2.",
  },
  {
    id: "a4",
    ts: "08:25:11",
    layer: "intervention",
    severity: "critical",
    message: "Conjecture detected (e4) — blocked publication of governance artifact GA-114.",
    action: "block_mint",
  },
  {
    id: "a5",
    ts: "08:21:39",
    layer: "evidence",
    severity: "info",
    message: "Decay tracker recomputed temporal accountability for 312 claims.",
  },
];

export const CRYPTO_STAGES: CryptoStage[] = [
  {
    id: "cs1",
    name: "Stage 1 · Compression",
    description: "Folder tree compressed into temporary ZIP archive.",
    status: "complete",
    durationMs: 842,
    cipher: "DEFLATE",
  },
  {
    id: "cs2",
    name: "Stage 2 · Key Generation",
    description: "Unique Fernet key derived per archive.",
    status: "complete",
    durationMs: 31,
    cipher: "Fernet-KDF",
  },
  {
    id: "cs3",
    name: "Stage 3 · AES-256 Encryption",
    description: "Single .enc payload emitted to vault.",
    status: "running",
    durationMs: 0,
    cipher: "AES-256-CBC",
  },
];

export const GOVERNANCE_ARTIFACTS: GovernanceArtifact[] = [
  {
    id: "GA-114",
    title: "Lateral System Decision Essay — Hybrid Steel-Timber",
    type: "Decision Essay",
    regulator: "SAICA",
    status: "attested",
    hash: "0x7f3e…a21c",
    ts: "2025-04-18T08:14:00Z",
  },
  {
    id: "GA-113",
    title: "FICA Compliance Export — Beneficial Ownership",
    type: "Compliance Export",
    regulator: "FIC/FICA",
    status: "minted",
    hash: "0x9b2d…7711",
    ts: "2025-04-18T07:48:00Z",
  },
  {
    id: "GA-112",
    title: "HPCSA Scope-of-Practice Audit — Structural Sign-off",
    type: "Minted Audit",
    regulator: "HPCSA",
    status: "minted",
    hash: "0x4c81…03af",
    ts: "2025-04-17T22:10:00Z",
  },
  {
    id: "GA-111",
    title: "OmniClass 2014-2020 Segment Map",
    type: "OmniClass Map",
    regulator: "SOC2",
    status: "attested",
    hash: "0xaef9…91b2",
    ts: "2025-04-17T19:02:00Z",
  },
  {
    id: "GA-110",
    title: "Constitutionality Brief — Public Interest Override",
    type: "Decision Essay",
    regulator: "Constitution",
    status: "draft",
    hash: "0x12ab…77ee",
    ts: "2025-04-17T16:20:00Z",
  },
];

export const HBK_RUNS: HbkRun[] = [
  { id: "h1", label: "Lateral Drift GP", exposure: 4096, nodes: 1204, mcmcMs: 4280, hbkMs: 268, variance: 0.011 },
  { id: "h2", label: "Settlement GP", exposure: 8192, nodes: 980, mcmcMs: 8910, hbkMs: 412, variance: 0.018 },
  { id: "h3", label: "Thermal Drift", exposure: 2048, nodes: 712, mcmcMs: 2110, hbkMs: 138, variance: 0.009 },
  { id: "h4", label: "Façade Load", exposure: 16384, nodes: 1842, mcmcMs: 18200, hbkMs: 928, variance: 0.024 },
  { id: "h5", label: "Seismic Coupling", exposure: 32768, nodes: 2400, mcmcMs: 37400, hbkMs: 1722, variance: 0.031 },
];

export const IVE_TABS = [
  { id: "overview", label: "Command Center", icon: "LayoutDashboard" },
  { id: "hbk", label: "HBK Mk-II Kernel", icon: "Atom" },
  { id: "facilitator", label: "Facilitator Agent", icon: "Bot" },
  { id: "integration", label: "Agnostic Integration", icon: "Layers" },
  { id: "air", label: "AIR Runtime", icon: "Activity" },
  { id: "crypto", label: "Cryptographic & Governance", icon: "Lock" },
] as const;

export type IveTabId = (typeof IVE_TABS)[number]["id"];

// Compute weighted AHP totals
export function computeAhpTotals(): DesignAlternative[] {
  return DESIGN_ALTERNATIVES.map((alt) => {
    const total = AHP_CRITERIA.reduce((sum, c) => sum + (alt.criteria[c.id] ?? 0) * c.weight, 0);
    return { ...alt, total: Math.round(total) };
  });
}

export function gateOverallScore(): number {
  const total = WATCHDOG_GATES.reduce((s, g) => s + g.score, 0);
  return Math.round(total / WATCHDOG_GATES.length);
}
