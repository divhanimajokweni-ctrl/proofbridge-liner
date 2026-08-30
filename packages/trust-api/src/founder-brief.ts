import type {
  TaskSpec,
  ExecutionReceipt,
  VerificationAttestation,
  FounderBrief,
} from '@proofbridge/trust-types';

/**
 * Founder Brief — Plain-English summary of an agent execution.
 *
 * Every completed task automatically generates a brief that answers:
 * - What changed?
 * - Why did we change it?
 * - How does it work?
 * - What risks remain?
 * - Can you explain it in one paragraph?
 *
 * This output is mandatory. Not optional.
 */

/**
 * Generate a Founder Brief from execution data.
 */
export function generateFounderBrief(params: {
  taskSpec: TaskSpec;
  receipt: ExecutionReceipt;
  attestation?: VerificationAttestation;
}): FounderBrief {
  const { taskSpec, receipt, attestation } = params;

  const whatChanged = describeWhatChanged(receipt);
  const whyChanged = taskSpec.description;
  const howItWorks = describeHowItWorks(receipt);
  const risksRemaining = describeRisks(receipt, attestation);
  const summary = generateSummary(taskSpec, receipt, attestation);

  return {
    taskId: taskSpec.taskId,
    agentId: receipt.agentId,
    whatChanged,
    whyChanged,
    howItWorks,
    risksRemaining,
    summary,
    receiptId: receipt.receiptId,
    timestamp: Date.now(),
  };
}

/**
 * Describe what files changed.
 */
function describeWhatChanged(receipt: ExecutionReceipt): string {
  const { diffManifest } = receipt;
  const fileCount = diffManifest.filesChanged.length;
  const netLines = diffManifest.linesAdded - diffManifest.linesRemoved;

  const parts: string[] = [];
  parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''} changed`);
  parts.push(`${diffManifest.linesAdded} lines added, ${diffManifest.linesRemoved} removed`);

  if (diffManifest.testsAdded > 0) {
    parts.push(`${diffManifest.testsAdded} new test${diffManifest.testsAdded !== 1 ? 's' : ''}`);
  }
  if (diffManifest.testsModified > 0) {
    parts.push(`${diffManifest.testsModified} test${diffManifest.testsModified !== 1 ? 's' : ''} modified`);
  }

  const direction = netLines > 0 ? 'net addition' : netLines < 0 ? 'net removal' : 'net zero change';
  parts.push(`${Math.abs(netLines)} lines ${direction}`);

  return parts.join('. ') + '.';
}

/**
 * Describe how the changes work.
 */
function describeHowItWorks(receipt: ExecutionReceipt): string {
  const evidence = receipt.evidence;
  const checks: string[] = [];

  if (evidence.typecheck.passed) {
    checks.push('TypeScript type checking passed');
  }
  if (evidence.lint.passed) {
    checks.push('Lint checks passed');
  }
  if (evidence.tests.passed) {
    checks.push(`All ${evidence.tests.total} tests passing`);
  }
  if (evidence.build.passed) {
    checks.push('Build succeeded');
  }

  return `Verified through: ${checks.join(', ')}.`;
}

/**
 * Describe remaining risks.
 */
function describeRisks(
  receipt: ExecutionReceipt,
  attestation?: VerificationAttestation
): string {
  const risks: string[] = [];

  if (!attestation) {
    risks.push('Independent verification not yet completed');
  } else if (attestation.status === 'rejected') {
    risks.push(`Verification rejected: ${attestation.reason || 'no reason given'}`);
  }

  if (receipt.evidence.coverage) {
    const { statements, branches } = receipt.evidence.coverage;
    if (statements !== undefined && statements < 80) {
      risks.push(`Test coverage at ${statements}% statements (below 80% threshold)`);
    }
    if (branches !== undefined && branches < 70) {
      risks.push(`Branch coverage at ${branches}% (below 70% threshold)`);
    }
  } else {
    risks.push('Code coverage data not available');
  }

  if (receipt.repository.branch !== 'main' && receipt.repository.branch !== 'compliance-fabric') {
    risks.push(`Changes on feature branch: ${receipt.repository.branch}`);
  }

  return risks.length > 0 ? risks.join('. ') + '.' : 'No outstanding risks identified.';
}

/**
 * Generate one-paragraph summary.
 */
function generateSummary(
  taskSpec: TaskSpec,
  receipt: ExecutionReceipt,
  attestation?: VerificationAttestation
): string {
  const agentName = receipt.agentId;
  const fileCount = receipt.diffManifest.filesChanged.length;
  const testResult = receipt.evidence.tests.passed
    ? `All ${receipt.evidence.tests.total} tests passing`
    : `${receipt.evidence.tests.failed} tests failing`;
  const verification = attestation
    ? attestation.status === 'verified'
      ? 'independently verified'
      : `verification ${attestation.status}`
    : 'pending independent verification';

  return `Agent ${agentName} implemented "${taskSpec.description}" across ${fileCount} files. ${testResult}. Status: ${verification}.`;
}
