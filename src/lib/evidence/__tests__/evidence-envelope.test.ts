// src/lib/evidence/__tests__/evidence-envelope.test.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Evidence Envelope Test Suite
// Tests hashing, signing, storage, tamper detection, and integration.
// ───────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from "vitest";
import {
  buildUnsignedEnvelope,
  type UnsignedEnvelope,
  type ExecutionEnvelope,
} from "../envelope";
import { hashExecutionEnvelope, verifyEnvelopeHash } from "../hashing";
import {
  NodeCryptoEvidenceSigner,
  signEnvelope,
} from "../signer";
import {
  InMemoryEvidenceLedger,
  buildLedgerEntry,
} from "../ledger";

// ─── Test Helpers ─────────────────────────────────────────────

function makeTestEnvelope(overrides?: Partial<UnsignedEnvelope>): UnsignedEnvelope {
  return buildUnsignedEnvelope({
    tenant_id: "tenant-test-001",
    capability_id: "capability-test-001",
    agent_id: "agent-test-001",
    prompt: "Test prompt for evidence envelope",
    tools: ["tool-a", "tool-b"],
    model_id: "claude-3-sonnet-20250514",
    provider: "anthropic",
    routing_reason: "cost optimization",
    ...overrides,
  });
}

// ─── Envelope Type Tests ──────────────────────────────────────

describe("ExecutionEnvelope Types", () => {
  it("buildUnsignedEnvelope creates a valid envelope", () => {
    const envelope = makeTestEnvelope();
    expect(envelope.envelope_id).toBeDefined();
    expect(envelope.tenant_id).toBe("tenant-test-001");
    expect(envelope.capability_id).toBe("capability-test-001");
    expect(envelope.request.prompt).toBe("Test prompt for evidence envelope");
    expect(envelope.request.tools).toEqual(["tool-a", "tool-b"]);
    expect(envelope.selected_model.model_id).toBe("claude-3-sonnet-20250514");
    expect(envelope.policy_decision.decision).toBe("allow");
    expect(envelope.validation.passed).toBe(true);
  });

  it("each envelope gets a unique ID", () => {
    const e1 = makeTestEnvelope();
    const e2 = makeTestEnvelope();
    expect(e1.envelope_id).not.toBe(e2.envelope_id);
  });

  it("supports custom overrides", () => {
    const envelope = makeTestEnvelope({
      tenant_id: "custom-tenant",
      capability_id: "custom-capability",
      agent_id: "custom-agent",
      goal_id: "custom-goal",
    });
    expect(envelope.tenant_id).toBe("custom-tenant");
    expect(envelope.capability_id).toBe("custom-capability");
    expect(envelope.agent_id).toBe("custom-agent");
    expect(envelope.goal_id).toBe("custom-goal");
  });
});

// ─── Hashing Tests ────────────────────────────────────────────

describe("Envelope Hashing", () => {
  it("hashes deterministically (same input → same hash)", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).toBe(hash2);
  });

  it("produces a 64-character hex string", () => {
    const envelope = makeTestEnvelope();
    const hash = hashExecutionEnvelope(envelope);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("different input → different hash", () => {
    const e1 = makeTestEnvelope({ prompt: "Prompt A" });
    const e2 = makeTestEnvelope({ prompt: "Prompt B" });
    const hash1 = hashExecutionEnvelope(e1);
    const hash2 = hashExecutionEnvelope(e2);
    expect(hash1).not.toBe(hash2);
  });

  it("changing request stage changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.request.prompt = "Modified prompt";
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("changing output stage changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.output.text = "Modified output";
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("changing validation stage changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.validation.validation_score = 0.5;
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("changing tool_calls changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.tool_calls = [{
      tool_name: "new-tool",
      input: {},
      output: {},
      duration_ms: 100,
      success: true,
      timestamp: new Date(),
    }];
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("changing model selection changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.selected_model.model_id = "gpt-4";
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("changing policy decision changes hash", () => {
    const envelope = makeTestEnvelope();
    const hash1 = hashExecutionEnvelope(envelope);

    envelope.policy_decision.decision = "deny";
    const hash2 = hashExecutionEnvelope(envelope);
    expect(hash1).not.toBe(hash2);
  });

  it("verifyEnvelopeHash returns true for valid hash", () => {
    const envelope = makeTestEnvelope();
    const hash = hashExecutionEnvelope(envelope);
    const signed: ExecutionEnvelope = {
      ...envelope,
      envelope_hash: hash,
      digital_signature: "",
      signing_key_id: "",
      created_at: new Date(),
      signed_at: new Date(),
    };
    expect(verifyEnvelopeHash(signed)).toBe(true);
  });

  it("verifyEnvelopeHash returns false for tampered hash", () => {
    const envelope = makeTestEnvelope();
    const hash = hashExecutionEnvelope(envelope);
    const signed: ExecutionEnvelope = {
      ...envelope,
      envelope_hash: hash.substring(0, 63) + "0", // tamper last char
      digital_signature: "",
      signing_key_id: "",
      created_at: new Date(),
      signed_at: new Date(),
    };
    expect(verifyEnvelopeHash(signed)).toBe(false);
  });
});

// ─── Signing Tests ────────────────────────────────────────────

describe("Evidence Signing", () => {
  let signer: NodeCryptoEvidenceSigner;

  beforeEach(() => {
    signer = new NodeCryptoEvidenceSigner();
  });

  it("sign and verify succeeds", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    expect(signed.envelope_hash).toBeDefined();
    expect(signed.digital_signature).toBeDefined();
    expect(signed.signing_key_id).toBeDefined();
    expect(signed.created_at).toBeInstanceOf(Date);
    expect(signed.signed_at).toBeInstanceOf(Date);

    const isValid = await signer.verify(signed);
    expect(isValid).toBe(true);
  });

  it("signature is unique per different content", async () => {
    const e1 = makeTestEnvelope({ prompt: "First prompt" });
    const e2 = makeTestEnvelope({ prompt: "Second prompt" });

    const s1 = await signEnvelope(e1, signer);
    const s2 = await signEnvelope(e2, signer);

    expect(s1.digital_signature).not.toBe(s2.digital_signature);
    expect(s1.envelope_hash).not.toBe(s2.envelope_hash);
  });

  it("signature is base64-encoded", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    // Base64 regex check
    expect(signed.digital_signature).toMatch(
      /^[A-Za-z0-9+/]+=*$/,
    );
  });

  it("signing_key_id starts with ed25519-", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);
    expect(signed.signing_key_id).toMatch(/^ed25519-/);
  });

  it("verify fails if signature is tampered", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    // Tamper with signature
    const tampered = {
      ...signed,
      digital_signature: signed.digital_signature.slice(0, -4) + "XXXX",
    };

    const isValid = await signer.verify(tampered);
    expect(isValid).toBe(false);
  });

  it("verify fails if hash is tampered", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    // Tamper with hash
    const tampered = {
      ...signed,
      envelope_hash: signed.envelope_hash.substring(0, 63) + "0",
    };

    const isValid = await signer.verify(tampered);
    expect(isValid).toBe(false);
  });

  it("verify fails if content is tampered", async () => {
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    // Tamper with content but keep original hash/signature
    const tampered = {
      ...signed,
      output: { ...signed.output, text: "TAMPERED" },
    };

    const isValid = await signer.verify(tampered);
    expect(isValid).toBe(false);
  });

  it("getPublicKey returns a hex string", async () => {
    const publicKey = await signer.getPublicKey();
    expect(publicKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("different signers produce different keys", async () => {
    const signer2 = new NodeCryptoEvidenceSigner();
    const pk1 = await signer.getPublicKey();
    const pk2 = await signer2.getPublicKey();
    expect(pk1).not.toBe(pk2);
  });
});

// ─── Ledger Storage Tests ─────────────────────────────────────

describe("Evidence Ledger Storage", () => {
  let ledger: InMemoryEvidenceLedger;

  beforeEach(() => {
    ledger = new InMemoryEvidenceLedger();
  });

  it("append and retrieve envelope", async () => {
    const envelope = makeTestEnvelope();
    await ledger.append(envelope);

    const retrieved = await ledger.get(envelope.envelope_id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.envelope_id).toBe(envelope.envelope_id);
  });

  it("returns null for unknown envelope", async () => {
    const result = await ledger.get("nonexistent-id");
    expect(result).toBeNull();
  });

  it("append-only: does not overwrite existing", async () => {
    const envelope = makeTestEnvelope();
    await ledger.append(envelope);

    // Append same ID with different content
    const tampered = { ...envelope, output: { ...envelope.output, text: "HACKED" } };
    await ledger.append(tampered);

    // Count should be 2
    expect(await ledger.count()).toBe(2);
  });

  it("query by tenant", async () => {
    const e1 = makeTestEnvelope({ tenant_id: "tenant-a" });
    const e2 = makeTestEnvelope({ tenant_id: "tenant-b" });
    await ledger.append(e1);
    await ledger.append(e2);

    const results = await ledger.query({ tenantId: "tenant-a" });
    expect(results).toHaveLength(1);
    expect(results[0].tenant_id).toBe("tenant-a");
  });

  it("query by capability", async () => {
    const e1 = makeTestEnvelope({ capability_id: "cap-1" });
    const e2 = makeTestEnvelope({ capability_id: "cap-2" });
    await ledger.append(e1);
    await ledger.append(e2);

    const results = await ledger.query({ capabilityId: "cap-1" });
    expect(results).toHaveLength(1);
    expect(results[0].capability_id).toBe("cap-1");
  });

  it("query by agent", async () => {
    const e1 = makeTestEnvelope({ agent_id: "agent-1" });
    const e2 = makeTestEnvelope({ agent_id: "agent-2" });
    await ledger.append(e1);
    await ledger.append(e2);

    const results = await ledger.query({ agentId: "agent-1" });
    expect(results).toHaveLength(1);
    expect(results[0].agent_id).toBe("agent-1");
  });

  it("query with limit", async () => {
    for (let i = 0; i < 10; i++) {
      await ledger.append(makeTestEnvelope());
    }

    const results = await ledger.query({ limit: 3 });
    expect(results).toHaveLength(3);
  });

  it("query returns all when no filter", async () => {
    await ledger.append(makeTestEnvelope());
    await ledger.append(makeTestEnvelope());
    await ledger.append(makeTestEnvelope());

    const results = await ledger.query({});
    expect(results).toHaveLength(3);
  });

  it("count returns correct count", async () => {
    expect(await ledger.count()).toBe(0);
    await ledger.append(makeTestEnvelope());
    expect(await ledger.count()).toBe(1);
    await ledger.append(makeTestEnvelope());
    expect(await ledger.count()).toBe(2);
  });

  it("clear resets the ledger", async () => {
    await ledger.append(makeTestEnvelope());
    await ledger.append(makeTestEnvelope());
    expect(await ledger.count()).toBe(2);

    ledger.clear();
    expect(await ledger.count()).toBe(0);
  });
});

// ─── Ledger Entry Builder Tests ───────────────────────────────

describe("Evidence Ledger Entry Builder", () => {
  it("builds a ledger entry from a signed envelope", async () => {
    const signer = new NodeCryptoEvidenceSigner();
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    const entry = buildLedgerEntry(signed, true);
    expect(entry.action).toBe("gate_evaluation");
    expect(entry.evidence_type).toBe("execution_envelope");
    expect(entry.envelope?.envelope_id).toBe(signed.envelope_id);
    expect(entry.envelope_id).toBe(signed.envelope_id);
    expect(entry.is_cryptographically_verified).toBe(true);
    expect(entry.verification_timestamp).toBeInstanceOf(Date);
    expect(entry.created_at).toBeInstanceOf(Date);
  });

  it("builds an unverified entry", async () => {
    const signer = new NodeCryptoEvidenceSigner();
    const envelope = makeTestEnvelope();
    const signed = await signEnvelope(envelope, signer);

    const entry = buildLedgerEntry(signed, false);
    expect(entry.is_cryptographically_verified).toBe(false);
    expect(entry.verification_timestamp).toBeUndefined();
  });
});

// ─── Full Integration Test ────────────────────────────────────

describe("Full Integration: Build → Hash → Sign → Store → Retrieve → Verify", () => {
  let signer: NodeCryptoEvidenceSigner;
  let ledger: InMemoryEvidenceLedger;

  beforeEach(() => {
    signer = new NodeCryptoEvidenceSigner();
    ledger = new InMemoryEvidenceLedger();
  });

  it("complete lifecycle", async () => {
    // 1. Build unsigned envelope
    const unsigned = makeTestEnvelope({
      tenant_id: "integration-tenant",
      capability_id: "integration-capability",
      prompt: "Integration test prompt",
    });

    // 2. Hash
    const hash = hashExecutionEnvelope(unsigned);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);

    // 3. Sign
    const signed = await signEnvelope(unsigned, signer);
    expect(signed.envelope_hash).toBe(hash);
    expect(signed.digital_signature).toBeDefined();

    // 4. Store
    await ledger.append(signed);
    expect(await ledger.count()).toBe(1);

    // 5. Retrieve
    const retrieved = await ledger.get(signed.envelope_id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.envelope_id).toBe(signed.envelope_id);

    // 6. Verify signature
    const isValid = await signer.verify(retrieved!);
    expect(isValid).toBe(true);

    // 7. Verify hash
    const hashValid = verifyEnvelopeHash(retrieved!);
    expect(hashValid).toBe(true);

    // 8. Build ledger entry
    const entry = buildLedgerEntry(retrieved!, isValid);
    expect(entry.is_cryptographically_verified).toBe(true);
    expect(entry.envelope_id).toBe(signed.envelope_id);
  });

  it("tamper detection: modify output → verify fails", async () => {
    const unsigned = makeTestEnvelope();
    const signed = await signEnvelope(unsigned, signer);
    await ledger.append(signed);

    // Retrieve and tamper
    const retrieved = await ledger.get(signed.envelope_id)!;
    const tampered = { ...retrieved!, output: { ...retrieved!.output, text: "TAMPERED" } };

    // Verify should fail
    const isValid = await signer.verify(tampered);
    expect(isValid).toBe(false);
  });

  it("tamper detection: modify hash → verify fails", async () => {
    const unsigned = makeTestEnvelope();
    const signed = await signEnvelope(unsigned, signer);
    await ledger.append(signed);

    const retrieved = await ledger.get(signed.envelope_id)!;
    const tampered = {
      ...retrieved!,
      envelope_hash: retrieved!.envelope_hash.substring(0, 63) + "0",
    };

    const isValid = await signer.verify(tampered);
    expect(isValid).toBe(false);
  });

  it("query works across multiple tenants", async () => {
    const e1 = await signEnvelope(
      makeTestEnvelope({ tenant_id: "tenant-1" }),
      signer,
    );
    const e2 = await signEnvelope(
      makeTestEnvelope({ tenant_id: "tenant-2" }),
      signer,
    );
    const e3 = await signEnvelope(
      makeTestEnvelope({ tenant_id: "tenant-1" }),
      signer,
    );

    await ledger.append(e1);
    await ledger.append(e2);
    await ledger.append(e3);

    const tenant1Results = await ledger.query({ tenantId: "tenant-1" });
    expect(tenant1Results).toHaveLength(2);

    const tenant2Results = await ledger.query({ tenantId: "tenant-2" });
    expect(tenant2Results).toHaveLength(1);
  });
});
