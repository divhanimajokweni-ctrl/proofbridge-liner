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

// ============================================================================
// VVU EARTH TECH — NATS Durable Queue
// ============================================================================
//
// NATS durable queue for network partition survival.
// Enables message persistence during 72-hour blackouts.
//
// Circuit Breaker integration:
// - DEGRADED state → enqueue writes (queue absorbs load)
// - NORMAL resume → drain queue (process queued messages)
//
// Queue state persisted for crash recovery.
// Every message has SHA-256 hash for integrity verification.
// All timestamps from injected Clock provider (NOT Date.now()).
// ============================================================================

import { computeSHA256 } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// §1 — Queue Message Interface
// ---------------------------------------------------------------------------

/**
 * A message in the NATS durable queue.
 * SHA-256 hash ensures message integrity across network partitions.
 */
export interface QueueMessage {
  /** Unique message identifier */
  id: string;
  /** NATS subject for routing */
  subject: string;
  /** Message payload (serialized) */
  payload: string;
  /** SHA-256 hash of (id + subject + payload) for integrity */
  hash: string;
  /** Timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** Number of times this message has been retried */
  retryCount: number;
  /** Maximum retry attempts before permanent failure */
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// §2 — Queue Drain Result
// ---------------------------------------------------------------------------

/**
 * Result of draining the queue (processing all queued messages).
 */
export interface QueueDrainResult {
  /** Whether the drain completed successfully */
  success: boolean;
  /** Number of messages successfully processed */
  messagesProcessed: number;
  /** Number of messages that failed processing */
  messagesFailed: number;
  /** Number of messages remaining in queue after drain */
  messagesRemaining: number;
  /** SHA-256 hash of the drain report for evidence store */
  hash: string;
  /** Timestamp from injected clock */
  timestamp: number;
  /** Errors encountered during processing */
  errors: string[];
}

// ---------------------------------------------------------------------------
// §3 — Queue Event (for evidence store)
// ---------------------------------------------------------------------------

/**
 * Event emitted on queue operations for audit trail.
 */
export interface QueueEvent {
  /** Unique event identifier (SHA-256) */
  id: string;
  /** Operation type */
  operation: 'enqueue' | 'dequeue' | 'drain' | 'retry';
  /** Message subject */
  subject: string;
  /** Message ID */
  messageId: string;
  /** SHA-256 hash of the message */
  messageHash: string;
  /** Result of the operation */
  result: 'success' | 'failure';
  /** Timestamp from injected clock */
  timestamp: number;
  /** SHA-256 hash of the event for evidence store */
  hash: string;
}

// ---------------------------------------------------------------------------
// §4 — Queue State (for crash recovery)
// ---------------------------------------------------------------------------

/**
 * Persistent queue state for crash recovery.
 * When the system restarts after a crash (e.g., during a 72-hour blackout),
 * this state allows the queue to resume from where it left off.
 */
export interface QueuePersistentState {
  /** Queue name */
  queueName: string;
  /** NATS subject */
  subject: string;
  /** Durable name (NATS consumer durable name) */
  durableName: string;
  /** Number of messages currently in the queue */
  depth: number;
  /** Total messages enqueued since creation */
  totalEnqueued: number;
  /** Total messages dequeued/processed since creation */
  totalProcessed: number;
  /** SHA-256 hash of the persistent state for integrity */
  stateHash: string;
  /** Timestamp of last state update (injected clock) */
  lastUpdated: number;
}

// ---------------------------------------------------------------------------
// §5 — Message Processor Interface
// ---------------------------------------------------------------------------

/**
 * Interface for processing dequeued messages.
 * Called during drain operations to process each message.
 */
export interface MessageProcessor {
  /**
   * Process a message from the queue.
   * Returns true if processing succeeded, false if it failed
   * (message will be retried).
   */
  process(message: QueueMessage): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// §6 — Constants
// ---------------------------------------------------------------------------

/** Default maximum retry attempts */
export const DEFAULT_MAX_RETRIES = 3;

/** Default durable name prefix */
export const DEFAULT_DURABLE_PREFIX = 'vvu-et-durable';

// ---------------------------------------------------------------------------
// §7 — DurableQueue Class
// ---------------------------------------------------------------------------

/**
 * NATS Durable Queue — survives network partitions and crashes.
 *
 * Circuit Breaker integration:
 * - DEGRADED state → enqueue writes (queue absorbs load)
 * - NORMAL resume → drain queue (process queued messages)
 *
 * Design principles:
 * - Queue state persisted for crash recovery
 * - Every message has SHA-256 hash for integrity
 * - All timestamps from injected Clock provider (NOT Date.now())
 * - Deterministic and replay-safe
 */
export class DurableQueue {
  private messages: QueueMessage[] = [];
  private totalEnqueued: number = 0;
  private totalProcessed: number = 0;
  private eventLog: QueueEvent[] = [];
  private readonly maxRetries: number;

  /**
   * Create a new NATS Durable Queue.
   *
   * @param clock Injected Clock provider (NOT Date.now())
   * @param queueName Queue name for identification
   * @param subject NATS subject for routing
   * @param durableName NATS consumer durable name
   * @param maxRetries Maximum retry attempts per message
   */
  constructor(
    private readonly clock: ClockProvider,
    private readonly queueName: string = 'default-queue',
    private readonly subject: string = 'vvu.et.resilience',
    private readonly durableName: string = `${DEFAULT_DURABLE_PREFIX}-default`,
    maxRetries: number = DEFAULT_MAX_RETRIES,
  ) {
    this.maxRetries = maxRetries;
  }

  // ---------------------------------------------------------------------------
  // Core operations
  // ---------------------------------------------------------------------------

  /**
   * enqueue(subject, message) — add message to queue with SHA-256 hash.
   *
   * Called during DEGRADED state to queue writes that cannot be
   * immediately processed.
   *
   * @param subject NATS subject for the message
   * @param payload Message payload (serialized)
   * @returns The queued message with computed integrity hash
   */
  enqueue(subject: string, payload: string): QueueMessage {
    const timestamp = this.clock.now();

    // Generate deterministic message ID
    const idObj = {
      subject,
      payload,
      timestamp,
      queueName: this.queueName,
      sequence: this.totalEnqueued,
    };
    const id = computeSHA256(canonicalize(idObj));

    // Compute SHA-256 integrity hash of (id + subject + payload)
    const hashObj = {
      id,
      subject,
      payload,
      timestamp,
    };
    const hash = computeSHA256(canonicalize(hashObj));

    const message: QueueMessage = {
      id,
      subject,
      payload,
      hash,
      timestamp,
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    this.messages.push(message);
    this.totalEnqueued++;

    // Emit enqueue event
    this.emitEvent('enqueue', subject, id, hash, 'success');

    return message;
  }

  /**
   * drain() — process all queued messages.
   *
   * Called when the Circuit Breaker transitions from DEGRADED to NORMAL
   * (or from FAIL-CLOSED to DEGRADED). All queued messages are processed
   * in order.
   *
   * @param processor Message processor callback
   * @returns QueueDrainResult with processing statistics
   */
  async drain(processor: MessageProcessor): Promise<QueueDrainResult> {
    const errors: string[] = [];
    let messagesProcessed = 0;
    let messagesFailed = 0;

    // Process messages in FIFO order
    const messagesToProcess = [...this.messages];

    for (const message of messagesToProcess) {
      try {
        const success = await processor.process(message);

        if (success) {
          // Remove from queue
          this.messages = this.messages.filter(m => m.id !== message.id);
          this.totalProcessed++;
          messagesProcessed++;

          this.emitEvent('dequeue', message.subject, message.id, message.hash, 'success');
        } else {
          // Processing failed — retry if possible
          if (message.retryCount < message.maxRetries) {
            // Increment retry count and keep in queue
            const retryMessage: QueueMessage = {
              ...message,
              retryCount: message.retryCount + 1,
            };
            this.messages = this.messages.map(m =>
              m.id === message.id ? retryMessage : m,
            );
            messagesFailed++;

            this.emitEvent('retry', message.subject, message.id, message.hash, 'success');
          } else {
            // Max retries exceeded — remove from queue and log error
            this.messages = this.messages.filter(m => m.id !== message.id);
            messagesFailed++;
            errors.push(
              `Message ${message.id} on subject "${message.subject}" exceeded max retries (${message.maxRetries})`,
            );

            this.emitEvent('dequeue', message.subject, message.id, message.hash, 'failure');
          }
        }
      } catch (err) {
        // Exception during processing — treat as failure
        messagesFailed++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(
          `Message ${message.id} processing exception: ${errorMsg}`,
        );

        if (message.retryCount < message.maxRetries) {
          // Increment retry count
          const retryMessage: QueueMessage = {
            ...message,
            retryCount: message.retryCount + 1,
          };
          this.messages = this.messages.map(m =>
            m.id === message.id ? retryMessage : m,
          );
          this.emitEvent('retry', message.subject, message.id, message.hash, 'success');
        } else {
          this.messages = this.messages.filter(m => m.id !== message.id);
          this.emitEvent('dequeue', message.subject, message.id, message.hash, 'failure');
        }
      }
    }

    // Compute drain report hash
    const reportObj = {
      messagesProcessed,
      messagesFailed,
      messagesRemaining: this.messages.length,
      timestamp: this.clock.now(),
      queueName: this.queueName,
      errors: errors.length > 0 ? errors : null,
    };
    const hash = computeSHA256(canonicalize(reportObj));

    return {
      success: errors.length === 0,
      messagesProcessed,
      messagesFailed,
      messagesRemaining: this.messages.length,
      hash,
      timestamp: this.clock.now(),
      errors,
    };
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /**
   * getQueueDepth() — number of messages in queue.
   */
  getQueueDepth(): number {
    return this.messages.length;
  }

  /** Get queue name */
  getQueueName(): string {
    return this.queueName;
  }

  /** Get NATS subject */
  getSubject(): string {
    return this.subject;
  }

  /** Get durable name */
  getDurableName(): string {
    return this.durableName;
  }

  /** Get total messages enqueued since creation */
  getTotalEnqueued(): number {
    return this.totalEnqueued;
  }

  /** Get total messages processed since creation */
  getTotalProcessed(): number {
    return this.totalProcessed;
  }

  /** Get event log for audit trail */
  getEventLog(): QueueEvent[] {
    return [...this.eventLog];
  }

  /** Get all messages currently in the queue */
  getMessages(): QueueMessage[] {
    return [...this.messages];
  }

  // ---------------------------------------------------------------------------
  // Persistent state (crash recovery)
  // ---------------------------------------------------------------------------

  /**
   * Get persistent state for crash recovery.
   * Queue state can be saved to durable storage and restored on restart.
   */
  getPersistentState(): QueuePersistentState {
    const stateObj = {
      queueName: this.queueName,
      subject: this.subject,
      durableName: this.durableName,
      depth: this.messages.length,
      totalEnqueued: this.totalEnqueued,
      totalProcessed: this.totalProcessed,
      lastUpdated: this.clock.now(),
    };

    return {
      ...stateObj,
      stateHash: computeSHA256(canonicalize(stateObj)),
    };
  }

  /**
   * Restore queue state from persistent storage (crash recovery).
   * Verifies state hash before restoring.
   *
   * @param persisted Persistent state to restore
   * @param messages Messages that were in the queue at crash time
   * @returns Whether restoration succeeded
   */
  restoreFromPersistentState(
    persisted: QueuePersistentState,
    messages: QueueMessage[],
  ): boolean {
    // Verify state hash integrity
    const stateObj = {
      queueName: persisted.queueName,
      subject: persisted.subject,
      durableName: persisted.durableName,
      depth: persisted.depth,
      totalEnqueued: persisted.totalEnqueued,
      totalProcessed: persisted.totalProcessed,
      lastUpdated: persisted.lastUpdated,
    };

    const expectedHash = computeSHA256(canonicalize(stateObj));
    if (persisted.stateHash !== expectedHash) {
      // Integrity check failed — state was tampered or corrupted
      return false;
    }

    // Restore verified state
    this.queueName = persisted.queueName;
    this.subject = persisted.subject;
    this.durableName = persisted.durableName;
    this.totalEnqueued = persisted.totalEnqueued;
    this.totalProcessed = persisted.totalProcessed;
    this.messages = messages;

    // Verify message hashes
    for (const message of this.messages) {
      const expectedMessageHash = computeSHA256(canonicalize({
        id: message.id,
        subject: message.subject,
        payload: message.payload,
        timestamp: message.timestamp,
      }));
      if (message.hash !== expectedMessageHash) {
        // Message integrity failed — remove corrupted message
        this.messages = this.messages.filter(m => m.id !== message.id);
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Private: event emission
  // ---------------------------------------------------------------------------

  private emitEvent(
    operation: 'enqueue' | 'dequeue' | 'drain' | 'retry',
    subject: string,
    messageId: string,
    messageHash: string,
    result: 'success' | 'failure',
  ): void {
    const eventObj = {
      operation,
      subject,
      messageId,
      messageHash,
      result,
      timestamp: this.clock.now(),
      queueName: this.queueName,
    };

    const id = computeSHA256(canonicalize(eventObj));
    const hash = computeSHA256(canonicalize(eventObj) + id);

    this.eventLog.push({
      id,
      operation,
      subject,
      messageId,
      messageHash,
      result,
      timestamp: this.clock.now(),
      hash,
    });
  }
}
