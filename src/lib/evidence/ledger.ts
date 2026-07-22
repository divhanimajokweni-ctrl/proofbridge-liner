// src/lib/evidence/ledger.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Evidence Ledger Storage
// Append-only ledger for immutable evidence envelopes.
// Adapted from proofbridge-liner: uses numeric timestamps from
// injected clock instead of Date objects.
// ───────────────────────────────────────────────────────────────

import type { ExecutionEnvelope, EvidenceLedgerEntry as EnvelopeLedgerEntry } from './envelope';
import type { ClockProvider } from '@/lib/kernel/types';

// ─── Storage Interface ────────────────────────────────────────

export interface EvidenceLedgerStorage {
  append(envelope: ExecutionEnvelope): Promise<void>;
  get(envelopeId: string): Promise<ExecutionEnvelope | null>;
  query(filter: {
    tenantId?: string;
    capabilityId?: string;
    agentId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<ExecutionEnvelope[]>;
  count(): Promise<number>;
}

// ─── In-Memory Implementation (dev/test) ──────────────────────

export class InMemoryEvidenceLedger implements EvidenceLedgerStorage {
  private envelopes: ExecutionEnvelope[] = [];
  private index: Map<string, ExecutionEnvelope> = new Map();

  async append(envelope: ExecutionEnvelope): Promise<void> {
    // Append-only: never overwrite
    this.envelopes.push(envelope);
    this.index.set(envelope.envelope_id, envelope);
  }

  async get(envelopeId: string): Promise<ExecutionEnvelope | null> {
    return this.index.get(envelopeId) ?? null;
  }

  async query(filter: {
    tenantId?: string;
    capabilityId?: string;
    agentId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<ExecutionEnvelope[]> {
    let results = this.envelopes;

    if (filter.tenantId) {
      results = results.filter((e) => e.tenant_id === filter.tenantId);
    }
    if (filter.capabilityId) {
      results = results.filter((e) => e.capability_id === filter.capabilityId);
    }
    if (filter.agentId) {
      results = results.filter((e) => e.agent_id === filter.agentId);
    }
    if (filter.startTime !== undefined) {
      results = results.filter((e) => e.created_at >= filter.startTime!);
    }
    if (filter.endTime !== undefined) {
      results = results.filter((e) => e.created_at <= filter.endTime!);
    }

    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async count(): Promise<number> {
    return this.envelopes.length;
  }

  /**
   * Clear all envelopes (for testing).
   */
  clear(): void {
    this.envelopes = [];
    this.index.clear();
  }
}

// ─── Ledger Entry Builder ─────────────────────────────────────

export type { EnvelopeLedgerEntry };

/**
 * Build an EvidenceLedgerEntry from a signed envelope.
 * Uses injected clock for timestamps (no Date.now()).
 */
export function buildLedgerEntry(
  envelope: ExecutionEnvelope,
  verified: boolean,
  clock: ClockProvider,
): EnvelopeLedgerEntry {
  const now = clock.now();
  return {
    action: 'gate_evaluation',
    evidence_type: 'execution_envelope',
    envelope,
    envelope_id: envelope.envelope_id,
    is_cryptographically_verified: verified,
    verification_timestamp: verified ? now : undefined,
    created_at: now,
  };
}
