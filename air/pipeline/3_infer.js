/**
 * Pass 3: Infer — Evidence IR to Inference IR
 *
 * Reads the complete Evidence Store and computes explainable confidence metrics
 * for each capability. Collectors never assign confidence values — only this pass does.
 *
 * Usage: node air/pipeline/3_infer.js
 * Output: Inference IR block (JSON) to stdout
 */

'use strict';

const { readAll } = require('./evidence-store');

/**
 * Compute a weighted confidence score from explainable contributors.
 */
function computeConfidence(contributors) {
  if (contributors.length === 0) return 0;
  const totalWeight = contributors.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const satisfiedWeight = contributors
    .filter(c => c.satisfied)
    .reduce((sum, c) => sum + c.weight, 0);
  return Math.round((satisfiedWeight / totalWeight) * 100) / 100;
}

/**
 * Derive inference for the TEE Attestation capability.
 */
function inferTeeAttestation(evidence) {
  const teeEvidence = evidence.filter(
    e => e.collector === 'source-analysis' && e.metadata && e.metadata.capability === 'tee-attestation'
  );

  const contributors = [];

  if (teeEvidence.length === 0) {
    contributors.push({ factor: 'tee_source_exists', weight: 0.4, satisfied: false });
    contributors.push({ factor: 'tee_hardware_attestation', weight: 0.4, satisfied: false });
    contributors.push({ factor: 'tee_test_coverage', weight: 0.2, satisfied: false });
  } else {
    const latest = teeEvidence[teeEvidence.length - 1];
    const hasSource = latest.metadata.sourceExists !== false;
    const isConfigFlag = latest.metadata.isConfigFlag === true;
    const hasRealAttestation = latest.metadata.hasRealAttestation === true;

    contributors.push({ factor: 'tee_source_exists', weight: 0.4, satisfied: hasSource });

    // HF-1: If TEE is a config boolean, cap confidence at 0.31
    if (isConfigFlag && !hasRealAttestation) {
      contributors.push({ factor: 'tee_hardware_attestation', weight: 0.4, satisfied: false });
    } else {
      contributors.push({ factor: 'tee_hardware_attestation', weight: 0.4, satisfied: hasRealAttestation });
    }

    const testEvidence = evidence.filter(
      e => e.collector === 'test-coverage' && e.metadata && e.metadata.capability === 'tee-attestation'
    );
    contributors.push({
      factor: 'tee_test_coverage',
      weight: 0.2,
      satisfied: testEvidence.length > 0 && testEvidence.some(t => t.status === 'PASS'),
    });
  }

  const confidence = computeConfidence(contributors);

  // HF-1 enforcement: if only a config flag, cap at 0.31
  const teeSrc = teeEvidence.find(e => e.metadata && e.metadata.isConfigFlag);
  const finalConfidence = (teeSrc && confidence > 0.31) ? 0.31 : confidence;

  return {
    capabilityId: 'tee-attestation',
    conclusion: finalConfidence >= 0.80 ? 'PASS' : 'FAIL',
    confidence: finalConfidence,
    explainability: { contributors },
    evidenceReferences: teeEvidence.map(e => e.id),
  };
}

/**
 * Derive inference for the GovernanceAnchor deployment capability.
 */
function inferGovernanceAnchor(evidence) {
  const anchorEvidence = evidence.filter(
    e => e.collector === 'source-analysis' && e.metadata && e.metadata.capability === 'governance-anchor'
  );

  const broadcastEvidence = evidence.filter(
    e => e.collector === 'foundry-broadcast'
  );

  const contributors = [];

  const hasSource = anchorEvidence.some(e => e.metadata && e.metadata.sourceExists === true);
  contributors.push({ factor: 'anchor_source_exists', weight: 0.3, satisfied: hasSource });

  // HF-3: Check for on-chain deployment in broadcast logs
  const hasDeployment = broadcastEvidence.some(e =>
    e.status === 'PASS' && e.metadata && e.metadata.contract
  );
  contributors.push({ factor: 'anchor_deployed_onchain', weight: 0.5, satisfied: hasDeployment });

  // HF-2: ZK proof verification
  const zkEvidence = evidence.filter(
    e => e.collector === 'test-coverage' && e.metadata && e.metadata.capability === 'zk-proof-verification'
  );
  const hasZkVerification = zkEvidence.some(e => e.status === 'PASS');
  contributors.push({ factor: 'zk_proof_verified', weight: 0.2, satisfied: hasZkVerification });

  const confidence = computeConfidence(contributors);

  let conclusion = 'PASS';
  if (!hasDeployment || !hasZkVerification) conclusion = 'FAIL';
  if (!hasSource) conclusion = 'PENDING';

  return {
    capabilityId: 'governance-anchor',
    conclusion,
    confidence,
    explainability: { contributors },
    evidenceReferences: [
      ...anchorEvidence.map(e => e.id),
      ...broadcastEvidence.map(e => e.id),
      ...zkEvidence.map(e => e.id),
    ],
  };
}

/**
 * Derive inference for the HMAC Webhook capability.
 */
function inferHmacWebhook(evidence) {
  const hmacEvidence = evidence.filter(
    e => e.collector === 'source-analysis' && e.metadata && e.metadata.capability === 'hmac-webhook'
  );

  const contributors = [];

  if (hmacEvidence.length === 0) {
    contributors.push({ factor: 'hmac_domain_separation', weight: 1.0, satisfied: false });
  } else {
    const latest = hmacEvidence[hmacEvidence.length - 1];
    // HF-4: Domain-separated HMAC keys required
    contributors.push({
      factor: 'hmac_domain_separation',
      weight: 1.0,
      satisfied: latest.metadata.hasDomainSeparation === true,
    });
  }

  const confidence = computeConfidence(contributors);

  return {
    capabilityId: 'hmac-webhook',
    conclusion: confidence >= 0.80 ? 'PASS' : 'FAIL',
    confidence,
    explainability: { contributors },
    evidenceReferences: hmacEvidence.map(e => e.id),
  };
}

/**
 * Derive inference for the Bayesian Calibration capability.
 */
function inferBayesianCalibration(evidence) {
  const calEvidence = evidence.filter(
    e => e.collector === 'test-coverage' && e.metadata && e.metadata.capability === 'bayesian-calibration'
  );

  const contributors = [];

  if (calEvidence.length === 0) {
    contributors.push({ factor: 'calibration_dataset_size', weight: 1.0, satisfied: false });
  } else {
    const latest = calEvidence[calEvidence.length - 1];
    const datasetSize = latest.metadata.datasetSize || 0;
    const threshold = latest.metadata.threshold || 200;

    // HF-5: Minimum n=200 cases required
    contributors.push({
      factor: 'calibration_dataset_size',
      weight: 1.0,
      satisfied: datasetSize >= threshold,
      actual: datasetSize,
      required: threshold,
    });
  }

  const confidence = computeConfidence(contributors);

  return {
    capabilityId: 'bayesian-calibration',
    conclusion: confidence >= 0.80 ? 'PASS' : 'FAIL',
    confidence,
    explainability: { contributors },
    evidenceReferences: calEvidence.map(e => e.id),
  };
}

/**
 * Main inference pass: compute all capability inferences.
 */
function inferAll(evidenceStore) {
  const inferences = [
    inferTeeAttestation(evidenceStore),
    inferGovernanceAnchor(evidenceStore),
    inferHmacWebhook(evidenceStore),
    inferBayesianCalibration(evidenceStore),
  ];

  return inferences.map((inf, i) => ({
    inferenceId: `inf-${Date.now()}-${i}`,
    evidenceReferences: inf.evidenceReferences,
    capabilityId: inf.capabilityId,
    conclusion: inf.conclusion,
    confidence: inf.confidence,
    explainability: inf.explainability,
    derivedAt: new Date().toISOString(),
  }));
}

if (require.main === module) {
  const evidence = readAll();
  console.error(`[INFER] Read ${evidence.length} evidence entries from store`);

  const inferences = inferAll(evidence);
  console.error(`[INFER] Computed ${inferences.length} capability inferences`);

  for (const inf of inferences) {
    console.error(`[INFER]   ${inf.capabilityId}: ${inf.conclusion} (confidence: ${inf.confidence})`);
  }

  process.stdout.write(JSON.stringify(inferences, null, 2));
}

module.exports = { inferAll, computeConfidence };
