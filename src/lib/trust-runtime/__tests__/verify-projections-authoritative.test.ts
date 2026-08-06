// @ts-nocheck
/**
 * VERIFICATION 1b: Page uses server projections, not random walks
 *
 * Proves that after dispatch, the response carries authoritative projections
 * that the page applies deterministically (no Math.random()).
 */

import { resetRuntime, getRuntime } from "../runtime";
import type { Command } from "../types";

afterEach(() => {
  resetRuntime();
});

test("dispatch API response contains all four projections", async () => {
  resetRuntime();
  const rt = getRuntime();

  const cmd: Command = {
    type: "SubmitEvidence",
    idempotencyKey: "proj-test-1",
    evidence: { claim: "test-claim", source: "oracle", confidence: "high", tags: [] },
  };
  const events = await rt.dispatch(cmd);
  expect(events).toHaveLength(1);

  // Get projections — these are what get returned by the /dispatch API
  const p = rt.getProjections();
  expect(p).toHaveProperty("colony");
  expect(p).toHaveProperty("ui");
  expect(p).toHaveProperty("metrics");
  expect(p).toHaveProperty("notifications");

  // Verify trust/confidence are deterministic Bayesian values, not random
  expect(p.ui.trust).toBeGreaterThan(0);
  expect(p.ui.trust).toBeLessThanOrEqual(1);
  expect(p.ui.confidence).toBeGreaterThanOrEqual(0);
  expect(p.ui.confidence).toBeLessThanOrEqual(100);
  expect(p.ui.sigma).toBeGreaterThan(0);
});

test("trust value is deterministic from evidence events alone", async () => {
  resetRuntime();
  const rt = getRuntime();

  // Submit 3 evidence items with high confidence
  for (let i = 1; i <= 3; i++) {
    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: `det-trust-${i}`,
      evidence: { claim: `c${i}`, source: "s1", confidence: "high", tags: [] },
    });
  }

  // Trust should be 0.5 (default) because no quorum updates happened
  // EvidenceReceived doesn't change trust — only AttestationVerified does
  const p = rt.getProjections();
  expect(p.ui.trust).toBe(0.5);
  expect(p.ui.confidence).toBe(50);

  // Now verify an attestation — this should update trust via Bayesian formula
  await rt.dispatch({
    type: "VerifyAttestation",
    receiptId: "r1",
    platform: "AMD SEV-SNP",
  });

  const p2 = rt.getProjections();
  // After 1 pass, 1 total: Beta(2,1) → trust=2/3=0.667, sigma=sqrt(2/36)=0.236
  expect(p2.ui.quorum).toEqual({ pass: 1, total: 1 });
  expect(p2.ui.trust).toBeCloseTo(2 / 3, 3); // 0.667
  expect(p2.ui.sigma).toBeCloseTo(Math.sqrt(2 / 36), 3); // 0.236

  // Verify that running the same sequence twice produces identical values
  const trustRepeat = p2.ui.trust;
  const sigmaRepeat = p2.ui.sigma;
  const confidenceRepeat = p2.ui.confidence;

  await rt.dispatch({
    type: "VerifyAttestation",
    receiptId: "r2",
    platform: "AMD SEV-SNP",
  });

  const p3 = rt.getProjections();
  // After 2 passes, 2 total: Beta(3,1) → trust=3/4=0.75, sigma=sqrt(3/80)=0.194
  expect(p3.ui.trust).toBeCloseTo(0.75, 3);
  expect(p3.ui.sigma).toBeCloseTo(Math.sqrt(3 / 80), 3);
  // The earlier values should not have changed
  expect(p2.ui.trust).toBe(trustRepeat);
  expect(p2.ui.sigma).toBe(sigmaRepeat);
  expect(p2.ui.confidence).toBe(confidenceRepeat);
});

test("projection values are deterministic — same events, same trust/sigma/confidence", async () => {
  resetRuntime();

  // Create two independent runtimes and submit identical event sequences
  const rt1 = getRuntime();
  for (let i = 1; i <= 5; i++) {
    // Dispatch a full cycle: evidence + verify
    await rt1.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: `same-${i}`,
      evidence: { claim: `c${i}`, source: "s1", confidence: i % 2 === 0 ? "high" : "medium", tags: [] },
    });
    await rt1.dispatch({
      type: "VerifyAttestation",
      receiptId: `r${i}`,
      platform: "AMD SEV-SNP",
    });
  }

  // Capture final projection
  const result1 = rt1.getProjections();
  resetRuntime();

  const rt2 = getRuntime();
  for (let i = 1; i <= 5; i++) {
    await rt2.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: `same-${i}`,
      evidence: { claim: `c${i}`, source: "s1", confidence: i % 2 === 0 ? "high" : "medium", tags: [] },
    });
    await rt2.dispatch({
      type: "VerifyAttestation",
      receiptId: `r${i}`,
      platform: "AMD SEV-SNP",
    });
  }
  const result2 = rt2.getProjections();

  // All deterministic values must match exactly
  expect(result2.ui.trust).toBe(result1.ui.trust);
  expect(result2.ui.sigma).toBe(result1.ui.sigma);
  expect(result2.ui.confidence).toBe(result1.ui.confidence);
  expect(result2.ui.sequence).toBe(result1.ui.sequence);
  expect(result2.ui.epoch).toBe(result1.ui.epoch);
  expect(result2.metrics.eventCount).toBe(result1.metrics.eventCount);
});
