/**
 * Rule: Trust Boundary Integrity (HF-1)
 *
 * Evaluates TEE attestation capability.
 * Fails if confidence score < 0.80.
 * Enforces the constitutional invariant that AIR only trusts hardware attestation,
 * not software config flags.
 */

'use strict';

const name = 'trust-boundary-integrity';
const description = 'Evaluates TEE attestation capability against the 0.80 confidence threshold. Enforces HF-1: TEE must be real hardware attestation, not a config flag.';

function evaluate(inferences) {
  const teeInference = inferences.find(inf => inf.capabilityId === 'tee-attestation');

  if (!teeInference) {
    return {
      conclusion: 'FAIL',
      reason: 'No TEE attestation evidence found in inference block',
      affectedCapabilities: ['tee-attestation'],
    };
  }

  const THRESHOLD = 0.80;

  if (teeInference.confidence >= THRESHOLD) {
    return {
      conclusion: 'PASS',
      reason: `TEE attestation confidence ${teeInference.confidence} meets threshold ${THRESHOLD}`,
      affectedCapabilities: ['tee-attestation'],
    };
  }

  const unsatisfied = (teeInference.explainability.contributors || [])
    .filter(c => !c.satisfied)
    .map(c => c.factor);

  return {
    conclusion: 'FAIL',
    reason: `TEE attestation confidence ${teeInference.confidence} below threshold ${THRESHOLD}. Unsatisfied: ${unsatisfied.join(', ')}`,
    affectedCapabilities: ['tee-attestation'],
  };
}

module.exports = { name, description, evaluate };
