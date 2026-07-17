// src/lib/evidence/hashing.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Envelope Hashing
// Deterministic SHA-256 hash of stages 1-6 for immutable fingerprint.
// ───────────────────────────────────────────────────────────────

import { createHash } from "node:crypto";
import type { UnsignedEnvelope } from "./envelope";

// ─── Deterministic Serialization ──────────────────────────────

/**
 * Deep-sort object keys for deterministic JSON serialization.
 * Handles nested objects and arrays recursively.
 */
function deepSortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(deepSortKeys);

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  for (const key of keys) {
    sorted[key] = deepSortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Canonical JSON: deterministic serialization with sorted keys at all depths.
 */
function canonicalJson(obj: unknown): string {
  return JSON.stringify(deepSortKeys(obj));
}

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
 * Uses SHA-256 over the deterministic JSON of stages 1-6.
 *
 * Deterministic: same input → same hash (always).
 * Collision-sensitive: any change → different hash.
 */
export function hashExecutionEnvelope(envelope: UnsignedEnvelope): string {
  const stages = extractStages(envelope);
  const payload = canonicalJson(stages);
  return createHash("sha256").update(payload, "utf8").digest("hex");
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
