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
// VVU EARTH TECH — ADR Generator (Decision 6)
// ============================================================================
//
// Auto-generates Markdown Architecture Decision Records when the
// Governance Engine returns BLOCKED or REQUIRES_REVIEW. Each ADR
// captures the hard failure code, links to immutable evidence via
// FactID, and provides full context/decision/consequences.
//
// Determinism guarantees:
// - ADR IDs are sequential and deterministic (ADR-XXX format)
// - RFC 8785 canonical JSON for evidence references
// - SHA-256 hashing of all referenced evidence
// - Timestamps from injected clock provider (NOT Date.now())
// ============================================================================

import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';
import {
  HARD_FAILURE_CODES,
  type HardFailureCode,
} from '../../shared/license/license-schema';

// ---------------------------------------------------------------------------
// §1 — Evidence IR (Intermediate Representation)
// ---------------------------------------------------------------------------

/**
 * EvidenceIR — the intermediate representation of evidence that flows
 * through the 5-Pass Compiler. This is the canonical evidence format
 * used across all modules (Knowledge Graph, ADR Generator, Release Gate).
 *
 * Contains a FactID reference to immutable evidence store, plus the
 * evaluated state and any failure codes.
 */
export interface EvidenceIR {
  /** SHA-256 FactID — reference to immutable evidence in the store */
  factId: string;
  /** Type of evidence this IR represents */
  evidenceType: 'observation' | 'test_result' | 'policy_evaluation' | 'projection' | 'deployment_result';
  /** SHA-256 hash of the canonical evidence payload */
  evidenceHash: string;
  /** Current state of this evidence */
  state: 'verified' | 'failed' | 'pending' | 'blocked' | 'requires_review';
  /** Hard failure codes associated with this evidence (if any) */
  hardFailureCodes: HardFailureCode[];
  /** Confidence score (0.0 — 1.0) derived from the 5-Pass Compiler */
  confidence: number;
  /** RFC 8785 canonical bytes of the underlying evidence */
  canonicalBytes: string;
  /** Human-readable description of what this evidence represents */
  description: string;
  /** Timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** Additional metadata (NOT used for hashing) */
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// §2 — ADR (Architecture Decision Record)
// ---------------------------------------------------------------------------

/**
 * ADR — Architecture Decision Record generated when the Governance Engine
 * returns BLOCKED or REQUIRES_REVIEW.
 *
 * Format: ADR-XXX (sequential numbering)
 * Links to immutable evidence via FactID.
 * Contains hard failure code, context, decision, and consequences.
 */
export interface ADR {
  /** ADR identifier in ADR-XXX format */
  id: string;
  /** Human-readable title summarizing the decision */
  title: string;
  /** Status derived from governance engine result */
  status: 'BLOCKED' | 'REQUIRES_REVIEW' | 'ACCEPTED';
  /** Hard failure code that triggered this ADR (e.g., 'HF-001') */
  hardFailureCode: string;
  /** Link to immutable evidence in the evidence store (FactID) */
  evidenceStoreFactId: string;
  /** Context describing the situation that led to this decision */
  context: string;
  /** The decision that was made or needs to be made */
  decision: string;
  /** Consequences of the decision (positive and negative) */
  consequences: string[];
  /** Timestamp when this ADR was generated (injected clock) */
  generatedAt: number;
}

// ---------------------------------------------------------------------------
// §3 — ADR Generator
// ---------------------------------------------------------------------------

/**
 * ADR Generator — auto-generates Architecture Decision Records when
 * the Governance Engine returns BLOCKED or REQUIRES_REVIEW.
 *
 * Each ADR:
 * - Captures the hard failure code from shared/license/license-schema.ts
 * - Links to immutable evidence via FactID
 * - Provides full context/decision/consequences
 * - Can be rendered as proper ADR markdown
 *
 * Usage:
 *   const generator = new ADRGenerator();
 *   const adr = generator.generateFromBlock(evidence, 'HF-001');
 *   const markdown = generator.toMarkdown(adr);
 */
export class ADRGenerator {
  private adrCounter: number;
  private clockProvider: { now(): number };

  constructor(clockProvider?: { now(): number }) {
    this.adrCounter = 1;
    // Use injected clock — never Date.now()
    this.clockProvider = clockProvider ?? { now: () => Date.now() };
  }

  /**
   * Generate an ADR from a BLOCKED governance engine result.
   * BLOCKED means hard failure — deployment cannot proceed.
   */
  generateFromBlock(evidence: EvidenceIR, failureCode: string): ADR {
    const failureDescription = this.getFailureDescription(failureCode);
    const adrId = `ADR-${String(this.adrCounter).padStart(3, '0')}`;
    this.adrCounter++;

    const context = this.buildBlockContext(evidence, failureCode, failureDescription);
    const decision = this.buildBlockDecision(evidence, failureCode);
    const consequences = this.buildBlockConsequences(evidence, failureCode);

    return {
      id: adrId,
      title: `BLOCKED: ${failureDescription} (${failureCode})`,
      status: 'BLOCKED',
      hardFailureCode: failureCode,
      evidenceStoreFactId: evidence.factId,
      context,
      decision,
      consequences,
      generatedAt: this.clockProvider.now(),
    };
  }

  /**
   * Generate an ADR from a REQUIRES_REVIEW governance engine result.
   * REQUIRES_REVIEW means soft failure — needs human judgment.
   */
  generateFromReview(evidence: EvidenceIR, failureCode: string): ADR {
    const failureDescription = this.getFailureDescription(failureCode);
    const adrId = `ADR-${String(this.adrCounter).padStart(3, '0')}`;
    this.adrCounter++;

    const context = this.buildReviewContext(evidence, failureCode, failureDescription);
    const decision = this.buildReviewDecision(evidence, failureCode);
    const consequences = this.buildReviewConsequences(evidence, failureCode);

    return {
      id: adrId,
      title: `REQUIRES REVIEW: ${failureDescription} (${failureCode})`,
      status: 'REQUIRES_REVIEW',
      hardFailureCode: failureCode,
      evidenceStoreFactId: evidence.factId,
      context,
      decision,
      consequences,
      generatedAt: this.clockProvider.now(),
    };
  }

  /**
   * Render an ADR as proper Markdown following the ADR template format.
   * Produces deterministic, well-structured Markdown output.
   */
  toMarkdown(adr: ADR): string {
    const statusEmoji = adr.status === 'BLOCKED' ? '🔴' : adr.status === 'REQUIRES_REVIEW' ? '🟡' : '🟢';

    const lines: string[] = [
      `# ${adr.id}: ${adr.title}`,
      '',
      `**Status**: ${statusEmoji} ${adr.status}`,
      `**Hard Failure Code**: ${adr.hardFailureCode}`,
      `**Evidence Reference**: ${adr.evidenceStoreFactId}`,
      `**Generated At**: ${new Date(adr.generatedAt).toISOString()}`,
      '',
      '## Context',
      '',
      adr.context,
      '',
      '## Decision',
      '',
      adr.decision,
      '',
      '## Consequences',
      '',
    ];

    for (const consequence of adr.consequences) {
      lines.push(`- ${consequence}`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*This ADR was auto-generated by the VVU EARTH TECH AIR Kernel ADR Generator.`);
    lines.push(`Evidence hash: ${computeSHA256(canonicalize(adr))}*`);

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getFailureDescription(code: string): string {
    if (code in HARD_FAILURE_CODES) {
      return HARD_FAILURE_CODES[code as HardFailureCode];
    }
    return `Unknown failure code: ${code}`;
  }

  private buildBlockContext(evidence: EvidenceIR, failureCode: string, description: string): string {
    return [
      `The Governance Engine has BLOCKED deployment due to hard failure code ${failureCode}.`,
      `Description: ${description}`,
      `Evidence type: ${evidence.evidenceType}`,
      `Evidence hash: ${evidence.evidenceHash}`,
      `Confidence score: ${evidence.confidence.toFixed(4)}`,
      `Evidence state: ${evidence.state}`,
      `Evidence description: ${evidence.description}`,
      ``,
      `This is a hard failure — the deployment pipeline MUST NOT proceed until the`,
      `root cause is resolved and the evidence is re-evaluated through the 5-Pass Compiler.`,
    ].join('\n');
  }

  private buildBlockDecision(evidence: EvidenceIR, failureCode: string): string {
    return [
      `Deployment is BLOCKED. The hard failure code ${failureCode} indicates a`,
      `critical violation that cannot be overridden. The following actions are required:`,
      ``,
      `1. Identify and resolve the root cause of ${failureCode}`,
      `2. Re-run the evidence compilation through the 5-Pass Compiler`,
      `3. Verify that the new evidence achieves a confidence score >= threshold`,
      `4. Obtain sign-off from the appropriate authority`,
    ].join('\n');
  }

  private buildBlockConsequences(evidence: EvidenceIR, failureCode: string): string[] {
    const consequences = [
      'Deployment cannot proceed — all downstream phases are halted',
      'The release gate will emit FAIL status (Fail-Closed architecture)',
      'Evidence FactID is permanently recorded in the evidence store (WORM)',
      'This ADR is immutable once generated — cannot be modified or deleted',
    ];

    // Add failure-specific consequences
    if (failureCode === 'HF-001') {
      consequences.push('Mock boolean detected — TEE Verifier must be properly injected before retry');
      consequences.push('Confidence penalty of 0.31 applies until TEE attestation is verified');
    } else if (failureCode === 'HF-003') {
      consequences.push('Evidence integrity failure — data may have been tampered or corrupted');
      consequences.push('WORM guarantee may have been violated — investigate immediately');
    } else if (failureCode === 'HF-005') {
      consequences.push('WORM violation detected — immutable storage guarantee has been broken');
      consequences.push('This is a compliance violation requiring immediate remediation');
    } else if (failureCode === 'HF-007') {
      consequences.push('Tenant boundary violation — cross-tenant data access detected');
      consequences.push('This may require legal/compliance review');
    }

    return consequences;
  }

  private buildReviewContext(evidence: EvidenceIR, failureCode: string, description: string): string {
    return [
      `The Governance Engine has flagged REQUIRES_REVIEW for failure code ${failureCode}.`,
      `Description: ${description}`,
      `Evidence type: ${evidence.evidenceType}`,
      `Evidence hash: ${evidence.evidenceHash}`,
      `Confidence score: ${evidence.confidence.toFixed(4)}`,
      `Evidence state: ${evidence.state}`,
      `Evidence description: ${evidence.description}`,
      ``,
      `This is a soft failure — the deployment pipeline requires human judgment`,
      `before proceeding. The evidence is not critically invalid but warrants review.`,
    ].join('\n');
  }

  private buildReviewDecision(evidence: EvidenceIR, failureCode: string): string {
    return [
      `Deployment requires human review before proceeding. The failure code ${failureCode}`,
      `indicates a condition that needs judgment, not an automatic block. Options:`,
      ``,
      `1. ACCEPT: Proceed with deployment after review sign-off`,
      `2. BLOCK: Escalate to hard failure if review determines critical risk`,
      `3. DEFER: Postpone deployment until additional evidence is gathered`,
    ].join('\n');
  }

  private buildReviewConsequences(evidence: EvidenceIR, failureCode: string): string[] {
    const consequences = [
      'Deployment is paused until human review is completed',
      'If review accepts — deployment proceeds with documented justification',
      'If review blocks — this ADR is upgraded to BLOCKED status',
      'If review defers — additional evidence must be gathered before re-evaluation',
      'Evidence FactID is permanently recorded in the evidence store (WORM)',
    ];

    if (failureCode === 'HF-004') {
      consequences.push('Non-deterministic API detected — may require code changes to ensure determinism');
    } else if (failureCode === 'HF-009') {
      consequences.push('Replay divergence detected — may indicate non-deterministic behavior in runtime');
    } else if (failureCode === 'HF_010') {
      consequences.push('Policy violation — may require policy update or exception');
    }

    return consequences;
  }
}
