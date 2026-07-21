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

export class AcceptancePipeline {
  private providers: RuntimeProviders;
  private sequencer: DeterministicSequencer;
  private mmr: MerkleMountainRange;
  private schemaRegistry: SchemaRegistry;
  private policies: Map<string, PolicyRule> = new Map();

  constructor(
    providers: RuntimeProviders,
    sequencer: DeterministicSequencer,
    mmr: MerkleMountainRange,
    schemaRegistry: SchemaRegistry,
  ) {
    this.providers = providers;
    this.sequencer = sequencer;
    this.mmr = mmr;
    this.schemaRegistry = schemaRegistry;
  }

  /**
   * Submit an observation through the acceptance pipeline.
   * This is THE ONLY way to create a Fact.
   *
   * Pipeline steps:
   * 1. Schema validation
   * 2. Policy evaluation
   * 3. Canonicalization (RFC 8785)
   * 4. SHA-256 hashing
   * 5. Fact ID computation
   * 6. Sequencing
   * 7. Signing
   * 8. MMR insertion
   * 9. Proof generation
   * 10. WORM storage
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

    // Step 3: Canonicalization (RFC 8785)
    const canonicalBytes = canonicalize({ type, body, submittedBy, schemaId });

    // Step 4: SHA-256 hash
    const hash = computeSHA256(canonicalBytes);

    // Step 5: Fact ID (SHA-256 of canonical bytes)
    const factId = computeFactId(canonicalBytes);

    // Step 6: Sequencing
    const { sequence, timestamp } = this.sequencer.next();

    // Step 7: Signing
    const signature = this.providers.signer.sign(canonicalBytes);

    // Step 8: Build Fact
    const fact: Fact = {
      id: factId,
      type,
      body,
      canonicalBytes,
      hash,
      sequence,
      timestamp,
      submittedBy,
      signature,
      acceptedAt: this.providers.clock.now(),
      schemaId,
    };

    // Step 9: MMR insertion
    const mmrIndex = this.mmr.append(factId, hash);

    // Step 10: Proof generation
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

    // Step 11: WORM storage
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
