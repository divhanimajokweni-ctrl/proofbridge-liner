// Epistemic Policy Definition (.epd) — Abstract Syntax Tree types

export type Severity = "critical" | "high" | "medium" | "low";
export type ShardStrategy =
  | "locality_preserving"
  | "hash"
  | "range"
  | "geographic"
  | "subsystem";
export type RepairStrategy =
  | "self_repair"
  | "reject"
  | "quarantine"
  | "escalate";
export type RepairObjective =
  | "least_divergent"
  | "max_consistency"
  | "min_energy"
  | "min_disruption";
export type ProofKind = "mmr" | "merkle" | "capnp";
export type GossipKind = "p2p" | "mesh" | "star";
export type AnchorKind = "none" | "rekor" | "blockchain" | "transparency_log";
export type ExportTarget = "wasm" | "rust" | "tla" | "json";

// --- Expression AST ---
export type Expr =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "ident"; name: string }
  | { kind: "unary"; op: "-" | "not"; operand: Expr }
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }
  | { kind: "logic"; op: "and" | "or"; left: Expr; right: Expr }
  | {
      kind: "compare";
      op: ">=" | "<=" | "==" | "!=" | ">" | "<";
      left: Expr;
      right: Expr;
    }
  | { kind: "in"; value: Expr; range: [Expr, Expr] }
  | { kind: "call"; name: string; args: Expr[] };

export interface InvariantNode {
  name: string;
  soft: boolean;
  predicate: Expr | null;
  severity: Severity;
  message?: string;
  tolerance?: number;
  tags: string[];
  rawPredicate: string;
  line: number;
}

export interface ShardNode {
  dimension?: string; // e.g. "region", "facility", "subsystem"
  key: string;
  strategy: ShardStrategy;
  count?: number;
  replication?: number;
  line: number;
}

export interface ExpectMergeNode {
  preserves: string[];
  localityPreserving?: boolean;
  requires: string[];
  maxDivergence?: number;
  line: number;
}

export interface OnViolationNode {
  strategy: RepairStrategy;
  objective: RepairObjective;
  maxIters?: number;
  notify?: string;
  line: number;
}

export interface AncestryNode {
  proof: ProofKind;
  zk: boolean;
  gossip: GossipKind;
  anchor: AnchorKind;
  line: number;
}

export interface ShadowBridgeNode {
  enabled: boolean;
  takeoverLatencyMs?: number;
  whatifBranching?: boolean;
  replay?: boolean;
  authoritative?: boolean;
  line: number;
}

export interface PolicyNode {
  type: "Policy";
  name: string;
  description?: string;
  domain?: string;
  version?: string;
  shard?: ShardNode;
  invariants: InvariantNode[];
  expectMerge?: ExpectMergeNode;
  onViolation?: OnViolationNode;
  ancestry?: AncestryNode;
  shadowBridge?: ShadowBridgeNode;
  exports: ExportTarget[];
  line: number;
}

export interface EpdFile {
  type: "EpdFile";
  policies: PolicyNode[];
  source: string;
}

// --- Validation result types ---
export interface Diagnostic {
  level: "error" | "warning" | "info";
  message: string;
  line: number;
  column?: number;
  policy?: string;
  invariant?: string;
}

export interface InvariantEvaluation {
  name: string;
  passed: boolean;
  severity: Severity;
  soft: boolean;
  message?: string;
  evaluated: string;
  actual?: string;
  expected?: string;
  divergence?: number;
}

export interface ValidationResult {
  ok: boolean;
  diagnostics: Diagnostic[];
  ast: EpdFile | null;
  compiledEnforcer: CompiledEnforcer | null;
  invariantCount: number;
  shardCount: number;
}

export interface CompiledEnforcer {
  target: ExportTarget;
  wasmPreview: string;
  rustPreview: string;
  tlaPreview: string;
  invariantFingerprints: { name: string; hash: string }[];
}

// A merge proposal evaluated against a policy
export interface MergeProposal {
  id: string;
  policyName: string;
  sourceShard: string;
  targetShard: string;
  state: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  status: "pending" | "repairing" | "applied" | "rejected";
  violations: string[];
  repairedState?: Record<string, unknown>;
  divergence?: number;
  mmrProof: string;
  createdAt: string;
}
