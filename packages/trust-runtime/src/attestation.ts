// packages/trust-runtime/src/attestation.ts
// ───────────────────────────────────────────────────────────────
// Attestation Engine
// Generates and verifies cryptographic attestations
// ───────────────────────────────────────────────────────────────

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalJson, sha256Hex, hashObject } from '@proofbridge/trust-crypto';
import { v4 as uuidv4 } from 'uuid';

// ───────────────────────────────────────────────────────────────
// Attestation Types
// ───────────────────────────────────────────────────────────────

export interface Attestation {
  attestationId: string;
  contextId: string;
  attestor: string;
  subject: string;
  claim: Record<string, unknown>;
  signature: string;
  timestamp: number;
  version: string;
}

export interface AttestationConfig {
  signingKey: string;
  attestor: string;
  version: string;
}

export interface AttestationVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ───────────────────────────────────────────────────────────────
// Attestation Engine Class
// ───────────────────────────────────────────────────────────────

export class AttestationEngine {
  private signingKey: string;
  private attestor: string;
  private version: string;
  private attestations: Map<string, Attestation>;

  constructor(config: AttestationConfig) {
    this.signingKey = config.signingKey;
    this.attestor = config.attestor;
    this.version = config.version;
    this.attestations = new Map();
  }

  /**
   * Create a new attestation
   */
  createAttestation(
    contextId: string,
    subject: string,
    claim: Record<string, unknown>
  ): Attestation {
    const attestationId = uuidv4();
    const timestamp = Date.now();

    // Create the attestation object
    const attestation: Omit<Attestation, 'signature'> = {
      attestationId,
      contextId,
      attestor: this.attestor,
      subject,
      claim,
      timestamp,
      version: this.version,
    };

    // Sign the attestation
    const signature = this.signAttestation(attestation);

    const signedAttestation: Attestation = {
      ...attestation,
      signature,
    };

    // Store the attestation
    this.attestations.set(attestationId, signedAttestation);

    return signedAttestation;
  }

  /**
   * Sign an attestation
   */
  private signAttestation(attestation: Omit<Attestation, 'signature'>): string {
    const canonical = canonicalJson(attestation);
    return createHmac('sha256', this.signingKey)
      .update(canonical, 'utf8')
      .digest('hex');
  }

  /**
   * Verify an attestation signature
   */
  verifyAttestationSignature(attestation: Attestation): boolean {
    const canonical = canonicalJson({
      attestationId: attestation.attestationId,
      contextId: attestation.contextId,
      attestor: attestation.attestor,
      subject: attestation.subject,
      claim: attestation.claim,
      timestamp: attestation.timestamp,
      version: attestation.version,
    });

    const expectedSignature = createHmac('sha256', this.signingKey)
      .update(canonical, 'utf8')
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(attestation.signature, 'hex')
    );
  }

  /**
   * Verify an attestation
   */
  verifyAttestation(attestation: Attestation): AttestationVerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!attestation.attestationId) {
      errors.push('Missing attestationId');
    }

    if (!attestation.contextId) {
      errors.push('Missing contextId');
    }

    if (!attestation.attestor) {
      errors.push('Missing attestor');
    }

    if (!attestation.subject) {
      errors.push('Missing subject');
    }

    if (!attestation.claim) {
      errors.push('Missing claim');
    }

    if (!attestation.signature) {
      errors.push('Missing signature');
    }

    if (!attestation.timestamp) {
      errors.push('Missing timestamp');
    }

    // Verify signature
    if (!this.verifyAttestationSignature(attestation)) {
      errors.push('Invalid signature');
    }

    // Verify attestor
    if (attestation.attestor !== this.attestor) {
      warnings.push(`Attestor mismatch: expected ${this.attestor}, got ${attestation.attestor}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get attestation by ID
   */
  getAttestation(attestationId: string): Attestation | undefined {
    return this.attestations.get(attestationId);
  }

  /**
   * Get all attestations for a context
   */
  getAttestationsByContext(contextId: string): Attestation[] {
    return Array.from(this.attestations.values())
      .filter((a) => a.contextId === contextId);
  }

  /**
   * Get all attestations by subject
   */
  getAttestationsBySubject(subject: string): Attestation[] {
    return Array.from(this.attestations.values())
      .filter((a) => a.subject === subject);
  }

  /**
   * Get all attestations
   */
  getAllAttestations(): Attestation[] {
    return Array.from(this.attestations.values());
  }

  /**
   * Compute attestation hash
   */
  computeAttestationHash(attestation: Attestation): string {
    return sha256Hex(
      hashObject({
        attestationId: attestation.attestationId,
        contextId: attestation.contextId,
        attestor: attestation.attestor,
        subject: attestation.subject,
        claim: attestation.claim,
        timestamp: attestation.timestamp,
        version: attestation.version,
      })
    );
  }
}

// ───────────────────────────────────────────────────────────────
// Factory Function
// ───────────────────────────────────────────────────────────────

export function createAttestationEngine(config: AttestationConfig): AttestationEngine {
  return new AttestationEngine(config);
}
