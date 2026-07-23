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

// Epistemic Runtime v0.8 — Acceptance Pipeline
// THE UNIVERSAL WRITE GATE. Every mutation must flow through here.
// Observation → AcceptancePipeline → Fact → Projection

import type {
  Fact,
  FactType,
  AcceptanceResult,
  PolicyRule,
  RuntimeProviders,
  Proof,
} from './types';
import { computeFactId, computeSHA256 } from './hashing';
import { canonicalize } from './canonicalization';
import { MerkleMountainRange } from './mmr';
import { DeterministicSequencer } from './sequencer';
import { SchemaRegistry } from './schema-registry';
import { evaluatePolicy } from './policy-evaluator';
import { redactPII, STANDARD_PII_RULES, type PIIRule } from './redaction';

export class AcceptancePipeline {
  private providers: RuntimeProviders;
  private sequencer: DeterministicSequencer;
  private mmr: MerkleMountainRange;
  private schemaRegistry: SchemaRegistry;
  private policies: Map<string, PolicyRule> = new Map();
  private piiRules: PIIRule[];

  constructor(
    providers: RuntimeProviders,
    sequencer: DeterministicSequencer,
    mmr: MerkleMountainRange,
    schemaRegistry: SchemaRegistry,
    piiRules?: PIIRule[],
  ) {
    this.providers = providers;
    this.sequencer = sequencer;
    this.mmr = mmr;
    this.schemaRegistry = schemaRegistry;
    this.piiRules = piiRules ?? STANDARD_PII_RULES;
  }

  /**
   * Submit an observation through the acceptance pipeline.
   * This is THE ONLY way to create a Fact.
   *
   * Pipeline steps (CONTRACT: Observation → PII Redaction → Canonicalization → Hashing → Signing → Append):
   * 1. Schema validation
   * 2. Policy evaluation
   * 3. PII redaction (BEFORE canonicalization — never hash raw regulated fields)
   * 4. Canonicalization (RFC 8785)
   * 5. SHA-256 hashing
   * 6. Fact ID computation
   * 7. Sequencing
   * 8. Signing
   * 9. MMR insertion
   * 10. Proof generation
   * 11. WORM storage
   */
  async submit(
    type: FactType,
    body: Record<string, unknown>,
    submittedBy: string,
    schemaId: string,
  ): Promise<AcceptanceResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Schema validation
    const schemaResult = this.schemaRegistry.validate(type, body);
    if (!schemaResult.valid) {
      return {
        accepted: false,
        fact: null,
        proof: null,
        errors: schemaResult.errors,
        warnings: [],
      };
    }

    // Step 2: Policy evaluation
    const policyErrors = this.evaluatePolicies(type, body);
    if (policyErrors.length > 0) {
      return {
        accepted: false,
        fact: null,
        proof: null,
        errors: policyErrors,
        warnings: [],
      };
    }

    // Step 3: PII redaction (BEFORE canonicalization — contract requirement)
    // Never hash raw regulated fields. Redaction occurs before canonical bytes are computed.
    const { redactedBody, redactedFields } = redactPII(body, this.piiRules);

    // Step 4: Canonicalization (RFC 8785) — on the REDACTED body
    const canonicalBytes = canonicalize({ type, body: redactedBody, submittedBy, schemaId });

    // Step 5: SHA-256 hash
    const hash = computeSHA256(canonicalBytes);

    // Step 6: Fact ID (SHA-256 of canonical bytes)
    const factId = computeFactId(canonicalBytes);

    // Step 7: Sequencing
    const { sequence, timestamp } = this.sequencer.next();

    // Step 8: Signing
    const signature = this.providers.signer.sign(canonicalBytes);

    // Step 9: Build Fact
    const fact: Fact = {
      id: factId,
      type,
      body: redactedBody,
      canonicalBytes,
      hash,
      sequence,
      timestamp,
      submittedBy,
      signature,
      acceptedAt: this.providers.clock.now(),
      schemaId,
    };

    // Step 10: MMR insertion
    const mmrIndex = this.mmr.append(factId, hash);

    // Step 11: Proof generation
    const mmrProof = this.mmr.getInclusionProof(mmrIndex);
    const proof: Proof = {
      id: computeSHA256(`proof:${factId}:${this.providers.clock.now()}`),
      factId,
      kind: 'inclusion',
      mmrRoot: this.mmr.getRoot(),
      proofPath: mmrProof.authPath,
      mmrIndex,
      signature: this.providers.signer.sign(canonicalBytes),
      timestamp: this.providers.clock.now(),
    };

    // Step 12: WORM storage
    await this.providers.storage.append(fact);
    await this.providers.storage.appendProof(proof);

    return {
      accepted: true,
      fact,
      proof,
      errors,
      warnings,
    };
  }

  /**
   * Evaluate all active policies against the fact.
   */
  private evaluatePolicies(type: FactType, body: Record<string, unknown>): string[] {
    const errors: string[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.active) continue;
      if (!policy.appliesTo.includes(type)) continue;

      const result = evaluatePolicy(policy, body);
      if (result === 'reject') {
        errors.push(`Policy "${policy.name}" rejected this observation`);
      }
    }

    return errors;
  }

  /**
   * Register a policy rule.
   */
  registerPolicy(policy: PolicyRule): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get the current MMR root.
   */
  getMMRRoot(): string {
    return this.mmr.getRoot();
  }

  /**
   * Get the current sequence number.
   */
  getCurrentSequence(): number {
    return this.sequencer.current;
  }

  /**
   * Reset pipeline for replay.
   */
  reset(): void {
    this.sequencer.reset();
    this.mmr.reset();
    this.schemaRegistry.reset();
  }
}
