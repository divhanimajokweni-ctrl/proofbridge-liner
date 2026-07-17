// ============================================================================
// VVU Trust Runtime — Command Handler
// ============================================================================
// Layer:        Command Handler
// Responsibility: Validate commands, authorize, check idempotency, produce events.
//                 Commands express intent. Events record facts.
//                 This layer is the only place that produces RuntimeEvents.
// ============================================================================

import {
  Command,
  RuntimeEvent,
  RuntimeEventType,
  KernelState,
  isValidTransition,
} from "./types";
import { EventStore } from "./event-store";
import { EventStoreRepository, OccConflictError, DomainEvent } from '../../../lib/db/src/repositories/event-store.repository';

export interface CommandResult {
  events: RuntimeEvent[];
}

export interface CommandHandler {
  /** Process a command, returning zero or more RuntimeEvents.
   *  Returns empty array if the command is a duplicate (idempotent). */
  handle(command: Command, currentState: { kernelState: KernelState; sequence: number }): Promise<CommandResult>;
}

// ---------------------------------------------------------------------------
// Default Command Handler Implementation
// ---------------------------------------------------------------------------

type EventFactory = {
  eventId: string;
  type: RuntimeEventType;
  source: string;
  causationId: string | null;
  correlationId: string;
  payload: Record<string, unknown>;
};

let globalSequenceCounter = 0;

/** Generate a deterministic-looking eventId from an idempotency key. */
function eventIdFromKey(key: string): string {
  // In production, use a proper UUID v7 or hash-based ID.
  // For now, prefix the key to make it unique and deterministic.
  return `evt-${key}-${++globalSequenceCounter}`;
}

/** Generate a unique eventId. */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a RuntimeEvent from a factory partial. */
function buildEvent(
  factory: EventFactory,
  sequence: number,
  causationId: string | null,
): RuntimeEvent {
  return {
    eventId: factory.eventId,
    type: factory.type,
    version: 1,
    timestamp: Date.now(),
    sequence,
    correlationId: factory.correlationId,
    causationId: factory.causationId ?? causationId,
    source: factory.source,
    payload: factory.payload as RuntimeEvent["payload"],
    tenantId: "",
    streamId: "",
    streamVersion: sequence,
    schemaVersion: 1,
    payloadHash: "",
    eventHash: "",
    previousHash: null,
  };
}

export class DefaultCommandHandler implements CommandHandler {
  private store: EventStore;
  private source: string;

  constructor(store: EventStore, source = "command-handler") {
    this.store = store;
    this.source = source;
  }

  async handle(
    command: Command,
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    switch (command.type) {
      case "SubmitEvidence":
        return this.handleSubmitEvidence(command, currentState);
      case "VerifyAttestation":
        return this.handleVerifyAttestation(command, currentState);
      case "CommitReceipt":
        return this.handleCommitReceipt(command, currentState);
      case "ConfirmLedger":
        return this.handleConfirmLedger(command, currentState);
      case "TriggerCircuitBreaker":
        return this.handleTriggerCircuitBreaker(command, currentState);
      case "ResetRuntime":
        return this.handleResetRuntime(command, currentState);
      default:
        throw new Error(`Unknown command type: ${(command as Command).type}`);
    }
  }

  // -----------------------------------------------------------------------
  // Command Handlers
  // -----------------------------------------------------------------------

  private async handleSubmitEvidence(
    command: Command & { type: "SubmitEvidence" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    // Idempotency check
    if (await this.store.exists(command.idempotencyKey)) {
      return { events: [] };
    }

    const correlationId = `corr-${command.idempotencyKey}`;
    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const event: RuntimeEvent = {
      eventId: command.idempotencyKey,
      type: "EvidenceReceived",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId,
      causationId: null,
      source: this.source,
      payload: {
        claim: command.evidence.claim,
        source: command.evidence.source,
        confidence: command.evidence.confidence,
        tags: command.evidence.tags ?? [],
      },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [event] };
  }

  private async handleVerifyAttestation(
    command: Command & { type: "VerifyAttestation" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    // Validate state machine — can only verify if ATTESTING is reachable
    const canAttest =
      isValidTransition(currentState.kernelState, "ATTESTING") ||
      currentState.kernelState === "ATTESTING" ||
      currentState.kernelState === "VERIFYING";
    if (!canAttest) {
      return {
        events: [
          this.errorEvent(
            "ILLEGAL_TRANSITION",
            `Cannot verify attestation in state ${currentState.kernelState}`,
            currentState,
            command.tenantId ?? "default",
            command.streamId ?? `tenant:${command.tenantId ?? "default"}`,
          ),
        ],
      };
    }

    const correlationId = `attest-${command.receiptId}`;
    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const startEvent: RuntimeEvent = {
      eventId: generateEventId(),
      type: "AttestationStarted",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId,
      causationId: null,
      source: this.source,
      payload: { receiptId: command.receiptId, platform: command.platform },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    // In production, the actual verification happens here asynchronously.
    // For now, produce the verified event inline.
    const verifiedEvent: RuntimeEvent = {
      eventId: generateEventId(),
      type: "AttestationVerified",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 2,
      correlationId,
      causationId: startEvent.eventId,
      source: this.source,
      payload: {
        receiptId: command.receiptId,
        platform: command.platform as "AMD SEV-SNP" | "Intel SGX" | "AWS Nitro" | "software",
        measurement: "a3f19c0b7e24d817",
      },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 2,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [startEvent, verifiedEvent] };
  }

  private async handleCommitReceipt(
    command: Command & { type: "CommitReceipt" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    if (
      !isValidTransition(currentState.kernelState, "COMMITTING") &&
      currentState.kernelState !== "COMMITTING"
    ) {
      return {
        events: [
          this.errorEvent(
            "ILLEGAL_TRANSITION",
            `Cannot commit receipt in state ${currentState.kernelState}`,
            currentState,
            command.tenantId ?? "default",
            command.streamId ?? `tenant:${command.tenantId ?? "default"}`,
          ),
        ],
      };
    }

    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const event: RuntimeEvent = {
      eventId: generateEventId(),
      type: "ReceiptCommitted",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId: `receipt-${command.receipt.receiptId}`,
      causationId: null,
      source: this.source,
      payload: {
        receiptId: command.receipt.receiptId,
        receiptHash: command.receipt.receiptHash,
        envelopeHash: command.receipt.envelopeHash,
        signature: command.receipt.signature,
        chainHash: command.receipt.chainHash,
      },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [event] };
  }

  private async handleConfirmLedger(
    command: Command & { type: "ConfirmLedger" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const event: RuntimeEvent = {
      eventId: generateEventId(),
      type: "LedgerConfirmed",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId: `ledger-${command.blockHeight}`,
      causationId: null,
      source: this.source,
      payload: {
        seq: command.seq,
        blockHeight: command.blockHeight,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [event] };
  }

  private async handleTriggerCircuitBreaker(
    command: Command & { type: "TriggerCircuitBreaker" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const eventType: RuntimeEventType =
      command.action === "open"
        ? "CircuitBreakerOpened"
        : "CircuitBreakerClosed";

    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const event: RuntimeEvent = {
      eventId: generateEventId(),
      type: eventType,
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId: `cb-${Date.now()}`,
      causationId: null,
      source: this.source,
      payload: {
        action: command.action,
        reason: command.reason,
      },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [event] };
  }

  private async handleResetRuntime(
    command: Command & { type: "ResetRuntime" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const tenantId = command.tenantId ?? "default";
    const streamId = command.streamId ?? `tenant:${tenantId}`;

    const event: RuntimeEvent = {
      eventId: generateEventId(),
      type: "RuntimeIdle",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId: `reset-${Date.now()}`,
      causationId: null,
      source: this.source,
      payload: { idleDuration: 0 },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };

    return { events: [event] };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private errorEvent(
    code: string,
    message: string,
    currentState: { sequence: number },
    tenantId = "default",
    streamId = "default",
  ): RuntimeEvent {
    return {
      eventId: generateEventId(),
      type: "SystemError",
      version: 1,
      timestamp: Date.now(),
      sequence: currentState.sequence + 1,
      correlationId: `error-${Date.now()}`,
      causationId: null,
      source: this.source,
      payload: { code, message, subsystem: this.source, recoverable: true },
      tenantId,
      streamId,
      streamVersion: currentState.sequence + 1,
      schemaVersion: 1,
      payloadHash: "",
      eventHash: "",
      previousHash: null,
    };
  }
}

/**
 * OCC Retry Wrapper for CommandHandler
 *
 * Wraps the command handler with optimistic concurrency control retry logic.
 * On OCC conflict, reloads expected version, recomputes events, and retries.
 */
export class RetryingCommandHandler implements CommandHandler {
  private maxRetries = 5;

  constructor(
    private readonly delegate: CommandHandler,
    private readonly repo: EventStoreRepository,
  ) {}

  async handle(
    command: Command,
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      // Reload current version from repository
      const tenantId = (command as any).tenantId ?? "default";
      const streamId = (command as any).streamId ?? "default";
      const expectedVersion = await this.repo.getCurrentVersion(tenantId, streamId);

      // Produce events from current state
      const result = await this.delegate.handle(command, {
        ...currentState,
        sequence: expectedVersion,
      });

      if (result.events.length === 0) {
        return result;
      }

      try {
        // Attempt atomic batch append
        await this.repo.append(tenantId, streamId, expectedVersion, result.events as unknown as DomainEvent[]);
        return result;
      } catch (error) {
        if (error instanceof OccConflictError) {
          attempt++;
          if (attempt > this.maxRetries) {
            throw error;
          }

          // Jittered exponential backoff
          const delay = Math.random() * (50 * Math.pow(2, attempt));
          await new Promise(resolve => setTimeout(resolve, delay));

          // Loop continues -> reloads expectedVersion -> re-evaluates command
          continue;
        }
        throw error; // Propagate non-OCC errors
      }
    }

    throw new Error(`OCC retry exhausted after ${this.maxRetries} attempts`);
  }
}
