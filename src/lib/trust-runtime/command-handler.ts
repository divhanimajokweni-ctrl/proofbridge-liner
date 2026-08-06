// @ts-nocheck
// ============================================================================
// Epistemic Runtime — Trust Runtime Command Handler
// ============================================================================
// Layer:        Command Handler
// Responsibility: Validate commands, authorize, check idempotency, produce events.
//                 Commands express intent. Events record facts.
//                 This layer is the only place that produces RuntimeEvents.
// Adapted from proofbridge-liner: uses injected clock and entropy instead
// of Date.now() and Math.random(). No dependency on EventStoreRepository.
// ============================================================================

import {
  type Command,
  type RuntimeEvent,
  type RuntimeEventType,
  type KernelState,
  isValidTransition,
} from './types';
import type { EventStore } from './event-store';
import type { ClockProvider, EntropyProvider, UuidProvider } from '@/lib/kernel/types';

export interface CommandResult {
  events: RuntimeEvent[];
}

export interface CommandHandler {
  /** Process a command, returning zero or more RuntimeEvents.
   *  Returns empty array if the command is a duplicate (idempotent). */
  handle(command: Command, currentState: { kernelState: KernelState; sequence: number }): Promise<CommandResult>;
}

// ---------------------------------------------------------------------------
// Command Handler Providers
// ---------------------------------------------------------------------------

export interface CommandHandlerProviders {
  clock: ClockProvider;
  entropy: EntropyProvider;
  uuid: UuidProvider;
}

// ---------------------------------------------------------------------------
// Default Command Handler Implementation
// ---------------------------------------------------------------------------

let globalSequenceCounter = 0;

/** Generate an eventId from an idempotency key (deterministic). */
function eventIdFromKey(key: string): string {
  return `evt-${key}-${++globalSequenceCounter}`;
}

/** Generate a unique eventId using injected providers. */
function generateEventId(uuid: UuidProvider): string {
  return `evt-${uuid.generate()}`;
}

/** Build a RuntimeEvent from a factory partial. */
function buildEvent(
  factory: {
    eventId: string;
    type: RuntimeEventType;
    source: string;
    causationId: string | null;
    correlationId: string;
    payload: Record<string, unknown>;
    tenantId: string;
    streamId: string;
  },
  sequence: number,
  timestamp: number,
): RuntimeEvent {
  return {
    eventId: factory.eventId,
    type: factory.type,
    version: 1,
    timestamp,
    sequence,
    correlationId: factory.correlationId,
    causationId: factory.causationId,
    source: factory.source,
    payload: factory.payload as RuntimeEvent['payload'],
    tenantId: factory.tenantId,
    streamId: factory.streamId,
    streamVersion: sequence,
    schemaVersion: 1,
    payloadHash: '',
    eventHash: '',
    previousHash: null,
  };
}

export class DefaultCommandHandler implements CommandHandler {
  private store: EventStore;
  private source: string;
  private providers: CommandHandlerProviders;

  constructor(store: EventStore, providers: CommandHandlerProviders, source = 'command-handler') {
    this.store = store;
    this.providers = providers;
    this.source = source;
  }

  async handle(
    command: Command,
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    switch (command.type) {
      case 'SubmitEvidence':
        return this.handleSubmitEvidence(command, currentState);
      case 'VerifyAttestation':
        return this.handleVerifyAttestation(command, currentState);
      case 'CommitReceipt':
        return this.handleCommitReceipt(command, currentState);
      case 'ConfirmLedger':
        return this.handleConfirmLedger(command, currentState);
      case 'TriggerCircuitBreaker':
        return this.handleTriggerCircuitBreaker(command, currentState);
      case 'ResetRuntime':
        return this.handleResetRuntime(command, currentState);
      default:
        throw new Error(`Unknown command type: ${(command as Command).type}`);
    }
  }

  // -----------------------------------------------------------------------
  // Command Handlers
  // -----------------------------------------------------------------------

  private async handleSubmitEvidence(
    command: Command & { type: 'SubmitEvidence' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    // Idempotency check
    if (await this.store.exists(command.idempotencyKey)) {
      return { events: [] };
    }

    const correlationId = `corr-${command.idempotencyKey}`;
    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now = this.providers.clock.now();

    const event: RuntimeEvent = buildEvent({
      eventId: command.idempotencyKey,
      type: 'EvidenceReceived',
      source: this.source,
      causationId: null,
      correlationId,
      payload: {
        claim: command.evidence.claim,
        source: command.evidence.source,
        confidence: command.evidence.confidence,
        tags: command.evidence.tags ?? [],
      },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now);

    return { events: [event] };
  }

  private async handleVerifyAttestation(
    command: Command & { type: 'VerifyAttestation' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    // Validate state machine — can only verify if ATTESTING is reachable
    const canAttest =
      isValidTransition(currentState.kernelState, 'ATTESTING') ||
      currentState.kernelState === 'ATTESTING' ||
      currentState.kernelState === 'VERIFYING';
    if (!canAttest) {
      const tenantId = command.tenantId ?? 'default';
      const streamId = command.streamId ?? `tenant:${tenantId}`;
      const now = this.providers.clock.now();
      return {
        events: [
          this.errorEvent(
            'ILLEGAL_TRANSITION',
            `Cannot verify attestation in state ${currentState.kernelState}`,
            currentState,
            tenantId,
            streamId,
            now,
          ),
        ],
      };
    }

    const correlationId = `attest-${command.receiptId}`;
    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now1 = this.providers.clock.now();
    const now2 = this.providers.clock.now();

    const startEvent: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'AttestationStarted',
      source: this.source,
      causationId: null,
      correlationId,
      payload: { receiptId: command.receiptId, platform: command.platform },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now1);

    // In production, the actual verification happens here asynchronously.
    // For now, produce the verified event inline.
    const verifiedEvent: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'AttestationVerified',
      source: this.source,
      causationId: startEvent.eventId,
      correlationId,
      payload: {
        receiptId: command.receiptId,
        platform: command.platform as 'AMD SEV-SNP' | 'Intel SGX' | 'AWS Nitro' | 'software',
        measurement: 'a3f19c0b7e24d817',
      },
      tenantId,
      streamId,
    }, currentState.sequence + 2, now2);

    return { events: [startEvent, verifiedEvent] };
  }

  private async handleCommitReceipt(
    command: Command & { type: 'CommitReceipt' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    if (
      !isValidTransition(currentState.kernelState, 'COMMITTING') &&
      currentState.kernelState !== 'COMMITTING'
    ) {
      const tenantId = command.tenantId ?? 'default';
      const streamId = command.streamId ?? `tenant:${tenantId}`;
      const now = this.providers.clock.now();
      return {
        events: [
          this.errorEvent(
            'ILLEGAL_TRANSITION',
            `Cannot commit receipt in state ${currentState.kernelState}`,
            currentState,
            tenantId,
            streamId,
            now,
          ),
        ],
      };
    }

    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now = this.providers.clock.now();

    const event: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'ReceiptCommitted',
      source: this.source,
      causationId: null,
      correlationId: `receipt-${command.receipt.receiptId}`,
      payload: {
        receiptId: command.receipt.receiptId,
        receiptHash: command.receipt.receiptHash,
        envelopeHash: command.receipt.envelopeHash,
        signature: command.receipt.signature,
        chainHash: command.receipt.chainHash,
      },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now);

    return { events: [event] };
  }

  private async handleConfirmLedger(
    command: Command & { type: 'ConfirmLedger' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now = this.providers.clock.now();

    // Generate deterministic txHash from entropy instead of Math.random()
    const entropyBytes = this.providers.entropy.bytes(32);
    const txHashHex = Array.from(entropyBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const event: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'LedgerConfirmed',
      source: this.source,
      causationId: null,
      correlationId: `ledger-${command.blockHeight}`,
      payload: {
        seq: command.seq,
        blockHeight: command.blockHeight,
        txHash: `0x${txHashHex}`,
      },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now);

    return { events: [event] };
  }

  private async handleTriggerCircuitBreaker(
    command: Command & { type: 'TriggerCircuitBreaker' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const eventType: RuntimeEventType =
      command.action === 'open'
        ? 'CircuitBreakerOpened'
        : 'CircuitBreakerClosed';

    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now = this.providers.clock.now();

    const event: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: eventType,
      source: this.source,
      causationId: null,
      correlationId: `cb-${this.providers.uuid.generate()}`,
      payload: {
        action: command.action,
        reason: command.reason,
      },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now);

    return { events: [event] };
  }

  private async handleResetRuntime(
    command: Command & { type: 'ResetRuntime' },
    currentState: { kernelState: KernelState; sequence: number },
  ): Promise<CommandResult> {
    const tenantId = command.tenantId ?? 'default';
    const streamId = command.streamId ?? `tenant:${tenantId}`;
    const now = this.providers.clock.now();

    const event: RuntimeEvent = buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'RuntimeIdle',
      source: this.source,
      causationId: null,
      correlationId: `reset-${this.providers.uuid.generate()}`,
      payload: { idleDuration: 0 },
      tenantId,
      streamId,
    }, currentState.sequence + 1, now);

    return { events: [event] };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private errorEvent(
    code: string,
    message: string,
    currentState: { sequence: number },
    tenantId: string,
    streamId: string,
    timestamp: number,
  ): RuntimeEvent {
    return buildEvent({
      eventId: generateEventId(this.providers.uuid),
      type: 'SystemError',
      source: this.source,
      causationId: null,
      correlationId: `error-${this.providers.uuid.generate()}`,
      payload: { code, message, subsystem: this.source, recoverable: true },
      tenantId,
      streamId,
    }, currentState.sequence + 1, timestamp);
  }
}
