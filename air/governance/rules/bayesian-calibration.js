/**
 * Rule: Bayesian Calibration (HF-5)
 *
 * Evaluates the Bayesian Calibration capability.
 * Fails if calibration dataset size < 200 cases.
 */

'use strict';

const name = 'bayesian-calibration';
const description = 'Evaluates Bayesian prior calibration dataset sufficiency. Enforces HF-5: minimum n=200 cases required for production calibration.';

function evaluate(inferences) {
  const calInference = inferences.find(inf => inf.capabilityId === 'bayesian-calibration');

  if (!calInference) {
    return {
      conclusion: 'FAIL',
      reason: 'No Bayesian calibration evidence found in inference block',
      affectedCapabilities: ['bayesian-calibration'],
    };
  }

  if (calInference.conclusion === 'PASS') {
    const contributor = (calInference.explainability.contributors || [])
      .find(c => c.factor === 'calibration_dataset_size');

    return {
      conclusion: 'PASS',
      reason: `Calibration dataset size ${contributor ? contributor.actual : 'unknown'} meets minimum threshold ${contributor ? contributor.required : 200}`,
      affectedCapabilities: ['bayesian-calibration'],
    };
  }

  const contributor = (calInference.explainability.contributors || [])
    .find(c => c.factor === 'calibration_dataset_size');

  return {
    conclusion: 'FAIL',
    reason: `Calibration dataset size ${contributor ? contributor.actual : 'unknown'} below minimum threshold ${contributor ? contributor.required : 200}`,
    affectedCapabilities: ['bayesian-calibration'],
  };
}

module.exports = { name, description, evaluate };
