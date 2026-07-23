/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// Epistemic Runtime v0.8 — Projection Engine
// Consumes facts and produces derived views. Immutable, deterministic.

import type { Fact, FactType, Projection } from './types';
import { computeSHA256 } from './hashing';
import { canonicalize } from './canonicalization';

/**
 * A projection handler that processes facts and maintains state.
 */
export interface ProjectionHandler {
  /** Name of this projection */
  name: string;
  /** Fact types this projection consumes */
  consumes: FactType[];
  /** Initial state */
  initialState: Record<string, unknown>;
  /** Process a fact and return updated state */
  apply(state: Record<string, unknown>, fact: Fact): Record<string, unknown>;
}

export class ProjectionEngine {
  private handlers: Map<string, ProjectionHandler> = new Map();
  private projections: Map<string, Projection> = new Map();
  private factRoots: Map<string, string[]> = new Map(); // projection name → fact hashes

  /**
   * Register a projection handler.
   */
  register(handler: ProjectionHandler): void {
    this.handlers.set(handler.name, handler);
    this.projections.set(handler.name, {
      id: computeSHA256(`projection:${handler.name}:1`),
      name: handler.name,
      version: 1,
      consumes: handler.consumes,
      state: handler.initialState,
      factRoot: computeSHA256('empty'),
      stateHash: computeSHA256(canonicalize(handler.initialState)),
      registeredAt: 0,
      updatedAt: 0,
      deprecated: false,
    });
    this.factRoots.set(handler.name, []);
  }

  /**
   * Apply a fact to all relevant projections.
   */
  applyFact(fact: Fact): void {
    for (const [name, handler] of this.handlers) {
      if (!handler.consumes.includes(fact.type)) continue;

      const projection = this.projections.get(name)!;
      if (projection.deprecated) continue;

      // Apply the fact
      const newState = handler.apply(projection.state, fact);

      // Track fact hash for root computation
      const roots = this.factRoots.get(name) ?? [];
      roots.push(fact.hash);
      this.factRoots.set(name, roots);

      // Compute new fact root (hash of all contributing fact hashes)
      const factRoot = computeSHA256(roots.join(''));

      // Compute new state hash
      const stateHash = computeSHA256(canonicalize(newState));

      // Update projection (immutable — create new object)
      this.projections.set(name, {
        ...projection,
        state: newState,
        factRoot,
        stateHash,
        updatedAt: fact.timestamp,
      });
    }
  }

  /**
   * Get a projection by name.
   */
  get(name: string): Projection | null {
    return this.projections.get(name) ?? null;
  }

  /**
   * Get all projections.
   */
  getAll(): Projection[] {
    return Array.from(this.projections.values());
  }

  /**
   * Deprecate a projection.
   */
  deprecate(name: string): void {
    const projection = this.projections.get(name);
    if (projection) {
      this.projections.set(name, {
        ...projection,
        deprecated: true,
      });
    }
  }

  /**
   * Reset all projections for replay.
   */
  reset(): void {
    for (const [name, handler] of this.handlers) {
      this.projections.set(name, {
        id: computeSHA256(`projection:${handler.name}:1`),
        name: handler.name,
        version: 1,
        consumes: handler.consumes,
        state: handler.initialState,
        factRoot: computeSHA256('empty'),
        stateHash: computeSHA256(canonicalize(handler.initialState)),
        registeredAt: 0,
        updatedAt: 0,
        deprecated: false,
      });
      this.factRoots.set(name, []);
    }
  }
}
