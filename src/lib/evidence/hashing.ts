// src/lib/evidence/hashing.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Envelope Hashing
// Deterministic SHA-256 hash of stages 1-6 for immutable fingerprint.
// Adapted from proofbridge-liner: uses kernel canonicalization and
// hashing instead of node:crypto and ad-hoc canonical JSON.
// ───────────────────────────────────────────────────────────────

import { canonicalize } from '@/lib/kernel/canonicalization';
import { computeSHA256 } from '@/lib/kernel/hashing';
import type { UnsignedEnvelope } from './envelope';

// ─── Envelope Hashing ─────────────────────────────────────────

/**
 * Extract the 6 stages from an unsigned envelope for hashing.
 * Excludes envelope_id, tenant_id, capability_id, agent_id, goal_id
 * (metadata) — only hashes the execution content.
 */
function extractStages(envelope: UnsignedEnvelope) {
  return {
    request: envelope.request,
    policy_decision: envelope.policy_decision,
    selected_model: envelope.selected_model,
    tool_calls: envelope.tool_calls,
    output: envelope.output,
    validation: envelope.validation,
  };
}

/**
 * Hash an unsigned envelope to create an immutable fingerprint.
 * Uses SHA-256 over the RFC 8785 canonical JSON of stages 1-6.
 *
 * Deterministic: same input → same hash (always).
 * Collision-sensitive: any change → different hash.
 */
export function hashExecutionEnvelope(envelope: UnsignedEnvelope): string {
  const stages = extractStages(envelope);
  const payload = canonicalize(stages);
  return computeSHA256(payload);
}

/**
 * Verify that an envelope's hash matches its content.
 * Returns true if the hash is valid.
 */
export function verifyEnvelopeHash(
  envelope: UnsignedEnvelope & { envelope_hash: string },
): boolean {
  const computed = hashExecutionEnvelope(envelope);
  return computed === envelope.envelope_hash;
}
