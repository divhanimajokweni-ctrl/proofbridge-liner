/**
 * intentWorker.js — Intent Worker for the VVU Evolution Matrix Ghost Buffer.
 *
 * Receives an operator intent vector (gaze / mouse / claim-state delta)
 * every ~50ms, runs it through a tiny Epistemic Hazard Wall, and posts
 * one of:
 *
 *   { type: "ALLOW",  stage: 0|1|2|3, score, ts }
 *   { type: "DENY",   reason: "...", ts }
 *   { type: "PREDICTION", predictions: [...] }   // raw classifier output
 *
 * The Epistemic Hazard Wall enforces the same fail-closed bound the
 * server enforces: if any breaker is tripped or any required conjunct
 * is missing, the wall returns DENY — and the matrix never pre-renders
 * the next stage. This is what makes the Ghost Buffer safe.
 *
 * 0ms latency: the worker evaluates the vector synchronously and posts
 * ALLOW the moment the threshold is crossed. The main thread's
 * `onmessage` updates `ghostTargetRef.current` immediately, so the
 * very next requestAnimationFrame draws the morph toward the predicted
 * stage — before the next /api/theorem-state poll (5s cadence) catches
 * up.
 */

// Stage mapping mirrors the store:
//   0 = SPHERE   (STUDI UNKNOWN / INCONCLUSIVE)
//   1 = ANTONE   (STUDI PROVEN)
//   2 = WEB-SPIDER (IVE UNKNOWN)
//   3 = MILES    (IVE PROVEN)

const HAZARD_THRESHOLD = 0.85;

// Required conjuncts — the wall refuses ALLOW unless all are present.
//   C = claim
//   E = evidence
//   I = integrity
//   S = safety
//   R = review
const REQUIRED_CONJUNCTS = ["C", "E", "I", "S", "R"];

let lastSession = null;

function hazardWall(input) {
  // Fail-closed: if breaker tripped, always DENY.
  if (input.breakerTripped) {
    return { allow: false, reason: "eis_theorem_5_breaker_tripped" };
  }
  // All conjuncts must be present (non-zero in their vector slot).
  for (const k of REQUIRED_CONJUNCTS) {
    if (!input.conjuncts || !input.conjuncts[k]) {
      return { allow: false, reason: `missing_conjunct_${k}` };
    }
  }
  // Threshold on the operator-confidence score.
  if (input.score < HAZARD_THRESHOLD) {
    return { allow: false, reason: "below_threshold" };
  }
  return { allow: true };
}

function classify(input) {
  // Tiny nearest-stage classifier on the input vector.
  //   studiGatesMet (0..1) × iveClaimsAuth (0..1) × breaker (bool)
  // → stage (0..3)
  if (input.breakerTripped) return 2; // web-spider (pulsing red)
  if (input.studiGatesMet >= 0.99 && input.iveClaimsAuth >= 0.5) return 3; // miles
  if (input.studiGatesMet >= 0.99) return 1; // antone
  if (input.iveClaimsAuth > 0) return 2; // web-spider
  return 0; // sphere
}

self.onmessage = (ev) => {
  const msg = ev.data || {};
  if (msg.type === "PING") {
    self.postMessage({ type: "PONG", ts: Date.now() });
    return;
  }
  if (msg.type === "VECTOR") {
    const input = msg.input || {};
    const score = typeof input.score === "number" ? input.score : 0;
    const breakerTripped = !!input.breakerTripped;
    const conjuncts = input.conjuncts || {};
    const studiGatesMet =
      typeof input.studiGatesMet === "number" ? input.studiGatesMet : 0;
    const iveClaimsAuth =
      typeof input.iveClaimsAuth === "number" ? input.iveClaimsAuth : 0;
    lastSession = msg.sessionId || lastSession;

    const wall = hazardWall({ score, breakerTripped, conjuncts });
    const predictedStage = classify({ studiGatesMet, iveClaimsAuth, breakerTripped });

    self.postMessage({
      type: "PREDICTION",
      predictions: [{ label: `stage_${predictedStage}`, score }],
      ts: Date.now(),
    });

    if (wall.allow && !breakerTripped) {
      self.postMessage({
        type: "ALLOW",
        stage: predictedStage,
        score,
        ts: Date.now(),
        sessionId: lastSession,
      });
    } else {
      self.postMessage({
        type: "DENY",
        reason: wall.reason,
        ts: Date.now(),
        sessionId: lastSession,
      });
    }
  }
};
