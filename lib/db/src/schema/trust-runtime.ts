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
