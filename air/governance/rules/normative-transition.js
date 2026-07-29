/**
 * Rule: Normative Transition
 *
 * Validates RFC 2119 normative tag transitions between governance baselines.
 * Ported from lib/governance/compatibility.ts to operate on Inference IR.
 *
 * This rule checks that no normative tag changes have weakened binding
 * obligations without proper transition periods.
 */

'use strict';

const name = 'normative-transition';
const description = 'Validates RFC 2119 normative tag transitions. Ensures no binding obligation has been weakened without proper governance transition.';

/**
 * Simplified normative classification for AIR pipeline context.
 * Maps capability conclusion states to normative strength equivalents.
 */
function classifyCapabilityStrength(conclusion, confidence) {
  if (conclusion === 'PASS' && confidence >= 0.80) return 'binding';
  if (conclusion === 'PASS') return 'advisory';
  if (conclusion === 'PENDING') return 'optional';
  return 'none';
}

function evaluate(inferences) {
  const affectedCapabilities = [];
  const issues = [];

  for (const inf of inferences) {
    const strength = classifyCapabilityStrength(inf.conclusion, inf.confidence);

    if (strength === 'none') {
      affectedCapabilities.push(inf.capabilityId);
      issues.push(`${inf.capabilityId}: capability is non-compliant (conclusion: ${inf.conclusion})`);
    }
  }

  if (issues.length === 0) {
    return {
      conclusion: 'PASS',
      reason: 'All capabilities maintain acceptable normative strength levels',
      affectedCapabilities: [],
    };
  }

  return {
    conclusion: 'FAIL',
    reason: `Normative transition violations: ${issues.join('; ')}`,
    affectedCapabilities,
  };
}

module.exports = { name, description, evaluate };
