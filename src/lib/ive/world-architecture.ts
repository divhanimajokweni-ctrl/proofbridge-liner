// VRES v1.0 — World/Room/Activity architecture data.
// This is the structural map for the spatial migration.
// Existing tab components are reused as Activities — their internals are NOT changed.

export type RoomId = "build" | "study" | "finance" | "game" | "data" | "vault";

export interface RoomDef {
  id: RoomId;
  name: string;
  icon: string;
  description: string;
  activities: ActivityDef[];
  guestAccessible: boolean;
}

export interface ActivityDef {
  id: string;
  name: string;
  icon: string;
  /** The existing tab component to mount as this Activity's viewport content */
  sourceTab: string;
  /** Whether this activity owns the full viewport (true) or is a panel (false) */
  fullscreen?: boolean;
  /** Status of this activity — what exists vs what's missing */
  status: "exists" | "partial" | "missing";
  statusNote?: string;
}

export const ROOMS: RoomDef[] = [
  {
    id: "build",
    name: "Build Room",
    icon: "🏗️",
    description: "HBK MKII, Villa Ravine, Exploded Hardware, Ingestion, 3D Mechanics",
    guestAccessible: false,
    activities: [
      {
        id: "hbk-mkii",
        name: "HBK MKII",
        icon: "🔧",
        sourceTab: "hbk",
        fullscreen: true,
        status: "partial",
        statusNote: "2D charts exist (Fourier viz, perf table). 3D viewport with 13+ parts does NOT exist in React — requires new three.js implementation.",
      },
      {
        id: "villa-ravine",
        name: "Villa Ravine",
        icon: "🏔️",
        sourceTab: "",
        fullscreen: true,
        status: "missing",
        statusNote: "Does not exist anywhere. Requires procedural geometry + 11 cameras + day/night + section + floor plan + DWG input.",
      },
      {
        id: "exploded-hardware",
        name: "Exploded Hardware",
        icon: "💥",
        sourceTab: "",
        fullscreen: true,
        status: "missing",
        statusNote: "Does not exist. Requires layered geometry + compute die + explode + section + data path + auto orbit + annotations + photo alignment.",
      },
      {
        id: "ingestion",
        name: "Ingestion",
        icon: "📥",
        sourceTab: "aerospace",
        fullscreen: false,
        status: "partial",
        statusNote: "DRC table + terminal exist inside vvu-aerospace.html iframe, not in React. Needs extraction.",
      },
      {
        id: "3d-mechanics",
        name: "3D Mechanics",
        icon: "⚙️",
        sourceTab: "aerospace",
        fullscreen: true,
        status: "partial",
        statusNote: "4-body three.js scene exists inside vvu-aerospace.html iframe (explode/yaw/pitch/zoom). Needs React three.js component.",
      },
      {
        id: "drone-simulator",
        name: "Drone Simulator",
        icon: "🚁",
        sourceTab: "drone",
        fullscreen: true,
        status: "exists",
        statusNote: "3D drone simulator with rigid body 6DoF physics, thrust vector rotation, gravity, drag, PID-style controls, smooth camera tracking, pillar collision detection + crash reset. Served from /public/vvu-drone-simulator.html.",
      },
    ],
  },
  {
    id: "study",
    name: "Study Room",
    icon: "📚",
    description: "Lesson Stepper, Residual Trunk, HBK Docs",
    guestAccessible: true,
    activities: [
      {
        id: "lesson-stepper",
        name: "Lesson Stepper",
        icon: "📖",
        sourceTab: "searm",
        fullscreen: false,
        status: "exists",
        statusNote: "SEARM iframe has Play/Pause/Step/Reset controls. Reusable.",
      },
      {
        id: "residual-trunk",
        name: "Interactive Diagram",
        icon: "📊",
        sourceTab: "hbk",
        fullscreen: false,
        status: "exists",
        statusNote: "HBK tab has Fourier basis SVG visualization. Reusable.",
      },
      {
        id: "hbk-docs",
        name: "HBK MKII Docs",
        icon: "📄",
        sourceTab: "",
        fullscreen: false,
        status: "missing",
        statusNote: "Does not exist. Requires manuals, theorems, L0 hash documentation.",
      },
      {
        id: "facilitator",
        name: "Facilitator Agent",
        icon: "🤖",
        sourceTab: "facilitator",
        fullscreen: false,
        status: "exists",
        statusNote: "LLM-powered chat. Reusable as-is.",
      },
    ],
  },
  {
    id: "finance",
    name: "Finance Room",
    icon: "💰",
    description: "Ubuntu Pools, Pool Ledger, NMBM Budget Sandbox",
    guestAccessible: false,
    activities: [
      {
        id: "ubuntu-pool",
        name: "Ubuntu Pool",
        icon: "🤝",
        sourceTab: "pools",
        fullscreen: false,
        status: "exists",
        statusNote: "Stokvel + ProofBridge receipts. Reusable.",
      },
      {
        id: "pool-ledger",
        name: "Pool Ledger",
        icon: "📒",
        sourceTab: "pools",
        fullscreen: false,
        status: "exists",
        statusNote: "Receipt list inside pools tab. Reusable.",
      },
      {
        id: "antpay",
        name: "ANTPAY Billing",
        icon: "💳",
        sourceTab: "antpay",
        fullscreen: false,
        status: "exists",
        statusNote: "ZAR pricing table + wallet flow. Reusable.",
      },
      {
        id: "nmbm-budget",
        name: "NMBM Budget Sandbox",
        icon: "🏛️",
        sourceTab: "",
        fullscreen: false,
        status: "missing",
        statusNote: "Does not exist. Requires budget allocation simulation for Nelson Mandela Bay Municipality.",
      },
    ],
  },
  {
    id: "game",
    name: "Game Room",
    icon: "🎮",
    description: "Gaming Hub — full-screen interactive demonstrations",
    guestAccessible: true,
    activities: [
      {
        id: "accretion-sandbox",
        name: "Accretion Sandbox",
        icon: "🕳️",
        sourceTab: "sandbox",
        fullscreen: true,
        status: "exists",
        statusNote: "5 modes: Build-Layer, Classic Arena, Logic Tiles, Stickman, Marketplace. Reusable.",
      },
    ],
  },
  {
    id: "data",
    name: "Data Room",
    icon: "📊",
    description: "NMBM Data Sandbox, Water, Electricity, Housing, Evidence Pipeline",
    guestAccessible: false,
    activities: [
      {
        id: "air-runtime",
        name: "AIR Runtime",
        icon: "⚡",
        sourceTab: "air",
        fullscreen: false,
        status: "exists",
        statusNote: "Live event stream + evidence decay tracker. Reusable.",
      },
      {
        id: "self-service-canvas",
        name: "Self-Service Canvas",
        icon: "🖌️",
        sourceTab: "canvas",
        fullscreen: false,
        status: "exists",
        statusNote: "Plugin dashboard + bridge state machine. Reusable.",
      },
      {
        id: "field-evidence",
        name: "Field Evidence",
        icon: "📷",
        sourceTab: "field",
        fullscreen: false,
        status: "exists",
        statusNote: "Construction photos + vision pass. Reusable.",
      },
      {
        id: "evidence-analysis",
        name: "EIS v1.0 Evidence Analysis",
        icon: "🔍",
        sourceTab: "evidence-analysis",
        fullscreen: true,
        status: "exists",
        statusNote: "EIS v1.0 engine with DMA calibration panel, evidence provenance chain, verdict banner, and SHA-256 audit receipt export. Prevents evidence inflation by scoring independence, not count.",
      },
      {
        id: "nmbm-data",
        name: "NMBM Data Sandbox",
        icon: "🏘️",
        sourceTab: "",
        fullscreen: false,
        status: "missing",
        statusNote: "Does not exist. Requires water/electricity/housing/budget datasets labelled as PLACEHOLDER / SIMULATION DATA.",
      },
    ],
  },
  {
    id: "vault",
    name: "Vault Room",
    icon: "🔐",
    description: "Mint / Export / Vault",
    guestAccessible: false,
    activities: [
      {
        id: "crypto-governance",
        name: "Cryptographic & Governance",
        icon: "🔏",
        sourceTab: "crypto",
        fullscreen: false,
        status: "exists",
        statusNote: "zipenc AES-256 pipeline + governance artifacts. Reusable.",
      },
      {
        id: "dev-sdk",
        name: "Dev SDK",
        icon: "📦",
        sourceTab: "devsdk",
        fullscreen: false,
        status: "exists",
        statusNote: "Mod upload form + store API. Reusable.",
      },
      {
        id: "integrations",
        name: "Integrations",
        icon: "🔌",
        sourceTab: "integrations",
        fullscreen: false,
        status: "exists",
        statusNote: "Connection graph + organization groups. Reusable.",
      },
    ],
  },
];

// Map tab IDs to room+activity for quick lookup
export const TAB_TO_ROOM: Record<string, { room: RoomId; activity: string }> = {
  hbk: { room: "build", activity: "hbk-mkii" },
  aerospace: { room: "build", activity: "3d-mechanics" },
  integration: { room: "build", activity: "ingestion" },
  studio: { room: "build", activity: "hbk-mkii" },
  facilitator: { room: "study", activity: "facilitator" },
  searm: { room: "study", activity: "lesson-stepper" },
  antpay: { room: "finance", activity: "antpay" },
  pools: { room: "finance", activity: "ubuntu-pool" },
  sandbox: { room: "game", activity: "accretion-sandbox" },
  air: { room: "data", activity: "air-runtime" },
  canvas: { room: "data", activity: "self-service-canvas" },
  field: { room: "data", activity: "field-evidence" },
  crypto: { room: "vault", activity: "crypto-governance" },
  devsdk: { room: "vault", activity: "dev-sdk" },
  integrations: { room: "vault", activity: "integrations" },
  overview: { room: "build", activity: "hbk-mkii" }, // overview stays as World landing
};
