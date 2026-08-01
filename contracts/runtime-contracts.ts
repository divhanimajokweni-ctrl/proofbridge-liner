// contracts/runtime-contracts.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 3: Runtime Contract Interfaces
// 7 explicit TypeScript contract interfaces that every adapter
// must implement. BaseAdapterContract is the minimum; FullAdapterContract
// is the composite of all 7.
// ───────────────────────────────────────────────────────────────

import type {
  TrustConfiguration,
  TrustContext,
  TrustEvent,
  VerificationPolicy,
  ExecutionReceipt,
  ExecutionEvidence,
  DiffManifest,
  AgentIdentity,
  TaskSpec,
  VerificationResult,
} from "./api/types";

// ─── Contract Version Constants ───────────────────────────────

export const CONTRACT_VERSION = "1.0.0" as const;

export type ContractVersion = typeof CONTRACT_VERSION;

// ─── Shared Types ─────────────────────────────────────────────

export interface AdapterMetadata {
  adapterId: string;
  adapterName: string;
  version: string;
  vendor: string;
  category: AdapterCategory;
  description: string;
  supportedProtocols: string[];
  minRuntimeVersion?: string;
}

export type AdapterCategory =
  | "ci-cd"
  | "productivity"
  | "communication"
  | "vcs"
  | "cloud"
  | "storage"
  | "messaging"
  | "content"
  | "scada"
  | "geospatial"
  | "custom";

export interface AdapterHealthStatus {
  healthy: boolean;
  lastCheck: number;
  latencyMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface AdapterCapability {
  capabilityId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  requiredPermissions: AdapterPermission[];
  estimatedLatencyMs: number;
}

export type AdapterPermission =
  | "read"
  | "write"
  | "execute"
  | "admin"
  | "stream"
  | "vault";

export interface AdapterConfig {
  adapterId: string;
  credentials: Record<string, string>;
  options: Record<string, unknown>;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface ExecutionContext {
  tenantId: string;
  capabilityId: string;
  agentId?: string;
  goalId?: string;
  prompt?: string;
  modelId?: string;
  provider?: string;
  routingReason?: string;
  tools?: string[];
  costBudget?: number;
  output?: {
    text: string;
    tokens_used: { input: number; output: number };
    cost_usd: number;
    timestamp: Date;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: unknown;
  durationMs: number;
  evidence?: ExecutionEvidence;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceCollection {
  evidenceId: string;
  adapterId: string;
  tenantId: string;
  type: EvidenceType;
  claim: string;
  source: string;
  confidence: "low" | "medium" | "high";
  data: Record<string, unknown>;
  timestamp: number;
  signature?: string;
}

export type EvidenceType =
  | "execution"
  | "attestation"
  | "verification"
  | "audit"
  | "compliance"
  | "health";

export interface GovernanceDecision {
  decisionId: string;
  adapterId: string;
  tenantId: string;
  decision: "allow" | "deny" | "require_approval";
  reason: string;
  matchedPolicies: string[];
  riskScore: number;
  timestamp: number;
}

export interface ConfigurationState {
  adapterId: string;
  tenantId: string;
  version: number;
  config: Record<string, unknown>;
  hash: string;
  updatedAt: number;
}

export interface LifecycleEvent {
  eventId: string;
  adapterId: string;
  event: LifecycleEventType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type LifecycleEventType =
  | "registered"
  | "configured"
  | "connected"
  | "disconnected"
  | "suspended"
  | "resumed"
  | "terminated"
  | "error";

// ─── CONTRACT 1: CapabilityContractV1 ─────────────────────────
// Defines what an adapter can DO — its registered capabilities.

export interface CapabilityContractV1 {
  readonly contractVersion: ContractVersion;

  /** Return the adapter's metadata. */
  getMetadata(): AdapterMetadata;

  /** List all capabilities this adapter provides. */
  listCapabilities(): AdapterCapability[];

  /** Check if a specific capability is available right now. */
  hasCapability(capabilityId: string): boolean;

  /** Validate that input conforms to the capability's input schema. */
  validateInput(
    capabilityId: string,
    input: Record<string, unknown>,
  ): { valid: boolean; errors: string[] };

  /** Validate that output conforms to the capability's output schema. */
  validateOutput(
    capabilityId: string,
    output: Record<string, unknown>,
  ): { valid: boolean; errors: string[] };
}

// ─── CONTRACT 2: ExecutionContractV1 ──────────────────────────
// Defines how an adapter EXECUTES capabilities.

export interface ExecutionContractV1 {
  readonly contractVersion: ContractVersion;

  /** Execute a capability with the given context. */
  execute(
    capabilityId: string,
    context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<ExecutionResult>;

  /** Check if a capability can be executed right now (pre-flight). */
  canExecute(
    capabilityId: string,
    context: ExecutionContext,
  ): Promise<{ allowed: boolean; reason?: string }>;

  /** Abort a running execution. */
  abort(executionId: string, reason: string): Promise<boolean>;

  /** Get the status of a running execution. */
  getExecutionStatus(
    executionId: string,
  ): Promise<{ status: "pending" | "running" | "completed" | "failed" | "aborted"; result?: ExecutionResult }>;
}

// ─── CONTRACT 3: EvidenceContractV1 ───────────────────────────
// Defines how an adapter COLLECTS and REPORTS evidence.

export interface EvidenceContractV1 {
  readonly contractVersion: ContractVersion;

  /** Collect evidence for a specific execution. */
  collectEvidence(
    executionId: string,
    context: ExecutionContext,
  ): Promise<EvidenceCollection[]>;

  /** Verify that evidence is authentic and untampered. */
  verifyEvidence(evidence: EvidenceCollection): Promise<{ valid: boolean; reason?: string }>;

  /** Get all evidence for a tenant within a time range. */
  getEvidence(
    tenantId: string,
    startTime: number,
    endTime: number,
  ): Promise<EvidenceCollection[]>;

  /** Get evidence by ID. */
  getEvidenceById(evidenceId: string): Promise<EvidenceCollection | null>;
}

// ─── CONTRACT 4: HealthContractV1 ─────────────────────────────
// Defines how an adapter reports its HEALTH.

export interface HealthContractV1 {
  readonly contractVersion: ContractVersion;

  /** Get current health status. */
  getHealth(): Promise<AdapterHealthStatus>;

  /** Get health history for the last N checks. */
  getHealthHistory(count: number): Promise<AdapterHealthStatus[]>;

  /** Run a deep health check (may be expensive). */
  deepHealthCheck(): Promise<AdapterHealthStatus & { details: Record<string, unknown> }>;

  /** Check if the adapter is ready to serve requests. */
  isReady(): Promise<boolean>;
}

// ─── CONTRACT 5: GovernanceContractV1 ─────────────────────────
// Defines how an adapter interacts with GOVERNANCE policies.

export interface GovernanceContractV1 {
  readonly contractVersion: ContractVersion;

  /** Evaluate a request against governance policies. */
  evaluateGovernance(
    context: ExecutionContext,
    policies: VerificationPolicy[],
  ): Promise<GovernanceDecision>;

  /** Get all governance decisions for a tenant. */
  getGovernanceHistory(
    tenantId: string,
    limit: number,
  ): Promise<GovernanceDecision[]>;

  /** Check if an action is allowed by the adapter's own policies. */
  isAllowed(
    action: string,
    context: ExecutionContext,
  ): Promise<{ allowed: boolean; reason?: string }>;
}

// ─── CONTRACT 6: ConfigurationContractV1 ──────────────────────
// Defines how an adapter MANAGES its configuration.

export interface ConfigurationContractV1 {
  readonly contractVersion: ContractVersion;

  /** Get the current configuration state. */
  getConfiguration(tenantId: string): Promise<ConfigurationState>;

  /** Update the adapter's configuration. */
  updateConfiguration(
    tenantId: string,
    config: Record<string, unknown>,
  ): Promise<ConfigurationState>;

  /** Validate a configuration before applying it. */
  validateConfiguration(
    config: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors: string[] }>;

  /** Get the configuration schema (JSON Schema format). */
  getConfigurationSchema(): Record<string, unknown>;

  /** Reset configuration to defaults. */
  resetConfiguration(tenantId: string): Promise<ConfigurationState>;
}

// ─── CONTRACT 7: LifecycleContractV1 ──────────────────────────
// Defines how an adapter manages its LIFECYCLE.

export interface LifecycleContractV1 {
  readonly contractVersion: ContractVersion;

  /** Initialize the adapter with configuration. */
  initialize(config: AdapterConfig): Promise<void>;

  /** Connect to the external system. */
  connect(): Promise<boolean>;

  /** Disconnect from the external system. */
  disconnect(): Promise<void>;

  /** Suspend the adapter (pause operations). */
  suspend(): Promise<void>;

  /** Resume a suspended adapter. */
  resume(): Promise<void>;

  /** Terminate the adapter (permanent shutdown). */
  terminate(): Promise<void>;

  /** Get lifecycle history. */
  getLifecycleHistory(): Promise<LifecycleEvent[]>;

  /** Check if the adapter is in a specific lifecycle state. */
  getState(): "uninitialized" | "initialized" | "connected" | "disconnected" | "suspended" | "terminated";
}

// ─── Composite Contracts ──────────────────────────────────────

/**
 * BaseAdapterContract — the MINIMUM contract every adapter must implement.
 * Covers: Capability + Execution + Health + Lifecycle.
 */
export type BaseAdapterContract =
  CapabilityContractV1 &
  ExecutionContractV1 &
  HealthContractV1 &
  LifecycleContractV1;

/**
 * FullAdapterContract — the COMPLETE contract for adapters that need
 * governance, evidence, and configuration management.
 * Covers: all 7 contracts.
 */
export type FullAdapterContract =
  BaseAdapterContract &
  EvidenceContractV1 &
  GovernanceContractV1 &
  ConfigurationContractV1;

// ─── Contract Type Guards ─────────────────────────────────────

export function isCapabilityContract(
  adapter: unknown,
): adapter is CapabilityContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "getMetadata" in adapter &&
    "listCapabilities" in adapter &&
    "hasCapability" in adapter &&
    "validateInput" in adapter &&
    "validateOutput" in adapter
  );
}

export function isExecutionContract(
  adapter: unknown,
): adapter is ExecutionContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "execute" in adapter &&
    "canExecute" in adapter &&
    "abort" in adapter &&
    "getExecutionStatus" in adapter
  );
}

export function isEvidenceContract(
  adapter: unknown,
): adapter is EvidenceContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "collectEvidence" in adapter &&
    "verifyEvidence" in adapter &&
    "getEvidence" in adapter &&
    "getEvidenceById" in adapter
  );
}

export function isHealthContract(
  adapter: unknown,
): adapter is HealthContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "getHealth" in adapter &&
    "getHealthHistory" in adapter &&
    "deepHealthCheck" in adapter &&
    "isReady" in adapter
  );
}

export function isGovernanceContract(
  adapter: unknown,
): adapter is GovernanceContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "evaluateGovernance" in adapter &&
    "getGovernanceHistory" in adapter &&
    "isAllowed" in adapter
  );
}

export function isConfigurationContract(
  adapter: unknown,
): adapter is ConfigurationContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "getConfiguration" in adapter &&
    "updateConfiguration" in adapter &&
    "validateConfiguration" in adapter &&
    "getConfigurationSchema" in adapter &&
    "resetConfiguration" in adapter
  );
}

export function isLifecycleContract(
  adapter: unknown,
): adapter is LifecycleContractV1 {
  return (
    typeof adapter === "object" &&
    adapter !== null &&
    "contractVersion" in adapter &&
    (adapter as Record<string, unknown>).contractVersion === CONTRACT_VERSION &&
    "initialize" in adapter &&
    "connect" in adapter &&
    "disconnect" in adapter &&
    "suspend" in adapter &&
    "resume" in adapter &&
    "terminate" in adapter &&
    "getLifecycleHistory" in adapter &&
    "getState" in adapter
  );
}

export function isBaseAdapterContract(
  adapter: unknown,
): adapter is BaseAdapterContract {
  return (
    isCapabilityContract(adapter) &&
    isExecutionContract(adapter) &&
    isHealthContract(adapter) &&
    isLifecycleContract(adapter)
  );
}

export function isFullAdapterContract(
  adapter: unknown,
): adapter is FullAdapterContract {
  return (
    isBaseAdapterContract(adapter) &&
    isEvidenceContract(adapter) &&
    isGovernanceContract(adapter) &&
    isConfigurationContract(adapter)
  );
}
