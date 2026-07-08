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

// ---------------------------------------------------------------------------
// Command Handler Interface
// ---------------------------------------------------------------------------

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
        return this.handleResetRuntime(currentState);
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
          ),
        ],
      };
    }

    const correlationId = `attest-${command.receiptId}`;

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
          ),
        ],
      };
    }

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
    };

    return { events: [event] };
  }

  private async handleConfirmLedger(
    command: Command & { type: "ConfirmLedger" },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
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
    };

    return { events: [event] };
  }

  private async handleResetRuntime(
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
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
    };
  }
}
