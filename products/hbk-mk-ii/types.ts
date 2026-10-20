// ════════════════════════════════════════════════════════════════════════
// VVU HBK Mk-II — Type Definitions
// ════════════════════════════════════════════════════════════════════════

// ── CAD Module Layout (from FreeCAD Python script) ──────────────────────

export interface CADModule {
  id: string;
  name: string;
  label: string;
  length: number;  // X mm
  width: number;   // Y mm
  height: number;  // Z mm
  position: { x: number; y: number; z: number };
  color: string;       // CSS hex
  colorRGB: [number, number, number];
  status: "OPERATIONAL" | "STANDBY" | "DIAGNOSTIC" | "OFFLINE";
  tempC: number;
  loadPct: number;
  description: string;
}

export const HBK_CAD_MODULES: CADModule[] = [
  {
    id: "base-plate",
    name: "Chassis_Base_Plate",
    label: "Base Plate (6061-T6)",
    length: 460, width: 360, height: 3,
    position: { x: 0, y: 0, z: 0 },
    color: "#C0C0C0", colorRGB: [0.75, 0.75, 0.75],
    status: "OPERATIONAL", tempC: 22, loadPct: 0,
    description: "Anodized aluminum structural base — 460×360mm working volume",
  },
  {
    id: "amd-compute",
    name: "AMD_Compute_Module",
    label: "AMD Ryzen AI Compute Engine",
    length: 140, width: 130, height: 45,
    position: { x: 160, y: 120, z: 3 },
    color: "#1A9933", colorRGB: [0.1, 0.6, 0.2],
    status: "OPERATIONAL", tempC: 58, loadPct: 72,
    description: "Unified Memory Architecture — Edge compute with Ryzen AI APU",
  },
  {
    id: "sensor-interface",
    name: "Sensor_Interface_Module",
    label: "Analog Front-End / Sensor Shield",
    length: 120, width: 160, height: 22,
    position: { x: 20, y: 180, z: 3 },
    color: "#3366CC", colorRGB: [0.2, 0.3, 0.8],
    status: "OPERATIONAL", tempC: 31, loadPct: 45,
    description: "Acoustic filtering — isolated analog sensor interface (X=20, Y=180)",
  },
  {
    id: "power-bms",
    name: "Power_BMS_Module",
    label: "Power Distribution & BMS",
    length: 110, width: 140, height: 38,
    position: { x: 20, y: 20, z: 3 },
    color: "#CC3333", colorRGB: [0.8, 0.2, 0.2],
    status: "OPERATIONAL", tempC: 38, loadPct: 61,
    description: "Battery Management System — 12V/24V distribution",
  },
  {
    id: "storage-bay",
    name: "NVMe_Storage_Bay",
    label: "NVMe Storage Bay",
    length: 40, width: 90, height: 15,
    position: { x: 160, y: 40, z: 3 },
    color: "#808080", colorRGB: [0.5, 0.5, 0.5],
    status: "OPERATIONAL", tempC: 34, loadPct: 28,
    description: "Vibration-dampened NVMe assembly — local data storage",
  },
  {
    id: "comms-routing",
    name: "Comms_Routing_Node",
    label: "Sealed Comms Routing Node",
    length: 100, width: 140, height: 25,
    position: { x: 340, y: 200, z: 3 },
    color: "#CC9900", colorRGB: [0.8, 0.6, 0.1],
    status: "STANDBY", tempC: 26, loadPct: 12,
    description: "Cellular/GNSS/LoRa carrier — sealed IP67 routing",
  },
];

// ── Equity Split ─────────────────────────────────────────────────────────

export interface EquitySlice {
  holder: string;
  pct: number;
  color: string;
  description: string;
}

export const EQUITY_SPLIT: EquitySlice[] = [
  { holder: "VVU", pct: 70, color: "#C9A84C", description: "Venture Vision Ubuntu — founding entity" },
  { holder: "UCT & Wits", pct: 20, color: "#3366CC", description: "Research collaboration partners" },
  { holder: "Direct Investors", pct: 5, color: "#10b981", description: "Seed investment partners" },
  { holder: "Unallocated (AMD Target)", pct: 5, color: "#CC3333", description: "Strategic reserve for AMD technology partnership" },
];

// ── Founding Partners ────────────────────────────────────────────────────

export type PartnerCategory = "consortium" | "friend" | "community";

export interface SponsorshipPackage {
  id: string;
  name: string;
  icon: string;
  items: { name: string; qty: string; typicalProvider: string }[];
  estimatedValue: string;
  impact: string;
  color: string;
}

export const SPONSORSHIP_PACKAGES: SponsorshipPackage[] = [
  {
    id: "operations",
    name: "Operations Package",
    icon: "🏢",
    items: [
      { name: "Desk", qty: "2", typicalProvider: "University, office provider" },
      { name: "Chair", qty: "2", typicalProvider: "University, office provider" },
      { name: "Lockable cabinet", qty: "1", typicalProvider: "University, office provider" },
    ],
    estimatedValue: "R15,000–30,000",
    impact: "Enables dedicated research workspace",
    color: "#8B5CF6",
  },
  {
    id: "engineering",
    name: "Engineering Package",
    icon: "💻",
    items: [
      { name: "Laptop", qty: "1–3", typicalProvider: "Dell, Lenovo, HP" },
      { name: "External monitor", qty: "1–3", typicalProvider: "Hardware manufacturer, retail" },
      { name: "UPS", qty: "1–2", typicalProvider: "Makro, Builders" },
      { name: "Keyboard & mouse", qty: "1–3", typicalProvider: "Hardware manufacturer, retail" },
    ],
    estimatedValue: "R30,000–90,000",
    impact: "Powers engineering development and algorithm validation",
    color: "#10b981",
  },
  {
    id: "connectivity",
    name: "Connectivity Package",
    icon: "📡",
    items: [
      { name: "Router", qty: "1", typicalProvider: "MTN, Vodacom" },
      { name: "SIM card", qty: "1–2", typicalProvider: "Telecom provider" },
      { name: "Monthly data allocation", qty: "200+ GB", typicalProvider: "Telecom provider" },
    ],
    estimatedValue: "R5,000–15,000/year",
    impact: "Enables field data transmission and cloud connectivity",
    color: "#3B82F6",
  },
  {
    id: "field-ops",
    name: "Field Operations Package",
    icon: "🦺",
    items: [
      { name: "Reflective jackets", qty: "3–5", typicalProvider: "PPE supplier" },
      { name: "Safety boots", qty: "3–5", typicalProvider: "PPE supplier" },
      { name: "Hard hats", qty: "3–5", typicalProvider: "PPE supplier" },
      { name: "Equipment bags", qty: "2–3", typicalProvider: "PPE supplier" },
    ],
    estimatedValue: "R10,000–25,000",
    impact: "Enables safe field deployment",
    color: "#F59E0B",
  },
  {
    id: "workshop",
    name: "Workshop Package",
    icon: "📋",
    items: [
      { name: "Printing services", qty: "Up to 500 pages", typicalProvider: "Local print shop" },
      { name: "Meeting room", qty: "As needed", typicalProvider: "University" },
      { name: "Coffee/refreshments", qty: "For 20 participants", typicalProvider: "Local café" },
      { name: "Lunch", qty: "For 20 participants", typicalProvider: "Catering company" },
    ],
    estimatedValue: "R5,000–15,000/workshop",
    impact: "Enables research workshops and stakeholder meetings",
    color: "#EC4899",
  },
  {
    id: "branding",
    name: "Branding Package",
    icon: "👕",
    items: [
      { name: "Branded shirts", qty: "5–10", typicalProvider: "Textile company" },
      { name: "Jackets", qty: "3–5", typicalProvider: "Textile company" },
      { name: "Caps", qty: "5–10", typicalProvider: "Textile company" },
      { name: "Name badges", qty: "5–10", typicalProvider: "Signage company" },
      { name: "Vehicle branding (optional)", qty: "1", typicalProvider: "Signage company" },
    ],
    estimatedValue: "R8,000–25,000",
    impact: "Professional presence and programme identity",
    color: "#8B5CF6",
  },
];

// ── Resource Register ────────────────────────────────────────────────────

export interface ResourceItem {
  id: string;
  resource: string;
  qtyNeeded: number;
  qtyCommitted: number;
  unit: string;
  partnerType: string;
  status: "secured" | "in_progress" | "open" | "urgent";
  category: string;
}

export const RESOURCE_REGISTER: ResourceItem[] = [
  { id: "r1", resource: "Desks", qtyNeeded: 2, qtyCommitted: 1, unit: "units", partnerType: "Academic Partner", status: "open", category: "operations" },
  { id: "r2", resource: "Laptops", qtyNeeded: 3, qtyCommitted: 0, unit: "units", partnerType: "Technology Partner", status: "urgent", category: "engineering" },
  { id: "r3", resource: "Fibre connectivity", qtyNeeded: 1, qtyCommitted: 0, unit: "connections", partnerType: "Telecom Partner", status: "urgent", category: "connectivity" },
  { id: "r4", resource: "Branded shirts", qtyNeeded: 5, qtyCommitted: 0, unit: "units", partnerType: "Community Partner", status: "open", category: "branding" },
  { id: "r5", resource: "Router", qtyNeeded: 1, qtyCommitted: 0, unit: "units", partnerType: "Telecom Partner", status: "open", category: "connectivity" },
  { id: "r6", resource: "UPS units", qtyNeeded: 2, qtyCommitted: 0, unit: "units", partnerType: "Retail Partner", status: "open", category: "engineering" },
  { id: "r7", resource: "Safety boots", qtyNeeded: 5, qtyCommitted: 0, unit: "pairs", partnerType: "Community Partner", status: "open", category: "field-ops" },
  { id: "r8", resource: "Meeting space", qtyNeeded: 1, qtyCommitted: 0, unit: "monthly", partnerType: "Academic Partner", status: "open", category: "workshop" },
  { id: "r9", resource: "Mobile data", qtyNeeded: 200, qtyCommitted: 0, unit: "GB/month", partnerType: "Telecom Partner", status: "urgent", category: "connectivity" },
  { id: "r10", resource: "Whiteboard", qtyNeeded: 1, qtyCommitted: 0, unit: "units", partnerType: "Retail Partner", status: "open", category: "operations" },
  { id: "r11", resource: "External monitors", qtyNeeded: 3, qtyCommitted: 0, unit: "units", partnerType: "Technology Partner", status: "urgent", category: "engineering" },
  { id: "r12", resource: "Reflective jackets", qtyNeeded: 5, qtyCommitted: 0, unit: "units", partnerType: "PPE Supplier", status: "open", category: "field-ops" },
  { id: "r13", resource: "Hard hats", qtyNeeded: 5, qtyCommitted: 0, unit: "units", partnerType: "PPE Supplier", status: "open", category: "field-ops" },
  { id: "r14", resource: "Equipment bags", qtyNeeded: 3, qtyCommitted: 0, unit: "units", partnerType: "PPE Supplier", status: "open", category: "field-ops" },
  { id: "r15", resource: "Printing services", qtyNeeded: 500, qtyCommitted: 0, unit: "pages", partnerType: "Community Partner", status: "open", category: "workshop" },
];

// ── Programme Timeline ───────────────────────────────────────────────────

export interface TimelinePhase {
  id: string;
  phase: string;
  months: string;
  description: string;
  milestones: string[];
  status: "complete" | "active" | "upcoming";
  color: string;
}

export const PROGRAMME_TIMELINE: TimelinePhase[] = [
  {
    id: "p1",
    phase: "Campaign Launch",
    months: "Month 1–2",
    description: "Launch Founding 100 campaign, approach Tier 1–3 partners, secure first commitments",
    milestones: ["Launch campaign", "Approach Tier 1–3", "Secure first commitments", "Establish visible progress"],
    status: "active",
    color: "#10b981",
  },
  {
    id: "p2",
    phase: "Momentum Building",
    months: "Month 3–6",
    description: "Expand to Tier 4–8 partners, continue securing commitments, begin field operations",
    milestones: ["Expand to Tier 4–8", "Secure commitments", "Begin field operations", "Track & report progress"],
    status: "upcoming",
    color: "#3B82F6",
  },
  {
    id: "p3",
    phase: "Programme Delivery",
    months: "Month 7–18",
    description: "Deploy HBK Mk-II platforms, collect field data, publish research findings",
    milestones: ["Deploy HBK Mk-II", "Collect field data", "Publish research", "Engage partners"],
    status: "upcoming",
    color: "#8B5CF6",
  },
];

// ── Git Actions Log ──────────────────────────────────────────────────────

export interface GitAction {
  id: string;
  timestamp: string;
  action: "commit" | "push" | "merge" | "deploy" | "test" | "validate";
  branch: string;
  message: string;
  author: string;
  status: "success" | "running" | "failed";
  hash: string;
}

// ── Validation Simulation ────────────────────────────────────────────────

export interface ValidationPhase {
  id: string;
  name: string;
  duration: string;
  description: string;
  status: "complete" | "active" | "pending" | "failed";
  metrics: { label: string; value: string; status: "pass" | "warn" | "fail" }[];
}

export const VALIDATION_PHASES: ValidationPhase[] = [
  {
    id: "v1", name: "Cold Boot & Initialization", duration: "0–4h",
    description: "System boot, kernel assertion, module self-test",
    status: "complete",
    metrics: [
      { label: "Boot Sequence", value: "PASS", status: "pass" },
      { label: "Kernel Assertions", value: "12/12", status: "pass" },
      { label: "Module Self-Test", value: "6/6", status: "pass" },
    ],
  },
  {
    id: "v2", name: "Sensor Calibration & Baseline", duration: "4–12h",
    description: "Acoustic sensor calibration, pressure baseline establishment",
    status: "complete",
    metrics: [
      { label: "Sensor Calibration", value: "PASS", status: "pass" },
      { label: "Baseline SNR", value: "42.3 dB", status: "pass" },
      { label: "Analog Isolation", value: "VERIFIED", status: "pass" },
    ],
  },
  {
    id: "v3", name: "Bayesian Inference Engine", duration: "12–24h",
    description: "MCMC derivation validation, Brier Score monitoring",
    status: "active",
    metrics: [
      { label: "MCMC Convergence", value: "0.87", status: "pass" },
      { label: "Brier Score", value: "0.013", status: "pass" },
      { label: "Trip Verdicts", value: "0", status: "pass" },
    ],
  },
  {
    id: "v4", name: "Stress & Load Testing", duration: "24–36h",
    description: "Circuit breaker stress, failover testing, queue depth",
    status: "pending",
    metrics: [
      { label: "Circuit Breaker", value: "—", status: "warn" },
      { label: "Queue Depth", value: "—", status: "warn" },
      { label: "Failover", value: "—", status: "warn" },
    ],
  },
  {
    id: "v5", name: "Network Simulation (Cape Town)", duration: "36–48h",
    description: "Cape Town water network simulation, zone data injection",
    status: "pending",
    metrics: [
      { label: "Zone Coverage", value: "—", status: "warn" },
      { label: "Leak Detection", value: "—", status: "warn" },
      { label: "False Positive Rate", value: "—", status: "warn" },
    ],
  },
  {
    id: "v6", name: "Edge-Compute Validation", duration: "48–60h",
    description: "AMD Ryzen AI APU validation, Kria SoM integration",
    status: "pending",
    metrics: [
      { label: "APU Utilization", value: "—", status: "warn" },
      { label: "Inference Latency", value: "—", status: "warn" },
      { label: "Memory Pressure", value: "—", status: "warn" },
    ],
  },
  {
    id: "v7", name: "Final Validation & Sign-Off", duration: "60–72h",
    description: "Full validation index, audit report, TRIP verdict finalization",
    status: "pending",
    metrics: [
      { label: "Validation Index", value: "—", status: "warn" },
      { label: "Audit Trail", value: "—", status: "warn" },
      { label: "TRIP Verdict", value: "—", status: "warn" },
    ],
  },
];

// ── HBK Dashboard Tab ────────────────────────────────────────────────────

export type HbkTabId = "twin" | "partners" | "resources" | "simulation" | "timeline" | "gitlog";

export interface HbkTab {
  id: HbkTabId;
  label: string;
  icon: string;
  description: string;
}

export const HBK_TABS: HbkTab[] = [
  { id: "twin", label: "Digital Twin", icon: "Cpu", description: "HBK Mk-II 3D CAD layout, module status, equity split" },
  { id: "partners", label: "Founding Partners", icon: "Users", description: "Campaign framework, sponsorship catalogue, outreach" },
  { id: "resources", label: "Resource Register", icon: "ClipboardList", description: "Live tracking of commitments and gaps" },
  { id: "simulation", label: "72h Validation", icon: "Activity", description: "Full 72-hour validation loop with digital twin" },
  { id: "timeline", label: "Programme Timeline", icon: "Calendar", description: "Phase tracking, milestones, delivery" },
  { id: "gitlog", label: "Git Actions", icon: "GitBranch", description: "Real-time commit, merge, deploy log" },
];
