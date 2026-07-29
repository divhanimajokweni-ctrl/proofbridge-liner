/**
 * Rule: Adapter Boundary Integrity (HF-2 + HF-3)
 *
 * Evaluates GovernanceAnchor deployment and ZK proof verification capabilities.
 * Fails if GovernanceAnchor is not deployed on-chain or ZK proofs are not verified.
 */

'use strict';

const name = 'adapter-boundary-integrity';
const description = 'Evaluates GovernanceAnchor deployment and ZK proof verification. Enforces HF-2 (ZK on-chain verification) and HF-3 (GovernanceAnchor must be deployed).';

function evaluate(inferences) {
  const anchorInference = inferences.find(inf => inf.capabilityId === 'governance-anchor');

  if (!anchorInference) {
    return {
      conclusion: 'FAIL',
      reason: 'No governance-anchor evidence found in inference block',
      affectedCapabilities: ['governance-anchor'],
    };
  }

  if (anchorInference.conclusion === 'PASS') {
    return {
      conclusion: 'PASS',
      reason: 'GovernanceAnchor deployment and ZK proof verification satisfy constitutional invariants',
      affectedCapabilities: ['governance-anchor'],
    };
  }

  const unsatisfied = (anchorInference.explainability.contributors || [])
    .filter(c => !c.satisfied)
    .map(c => c.factor);

  let reason = `GovernanceAnchor capability conclusion: ${anchorInference.conclusion}`;
  if (unsatisfied.length > 0) {
    reason += `. Unsatisfied contributors: ${unsatisfied.join(', ')}`;
  }

  if (anchorInference.conclusion === 'PENDING') {
    reason = `GovernanceAnchor source exists but deployment is pending on-chain verification. ${reason}`;
  }

  return {
    conclusion: 'FAIL',
    reason,
    affectedCapabilities: ['governance-anchor'],
  };
}

module.exports = { name, description, evaluate };
