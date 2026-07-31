/**
 * VVU Capability Registry
 *
 * Maps user goals ("I want to…") to products. This is the foundation for
 * the capability-driven UX — users interact with outcomes, not product names.
 *
 * Each capability represents a user goal, not a product.
 * Each product manifests as a set of capabilities.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in a progressive-trust onboarding journey. */
export interface TrustJourneyStep {
  id: string;
  type: "discover" | "learn" | "interactive" | "reveal" | "license";
  title: string;
  description: string;
  /** Human-readable duration hint, e.g. "30 seconds", "2 minutes" */
  duration: string;
  optional: boolean;
  /** Optional knowledge check — only present on "learn" steps */
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

/** A capability represents a user goal, not a product. */
export interface Capability {
  id: string;
  /** User-facing label — e.g. "Verify Authenticity" not "ProofBridge" */
  label: string;
  description: string;
  /** Lucide icon name (string) — resolved at render time */
  icon: string;
  /** Product IDs that provide this capability */
  products: string[];
  /** Minimum trust tier required to access this capability */
  trustTier: "browse" | "verified" | "financial" | "web3";
  /** Progressive trust onboarding steps */
  trustJourney: TrustJourneyStep[];
  /** Minimum edition required */
  edition: "community" | "professional" | "enterprise";
}

/** A product manifest — what a product IS and what it CAN do. */
export interface ProductManifest {
  id: string;
  label: string;
  tagline: string;
  /** Lucide icon name */
  icon: string;
  /** Brand accent colour (hex) */
  color: string;
  /** Capability IDs this product provides */
  capabilities: string[];
  /** Lazy-loaded component path for the workspace panel */
  workspaceComponent: string;
  /** Keyboard shortcuts exposed by this product */
  shortcuts: { key: string; label: string }[];
}

// ---------------------------------------------------------------------------
// Capability Definitions
// ---------------------------------------------------------------------------

export const CAPABILITIES: Capability[] = [
  {
    id: "verify-authenticity",
    label: "Verify Authenticity",
    description:
      "Issue and verify Ed25519-signed receipts anchored into the MMR. Prove that a contribution, transaction, or identity claim is authentic — without revealing the underlying data.",
    icon: "ShieldCheck",
    products: ["proofbridge", "sphere"],
    trustTier: "verified",
    edition: "community",
    trustJourney: [
      {
        id: "va-discover",
        type: "discover",
        title: "What is Verification?",
        description:
          "Learn how VVU uses cryptographic receipts to prove authenticity without revealing private data.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "va-learn",
        type: "learn",
        title: "How Receipts Work",
        description:
          "Understand the flow: Identity → Contribution → Receipt → Hash → ZK Proof → Trust.",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What anchors a receipt into the MMR?",
          options: [
            "A SHA-256 hash of the receipt payload",
            "An Ed25519 signature + Merkle Mountain Range append",
            "A plain-text log entry",
            "A JWT token stored in a database",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "va-interactive",
        type: "interactive",
        title: "Issue a Test Receipt",
        description:
          "Walk through issuing a sample receipt and watch it appear in the Trust Sphere.",
        duration: "1 minute",
        optional: true,
      },
      {
        id: "va-reveal",
        type: "reveal",
        title: "Your Verification Dashboard",
        description:
          "Unlock the full ProofBridge dashboard with live telemetry and ZK-proof artifact management.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "detect-water-loss",
    label: "Detect Water Loss",
    description:
      "Run Hydro Bayesian Kernel (HBK) inference to detect anomalies in water distribution networks. Reproducible MCMC derivation logs signed with Ed25519. Brier Score > 0.02 triggers a TRIP verdict.",
    icon: "Droplets",
    products: ["hbk"],
    trustTier: "verified",
    edition: "professional",
    trustJourney: [
      {
        id: "dwl-discover",
        type: "discover",
        title: "Why Water Loss Detection?",
        description:
          "Cape Town loses ~30% of treated water to leaks. HBK uses Bayesian inference to detect anomalies before they become failures.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "dwl-learn",
        type: "learn",
        title: "How MCMC Inference Works",
        description:
          "Understand how Markov Chain Monte Carlo sampling produces calibrated probability estimates for water loss events.",
        duration: "3 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What happens when the Brier Score exceeds 0.02?",
          options: [
            "A new MCMC chain is started",
            "A TRIP verdict is triggered (HF-005)",
            "The system shuts down",
            "An email notification is sent",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "dwl-interactive",
        type: "interactive",
        title: "Run a Sample Detection",
        description:
          "Use sample sensor data to run a water loss detection and see the HBK output.",
        duration: "2 minutes",
        optional: true,
      },
      {
        id: "dwl-reveal",
        type: "reveal",
        title: "HBK Dashboard Unlocked",
        description:
          "Full access to derivation logs, Brier scores, and TRIP verdict history.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "manage-community-pools",
    label: "Manage Community Pools",
    description:
      "Participate in stokvel-style savings circles where every contribution is recorded honestly, every payout is verifiable, and no one can quietly take more than they're owed. Ubuntu Score tracks network health.",
    icon: "Users",
    products: ["ubuntu-pools"],
    trustTier: "financial",
    edition: "community",
    trustJourney: [
      {
        id: "mcp-discover",
        type: "discover",
        title: "What is Ubuntu Pools?",
        description:
          "A digital stokvel — a community savings circle — powered by cryptographic proof and the Ubuntu Score.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "mcp-learn",
        type: "learn",
        title: "How Stokvel Proofs Work",
        description:
          "Every contribution is receipted through ProofBridge, every payout is verified, and the Ubuntu Score measures collective trust velocity.",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What does the Ubuntu Score measure?",
          options: [
            "Total money saved",
            "Network trust velocity — how reliably members honour commitments",
            "The number of pools in the system",
            "The interest rate of the pool",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "mcp-interactive",
        type: "interactive",
        title: "Join a Sample Pool",
        description:
          "Explore a simulated pool to see how contributions, payouts, and proofs work together.",
        duration: "2 minutes",
        optional: true,
      },
      {
        id: "mcp-license",
        type: "license",
        title: "Financial Verification Required",
        description:
          "To manage real community pools, you need to complete KYC verification via Stitch (SA Banks) or Stripe (International).",
        duration: "5 minutes",
        optional: false,
      },
    ],
  },
  {
    id: "run-inference",
    label: "Run Inference",
    description:
      "Execute Bayesian inference pipelines with reproducible derivation logs. HBK provides the MCMC engine, Epistemic Runtime provides the DAG control plane and invariant enforcement.",
    icon: "BrainCircuit",
    products: ["hbk", "epistemic"],
    trustTier: "verified",
    edition: "professional",
    trustJourney: [
      {
        id: "ri-discover",
        type: "discover",
        title: "What is VVU Inference?",
        description:
          "Run calibrated Bayesian inference with full derivation provenance. Every step is signed, every result is reproducible.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "ri-learn",
        type: "learn",
        title: "The Inference Pipeline",
        description:
          "Understand how HBK's MCMC engine integrates with Epistemic Runtime's DAG control plane for invariant-enforced inference.",
        duration: "3 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What role does the Epistemic Runtime play in inference?",
          options: [
            "It runs the MCMC sampler",
            "It enforces invariants and manages the DAG control plane",
            "It stores the results in a database",
            "It sends email notifications",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "ri-interactive",
        type: "interactive",
        title: "Run a Sample Inference",
        description:
          "Execute a sample inference pipeline and explore the derivation log.",
        duration: "3 minutes",
        optional: true,
      },
      {
        id: "ri-reveal",
        type: "reveal",
        title: "Inference Pipeline Unlocked",
        description:
          "Full access to HBK and Epistemic Runtime inference features.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "trace-provenance",
    label: "Trace Provenance",
    description:
      "Follow the full provenance chain from observation to ZK-proof artifact. ProofBridge anchors receipts, Epistemic Runtime provides MMR ancestry proofs and DAG lineage.",
    icon: "GitBranch",
    products: ["proofbridge", "epistemic"],
    trustTier: "verified",
    edition: "professional",
    trustJourney: [
      {
        id: "tp-discover",
        type: "discover",
        title: "What is Provenance?",
        description:
          "Every data point in VVU has a complete lineage — from observation to proof. Trace it end-to-end.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "tp-learn",
        type: "learn",
        title: "The Provenance Chain",
        description:
          "Understand how MMR ancestry proofs and DAG lineage create an unbreakable chain of evidence.",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What provides MMR ancestry proofs?",
          options: [
            "ProofBridge",
            "Epistemic Runtime",
            "HBK",
            "AIR Runtime",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "tp-interactive",
        type: "interactive",
        title: "Trace a Sample Receipt",
        description:
          "Follow a receipt from issuance to ZK-proof artifact through the full provenance chain.",
        duration: "2 minutes",
        optional: true,
      },
      {
        id: "tp-reveal",
        type: "reveal",
        title: "Provenance Explorer Unlocked",
        description:
          "Full access to the provenance tracing interface with DAG visualisation.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "monitor-circuit-health",
    label: "Monitor Circuit Health",
    description:
      "Monitor the Agentic Inference Runtime's Circuit Breaker state machine. Track NATS queue depth, HLC merge status, and Hard-Failure gates in real-time.",
    icon: "Activity",
    products: ["air-runtime"],
    trustTier: "browse",
    edition: "community",
    trustJourney: [
      {
        id: "mch-discover",
        type: "discover",
        title: "What is Circuit Health?",
        description:
          "The Circuit Breaker is VVU's self-protection mechanism. Monitor its state to understand system resilience.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "mch-learn",
        type: "learn",
        title: "Circuit Breaker States",
        description:
          "Understand the NORMAL → DEGRADED → FAIL-CLOSED state machine and how it protects the system from cascading failures.",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What is the FAIL-CLOSED state?",
          options: [
            "The system is running normally",
            "The system has detected a hard failure and stopped processing to prevent corruption",
            "The system is performing maintenance",
            "The system is loading a new configuration",
          ],
          correctIndex: 1,
        },
      },
      {
        id: "mch-interactive",
        type: "interactive",
        title: "Watch Live Metrics",
        description:
          "Observe the Circuit Breaker state machine, NATS queue, and HLC merge in real-time.",
        duration: "1 minute",
        optional: true,
      },
      {
        id: "mch-reveal",
        type: "reveal",
        title: "AIR Runtime Dashboard Unlocked",
        description:
          "Full access to the AIR Runtime monitoring dashboard with alerting configuration.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "simulate-scenarios",
    label: "Simulate Scenarios",
    description:
      "Run full 72-hour VVU-VAL-001 validation loops with HBK digital twin prototype. Real-time Git Actions log. Cape Town water network simulation. Production-grade, explicitly honest.",
    icon: "FlaskConical",
    products: ["simulation"],
    trustTier: "verified",
    edition: "professional",
    trustJourney: [
      {
        id: "ss-discover",
        type: "discover",
        title: "What is VVU Simulation?",
        description:
          "Run production-grade simulations of the entire VVU validation loop with real-time metrics and Git Actions logging.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "ss-learn",
        type: "learn",
        title: "The 7-Phase Validation Lifecycle",
        description:
          "Understand the 7-phase validation lifecycle from P1 (initialisation) through P7 (final validation report).",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What is the minimum Validation Index for PASS?",
          options: [
            "50.0",
            "75.0",
            "90.0",
            "100.0",
          ],
          correctIndex: 2,
        },
      },
      {
        id: "ss-interactive",
        type: "interactive",
        title: "Run a Sample Simulation",
        description:
          "Launch a short simulation run and observe the real-time metrics dashboard.",
        duration: "3 minutes",
        optional: true,
      },
      {
        id: "ss-reveal",
        type: "reveal",
        title: "Simulation Dashboard Unlocked",
        description:
          "Full access to the 72h Simulation dashboard with all phases and validation metrics.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
  {
    id: "explore-trust-network",
    label: "Explore Trust Network",
    description:
      "Visualise the living verification state space. See identity → contribution → receipt → hash → ZK proof → trust transitions in real-time. Global and personal views.",
    icon: "Share2",
    products: ["sphere"],
    trustTier: "browse",
    edition: "community",
    trustJourney: [
      {
        id: "etn-discover",
        type: "discover",
        title: "What is the Trust Network?",
        description:
          "The Trust Sphere is a living verification state space — a visualisation of the entire trust network.",
        duration: "30 seconds",
        optional: false,
      },
      {
        id: "etn-learn",
        type: "learn",
        title: "Node States & Transitions",
        description:
          "Understand the Fibonacci sphere layout and the 7 node states: Unknown → Identity Verified → Contribution Verified → Receipt Generated → Hash Linked → ZK Proof Generated → Trust Increased.",
        duration: "2 minutes",
        optional: false,
        knowledgeCheck: {
          question: "What is the final node state in the trust progression?",
          options: [
            "Receipt Generated",
            "Hash Linked",
            "ZK Proof Generated",
            "Trust Increased",
          ],
          correctIndex: 3,
        },
      },
      {
        id: "etn-interactive",
        type: "interactive",
        title: "Explore the Sphere",
        description:
          "Switch between Global View and Personal View. Hover over nodes to see their state.",
        duration: "1 minute",
        optional: true,
      },
      {
        id: "etn-reveal",
        type: "reveal",
        title: "Trust Sphere Unlocked",
        description:
          "Full access to the Trust Sphere with live metrics and circuit breaker status.",
        duration: "Instant",
        optional: false,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Product Manifests
// ---------------------------------------------------------------------------

export const PRODUCT_MANIFESTS: ProductManifest[] = [
  {
    id: "sphere",
    label: "Trust Sphere",
    tagline: "Verification state space · Fibonacci sphere",
    icon: "Boxes",
    color: "#C9A84C",
    capabilities: ["explore-trust-network", "verify-authenticity"],
    workspaceComponent: "@/components/vvu/trust-sphere",
    shortcuts: [
      { key: "G", label: "Global View" },
      { key: "P", label: "Personal View" },
      { key: "Esc", label: "Back to Sphere" },
    ],
  },
  {
    id: "epistemic",
    label: "Epistemic Runtime",
    tagline: "DAG · CRDT · ZK-merge · v0.8",
    icon: "ShieldCheck",
    color: "#b23dff",
    capabilities: ["run-inference", "trace-provenance"],
    workspaceComponent: "@/components/vvu/epistemic-runtime-dashboard",
    shortcuts: [
      { key: "1-8", label: "Jump to essential section" },
      { key: "←/→", label: "Prev / next essential" },
      { key: "F8", label: "Toggle notifications" },
    ],
  },
  {
    id: "proofbridge",
    label: "ProofBridge",
    tagline: "Receipt → Hash → ZK Proof",
    icon: "FileCheck2",
    color: "#3dffb0",
    capabilities: ["verify-authenticity", "trace-provenance"],
    workspaceComponent: "@/components/vvu/product-stub",
    shortcuts: [
      { key: "N", label: "New receipt" },
      { key: "V", label: "Verify receipt" },
      { key: "E", label: "Export ZK proof" },
    ],
  },
  {
    id: "air-runtime",
    label: "AIR Runtime",
    tagline: "Circuit Breaker · NATS · HLC merge",
    icon: "Workflow",
    color: "#CC7722",
    capabilities: ["monitor-circuit-health"],
    workspaceComponent: "@/components/vvu/product-stub",
    shortcuts: [
      { key: "D", label: "Dashboard" },
      { key: "Q", label: "Queue monitor" },
      { key: "L", label: "HLC log" },
    ],
  },
  {
    id: "ubuntu-pools",
    label: "Ubuntu Pools",
    tagline: "Stokvel · Stitch · ProofBridge · Ubuntu Score",
    icon: "Droplets",
    color: "#3D5A47",
    capabilities: ["manage-community-pools"],
    workspaceComponent: "@/components/vvu/ubuntu-pools",
    shortcuts: [
      { key: "N", label: "New pool" },
      { key: "C", label: "Contribute" },
      { key: "S", label: "Ubuntu Score" },
    ],
  },
  {
    id: "hbk",
    label: "HBK",
    tagline: "MCMC · Brier ≤ 0.02 · Ed25519 derivation",
    icon: "BrainCircuit",
    color: "#ff2e5f",
    capabilities: ["detect-water-loss", "run-inference"],
    workspaceComponent: "@/components/vvu/product-stub",
    shortcuts: [
      { key: "R", label: "Run derivation" },
      { key: "B", label: "Brier score" },
      { key: "T", label: "TRIP verdicts" },
    ],
  },
  {
    id: "simulation",
    label: "72h Simulation",
    tagline: "HBK Twin · Git Actions · Real-Time Metrics",
    icon: "Activity",
    color: "#10b981",
    capabilities: ["simulate-scenarios"],
    workspaceComponent: "@/components/simulation/simulation-dashboard",
    shortcuts: [
      { key: "Space", label: "Start / pause" },
      { key: "P", label: "Phase selector" },
      { key: "V", label: "Validation index" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup Maps
// ---------------------------------------------------------------------------

/** Capability lookup by ID */
export const CAPABILITY_MAP: Record<string, Capability> = CAPABILITIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, Capability>,
);

/** Product manifest lookup by ID */
export const PRODUCT_MANIFEST_MAP: Record<string, ProductManifest> =
  PRODUCT_MANIFESTS.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, ProductManifest>);

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Get all capabilities provided by a product.
 */
export function getCapabilitiesForProduct(productId: string): Capability[] {
  return CAPABILITIES.filter((c) => c.products.includes(productId));
}

/**
 * Get all products that provide a capability.
 */
export function getProductsForCapability(capabilityId: string): ProductManifest[] {
  const cap = CAPABILITY_MAP[capabilityId];
  if (!cap) return [];
  return cap.products
    .map((pid) => PRODUCT_MANIFEST_MAP[pid])
    .filter(Boolean);
}

/**
 * Get capabilities filtered by trust tier.
 * Returns capabilities that require the given tier OR a lower tier.
 */
export function getCapabilitiesForTier(
  tier: "browse" | "verified" | "financial" | "web3",
): Capability[] {
  const tierOrder: Record<string, number> = {
    browse: 0,
    verified: 1,
    financial: 2,
    web3: 3,
  };
  const userLevel = tierOrder[tier];
  return CAPABILITIES.filter(
    (c) => tierOrder[c.trustTier] <= userLevel,
  );
}

/**
 * Get capabilities filtered by edition.
 * Returns capabilities available at the given edition OR a lower edition.
 */
export function getCapabilitiesForEdition(
  edition: "community" | "professional" | "enterprise",
): Capability[] {
  const editionOrder: Record<string, number> = {
    community: 0,
    professional: 1,
    enterprise: 2,
  };
  const userLevel = editionOrder[edition];
  return CAPABILITIES.filter(
    (c) => editionOrder[c.edition] <= userLevel,
  );
}

/**
 * Search capabilities by keyword. Matches against label, description, and product names.
 */
export function searchCapabilities(query: string): Capability[] {
  const q = query.toLowerCase().trim();
  if (!q) return CAPABILITIES;
  return CAPABILITIES.filter((c) => {
    const haystack = [
      c.label,
      c.description,
      ...c.products.map((p) => PRODUCT_MANIFEST_MAP[p]?.label ?? p),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
