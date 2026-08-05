/**
 * IVE Frozen Contract Types
 * =========================
 *
 * These types encode the frozen result-contract for the VVU Integrated
 * Verification Environment (IVE). They mirror the schema enforced by the
 * release freeze (see RELEASE_FREEZE.md):
 *
 *   /ive-output/results.json must expose:
 *     { run_id, obligations, telemetry, trustSphere,
 *       provenance_status, ledger_status }
 *
 * Missing values MUST remain explicit: `UNDEFINED`, `MISSING`,
 * `NOT_EVALUATED`, `OUT_OF_SCOPE`, or `REQUIRES VALIDATION`.
 *
 * No fabricated engineering values are permitted. Engineering Release is
 * BLOCKED until independently supported engineering evidence exists.
 */

/** Frozen proof obligation states (release freeze). */
export type ProofState =
  | "PROVEN"
  | "DISPROVEN"
  | "BLOCKED_MISSING_INPUT"
  | "BLOCKED_UNVERIFIED_INPUT"
  | "OUT_OF_SCOPE"
  | "SOLVER_ERROR";

/** Explicit missing-value markers (never a fabricated default). */
export type ExplicitMissing =
  | "UNDEFINED"
  | "MISSING"
  | "NOT_EVALUATED"
  | "OUT_OF_SCOPE"
  | "REQUIRES VALIDATION"
  | "PENDING";

/** Trust Sphere dimension value — either an explicit status string or a
 *  structured count (never an unexplained aggregate percentage). */
export interface TrustDimensionStatus {
  /** Short machine label, e.g. "VERIFIED", "OUT_OF_SCOPE", "PENDING". */
  state: string;
  /** Human-readable explanation tied to actual repository evidence. */
  detail: string;
  /** Optional evidence count (e.g. "4 / 4 obligations proven"). */
  count?: { proven: number; total: number };
}

export interface TrustSphere {
  safety: TrustDimensionStatus;
  integrity: TrustDimensionStatus;
  determinism: TrustDimensionStatus;
  auditability: TrustDimensionStatus;
  recoverability: TrustDimensionStatus;
  availability: TrustDimensionStatus;
  /** Always "BLOCKED" until engineering evidence exists. */
  engineeringRelease: "BLOCKED" | "RELEASED";
}

export interface ProofObligation {
  id: string;
  category: string;
  statement: string;
  state: ProofState | ExplicitMissing;
  solver?: string;
  counterexample?: string;
}

export interface HardwareProfile {
  reportedDevice: string | ExplicitMissing;
  backend: string | ExplicitMissing;
  speedupRatio: number | ExplicitMissing;
  provider: string | ExplicitMissing;
  pytorch: string | ExplicitMissing;
  hip: string | ExplicitMissing;
}

export interface ZooApiStatus {
  nativeApiExecution: string | ExplicitMissing;
  wrapperLayer: string | ExplicitMissing;
  integrationPoint: string | ExplicitMissing;
}

export interface Telemetry {
  rawSimulationMeta: Record<string, unknown> | ExplicitMissing;
  rawTrainingMetrics: Record<string, unknown> | ExplicitMissing;
  rawBenchmarkData: Record<string, unknown> | ExplicitMissing;
  zooApiIntegration: ZooApiStatus;
}

/** The frozen result contract consumed by the frontend Zustand store. */
export interface IVEResultContract {
  run_id: string | ExplicitMissing;
  hardware_profile: HardwareProfile;
  obligations: ProofObligation[];
  telemetry: Telemetry;
  trustSphere: TrustSphere;
  provenance_status: string;
  ledger_status: string;
}

/* ------------------------------------------------------------------ */
/* Workspace / runtime types (frontend-only, not part of the freeze)  */
/* ------------------------------------------------------------------ */

export type PluginId =
  | "amd"
  | "zoo"
  | "github"
  | "cad"
  | "figma"
  | "ros2"
  | "matlab"
  | "plc";

export type PluginState =
  | "NOT_INSTALLED"
  | "INSTALLED"
  | "DORMANT"
  | "ACTIVATED"
  | "RUNNING"
  | "IDLE";

export interface PluginMeta {
  id: PluginId;
  label: string;
  tag: string;
  accent: string;
  state: PluginState;
  version: string | ExplicitMissing;
  description: string;
  native: boolean;
}

export type ProofGraphNodeStatus = "PENDING" | "ACTIVE" | "PROVEN" | "BLOCKED" | "OUT_OF_SCOPE";

export interface ProofGraphNode {
  id: string;
  label: string;
  /** One-line engineering semantic for the node. */
  semantic: string;
  status: ProofGraphNodeStatus;
  /** ISO timestamp or ExplicitMissing. */
  completedAt?: string | ExplicitMissing;
}

export interface ProofGraphEdge {
  from: string;
  to: string;
}

export interface EvidenceEvent {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  level: "info" | "warn" | "error" | "success";
  /** True when this event is backed by actual runtime data. */
  evidenced: boolean;
}

export type WorkspacePanelId =
  | "overview"
  | "trust"
  | "proof"
  | "evidence"
  | "plugins"
  | "amd"
  | "zoo"
  | "hbk"
  | "cad"
  | "explorer"
  | "artifacts"
  | "telemetry"
  | "terminal"
  | "watchdog"
  | "lindiwe"
  | "release"
  | "adapter"
  | "integrity"
  | "identity"
  | "acceptance"
  | "settings";

export type BootStageId =
  | "logo"
  | "rings"
  | "sphere"
  | "evidence-nodes"
  | "evidence-runtime"
  | "zoo-engine"
  | "proof-runtime"
  | "trust-runtime"
  | "workspace";

export interface BootStage {
  id: BootStageId;
  label: string;
  detail: string;
  /** Golden-ratio-derived duration in ms for the cinematic cadence. */
  durationMs: number;
}

export interface ArtifactFile {
  name: string;
  path: string;
  description: string;
  schema: string;
  status: "PRESENT" | "MISSING" | "REQUIRES_VALIDATION";
  bytes?: number;
}

export interface ExplorerNode {
  name: string;
  path: string;
  kind: "dir" | "file";
  children?: ExplorerNode[];
  meta?: string;
}

export interface LedgerEntry {
  runId: string;
  timestamp: string;
  target: string;
  environment: string;
  inputHash: string | ExplicitMissing;
  outputHash: string | ExplicitMissing;
  status: "ANCHORED" | "PENDING" | "MISSING";
}
