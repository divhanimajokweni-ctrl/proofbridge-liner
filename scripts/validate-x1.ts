#!/usr/bin/env npx tsx
// ============================================================================
// X₁ Constitutional Validation Harness
// ============================================================================
// This script is the ultimate gatekeeper. It runs the happy path, executes
// negative tests to prove fail-closed boundaries, and emits a signed evidence
// artifact. If any check fails, the script exits with non-zero, blocking CI.
//
// Invocation: npx tsx scripts/validate-x1.ts
// Output:     evidence/VAL-YYYY-MM-DD-XXXXX.json  (signed artifact)
// ============================================================================

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { sign, createHash, generateKeyPairSync } from "crypto";
import { resolve } from "path";
import {
  EnvelopeEncryptionEngine,
  generateMasterKeyPair,
} from "../src/lib/crypto/envelope";
import { InMemoryEventStore } from "../src/lib/trust-runtime/event-store";
import { DefaultCommandHandler } from "../src/lib/trust-runtime/command-handler";
import { reduceBatch, createInitialState } from "../src/lib/trust-runtime/reducer";
import {
  buildColonyProjection,
  buildAllProjections,
} from "../src/lib/trust-runtime/projection-manager";
import { TrustRuntime, resetRuntime, getRuntime } from "../src/lib/trust-runtime/runtime";
import { isValidTransition } from "../src/lib/trust-runtime/types";
import type {
  Command,
  RuntimeEvent,
  KernelState,
  RuntimeState,
} from "../src/lib/trust-runtime/types";

// ---------------------------------------------------------------------------
// Canonical JSON (deterministic, key-sorted)
// ---------------------------------------------------------------------------

function canonicalize(obj: unknown): string {
  if (typeof obj !== "object" || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) =>
      JSON.stringify(k) +
      ":" +
      canonicalize((obj as Record<string, unknown>)[k]),
  );
  return "{" + pairs.join(",") + "}";
}

// ---------------------------------------------------------------------------
// Validation Artifact Schema
// ---------------------------------------------------------------------------

interface ValidationArtifact {
  runId: string;
  constitutionVersion: string;
  commit: string;
  timestamp: string;
  results: Record<string, "PASS" | "FAIL">;
  summary: { passed: number; failed: number; total: number };
  signature: string;
}

// ---------------------------------------------------------------------------
// X₁ Constitutional Validation Harness
// ---------------------------------------------------------------------------

class X1ValidationHarness {
  private results: Record<string, "PASS" | "FAIL"> = {};
  private systemKeyPair: { publicKey: string; privateKey: string };

  constructor() {
    // Generate ephemeral Ed25519 key pair for signing the evidence artifact
    const kp = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    this.systemKeyPair = {
      publicKey: kp.publicKey.toString(),
      privateKey: kp.privateKey.toString(),
    };
  }

  async execute(): Promise<boolean> {
    const runId = `VAL-${new Date().toISOString().split("T")[0]}-${Math.random().toString(36).slice(2, 7)}`;
    const commit = (() => {
      try {
        return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
      } catch {
        return "unknown";
      }
    })();

    console.log(`\n🔐 X₁ Constitutional Validation — ${runId}`);
    console.log(`   Constitution: x0/v1.0.0  |  Commit: ${commit}\n`);

    // =====================================================================
    // PHASE 1: Happy Path Tests
    // =====================================================================
    console.log("── Phase 1: Happy Path ──");

    await this.test("HappyPath_AppendAndProject", async () => {
      resetRuntime();
      const rt = getRuntime();

      await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "x1-happy-1",
        evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
      });

      const p = rt.getProjections();
      if (p.ui.sequence !== 1) throw new Error(`Expected seq=1, got ${p.ui.sequence}`);
      if (p.ui.evidenceLeaves.length !== 1) throw new Error("Expected 1 evidence leaf");
      if (p.colony.canopyLeafCount !== 1) throw new Error("Colony should have 1 leaf");
      if (p.colony.activeCarriers !== 2) throw new Error("INGESTING → 2 carriers expected");
      return true;
    });

    await this.test("HappyPath_FullFlow", async () => {
      resetRuntime();
      const rt = getRuntime();

      // Evidence → Verify → Commit → Confirm
      await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "x1-full-1",
        evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
      });
      await rt.dispatch({
        type: "VerifyAttestation",
        receiptId: "r1",
        platform: "AMD SEV-SNP",
      });
      await rt.dispatch({
        type: "CommitReceipt",
        receipt: {
          receiptId: "r1",
          receiptHash: "0xh1",
          envelopeHash: "0xh2",
          signature: "sig1",
          chainHash: "0xchain",
        },
      });
      await rt.dispatch({
        type: "ConfirmLedger",
        seq: 1,
        blockHeight: "#100",
      });

      const p = rt.getProjections();
      if (p.ui.kernelState !== "SETTLED") throw new Error(`Expected SETTLED, got ${p.ui.kernelState}`);
      if (p.ui.epoch !== 2) throw new Error(`Expected epoch=2, got ${p.ui.epoch}`);
      if (p.ui.receipts.length !== 1) throw new Error("Expected 1 receipt");
      if (p.ui.evidenceLeaves[0].verified !== true) throw new Error("Evidence should be verified");
      if (p.ui.hashChainIntact !== true) throw new Error("Hash chain should be intact");
      return true;
    });

    await this.test("HappyPath_EnvelopeRoundTrip", () => {
      const engine = new EnvelopeEncryptionEngine(generateMasterKeyPair());
      const signerKp = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const envelope = engine.sealEnvelope(
        {
          eventId: "evt-001",
          streamId: "stream-alpha",
          tenantId: "tenant-1",
          sequence: 1,
          eventType: "EvidenceReceived",
          schemaVersion: 1,
        },
        { claim: "c1", source: "s1", confidence: "high" },
        signerKp.privateKey.toString(),
        signerKp.publicKey.toString(),
      );

      // Verify header contains payloadHash
      if (!envelope.header.payloadHash) throw new Error("Missing payloadHash");
      if (envelope.header.payloadHash.length !== 64) throw new Error("payloadHash should be SHA-256 hex");

      // Verify integrity without decryption
      const intact = engine.verifyIntegrity(envelope);
      if (!intact) throw new Error("Integrity check failed");

      // Verify decrypt produces original payload
      const plaintext = engine.unsealEnvelope(envelope);
      if (!plaintext.includes("c1")) throw new Error("Decrypted payload should contain claim");

      // Verify tampered header fails integrity check
      const tampered = { ...envelope, header: { ...envelope.header, sequence: 999 } };
      const tamperedCheck = engine.verifyIntegrity(tampered);
      if (tamperedCheck) throw new Error("Tampered envelope should fail integrity check");
      return true;
    });

    await this.test("HappyPath_DeterministicProjection", () => {
      const state: RuntimeState = {
        ...createInitialState(),
        kernelState: "VERIFYING",
        trust: 0.85,
        sigma: 0.04,
        confidence: 72,
        sequence: 14,
        epoch: 3,
        quorum: { pass: 8, total: 10 },
        evidenceLeaves: [
          { id: "l1", claim: "c1", source: "s1", confidence: "high", tags: [], verified: true, addedAt: 1000 },
          { id: "l2", claim: "c2", source: "s2", confidence: "medium", tags: [], verified: false, addedAt: 2000 },
        ],
        receipts: [],
        hashChainIntact: true,
        circuitBreakerOpen: false,
        hazardReason: null,
        lastError: null,
        startedAt: 0,
        lastEventAt: 5000,
      };

      const c1 = buildColonyProjection(state);
      const c2 = buildColonyProjection(state);
      if (c1.activeCarriers !== c2.activeCarriers) throw new Error("Non-deterministic activeCarriers");
      if (c1.canopyLeafCount !== c2.canopyLeafCount) throw new Error("Non-deterministic canopyLeafCount");
      if (c1.sentinelPatrolIntensity !== c2.sentinelPatrolIntensity) throw new Error("Non-deterministic sentinelPatrolIntensity");
      return true;
    });

    // =====================================================================
    // PHASE 2: Negative Tests (Fail-Closed Verification)
    // =====================================================================
    console.log("── Phase 2: Negative Tests (Fail-Closed) ──");

    await this.test("Negative_InvalidSignature", async () => {
      resetRuntime();
      const rt = getRuntime();
      const store = rt.store;

      // Manually create an event with a fake eventId that doesn't match
      const realEvent = (await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "neg-inv-1",
        evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
      }))[0];
      if (!realEvent) throw new Error("Expected at least 1 event");

      // The event store itself doesn't verify signatures — that's the envelope layer.
      // The fail-closed guarantee is at the envelope level.
      // Verify the envelope layer correctly rejects tampered events.

      const engine = new EnvelopeEncryptionEngine(generateMasterKeyPair());
      const signerKp = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const envelope = engine.sealEnvelope(
        { eventId: "evt-001", streamId: "s1", tenantId: "t1", sequence: 1, eventType: "TestEvent", schemaVersion: 1 },
        { data: "test" },
        signerKp.privateKey.toString(),
        signerKp.publicKey.toString(),
      );

      // Tamper with the payload
      const tampered: typeof envelope = {
        ...envelope,
        ciphertext: Buffer.from("tampered").toString("base64"),
      };

      let caught = false;
      try {
        engine.unsealEnvelope(tampered);
      } catch {
        caught = true;
      }
      if (!caught) throw new Error("Tampered envelope should throw on unseal");

      // verifyIntegrity should also reject header tampering
      const headerTampered = { ...envelope, header: { ...envelope.header, sequence: 999 } };
      const integrityPass = engine.verifyIntegrity(headerTampered);
      if (integrityPass) throw new Error("Header-tampered envelope should fail verifyIntegrity");

      return true;
    });

    await this.test("Negative_IllegalStateTransition", async () => {
      // Verify that IDLE → HAZARD is rejected
      const illegal = isValidTransition("IDLE" as KernelState, "HAZARD" as KernelState);
      if (illegal) throw new Error("IDLE → HAZARD should be illegal");

      // Verify that IDLE → INGESTING is accepted
      const legal = isValidTransition("IDLE" as KernelState, "INGESTING" as KernelState);
      if (!legal) throw new Error("IDLE → INGESTING should be legal");

      // Verify runtime rejects illegal transitions
      resetRuntime();
      const rt = getRuntime();
      const events = await rt.dispatch({
        type: "TriggerCircuitBreaker",
        action: "open",
        reason: "test-illegal",
      });

      // The command handler produces the event, but the reducer should
      // silently ignore it — IDLE → HAZARD is not allowed
      const p = rt.getProjections();
      if (p.ui.circuitBreakerOpen) throw new Error("Circuit breaker should not open from IDLE");
      if (p.ui.kernelState !== "IDLE") throw new Error("Kernel should remain IDLE after illegal transition");
      return true;
    });

    await this.test("Negative_DuplicateIdempotency", async () => {
      resetRuntime();
      const rt = getRuntime();

      // Submit same evidence twice with same idempotencyKey
      const r1 = await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "dup-key",
        evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
      });
      const r2 = await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "dup-key",
        evidence: { claim: "c2", source: "s2", confidence: "low", tags: [] },
      });

      if (r1.length !== 1) throw new Error("First dispatch should produce 1 event");
      if (r2.length !== 0) throw new Error("Duplicate dispatch should produce 0 events (idempotent)");
      if (rt.getProjections().ui.evidenceLeaves.length !== 1) throw new Error("Should have only 1 evidence leaf");
      return true;
    });

    await this.test("Negative_EmptyCommand", async () => {
      resetRuntime();
      const rt = getRuntime();
      const store = rt.store;

      // The command handler should reject an incomplete SubmitEvidence
      const cmd = {
        type: "SubmitEvidence" as const,
        idempotencyKey: "incomplete",
        // Missing `evidence` field — TS would catch at compile time,
        // but at runtime this is just undefined
      } as unknown as Command;

      let caught = false;
      try {
        await rt.dispatch(cmd);
      } catch {
        caught = true;
      }
      // The command handler may or may not throw — but no event should be stored
      const storeSize = await store.size();
      if (storeSize !== 0) throw new Error("Incomplete command should not produce stored events");
      return true;
    });

    // =====================================================================
    // PHASE 3: Governance & Replay Tests
    // =====================================================================
    console.log("── Phase 3: Governance & Replay ──");

    await this.test("Replay_DeterministicState", async () => {
      resetRuntime();
      const rt = getRuntime();

      // Dispatch 100 events in sequence
      for (let i = 1; i <= 100; i++) {
        await rt.dispatch({
          type: "SubmitEvidence",
          idempotencyKey: `replay-x1-${i}`,
          evidence: {
            claim: `claim-${i}`,
            source: `source-${i % 4}`,
            confidence: i % 3 === 0 ? "low" : i % 3 === 1 ? "medium" : "high",
            tags: [],
          },
        });
      }

      // Capture pre-reset state
      const stateBefore = rt.getState();
      const events = await rt.store.readFrom(1);
      if (events.length !== 100) throw new Error(`Expected 100 events, got ${events.length}`);

      // Replay into fresh state
      const replayed = reduceBatch(createInitialState(), events);

      // Verify exact match
      if (replayed.sequence !== stateBefore.sequence) throw new Error("Sequence mismatch on replay");
      if (replayed.kernelState !== stateBefore.kernelState) throw new Error("KernelState mismatch on replay");
      if (replayed.evidenceLeaves.length !== stateBefore.evidenceLeaves.length) throw new Error("EvidenceLeaves count mismatch on replay");
      if (Math.abs(replayed.trust - stateBefore.trust) > 0.001) throw new Error("Trust mismatch on replay");

      // Verify deterministic hash of the replayed state
      const stateHash = createHash("sha256")
        .update(JSON.stringify({ sequence: replayed.sequence, evidenceCount: replayed.evidenceLeaves.length, trust: replayed.trust, confidence: replayed.confidence }))
        .digest("hex");

      // Replay again and verify identical hash
      const replayed2 = reduceBatch(createInitialState(), events);
      const stateHash2 = createHash("sha256")
        .update(JSON.stringify({ sequence: replayed2.sequence, evidenceCount: replayed2.evidenceLeaves.length, trust: replayed2.trust, confidence: replayed2.confidence }))
        .digest("hex");

      if (stateHash !== stateHash2) throw new Error("Replay determinism violated: state hash differs between runs");
      return true;
    });

    await this.test("Replay_CircuitBreakerCycle", async () => {
      resetRuntime();
      const rt = getRuntime();

      // Get into VERIFYING state (permits HAZARD)
      await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: "cb-replay-1",
        evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
      });
      await rt.dispatch({
        type: "VerifyAttestation",
        receiptId: "r1",
        platform: "AMD SEV-SNP",
      });

      // Open circuit breaker
      await rt.dispatch({
        type: "TriggerCircuitBreaker",
        action: "open",
        reason: "replay-test",
      });

      const stateOpen = rt.getState();
      if (!stateOpen.circuitBreakerOpen) throw new Error("Circuit breaker should be open");
      if (stateOpen.kernelState !== "HAZARD") throw new Error("Should be in HAZARD");

      // Close circuit breaker
      await rt.dispatch({
        type: "TriggerCircuitBreaker",
        action: "close",
        reason: "recovered",
      });

      const stateClosed = rt.getState();
      if (stateClosed.circuitBreakerOpen) throw new Error("Circuit breaker should be closed");
      if (stateClosed.kernelState !== "IDLE") throw new Error("Should be back in IDLE");

      // Replay all events
      const events = await rt.store.readFrom(1);
      const replayed = reduceBatch(createInitialState(), events);

      // Final state should match
      if (replayed.circuitBreakerOpen !== stateClosed.circuitBreakerOpen) throw new Error("CB state mismatch on replay");
      if (replayed.kernelState !== stateClosed.kernelState) throw new Error("KernelState mismatch on replay");
      return true;
    });

    // =====================================================================
    // PHASE 4: Envelope Cryptographic Tests
    // =====================================================================
    console.log("── Phase 4: Cryptographic Boundaries ──");

    await this.test("Crypto_PayloadHashAllowsIntegrityCheckWithoutDecryption", () => {
      const engine = new EnvelopeEncryptionEngine(generateMasterKeyPair());
      const signerKp = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const envelope = engine.sealEnvelope(
        { eventId: "evt-002", streamId: "s1", tenantId: "t1", sequence: 1, eventType: "Test", schemaVersion: 1 },
        { secret: "classified-data", level: "top", tags: ["a", "b"] },
        signerKp.privateKey.toString(),
        signerKp.publicKey.toString(),
      );

      // Integrity check WITHOUT decrypting — this is the key capability
      const intact = engine.verifyIntegrity(envelope);
      if (!intact) throw new Error("verifyIntegrity should pass without decryption");

      // The header payloadHash is deterministic
      if (envelope.header.payloadHash.length !== 64) throw new Error("payloadHash must be SHA-256 hex (64 chars)");

      // Tamper ciphertext WITHOUT touching header — verifyIntegrity should still
      // pass (signature is over header only), but unseal should fail
      const tamperedCipher = { ...envelope, ciphertext: Buffer.from("tampered").toString("base64") };
      const stillIntact = engine.verifyIntegrity(tamperedCipher);
      if (!stillIntact) throw new Error("verifyIntegrity only checks header sig, should pass even with tampered ciphertext");

      // Only unseal should catch ciphertext tampering (via GCM auth tag)
      let caught = false;
      try { engine.unsealEnvelope(tamperedCipher); } catch { caught = true; }
      if (!caught) throw new Error("Tampered ciphertext should fail GCM auth tag verification");
      return true;
    });

    await this.test("Crypto_DifferentKeysDifferentEnvelopes", () => {
      const engine = new EnvelopeEncryptionEngine(generateMasterKeyPair());

      // Two different signers
      const signer1 = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      const signer2 = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const env1 = engine.sealEnvelope(
        { eventId: "evt-1", streamId: "s1", tenantId: "t1", sequence: 1, eventType: "Test", schemaVersion: 1 },
        { data: "hello" },
        signer1.privateKey.toString(),
        signer1.publicKey.toString(),
      );
      const env2 = engine.sealEnvelope(
        { eventId: "evt-2", streamId: "s1", tenantId: "t1", sequence: 2, eventType: "Test", schemaVersion: 1 },
        { data: "world" },
        signer2.privateKey.toString(),
        signer2.publicKey.toString(),
      );

      if (env1.signerPublicKey === env2.signerPublicKey) throw new Error("Different signers should produce different public keys");
      if (env1.signature === env2.signature) throw new Error("Different payloads should produce different signatures");

      // Each verifies with their own key
      if (!engine.verifyIntegrity(env1)) throw new Error("env1 should verify with signer1's key");
      if (!engine.verifyIntegrity(env2)) throw new Error("env2 should verify with signer2's key");

      // Swapping keys should fail
      const swapped = { ...env1, signerPublicKey: env2.signerPublicKey };
      if (engine.verifyIntegrity(swapped)) throw new Error("Swapped signer key should fail verification");
      return true;
    });

    // =====================================================================
    // RESULTS & SIGNED ARTIFACT
    // =====================================================================

    const passed = Object.values(this.results).filter((r) => r === "PASS").length;
    const failed = Object.values(this.results).filter((r) => r === "FAIL").length;
    const total = Object.values(this.results).length;
    const isValid = failed === 0;

    console.log(`\n── Results ──`);
    console.log(`   Passed: ${passed}   Failed: ${failed}   Total: ${total}`);
    console.log(`   Constitutional Compliance: ${isValid ? "✅ ACCEPTED" : "❌ BLOCKED"}`);

    // Generate signed evidence artifact
    const artifact: Omit<ValidationArtifact, "signature"> = {
      runId,
      constitutionVersion: "1.0.0",
      commit,
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: { passed, failed, total },
    };

    // Sign the artifact with the system key
    const canonicalArtifact = canonicalize(artifact);
    const artifactSignature = sign(
      null,
      Buffer.from(canonicalArtifact, "utf8"),
      this.systemKeyPair.privateKey,
    ).toString("hex");

    const signedArtifact: ValidationArtifact = {
      ...artifact,
      signature: artifactSignature,
    };

    // Write to evidence/ directory
    const evidenceDir = resolve(process.cwd(), "evidence");
    if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });
    const artifactPath = resolve(evidenceDir, `${runId}.json`);
    writeFileSync(artifactPath, JSON.stringify(signedArtifact, null, 2));
    console.log(`   Evidence artifact: ${artifactPath}`);
    console.log(`   Artifact signature: ${artifactSignature.slice(0, 32)}...\n`);

    if (!isValid) process.exit(1);
    return isValid;
  }

  private async test(
    name: string,
    fn: () => Promise<boolean> | boolean,
  ): Promise<void> {
    try {
      const pass = await fn();
      this.results[name] = pass ? "PASS" : "FAIL";
      console.log(`   [${pass ? "PASS" : "FAIL"}] ${name}`);
    } catch (e: unknown) {
      this.results[name] = "FAIL";
      const message = e instanceof Error ? e.message : String(e);
      console.log(`   [FAIL] ${name} — ${message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const harness = new X1ValidationHarness();
  const passed = await harness.execute();
  if (passed) {
    console.log("✅ X₁ Constitutional Validation: ALL CHECKS PASSED");
    process.exit(0);
  } else {
    console.log("❌ X₁ Constitutional Validation: BLOCKED — failing checks detected");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error in validation harness:", err);
  process.exit(1);
});
