import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL ?? 'https://rpc-amoy.polygon.technology';
const GOVERNANCE_ANCHOR_ADDRESS = process.env.GOVERNANCE_ANCHOR_ADDRESS ?? '';
const CIRCUIT_BREAKER_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS ?? '';

const GOVERNANCE_ANCHOR_ABI = [
  'function verifier() view returns (address)',
  'function anchorCount() view returns (uint256)',
  'function isAnchoredValid(bytes32 assetId) view returns (bool)',
];

const CIRCUIT_BREAKER_ABI = [
  'function circuitOpen() view returns (bool)',
  'function owner() view returns (address)',
];

interface ProofBridgeStatus {
  online: boolean;
  network?: string;
  chainId?: number;
  contracts: {
    governanceAnchor: {
      deployed: boolean;
      address: string;
      anchorCount?: number;
      verifierAddress?: string;
    };
    circuitBreaker: {
      deployed: boolean;
      address: string;
      circuitOpen?: boolean;
    };
  };
  onChainVerification: {
    failClosedVerified: boolean;
    unsetAssetValid: boolean;
  };
  error?: string;
}

/**
 * GET /api/proofbridge/status
 * Live on-chain status for ProofBridge contracts.
 * Reads directly from Polygon Amoy RPC to verify:
 * - GovernanceAnchor deployment and state
 * - CircuitBreaker state
 * - Fail-closed verification (isAnchoredValid for unset asset)
 */
export async function GET(): Promise<NextResponse> {
  const status: ProofBridgeStatus = {
    online: false,
    contracts: {
      governanceAnchor: {
        deployed: false,
        address: GOVERNANCE_ANCHOR_ADDRESS,
      },
      circuitBreaker: {
        deployed: false,
        address: CIRCUIT_BREAKER_ADDRESS,
      },
    },
    onChainVerification: {
      failClosedVerified: false,
      unsetAssetValid: false,
    },
  };

  try {
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const network = await provider.getNetwork();
    status.network = network.name;
    status.chainId = Number(network.chainId);

    // Check GovernanceAnchor
    if (GOVERNANCE_ANCHOR_ADDRESS && GOVERNANCE_ANCHOR_ADDRESS !== '') {
      try {
        const anchorContract = new ethers.Contract(
          GOVERNANCE_ANCHOR_ADDRESS,
          GOVERNANCE_ANCHOR_ABI,
          provider
        );

        const anchorCount = await anchorContract.anchorCount();
        const verifierAddress = await anchorContract.verifier();
        const unsetAssetId = ethers.keccak256(ethers.toUtf8Bytes('proofbridge-status-probe'));
        const isAnchoredValid = await anchorContract.isAnchoredValid(unsetAssetId);

        status.contracts.governanceAnchor = {
          deployed: true,
          address: GOVERNANCE_ANCHOR_ADDRESS,
          anchorCount: Number(anchorCount),
          verifierAddress,
        };

        // Fail-closed: isAnchoredValid MUST return false for unset asset
        status.onChainVerification.failClosedVerified = isAnchoredValid === false;
        status.onChainVerification.unsetAssetValid = isAnchoredValid;
      } catch {
        status.contracts.governanceAnchor.deployed = false;
      }
    }

    // Check CircuitBreaker
    if (CIRCUIT_BREAKER_ADDRESS && CIRCUIT_BREAKER_ADDRESS !== '') {
      try {
        const cbContract = new ethers.Contract(
          CIRCUIT_BREAKER_ADDRESS,
          CIRCUIT_BREAKER_ABI,
          provider
        );
        const circuitOpen = await cbContract.circuitOpen();
        status.contracts.circuitBreaker = {
          deployed: true,
          address: CIRCUIT_BREAKER_ADDRESS,
          circuitOpen,
        };
      } catch {
        status.contracts.circuitBreaker.deployed = false;
      }
    }

    status.online = true;
  } catch (err) {
    status.error = err instanceof Error ? err.message : 'RPC connection failed';
  }

  return NextResponse.json({
    ok: true,
    service: 'proofbridge',
    status,
    timestamp: new Date().toISOString(),
  });
}
