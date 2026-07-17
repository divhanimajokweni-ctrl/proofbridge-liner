#!/usr/bin/env node
// scripts/run-air-pipeline.ts
// ───────────────────────────────────────────────────────────────
// AIR Pipeline Runner — exercises the full evidence envelope lifecycle:
// build unsigned → hash → sign → verify → ledger commit
// Uses ephemeral RSA keypair (no long-lived key) and mock trace data.
// ───────────────────────────────────────────────────────────────

import {
  ProofBridgeAirEngine,
  NodeCryptoAirEvidenceSigner,
  InMemoryAirEvidenceLedger,
} from "../src/lib/evidence/airEngine";

async function main() {
  console.log("[air-pipeline] Starting AIR evidence pipeline demo…\n");

  // 1. Instantiate engine with ephemeral signer + in-memory ledger
  const signer = new NodeCryptoAirEvidenceSigner();
  const ledger = new InMemoryAirEvidenceLedger();
  const engine = new ProofBridgeAirEngine({
    signer,
    ledger,
    engineVersion: "1.0.0-demo",
  });

  console.log(`[air-pipeline] Signer key ID : ${signer.getKeyId()}`);
  console.log(`[air-pipeline] Public key    : ${(await signer.getPublicKey()).substring(0, 32)}…\n`);

  // 2. Mock trace data — simulates an agent execution
  const trace = {
    tenantId: "tenant-demo-001",
    capabilityId: "code-review",
    agentId: "agent-static-analysis-v2",
    goalId: "goal-review-pr-4521",
    prompt: "Review PR #4521 for type safety and lint violations",
    tools: ["tsc --noEmit", "eslint", "vitest run"],
    modelId: "claude-3.5-sonnet",
    provider: "anthropic",
    routingReason: "Static analysis capability matched",
    policyDecision: {
      decision: "approved" as const,
      policy_version: "2.1.0",
      evaluated_at: new Date(),
    },
    output: {
      result: "success" as const,
      summary: "All checks passed — no type errors, no lint violations, 46 tests passing",
    },
    validation: {
      typecheck_passed: true,
      lint_passed: true,
      tests_passed: true,
      build_passed: true,
    },
    teeAttestation: {
      enclave_id: "enclave-nitro-0123456789abcdef",
      attestation_report: "AWS_NITRO_ATTESTATION_REPORT_v2.0",
      policy_hash: "sha256:abcdef1234567890",
      timestamp: new Date(),
    },
    zkProof: {
      proof_hash: "zkp-groth16-abcdef1234567890",
      proof_system: "groth16" as const,
      verified: true,
      timestamp: new Date(),
    },
    bayesianSafety: {
      hazard_probability: 0.003,
      confidence_interval: [0.001, 0.007] as [number, number],
      model_version: "safety-model-v3.1",
      timestamp: new Date(),
    },
    pipelineId: "pipeline-static-analysis",
  };

  // 3. Create the AIR envelope
  console.log("[air-pipeline] Creating AIR envelope…");
  const envelope = await engine.createEnvelope(trace);

  console.log(`[air-pipeline] Envelope ID   : ${envelope.envelope_id}`);
  console.log(`[air-pipeline] Envelope hash : ${envelope.envelope_hash.substring(0, 32)}…`);
  console.log(`[air-pipeline] Signing key ID : ${envelope.signing_key_id}`);
  console.log(`[air-pipeline] Created at    : ${envelope.created_at.toISOString()}`);
  console.log(`[air-pipeline] Air run ID    : ${envelope.air_metadata.run_id}\n`);

  // 4. Verify the envelope
  console.log("[air-pipeline] Verifying AIR envelope…");
  const result = await engine.verifyEnvelope(envelope);

  if (result.valid) {
    console.log("[air-pipeline] ✅ Envelope verification PASSED\n");
  } else {
    console.error("[air-pipeline] ❌ Envelope verification FAILED:");
    for (const reason of result.reasons) {
      console.error(`  - ${reason}`);
    }
    process.exit(1);
  }

  // 5. Ledger audit
  const entries = await ledger.getByEnvelopeId(envelope.envelope_id);
  console.log(`[air-pipeline] Ledger entries for this envelope: ${entries.length}`);
  for (const entry of entries) {
    console.log(`  - ${entry.entry_id.substring(0, 12)}… | stage=${entry.stage} | ${entry.timestamp.toISOString()}`);
  }

  const allEntries = await ledger.getAll();
  console.log(`[air-pipeline] Total ledger entries: ${allEntries.length}\n`);

  // 6. Negative test — tamper with envelope and verify fails
  console.log("[air-pipeline] Negative test: tampering with envelope hash…");
  const tampered = { ...envelope, envelope_hash: "0".repeat(64) };
  const tamperResult = await engine.verifyEnvelope(tampered);

  if (!tamperResult.valid) {
    console.log("[air-pipeline] ✅ Tampered envelope correctly rejected\n");
  } else {
    console.error("[air-pipeline] ❌ Tampered envelope was NOT rejected — this is a bug!");
    process.exit(1);
  }

  console.log("[air-pipeline] All checks passed. Pipeline complete.");
}

main().catch((err) => {
  console.error("[air-pipeline] Fatal error:", err);
  process.exit(1);
});
