// src/lib/evidence/__tests__/gate-integration.test.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Gate Integration Tests
// Tests the EnvelopeEmittingGate wrapper with mock gate results.
// ───────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from "vitest";
import { NodeCryptoEvidenceSigner, signEnvelope } from "../signer";
import { InMemoryEvidenceLedger } from "../ledger";
import { hashExecutionEnvelope, verifyEnvelopeHash } from "../hashing";
import { EnvelopeEmittingGate, type PolicyGateResult, type ExecutionGateResult } from "../gate-envelope";
import { buildUnsignedEnvelope } from "../envelope";

describe("EnvelopeEmittingGate", () => {
  let signer: NodeCryptoEvidenceSigner;
  let ledger: InMemoryEvidenceLedger;
  let gate: EnvelopeEmittingGate;

  beforeEach(() => {
    signer = new NodeCryptoEvidenceSigner();
    ledger = new InMemoryEvidenceLedger();
    gate = new EnvelopeEmittingGate(signer, ledger);
  });

  describe("emitPolicyEnvelope", () => {
    it("emits a signed envelope for an allowed policy result", async () => {
      const result: PolicyGateResult = {
        allowed: true,
        riskScore: 10,
        violations: [],
        latencyMs: 50,
      };

      const envelope = await gate.emitPolicyEnvelope({
        tenantId: "tenant-001",
        capabilityId: "policy-eval",
        prompt: "Evaluate this transaction",
        result,
        matchedPolicies: ["rate_limit", "spending_cap"],
        policyExplanation: "All policies passed",
      });

      expect(envelope.envelope_id).toBeDefined();
      expect(envelope.tenant_id).toBe("tenant-001");
      expect(envelope.policy_decision.decision).toBe("allow");
      expect(envelope.validation.passed).toBe(true);
      expect(envelope.envelope_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(envelope.digital_signature).toBeDefined();
      expect(envelope.signing_key_id).toMatch(/^ed25519-/);

      // Verify signature
      const isValid = await signer.verify(envelope);
      expect(isValid).toBe(true);
    });

    it("emits a signed envelope for a denied policy result", async () => {
      const result: PolicyGateResult = {
        allowed: false,
        reason: "Rate limit exceeded",
        riskScore: 85,
        violations: [
          {
            ruleId: "rate_limit",
            ruleType: "rate_limit",
            severity: "block",
            message: "Too many requests",
          },
        ],
        latencyMs: 30,
      };

      const envelope = await gate.emitPolicyEnvelope({
        tenantId: "tenant-002",
        capabilityId: "policy-eval-denied",
        prompt: "Denied transaction",
        result,
        matchedPolicies: ["rate_limit"],
      });

      expect(envelope.policy_decision.decision).toBe("deny");
      expect(envelope.policy_decision.denied_by).toContain("rate_limit");
      expect(envelope.validation.passed).toBe(false);
    });

    it("stores envelope in ledger", async () => {
      const result: PolicyGateResult = {
        allowed: true,
        riskScore: 5,
        violations: [],
        latencyMs: 20,
      };

      const envelope = await gate.emitPolicyEnvelope({
        tenantId: "tenant-ledger",
        capabilityId: "ledger-test",
        prompt: "Test ledger storage",
        result,
        matchedPolicies: [],
      });

      const retrieved = await gate.getLedger().get(envelope.envelope_id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.envelope_id).toBe(envelope.envelope_id);
    });
  });

  describe("emitExecutionEnvelope", () => {
    it("emits a signed envelope for a passed execution", async () => {
      const result: ExecutionGateResult = {
        allowed: true,
        verificationStatus: "verified",
        violations: [],
        latencyMs: 100,
      };

      const envelope = await gate.emitExecutionEnvelope({
        tenantId: "tenant-exec-001",
        capabilityId: "exec-contract",
        agentId: "agent-001",
        prompt: "Execute code review",
        result,
        evidence: {
          typecheck: { passed: true, errorCount: 0 },
          lint: { passed: true, errorCount: 0 },
        },
      });

      expect(envelope.envelope_id).toBeDefined();
      expect(envelope.agent_id).toBe("agent-001");
      expect(envelope.validation.passed).toBe(true);
      expect(envelope.validation.validation_method).toBe("execution_contract");

      const isValid = await signer.verify(envelope);
      expect(isValid).toBe(true);
    });

    it("emits a signed envelope for a failed execution", async () => {
      const result: ExecutionGateResult = {
        allowed: false,
        verificationStatus: "rejected",
        reason: "Typecheck failed",
        violations: [
          {
            ruleId: "evidence_typecheck",
            severity: "block",
            message: "Typecheck failed with 5 errors",
          },
        ],
        latencyMs: 80,
      };

      const envelope = await gate.emitExecutionEnvelope({
        tenantId: "tenant-exec-002",
        capabilityId: "exec-contract-fail",
        agentId: "agent-002",
        prompt: "Failed execution",
        result,
      });

      expect(envelope.validation.passed).toBe(false);
      expect(envelope.validation.validation_score).toBe(0);
    });
  });

  describe("ledger isolation", () => {
    it("multiple envelopes are stored and queryable", async () => {
      const r1: PolicyGateResult = { allowed: true, riskScore: 10, violations: [], latencyMs: 10 };
      const r2: PolicyGateResult = { allowed: false, riskScore: 90, violations: [], latencyMs: 20 };

      await gate.emitPolicyEnvelope({
        tenantId: "tenant-a",
        capabilityId: "cap-1",
        prompt: "First",
        result: r1,
        matchedPolicies: [],
      });

      await gate.emitPolicyEnvelope({
        tenantId: "tenant-b",
        capabilityId: "cap-2",
        prompt: "Second",
        result: r2,
        matchedPolicies: [],
      });

      const all = await gate.getLedger().query({});
      expect(all).toHaveLength(2);

      const tenantA = await gate.getLedger().query({ tenantId: "tenant-a" });
      expect(tenantA).toHaveLength(1);
    });
  });
});

describe("End-to-End: Gate → Envelope → Ledger → Verify", () => {
  it("complete flow with tamper detection", async () => {
    const signer = new NodeCryptoEvidenceSigner();
    const ledger = new InMemoryEvidenceLedger();
    const gate = new EnvelopeEmittingGate(signer, ledger);

    // 1. Gate evaluates
    const gateResult: PolicyGateResult = {
      allowed: true,
      riskScore: 5,
      violations: [],
      latencyMs: 25,
    };

    // 2. Emit envelope
    const envelope = await gate.emitPolicyEnvelope({
      tenantId: "e2e-tenant",
      capabilityId: "e2e-capability",
      prompt: "E2E test prompt",
      result: gateResult,
      matchedPolicies: ["spending_cap"],
    });

    // 3. Verify hash
    expect(verifyEnvelopeHash(envelope)).toBe(true);

    // 4. Verify signature
    expect(await signer.verify(envelope)).toBe(true);

    // 5. Retrieve from ledger
    const retrieved = await ledger.get(envelope.envelope_id);
    expect(retrieved).toBeDefined();

    // 6. Tamper detection: modify output
    const tampered = {
      ...retrieved!,
      output: { ...retrieved!.output, text: "TAMPERED" },
    };
    expect(await signer.verify(tampered)).toBe(false);

    // 7. Tamper detection: modify hash
    const tamperedHash = {
      ...retrieved!,
      envelope_hash: retrieved!.envelope_hash.substring(0, 63) + "0",
    };
    expect(await signer.verify(tamperedHash)).toBe(false);
  });
});
