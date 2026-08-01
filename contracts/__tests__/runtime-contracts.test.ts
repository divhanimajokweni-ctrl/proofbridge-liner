// contracts/__tests__/runtime-contracts.test.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 3: Contract Compliance Test Suite
// Tests type guards, verifier, registry, and negotiator.
// ───────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from "vitest";
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
  type BaseAdapterContract,
  type FullAdapterContract,
  isCapabilityContract,
  isExecutionContract,
  isEvidenceContract,
  isHealthContract,
  isGovernanceContract,
  isConfigurationContract,
  isLifecycleContract,
  isBaseAdapterContract,
  isFullAdapterContract,
} from "../runtime-contracts";
import { ContractVerifier } from "../contract-verifier";
import {
  ContractRegistry,
  resetContractRegistry,
} from "../contract-registry";
import {
  ContractNegotiator,
  parseVersion,
  isMajorCompatible,
  isMinorCompatible,
  resetContractNegotiator,
} from "../contract-negotiation";

// ─── Mock Adapter: Base Only ──────────────────────────────────

class MockBaseAdapter implements BaseAdapterContract {
  readonly contractVersion = CONTRACT_VERSION;

  private state: "uninitialized" | "initialized" | "connected" | "disconnected" | "suspended" | "terminated" = "uninitialized";
  private lifecycleHistory: LifecycleEvent[] = [];

  getMetadata(): AdapterMetadata {
    return {
      adapterId: "mock-base-001",
      adapterName: "Mock Base Adapter",
      version: "1.0.0",
      vendor: "test-vendor",
      category: "custom",
      description: "A mock adapter for testing BaseAdapterContract",
      supportedProtocols: ["test"],
    };
  }

  listCapabilities(): AdapterCapability[] {
    return [
      {
        capabilityId: "test-execute",
        name: "Test Execution",
        description: "Execute a test action",
        inputSchema: { type: "object", properties: { action: { type: "string" } } },
        outputSchema: { type: "object", properties: { result: { type: "string" } } },
        requiredPermissions: ["read"],
        estimatedLatencyMs: 100,
      },
    ];
  }

  hasCapability(capabilityId: string): boolean {
    return capabilityId === "test-execute";
  }

  validateInput(capabilityId: string, input: Record<string, unknown>): { valid: boolean; errors: string[] } {
    if (capabilityId !== "test-execute") return { valid: false, errors: ["Unknown capability"] };
    if (!input.action || typeof input.action !== "string") return { valid: false, errors: ["action is required"] };
    return { valid: true, errors: [] };
  }

  validateOutput(capabilityId: string, output: Record<string, unknown>): { valid: boolean; errors: string[] } {
    if (capabilityId !== "test-execute") return { valid: false, errors: ["Unknown capability"] };
    return { valid: true, errors: [] };
  }

  async execute(capabilityId: string, context: ExecutionContext, input: Record<string, unknown>): Promise<ExecutionResult> {
    return {
      success: true,
      output: { result: `executed ${capabilityId}` },
      durationMs: 50,
    };
  }

  async canExecute(capabilityId: string, context: ExecutionContext): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }

  async abort(executionId: string, reason: string): Promise<boolean> {
    return true;
  }

  async getExecutionStatus(executionId: string): Promise<{ status: "pending" | "running" | "completed" | "failed" | "aborted"; result?: ExecutionResult }> {
    return { status: "completed" };
  }

  async getHealth(): Promise<AdapterHealthStatus> {
    return { healthy: true, lastCheck: Date.now(), latencyMs: 5 };
  }

  async getHealthHistory(count: number): Promise<AdapterHealthStatus[]> {
    return [{ healthy: true, lastCheck: Date.now(), latencyMs: 5 }];
  }

  async deepHealthCheck(): Promise<AdapterHealthStatus & { details: Record<string, unknown> }> {
    return { healthy: true, lastCheck: Date.now(), latencyMs: 10, details: { uptime: 1000 } };
  }

  async isReady(): Promise<boolean> {
    return true;
  }

  async initialize(config: unknown): Promise<void> {
    this.state = "initialized";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "initialized", timestamp: Date.now() });
  }

  async connect(): Promise<boolean> {
    this.state = "connected";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "connected", timestamp: Date.now() });
    return true;
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "disconnected", timestamp: Date.now() });
  }

  async suspend(): Promise<void> {
    this.state = "suspended";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "suspended", timestamp: Date.now() });
  }

  async resume(): Promise<void> {
    this.state = "connected";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "resumed", timestamp: Date.now() });
  }

  async terminate(): Promise<void> {
    this.state = "terminated";
    this.lifecycleHistory.push({ eventId: `evt-${Date.now()}`, adapterId: "mock-base-001", event: "terminated", timestamp: Date.now() });
  }

  async getLifecycleHistory(): Promise<LifecycleEvent[]> {
    return this.lifecycleHistory;
  }

  getState(): "uninitialized" | "initialized" | "connected" | "disconnected" | "suspended" | "terminated" {
    return this.state;
  }
}

// ─── Mock Adapter: Full ───────────────────────────────────────

class MockFullAdapter extends MockBaseAdapter implements FullAdapterContract {
  readonly contractVersion = CONTRACT_VERSION;

  getMetadata(): AdapterMetadata {
    return {
      adapterId: "mock-full-001",
      adapterName: "Mock Full Adapter",
      version: "1.0.0",
      vendor: "test-vendor",
      category: "ci-cd",
      description: "A mock adapter for testing FullAdapterContract",
      supportedProtocols: ["test", "webhook"],
    };
  }

  async collectEvidence(executionId: string, context: ExecutionContext): Promise<EvidenceCollection[]> {
    return [
      {
        evidenceId: `ev-${Date.now()}`,
        adapterId: "mock-full-001",
        tenantId: context.tenantId,
        type: "execution",
        claim: "Test execution completed",
        source: "mock-full-001",
        confidence: "high",
        data: { executionId },
        timestamp: Date.now(),
      },
    ];
  }

  async verifyEvidence(evidence: EvidenceCollection): Promise<{ valid: boolean; reason?: string }> {
    return { valid: true };
  }

  async getEvidence(tenantId: string, startTime: number, endTime: number): Promise<EvidenceCollection[]> {
    return [];
  }

  async getEvidenceById(evidenceId: string): Promise<EvidenceCollection | null> {
    return null;
  }

  async evaluateGovernance(context: ExecutionContext, policies: unknown[]): Promise<GovernanceDecision> {
    return {
      decisionId: `gov-${Date.now()}`,
      adapterId: "mock-full-001",
      tenantId: context.tenantId,
      decision: "allow",
      reason: "All policies passed",
      matchedPolicies: [],
      riskScore: 0.1,
      timestamp: Date.now(),
    };
  }

  async getGovernanceHistory(tenantId: string, limit: number): Promise<GovernanceDecision[]> {
    return [];
  }

  async isAllowed(action: string, context: ExecutionContext): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }

  async getConfiguration(tenantId: string): Promise<ConfigurationState> {
    return {
      adapterId: "mock-full-001",
      tenantId,
      version: 1,
      config: {},
      hash: "abc123",
      updatedAt: Date.now(),
    };
  }

  async updateConfiguration(tenantId: string, config: Record<string, unknown>): Promise<ConfigurationState> {
    return {
      adapterId: "mock-full-001",
      tenantId,
      version: 2,
      config,
      hash: "def456",
      updatedAt: Date.now(),
    };
  }

  async validateConfiguration(config: Record<string, unknown>): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  getConfigurationSchema(): Record<string, unknown> {
    return { type: "object", properties: {} };
  }

  async resetConfiguration(tenantId: string): Promise<ConfigurationState> {
    return {
      adapterId: "mock-full-001",
      tenantId,
      version: 1,
      config: {},
      hash: "reset",
      updatedAt: Date.now(),
    };
  }
}

// ─── Mock Adapter: Broken (missing methods) ───────────────────

class MockBrokenAdapter {
  readonly contractVersion = CONTRACT_VERSION;
  // Missing all required methods
}

// ─── Type Guard Tests ─────────────────────────────────────────

describe("Contract Type Guards", () => {
  const baseAdapter = new MockBaseAdapter();
  const fullAdapter = new MockFullAdapter();
  const brokenAdapter = new MockBrokenAdapter();

  describe("isCapabilityContract", () => {
    it("returns true for BaseAdapterContract", () => {
      expect(isCapabilityContract(baseAdapter)).toBe(true);
    });

    it("returns true for FullAdapterContract", () => {
      expect(isCapabilityContract(fullAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isCapabilityContract(brokenAdapter)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isCapabilityContract(null)).toBe(false);
    });

    it("returns false for primitive", () => {
      expect(isCapabilityContract("string")).toBe(false);
    });
  });

  describe("isExecutionContract", () => {
    it("returns true for BaseAdapterContract", () => {
      expect(isExecutionContract(baseAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isExecutionContract(brokenAdapter)).toBe(false);
    });
  });

  describe("isEvidenceContract", () => {
    it("returns false for BaseAdapterContract (missing evidence methods)", () => {
      expect(isEvidenceContract(baseAdapter)).toBe(false);
    });

    it("returns true for FullAdapterContract", () => {
      expect(isEvidenceContract(fullAdapter)).toBe(true);
    });
  });

  describe("isHealthContract", () => {
    it("returns true for BaseAdapterContract", () => {
      expect(isHealthContract(baseAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isHealthContract(brokenAdapter)).toBe(false);
    });
  });

  describe("isGovernanceContract", () => {
    it("returns false for BaseAdapterContract", () => {
      expect(isGovernanceContract(baseAdapter)).toBe(false);
    });

    it("returns true for FullAdapterContract", () => {
      expect(isGovernanceContract(fullAdapter)).toBe(true);
    });
  });

  describe("isConfigurationContract", () => {
    it("returns false for BaseAdapterContract", () => {
      expect(isConfigurationContract(baseAdapter)).toBe(false);
    });

    it("returns true for FullAdapterContract", () => {
      expect(isConfigurationContract(fullAdapter)).toBe(true);
    });
  });

  describe("isLifecycleContract", () => {
    it("returns true for BaseAdapterContract", () => {
      expect(isLifecycleContract(baseAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isLifecycleContract(brokenAdapter)).toBe(false);
    });
  });

  describe("isBaseAdapterContract", () => {
    it("returns true for BaseAdapterContract", () => {
      expect(isBaseAdapterContract(baseAdapter)).toBe(true);
    });

    it("returns true for FullAdapterContract (extends base)", () => {
      expect(isBaseAdapterContract(fullAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isBaseAdapterContract(brokenAdapter)).toBe(false);
    });
  });

  describe("isFullAdapterContract", () => {
    it("returns false for BaseAdapterContract", () => {
      expect(isFullAdapterContract(baseAdapter)).toBe(false);
    });

    it("returns true for FullAdapterContract", () => {
      expect(isFullAdapterContract(fullAdapter)).toBe(true);
    });

    it("returns false for broken adapter", () => {
      expect(isFullAdapterContract(brokenAdapter)).toBe(false);
    });
  });
});

// ─── ContractVerifier Tests ───────────────────────────────────

describe("ContractVerifier", () => {
  let verifier: ContractVerifier;

  beforeEach(() => {
    verifier = new ContractVerifier();
  });

  describe("verifyBaseAdapter", () => {
    it("passes for a valid BaseAdapterContract", () => {
      const result = verifier.verifyBaseAdapter("mock-base-001", new MockBaseAdapter());
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.contractName).toBe("BaseAdapterContract");
    });

    it("fails for a broken adapter", () => {
      const result = verifier.verifyBaseAdapter("broken", new MockBrokenAdapter());
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("captures metadata validation", () => {
      const badMetadata = new MockBaseAdapter();
      // Override getMetadata to return bad data
      (badMetadata as any).getMetadata = () => ({ adapterId: "", adapterName: "", version: "" });
      const result = verifier.verifyBaseAdapter("bad-meta", badMetadata);
      expect(result.passed).toBe(false);
      const adapterIdViolation = result.violations.find((v) => v.rule === "capability.metadata.adapterId");
      expect(adapterIdViolation).toBeDefined();
    });
  });

  describe("verifyFullAdapter", () => {
    it("passes for a valid FullAdapterContract", () => {
      const result = verifier.verifyFullAdapter("mock-full-001", new MockFullAdapter());
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.contractName).toBe("FullAdapterContract");
    });

    it("fails for a BaseAdapter (missing evidence/governance/config)", () => {
      const result = verifier.verifyFullAdapter("base-only", new MockBaseAdapter());
      expect(result.passed).toBe(false);
      const evidenceViolation = result.violations.find((v) => v.rule === "evidence.implements");
      expect(evidenceViolation).toBeDefined();
    });
  });
});

// ─── ContractRegistry Tests ───────────────────────────────────

describe("ContractRegistry", () => {
  let registry: ContractRegistry;

  beforeEach(() => {
    resetContractRegistry();
    registry = new ContractRegistry();
  });

  describe("register", () => {
    it("registers a valid BaseAdapterContract", () => {
      const entry = registry.register(new MockBaseAdapter());
      expect(entry.adapterId).toBe("mock-base-001");
      expect(entry.contractLevel).toBe("base");
      expect(entry.lastVerificationResult?.passed).toBe(true);
    });

    it("registers a valid FullAdapterContract", () => {
      const entry = registry.register(new MockFullAdapter());
      expect(entry.adapterId).toBe("mock-full-001");
      expect(entry.contractLevel).toBe("full");
    });

    it("throws for a broken adapter", () => {
      expect(() => registry.register(new MockBrokenAdapter() as any)).toThrow("failed contract verification");
    });

    it("overwrites existing registration", () => {
      registry.register(new MockBaseAdapter());
      const entry2 = registry.register(new MockBaseAdapter());
      expect(entry2.adapterId).toBe("mock-base-001");
      expect(registry.getCount()).toBe(1);
    });
  });

  describe("get", () => {
    it("retrieves a registered adapter", () => {
      registry.register(new MockBaseAdapter());
      const entry = registry.get("mock-base-001");
      expect(entry).toBeDefined();
      expect(entry?.adapterId).toBe("mock-base-001");
    });

    it("returns undefined for unknown adapter", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });
  });

  describe("getTyped", () => {
    it("returns a typed adapter instance", () => {
      registry.register(new MockBaseAdapter());
      const adapter = registry.getTyped<BaseAdapterContract>("mock-base-001");
      expect(adapter).toBeDefined();
      expect(adapter?.getMetadata().adapterId).toBe("mock-base-001");
    });
  });

  describe("findByContract", () => {
    it("finds base adapters", () => {
      registry.register(new MockBaseAdapter());
      registry.register(new MockFullAdapter());
      const baseAdapters = registry.findByContract("base");
      expect(baseAdapters).toHaveLength(1);
      expect(baseAdapters[0].adapterId).toBe("mock-base-001");
    });

    it("finds full adapters", () => {
      registry.register(new MockBaseAdapter());
      registry.register(new MockFullAdapter());
      const fullAdapters = registry.findByContract("full");
      expect(fullAdapters).toHaveLength(1);
      expect(fullAdapters[0].adapterId).toBe("mock-full-001");
    });
  });

  describe("findByCategory", () => {
    it("finds adapters by category", () => {
      registry.register(new MockBaseAdapter()); // custom
      registry.register(new MockFullAdapter()); // ci-cd
      const customAdapters = registry.findByCategory("custom");
      expect(customAdapters).toHaveLength(1);
    });

    it("finds all adapters with 'all' filter", () => {
      registry.register(new MockBaseAdapter());
      registry.register(new MockFullAdapter());
      const all = registry.findByCategory("all");
      expect(all).toHaveLength(2);
    });
  });

  describe("verifyAll", () => {
    it("verifies all registered adapters", () => {
      registry.register(new MockBaseAdapter());
      registry.register(new MockFullAdapter());
      const report = registry.verifyAll();
      expect(report.allPassed).toBe(true);
      expect(report.contractResults).toHaveLength(2);
      expect(report.totalViolations).toBe(0);
    });
  });

  describe("verify", () => {
    it("verifies a specific adapter", () => {
      registry.register(new MockBaseAdapter());
      const result = registry.verify("mock-base-001");
      expect(result).toBeDefined();
      expect(result?.passed).toBe(true);
    });

    it("returns null for unknown adapter", () => {
      expect(registry.verify("nonexistent")).toBeNull();
    });
  });

  describe("getSummary", () => {
    it("returns correct counts", () => {
      registry.register(new MockBaseAdapter());
      registry.register(new MockFullAdapter());
      const summary = registry.getSummary();
      expect(summary.total).toBe(2);
      expect(summary.base).toBe(1);
      expect(summary.full).toBe(1);
    });
  });

  describe("unregister", () => {
    it("removes an adapter", () => {
      registry.register(new MockBaseAdapter());
      expect(registry.has("mock-base-001")).toBe(true);
      const removed = registry.unregister("mock-base-001");
      expect(removed).toBe(true);
      expect(registry.has("mock-base-001")).toBe(false);
    });

    it("returns false for unknown adapter", () => {
      expect(registry.unregister("nonexistent")).toBe(false);
    });
  });
});

// ─── ContractNegotiator Tests ─────────────────────────────────

describe("ContractNegotiator", () => {
  let negotiator: ContractNegotiator;

  beforeEach(() => {
    resetContractNegotiator();
    negotiator = new ContractNegotiator();
  });

  describe("negotiate", () => {
    it("accepts valid base contracts", () => {
      const response = negotiator.negotiate({
        adapterId: "test-001",
        adapterVersion: "1.0.0",
        requestedContracts: ["BaseAdapterContract"],
      });
      expect(response.accepted).toBe(true);
      expect(response.acceptedContracts).toContain("BaseAdapterContract");
      expect(response.rejectedContracts).toHaveLength(0);
    });

    it("accepts valid full contracts", () => {
      const response = negotiator.negotiate({
        adapterId: "test-002",
        adapterVersion: "1.0.0",
        requestedContracts: ["FullAdapterContract"],
      });
      expect(response.accepted).toBe(true);
      expect(response.acceptedContracts).toContain("FullAdapterContract");
    });

    it("rejects unsupported contracts", () => {
      const response = negotiator.negotiate({
        adapterId: "test-003",
        adapterVersion: "1.0.0",
        requestedContracts: ["NonExistentContract"],
      });
      expect(response.accepted).toBe(false);
      expect(response.rejectedContracts).toContain("NonExistentContract");
    });

    it("rejects incompatible runtime versions", () => {
      const response = negotiator.negotiate({
        adapterId: "test-004",
        adapterVersion: "2.0.0",
        requestedContracts: ["BaseAdapterContract"],
        minRuntimeVersion: "3.0.0",
      });
      expect(response.accepted).toBe(false);
      expect(response.reason).toContain("Runtime version incompatible");
    });

    it("handles mixed accepted and rejected contracts", () => {
      const response = negotiator.negotiate({
        adapterId: "test-005",
        adapterVersion: "1.0.0",
        requestedContracts: ["BaseAdapterContract", "NonExistentContract"],
      });
      expect(response.accepted).toBe(false);
      expect(response.acceptedContracts).toContain("BaseAdapterContract");
      expect(response.rejectedContracts).toContain("NonExistentContract");
    });
  });

  describe("verifyNegotiation", () => {
    it("validates a successful negotiation", () => {
      const response = negotiator.negotiate({
        adapterId: "test-001",
        adapterVersion: "1.0.0",
        requestedContracts: ["BaseAdapterContract"],
      });
      const metadata: AdapterMetadata = {
        adapterId: "test-001",
        adapterName: "Test",
        version: "1.0.0",
        vendor: "test",
        category: "custom",
        description: "Test adapter",
        supportedProtocols: [],
      };
      const result = negotiator.verifyNegotiation(metadata, response);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("detects rejected negotiation", () => {
      const response = negotiator.negotiate({
        adapterId: "test-001",
        adapterVersion: "1.0.0",
        requestedContracts: ["NonExistentContract"],
      });
      const metadata: AdapterMetadata = {
        adapterId: "test-001",
        adapterName: "Test",
        version: "1.0.0",
        vendor: "test",
        category: "custom",
        description: "Test adapter",
        supportedProtocols: [],
      };
      const result = negotiator.verifyNegotiation(metadata, response);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe("registerContract", () => {
    it("registers a new contract", () => {
      negotiator.registerContract("CustomContract", "2.0.0");
      expect(negotiator.getContractVersion("CustomContract")).toBe("2.0.0");
    });

    it("overwrites existing contract version", () => {
      negotiator.registerContract("BaseAdapterContract", "2.0.0");
      expect(negotiator.getContractVersion("BaseAdapterContract")).toBe("2.0.0");
    });
  });
});

// ─── Version Utilities Tests ──────────────────────────────────

describe("Version Utilities", () => {
  describe("parseVersion", () => {
    it("parses valid semver", () => {
      const v = parseVersion("1.2.3");
      expect(v).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it("returns null for invalid version", () => {
      expect(parseVersion("invalid")).toBeNull();
      expect(parseVersion("1.2")).toBeNull();
      expect(parseVersion("v1.2.3")).toBeNull();
    });
  });

  describe("isMajorCompatible", () => {
    it("returns compatible for same major", () => {
      const result = isMajorCompatible("1.0.0", "1.5.0");
      expect(result.compatible).toBe(true);
    });

    it("returns incompatible for different major", () => {
      const result = isMajorCompatible("2.0.0", "1.5.0");
      expect(result.compatible).toBe(false);
    });
  });

  describe("isMinorCompatible", () => {
    it("returns compatible for adapter <= runtime minor", () => {
      const result = isMinorCompatible("1.2.0", "1.5.0");
      expect(result.compatible).toBe(true);
    });

    it("returns incompatible for adapter > runtime minor", () => {
      const result = isMinorCompatible("1.5.0", "1.2.0");
      expect(result.compatible).toBe(false);
    });

    it("returns incompatible for different major", () => {
      const result = isMinorCompatible("2.0.0", "1.0.0");
      expect(result.compatible).toBe(false);
    });
  });
});

// ─── Integration Tests ────────────────────────────────────────

describe("Integration: Register → Verify → Negotiate", () => {
  beforeEach(() => {
    resetContractRegistry();
    resetContractNegotiator();
  });

  it("full lifecycle: register base adapter, verify, negotiate", () => {
    const registry = new ContractRegistry();
    const negotiator = new ContractNegotiator();

    // 1. Register
    const entry = registry.register(new MockBaseAdapter());
    expect(entry.contractLevel).toBe("base");

    // 2. Verify
    const verification = registry.verify("mock-base-001");
    expect(verification?.passed).toBe(true);

    // 3. Negotiate
    const negotiation = negotiator.negotiate({
      adapterId: "mock-base-001",
      adapterVersion: "1.0.0",
      requestedContracts: ["BaseAdapterContract"],
    });
    expect(negotiation.accepted).toBe(true);

    // 4. Verify negotiation
    const verificationResult = negotiator.verifyNegotiation(entry.metadata, negotiation);
    expect(verificationResult.valid).toBe(true);
  });

  it("full lifecycle: register full adapter, verify all contracts", () => {
    const registry = new ContractRegistry();

    const entry = registry.register(new MockFullAdapter());
    expect(entry.contractLevel).toBe("full");

    // Verify all
    const report = registry.verifyAll();
    expect(report.allPassed).toBe(true);

    // Check summary
    const summary = registry.getSummary();
    expect(summary.full).toBe(1);
  });

  it("rejects broken adapter at registration", () => {
    const registry = new ContractRegistry();

    expect(() => registry.register(new MockBrokenAdapter() as any)).toThrow();
    expect(registry.getCount()).toBe(0);
  });

  it("supports multiple adapters", () => {
    const registry = new ContractRegistry();

    registry.register(new MockBaseAdapter());
    registry.register(new MockFullAdapter());

    expect(registry.getCount()).toBe(2);
    expect(registry.findByContract("base")).toHaveLength(1);
    expect(registry.findByContract("full")).toHaveLength(1);
    expect(registry.findByCategory("custom")).toHaveLength(1);
    expect(registry.findByCategory("ci-cd")).toHaveLength(1);
  });
});
