/**
 * EIS — Evidence Independence Specification
 *
 * Backend of the IVE (Integrated Verification Environment) per the VVU stack.
 *
 *   Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action
 *
 * Exports the public EIS API surface consumed by IVE API routes.
 */

export * from "./types";
export * from "./state-lattice";
export * from "./participation-ratio";
export * from "./heat-kernel";
export * from "./authorization";
export * from "./circuit-breaker";
export * from "./evidence-mesh";
