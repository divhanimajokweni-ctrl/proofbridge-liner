/**
 * VVU Three-Root Architecture
 *
 * The architecture is organized around three independent roots:
 * - History Root: Immutable event ledger ("What objectively happened?")
 * - Semantic Root: Versioned execution environments ("How history is interpreted")
 * - Trust Root: Certificate & attestation management ("Who is currently authorized?")
 *
 * Each root owns exactly one concern. History never imports Trust.
 * Trust never imports Replay. Semantics never knows certificates exist.
 *
 * The compiler itself enforces the architecture.
 */

// ---------------------------------------------------------------------------
// History Root — Immutable Event Ledger
// ---------------------------------------------------------------------------

/** Epistemic maturity stages — how work moves through the platform */
export type EpistemicMaturity =
  | "unknown"
  | "observed"
  | "investigated"
  | "verified"
  | "attested"
  | "operational"
  | "institutional-memory";

export const MATURITY_STAGES: EpistemicMaturity[] = [
  "unknown",
  "observed",
  "investigated",
  "verified",
  "attested",
  "operational",
  "institutional-memory",
];

export const MATURITY_LABELS: Record<EpistemicMaturity, string> = {
  unknown: "Unknown",
  observed: "Observed",
  investigated: "Investigated",
  verified: "Verified",
  attested: "Attested",
  operational: "Operational",
  "institutional-memory": "Institutional Memory",
};

export const MATURITY_DESCRIPTIONS: Record<EpistemicMaturity, string> = {
  unknown: "No evidence collected yet. A hypothesis exists but has not been tested.",
  observed: "Raw data has been collected. Sensors, telemetry, or inputs have been captured.",
  investigated: "Engineers have explored, branched, simulated, and produced competing hypotheses.",
  verified: "Replay has succeeded. The evidence is reproducible and deterministic.",
  attested: "An authorized party has signed the evidence. The claim is backed by trust.",
  operational: "The verified decision is being acted upon. Operations reference this as established truth.",
  "institutional-memory": "The work has been archived as reusable organizational knowledge with full provenance.",
};

export const MATURITY_COLORS: Record<EpistemicMaturity, string> = {
  unknown: "#4a4d5a",
  observed: "#3d6bff",
  investigated: "#3dd6ff",
  verified: "#3dffb0",
  attested: "#C9A84C",
  operational: "#CC7722",
  "institutional-memory": "#8A9A5B",
};

export const MATURITY_TAILWIND: Record<EpistemicMaturity, string> = {
  unknown: "text-gray-500",
  observed: "text-blue-400",
  investigated: "text-cyan-400",
  verified: "text-emerald-400",
  attested: "text-amber-400",
  operational: "text-orange-400",
  "institutional-memory": "text-[#8A9A5B]",
};

export function getMaturityIndex(stage: EpistemicMaturity): number {
  return MATURITY_STAGES.indexOf(stage);
}

export function getMaturityProgress(stage: EpistemicMaturity): number {
  const idx = getMaturityIndex(stage);
  return idx / (MATURITY_STAGES.length - 1);
}

/** An engineering event in the immutable ledger */
export interface EngineeringEvent {
  id: string;
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
  previousHash: string;
  eventHash: string;
  /** The epistemic maturity of this event at creation time */
  maturity: EpistemicMaturity;
  /** The workspace this event belongs to */
  workspaceId: string;
  /** The capability that produced this event */
  capabilityId?: string;
}

// ---------------------------------------------------------------------------
// Semantic Root — Versioned Execution Environments
// ---------------------------------------------------------------------------

/** Lifecycle state of an environment */
export type LifecycleState = "ACTIVE" | "SUPERSEDED" | "RETIRED";

/** Integrity state of an environment */
export type IntegrityState = "SOUND" | "DEFECTIVE";

/** A versioned execution environment descriptor */
export interface EnvironmentDescriptor {
  id: string;
  solverHash: string;
  ontologyHash: string;
  policyHash: string;
  canonicalizationHash: string;
  runtimeHash: string;
  lifecycle: LifecycleState;
  integrity: IntegrityState;
  createdAt: string;
  supersededAt?: string;
}

/** A semantic integrity event — records interpreter defects without rewriting history */
export interface SemanticIntegrityEvent {
  id: string;
  environmentId: string;
  defect: string;
  classification: string;
  discoveryEvidence: string;
  remediationStrategy: string;
  affectedBlockRange: { start: number; end: number };
  replacementEnvironmentId?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Trust Root — Certificate & Attestation Management
// ---------------------------------------------------------------------------

/** Environment approval — immutable, never changes */
export interface EnvironmentApproval {
  id: string;
  environmentId: string;
  approvedBy: string;
  approvedAt: string;
  conditions: string[];
}

/** Attestation certificate — can rotate, expire, migrate independently */
export interface AttestationCertificate {
  id: string;
  environmentId: string;
  certificateType: string;
  issuer: string;
  subject: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  serialNumber: string;
}

// ---------------------------------------------------------------------------
// Workspace Contexts — Universal Operating Environment
// ---------------------------------------------------------------------------

/**
 * The workspace context determines what the environment surfaces.
 *
 * The same shell serves everyone. An eight-year-old, a student, a founder,
 * a grandmother, a municipal engineer, and a regulator all enter through the
 * same shell. They don't see different products — they see different
 * workspaces assembled inside the same environment.
 *
 * The architecture underneath (Three Roots, Trust Maturation) stays identical.
 * A recipe, a homework assignment, and an engineering investigation all
 * follow the same maturity journey. Only the content changes.
 */
export type WorkspaceContext =
  | "learning"      // Students, curious kids, self-improvement
  | "creative"      // Artists, photographers, writers, musicians
  | "personal"      // Family, recipes, health, documents
  | "business"      // Entrepreneurs, small businesses, startups
  | "community"     // Community leaders, NGOs, food programs
  | "engineering"   // Engineers, researchers, investigators
  | "review"        // Reviewers, auditors, quality assurance
  | "operations"    // Operators, dispatchers, managers
  | "compliance"    // Compliance officers, regulators, auditors
  | "executive";    // Executives, leaders, decision-makers

export const WORKSPACE_CONTEXTS: Record<WorkspaceContext, {
  label: string;
  description: string;
  icon: string;
  color: string;
  maturityRange: [EpistemicMaturity, EpistemicMaturity];
  /** Example personas who use this context */
  personas: string[];
  /** What the left dock shows */
  leftDock: string[];
  /** What the right dock shows */
  rightDock: string[];
  /** What the bottom dock shows */
  bottomDock: string[];
}> = {
  learning: {
    label: "Learning",
    description: "Where knowledge grows. Study, practice, ask questions, and build understanding that lasts.",
    icon: "GraduationCap",
    color: "#3dd6ff",
    maturityRange: ["unknown", "investigated"],
    personas: ["Student", "Curious Kid", "Self-learner"],
    leftDock: ["Notebook", "Lessons", "Questions", "History"],
    rightDock: ["Ask AI", "Confidence", "Suggested Topics", "Study Plan"],
    bottomDock: ["Progress", "Streak", "Next Review"],
  },
  creative: {
    label: "Creative",
    description: "Where ideas take shape. Create, explore, iterate, and build a portfolio that grows with you.",
    icon: "Palette",
    color: "#b23dff",
    maturityRange: ["unknown", "investigated"],
    personas: ["Artist", "Photographer", "Writer", "Musician"],
    leftDock: ["Portfolio", "Sketches", "Ideas", "Timeline"],
    rightDock: ["AI Mentor", "Critique", "Inspiration", "Mood Board"],
    bottomDock: ["Achievements", "Works", "Progress"],
  },
  personal: {
    label: "Personal",
    description: "Your life, organized. Recipes, documents, health, family — everything connected, nothing lost.",
    icon: "Home",
    color: "#C9A84C",
    maturityRange: ["unknown", "operational"],
    personas: ["Granny", "Grandpa", "Family", "Anyone"],
    leftDock: ["Documents", "Recipes", "Health", "Calendar"],
    rightDock: ["Family", "Reminders", "Favorites", "History"],
    bottomDock: ["Appointments", "Medications", "Upcoming"],
  },
  business: {
    label: "Business",
    description: "From idea to company. Research, validate, build, and grow — every step preserved and connected.",
    icon: "Rocket",
    color: "#CC7722",
    maturityRange: ["unknown", "operational"],
    personas: ["Entrepreneur", "Small Business", "Startup"],
    leftDock: ["Research", "Competitors", "Costs", "Market"],
    rightDock: ["Mentors", "Validation", "Investors", "Questions"],
    bottomDock: ["Budget", "Milestones", "Risk Score"],
  },
  community: {
    label: "Community",
    description: "Coordinated action. Projects, volunteers, resources — everything connected, every decision explained.",
    icon: "Users",
    color: "#8A9A5B",
    maturityRange: ["observed", "operational"],
    personas: ["Community Leader", "NGO", "Food Programme"],
    leftDock: ["Projects", "Volunteers", "Funding", "Resources"],
    rightDock: ["Deliveries", "Budget", "Impact", "Reports"],
    bottomDock: ["Active Projects", "Urgent", "Health"],
  },
  engineering: {
    label: "Engineering",
    description: "Where truth is discovered. Explore, branch, test, and collaborate without risking operational systems.",
    icon: "FlaskConical",
    color: "#3dd6ff",
    maturityRange: ["unknown", "investigated"],
    personas: ["Engineer", "Researcher", "Investigator"],
    leftDock: ["Simulations", "Evidence", "Experiments", "History"],
    rightDock: ["Posterior Confidence", "Branch Status", "Suggested Tests", "Running Agents"],
    bottomDock: ["Replay Status", "Agents Active", "Branches"],
  },
  review: {
    label: "Review",
    description: "Evidence completeness, replayability, confidence history. The system encourages certainty over creativity.",
    icon: "Eye",
    color: "#3dffb0",
    maturityRange: ["investigated", "verified"],
    personas: ["Reviewer", "Auditor", "Quality Assurance"],
    leftDock: ["Evidence Completeness", "Replayability", "Confidence History"],
    rightDock: ["Independent Review", "Missing Artifacts", "Required Approvals"],
    bottomDock: ["Review Status", "Reviewers", "Pending"],
  },
  operations: {
    label: "Operations",
    description: "Verified state only. Dispatch, escalate, and act on established decisions.",
    icon: "Activity",
    color: "#CC7722",
    maturityRange: ["verified", "operational"],
    personas: ["Operator", "Dispatcher", "Manager"],
    leftDock: ["Operations", "Incidents", "Resources", "Communications"],
    rightDock: ["Confidence", "SLA", "Current Risks", "Affected Systems"],
    bottomDock: ["Dispatch ETA", "Health", "Availability"],
  },
  compliance: {
    label: "Compliance",
    description: "Can you prove what happened? Provenance, replay status, attestation, and audit trails.",
    icon: "FileCheck2",
    color: "#C9A84C",
    maturityRange: ["attested", "operational"],
    personas: ["Compliance Officer", "Regulator", "Auditor"],
    leftDock: ["Evidence Chain", "Replay Status", "Environment Version"],
    rightDock: ["Trust Chain", "Environment", "Replay Status", "Integrity"],
    bottomDock: ["Ready", "Replay Passed", "Attestation Ready"],
  },
  executive: {
    label: "Executive",
    description: "Strategic risks, system confidence, and organizational health. How confidence accumulates or declines.",
    icon: "TrendingUp",
    color: "#8A9A5B",
    maturityRange: ["operational", "institutional-memory"],
    personas: ["Executive", "Leader", "Decision Maker"],
    leftDock: ["Strategic Risks", "System Confidence", "Outstanding Investigations"],
    rightDock: ["Operational Health", "Growth Metrics", "Compliance Posture"],
    bottomDock: ["Confidence Trend", "Risk Score", "Decisions"],
  },
};

// Backward compatibility: WorkspaceMode maps to WorkspaceContext
export type WorkspaceMode = WorkspaceContext;

/** @deprecated Use WORKSPACE_CONTEXTS instead */
export const WORKSPACE_MODES = WORKSPACE_CONTEXTS;

// ---------------------------------------------------------------------------
// AI Agents — Collaborators, Not Oracles
// ---------------------------------------------------------------------------

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  status: "running" | "idle" | "watching" | "offline";
  confidence?: number;
  details?: string;
  color: string;
  icon: string;
}

export const VVU_AGENTS: AgentDefinition[] = [
  {
    id: "lindiwe",
    name: "Lindiwe",
    role: "Telemetry Agent",
    status: "running",
    confidence: 92,
    details: "4 streams",
    color: "#3dffb0",
    icon: "Activity",
  },
  {
    id: "simulation-agent",
    name: "Simulation Agent",
    role: "Branch & Simulate",
    status: "running",
    confidence: 67,
    details: "3 branches",
    color: "#3dd6ff",
    icon: "GitBranch",
  },
  {
    id: "fraud-agent",
    name: "Fraud Agent",
    role: "Anomaly Detection",
    status: "idle",
    color: "#CC7722",
    icon: "ShieldAlert",
  },
  {
    id: "compliance-agent",
    name: "Compliance Agent",
    role: "Audit & Provenance",
    status: "watching",
    details: "2 pending",
    color: "#C9A84C",
    icon: "FileCheck2",
  },
];

// ---------------------------------------------------------------------------
// Trust Passport — User's Journey Through Trust
// ---------------------------------------------------------------------------

export interface TrustPassportEntry {
  capabilityId: string;
  maturity: EpistemicMaturity;
  completedSteps: string[];
  totalSteps: number;
  lastUpdated: string;
  /** Number of engineering events in this capability's history */
  eventCount: number;
  /** Number of attestation certificates issued */
  attestationCount: number;
  /** Whether the environment is currently SOUND */
  environmentSound: boolean;
}

export interface TrustPassport {
  entries: Record<string, TrustPassportEntry>;
  overallMaturity: EpistemicMaturity;
  totalEvents: number;
  totalAttestations: number;
  trustScore: number; // 0-100
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Calculate overall maturity from a set of entries */
export function calculateOverallMaturity(
  entries: Record<string, TrustPassportEntry>,
): EpistemicMaturity {
  const maturities = Object.values(entries).map((e) => e.maturity);
  if (maturities.length === 0) return "unknown";

  // The overall maturity is the highest maturity achieved across all capabilities
  const maxIndex = Math.max(
    ...maturities.map((m) => getMaturityIndex(m)),
  );
  return MATURITY_STAGES[maxIndex];
}

/** Calculate trust score from passport entries */
export function calculateTrustScore(
  entries: Record<string, TrustPassportEntry>,
): number {
  const values = Object.values(entries);
  if (values.length === 0) return 0;

  const totalProgress = values.reduce((sum, entry) => {
    const progress = getMaturityProgress(entry.maturity);
    const stepProgress = entry.totalSteps > 0
      ? entry.completedSteps.length / entry.totalSteps
      : 0;
    return sum + (progress * 0.7 + stepProgress * 0.3);
  }, 0);

  return Math.round((totalProgress / values.length) * 100);
}

/** Get the workspace mode for a given maturity stage */
export function getWorkspaceModeForMaturity(
  maturity: EpistemicMaturity,
): WorkspaceMode {
  const idx = getMaturityIndex(maturity);

  if (idx <= 2) return "engineering";
  if (idx === 3) return "review";
  if (idx === 4) return "compliance";
  if (idx === 5) return "operations";
  return "executive";
}

/** Get dock items for a workspace context */
export function getDockItemsForMode(
  mode: WorkspaceMode,
  position: "left" | "right" | "bottom",
): string[] {
  const context = WORKSPACE_CONTEXTS[mode];
  if (!context) return [];

  switch (position) {
    case "left":
      return context.leftDock;
    case "right":
      return context.rightDock;
    case "bottom":
      return context.bottomDock;
  }
}

// ---------------------------------------------------------------------------
// Universal Intent Categories
// ---------------------------------------------------------------------------

/**
 * The "I want to…" screen is organized by universal intent categories.
 * These are not engineering-specific. They apply to everyone.
 */
export type IntentCategory =
  | "learn"       // Study, practice, understand, grow
  | "create"      // Make, build, design, compose
  | "organize"    // Plan, track, manage, connect
  | "discover"    // Search, explore, find, investigate
  | "build"       // Engineer, develop, validate, deploy
  | "connect";    // Share, collaborate, communicate, govern

export const INTENT_CATEGORIES: Record<IntentCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
  /** Example intents that belong to this category */
  examples: string[];
}> = {
  learn: {
    label: "Learn",
    description: "Study, practice, ask questions, and build understanding that lasts.",
    icon: "GraduationCap",
    color: "#3dd6ff",
    examples: ["Study Biology", "Practice Mathematics", "Learn Photography", "Understand History"],
  },
  create: {
    label: "Create",
    description: "Make art, write stories, compose music, or design something new.",
    icon: "Palette",
    color: "#b23dff",
    examples: ["Write a Story", "Create Art", "Compose Music", "Design Something"],
  },
  organize: {
    label: "Organize",
    description: "Plan your life, manage your home, keep track of everything.",
    icon: "Home",
    color: "#C9A84C",
    examples: ["Plan Meals", "Organize Documents", "Track Medications", "Schedule Appointments"],
  },
  discover: {
    label: "Discover",
    description: "Search, explore, find answers, investigate mysteries.",
    icon: "Search",
    color: "#10b981",
    examples: ["Find Documents", "Search Recipes", "Investigate Anomalies", "Explore History"],
  },
  build: {
    label: "Build",
    description: "Start a business, engineer a solution, validate an idea, deploy a system.",
    icon: "Rocket",
    color: "#CC7722",
    examples: ["Start a Business", "Engineer a Solution", "Validate an Idea", "Build a Community"],
  },
  connect: {
    label: "Connect",
    description: "Share with family, collaborate with teams, govern a community.",
    icon: "Users",
    color: "#8A9A5B",
    examples: ["Family Workspace", "Team Project", "Community Programme", "Shared Knowledge"],
  },
};
