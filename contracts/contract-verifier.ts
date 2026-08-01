// contracts/contract-verifier.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 3: Runtime Contract Verifier
// Verifies that adapter instances and classes comply with contracts.
// Uses type guards from runtime-contracts.ts plus runtime checks.
// ───────────────────────────────────────────────────────────────

import {
  CONTRACT_VERSION,
  type AdapterMetadata,
  type AdapterCapability,
  type AdapterHealthStatus,
  type ExecutionResult,
  type ExecutionContext,
  type EvidenceCollection,
  type GovernanceDecision,
  type ConfigurationState,
  type LifecycleEvent,
  type RetryPolicy,
  isCapabilityContract,
  isExecutionContract,
  isEvidenceContract,
  isHealthContract,
  isGovernanceContract,
  isConfigurationContract,
  isLifecycleContract,
  isBaseAdapterContract,
  isFullAdapterContract,
} from "./runtime-contracts";

// ─── Verification Result ──────────────────────────────────────

export interface ContractVerificationResult {
  adapterId: string;
  contractName: string;
  passed: boolean;
  violations: ContractViolation[];
  checkedAt: number;
  durationMs: number;
}

export interface ContractViolation {
  rule: string;
  severity: "error" | "warning";
  message: string;
  method?: string;
}

export interface FullVerificationReport {
  adapterId: string;
  adapterName: string;
  allPassed: boolean;
  contractResults: ContractVerificationResult[];
  totalViolations: number;
  verifiedAt: number;
  durationMs: number;
}

// ─── Contract Verifier ────────────────────────────────────────

export class ContractVerifier {
  /**
   * Verify that an adapter instance implements BaseAdapterContract.
   * Checks all 4 base contracts (Capability, Execution, Health, Lifecycle).
   */
  verifyBaseAdapter(
    adapterId: string,
    instance: unknown,
  ): ContractVerificationResult {
    const start = Date.now();
    const violations: ContractViolation[] = [];

    // Check CapabilityContract
    if (!isCapabilityContract(instance)) {
      violations.push({
        rule: "capability.implements",
        severity: "error",
        message: "Adapter does not implement CapabilityContractV1",
      });
    } else {
      this.verifyCapabilityContract(instance, violations);
    }

    // Check ExecutionContract
    if (!isExecutionContract(instance)) {
      violations.push({
        rule: "execution.implements",
        severity: "error",
        message: "Adapter does not implement ExecutionContractV1",
      });
    } else {
      this.verifyExecutionContract(instance, violations);
    }

    // Check HealthContract
    if (!isHealthContract(instance)) {
      violations.push({
        rule: "health.implements",
        severity: "error",
        message: "Adapter does not implement HealthContractV1",
      });
    } else {
      this.verifyHealthContract(instance, violations);
    }

    // Check LifecycleContract
    if (!isLifecycleContract(instance)) {
      violations.push({
        rule: "lifecycle.implements",
        severity: "error",
        message: "Adapter does not implement LifecycleContractV1",
      });
    } else {
      this.verifyLifecycleContract(instance, violations);
    }

    return {
      adapterId,
      contractName: "BaseAdapterContract",
      passed: violations.filter((v) => v.severity === "error").length === 0,
      violations,
      checkedAt: Date.now(),
      durationMs: Date.now() - start,
    };
  }

  /**
   * Verify that an adapter instance implements FullAdapterContract.
   * Checks all 7 contracts.
   */
  verifyFullAdapter(
    adapterId: string,
    instance: unknown,
  ): ContractVerificationResult {
    const start = Date.now();
    const violations: ContractViolation[] = [];

    // First verify base
    const baseResult = this.verifyBaseAdapter(adapterId, instance);
    violations.push(...baseResult.violations);

    // Check EvidenceContract
    if (!isEvidenceContract(instance)) {
      violations.push({
        rule: "evidence.implements",
        severity: "error",
        message: "Adapter does not implement EvidenceContractV1",
      });
    } else {
      this.verifyEvidenceContract(instance, violations);
    }

    // Check GovernanceContract
    if (!isGovernanceContract(instance)) {
      violations.push({
        rule: "governance.implements",
        severity: "error",
        message: "Adapter does not implement GovernanceContractV1",
      });
    } else {
      this.verifyGovernanceContract(instance, violations);
    }

    // Check ConfigurationContract
    if (!isConfigurationContract(instance)) {
      violations.push({
        rule: "configuration.implements",
        severity: "error",
        message: "Adapter does not implement ConfigurationContractV1",
      });
    } else {
      this.verifyConfigurationContract(instance, violations);
    }

    return {
      adapterId,
      contractName: "FullAdapterContract",
      passed: violations.filter((v) => v.severity === "error").length === 0,
      violations,
      checkedAt: Date.now(),
      durationMs: Date.now() - start,
    };
  }

  // ─── Private Verification Methods ─────────────────────────

  private verifyCapabilityContract(
    instance: { getMetadata(): AdapterMetadata; listCapabilities(): AdapterCapability[]; validateInput(cid: string, input: Record<string, unknown>): { valid: boolean; errors: string[] }; validateOutput(cid: string, output: Record<string, unknown>): { valid: boolean; errors: string[] } },
    violations: ContractViolation[],
  ): void {
    // Verify contractVersion
    const version = (instance as Record<string, unknown>).contractVersion;
    if (version !== CONTRACT_VERSION) {
      violations.push({
        rule: "capability.version",
        severity: "error",
        message: `Expected contractVersion "${CONTRACT_VERSION}", got "${version}"`,
        method: "getMetadata",
      });
    }

    // Verify metadata shape
    try {
      const metadata = instance.getMetadata();
      if (!metadata.adapterId || typeof metadata.adapterId !== "string") {
        violations.push({
          rule: "capability.metadata.adapterId",
          severity: "error",
          message: "getMetadata() must return adapterId as non-empty string",
          method: "getMetadata",
        });
      }
      if (!metadata.adapterName || typeof metadata.adapterName !== "string") {
        violations.push({
          rule: "capability.metadata.adapterName",
          severity: "error",
          message: "getMetadata() must return adapterName as non-empty string",
          method: "getMetadata",
        });
      }
      if (!metadata.version || typeof metadata.version !== "string") {
        violations.push({
          rule: "capability.metadata.version",
          severity: "error",
          message: "getMetadata() must return version as non-empty string",
          method: "getMetadata",
        });
      }
      if (!metadata.vendor || typeof metadata.vendor !== "string") {
        violations.push({
          rule: "capability.metadata.vendor",
          severity: "warning",
          message: "getMetadata() should return vendor as non-empty string",
          method: "getMetadata",
        });
      }
    } catch (err) {
      violations.push({
        rule: "capability.metadata",
        severity: "error",
        message: `getMetadata() threw: ${err instanceof Error ? err.message : String(err)}`,
        method: "getMetadata",
      });
    }

    // Verify capabilities
    try {
      const capabilities = instance.listCapabilities();
      if (!Array.isArray(capabilities)) {
        violations.push({
          rule: "capability.listCapabilities",
          severity: "error",
          message: "listCapabilities() must return an array",
          method: "listCapabilities",
        });
      } else {
        for (const cap of capabilities) {
          if (!cap.capabilityId || typeof cap.capabilityId !== "string") {
            violations.push({
              rule: "capability.shape.capabilityId",
              severity: "error",
              message: "Each capability must have a non-empty capabilityId string",
              method: "listCapabilities",
            });
          }
          if (!cap.name || typeof cap.name !== "string") {
            violations.push({
              rule: "capability.shape.name",
              severity: "warning",
              message: `Capability "${cap.capabilityId}" missing name`,
              method: "listCapabilities",
            });
          }
          if (!Array.isArray(cap.requiredPermissions)) {
            violations.push({
              rule: "capability.shape.requiredPermissions",
              severity: "error",
              message: `Capability "${cap.capabilityId}" requiredPermissions must be an array`,
              method: "listCapabilities",
            });
          }
        }
      }
    } catch (err) {
      violations.push({
        rule: "capability.listCapabilities",
        severity: "error",
        message: `listCapabilities() threw: ${err instanceof Error ? err.message : String(err)}`,
        method: "listCapabilities",
      });
    }
  }

  private verifyExecutionContract(
    instance: { execute(cid: string, ctx: ExecutionContext, input: Record<string, unknown>): Promise<ExecutionResult>; canExecute(cid: string, ctx: ExecutionContext): Promise<{ allowed: boolean; reason?: string }> },
    violations: ContractViolation[],
  ): void {
    // Verify execute is a function
    if (typeof instance.execute !== "function") {
      violations.push({
        rule: "execution.execute",
        severity: "error",
        message: "execute() must be a function",
        method: "execute",
      });
    }

    // Verify canExecute is a function
    if (typeof instance.canExecute !== "function") {
      violations.push({
        rule: "execution.canExecute",
        severity: "error",
        message: "canExecute() must be a function",
        method: "canExecute",
      });
    }
  }

  private verifyHealthContract(
    instance: { getHealth(): Promise<AdapterHealthStatus>; isReady(): Promise<boolean> },
    violations: ContractViolation[],
  ): void {
    if (typeof instance.getHealth !== "function") {
      violations.push({
        rule: "health.getHealth",
        severity: "error",
        message: "getHealth() must be a function",
        method: "getHealth",
      });
    }

    if (typeof instance.isReady !== "function") {
      violations.push({
        rule: "health.isReady",
        severity: "error",
        message: "isReady() must be a function",
        method: "isReady",
      });
    }
  }

  private verifyLifecycleContract(
    instance: { initialize(config: unknown): Promise<void>; connect(): Promise<boolean>; disconnect(): Promise<void>; terminate(): Promise<void>; getState(): string },
    violations: ContractViolation[],
  ): void {
    const requiredMethods = ["initialize", "connect", "disconnect", "suspend", "resume", "terminate", "getState", "getLifecycleHistory"];
    for (const method of requiredMethods) {
      if (typeof (instance as Record<string, unknown>)[method] !== "function") {
        violations.push({
          rule: `lifecycle.${method}`,
          severity: "error",
          message: `${method}() must be a function`,
          method,
        });
      }
    }
  }

  private verifyEvidenceContract(
    instance: { collectEvidence(eid: string, ctx: ExecutionContext): Promise<EvidenceCollection[]>; verifyEvidence(evidence: EvidenceCollection): Promise<{ valid: boolean; reason?: string }> },
    violations: ContractViolation[],
  ): void {
    const requiredMethods = ["collectEvidence", "verifyEvidence", "getEvidence", "getEvidenceById"];
    for (const method of requiredMethods) {
      if (typeof (instance as Record<string, unknown>)[method] !== "function") {
        violations.push({
          rule: `evidence.${method}`,
          severity: "error",
          message: `${method}() must be a function`,
          method,
        });
      }
    }
  }

  private verifyGovernanceContract(
    instance: { evaluateGovernance(ctx: ExecutionContext, policies: unknown[]): Promise<GovernanceDecision>; isAllowed(action: string, ctx: ExecutionContext): Promise<{ allowed: boolean; reason?: string }> },
    violations: ContractViolation[],
  ): void {
    const requiredMethods = ["evaluateGovernance", "getGovernanceHistory", "isAllowed"];
    for (const method of requiredMethods) {
      if (typeof (instance as Record<string, unknown>)[method] !== "function") {
        violations.push({
          rule: `governance.${method}`,
          severity: "error",
          message: `${method}() must be a function`,
          method,
        });
      }
    }
  }

  private verifyConfigurationContract(
    instance: { getConfiguration(tenantId: string): Promise<ConfigurationState>; validateConfiguration(config: Record<string, unknown>): Promise<{ valid: boolean; errors: string[] }>; getConfigurationSchema(): Record<string, unknown> },
    violations: ContractViolation[],
  ): void {
    const requiredMethods = ["getConfiguration", "updateConfiguration", "validateConfiguration", "getConfigurationSchema", "resetConfiguration"];
    for (const method of requiredMethods) {
      if (typeof (instance as Record<string, unknown>)[method] !== "function") {
        violations.push({
          rule: `configuration.${method}`,
          severity: "error",
          message: `${method}() must be a function`,
          method,
        });
      }
    }
  }
}
