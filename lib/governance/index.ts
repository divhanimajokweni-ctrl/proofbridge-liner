/**
 * Governance module index
 *
 * Re-exports all governance types and functions for easy import:
 *
 *   import { validateTransition, CompatibilityLevel } from "@/lib/governance";
 *   import { signRegistry, verifyRegistry } from "@/lib/governance";
 *   import { registerSigner, verifyAggregatedSignature } from "@/lib/governance";
 */

export * from "./compatibility";
export * from "./signed-registry";
export * from "./quorum-registry";
