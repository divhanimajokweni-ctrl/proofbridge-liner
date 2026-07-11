// packages/trust-runtime/src/receipt-engine.ts
// ───────────────────────────────────────────────────────────────
// Receipt Engine
// Generates and manages cryptographic receipts for Trust Context events
// ───────────────────────────────────────────────────────────────

import type {
  TrustContextReceipt,
  ReceiptType,
  TrustEvent,
} from '@proofbridge/trust-types';
import {
  createReceiptGenerator,
  verifyReceipt,
  type TrustReceipt,
  type ReceiptVerificationResult,
} from '@proofbridge/trust-crypto';
import { v4 as uuidv4 } from 'uuid';
import { sha256Hex, hashObject } from '@proofbridge/trust-crypto';

// ───────────────────────────────────────────────────────────────
// Receipt Engine Types
// ───────────────────────────────────────────────────────────────

export interface ReceiptEngineConfig {
  signingKey: string;
  issuer: string;
  version: string;
}

export interface ReceiptGenerationParams {
  contextId: string;
  eventId: string;
  receiptType: ReceiptType;
  status: 'approved' | 'rejected' | 'halted';
  reason?: string;
  hashChainAnchor: string;
  merkleProof: string[];
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

// ───────────────────────────────────────────────────────────────
// Receipt Engine Class
// ───────────────────────────────────────────────────────────────

export class ReceiptEngine {
  private receiptGenerator: ReturnType<typeof createReceiptGenerator>;
  private receipts: Map<string, TrustReceipt>; // receiptId -> receipt

  constructor(config: ReceiptEngineConfig) {
    this.receiptGenerator = createReceiptGenerator(config);
    this.receipts = new Map();
  }

  /**
   * Generate a receipt for an event
   */
  generateReceipt(params: ReceiptGenerationParams): TrustReceipt {
    const receipt = this.receiptGenerator.generate(params);
    this.receipts.set(receipt.header.receiptId, receipt);
    return receipt;
  }

  /**
   * Generate a configuration receipt
   */
  generateConfigurationReceipt(
    contextId: string,
    configurationHash: string,
    trustAnchor: string
  ): TrustReceipt {
    return this.generateReceipt({
      contextId,
      eventId: `config_${contextId}`,
      receiptType: 'configuration',
      status: 'approved',
      hashChainAnchor: trustAnchor,
      merkleProof: [configurationHash],
      latencyMs: 0,
      metadata: {
        purpose: 'configuration',
        configurationHash,
      },
    });
  }

  /**
   * Generate an event journal receipt
   */
  generateEventJournalReceipt(
    contextId: string,
    event: TrustEvent,
    hashChainAnchor: string,
    merkleProof: string[],
    latencyMs: number
  ): TrustReceipt {
    return this.generateReceipt({
      contextId,
      eventId: event.eventId,
      receiptType: 'event_journal',
      status: 'approved',
      hashChainAnchor,
      merkleProof,
      latencyMs,
      metadata: {
        eventType: event.eventType,
        eventHash: event.eventHash,
      },
    });
  }

  /**
   * Generate a verification receipt
   */
  generateVerificationReceipt(
    contextId: string,
    eventId: string,
    status: 'approved' | 'rejected' | 'halted',
    reason: string,
    hashChainAnchor: string,
    merkleProof: string[],
    latencyMs: number,
    riskScore?: number
  ): TrustReceipt {
    return this.generateReceipt({
      contextId,
      eventId,
      receiptType: 'verification',
      status,
      reason,
      hashChainAnchor,
      merkleProof,
      latencyMs,
      metadata: {
        riskScore,
        verificationResult: status,
      },
    });
  }

  /**
   * Generate an attestation receipt
   */
  generateAttestationReceipt(
    contextId: string,
    attestationId: string,
    hashChainAnchor: string,
    merkleProof: string[],
    latencyMs: number
  ): TrustReceipt {
    return this.generateReceipt({
      contextId,
      eventId: attestationId,
      receiptType: 'attestation',
      status: 'approved',
      hashChainAnchor,
      merkleProof,
      latencyMs,
      metadata: {
        attestationId,
        purpose: 'attestation',
      },
    });
  }

  /**
   * Generate a kill switch receipt
   */
  generateKillSwitchReceipt(
    contextId: string,
    eventId: string,
    status: 'approved' | 'rejected' | 'halted',
    reason: string,
    hashChainAnchor: string,
    merkleProof: string[],
    latencyMs: number
  ): TrustReceipt {
    return this.generateReceipt({
      contextId,
      eventId,
      receiptType: 'kill_switch',
      status,
      reason,
      hashChainAnchor,
      merkleProof,
      latencyMs,
      metadata: {
        killSwitchAction: status,
      },
    });
  }

  /**
   * Get receipt by ID
   */
  getReceipt(receiptId: string): TrustReceipt | undefined {
    return this.receipts.get(receiptId);
  }

  /**
   * Verify a receipt
   */
  verifyReceipt(receipt: TrustReceipt): ReceiptVerificationResult {
    return verifyReceipt(receipt, { signingKey: this.receiptGenerator.getSigningKey() });
  }

  /**
   * Verify receipt by ID
   */
  verifyReceiptById(receiptId: string): ReceiptVerificationResult {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) {
      return {
        valid: false,
        errors: [`Receipt not found: ${receiptId}`],
        warnings: [],
      };
    }
    return this.verifyReceipt(receipt);
  }

  /**
   * Get all receipts for a context
   */
  getReceiptsByContext(contextId: string): TrustReceipt[] {
    return Array.from(this.receipts.values())
      .filter((r) => r.header.contextId === contextId);
  }

  /**
   * Get receipts by type
   */
  getReceiptsByType(receiptType: ReceiptType): TrustReceipt[] {
    return Array.from(this.receipts.values())
      .filter((r) => r.header.receiptType === receiptType);
  }

  /**
   * Convert to TrustContextReceipt format
   */
  toTrustContextReceipt(receipt: TrustReceipt): TrustContextReceipt {
    return {
      receiptId: receipt.header.receiptId,
      contextId: receipt.header.contextId,
      eventId: receipt.header.eventId,
      receiptType: receipt.header.receiptType as ReceiptType,
      status: receipt.payload.status,
      reason: receipt.payload.reason,
      hashChainAnchor: receipt.payload.hashChainAnchor,
      merkleProof: receipt.payload.merkleProof,
      timestamp: receipt.header.timestamp,
      latencyMs: receipt.payload.latencyMs,
    };
  }
}

// ───────────────────────────────────────────────────────────────
// Factory Function
// ───────────────────────────────────────────────────────────────

export function createReceiptEngine(config: ReceiptEngineConfig): ReceiptEngine {
  return new ReceiptEngine(config);
}
