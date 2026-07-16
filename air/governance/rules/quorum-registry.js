/**
 * Rule: Quorum Registry
 *
 * Evaluates whether sufficient quorum evidence exists for each capability.
 * A capability needs evidence from at least 2 distinct collectors to be
 * considered independently verified.
 */

'use strict';

const name = 'quorum-registry';
const description = 'Evaluates quorum evidence sufficiency. Each capability requires evidence from at least 2 distinct collectors for independent verification.';

function evaluate(inferences) {
  const affectedCapabilities = [];
  const issues = [];

  for (const inf of inferences) {
    // Evidence references are IDs — we check if the inference has
    // enough distinct evidence sources by checking contributor count
    const contributors = inf.explainability.contributors || [];

    if (contributors.length < 2) {
      affectedCapabilities.push(inf.capabilityId);
      issues.push(`${inf.capabilityId}: only ${contributors.length} contributor(s) — quorum requires 2+`);
    }
  }

  if (issues.length === 0) {
    return {
      conclusion: 'PASS',
      reason: 'All capabilities have sufficient quorum evidence',
      affectedCapabilities: [],
    };
  }

  return {
    conclusion: 'FAIL',
    reason: `Quorum registry violations: ${issues.join('; ')}`,
    affectedCapabilities,
  };
}

module.exports = { name, description, evaluate };
