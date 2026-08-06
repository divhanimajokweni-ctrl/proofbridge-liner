// contracts/contract-registry.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 3: Contract Registry
// Central registry for adapter registration, lookup, and verification.
// ───────────────────────────────────────────────────────────────

import {
  type BaseAdapterContract,
  type FullAdapterContract,
  type AdapterMetadata,
  type AdapterCategory,
  isCapabilityContract,
  isBaseAdapterContract,
  isFullAdapterContract,
} from "./runtime-contracts";
import {
  ContractVerifier,
  type FullVerificationReport,
  type ContractVerificationResult,
} from "./contract-verifier";

// ─── Registry Entry ───────────────────────────────────────────

export interface RegistryEntry {
  adapterId: string;
  adapterName: string;
  instance: BaseAdapterContract | FullAdapterContract;
  metadata: AdapterMetadata;
  contractLevel: "base" | "full";
  registeredAt: number;
  lastVerifiedAt: number | null;
  lastVerificationResult: ContractVerificationResult | null;
}

export type AdapterCategoryFilter = AdapterCategory | "all";

// ─── Contract Registry ────────────────────────────────────────

export class ContractRegistry {
  private entries: Map<string, RegistryEntry> = new Map();
  private verifier: ContractVerifier;

  constructor() {
    this.verifier = new ContractVerifier();
  }

  /**
   * Register an adapter instance. Verifies it implements at least
   * BaseAdapterContract. Stores the verification result.
   */
  register(
    instance: BaseAdapterContract | FullAdapterContract,
    metadata?: Partial<AdapterMetadata>,
  ): RegistryEntry {
    // Determine contract level
    const isFull = isFullAdapterContract(instance);
    const contractLevel = isFull ? "full" : "base";

    // Determine adapter ID — use metadata if provided, otherwise try getMetadata()
    let adapterId: string;
    if (metadata?.adapterId) {
      adapterId = metadata.adapterId;
    } else if (isCapabilityContract(instance)) {
      adapterId = instance.getMetadata().adapterId;
    } else {
      // Cannot extract adapter ID — fail immediately
      throw new Error(
        "Adapter failed contract verification:\n" +
          "  - capability.implements: Adapter does not implement CapabilityContractV1",
      );
    }

    // Verify the adapter
    const verification = isFull
      ? this.verifier.verifyFullAdapter(adapterId, instance)
      : this.verifier.verifyBaseAdapter(adapterId, instance);

    if (!verification.passed) {
      const errors = verification.violations.filter((v) => v.severity === "error");
      throw new Error(
        `Adapter "${adapterId}" failed contract verification:\n` +
          errors.map((e) => `  - ${e.rule}: ${e.message}`).join("\n"),
      );
    }

    // Get metadata from instance if not provided
    const instanceMetadata = (instance as BaseAdapterContract).getMetadata();
    const mergedMetadata: AdapterMetadata = {
      ...instanceMetadata,
      ...metadata,
      adapterId,
    };

    const entry: RegistryEntry = {
      adapterId,
      adapterName: mergedMetadata.adapterName,
      instance,
      metadata: mergedMetadata,
      contractLevel,
      registeredAt: Date.now(),
      lastVerifiedAt: Date.now(),
      lastVerificationResult: verification,
    };

    this.entries.set(adapterId, entry);
    return entry;
  }

  /**
   * Unregister an adapter.
   */
  unregister(adapterId: string): boolean {
    return this.entries.delete(adapterId);
  }

  /**
   * Get a registered adapter by ID.
   */
  get(adapterId: string): RegistryEntry | undefined {
    return this.entries.get(adapterId);
  }

  /**
   * Get a typed adapter instance by ID.
   */
  getTyped<T extends BaseAdapterContract | FullAdapterContract>(
    adapterId: string,
  ): T | undefined {
    const entry = this.entries.get(adapterId);
    if (!entry) return undefined;
    return entry.instance as T;
  }

  /**
   * Find all adapters that implement a specific contract type.
   */
  findByContract(
    contractType: "base" | "full",
  ): RegistryEntry[] {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.contractLevel === contractType,
    );
  }

  /**
   * Find adapters by category.
   */
  findByCategory(category: AdapterCategoryFilter): RegistryEntry[] {
    if (category === "all") {
      return Array.from(this.entries.values());
    }
    return Array.from(this.entries.values()).filter(
      (entry) => entry.metadata.category === category,
    );
  }

  /**
   * Get all registered adapters.
   */
  getAll(): RegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get all adapter IDs.
   */
  getAdapterIds(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get the count of registered adapters.
   */
  getCount(): number {
    return this.entries.size;
  }

  /**
   * Re-verify all registered adapters.
   * Returns a full verification report.
   */
  verifyAll(): FullVerificationReport {
    const start = Date.now();
    const contractResults: ContractVerificationResult[] = [];
    let allPassed = true;

    for (const [adapterId, entry] of Array.from(this.entries)) {
      const verification =
        entry.contractLevel === "full"
          ? this.verifier.verifyFullAdapter(adapterId, entry.instance)
          : this.verifier.verifyBaseAdapter(adapterId, entry.instance);

      contractResults.push(verification);

      if (!verification.passed) {
        allPassed = false;
      }

      // Update entry
      entry.lastVerifiedAt = Date.now();
      entry.lastVerificationResult = verification;
    }

    const totalViolations = contractResults.reduce(
      (sum, r) => sum + r.violations.length,
      0,
    );

    return {
      adapterId: "registry",
      adapterName: "ContractRegistry",
      allPassed,
      contractResults,
      totalViolations,
      verifiedAt: Date.now(),
      durationMs: Date.now() - start,
    };
  }

  /**
   * Re-verify a specific adapter.
   */
  verify(adapterId: string): ContractVerificationResult | null {
    const entry = this.entries.get(adapterId);
    if (!entry) return null;

    const verification =
      entry.contractLevel === "full"
        ? this.verifier.verifyFullAdapter(adapterId, entry.instance)
        : this.verifier.verifyBaseAdapter(adapterId, entry.instance);

    entry.lastVerifiedAt = Date.now();
    entry.lastVerificationResult = verification;

    return verification;
  }

  /**
   * Check if an adapter is registered.
   */
  has(adapterId: string): boolean {
    return this.entries.has(adapterId);
  }

  /**
   * Get a summary of the registry state.
   */
  getSummary(): {
    total: number;
    base: number;
    full: number;
    byCategory: Record<string, number>;
  } {
    const all = Array.from(this.entries.values());
    const byCategory: Record<string, number> = {};

    for (const entry of all) {
      const cat = entry.metadata.category;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      total: all.length,
      base: all.filter((e) => e.contractLevel === "base").length,
      full: all.filter((e) => e.contractLevel === "full").length,
      byCategory,
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────

let _instance: ContractRegistry | null = null;

export function getContractRegistry(): ContractRegistry {
  if (!_instance) {
    _instance = new ContractRegistry();
  }
  return _instance;
}

export function resetContractRegistry(): void {
  _instance = null;
}
