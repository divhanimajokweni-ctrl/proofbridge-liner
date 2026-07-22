// ============================================================================
// Epistemic Runtime — Trust Runtime Reducer / Projection
// ============================================================================
// Layer:        Reducer / Projection
// Responsibility: Pure function: (state, event) → nextState
//                 Side-effect free. No networking, logging, or persistence.
// Adapted from proofbridge-liner: createInitialState takes injected clock
// for startedAt/lastEventAt timestamps.
// ============================================================================

import {
  type RuntimeEvent,
  type RuntimeState,
  type KernelState,
  isValidTransition,
  type EvidenceLeaf,
  type ReceiptEntry,
} from './types';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

/**
 * Create the initial runtime state.
 * Uses injected clock for timestamps — no Date.now().
 */
export function createInitialState(clock: ClockProvider): RuntimeState {
  const now = clock.now();
  return {
    kernelState: 'IDLE',
    sequence: 0,
    trust: 0.5,
    sigma: 0.1,
    confidence: 50,
    epoch: 1,
    quorum: { pass: 0, total: 0 },
    evidenceLeaves: [],
    receipts: [],
    hashChainIntact: true,
    circuitBreakerOpen: false,
    hazardReason: null,
    lastError: null,
    startedAt: now,
    lastEventAt: now,
  };
}

// ---------------------------------------------------------------------------
// Reducer — Pure Function
// ---------------------------------------------------------------------------

/**
 * Apply a single RuntimeEvent to the current state, producing the next state.
 *
 * This is a **pure function**: given the same state and event, it always
 * produces the same next state. No side effects, no async, no I/O.
 */
export function reduce(state: RuntimeState, event: RuntimeEvent): RuntimeState {
  // Start from a clean copy
  const next: RuntimeState = {
    ...state,
    sequence: event.sequence,
    lastEventAt: event.timestamp,
    evidenceLeaves: [...state.evidenceLeaves],
    receipts: [...state.receipts],
  };

  switch (event.type) {
    case 'EvidenceReceived': {
      const payload = event.payload as { claim: string; source: string; confidence: string; tags?: string[] };
      const leaf: EvidenceLeaf = {
        id: `leaf-${event.eventId}`,
        claim: payload.claim,
        source: payload.source,
        confidence: payload.confidence as 'low' | 'medium' | 'high',
        tags: payload.tags ?? [],
        verified: false,
        addedAt: event.timestamp,
      };
      next.evidenceLeaves.push(leaf);
      next.kernelState = transitionTo(next.kernelState, 'INGESTING');
      break;
    }

    case 'EvidenceRejected': {
      next.kernelState = transitionTo(next.kernelState, 'IDLE');
      break;
    }

    case 'AttestationStarted': {
      next.kernelState = transitionTo(next.kernelState, 'ATTESTING');
      break;
    }

    case 'AttestationVerified': {
      next.kernelState = transitionTo(next.kernelState, 'VERIFYING');
      // Mark matching evidence as verified (by receiptId → leaf correlation)
      for (const leaf of next.evidenceLeaves) {
        if (!leaf.verified) {
          leaf.verified = true;
          break; // verify one leaf per attestation
        }
      }
      // Update quorum
      next.quorum = { pass: next.quorum.pass + 1, total: next.quorum.total + 1 };
      // Bayesian trust update (simplified beta-binomial)
      const alpha = next.quorum.pass + 1;
      const beta = next.quorum.total - next.quorum.pass + 1;
      next.trust = alpha / (alpha + beta);
      next.sigma = Math.sqrt((alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1)));
      next.confidence = Math.min(99.99, Math.max(0, (1 - next.sigma * 8) * 100));
      break;
    }

    case 'AttestationFailed': {
      next.quorum = { pass: next.quorum.pass, total: next.quorum.total + 1 };
      // Stay in verifying state to allow retry
      if (next.kernelState === 'VERIFYING') {
        // stay
      } else {
        next.kernelState = transitionTo(next.kernelState, 'VERIFYING');
      }
      break;
    }

    case 'AttestationRetrying': {
      // Stay in current state, retry is transparent to kernel
      break;
    }

    case 'BayesianUpdated': {
      const payload = event.payload as {
        trust: number;
        sigma: number;
        confidence: number;
        epoch: number;
        quorumPass: number;
        quorumTotal: number;
      };
      next.trust = payload.trust;
      next.sigma = payload.sigma;
      next.confidence = payload.confidence;
      next.epoch = payload.epoch;
      next.quorum = { pass: payload.quorumPass, total: payload.quorumTotal };
      break;
    }

    case 'ReceiptCommitted': {
      const payload = event.payload as {
        receiptId: string;
        receiptHash: string;
        envelopeHash: string;
        signature: string;
        chainHash: string;
      };
      const entry: ReceiptEntry = {
        receiptId: payload.receiptId,
        receiptHash: payload.receiptHash,
        envelopeHash: payload.envelopeHash,
        signature: payload.signature,
        chainHash: payload.chainHash,
        committedAt: event.timestamp,
      };
      next.receipts.push(entry);
      next.kernelState = transitionTo(next.kernelState, 'COMMITTING');
      break;
    }

    case 'ReceiptFailed': {
      next.kernelState = transitionTo(next.kernelState, 'COMMITTING');
      break;
    }

    case 'LedgerConfirmed': {
      next.kernelState = transitionTo(next.kernelState, 'SETTLED');
      next.hashChainIntact = true;
      next.epoch++;
      break;
    }

    case 'CircuitBreakerOpened': {
      const newState = transitionTo(next.kernelState, 'HAZARD');
      // Only set circuit breaker flag if the state machine allowed the transition
      if (newState === 'HAZARD') {
        next.circuitBreakerOpen = true;
        next.kernelState = newState;
        const payload = event.payload as { action: string; reason: string };
        next.hazardReason = payload.reason;
      }
      // If transition was illegal, silently ignore (reducer is pure)
      break;
    }

    case 'CircuitBreakerClosed': {
      next.circuitBreakerOpen = false;
      next.hazardReason = null;
      next.kernelState = 'IDLE';
      break;
    }

    case 'QueueDrained': {
      // No state change, but pulse remains
      break;
    }

    case 'RuntimeIdle': {
      next.kernelState = 'IDLE';
      next.hazardReason = null;
      break;
    }

    case 'SystemError': {
      const payload = event.payload as {
        code: string;
        message: string;
        subsystem: string;
        recoverable: boolean;
      };
      next.lastError = {
        code: payload.code,
        message: payload.message,
        recoverable: payload.recoverable,
      };
      if (!payload.recoverable) {
        const newState = transitionTo(next.kernelState, 'HAZARD');
        if (newState === 'HAZARD') {
          next.kernelState = newState;
          next.hazardReason = payload.message;
        }
      }
      break;
    }

    default:
      // Unknown event types are silently ignored (forward compatibility)
      break;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Batch Reduce — Apply Multiple Events
// ---------------------------------------------------------------------------

/**
 * Apply a sequence of events to a state, returning the final state.
 * Useful for replay and snapshot loading.
 */
export function reduceBatch(
  state: RuntimeState,
  events: RuntimeEvent[],
): RuntimeState {
  let current = state;
  for (const event of events) {
    current = reduce(current, event);
  }
  return current;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Transition to a new kernel state if legal. If illegal, stays in current
 * state. The reducer is pure — no side effects.
 */
function transitionTo(from: KernelState, to: KernelState): KernelState {
  if (isValidTransition(from, to)) {
    return to;
  }
  // Illegal transitions are caught upstream in the command handler.
  // Here we just stay put.
  return from;
}
