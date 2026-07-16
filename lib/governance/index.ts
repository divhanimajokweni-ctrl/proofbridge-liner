/**
 * Governance module index
 *
 * Re-exports all governance types and functions for easy import:
 *
 *   import { validateTransition, CompatibilityLevel } from "@/lib/governance";
 *   import { signRegistry, verifyRegistry } from "@/lib/governance";
 *   import { registerSigner, verifyAggregatedSignature } from "@/lib/governance";
 *
 * NOTE (AIR v3 Migration): The AIR Evidence Compiler pipeline uses its own
 * pluggable JS rule modules in air/governance/rules/. This TypeScript module
 * is preserved for backward compatibility with workspace packages that import
 * governance utilities directly. The AIR pipeline's normative-transition and
 * quorum-registry rules are derived from the logic in compatibility.ts and
 * quorum-registry.ts respectively, but operate on Inference IR rather than
 * raw TypeScript interfaces.
 */

export * from "./compatibility";
export * from "./signed-registry";
export * from "./quorum-registry";
