import { pgTable, bigserial, uuid, integer, varchar, jsonb, timestamp, primaryKey, unique, check, text, boolean as pgBoolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Trust Runtime — Durable Event Store Schema
// ---------------------------------------------------------------------------

/**
 * 1. Events Table (Append-Only, Hash-Chained, Multi-Tenant)
 *
 * Primary key enforces multi-tenant stream isolation and optimistic concurrency.
 * Each event is immutable once written.
 */
export const trustEvents = pgTable('trust_events', {
  sequenceNumber: bigserial('sequence_number', { mode: 'bigint' }),
  tenantId: uuid('tenant_id').notNull(),
  streamId: uuid('stream_id').notNull(),
  streamVersion: integer('stream_version').notNull(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  schemaVersion: integer('schema_version').notNull().default(1),
  payload: jsonb('payload').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),

  // Governance & Integrity Fields
  payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  eventHash: varchar('event_hash', { length: 64 }).notNull(),
  previousHash: varchar('previous_hash', { length: 64 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Enforce multi-tenant stream isolation and optimistic concurrency at the DB layer
  unique('uq_trust_stream_version').on(table.tenantId, table.streamId, table.streamVersion),
  unique('uq_trust_event_id').on(table.eventId),
  unique('uq_trust_sequence_number').on(table.sequenceNumber),
  check('chk_trust_version_positive', sql`${table.streamVersion} > 0`),
]);

/**
 * 2. Transactional Outbox (with Worker Leasing)
 *
 * Guarantees reliable delivery of events to external consumers (SSE/WebSocket).
 * Workers claim messages via FOR UPDATE SKIP LOCKED.
 */
export const trustEventOutbox = pgTable('trust_event_outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceNumber: bigserial('sequence_number', { mode: 'bigint' }).references(() => trustEvents.sequenceNumber, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  streamId: uuid('stream_id').notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(), // PENDING, PROCESSING, COMPLETE, FAILED, DEAD
  workerId: uuid('worker_id'),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  nextAttempt: timestamp('next_attempt', { withTimezone: true }).defaultNow().notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

/**
 * 3. Snapshots Table (Versioned & Hashed)
 *
 * Allows fast replay from a known good state instead of replaying the entire event log.
 */
export const trustSnapshots = pgTable('trust_snapshots', {
  tenantId: uuid('tenant_id').notNull(),
  streamId: uuid('stream_id').notNull(),
  streamVersion: integer('stream_version').notNull(),
  state: jsonb('state').notNull(),
  snapshotHash: varchar('snapshot_hash', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.tenantId, table.streamId] }),
]);

/**
 * 4. Governance Verification Evidence Table
 *
 * Stores signed attestations that the event store passed integrity checks at a given commit.
 */
export const trustVerificationRuns = pgTable('trust_verification_runs', {
  runId: uuid('run_id').defaultRandom().primaryKey(),
  commit: varchar('commit', { length: 40 }).notNull(),
  constitutionVersion: varchar('constitution_version', { length: 20 }).notNull(),
  passed: pgBoolean('passed').notNull(),
  evidence: jsonb('evidence').notNull(),
  signature: text('signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 5. Trust Contexts Table
 *
 * Stores the primary Trust Context primitives and their lifecycle state.
 */
export const trustContexts = pgTable('trust_contexts', {
  contextId: uuid('context_id').primaryKey(),
  trustAnchor: varchar('trust_anchor', { length: 255 }).notNull(),
  configurationReceipt: text('configuration_receipt').notNull(),
  verificationPolicy: jsonb('verification_policy').notNull(),
  receiptRoot: varchar('receipt_root', { length: 64 }).notNull(),
  status: varchar('status', { length: 50 }).default('initializing').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 6. Trust Receipts Table
 *
 * Cryptographic receipts for every enforcement decision.
 * Links to both the Context and the specific Event that triggered it.
 */
export const trustReceipts = pgTable('trust_receipts', {
  receiptId: varchar('receipt_id', { length: 255 }).primaryKey(),
  contextId: uuid('context_id').notNull().references(() => trustContexts.contextId),
  eventId: varchar('event_id', { length: 255 }).notNull().references(() => trustEvents.eventId),
  receiptType: varchar('receipt_type', { length: 50 }).notNull(), // configuration, event_journal, verification, attestation, kill_switch
  status: varchar('status', { length: 50 }).notNull(), // approved, rejected, halted
  reason: text('reason'),
  hashChainAnchor: varchar('hash_chain_anchor', { length: 64 }).notNull(),
  merkleProof: jsonb('merkle_proof').default([]).notNull(),
  safetyScore: integer('safety_score').notNull().default(1000), // x1000 for integer precision
  evidenceRef: text('evidence_ref'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  latencyMs: integer('latency_ms').default(0).notNull(),
}, (table) => [
  unique('uq_trust_receipt_event').on(table.contextId, table.eventId, table.receiptType),
]);

/**
 * 7. Trust Attestations Table
 *
 * TEE attestation records. Per-action, not per-deploy.
 * Stores report hashes (SHA-256) and verification status.
 */
export const trustAttestations = pgTable('trust_attestations', {
  attestationId: varchar('attestation_id', { length: 255 }).primaryKey(),
  contextId: uuid('context_id').notNull().references(() => trustContexts.contextId),
  eventId: varchar('event_id', { length: 255 }).notNull().references(() => trustEvents.eventId),
  attestor: varchar('attestor', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  reportHash: varchar('report_hash', { length: 64 }).notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('pending'), // pending, verified, failed
  signature: text('signature'),
  claim: jsonb('claim').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('uq_trust_attestation_event').on(table.contextId, table.eventId),
]);

/**
 * 8. Policy Bundles Table
 *
 * Signed policy history. Each governance change creates a new bundle,
 * chain-linked to the previous via previousBundleHash.
 */
export const policyBundles = pgTable('policy_bundles', {
  bundleId: varchar('bundle_id', { length: 255 }).primaryKey(),
  contextId: uuid('context_id').notNull().references(() => trustContexts.contextId),
  version: varchar('version', { length: 50 }).notNull(),
  policyHash: varchar('policy_hash', { length: 64 }).notNull(),
  content: jsonb('content').notNull(),
  signature: text('signature').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true }).defaultNow().notNull(),
  previousBundleHash: varchar('previous_bundle_hash', { length: 64 }),
}, (table) => [
  unique('uq_policy_bundle_version').on(table.contextId, table.version),
]);

/**
 * 9. Chronicle Entries Table
 *
 * Read-model projection for dashboards. Derived from trust_events.
 * If lost, can be rebuilt from the event journal.
 */
export const chronicleEntries = pgTable('chronicle_entries', {
  entryId: varchar('entry_id', { length: 255 }).primaryKey(),
  contextId: uuid('context_id').notNull().references(() => trustContexts.contextId),
  eventId: varchar('event_id', { length: 255 }).notNull().references(() => trustEvents.eventId),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  summary: jsonb('summary').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('uq_chronicle_event').on(table.contextId, table.eventId),
]);
