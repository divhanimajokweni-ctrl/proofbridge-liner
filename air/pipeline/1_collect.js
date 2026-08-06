/**
 * Pass 1: Collect — Stateless Artifact Collector
 *
 * Scans the repository for raw artifacts and outputs them as JSON payloads.
 * This pass performs NO interpretation, normalization, or confidence scoring.
 * It is a pure, stateless scanner.
 *
 * Usage: node air/pipeline/1_collect.js
 * Output: JSON array of raw artifact payloads to stdout
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.join(__dirname, '..', '..');

function fileDigest(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return '';
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ─── Collector: Foundry Broadcast ───────────────────────────────────────────

function collectFoundryBroadcast() {
  const broadcastDir = path.join(REPO_ROOT, 'broadcast');
  const payloads = [];

  if (!fs.existsSync(broadcastDir)) {
    payloads.push({
      collector: 'foundry-broadcast',
      artifact: 'broadcast/',
      status: 'PENDING',
      metadata: { reason: 'broadcast/ directory does not exist' },
    });
    return payloads;
  }

  const contracts = fs.readdirSync(broadcastDir);
  for (const contract of contracts) {
    const contractDir = path.join(broadcastDir, contract);
    if (!fs.statSync(contractDir).isDirectory()) continue;

    const runs = fs.readdirSync(contractDir);
    for (const run of runs) {
      const runFile = path.join(contractDir, run, 'run.json');
      if (fileExists(runFile)) {
        payloads.push({
          collector: 'foundry-broadcast',
          artifact: `broadcast/${contract}/${run}/run.json`,
          digest: fileDigest(runFile),
          status: 'PASS',
          metadata: { contract, run, type: 'deployment-run' },
        });
      }
    }
  }

  if (payloads.length === 0) {
    payloads.push({
      collector: 'foundry-broadcast',
      artifact: 'broadcast/',
      status: 'PENDING',
      metadata: { reason: 'No broadcast run.json files found' },
    });
  }

  return payloads;
}

// ─── Collector: Source Analysis (TEE, HMAC, GovernanceAnchor) ────────────────

function collectSourceAnalysis() {
  const payloads = [];

  // TEE attestation path detection
  const teeVerifierPath = path.join(REPO_ROOT, 'contracts', 'TEEVerifier.sol');
  const teeTestPath = path.join(REPO_ROOT, 'test', 'TEEVerifier.t.sol');

  if (fileExists(teeVerifierPath)) {
    const content = fs.readFileSync(teeVerifierPath, 'utf-8');
    const hasRealAttestation = content.includes('attestation') && !content.includes('SW-MODE');
    const isConfigFlag = content.includes('teeMode') || content.includes('software-attested');

    payloads.push({
      collector: 'source-analysis',
      artifact: 'contracts/TEEVerifier.sol',
      digest: fileDigest(teeVerifierPath),
      status: hasRealAttestation ? 'PASS' : isConfigFlag ? 'FAIL' : 'PENDING',
      metadata: {
        capability: 'tee-attestation',
        hasRealAttestation,
        isConfigFlag,
        hasTest: fileExists(teeTestPath),
      },
    });
  } else {
    payloads.push({
      collector: 'source-analysis',
      artifact: 'contracts/TEEVerifier.sol',
      status: 'FAIL',
      metadata: { capability: 'tee-attestation', reason: 'TEEVerifier.sol not found' },
    });
  }

  // GovernanceAnchor deployment detection
  const govAnchorSearchPaths = [
    'contracts/GovernanceAnchor.sol',
    'contracts/api/',
  ];

  let govAnchorFound = false;
  for (const p of govAnchorSearchPaths) {
    if (fileExists(path.join(REPO_ROOT, p))) {
      govAnchorFound = true;
      break;
    }
  }

  payloads.push({
    collector: 'source-analysis',
    artifact: 'contracts/GovernanceAnchor.sol',
    status: govAnchorFound ? 'PENDING' : 'FAIL',
    metadata: {
      capability: 'governance-anchor',
      sourceExists: govAnchorFound,
      deployed: false,
      reason: govAnchorFound
        ? 'Source exists but no on-chain deployment address found in broadcast/'
        : 'GovernanceAnchor.sol not found in contracts/',
    },
  });

  // HMAC domain separation detection
  const webhookDir = path.join(REPO_ROOT, 'app', 'api', 'webhook');
  const serverDir = path.join(REPO_ROOT, 'server');

  let hmacFiles = [];
  if (fs.existsSync(webhookDir)) {
    hmacFiles = hmacFiles.concat(
      fs.readdirSync(webhookDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    );
  }

  let hasDomainSeparation = false;
  const checkPaths = [
    path.join(REPO_ROOT, 'scripts', 'gate1_pipeline.js'),
    path.join(REPO_ROOT, 'app', 'api', 'webhook'),
  ];

  for (const checkPath of checkPaths) {
    if (fs.existsSync(checkPath)) {
      const stat = fs.statSync(checkPath);
      if (stat.isFile()) {
        const content = fs.readFileSync(checkPath, 'utf-8');
        if (content.includes('webhook:') || content.includes('vct:') || content.includes('domain')) {
          hasDomainSeparation = true;
        }
      } else if (stat.isDirectory()) {
        const files = fs.readdirSync(checkPath);
        for (const f of files) {
          const fp = path.join(checkPath, f);
          if (fs.statSync(fp).isFile() && (f.endsWith('.ts') || f.endsWith('.js'))) {
            const content = fs.readFileSync(fp, 'utf-8');
            if (content.includes('webhook:') || content.includes('vct:') || content.includes('domain')) {
              hasDomainSeparation = true;
            }
          }
        }
      }
    }
  }

  payloads.push({
    collector: 'source-analysis',
    artifact: 'app/api/webhook/',
    status: hasDomainSeparation ? 'PASS' : 'FAIL',
    metadata: {
      capability: 'hmac-webhook',
      hasDomainSeparation,
      reason: hasDomainSeparation
        ? 'Domain-separated HMAC key derivation detected'
        : 'No domain prefix found in HMAC key derivation',
    },
  });

  return payloads;
}

// ─── Collector: Test Coverage ────────────────────────────────────────────────

function collectTestCoverage() {
  const payloads = [];
  const testDir = path.join(REPO_ROOT, 'test');

  if (!fs.existsSync(testDir)) {
    payloads.push({
      collector: 'test-coverage',
      artifact: 'test/',
      status: 'PENDING',
      metadata: { reason: 'test/ directory not found' },
    });
    return payloads;
  }

  // Check for TEE verifier tests
  const teeTestFile = path.join(testDir, 'TEEVerifier.t.sol');
  if (fileExists(teeTestFile)) {
    const content = fs.readFileSync(teeTestFile, 'utf-8');
    const hasVerifyCall = content.includes('verify') || content.includes('attest');
    payloads.push({
      collector: 'test-coverage',
      artifact: 'test/TEEVerifier.t.sol',
      digest: fileDigest(teeTestFile),
      status: hasVerifyCall ? 'PASS' : 'FAIL',
      metadata: {
        capability: 'zk-proof-verification',
        hasVerifyCall,
        lines: content.split('\n').length,
      },
    });
  }

  // Check for CircuitBreaker tests
  const cbTestFiles = ['CircuitBreaker.t.sol', 'CircuitBreakerV2.t.sol'];
  for (const cbFile of cbTestFiles) {
    const cbPath = path.join(testDir, cbFile);
    if (fileExists(cbPath)) {
      payloads.push({
        collector: 'test-coverage',
        artifact: `test/${cbFile}`,
        digest: fileDigest(cbPath),
        status: 'PASS',
        metadata: {
          capability: 'circuit-breaker',
          lines: fs.readFileSync(cbPath, 'utf-8').split('\n').length,
        },
      });
    }
  }

  // Check for calibration data
  const calibrationFile = path.join(testDir, 'aggregate-calibration.js');
  if (fileExists(calibrationFile)) {
    const content = fs.readFileSync(calibrationFile, 'utf-8');
    const nMatch = content.match(/n\s*[=><]+\s*(\d+)/);
    const datasetSize = nMatch ? parseInt(nMatch[1], 10) : 0;

    payloads.push({
      collector: 'test-coverage',
      artifact: 'test/aggregate-calibration.js',
      digest: fileDigest(calibrationFile),
      status: datasetSize >= 200 ? 'PASS' : 'FAIL',
      metadata: {
        capability: 'bayesian-calibration',
        datasetSize,
        threshold: 200,
        sufficient: datasetSize >= 200,
      },
    });
  }

  return payloads;
}

// ─── Collector: Config Scan ──────────────────────────────────────────────────

function collectConfigScan() {
  const payloads = [];

  const envLocal = path.join(REPO_ROOT, '.env.local');
  const envExample = path.join(REPO_ROOT, '.env.example');

  if (fileExists(envLocal)) {
    const content = fs.readFileSync(envLocal, 'utf-8');
    const hasPolygonRpc = content.includes('POLYGON_AMOY_RPC_URL');
    const hasCircuitBreaker = content.includes('CIRCUIT_BREAKER_ADDRESS');

    payloads.push({
      collector: 'config-scan',
      artifact: '.env.local',
      status: 'PASS',
      metadata: {
        hasPolygonRpc,
        hasCircuitBreaker,
      },
    });
  }

  if (fileExists(envExample)) {
    payloads.push({
      collector: 'config-scan',
      artifact: '.env.example',
      status: 'PASS',
      metadata: { present: true },
    });
  }

  return payloads;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function collectAll() {
  const allPayloads = [
    ...collectFoundryBroadcast(),
    ...collectSourceAnalysis(),
    ...collectTestCoverage(),
    ...collectConfigScan(),
  ];

  return allPayloads;
}

if (require.main === module) {
  const payloads = collectAll();
  process.stdout.write(JSON.stringify(payloads, null, 2));
}

module.exports = { collectAll };
