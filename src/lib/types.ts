// Shared frontend types mirroring the API responses.

export type Severity = "critical" | "high" | "medium" | "low";
export type ShardStatus = "healthy" | "repairing" | "violating";
export type MergeStatus = "pending" | "repairing" | "applied" | "rejected";
export type ShadowKind = "takeover" | "whatif" | "replay" | "divergence" | "handback";

export interface PolicyRow {
  id: string;
  name: string;
  filename: string;
  source: string;
  domain: string | null;
  version: string | null;
  description: string | null;
  ok: boolean;
  errorCount: number;
  warningCount: number;
  invariantCount: number;
  shardCount: number;
  shardKey: string | null;
  shardStrategy: string | null;
  repairStrategy: string | null;
  zkEnabled: boolean;
  proofKind: string | null;
  shadowEnabled: boolean;
  takeoverLatencyMs: number | null;
  wasmFingerprint: string | null;
  createdAt: string;
  _count?: { shards: number; merges: number; violations: number };
}

export interface ShardRow {
  id: string;
  policyId: string;
  shardKey: string;
  region: string;
  nodeId: string;
  state: Record<string, unknown>;
  invariantStatus: ShardStatus;
  mmrRoot: string;
  peerCount: number;
  lastMergeAt: string | null;
  policy: { name: string; domain: string };
  invariantEvals: { name: string; passed: boolean; severity: Severity; soft: boolean }[];
}

export interface MergeRow {
  id: string;
  policyId: string;
  sourceShardName: string;
  targetShard: string;
  proposedState: Record<string, unknown>;
  repairedState: Record<string, unknown> | null;
  status: MergeStatus;
  violations: string[];
  divergence: number;
  iterations: number;
  mmrProof: string;
  zkProof: string | null;
  createdAt: string;
  policy: { name: string; domain: string };
}

export interface ProofRow {
  id: string;
  policyId: string;
  shardKey: string;
  mmrRoot: string;
  proofPath: string[];
  leaves?: string[];
  provenIndex?: number;
  zkProof: string | null;
  anchored: boolean;
  anchor: string | null;
  createdAt: string;
  verified: boolean;
  policy: { name: string; zkEnabled: boolean; proofKind: string };
}

export interface ShadowBridgeRow {
  policy: {
    id: string;
    name: string;
    domain: string | null;
    shadowEnabled: boolean;
    takeoverLatencyMs: number | null;
    authoritative: boolean;
  };
  liveState: Record<string, unknown>;
  shadowState: Record<string, unknown>;
  liveInvariants: { name: string; passed: boolean; severity: Severity; soft: boolean; actual?: string }[];
  shadowInvariants: { name: string; passed: boolean; severity: Severity; soft: boolean; actual?: string }[];
  divergence: number;
  events: ShadowEventRow[];
}

export interface ShadowEventRow {
  id: string;
  kind: ShadowKind;
  summary: string;
  liveState: string;
  shadowState: string;
  divergence: number;
  authoritative: boolean;
  createdAt: string;
}

export interface MinedInvariantRow {
  id: string;
  predicate: string;
  rationale: string;
  confidence: number;
  severity: Severity;
  accepted: boolean;
  policyId: string | null;
  policy: { name: string } | null;
  createdAt: string;
}

export interface StatsResponse {
  counts: {
    policies: number;
    shards: number;
    merges: number;
    proofs: number;
    violations: number;
    shadowEvents: number;
    mined: number;
  };
  shardHealth: {
    healthy: number;
    repairing: number;
    violating: number;
    healthScore: number;
  };
  mergeHealth: { applied: number; rejected: number; successRate: number };
  ancestry: { totalProofs: number; zkProofs: number; anchoredRate: number };
  shadow: { enabledPolicies: number; events: number };
  drift: { total: number; topViolated: [string, number][] };
  activity: { kind: "merge" | "shadow"; at: string; title: string; detail: string }[];
}

export interface CliRunResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  result?: unknown;
}
