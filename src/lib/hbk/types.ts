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

// ── TaaS: Terminal-as-a-Service Commercial Framework ──────────────────────

// Hydro-Gateway Assembly Components (11 integrated HBK Mk-II modules)
export interface HydroGatewayComponent {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  function: string;
  category: "structural" | "metering" | "control" | "power" | "telemetry" | "beacon";
  status: "specification" | "sourced" | "fabrication" | "installed" | "commissioned";
}

export const HYDRO_GATEWAY_ASSEMBLY: HydroGatewayComponent[] = [
  { id: "hga-1", name: "Pressure Pipe", position: { x: 0, y: 0, z: 750 }, function: "Nodal Head Estimation — primary hydraulic conduit", category: "structural", status: "specification" },
  { id: "hga-2", name: "South Datum Skid", position: { x: 0, y: -560, z: 40 }, function: "Base structural support — south anchor point", category: "structural", status: "specification" },
  { id: "hga-3", name: "North Datum Skid", position: { x: 0, y: 560, z: 40 }, function: "Base structural support — north anchor point", category: "structural", status: "specification" },
  { id: "hga-4", name: "Left Service Rack", position: { x: -720, y: -240, z: 290 }, function: "Lateral mounting — left-side service access", category: "structural", status: "specification" },
  { id: "hga-5", name: "Right Service Rack", position: { x: 720, y: 240, z: 290 }, function: "Lateral mounting — right-side service access", category: "structural", status: "specification" },
  { id: "hga-6", name: "Edge Control Cabinet", position: { x: 0, y: 400, z: 400 }, function: "Bayesian inference engine — edge compute & decision layer", category: "control", status: "specification" },
  { id: "hga-7", name: "Power Backup Module", position: { x: 0, y: -400, z: 400 }, function: "8S4P LiFePO₄ power redundancy — 614Wh backup", category: "power", status: "specification" },
  { id: "hga-8", name: "Inlet Meter Pod", position: { x: -750, y: -160, z: 930 }, function: "Primary flow measurement — inlet volumetric & velocity", category: "metering", status: "specification" },
  { id: "hga-9", name: "Outlet Meter Pod", position: { x: 750, y: 160, z: 930 }, function: "Secondary flow measurement — outlet volumetric & velocity", category: "metering", status: "specification" },
  { id: "hga-10", name: "Telemetry Mast", position: { x: 0, y: 0, z: 1290 }, function: "Cellular/GNSS/LoRa data transmission — IP67 sealed", category: "telemetry", status: "specification" },
  { id: "hga-11", name: "Top Height Beacon", position: { x: 100, y: 0, z: 1465 }, function: "Site identification — visual & RF beacon for field crews", category: "beacon", status: "specification" },
];

// TaaS Revenue Split (60/30/10)
export interface RevenueSplit {
  category: string;
  percentage: number;
  allocation: string;
  color: string;
  description: string;
}

export const TAAS_REVENUE_SPLIT: RevenueSplit[] = [
  { category: "Operational Baseline", percentage: 60, allocation: "Hardware amortization, server costs, HBK inference runtime", color: "#C9A84C", description: "Core operational expenditure — the cost of keeping every Terminal online, updated, and returning data" },
  { category: "Growth & R&D", percentage: 30, allocation: "Software refinement, scaling, academic collaboration", color: "#10b981", description: "Reinvestment in the platform — Bayesian model improvement, new sensor integration, and university research partnerships" },
  { category: "Risk & Compliance", percentage: 10, allocation: "ProofBridge-Liner audit chain, regulatory alignment", color: "#3B82F6", description: "Funding the compliance apparatus — independent audit trails, regulatory filing, and the ProofBridge-Liner cryptographic chain" },
];

// VR1-VR5 Verification Gates
export interface VerificationGate {
  id: string;
  name: string;
  method: string;
  criteria: string;
  authority: string;
  status: "locked" | "in_progress" | "passed" | "failed";
  description: string;
}

export const VERIFICATION_GATES: VerificationGate[] = [
  { id: "VR1", name: "Geometry Verification", method: "CMM data, nominal diameter (114.3 mm)", criteria: "All dimensions within ±0.5mm of nominal", authority: "VVU Engineering", status: "locked", description: "Coordinate Measuring Machine validation of all physical dimensions against the CAD nominal model" },
  { id: "VR2", name: "Material Verification", method: "Mill test reports, NDT (Non-Destructive Testing)", criteria: "Material certificates match specification; NDT clear", authority: "VVU Engineering + Academic Partner", status: "locked", description: "Verification that all raw materials and sub-assemblies meet their specified material grades and are free of defects" },
  { id: "VR3", name: "Assembly Verification", method: "Torque logs, route card sign-offs", criteria: "All fasteners torqued to spec; all route cards signed", authority: "VVU Engineering + Municipal Observer", status: "locked", description: "Confirmation that every assembly step was completed per the route card, with torque and fastener records" },
  { id: "VR4", name: "Functional Verification", method: "Factory Acceptance Test (FAT), sensor calibration", criteria: "All sensors calibrated; FAT passed with zero critical defects", authority: "VVU Engineering + Academic Partner", status: "locked", description: "End-to-end functional test of the assembled Terminal — sensor calibration, power-on self-test, and Bayesian inference validation" },
  { id: "VR5", name: "Field Acceptance", method: "Site Acceptance Test (SAT), municipal commissioning", criteria: "SAT passed; municipal sign-off obtained", authority: "VVU + Municipal + Academic (Triparty)", status: "locked", description: "Final field deployment verification — the Terminal operates correctly in its installed environment with live municipal water data" },
];

// TaaS SLA Metrics
export interface SLAMetric {
  id: string;
  name: string;
  target: string;
  baseline: string;
  improvement: string;
  method: string;
  description: string;
}

export const TAAS_SLA_METRICS: SLAMetric[] = [
  { id: "sla-1", name: "Leak Localization", target: "≤500m search radius", baseline: "~10km manual search", improvement: "95% reduction", method: "Bayesian inference on O_t = (P, F, A, T)", description: "The Terminal must localize water loss events to within 500m — a 95% improvement over the current manual inspection paradigm" },
  { id: "sla-2", name: "False Positive Rate", target: "≤5%", baseline: "~30% industry average", improvement: "83% reduction", method: "Poisson-Gaussian mixture distributions", description: "False alarm rate bounded at ≤5% using Poisson-Gaussian mixture distributions to distinguish true leak signatures from transient noise" },
  { id: "sla-3", name: "Information Density", target: "ID = Information Gained / Deployment Cost", baseline: "N/A — new metric", improvement: "Novel KPI", method: "Shannon entropy × Bayesian posterior improvement / ZAR", description: "Information Density (ID) normalizes the value of inference output against deployment cost — a novel KPI unique to VVU's TaaS model" },
];

// TaaS Financing Terms
export interface FinancingTerm {
  id: string;
  item: string;
  amount: string;
  tranche: string;
  condition: string;
  status: "pending" | "locked" | "released" | "allocated";
}

export const TAAS_FINANCING: FinancingTerm[] = [
  { id: "fin-1", item: "Tranche 1 Budget Lock", amount: "R812,490", tranche: "Tranche 1", condition: "VR1–VR3 passed; SRS 32-parameter baseline verified", status: "locked" },
  { id: "fin-2", item: "Vendor Financing — Hardware", amount: "R340,000", tranche: "Tranche 1", condition: "Signed vendor agreement; 30-day payment terms", status: "pending" },
  { id: "fin-3", item: "Vendor Financing — Software", amount: "R185,000", tranche: "Tranche 1", condition: "License agreement executed; SRS parameter mapping", status: "pending" },
  { id: "fin-4", item: "Academic Collaboration Fund", amount: "R127,490", tranche: "Tranche 1", condition: "Research Collaboration Agreement executed", status: "pending" },
  { id: "fin-5", item: "Municipal Pilot Deployment", amount: "R160,000", tranche: "Tranche 2", condition: "VR4 passed; Pilot Partner Agreement signed", status: "pending" },
  { id: "fin-6", item: "Operational Scaling Reserve", amount: "R500,000", tranche: "Tranche 3", condition: "VR5 passed; ≥3 municipal contracts signed", status: "pending" },
];

// InfrastructureRight Abstraction
export interface InfrastructureRight {
  id: string;
  right: string;
  description: string;
  unit: string;
  color: string;
  icon: string;
}

export const INFRASTRUCTURE_RIGHTS: InfrastructureRight[] = [
  { id: "ir-1", right: "Water", description: "Leak detection, pressure monitoring, flow analytics — the core Terminal function", unit: "per km of reticulation monitored", color: "#3B82F6", icon: "Droplets" },
  { id: "ir-2", right: "Energy", description: "Solar MPPT + 8S4P LiFePO₄ autonomy — the Terminal's self-sustaining power envelope", unit: "per Terminal deployed", color: "#F59E0B", icon: "Zap" },
  { id: "ir-3", right: "Compute", description: "Bayesian inference at the edge — the HBK decision layer running on AMD Ryzen AI", unit: "per inference cycle", color: "#10b981", icon: "Cpu" },
  { id: "ir-4", right: "Storage", description: "NVMe data persistence + ProofBridge-Liner audit chain — data sovereignty at the edge", unit: "per GB stored per month", color: "#8B5CF6", icon: "HardDrive" },
];

// Zero Fabrication Mandate
export interface ZeroFabParameter {
  id: string;
  parameter: string;
  category: string;
  target: string;
  verified: boolean;
  verificationGate: string;
}

export const ZERO_FAB_PARAMETERS: ZeroFabParameter[] = [
  { id: "zfp-1", parameter: "Nominal Pipe Diameter", category: "Geometry", target: "114.3 mm ±0.5mm", verified: false, verificationGate: "VR1" },
  { id: "zfp-2", parameter: "EMI/RFI Isolation Gap", category: "Geometry", target: "≥15.0mm", verified: false, verificationGate: "VR1" },
  { id: "zfp-3", parameter: "Base Plate Flatness", category: "Geometry", target: "≤0.1mm over 460mm", verified: false, verificationGate: "VR1" },
  { id: "zfp-4", parameter: "6061-T6 Tensile Strength", category: "Material", target: "≥310 MPa", verified: false, verificationGate: "VR2" },
  { id: "zfp-5", parameter: "LiFePO₄ Cell Voltage", category: "Material", target: "3.2V ±0.05V per cell", verified: false, verificationGate: "VR2" },
  { id: "zfp-6", parameter: "Pyrogel XTE Conductivity", category: "Material", target: "≤0.015 W/m·K", verified: false, verificationGate: "VR2" },
  { id: "zfp-7", parameter: "BMS Torque Spec", category: "Assembly", target: "Per route card ±5%", verified: false, verificationGate: "VR3" },
  { id: "zfp-8", parameter: "Star Ground P0–P3 Isolation", category: "Assembly", target: "≥100MΩ between rails", verified: false, verificationGate: "VR3" },
  { id: "zfp-9", parameter: "Sensor Calibration Accuracy", category: "Functional", target: "≤2% full-scale", verified: false, verificationGate: "VR4" },
  { id: "zfp-10", parameter: "Bayesian Inference Latency", category: "Functional", target: "≤500ms per cycle", verified: false, verificationGate: "VR4" },
  { id: "zfp-11", parameter: "Leak Localization Radius", category: "Functional", target: "≤500m (95% CI)", verified: false, verificationGate: "VR4" },
  { id: "zfp-12", parameter: "False Positive Rate", category: "Functional", target: "≤5%", verified: false, verificationGate: "VR4" },
  { id: "zfp-13", parameter: "Thermal Threshold (Advisory)", category: "Functional", target: "65°C", verified: false, verificationGate: "VR4" },
  { id: "zfp-14", parameter: "Thermal Threshold (Warning)", category: "Functional", target: "75°C", verified: false, verificationGate: "VR4" },
  { id: "zfp-15", parameter: "Thermal Threshold (Critical)", category: "Functional", target: "85°C", verified: false, verificationGate: "VR4" },
  { id: "zfp-16", parameter: "IP67 Seal Integrity", category: "Functional", target: "No ingress after 30min @ 1m depth", verified: false, verificationGate: "VR4" },
  { id: "zfp-17", parameter: "Battery Pack Capacity", category: "Functional", target: "≥20Ah @ 25.6V", verified: false, verificationGate: "VR4" },
  { id: "zfp-18", parameter: "Solar MPPT Efficiency", category: "Functional", target: "≥95%", verified: false, verificationGate: "VR4" },
  { id: "zfp-19", parameter: "Field SAT Duration", category: "Field", target: "72h continuous operation", verified: false, verificationGate: "VR5" },
  { id: "zfp-20", parameter: "Municipal Commissioning", category: "Field", target: "Signed commissioning report", verified: false, verificationGate: "VR5" },
  { id: "zfp-21", parameter: "Telemetry Uptime", category: "Field", target: "≥99.5% over 72h", verified: false, verificationGate: "VR5" },
  { id: "zfp-22", parameter: "Acoustic SNR", category: "Functional", target: "≥20dB in-field", verified: false, verificationGate: "VR4" },
  { id: "zfp-23", parameter: "Observation Vector (O_t)", category: "Functional", target: "P, F, A, T streaming at ≥1Hz", verified: false, verificationGate: "VR4" },
  { id: "zfp-24", parameter: "ProofBridge-Liner Hash", category: "Functional", target: "SHA-256 chain integrity", verified: false, verificationGate: "VR4" },
  { id: "zfp-25", parameter: "GNSS Position Fix", category: "Field", target: "≤3m CEP", verified: false, verificationGate: "VR5" },
  { id: "zfp-26", parameter: "Cellular Data Throughput", category: "Field", target: "≥100kbps sustained", verified: false, verificationGate: "VR5" },
  { id: "zfp-27", parameter: "NVMe Write Endurance", category: "Functional", target: "≥1 DWPD", verified: false, verificationGate: "VR4" },
  { id: "zfp-28", parameter: "Power Budget Balance", category: "Functional", target: "Solar input ≥ consumption (24h avg)", verified: false, verificationGate: "VR4" },
  { id: "zfp-29", parameter: "Vibration Survival", category: "Field", target: "IEC 60068-2-6, 10–150Hz", verified: false, verificationGate: "VR5" },
  { id: "zfp-30", parameter: "EMC Compliance", category: "Field", target: "IEC 61000-6-2/4", verified: false, verificationGate: "VR5" },
  { id: "zfp-31", parameter: "LoRa Range", category: "Field", target: "≥2km urban", verified: false, verificationGate: "VR5" },
  { id: "zfp-32", parameter: "Hydro-Gateway Assembly Alignment", category: "Field", target: "All 11 components within ±2mm", verified: false, verificationGate: "VR5" },
];

// Triparty SRS Delegation Addendum ("Three Keys")
export interface TripartyKey {
  id: string;
  party: string;
  role: string;
  keyType: string;
  color: string;
  description: string;
}

export const TRIPARTY_KEYS: TripartyKey[] = [
  { id: "key-1", party: "VVU", role: "Technology Owner", keyType: "Master Key", color: "#C9A84C", description: "VVU holds the master key — no SRS modification proceeds without VVU's cryptographic authorization" },
  { id: "key-2", party: "Academic Partner", role: "Independent Validator", keyType: "Validation Key", color: "#3B82F6", description: "The academic partner holds the validation key — ensuring that SRS parameter changes are empirically grounded" },
  { id: "key-3", party: "Municipal Authority", role: "Operational Authority", keyType: "Operational Key", color: "#10b981", description: "The municipal authority holds the operational key — no Terminal enters live service without municipal commissioning sign-off" },
];

// Default & Asset Recovery
export interface AssetRecoveryProvision {
  id: string;
  provision: string;
  trigger: string;
  action: string;
  party: string;
}

export const ASSET_RECOVERY_PROVISIONS: AssetRecoveryProvision[] = [
  { id: "arp-1", provision: "Terminal Return", trigger: "Contract termination (any reason)", action: "Terminal hardware returned to VVU within 30 days", party: "Municipal" },
  { id: "arp-2", provision: "Data Extraction", trigger: "Terminal return", action: "VVU extracts all stored data; municipal copy provided within 14 days", party: "VVU" },
  { id: "arp-3", provision: "IP Preservation", trigger: "Any circumstance", action: "VVU retains all IP, model weights, and inference code — no transfer", party: "VVU" },
  { id: "arp-4", provision: "ProofBridge-Liner Audit", trigger: "Dispute or default", action: "Independent audit chain activated; cryptographic evidence preserved", party: "Academic Partner" },
  { id: "arp-5", provision: "Escalation Protocol", trigger: "Payment default >60 days", action: "Terminal enters reduced-function mode; data continues logging", party: "VVU" },
];

// TaaS Core Pillars
export interface TaasPillar {
  id: string;
  pillar: string;
  description: string;
  color: string;
  icon: string;
}

export const TAAS_CORE_PILLARS: TaasPillar[] = [
  { id: "pillar-1", pillar: "100% Equity Retention", description: "VVU retains full ownership of all core technology, platform IP, and Terminal hardware. No equity dilution at any stage.", color: "#C9A84C", icon: "Shield" },
  { id: "pillar-2", pillar: "Sole Data Sovereignty", description: "All data collected by VVU Terminals belongs to VVU. Municipal partners receive operational reports and anonymised datasets — never raw data.", color: "#10b981", icon: "Lock" },
  { id: "pillar-3", pillar: "InfrastructureRight Abstraction", description: "Water, Energy, Compute, and Storage are delivered as digital rights — not physical assets. The municipality subscribes to outcomes, not equipment.", color: "#3B82F6", icon: "Key" },
];

// ════════════════════════════════════════════════════════════════════════
// Founding Partners Campaign Framework — "Founding 100"
// ════════════════════════════════════════════════════════════════════════

// ── Campaign Narrative ─────────────────────────────────────────────────

export const FOUNDING100_NARRATIVE = {
  coreQuote: "We are not requesting unrestricted funding. We are inviting your organization to sponsor one operational resource that enables the HBK Applied Research Programme to continue building South African technology for water infrastructure.",
  oneSentenceAsk: "Will you become one of the first 100 organizations helping establish South Africa's HBK Applied Research Programme?",
};

// ── Campaign Psychology ────────────────────────────────────────────────

export interface CampaignPsychology {
  oldApproach: string;
  newApproach: string;
}

export const CAMPAIGN_PSYCHOLOGY: CampaignPsychology[] = [
  { oldApproach: "Will you sponsor us?", newApproach: "Will you become one of the first 100 organizations helping establish South Africa's HBK Applied Research Programme?" },
  { oldApproach: "Asking for help", newApproach: "Inviting participation" },
  { oldApproach: "One large sponsor needed", newApproach: "Many small contributions build momentum" },
  { oldApproach: "Passive request", newApproach: "Active campaign" },
  { oldApproach: "Uncertainty about what's needed", newApproach: "Clear menu of opportunities" },
];

// ── Sponsorship Catalogue Packages ─────────────────────────────────────

export interface SponsorshipPackage {
  id: string;
  name: string;
  icon: string;
  color: string;
  estimatedValue: string;
  impact: string;
  items: { name: string; quantity: string; typicalProvider: string }[];
}

export const FOUNDING100_PACKAGES: SponsorshipPackage[] = [
  {
    id: "pkg-ops",
    name: "Operations Package",
    icon: "Building2",
    color: "#C9A84C",
    estimatedValue: "R15,000–30,000",
    impact: "Enables dedicated research workspace",
    items: [
      { name: "Desk", quantity: "2", typicalProvider: "University, office provider" },
      { name: "Chair", quantity: "2", typicalProvider: "University, office provider" },
      { name: "Lockable cabinet", quantity: "1", typicalProvider: "University, office provider" },
    ],
  },
  {
    id: "pkg-eng",
    name: "Engineering Package",
    icon: "Laptop",
    color: "#10b981",
    estimatedValue: "R30,000–90,000",
    impact: "Powers engineering development and algorithm validation",
    items: [
      { name: "Laptop", quantity: "1–3", typicalProvider: "Dell, Lenovo, HP" },
      { name: "External monitor", quantity: "1–3", typicalProvider: "Hardware manufacturer, retail" },
      { name: "UPS", quantity: "1–2", typicalProvider: "Makro, Builders" },
      { name: "Keyboard & mouse", quantity: "1–3", typicalProvider: "Hardware manufacturer, retail" },
    ],
  },
  {
    id: "pkg-conn",
    name: "Connectivity Package",
    icon: "Wifi",
    color: "#3B82F6",
    estimatedValue: "R5,000–15,000/year",
    impact: "Enables field data transmission and cloud connectivity",
    items: [
      { name: "Router", quantity: "1", typicalProvider: "MTN, Vodacom" },
      { name: "SIM card", quantity: "1–2", typicalProvider: "Telecom provider" },
      { name: "Monthly data allocation", quantity: "200+ GB", typicalProvider: "Telecom provider" },
    ],
  },
  {
    id: "pkg-field",
    name: "Field Operations Package",
    icon: "HardHat",
    color: "#F59E0B",
    estimatedValue: "R10,000–25,000",
    impact: "Enables safe field deployment",
    items: [
      { name: "Reflective jackets", quantity: "3–5", typicalProvider: "PPE supplier, textile company" },
      { name: "Safety boots", quantity: "3–5", typicalProvider: "PPE supplier" },
      { name: "Hard hats", quantity: "3–5", typicalProvider: "PPE supplier" },
      { name: "Equipment bags", quantity: "2–3", typicalProvider: "PPE supplier, local manufacturer" },
    ],
  },
  {
    id: "pkg-workshop",
    name: "Workshop Package",
    icon: "Users",
    color: "#8B5CF6",
    estimatedValue: "R5,000–15,000/workshop",
    impact: "Enables research workshops and stakeholder meetings",
    items: [
      { name: "Printing services", quantity: "Up to 500 pages", typicalProvider: "Local print shop, university" },
      { name: "Meeting room", quantity: "As needed", typicalProvider: "University, municipality" },
      { name: "Coffee/refreshments", quantity: "For 20 participants", typicalProvider: "Local café, restaurant" },
      { name: "Lunch", quantity: "For 20 participants", typicalProvider: "Catering company, restaurant" },
    ],
  },
  {
    id: "pkg-brand",
    name: "Branding Package",
    icon: "Tshirt",
    color: "#EF4444",
    estimatedValue: "R8,000–25,000",
    impact: "Professional presence and programme identity",
    items: [
      { name: "Branded shirts", quantity: "5–10", typicalProvider: "Textile company, embroidery business" },
      { name: "Jackets", quantity: "3–5", typicalProvider: "Textile company" },
      { name: "Caps", quantity: "5–10", typicalProvider: "Textile company, embroidery business" },
      { name: "Name badges", quantity: "5–10", typicalProvider: "Signage company, print shop" },
      { name: "Vehicle branding", quantity: "1 (optional)", typicalProvider: "Signage company" },
    ],
  },
];

// ── Partner Categories ─────────────────────────────────────────────────

export interface PartnerCategory {
  id: string;
  tier: string;
  partners: string[];
  agreementType: string;
  color: string;
  description: string;
}

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  // Consortium Members
  { id: "pc-research", tier: "Consortium — Research", partners: ["UCT", "Wits", "Other universities"], agreementType: "Research Collaboration Agreement", color: "#3B82F6", description: "Formal research collaboration with academic institutions" },
  { id: "pc-government", tier: "Consortium — Government", partners: ["WRC", "NRF", "DSTI"], agreementType: "Grant Agreement", color: "#10b981", description: "Government funding bodies supporting applied research" },
  { id: "pc-industry", tier: "Consortium — Industry", partners: ["AMD", "Sensor manufacturers", "Tech partners"], agreementType: "Technology Partnership Agreement", color: "#C9A84C", description: "Technology companies providing hardware and expertise" },
  { id: "pc-municipal", tier: "Consortium — Municipalities", partners: ["NMBM", "Other municipalities"], agreementType: "Pilot Agreement", color: "#F59E0B", description: "Municipal partners providing pilot sites and operational validation" },
  // Friends of VVU
  { id: "fv-small", tier: "Friends of VVU — Small Business", partners: ["Local shops", "Hardware stores"], agreementType: "In-kind support, discounts", color: "#8B5CF6", description: "Informal support — no lengthy agreements required" },
  { id: "fv-food", tier: "Friends of VVU — Restaurants", partners: ["Local cafés", "Catering"], agreementType: "Refreshments, meals", color: "#EF4444", description: "Food and refreshment contributions for workshops" },
  { id: "fv-community", tier: "Friends of VVU — Community", partners: ["Churches", "Community centers"], agreementType: "Space, volunteers", color: "#06B6D4", description: "Community organizations providing space and volunteers" },
  { id: "fv-print", tier: "Friends of VVU — Printing", partners: ["Local print shops"], agreementType: "Documentation, signage", color: "#84CC16", description: "Printing companies supporting documentation" },
  { id: "fv-transport", tier: "Friends of VVU — Transport", partners: ["Taxi companies"], agreementType: "Transport, logistics", color: "#F97316", description: "Transport companies providing logistics support" },
  // Founding Community Partners
  { id: "fc-catering", tier: "Founding Community — Catering", partners: ["Meeting refreshments", "Workshop meals"], agreementType: "In-kind", color: "#EC4899", description: "Catering for research workshops" },
  { id: "fc-uniform", tier: "Founding Community — Uniforms", partners: ["Branded shirts", "Jackets", "Caps"], agreementType: "In-kind", color: "#14B8A6", description: "Professional field presence" },
  { id: "fc-logistics", tier: "Founding Community — Logistics", partners: ["Equipment transport", "Storage"], agreementType: "In-kind", color: "#A855F7", description: "Logistics for field operations" },
  { id: "fc-marketing", tier: "Founding Community — Marketing", partners: ["Photography", "Videography", "Social media"], agreementType: "In-kind", color: "#6366F1", description: "Marketing and visibility support" },
];

// ── Impact Language Framework ──────────────────────────────────────────

export interface ImpactLanguage {
  needStatement: string;
  impactStatement: string;
}

export const IMPACT_LANGUAGE: ImpactLanguage[] = [
  { needStatement: "We require office space.", impactStatement: "A contribution of temporary workspace will directly accelerate engineering development, field validation, and student collaboration during the foundational phase of the HBK Applied Research Programme." },
  { needStatement: "We need laptops.", impactStatement: "Sponsoring a workstation enables our engineering team to develop and validate the HBK Mk-II platform, advancing South Africa's hydraulic intelligence capabilities." },
  { needStatement: "We require mobile data.", impactStatement: "A data contribution allows our field teams to transmit critical acoustic and pressure evidence in real-time, accelerating validation of Bayesian leak detection algorithms." },
  { needStatement: "We need branded shirts.", impactStatement: "Supporting field uniforms establishes a professional research presence during municipal site visits, building trust with partners and communities." },
  { needStatement: "We require workshop catering.", impactStatement: "Sponsoring workshop refreshments enables productive collaboration among researchers, municipalities, and industry partners working on water infrastructure solutions." },
];

// ── Network Effect Contributions ───────────────────────────────────────

export interface NetworkEffect {
  contribution: string;
  partnerType: string;
  impact: string;
}

export const NETWORK_EFFECTS: NetworkEffect[] = [
  { contribution: "2 desks", partnerType: "University", impact: "Enables research workspace" },
  { contribution: "1 laptop", partnerType: "Dell", impact: "Powers engineering development" },
  { contribution: "10 shirts", partnerType: "Local textile company", impact: "Professional field presence" },
  { contribution: "200 GB/month", partnerType: "MTN", impact: "Connectivity for field data" },
  { contribution: "Whiteboard", partnerType: "Makro", impact: "Planning and collaboration" },
  { contribution: "Printing", partnerType: "Local print shop", impact: "Documentation and reporting" },
  { contribution: "Coffee", partnerType: "Local café", impact: "Meeting refreshments" },
  { contribution: "Safety boots", partnerType: "PPE supplier", impact: "Field operations safety" },
];

// ── Campaign Success Metrics ───────────────────────────────────────────

export interface SuccessMetric {
  metric: string;
  target: string;
  measurement: string;
}

export const CAMPAIGN_SUCCESS_METRICS: SuccessMetric[] = [
  { metric: "Founding 100 partners", target: "100 within 12 months", measurement: "Signed response forms" },
  { metric: "Resources secured", target: "All priority resources", measurement: "Resource register" },
  { metric: "Programme visibility", target: "50+ mentions", measurement: "Media, social media" },
  { metric: "Grant funding", target: "2+ grants secured", measurement: "Grant agreements" },
  { metric: "Research outputs", target: "2+ papers submitted", measurement: "Publications" },
];

// ── Outreach Strategy Tiers ────────────────────────────────────────────

export interface OutreachTier {
  tier: number;
  targets: string;
  approach: string;
  keyMessage: string;
}

export const OUTREACH_TIERS: OutreachTier[] = [
  { tier: 1, targets: "Universities (UCT, Wits)", approach: "Research office, engineering faculty", keyMessage: "Enable research collaboration and student training" },
  { tier: 2, targets: "Funding bodies (WRC, NRF)", approach: "Programme officers, grants managers", keyMessage: "Fund applied research with national impact" },
  { tier: 3, targets: "Municipalities (NMBM)", approach: "Engineering department, city management", keyMessage: "Pilot site access and operational validation" },
  { tier: 4, targets: "Technology companies (AMD, Dell, Lenovo)", approach: "Regional directors, CSR managers", keyMessage: "Showcase your hardware in African water infrastructure research" },
  { tier: 5, targets: "Telecom providers (MTN, Vodacom)", approach: "Corporate affairs, CSR", keyMessage: "Enable connectivity for field research" },
  { tier: 6, targets: "Retail (Makro, Builders)", approach: "Corporate social investment, store managers", keyMessage: "Support local technology development through in-kind contributions" },
  { tier: 7, targets: "Local manufacturers", approach: "Owners, managers", keyMessage: "Contribute to a nationally relevant programme" },
  { tier: 8, targets: "Food/catering", approach: "Owners, managers", keyMessage: "Support research workshops and meetings" },
];

// ════════════════════════════════════════════════════════════════════════
// Operator Runbook VVU-VAL-001 — 72h Validation
// ════════════════════════════════════════════════════════════════════════

// ── Golden Rules ───────────────────────────────────────────────────────

export interface GoldenRule {
  id: string;
  rule: string;
  rationale: string;
  severity: "mandatory" | "high" | "medium";
}

export const OPERATOR_GOLDEN_RULES: GoldenRule[] = [
  { id: "gr-1", rule: "No code changes", rationale: "The frozen commit hash must remain the build under test for the full 72 hours.", severity: "mandatory" },
  { id: "gr-2", rule: "No configuration edits", rationale: "Config changes could alter the runtime's behaviour mid-run, invalidating earlier phases.", severity: "mandatory" },
  { id: "gr-3", rule: "No manual Fact Log edits", rationale: "The Fact Log is append-only and immutable. Any edit is a Critical failure (§3.1).", severity: "mandatory" },
  { id: "gr-4", rule: "No manual Circuit Breaker transitions", rationale: "The CB must transition per the state machine. Manual transitions permitted only for P5/P7 documented recovery sequences.", severity: "mandatory" },
  { id: "gr-5", rule: "Hardware replacement only", rationale: "If a physical node fails, you may replace it. Log timestamp, node ID, and sign the entry.", severity: "high" },
  { id: "gr-6", rule: "All interventions logged", rationale: "Every SSH session, kubectl command, hardware touch — logged to an append-only operator log.", severity: "mandatory" },
  { id: "gr-7", rule: "All interventions signed", rationale: "Every log entry is signed with your Ed25519 key (published before T=0).", severity: "mandatory" },
  { id: "gr-8", rule: "No touching evidence bundles", rationale: "Evidence bundles are produced by the archiver and are immutable. You have no write access.", severity: "mandatory" },
];

// ── Validation Phases (72h) ────────────────────────────────────────────

export interface ValidationPhase {
  id: string;
  phase: string;
  hours: string;
  whatToWatch: string;
  whenToAct: string;
  status: "pending" | "active" | "passed" | "critical";
}

export const VALIDATION_PHASES_72H: ValidationPhase[] = [
  { id: "vp-1", phase: "P1 Nominal", hours: "0–12", whatToWatch: "CB stays NORMAL", whenToAct: "Only if CB goes FAIL-CLOSED (Critical)", status: "pending" },
  { id: "vp-2", phase: "P2 Flood", hours: "12–24", whatToWatch: "Queue depth, CB may go DEGRADED", whenToAct: "Only if CB goes FAIL-CLOSED (Critical)", status: "pending" },
  { id: "vp-3", phase: "P3 Network Chaos", hours: "24–36", whatToWatch: "Replay status, latency", whenToAct: "Only if replay goes DIVERGENT (Critical)", status: "pending" },
  { id: "vp-4", phase: "P4 Storage Pressure", hours: "36–48", whatToWatch: "Disk usage, CB DEGRADED expected", whenToAct: "Only if disk fills to 100% (replace PV)", status: "pending" },
  { id: "vp-5", phase: "P5 Node Failure", hours: "48–60", whatToWatch: "Pods restarting, CB recovery", whenToAct: "Only if a pod doesn't restart within 5 min", status: "pending" },
  { id: "vp-6", phase: "P6 Security", hours: "60–66", whatToWatch: "Rejected payloads, HF gates", whenToAct: "Only if a spoofed payload is ACCEPTED (Critical)", status: "pending" },
  { id: "vp-7", phase: "P7 Partition", hours: "66–72", whatToWatch: "NATS queue, then HLC merge", whenToAct: "Only if merge produces conflicts (Critical)", status: "pending" },
];

// ── Critical Failure Response ──────────────────────────────────────────

export interface CriticalFailureResponse {
  step: string;
  action: string;
}

export const CRITICAL_FAILURE_RESPONSE: CriticalFailureResponse[] = [
  { step: "1. Do NOT attempt to fix it", action: "The run terminates immediately; the outcome is FAIL." },
  { step: "2. Log the failure", action: "Log in operator log with timestamp and description." },
  { step: "3. Notify stakeholders", action: "Notify VVU engineering lead and independent observers." },
  { step: "4. Preserve all evidence", action: "Do not delete or modify any logs, bundles, or state." },
  { step: "5. File postmortem", action: "Postmortem within 48 hours, published alongside evidence package." },
];

// ── Companion Documents ────────────────────────────────────────────────

export interface CompanionDocument {
  name: string;
  purpose: string;
  audience: string;
}

export const COMPANION_DOCUMENTS: CompanionDocument[] = [
  { name: "Master Programme & Governance Document", purpose: "Programme framework, governance, partner types, agreements", audience: "All partners, formal reference" },
  { name: "Founding Resource Partnership Prospectus", purpose: "Visual catalogue of sponsorship opportunities", audience: "Prospective partners, decision-makers" },
  { name: "Partner Outreach Pack", purpose: "Cover letter, one-pager, catalogue, FAQs, response form", audience: "Outreach contacts, all prospects" },
];

// ── HBK Dashboard Tabs (updated for Consortium Model + Phase 2 + TaaS + Founding 100 + VVU-VAL-001) ────

export type HbkTabId = "consortium" | "ownership" | "contracts" | "ip" | "roadmap" | "power-thermal" | "twin" | "taas" | "founding100" | "resources" | "simulation" | "timeline" | "gitlog";

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
  { id: "taas", label: "TaaS", icon: "Briefcase", description: "Terminal-as-a-Service: Commercial framework, revenue split, verification gates, SLA metrics" },
  { id: "founding100", label: "Founding 100", icon: "Users", description: "Founding Partners Campaign — sponsorship catalogue, partner categories, outreach strategy" },
  { id: "resources", label: "Resource Register", icon: "ClipboardList", description: "Live tracking of commitments and gaps" },
  { id: "simulation", label: "72h Validation", icon: "Activity", description: "Full 72-hour validation loop with digital twin" },
  { id: "timeline", label: "Programme Timeline", icon: "Calendar", description: "Phase tracking, milestones, delivery" },
  { id: "gitlog", label: "Git Actions", icon: "GitBranch", description: "Real-time commit, merge, deploy log" },
];
