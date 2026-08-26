// VVU Platform Architecture Data — Portrait/Landscape dual-environment spec.
// All ZAR pricing, role tiers, Ubuntu Pools, Integrations, and Studio Worksheets
// per the VRES / VRES1 / NMU architectural ideal specification.

// ─── ANTPAY ZAR Pricing Tiers ───
export interface PricingTier {
  id: string;
  name: string;
  priceZAR: string;
  priceMonthly: number;
  target: string;
  features: string[];
  badge?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "student",
    name: "Student / Academic",
    priceZAR: "R0/mo",
    priceMonthly: 0,
    target: "Students, Researchers, Open Source",
    features: [
      "STUDI Workspace only",
      "Open Source resources",
      "Basic Canvas tools",
      "No Enterprise Topology",
      "No Bloomberg-style data",
      "No Compliance Zips",
    ],
    badge: "FREE",
  },
  {
    id: "starter",
    name: "Starter / Creator",
    priceZAR: "R4,500/mo",
    priceMonthly: 4500,
    target: "Creators, Engineers, Indie Developers",
    features: [
      "Full Studio access",
      "ProofBridge-Liner + EIS AIR",
      "3D Construction viewport",
      "ANTPAY Metering",
      "Ubuntu Pools (Stokvel)",
      "API Keys + Receipts",
    ],
  },
  {
    id: "professional",
    name: "Professional / Auditor",
    priceZAR: "R15,000/mo",
    priceMonthly: 15000,
    target: "Auditors, Doctors, Certified Professionals",
    features: [
      "Everything in Starter",
      "Watchdog Gate Engine",
      "HBK Mk-II data access",
      "Governance Artifacts",
      "Encryption (zipenc AES-256)",
      "Compliance Exports (6 regulators)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceZAR: "R45,000/mo",
    priceMonthly: 45000,
    target: "Large Organizations, Corporates",
    features: [
      "Everything in Professional",
      "Full Command Center",
      "Enterprise Topology",
      "Bloomberg-style data feeds",
      "Dedicated support",
      "Custom integrations",
    ],
    badge: "POPULAR",
  },
  {
    id: "government",
    name: "Government",
    priceZAR: "R25,000/mo",
    priceMonthly: 25000,
    target: "Government Departments, Municipalities",
    features: [
      "Everything in Professional",
      "Government-grade compliance",
      "DWS export pipeline",
      "Hyperledger topology",
      "Audit trail (POPIA-compliant)",
    ],
  },
  {
    id: "municipal",
    name: "Municipal",
    priceZAR: "R12,000/mo",
    priceMonthly: 12000,
    target: "Municipalities, Local Government",
    features: [
      "Everything in Professional",
      "Municipal SCADA integration",
      "Water-distribution benchmarking",
      "Stokvel community pools",
      "ProofBridge receipts",
    ],
  },
];

// ─── Ubuntu Pools / Stokvel ───
export interface PoolContribution {
  id: string;
  contributor: string;
  amountZAR: number;
  date: string;
  proofBridgeReceipt: string;
}

export interface UbuntuPool {
  id: string;
  name: string;
  description: string;
  balanceZAR: number;
  contributorCount: number;
  contributionRange: string;
  receipts: PoolContribution[];
}

export const UBUNTU_POOLS: UbuntuPool[] = [
  {
    id: "pool-stokvel-main",
    name: "VVU Community Stokvel",
    description: "Community pooled funding for VVU infrastructure development. Every contribution gets a ProofBridge receipt.",
    balanceZAR: 247500,
    contributorCount: 89,
    contributionRange: "R500 – R5,000 / month",
    receipts: [
      { id: "PB-2026-08-24-001", contributor: "anonymous", amountZAR: 500, date: "2026-08-24", proofBridgeReceipt: "0x7f3e…a21c" },
      { id: "PB-2026-08-24-002", contributor: "anonymous", amountZAR: 1000, date: "2026-08-24", proofBridgeReceipt: "0x9b2d…7711" },
      { id: "PB-2026-08-23-007", contributor: "anonymous", amountZAR: 2500, date: "2026-08-23", proofBridgeReceipt: "0x4c81…03af" },
    ],
  },
  {
    id: "pool-vvu-funding",
    name: "Direct VVU Funding",
    description: "Direct funding for Venture Vision Ubuntu core research and platform development.",
    balanceZAR: 525000,
    contributorCount: 12,
    contributionRange: "R1,000 – R50,000 / month",
    receipts: [
      { id: "PB-2026-08-22-001", contributor: "anonymous", amountZAR: 50000, date: "2026-08-22", proofBridgeReceipt: "0xaef9…91b2" },
      { id: "PB-2026-08-20-003", contributor: "anonymous", amountZAR: 10000, date: "2026-08-20", proofBridgeReceipt: "0x12ab…77ee" },
    ],
  },
];

// ─── Integrations (Connection Graph) ───
export interface Integration {
  id: string;
  name: string;
  type: "social" | "email" | "workspace" | "version-control" | "academic";
  icon: string;
  status: "connected" | "disconnected" | "pending";
  account?: string;
}

export const INTEGRATIONS: Integration[] = [
  { id: "discord", name: "Discord", type: "social", icon: "💬", status: "connected", account: "VVU Community Server" },
  { id: "outlook", name: "Outlook", type: "email", icon: "📧", status: "connected", account: "user@organization.co.za" },
  { id: "gmail", name: "Gmail Workspace", type: "email", icon: "✉️", status: "disconnected" },
  { id: "teams", name: "Microsoft Teams", type: "workspace", icon: "👥", status: "connected", account: "Engineering Team" },
  { id: "github", name: "GitHub", type: "version-control", icon: "🐙", status: "connected", account: "divhanimajokweni-ctrl" },
  { id: "wits", name: "Wits University", type: "academic", icon: "🎓", status: "pending" },
  { id: "ecsa", name: "ECSA", type: "academic", icon: "🏛️", status: "disconnected" },
  { id: "saica", name: "SAICA", type: "academic", icon: "📊", status: "disconnected" },
  { id: "cipc", name: "CIPC", type: "academic", icon: "🏢", status: "disconnected" },
  { id: "ieee", name: "IEEE", type: "academic", icon: "📡", status: "pending" },
];

// ─── ZKP Role Verification ───
export type UserRole = "student" | "creator" | "professional" | "enterprise" | "government" | "municipal" | "guest";

export interface ZKPAttestation {
  id: string;
  source: string;
  claim: string;
  verified: boolean;
}

export const ZKP_ATTESTATION_SOURCES: { id: string; name: string; icon: string }[] = [
  { id: "wits", name: "Wits University", icon: "🎓" },
  { id: "ecsa", name: "ECSA", icon: "🏛️" },
  { id: "saica", name: "SAICA", icon: "📊" },
  { id: "cipc", name: "CIPC", icon: "🏢" },
  { id: "github", name: "GitHub", icon: "🐙" },
  { id: "microsoft", name: "Microsoft", icon: "🪟" },
  { id: "ieee", name: "IEEE", icon: "📡" },
];

export const ROLE_TIERS: Record<UserRole, { label: string; pricingTier: string; visibleTabs: string[] }> = {
  guest: {
    label: "Guest",
    pricingTier: "student",
    visibleTabs: ["overview", "sandbox", "devsdk"],
  },
  student: {
    label: "Student / Academic",
    pricingTier: "student",
    visibleTabs: ["overview", "sandbox", "devsdk", "studio", "integrations"],
  },
  creator: {
    label: "Creator / Engineer",
    pricingTier: "starter",
    visibleTabs: ["overview", "hbk", "facilitator", "integration", "air", "sandbox", "canvas", "aerospace", "searm", "field", "devsdk", "studio", "antpay", "pools", "integrations"],
  },
  professional: {
    label: "Professional / Auditor",
    pricingTier: "professional",
    visibleTabs: ["overview", "hbk", "facilitator", "integration", "air", "crypto", "sandbox", "canvas", "aerospace", "searm", "field", "devsdk", "studio", "antpay", "pools", "integrations"],
  },
  enterprise: {
    label: "Enterprise",
    pricingTier: "enterprise",
    visibleTabs: ["overview", "hbk", "facilitator", "integration", "air", "crypto", "sandbox", "canvas", "aerospace", "searm", "field", "devsdk", "studio", "antpay", "pools", "integrations"],
  },
  government: {
    label: "Government",
    pricingTier: "government",
    visibleTabs: ["overview", "hbk", "facilitator", "integration", "air", "crypto", "sandbox", "canvas", "aerospace", "searm", "field", "devsdk", "studio", "antpay", "pools", "integrations"],
  },
  municipal: {
    label: "Municipal",
    pricingTier: "municipal",
    visibleTabs: ["overview", "hbk", "facilitator", "integration", "air", "crypto", "sandbox", "canvas", "aerospace", "searm", "field", "devsdk", "studio", "antpay", "pools", "integrations"],
  },
};

// ─── Studio Worksheets (Landscape View) ───
export interface StudioWorksheet {
  id: string;
  name: string;
  icon: string;
  purpose: string;
  pipeline: string[];
  graphDescription: string;
}

export const STUDIO_WORKSHEETS: StudioWorksheet[] = [
  {
    id: "ws-studi",
    name: "STUDI Workspace",
    icon: "📝",
    purpose: "Creating documents, uploading and setting process specifications.",
    pipeline: ["Document Canvas", "Source Data Reference", "Save / Sync"],
    graphDescription: "Live Architecture Graph showing the document's nodes connecting to its source data (CAD files, data resources).",
  },
  {
    id: "ws-proofbridge",
    name: "ProofBridge-Liner & EIS AIR",
    icon: "🔗",
    purpose: "Input CAD files, decide what you want to do, then run the Process ProofBridge-Liner, EIS AIR then 3D construction pipeline.",
    pipeline: ["CAD Upload (Drag & Drop)", "Process Specifications (Parameter Sliders)", "Output 3D Construction"],
    graphDescription: "Live Architecture Graph at highest density: CAD Node → ProofBridge-Liner Node → EIS AIR Node → 3D Construction Node. Every action adds a new node.",
  },
  {
    id: "ws-construct",
    name: "Construct / Design / Generate",
    icon: "🏗️",
    purpose: "Interactive work mode to build, design, and generate the 3D model.",
    pipeline: ["Construct Toolbar", "Design Toolbar", "Generate Toolbar"],
    graphDescription: "Thermal and Document Agents operate here. The graph tracks every modification made to the assets.",
  },
  {
    id: "ws-mint",
    name: "Mint / Governance",
    icon: "🔏",
    purpose: "Minting assets, locking, encrypting, and validating.",
    pipeline: ["Compress (zipenc Stage 1)", "Fernet Key (Stage 2)", "AES-256 .enc (Stage 3)", "Governance Artifacts Table"],
    graphDescription: "Governance Graph showing the artifact's lifecycle: PROPOSED → SUPPORTED → ACCEPTED → COMMITTED (VRES Bridge State Machine).",
  },
  {
    id: "ws-validate",
    name: "Validate / Export",
    icon: "✅",
    purpose: "Fraud detection checks (Watchdog Gate Engine) and Git Export.",
    pipeline: ["Watchdog Gate Engine (G01-G19)", "Brier Score Check (< 0.02)", "Evidence Decay Tracker", "Export to Git / DWS"],
    graphDescription: "Hyperledger/Topology graph showing the connection between fraud detection events and the final exported Git repositories.",
  },
  {
    id: "ws-sandbox",
    name: "Accretion Sandbox (The Game)",
    icon: "🎮",
    purpose: "Interactive demonstration of the model-driven V-design loop.",
    pipeline: ["AntonVVU Node Editor", "AntonGame Survival Shooter", "Logic Tiles Codification", "Stickman Shooter", "Marketplace"],
    graphDescription: "Game engine renders on top. Live Architecture Graph acts as a Heatmap/Thermal overlay (Thermal Crash NMU scenario) showing AI intervention logic in real time.",
  },
];

// ─── Top Ribbon Stages (Landscape View) ───
export const STUDIO_RIBBON = [
  { id: "construct", label: "Construct", icon: "🏗️" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "generate", label: "Generate", icon: "⚡" },
  { id: "mint", label: "Mint", icon: "🔏" },
  { id: "validate", label: "Validate", icon: "✅" },
  { id: "export", label: "Export", icon: "📦" },
] as const;

// ─── Master Graph Nodes (Portrait View) ───
export interface MasterGraphNode {
  id: string;
  label: string;
  type: "user" | "organization" | "project" | "wallet" | "pool" | "integration";
  x: number;
  y: number;
  connected: boolean;
}

export const MASTER_GRAPH_NODES: MasterGraphNode[] = [
  { id: "user", label: "User", type: "user", x: 50, y: 50, connected: true },
  { id: "org-1", label: "Organization", type: "organization", x: 75, y: 25, connected: false },
  { id: "project-1", label: "Project: DWS Pipeline", type: "project", x: 80, y: 60, connected: false },
  { id: "antpay", label: "ANTPAY Wallet", type: "wallet", x: 25, y: 25, connected: false },
  { id: "pool-1", label: "Ubuntu Pool", type: "pool", x: 20, y: 70, connected: false },
  { id: "integration-discord", label: "Discord", type: "integration", x: 50, y: 85, connected: false },
];

// ─── Onboarding "Howzit" Message ───
export const HOWZIT_MESSAGE = "Howzit! This is your Home Base. All your settings, wallet, and saved projects live here. If you are just browsing, it will look empty. Click [Enter Studio] to start building right now!";
