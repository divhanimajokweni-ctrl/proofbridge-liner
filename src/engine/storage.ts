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

// Epistemic Runtime v0.8 — Storage Provider
// In-memory WORM storage for development. Production uses S3 Object Lock.

import type { Fact, Proof, Projection, StorageProvider } from '@/lib/kernel/types';

export class InMemoryWORMStorage implements StorageProvider {
  private facts: Map<string, Fact> = new Map();
  private factsBySequence: Fact[] = [];
  private proofs: Map<string, Proof[]> = new Map();
  private projections: Map<string, Projection> = new Map();
  readonly isWORM = true;

  async append(fact: Fact): Promise<void> {
    // WORM: reject if fact with same ID already exists
    if (this.facts.has(fact.id)) {
      throw new Error(`WORM violation: fact ${fact.id} already exists`);
    }
    this.facts.set(fact.id, fact);
    this.factsBySequence.push(fact);
  }

  async getFact(id: string): Promise<Fact | null> {
    return this.facts.get(id) ?? null;
  }

  async getFacts(since?: number, limit?: number): Promise<Fact[]> {
    let facts = this.factsBySequence;
    if (since !== undefined) {
      facts = facts.filter(f => f.sequence >= since);
    }
    if (limit !== undefined) {
      facts = facts.slice(0, limit);
    }
    return facts;
  }

  async getProof(factId: string): Promise<Proof | null> {
    const proofs = this.proofs.get(factId);
    return proofs?.[0] ?? null;
  }

  async appendProof(proof: Proof): Promise<void> {
    const existing = this.proofs.get(proof.factId) ?? [];
    existing.push(proof);
    this.proofs.set(proof.factId, existing);
  }

  async getProofs(factId: string): Promise<Proof[]> {
    return this.proofs.get(factId) ?? [];
  }

  async saveProjection(projection: Projection): Promise<void> {
    this.projections.set(projection.id, projection);
  }

  async getProjection(id: string): Promise<Projection | null> {
    return this.projections.get(id) ?? null;
  }

  /** Clear all data — only for testing/replay */
  clear(): void {
    this.facts.clear();
    this.factsBySequence = [];
    this.proofs.clear();
    this.projections.clear();
  }

  /** Get total fact count */
  get factCount(): number {
    return this.factsBySequence.length;
  }
}
