// ════════════════════════════════════════════════════════════════════════
// VVU HBK Mk-II — Type Definitions
// Consortium Model: VVU 100% Ownership + Contract-Based Partnerships
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
    description: "Anodized aluminum structural base — 460×360mm working volume (3.0mm CNC 6061-T6 tray)",
  },
  {
    id: "amd-compute",
    name: "AMD_Compute_Module",
    label: "AMD Ryzen AI Compute Engine",
    length: 140, width: 130, height: 45,
    position: { x: 160, y: 120, z: 3 },
    color: "#1A9933", colorRGB: [0.1, 0.6, 0.2],
    status: "OPERATIONAL", tempC: 58, loadPct: 72,
    description: "Unified Memory Architecture — Edge compute with Ryzen AI APU (diagonal separation >170mm from PMU)",
  },
  {
    id: "sensor-interface",
    name: "Sensor_Interface_Module",
    label: "Analog Front-End / Sensor Shield",
    length: 120, width: 160, height: 22,
    position: { x: 20, y: 180, z: 3 },
    color: "#3366CC", colorRGB: [0.2, 0.3, 0.8],
    status: "OPERATIONAL", tempC: 31, loadPct: 45,
    description: "Acoustic filtering — isolated analog sensor interface (≥15mm EMI/RFI clearance zone enforced)",
  },
  {
    id: "power-bms",
    name: "Power_BMS_Module",
    label: "PM-01 Power Distribution & Daly 8S 20A BMS",
    length: 110, width: 140, height: 38,
    position: { x: 20, y: 20, z: 3 },
    color: "#CC3333", colorRGB: [0.8, 0.2, 0.2],
    status: "OPERATIONAL", tempC: 38, loadPct: 61,
    description: "Daly 8S 20A BMS — 25.6V/12V distribution with synchronous buck-boost regulators",
  },
  {
    id: "battery-8s",
    name: "Battery_8S_32700_Pack",
    label: "8S4P 32700 LiFePO₄ Pack (25.6V, 20Ah)",
    length: 150, width: 85, height: 80,
    position: { x: 140, y: 20, z: 3 },
    color: "#E67300", colorRGB: [0.9, 0.45, 0.0],
    status: "OPERATIONAL", tempC: 28, loadPct: 82,
    description: "32× IFR-32700 cells (8S4P) — 614Wh, 15% ruggedization overhead (busbars, holders, epoxy potting)",
  },
  {
    id: "aerogel-shield",
    name: "Aerogel_Thermal_Barrier",
    label: "Pyrogel XTE Aerogel Thermal Isolation",
    length: 160, width: 95, height: 85,
    position: { x: 135, y: 15, z: 3 },
    color: "#E8E8E8", colorRGB: [0.91, 0.91, 0.91],
    status: "OPERATIONAL", tempC: 25, loadPct: 0,
    description: "0.015 W/m·K thermal isolation — shields LiFePO₄ cells from AMD SoC radiant heat",
  },
  {
    id: "storage-bay",
    name: "NVMe_Storage_Bay",
    label: "NVMe Storage Bay",
    length: 40, width: 90, height: 15,
    position: { x: 320, y: 60, z: 3 },
    color: "#808080", colorRGB: [0.5, 0.5, 0.5],
    status: "OPERATIONAL", tempC: 34, loadPct: 28,
    description: "Vibration-dampened NVMe assembly — repositioned to X=320 for battery clearance",
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

// ── VVU Ownership Model (100% VVU — No Equity Dilution) ──────────────────

export interface OwnershipEntry {
  holder: string;
  pct: number;
  color: string;
  description: string;
  emphasis?: boolean;
}

export const OWNERSHIP_STRUCTURE: OwnershipEntry[] = [
  { holder: "VVU", pct: 100, color: "#C9A84C", description: "Venture Vision Ubuntu — sole owner of all core technology and platform IP", emphasis: true },
];

// ── Consortium Model ──────────────────────────────────────────────────────

export interface ConsortiumPartner {
  id: string;
  name: string;
  tier: "academic" | "funding" | "municipal" | "industrial";
  agreementType: string;
  agreementLabel: string;
  benefits: string[];
  obligations: string[];
  color: string;
  icon: string;
  status: "active_outreach" | "negotiating" | "agreement_draft" | "executed";
  targets: string[];
  rationale: string;
}

export const CONSORTIUM_PARTNERS: ConsortiumPartner[] = [
  {
    id: "academic",
    name: "Academic Partners",
    tier: "academic",
    agreementType: "research_collaboration",
    agreementLabel: "Research Collaboration Agreement",
    benefits: [
      "Publication rights",
      "Research funding allocation",
      "Student project supervision",
      "Access to anonymised datasets",
      "Formal acknowledgement",
      "Co-author paper opportunities",
    ],
    obligations: [
      "Provide academic supervision",
      "Supply HPC/GPU compute resources",
      "Facilitate laboratory access",
      "Support postgraduate researchers",
    ],
    color: "#3366CC",
    icon: "GraduationCap",
    status: "active_outreach",
    targets: ["UCT", "Wits", "Stellenbosch University", "CSIR"],
    rationale: "Universities expect publication rights and research access — not equity. Research Collaboration Agreements align with what academic institutions already anticipate.",
  },
  {
    id: "funding",
    name: "Funding Partners",
    tier: "funding",
    agreementType: "grant",
    agreementLabel: "Grant Agreement",
    benefits: [
      "Deliverables against programme milestones",
      "Progress reports and audit trail",
      "Named programme recognition",
      "Access to validation outcomes",
    ],
    obligations: [
      "Provide research programme funding",
      "Supply equipment and prototype funding",
      "Support pilot deployment funding",
    ],
    color: "#10b981",
    icon: "Landmark",
    status: "active_outreach",
    targets: ["WRC", "NRF", "DSTI"],
    rationale: "Funding bodies want deliverables, not ownership. Grant Agreements with milestone-based reporting are the standard model for WRC, NRF, and DSTI.",
  },
  {
    id: "municipal",
    name: "Municipal Partners",
    tier: "municipal",
    agreementType: "pilot",
    agreementLabel: "Pilot Partner Agreement",
    benefits: [
      "Access to operational reports",
      "Pilot outcomes and validation data",
      "Operational insights for infrastructure planning",
      "Participation in validation programme",
      "Direct coordination with research team",
    ],
    obligations: [
      "Provide pilot site access",
      "Share asset and GIS records",
      "Enable telemetry and SCADA access",
      "Coordinate operational scheduling",
    ],
    color: "#F59E0B",
    icon: "Building2",
    status: "active_outreach",
    targets: ["City of Cape Town"],
    rationale: "Municipalities benefit from operational insights and pilot outcomes. Pilot Partner Agreements give them direct access to validation data — not equity in a startup.",
  },
  {
    id: "industrial",
    name: "Industrial Partners",
    tier: "industrial",
    agreementType: "technology_partnership",
    agreementLabel: "Technology Partnership Agreement",
    benefits: [
      "Evaluation hardware access",
      "Engineering support collaboration",
      "Co-marketing opportunities",
      "Reference design collaboration",
      "Sponsorship recognition",
    ],
    obligations: [
      "Supply evaluation hardware",
      "Provide engineering support",
      "Share manufacturing insights",
      "Support certification pathway",
    ],
    color: "#1A9933",
    icon: "Cpu",
    status: "active_outreach",
    targets: ["AMD", "Sensor manufacturers", "Communications providers"],
    rationale: "If AMD wanted to invest years later, that would be a separate decision. Technology Partnership Agreements keep relationships productive without premature equity dilution.",
  },
];

// ── IP Ownership Boundaries ──────────────────────────────────────────────

export interface IPCategory {
  id: string;
  label: string;
  owner: "vvu" | "joint";
  items: string[];
  color: string;
  icon: string;
  description: string;
}

export const IP_OWNERSHIP: IPCategory[] = [
  {
    id: "vvu-core",
    label: "VVU-Owned Core Technology",
    owner: "vvu",
    items: [
      "HBK hardware architecture",
      "Bayesian runtime engine",
      "ProofBridge software platform",
      "Firmware and embedded systems",
      "Electronics and circuit design",
      "Industrial design",
      "Manufacturing rights",
      "Trademarks and brand identity",
    ],
    color: "#C9A84C",
    icon: "Shield",
    description: "All core platform technology remains solely owned by VVU. No transfer of ownership through any partnership agreement.",
  },
  {
    id: "research-outputs",
    label: "Joint Research Outputs",
    owner: "joint",
    items: [
      "Published papers and findings",
      "Benchmark datasets",
      "Validation reports",
      "Performance studies and field data",
    ],
    color: "#3366CC",
    icon: "FileCheck2",
    description: "Research outputs can be jointly authored without transferring ownership of the VVU platform. Co-authorship ≠ ownership transfer.",
  },
];

// ── Three-Phase Roadmap ──────────────────────────────────────────────────

export interface RoadmapPhase {
  id: string;
  phase: string;
  phaseNumber: number;
  title: string;
  subtitle: string;
  partners: string[];
  deliverables: string[];
  outcomes: string[];
  duration: string;
  status: "active" | "upcoming" | "future";
  color: string;
  icon: string;
  keyDecision?: string;
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "phase-1",
    phase: "Phase 1",
    phaseNumber: 1,
    title: "Research Enablement",
    subtitle: "Validate algorithms, collect field evidence, publish findings",
    partners: ["UCT", "Wits", "WRC", "Municipalities"],
    deliverables: [
      "Validate Bayesian algorithms under real conditions",
      "Collect field evidence from municipal infrastructure",
      "Publish peer-reviewed research findings",
      "Secure grant funding from WRC, NRF, DSTI",
    ],
    outcomes: [
      "Validated algorithms with published results",
      "Grant funding secured",
      "Pilot data collection completed",
      "Academic partnerships formalised",
    ],
    duration: "12–18 months",
    status: "active",
    color: "#10b981",
    icon: "FlaskConical",
  },
  {
    id: "phase-2",
    phase: "Phase 2",
    phaseNumber: 2,
    title: "Industrial Validation",
    subtitle: "Optimize hardware, certify reliability, establish supply chain",
    partners: ["AMD", "Sensor manufacturers", "Communications providers"],
    deliverables: [
      "Optimize HBK hardware for production readiness",
      "Certify reliability through industrial testing",
      "Establish supply chain and manufacturing contacts",
      "Build production-ready prototypes",
    ],
    outcomes: [
      "Production-ready HBK Mk-II prototype",
      "Certified reliability metrics",
      "Supply chain established",
      "Technology partnerships formalised",
    ],
    duration: "12–24 months",
    status: "upcoming",
    color: "#3B82F6",
    icon: "Wrench",
  },
  {
    id: "phase-3",
    phase: "Phase 3",
    phaseNumber: 3,
    title: "Commercialization",
    subtitle: "Decide on venture capital, licensing, joint ventures, or independent growth",
    partners: ["Market", "Investors (optional)", "Licensees"],
    deliverables: [
      "Evaluate commercialisation pathways",
      "Decide on venture capital, licensing, or joint ventures",
      "Continue growing independently if chosen",
      "Negotiate from validated position",
    ],
    outcomes: [
      "Commercialisation strategy decision",
      "Negotiating from validated position with published results and field data",
      "Option to raise equity only if strategically beneficial",
    ],
    duration: "Decision point after Phase 2",
    status: "future",
    color: "#C9A84C",
    icon: "Rocket",
    keyDecision: "Only after technical validation do you decide whether to raise venture capital, license the technology, form joint ventures, or continue growing independently. At that point, you negotiate from a much stronger position — validated technology, published results, and field data rather than just a concept.",
  },
];

// ── Consortium Architecture ──────────────────────────────────────────────

export interface ConsortiumArchitecture {
  coordinator: string;
  programme: string;
  pitchStatement: string;
  narrativeShift: {
    old: string;
    new: string;
  };
  hierarchy: {
    level: string;
    entity: string;
    description: string;
  }[];
}

export const CONSORTIUM_ARCHITECTURE: ConsortiumArchitecture = {
  coordinator: "VVU",
  programme: "HBK Applied Research Programme",
  pitchStatement: "We have developed a portable research instrument that enables accelerated hydraulic evidence collection and Bayesian model validation. We are inviting research institutions, municipalities, and industry partners to participate in a structured validation programme, with VVU serving as the technology developer and programme coordinator.",
  narrativeShift: {
    old: "We are looking for investors.",
    new: "VVU is establishing a multi-institution applied research programme to validate a portable hydro-engineering platform for municipal water infrastructure.",
  },
  hierarchy: [
    { level: "coordinator", entity: "VVU", description: "Technology developer and programme coordinator" },
    { level: "programme", entity: "HBK Research Consortium", description: "Multi-institution applied research programme" },
    { level: "academic", entity: "Academic Partners", description: "UCT, Wits, Stellenbosch, CSIR — Research Collaboration Agreements" },
    { level: "municipal", entity: "Municipal Partners", description: "City of Cape Town — Pilot Partner Agreements" },
    { level: "industrial", entity: "Industrial Partners", description: "AMD, sensor manufacturers — Technology Partnership Agreements" },
    { level: "funding", entity: "Funding Partners", description: "WRC, NRF, DSTI — Grant Agreements" },
  ],
};

// ── Sponsorship Packages ─────────────────────────────────────────────────

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
    phase: "Consortium Formation",
    months: "Month 1–3",
    description: "Formalise HBK Research Consortium, sign Research Collaboration Agreements, secure first Grant Agreements",
    milestones: ["Form consortium", "Sign first Research Collaboration Agreement", "Secure WRC/NRF grant", "Establish Pilot Partner relationship"],
    status: "active",
    color: "#10b981",
  },
  {
    id: "p2",
    phase: "Field Validation",
    months: "Month 4–12",
    description: "Deploy HBK Mk-II at pilot site, collect field evidence, begin Bayesian algorithm validation",
    milestones: ["Deploy at pilot site", "Collect field evidence", "Validate algorithms", "Begin publishing"],
    status: "upcoming",
    color: "#3B82F6",
  },
  {
    id: "p3",
    phase: "Industrial Preparation",
    months: "Month 13–24",
    description: "Form Technology Partnership Agreements, optimize hardware, certify reliability, build production prototypes",
    milestones: ["Sign Technology Partnership Agreements", "Optimize hardware", "Certify reliability", "Build production prototype"],
    status: "upcoming",
    color: "#8B5CF6",
  },
  {
    id: "p4",
    phase: "Commercialisation Decision",
    months: "Month 24+",
    description: "Evaluate commercialisation pathway — venture capital, licensing, joint ventures, or independent growth",
    milestones: ["Evaluate pathways", "Make commercialisation decision", "Negotiate from validated position"],
    status: "upcoming",
    color: "#C9A84C",
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

// ── Phase 2: Power Architecture ──────────────────────────────────────────

export interface BatterySpecification {
  chemistry: string;
  format: string;
  configuration: string;
  seriesCells: number;
  parallelCells: number;
  totalCells: number;
  nominalVoltage: number;
  capacityAh: number;
  totalEnergyWh: number;
  bms: string;
  cellModel: string;
  bmsModel: string;
  estimatedWeight: string;
  ruggedizationOverhead: string;
  pottingMaterial: string;
  shiftDuration: string;
  thermalAdvantage: string;
}

export const BATTERY_SPEC: BatterySpecification = {
  chemistry: "LiFePO₄ (Lithium Iron Phosphate)",
  format: "32700 Cylindrical",
  configuration: "8S4P",
  seriesCells: 8,
  parallelCells: 4,
  totalCells: 32,
  nominalVoltage: 25.6,
  capacityAh: 20,
  totalEnergyWh: 614,
  bms: "Daly 8S 20A BMS",
  cellModel: "IFR-32700",
  bmsModel: "Daly BMS-8S20A",
  estimatedWeight: "~5.2 kg (cells + potting + busbars)",
  ruggedizationOverhead: "15% (busbars, holders, epoxy potting resin)",
  pottingMaterial: "Epoxy Resin (structural potting for vibration/field shock)",
  shiftDuration: "8 hours continuous field operation",
  thermalAdvantage: "8S (25.6V) halves current draw vs 4S — I²R resistive heating reduced by ~75% in BMS and PM-01 wiring harness",
};

// ── Phase 2: Star Ground Wiring Protocol (P0–P3) ─────────────────────────

export interface WiringRail {
  id: string;
  name: string;
  designation: string;
  gauge: string;
  voltage: string;
  purpose: string;
  route: string;
  isolationClass: string;
  color: string;
}

export const WIRING_RAILS: WiringRail[] = [
  {
    id: "P0",
    name: "Main Power Rail",
    designation: "P0 — High Current",
    gauge: "10 AWG",
    voltage: "25.6V DC (Battery → BMS → PM-01)",
    purpose: "Primary DC distribution from battery pack through BMS to PM-01 power management unit",
    route: "Battery_8S_32700_Pack (X:140, Y:20) → Power_BMS_Module (X:20, Y:20) — shortest possible run",
    isolationClass: "EMI-HIGH",
    color: "#CC3333",
  },
  {
    id: "P1",
    name: "System Power Rail",
    designation: "P1 — Compute Power",
    gauge: "14 AWG",
    voltage: "12V / 5V (PM-01 → AMD Compute / NVMe / Comms)",
    purpose: "Regulated power from PM-01 to AMD Ryzen SoC, NVMe storage, and comms routing node",
    route: "PM-01 (X:20, Y:20) → AMD Compute (X:160, Y:120) → NVMe (X:320, Y:60) → Comms (X:340, Y:200)",
    isolationClass: "EMI-MEDIUM",
    color: "#F59E0B",
  },
  {
    id: "P2",
    name: "Clean Power Rail",
    designation: "P2 — Clean Rail (Galvanically Isolated)",
    gauge: "18 AWG",
    voltage: "±12.0V / 5.0V (with galvanic isolator)",
    purpose: "Ultra-clean power for analog sensor interface — galvanically isolated from BMS switching noise",
    route: "PM-01 (X:20, Y:20) → Sensor Interface (X:20, Y:180) — dedicated isolation path",
    isolationClass: "CLEAN-ISO",
    color: "#3366CC",
  },
  {
    id: "P3",
    name: "Signal Rail",
    designation: "P3 — Signal (Shielded Twisted Pair)",
    gauge: "Shielded Twisted Pair",
    voltage: "Analog / Digital Signal Lines",
    purpose: "All sensor data lines — routed away from BMS and power rails via shielded twisted pair",
    route: "Sensor Interface (X:20, Y:180) → AMD Compute (X:160, Y:120) — physically separated from P0/P1",
    isolationClass: "SIGNAL-GUARD",
    color: "#10b981",
  },
];

// ── Phase 2: Epistemic Thermal Governance ─────────────────────────────────

export interface ThermalThreshold {
  level: string;
  tempC: number;
  action: string;
  runtimeLog: string;
  color: string;
  icon: string;
  erRule: string;
}

export const THERMAL_THRESHOLDS: ThermalThreshold[] = [
  {
    level: "NORMAL",
    tempC: 65,
    action: "Full operation — all inference loops active, sensor polling at full rate",
    runtimeLog: "No thermal event — continuous operation logged as periodic Fact",
    color: "#10b981",
    icon: "CheckCircle2",
    erRule: "Rule 4 (No Non-Determinism) — deterministic duty cycling at all times",
  },
  {
    level: "WARNING",
    tempC: 65,
    action: "ECO mode engaged — AMD APU clock reduced, sensor polling interval doubled",
    runtimeLog: "Thermal spike logged as append-only Fact (SHA-256 canonical) → WORM storage before ECO mode engagement",
    color: "#F59E0B",
    icon: "AlertTriangle",
    erRule: "Rule 7 (Append-Only Evidence) — temperature event is immutable Fact before any throttling",
  },
  {
    level: "CRITICAL",
    tempC: 75,
    action: "Wake-on-Acoustic loop — APU enters low-power state, analog sensor interface acts as deterministic hardware interrupt",
    runtimeLog: "Critical thermal event logged as Fact → APU enters wake-on-interrupt loop → trigger logged as verified Proof",
    color: "#EF4444",
    icon: "XCircle",
    erRule: "Rule 7 + Rule 4 — if the system misses a leak because inference was terminated at 75°C, engineers have mathematically reproducible proof of why the system was offline",
  },
  {
    level: "EMERGENCY",
    tempC: 85,
    action: "Full system shutdown — battery disconnected via BMS hard-cut, all evidence flushed to NVMe",
    runtimeLog: "Emergency shutdown logged as Fact → final state snapshot → WORM commit → BMS disconnect",
    color: "#DC2626",
    icon: "ShieldAlert",
    erRule: "Rule 7 — final evidence preservation before hardware disconnect. No data loss.",
  },
];

// ── Phase 2: Thermal Containment Architecture ────────────────────────────

export interface ThermalContainmentLayer {
  id: string;
  name: string;
  material: string;
  conductivity: string;
  purpose: string;
  fromComponent: string;
  toComponent: string;
  color: string;
}

export const THERMAL_CONTAINMENT: ThermalContainmentLayer[] = [
  {
    id: "tc1",
    name: "TIM Phase-Change Layer",
    material: "5–7 W/m·K Phase-Change Material (PCM)",
    conductivity: "5–7 W/m·K",
    purpose: "Thermal bridge between Ryzen die and custom copper heat block",
    fromComponent: "AMD Ryzen APU die",
    toComponent: "Copper heat block",
    color: "#F59E0B",
  },
  {
    id: "tc2",
    name: "Structural Conduction Path",
    material: "Thermal gap pads (6061-T6 mainboard → Denel enclosure bosses)",
    conductivity: "3–5 W/m·K",
    purpose: "Conduct heat from mainboard tray to aluminum enclosure shell (passive radiator)",
    fromComponent: "6061-T6 Mainboard Tray",
    toComponent: "Denel aluminum enclosure (IP67 shell)",
    color: "#CC3333",
  },
  {
    id: "tc3",
    name: "Aerogel Battery Isolation",
    material: "Pyrogel XTE Aerogel (0.015 W/m·K)",
    conductivity: "0.015 W/m·K",
    purpose: "Shield LiFePO₄ cells from AMD SoC radiant heat — reclaim 10mm of internal volume",
    fromComponent: "AMD Ryzen APU thermal zone",
    toComponent: "Battery_8S_32700_Pack",
    color: "#3366CC",
  },
  {
    id: "tc4",
    name: "External CNC Fin Array",
    material: "CNC aluminum cooling fins (optional)",
    conductivity: "Aluminum (167 W/m·K)",
    purpose: "If ambient Eastern Cape environment demands it — external fins at APU Z-axis coordinate overhead",
    fromComponent: "Denel enclosure exterior",
    toComponent: "Ambient air",
    color: "#10b981",
  },
];

// ── Phase 2: BOM (Bill of Materials) ─────────────────────────────────────

export interface BOMItem {
  id: string;
  component: string;
  specification: string;
  quantity: string;
  source: string;
  category: string;
  status: "specified" | "sourced" | "ordered" | "received";
}

export const PHASE2_BOM: BOMItem[] = [
  { id: "bom-1", component: "IFR-32700 LiFePO₄ Cells", specification: "32700 cylindrical, 3.2V nominal", quantity: "32", source: "Battery supplier", category: "battery", status: "specified" },
  { id: "bom-2", component: "Daly 8S 20A BMS", specification: "BMS-8S20A, 25.6V nominal", quantity: "1", source: "Daly Electronics", category: "battery", status: "specified" },
  { id: "bom-3", component: "Pyrogel XTE Aerogel", specification: "0.015 W/m·K, 5mm thickness", quantity: "1 sheet (160×95mm)", source: "Aspen Aerogels", category: "thermal", status: "specified" },
  { id: "bom-4", component: "Epoxy Potting Resin", specification: "Structural potting for vibration/field shock", quantity: "1 kit", source: "Epoxy supplier", category: "battery", status: "specified" },
  { id: "bom-5", component: "PCM Thermal Interface", specification: "5–7 W/m·K phase-change material", quantity: "1 pad", source: "TIM supplier", category: "thermal", status: "specified" },
  { id: "bom-6", component: "Thermal Gap Pads", specification: "3–5 W/m·K, mainboard-to-enclosure", quantity: "4 pads", source: "TIM supplier", category: "thermal", status: "specified" },
  { id: "bom-7", component: "10 AWG P0 Power Wire", specification: "High-current DC rail (Battery→BMS)", quantity: "200mm", source: "Wire supplier", category: "wiring", status: "specified" },
  { id: "bom-8", component: "14 AWG P1 System Wire", specification: "Compute power distribution", quantity: "500mm", source: "Wire supplier", category: "wiring", status: "specified" },
  { id: "bom-9", component: "18 AWG P2 Clean Wire", specification: "Galvanically isolated clean rail", quantity: "300mm", source: "Wire supplier", category: "wiring", status: "specified" },
  { id: "bom-10", component: "Shielded Twisted Pair (P3)", specification: "Signal lines — physically separated from P0/P1", quantity: "400mm", source: "Signal cable supplier", category: "wiring", status: "specified" },
  { id: "bom-11", component: "Galvanic Isolator (P2)", specification: "DC-DC isolated converter ±12V/5V", quantity: "1", source: "Isolation component supplier", category: "wiring", status: "specified" },
  { id: "bom-12", component: "Copper Heat Block", specification: "Custom AMD Ryzen APU heat spreader", quantity: "1", source: "CNC machining", category: "thermal", status: "specified" },
];

// ── HBK Dashboard Tabs (updated for Consortium Model + Phase 2) ───────────

export type HbkTabId = "consortium" | "ownership" | "contracts" | "ip" | "roadmap" | "power-thermal" | "twin" | "resources" | "simulation" | "timeline" | "gitlog";

export interface HbkTab {
  id: HbkTabId;
  label: string;
  icon: string;
  description: string;
}

export const HBK_TABS: HbkTab[] = [
  { id: "consortium", label: "Consortium", icon: "Network", description: "HBK Research Consortium architecture and narrative" },
  { id: "ownership", label: "VVU 100%", icon: "Shield", description: "VVU sole ownership — capitalisation table remains clean" },
  { id: "contracts", label: "Contract Model", icon: "FileCheck2", description: "Partnership through contracts, not equity" },
  { id: "ip", label: "IP Boundaries", icon: "Lock", description: "VVU-owned core technology vs joint research outputs" },
  { id: "roadmap", label: "3-Phase Roadmap", icon: "Route", description: "Research Enablement → Industrial Validation → Commercialisation" },
  { id: "power-thermal", label: "Power & Thermal", icon: "Zap", description: "Phase 2: 8S4P battery, Star Ground wiring, Epistemic thermal governance" },
  { id: "twin", label: "Digital Twin", icon: "Cpu", description: "HBK Mk-II 3D CAD layout and module status" },
  { id: "resources", label: "Resource Register", icon: "ClipboardList", description: "Live tracking of commitments and gaps" },
  { id: "simulation", label: "72h Validation", icon: "Activity", description: "Full 72-hour validation loop with digital twin" },
  { id: "timeline", label: "Programme Timeline", icon: "Calendar", description: "Phase tracking, milestones, delivery" },
  { id: "gitlog", label: "Git Actions", icon: "GitBranch", description: "Real-time commit, merge, deploy log" },
];
