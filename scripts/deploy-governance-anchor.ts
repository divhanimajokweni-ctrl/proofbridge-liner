#!/usr/bin/env node
/**
 * HF-003: Deploy GovernanceAnchor.sol (and its Groth16Verifier dependency)
 * to Polygon Amoy, with real read-back verification and evidence capture.
 *
 * HARDENED (AIR Kernel v1.0):
 * - Post-deployment hooks fetch and commit live contract addresses, block
 *   numbers, and Etherscan/Polygonscan verification status to the evidence
 *   registry.
 * - Fail-closed: isAnchoredValid() MUST return false for un-anchored assets.
 * - Evidence envelope: deployment receipt includes all verifiable artifacts
 *   for compliance-grade audit trail.
 * - Live network targeting: supports Polygon Amoy (80002) and can be
 *   extended to other EVM networks via RPC_URL configuration.
 *
 * Trust model:
 *   - Refuses to deploy without real compiled bytecode (no placeholders).
 *   - Nonce tracking: manually tracks nonce to avoid ethers v6 caching bugs.
 *   - Post-deploy: reads back on-chain state to verify contract integrity.
 *   - Evidence: writes deployment receipt to air/store/ for AIR pipeline.
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForgeArtifact {
  abi: unknown[];
  bytecode: { object: string };
}

export interface DeploymentEvidence {
  version: '1.0.0';
  network: string;
  chainId: number;
  rpcUrl: string;
  deployer: string;
  groth16Verifier: {
    address: string;
    deployTxHash: string;
    blockNumber: number;
    contractSize: number;
  };
  governanceAnchor: {
    address: string;
    deployTxHash: string;
    blockNumber: number;
    contractSize: number;
  };
  verification: {
    verifierAddressMatches: boolean;
    isAnchoredValidForUnsetAsset: boolean;
    anchorCountAfterDeploy: number;
  };
  etherscanVerification?: {
    verifierSubmitted: boolean;
    anchorSubmitted: boolean;
    verifierUrl?: string;
    anchorUrl?: string;
  };
  evidenceRegistry: {
    committedToLedger: boolean;
    ledgerPath: string;
    timestamp: string;
  };
  deployedAt: string;
}

// ---------------------------------------------------------------------------
// Artifact Loading
// ---------------------------------------------------------------------------

function loadArtifact(contractFile: string, contractName: string): ForgeArtifact {
  const artifactPath = path.join(process.cwd(), 'out', contractFile, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Compiled artifact not found at ${artifactPath}. Run "forge build" first — ` +
      `this script refuses to deploy without real, freshly compiled bytecode.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  if (!raw.bytecode?.object || raw.bytecode.object === '0x') {
    throw new Error(`Artifact at ${artifactPath} has no real bytecode — refusing to deploy.`);
  }
  if (!raw.abi || raw.abi.length === 0) {
    throw new Error(`Artifact at ${artifactPath} has no ABI — refusing to deploy.`);
  }
  return { abi: raw.abi, bytecode: raw.bytecode };
}

// ---------------------------------------------------------------------------
// Evidence Registry
// ---------------------------------------------------------------------------

function commitEvidenceToLedger(evidence: DeploymentEvidence): string {
  const evidenceDir = path.join(process.cwd(), 'evidence');
  const ledgerDir = path.join(evidenceDir, 'ledger');
  fs.mkdirSync(ledgerDir, { recursive: true });

  const ledgerPath = path.join(ledgerDir, `deployment-${evidence.chainId}-${Date.now()}.json`);
  fs.writeFileSync(ledgerPath, JSON.stringify(evidence, null, 2));

  // Also update the AIR evidence store
  const airEvidencePath = path.join(process.cwd(), 'air', 'store', 'evidence_log.json');
  let airEvidence: any[] = [];
  if (fs.existsSync(airEvidencePath)) {
    try {
      airEvidence = JSON.parse(fs.readFileSync(airEvidencePath, 'utf8'));
    } catch { /* start fresh */ }
  }

  airEvidence.push({
    id: `deployment-${evidence.chainId}-${Date.now()}`,
    artifact: 'contracts/GovernanceAnchor.sol',
    status: 'VERIFIED',
    conclusion: 'PASS',
    confidence: 1.0,
    metadata: {
      sourceExists: true,
      deployed: true,
      groth16VerifierAddress: evidence.groth16Verifier.address,
      governanceAnchorAddress: evidence.governanceAnchor.address,
      chainId: evidence.chainId,
      deployTxHash: evidence.governanceAnchor.deployTxHash,
      blockNumber: evidence.governanceAnchor.blockNumber,
      failClosedVerified: evidence.verification.isAnchoredValidForUnsetAsset === false,
    },
    evaluatedAt: evidence.deployedAt,
  });

  fs.writeFileSync(airEvidencePath, JSON.stringify(airEvidence, null, 2));

  return ledgerPath;
}

// ---------------------------------------------------------------------------
// Etherscan Verification (best-effort)
// ---------------------------------------------------------------------------

async function submitEtherscanVerification(
  provider: ethers.JsonRpcProvider,
  chainId: number,
  address: string,
  contractFile: string,
  contractName: string,
  constructorArgs: string[]
): Promise<{ submitted: boolean; url?: string }> {
  // Etherscan verification requires API key and is best-effort
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  if (!etherscanApiKey) {
    return { submitted: false };
  }

  const explorers: Record<number, string> = {
    80002: 'https://api-amoy.polygonscan.com/api',
    137: 'https://api.polygonscan.com/api',
    11155111: 'https://api-sepolia.etherscan.io/api',
    1: 'https://api.etherscan.io/api',
  };

  const apiUrl = explorers[chainId];
  if (!apiUrl) {
    return { submitted: false };
  }

  try {
    const artifact = loadArtifact(contractFile, contractName);
    const sourceCode = fs.readFileSync(
      path.join(process.cwd(), 'contracts', contractFile),
      'utf8'
    );

    const params = new URLSearchParams({
      apikey: etherscanApiKey,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: address,
      sourceCode,
      contractname: contractName,
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: constructorArgs.join(''),
    });

    const response = await fetch(apiUrl, { method: 'POST', body: params });
    const result = await response.json();

    if (result.status === '1') {
      const explorerBase = apiUrl.replace('/api', '');
      return {
        submitted: true,
        url: `${explorerBase}/address/${address}#code`,
      };
    }
    return { submitted: false };
  } catch {
    return { submitted: false };
  }
}

// ---------------------------------------------------------------------------
// Core Deployment
// ---------------------------------------------------------------------------

export async function deployGovernanceAnchor(
  provider: ethers.Provider,
  signer: ethers.Signer
): Promise<DeploymentEvidence> {
  const verifierArtifact = loadArtifact('Groth16Verifier.sol', 'Groth16Verifier');
  const anchorArtifact = loadArtifact('GovernanceAnchor.sol', 'GovernanceAnchor');

  const deployerAddress = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // Nonce tracking: sidestep ethers v6 caching bug on fast-mining chains
  let nonce = await provider.getTransactionCount(deployerAddress, 'pending');

  // 1. Deploy Groth16Verifier
  const verifierFactory = new ethers.ContractFactory(
    verifierArtifact.abi,
    verifierArtifact.bytecode.object,
    signer
  );
  const verifierContract = await verifierFactory.deploy({ nonce: nonce++ });
  await verifierContract.waitForDeployment();
  const verifierAddress = await verifierContract.getAddress();
  const verifierDeployTx = verifierContract.deploymentTransaction();
  const verifierReceipt = await verifierDeployTx!.wait();

  // 2. Deploy GovernanceAnchor (constructor takes verifier address)
  const anchorFactory = new ethers.ContractFactory(
    anchorArtifact.abi,
    anchorArtifact.bytecode.object,
    signer
  );
  const anchorContract = await anchorFactory.deploy(verifierAddress, { nonce: nonce++ });
  await anchorContract.waitForDeployment();
  const anchorAddress = await anchorContract.getAddress();
  const anchorDeployTx = anchorContract.deploymentTransaction();
  const anchorReceipt = await anchorDeployTx!.wait();

  // 3. Read-back verification — fail-closed checks
  const deployedVerifierAddress: string = await (anchorContract as any).verifier();
  const verifierAddressMatches =
    deployedVerifierAddress.toLowerCase() === verifierAddress.toLowerCase();

  const unsetAssetId = ethers.keccak256(ethers.toUtf8Bytes('hf-003-unset-probe-asset'));
  const isAnchoredValidForUnsetAsset: boolean =
    await (anchorContract as any).isAnchoredValid(unsetAssetId);

  const anchorCountAfterDeploy: bigint = await (anchorContract as any).anchorCount();

  // 4. Etherscan verification (best-effort)
  const verifierEthResult = await submitEtherscanVerification(
    provider as ethers.JsonRpcProvider,
    chainId,
    verifierAddress,
    'Groth16Verifier.sol',
    'Groth16Verifier',
    []
  );

  const anchorEthResult = await submitEtherscanVerification(
    provider as ethers.JsonRpcProvider,
    chainId,
    anchorAddress,
    'GovernanceAnchor.sol',
    'GovernanceAnchor',
    [verifierAddress]
  );

  // 5. Build evidence envelope
  const evidence: DeploymentEvidence = {
    version: '1.0.0',
    network: network.name,
    chainId,
    rpcUrl: (provider as ethers.JsonRpcProvider)._getConnection().url,
    deployer: deployerAddress,
    groth16Verifier: {
      address: verifierAddress,
      deployTxHash: verifierDeployTx!.hash,
      blockNumber: verifierReceipt!.blockNumber,
      contractSize: verifierArtifact.bytecode.object.length / 2 - 1,
    },
    governanceAnchor: {
      address: anchorAddress,
      deployTxHash: anchorDeployTx!.hash,
      blockNumber: anchorReceipt!.blockNumber,
      contractSize: anchorArtifact.bytecode.object.length / 2 - 1,
    },
    verification: {
      verifierAddressMatches,
      isAnchoredValidForUnsetAsset,
      anchorCountAfterDeploy: Number(anchorCountAfterDeploy),
    },
    etherscanVerification: {
      verifierSubmitted: verifierEthResult.submitted,
      anchorSubmitted: anchorEthResult.submitted,
      verifierUrl: verifierEthResult.url,
      anchorUrl: anchorEthResult.url,
    },
    evidenceRegistry: {
      committedToLedger: false,
      ledgerPath: '',
      timestamp: new Date().toISOString(),
    },
    deployedAt: new Date().toISOString(),
  };

  // 6. Fail-closed verification — hard abort on violation
  if (!verifierAddressMatches) {
    throw new Error(
      'FAIL-CLOSED: Read-back check failed — deployed GovernanceAnchor.verifier() ' +
      'does not match the deployed Groth16Verifier address. Refusing to commit.'
    );
  }
  if (isAnchoredValidForUnsetAsset !== false) {
    throw new Error(
      'FAIL-CLOSED: isAnchoredValid() returned true for an unset asset — ' +
      'fail-closed default is broken. Refusing to commit.'
    );
  }

  // 7. Commit to evidence ledger
  const ledgerPath = commitEvidenceToLedger(evidence);
  evidence.evidenceRegistry.committedToLedger = true;
  evidence.evidenceRegistry.ledgerPath = ledgerPath;

  // Overwrite with committed state
  fs.writeFileSync(ledgerPath, JSON.stringify(evidence, null, 2));

  return evidence;
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error(
      'POLYGON_AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY must be set. ' +
      'This is an operational requirement, not a code gap — refusing to ' +
      'proceed with a guessed or default RPC endpoint.'
    );
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  console.log(`Deploying to ${network.name} (chainId: ${network.chainId})...`);

  const evidence = await deployGovernanceAnchor(provider, signer);

  console.log('\n=== Deployment Complete ===');
  console.log(`  Groth16Verifier:    ${evidence.groth16Verifier.address}`);
  console.log(`  GovernanceAnchor:   ${evidence.governanceAnchor.address}`);
  console.log(`  Deploy tx:          ${evidence.governanceAnchor.deployTxHash}`);
  console.log(`  Block number:       ${evidence.governanceAnchor.blockNumber}`);
  console.log(`  Verifier match:     ${evidence.verification.verifierAddressMatches}`);
  console.log(`  Fail-closed check:  isAnchoredValid(unset)=${
    evidence.verification.isAnchoredValidForUnsetAsset
  }`);
  console.log(`  Anchor count:       ${evidence.verification.anchorCountAfterDeploy}`);
  console.log(`  Evidence ledger:    ${evidence.evidenceRegistry.ledgerPath}`);

  if (evidence.etherscanVerification?.verifierSubmitted) {
    console.log(`  Etherscan (verifier): ${evidence.etherscanVerification.verifierUrl}`);
  }
  if (evidence.etherscanVerification?.anchorSubmitted) {
    console.log(`  Etherscan (anchor):   ${evidence.etherscanVerification.anchorUrl}`);
  }

  const evidencePath = path.join(process.cwd(), 'evidence', 'hf-003-deployment.json');
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(`\n  Saved: ${evidencePath}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Deployment failed:', err.message);
    process.exit(1);
  });
}
