// contracts/contract-negotiation.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 3: Contract Version Negotiation
// Handles version negotiation between adapters and the runtime.
// ───────────────────────────────────────────────────────────────

import { CONTRACT_VERSION, type AdapterMetadata } from "./runtime-contracts";

// ─── Version Negotiation Types ────────────────────────────────

export interface NegotiationRequest {
  adapterId: string;
  adapterVersion: string;
  requestedContracts: string[];
  minRuntimeVersion?: string;
  capabilities?: string[];
}

export interface NegotiationResponse {
  adapterId: string;
  accepted: boolean;
  negotiatedVersion: string;
  acceptedContracts: string[];
  rejectedContracts: string[];
  reason?: string;
  alternatives?: string[];
}

export interface VersionCompatibility {
  adapterVersion: string;
  runtimeVersion: string;
  compatible: boolean;
  reason: string;
}

// ─── Semantic Version Utilities ───────────────────────────────

export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function isMajorCompatible(
  adapterVersion: string,
  runtimeVersion: string,
): VersionCompatibility {
  const adapter = parseVersion(adapterVersion);
  const runtime = parseVersion(runtimeVersion);

  if (!adapter || !runtime) {
    return {
      adapterVersion,
      runtimeVersion,
      compatible: false,
      reason: `Invalid version format: adapter="${adapterVersion}", runtime="${runtimeVersion}"`,
    };
  }

  if (adapter.major !== runtime.major) {
    return {
      adapterVersion,
      runtimeVersion,
      compatible: false,
      reason: `Major version mismatch: adapter=${adapter.major}, runtime=${runtime.major}`,
    };
  }

  return {
    adapterVersion,
    runtimeVersion,
    compatible: true,
    reason: `Major versions match (${adapter.major}.x)`,
  };
}

export function isMinorCompatible(
  adapterVersion: string,
  runtimeVersion: string,
): VersionCompatibility {
  const adapter = parseVersion(adapterVersion);
  const runtime = parseVersion(runtimeVersion);

  if (!adapter || !runtime) {
    return {
      adapterVersion,
      runtimeVersion,
      compatible: false,
      reason: `Invalid version format`,
    };
  }

  if (adapter.major !== runtime.major) {
    return {
      adapterVersion,
      runtimeVersion,
      compatible: false,
      reason: `Major version mismatch`,
    };
  }

  if (adapter.minor > runtime.minor) {
    return {
      adapterVersion,
      runtimeVersion,
      compatible: false,
      reason: `Adapter requires newer runtime: adapter=${adapter.minor}, runtime=${runtime.minor}`,
    };
  }

  return {
    adapterVersion,
    runtimeVersion,
    compatible: true,
    reason: `Minor versions compatible: adapter=${adapter.minor}, runtime=${runtime.minor}`,
  };
}

// ─── Contract Negotiator ──────────────────────────────────────

export class ContractNegotiator {
  private supportedContracts: Map<string, string> = new Map();

  constructor() {
    // Register the default contract version
    this.supportedContracts.set("BaseAdapterContract", CONTRACT_VERSION);
    this.supportedContracts.set("FullAdapterContract", CONTRACT_VERSION);
  }

  /**
   * Register a contract type with its version.
   */
  registerContract(contractName: string, version: string): void {
    this.supportedContracts.set(contractName, version);
  }

  /**
   * Get the supported version for a contract.
   */
  getContractVersion(contractName: string): string | undefined {
    return this.supportedContracts.get(contractName);
  }

  /**
   * Get all supported contracts and their versions.
   */
  getSupportedContracts(): [string, string][] {
    return Array.from(this.supportedContracts.entries());
  }

  /**
   * Negotiate contract version with an adapter.
   * Returns which contracts are accepted/rejected.
   */
  negotiate(request: NegotiationRequest): NegotiationResponse {
    const acceptedContracts: string[] = [];
    const rejectedContracts: string[] = [];
    let allCompatible = true;
    let rejectionReason: string | undefined;

    // Check runtime version compatibility
    if (request.minRuntimeVersion) {
      const compat = isMajorCompatible(
        CONTRACT_VERSION,
        request.minRuntimeVersion,
      );
      if (!compat.compatible) {
        return {
          adapterId: request.adapterId,
          accepted: false,
          negotiatedVersion: CONTRACT_VERSION,
          acceptedContracts: [],
          rejectedContracts: request.requestedContracts,
          reason: `Runtime version incompatible: ${compat.reason}`,
        };
      }
    }

    // Check each requested contract
    for (const contractName of request.requestedContracts) {
      const supportedVersion = this.supportedContracts.get(contractName);

      if (!supportedVersion) {
        rejectedContracts.push(contractName);
        allCompatible = false;
        if (!rejectionReason) {
          rejectionReason = `Contract "${contractName}" is not supported by the runtime`;
        }
        continue;
      }

      // For now, accept if the contract name is known
      // In a real implementation, we'd check semver compatibility
      acceptedContracts.push(contractName);
    }

    // Determine overall acceptance
    const accepted = allCompatible && acceptedContracts.length > 0;

    return {
      adapterId: request.adapterId,
      accepted,
      negotiatedVersion: CONTRACT_VERSION,
      acceptedContracts,
      rejectedContracts,
      reason: rejectionReason,
      alternatives: allCompatible ? undefined : this.getAlternatives(rejectedContracts),
    };
  }

  /**
   * Verify that an adapter's metadata matches the negotiated contracts.
   */
  verifyNegotiation(
    metadata: AdapterMetadata,
    response: NegotiationResponse,
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!response.accepted) {
      issues.push(`Negotiation was rejected for adapter "${metadata.adapterId}"`);
    }

    if (response.negotiatedVersion !== CONTRACT_VERSION) {
      issues.push(
        `Negotiated version mismatch: expected "${CONTRACT_VERSION}", got "${response.negotiatedVersion}"`,
      );
    }

    if (metadata.minRuntimeVersion) {
      const compat = isMajorCompatible(
        CONTRACT_VERSION,
        metadata.minRuntimeVersion,
      );
      if (!compat.compatible) {
        issues.push(`Adapter requires runtime version ${metadata.minRuntimeVersion}, but runtime is ${CONTRACT_VERSION}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Suggest alternatives for unsupported contracts.
   */
  private getAlternatives(unsupported: string[]): string[] {
    const alternatives: string[] = [];

    for (const contract of unsupported) {
      if (contract.includes("Governance")) {
        alternatives.push("CapabilityContractV1");
      }
      if (contract.includes("Evidence")) {
        alternatives.push("CapabilityContractV1");
      }
      if (contract.includes("Configuration")) {
        alternatives.push("LifecycleContractV1");
      }
    }

    return Array.from(new Set(alternatives));
  }
}

// ─── Singleton ────────────────────────────────────────────────

let _instance: ContractNegotiator | null = null;

export function getContractNegotiator(): ContractNegotiator {
  if (!_instance) {
    _instance = new ContractNegotiator();
  }
  return _instance;
}

export function resetContractNegotiator(): void {
  _instance = null;
}
