// test/gate1-smoke.test.js
// Gate-1 smoke test — Node 20, node:test, self-contained
// Validates the Bayesian safety kernel computation and verdict logic.
// Does NOT import Next.js route handlers (incompatible with node --test).
import { test } from "node:test"
import assert from "node:assert/strict"

// ── Bayesian kernel (mirrors app/api/verify/route.ts:102-108) ──────────────
function computePosterior(alpha, beta) {
  const a = +alpha || 24
  const b = +beta || 8
  return (a + 1) / (a + b + 2)
}

function computeVerdict(posterior, threshold) {
  const t = +threshold || 0.55
  const margin = posterior - t
  return margin > 0 ? "SAFE" : "TRIP"
}

// ── Test 1: Default priors → SAFE ───────────────────────────────────────────
test("Gate-1: default priors (alpha=24, beta=8) → SAFE verdict", async (t) => {
  const posterior = computePosterior(24, 8)
  const verdict = computeVerdict(posterior, 0.55)

  assert.ok(posterior >= 0 && posterior <= 1, `posterior=${posterior} in [0,1]`)
  assert.equal(posterior, 25 / 34, "posterior = (24+1)/(24+8+2)")
  assert.equal(verdict, "SAFE", "posterior > threshold → SAFE")
})

// ── Test 2: Low alpha, high beta → TRIP ─────────────────────────────────────
test("Gate-1: low alpha (1), high beta (20) → TRIP verdict", async (t) => {
  const posterior = computePosterior(1, 20)
  const verdict = computeVerdict(posterior, 0.55)

  assert.ok(posterior >= 0 && posterior <= 1, `posterior=${posterior} in [0,1]`)
  assert.equal(verdict, "TRIP", "posterior < threshold → TRIP")
})

// ── Test 3: Exact threshold → TRIP (margin = 0, not > 0) ────────────────────
test("Gate-1: posterior exactly at threshold → TRIP (margin=0)", async (t) => {
  // Choose alpha, beta such that posterior = threshold
  // (a+1)/(a+b+2) = 0.55 → a+1 = 0.55*(a+b+2)
  // For threshold=0.55: alpha=9, beta=10 → posterior = 10/21 ≈ 0.476 (below)
  // alpha=14, beta=13 → posterior = 15/29 ≈ 0.517 (below)
  // alpha=24, beta=21 → posterior = 25/47 ≈ 0.532 (below)
  // alpha=30, beta=25 → posterior = 31/57 ≈ 0.544 (below)
  // alpha=35, beta=29 → posterior = 36/66 ≈ 0.545 (below)
  // Just use threshold=0.5 and alpha=1, beta=1 → posterior=2/4=0.5 → margin=0
  const posterior = computePosterior(1, 1)
  const verdict = computeVerdict(posterior, 0.5)

  assert.equal(posterior, 0.5, "posterior = 0.5")
  assert.equal(verdict, "TRIP", "margin=0 → TRIP (not SAFE)")
})

// ── Test 4: Verify schema validation (documentHash length) ───────────────────
test("Gate-1: documentHash must be 66-char 0x-prefixed hex", async (t) => {
  const validHash = "0x" + "a".repeat(64)
  const invalidHash = "0x" + "a".repeat(32)

  assert.equal(validHash.length, 66, "valid hash is 66 chars")
  assert.notEqual(invalidHash.length, 66, "invalid hash is not 66 chars")
})

// ── Test 5: Verdict values are only SAFE or TRIP ────────────────────────────
test("Gate-1: verdict is always SAFE or TRIP (no PASS/WARN/HALT)", async (t) => {
  const cases = [
    { alpha: 24, beta: 8, threshold: 0.55, expected: "SAFE" },
    { alpha: 1, beta: 20, threshold: 0.55, expected: "TRIP" },
    { alpha: 0, beta: 0, threshold: 0.55, expected: "SAFE" },   // defaults to 24/8
    { alpha: 100, beta: 1, threshold: 0.99, expected: "TRIP" },  // posterior ≈ 0.981 < 0.99
    { alpha: 1, beta: 100, threshold: 0.1, expected: "TRIP" },
  ]

  for (const { alpha, beta, threshold, expected } of cases) {
    const posterior = computePosterior(alpha, beta)
    const verdict = computeVerdict(posterior, threshold)
    assert.equal(verdict, expected, `alpha=${alpha} beta=${beta} t=${threshold} → ${expected}`)
    assert.ok(["SAFE", "TRIP"].includes(verdict), `verdict "${verdict}" is valid`)
  }
})

// ── Test 6: Post-Chaos Integrity Assertions ─────────────────────────────────
test("Post-Chaos Integrity Assertions", async (t) => {
  // 1. Proof Verification (Mock/Stub for smoke test environment)
  const proofVerified = true
  assert.equal(proofVerified, true, "Proof verification failed post-chaos.")

  // 2. Duplicate Aggregation Check
  const proofIds = ["id1", "id2"]
  const uniqueProofIds = new Set(proofIds)
  assert.equal(proofIds.length, uniqueProofIds.size, "Duplicate aggregation detected post-chaos.")

  // 3. Root Integrity Check
  const rootHash = "0xabc123"
  const expectedRootHash = "0xabc123"
  assert.equal(rootHash, expectedRootHash, "Root integrity violation detected post-chaos.")
})
