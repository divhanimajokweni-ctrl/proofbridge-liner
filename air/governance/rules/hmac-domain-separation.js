/**
 * Rule: HMAC Domain Separation (HF-4)
 *
 * Evaluates the HMAC Webhook capability.
 * Fails if webhook HMAC and VCT HMAC share the same key namespace.
 */

'use strict';

const name = 'hmac-domain-separation';
const description = 'Evaluates HMAC key domain separation for webhook and VCT namespaces. Enforces HF-4: domain-separated HMAC keys required.';

function evaluate(inferences) {
  const hmacInference = inferences.find(inf => inf.capabilityId === 'hmac-webhook');

  if (!hmacInference) {
    return {
      conclusion: 'FAIL',
      reason: 'No HMAC webhook evidence found in inference block',
      affectedCapabilities: ['hmac-webhook'],
    };
  }

  if (hmacInference.conclusion === 'PASS') {
    return {
      conclusion: 'PASS',
      reason: 'HMAC domain separation verified — webhook and VCT keys use distinct namespaces',
      affectedCapabilities: ['hmac-webhook'],
    };
  }

  return {
    conclusion: 'FAIL',
    reason: `HMAC domain separation not verified: ${hmacInference.explainability.contributors
      .filter(c => !c.satisfied)
      .map(c => c.factor)
      .join(', ')}`,
    affectedCapabilities: ['hmac-webhook'],
  };
}

module.exports = { name, description, evaluate };
