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
// VVU EARTH TECH — Evidence Compiler (AIR Kernel, Open Source)
// ============================================================================
//
// Decision 2 (Master Implementation Blueprint): 5-Pass Compiler with DI.
//
// The EvidenceCompiler is a 5-pass pipeline that transforms raw evidence
// into structured EvidenceIR (Intermediate Representation) with confidence
// scoring, hard failure detection, and cross-fact correlation.
//
// Pass Structure:
//   1. Parse   — Parse raw evidence into structured EvidenceIR
//   2. Validate — Schema + policy validation
//   3. Infer   — Confidence scoring with penalty math (HF-001, HF-002)
//   4. Correlate — Cross-reference with existing facts via FactIDs
//   5. CodeGen  — Generate actionable artifacts (Decision 6)
//
// Dependency Injection:
//   - VerifierRegistry is OPTIONAL. In OSS mode (no registry), TEE/ZK
//     evidence gets confidence penalties (0.31 per Blueprint §2).
//   - Commercial tiers inject real VerifierRegistry for full confidence.
// ============================================================================

import { VerifierRegistry } from '../../shared/verifiers/interfaces';
import {
  TEE_CONFIDENCE_PENALTY,
  MAX_CONFIDENCE_SCORE,
  HARD_FAILURE_CODES,
} from '../../shared/license/license-schema';
import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';

// ---------------------------------------------------------------------------
// §1 — EvidenceIR (Intermediate Representation)
// ---------------------------------------------------------------------------

/**
 * EvidenceIR — the structured intermediate representation produced by
 * the EvidenceCompiler after all 5 passes.
 *
 * This is the canonical evidence format consumed by the Epistemic Runtime's
 * acceptance pipeline, projections, and policy evaluator.
 */
export interface EvidenceIR {
  /** Deterministic evidence ID: SHA-256 of canonical bytes */
  id: string;
  /** Source type: how this evidence was produced */
  sourceType: 'tee_attestation' | 'zk_proof' | 'manual_observation' | 'sensor_telemetry' | 'vetps_telemetry' | 'vetps_filter_state' | 'vetps_relativity' | string;
  /** Raw payload as provided by the source */
  rawPayload: unknown;
  /** Parsed/structured payload (after Pass 1) */
  parsedPayload: Record<string, unknown>;
  /** Confidence score: 1.0 max, 0.69 minimum for unverified TEE/ZK */
  confidenceScore: number;
  /** Hard failure codes detected during compilation */
  hardFailureCodes: string[];
  /** Validation errors (schema/policy) from Pass 2 */
  validationErrors: string[];
  /** Correlated fact IDs (from Pass 4) */
  correlatedFactIds: string[];
  /** Reference to evidence store (WORM storage) */
  evidenceStoreRef?: string;
  /** Canonical bytes (RFC 8785) for hashing */
  canonicalBytes: string;
  /** SHA-256 hash of canonical bytes */
  hash: string;
  /** Timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** CodeGen artifacts produced in Pass 5 */
  codeGenArtifacts: CodeGenArtifact[];
}

// ---------------------------------------------------------------------------
// §2 — CodeGen Artifacts (Decision 6)
// ---------------------------------------------------------------------------

/**
 * CodeGenArtifact — actionable output from Pass 5 of the compiler.
 *
 * These are the derived artifacts that downstream consumers (projections,
 * policy evaluator, MMR) can act on. Each artifact has a type, payload,
 * and deterministic hash for replay verification.
 */
export interface CodeGenArtifact {
  /** Artifact type identifier */
  type: 'confidence_report' | 'failure_fact' | 'correlation_edge' | 'policy_trigger' | 'evidence_receipt';
  /** Artifact payload — type-specific content */
  payload: Record<string, unknown>;
  /** Deterministic hash of canonical payload */
  hash: string;
  /** Timestamp from injected clock */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// §3 — Raw Evidence Input
// ---------------------------------------------------------------------------

/**
 * Raw evidence input format for the compiler.
 * This is the minimum required structure for compilation.
 */
export interface RawEvidenceInput {
  /** Source type identifier */
  sourceType: string;
  /** Raw evidence payload */
  payload: unknown;
  /** Optional timestamp override (otherwise uses Date.now() — NOT for deterministic replay) */
  timestamp?: number;
  /** Optional TEE quote buffer (for tee_attestation source type) */
  teeQuote?: Buffer;
  /** Optional ZK proof input (for zk_proof source type) */
  zkProofInput?: {
    circuitId: string;
    publicInputs: Record<string, unknown>;
    proofData: Buffer;
  };
}

// ---------------------------------------------------------------------------
// §4 — Compilation Result
// ---------------------------------------------------------------------------

/**
 * Result of the full 5-pass compilation pipeline.
 */
export interface CompilationResult {
  /** The compiled EvidenceIR */
  evidence: EvidenceIR;
  /** Whether compilation succeeded (no hard failures) */
  success: boolean;
  /** Hard failure codes detected */
  hardFailures: string[];
  /** Validation warnings (non-blocking) */
  warnings: string[];
  /** Pass-by-pass execution log */
  passLog: PassLogEntry[];
}

/**
 * Log entry for each compilation pass.
 */
export interface PassLogEntry {
  pass: number;
  name: string;
  durationMs: number;
  success: boolean;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// §5 — EvidenceCompiler (5-Pass Pipeline)
// ---------------------------------------------------------------------------

/**
 * EvidenceCompiler — the 5-pass evidence compilation engine.
 *
 * Uses dependency injection for TEE/ZK verification via VerifierRegistry.
 * In OSS mode (no registry), confidence penalties are applied per Blueprint §2.
 *
 * All 5 passes are deterministic and replay-safe when provided with
 * injected clock/entropy providers (per Kernel assertions).
 */
export class EvidenceCompiler {
  private verifierRegistry?: VerifierRegistry;

  constructor(verifierRegistry?: VerifierRegistry) {
    this.verifierRegistry = verifierRegistry;
  }

  /**
   * Compile raw evidence through the 5-pass pipeline.
   * Returns a CompilationResult with the full EvidenceIR and pass log.
   */
  async compile(rawEvidence: RawEvidenceInput): Promise<CompilationResult> {
    const passLog: PassLogEntry[] = [];
    const startTime = Date.now();

    // Pass 1: Parse
    const parseStart = Date.now();
    const parsed = this.parse(rawEvidence);
    passLog.push({
      pass: 1,
      name: 'Parse',
      durationMs: Date.now() - parseStart,
      success: parsed.validationErrors.length === 0,
      details: { sourceType: parsed.sourceType, id: parsed.id },
    });

    // Pass 2: Validate
    const validateStart = Date.now();
    const validated = this.validate(parsed);
    passLog.push({
      pass: 2,
      name: 'Validate',
      durationMs: Date.now() - validateStart,
      success: validated.validationErrors.length === 0,
      details: { errors: validated.validationErrors },
    });

    // Pass 3: Infer (with confidence penalties)
    const inferStart = Date.now();
    const inferred = await this.infer(validated);
    passLog.push({
      pass: 3,
      name: 'Infer',
      durationMs: Date.now() - inferStart,
      success: inferred.hardFailureCodes.length === 0,
      details: {
        confidenceScore: inferred.confidenceScore,
        hardFailures: inferred.hardFailureCodes,
      },
    });

    // Pass 4: Correlate
    const correlateStart = Date.now();
    const correlated = this.correlate(inferred);
    passLog.push({
      pass: 4,
      name: 'Correlate',
      durationMs: Date.now() - correlateStart,
      success: true,
      details: { correlatedFactIds: correlated.correlatedFactIds },
    });

    // Pass 5: CodeGen
    const codeGenStart = Date.now();
    const generated = this.codeGen(correlated);
    passLog.push({
      pass: 5,
      name: 'CodeGen',
      durationMs: Date.now() - codeGenStart,
      success: true,
      details: { artifactCount: generated.codeGenArtifacts.length },
    });

    const success = generated.hardFailureCodes.length === 0 && generated.validationErrors.length === 0;

    return {
      evidence: generated,
      success,
      hardFailures: generated.hardFailureCodes,
      warnings: generated.validationErrors,
      passLog,
    };
  }

  // ---------------------------------------------------------------------------
  // Pass 1: Parse — Parse raw evidence into structured EvidenceIR
  // ---------------------------------------------------------------------------

  private parse(raw: RawEvidenceInput): EvidenceIR {
    const timestamp = raw.timestamp ?? Date.now();

    // Structured payload from raw input
    const parsedPayload: Record<string, unknown> = {};

    if (raw.payload && typeof raw.payload === 'object') {
      // Deep copy the payload to prevent mutation
      Object.assign(parsedPayload, raw.payload);
    } else {
      // Wrap primitive payloads
      parsedPayload.value = raw.payload;
    }

    // Compute canonical bytes and deterministic ID
    const canonicalPayload = {
      sourceType: raw.sourceType,
      payload: parsedPayload,
      timestamp,
    };
    const canonicalBytes = canonicalize(canonicalPayload);
    const id = computeSHA256(canonicalBytes);
    const hash = computeSHA256(canonicalBytes);

    return {
      id,
      sourceType: raw.sourceType,
      rawPayload: raw.payload,
      parsedPayload,
      confidenceScore: MAX_CONFIDENCE_SCORE, // Will be adjusted in Pass 3
      hardFailureCodes: [],
      validationErrors: [],
      correlatedFactIds: [],
      evidenceStoreRef: undefined,
      canonicalBytes,
      hash,
      timestamp,
      codeGenArtifacts: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Pass 2: Validate — Schema + policy validation
  // ---------------------------------------------------------------------------

  private validate(evidence: EvidenceIR): EvidenceIR {
    const errors: string[] = [];

    // Schema validation: required fields
    if (!evidence.id || evidence.id.length === 0) {
      errors.push('Evidence ID is required (computed from canonical bytes)');
    }

    if (!evidence.sourceType || evidence.sourceType.length === 0) {
      errors.push('Source type is required');
    }

    if (evidence.confidenceScore < 0 || evidence.confidenceScore > MAX_CONFIDENCE_SCORE) {
      errors.push(`Confidence score must be between 0 and ${MAX_CONFIDENCE_SCORE}`);
    }

    // Policy validation: known source types
    const validSourceTypes = [
      'tee_attestation',
      'zk_proof',
      'manual_observation',
      'sensor_telemetry',
      'vetps_telemetry',
      'vetps_filter_state',
      'vetps_relativity',
    ];
    if (!validSourceTypes.includes(evidence.sourceType)) {
      // Allow unknown source types but add a warning-level validation note
      errors.push(`Unknown source type: ${evidence.sourceType} (allowed but requires manual review)`);
    }

    // TEE-specific validation: quote buffer must be present
    if (evidence.sourceType === 'tee_attestation') {
      const raw = evidence.rawPayload as Record<string, unknown> | null;
      if (!raw || !raw.teeQuote) {
        errors.push('TEE attestation requires a quote buffer in rawPayload');
      }
    }

    // ZK-specific validation: proof input must be present
    if (evidence.sourceType === 'zk_proof') {
      const raw = evidence.rawPayload as Record<string, unknown> | null;
      if (!raw || !raw.zkProofInput) {
        errors.push('ZK proof requires proof input in rawPayload');
      }
    }

    // VETPS telemetry validation: metadata packet must be present
    if (evidence.sourceType === 'vetps_telemetry') {
      const raw = evidence.rawPayload as Record<string, unknown> | null;
      if (!raw || !raw.metadata_packet) {
        errors.push('VETPS telemetry requires metadata_packet in rawPayload');
      }
    }

    // Timestamp validation: must be positive
    if (evidence.timestamp <= 0) {
      errors.push('Timestamp must be positive');
    }

    return {
      ...evidence,
      validationErrors: [...evidence.validationErrors, ...errors],
    };
  }

  // ---------------------------------------------------------------------------
  // Pass 3: Infer — Confidence scoring with penalty math
  // ---------------------------------------------------------------------------

  /**
   * Pass 3: Infer confidence score with penalty math.
   *
   * Per Blueprint §2:
   *   - HF-001: If source_type === 'tee_attestation' and no verifierRegistry,
   *     apply TEE_CONFIDENCE_PENALTY (0.31). confidence = MAX - penalty = 0.69.
   *   - HF-002: If source_type === 'zk_proof' and no verifierRegistry,
   *     apply TEE_CONFIDENCE_PENALTY (0.31). confidence = MAX - penalty = 0.69.
   *
   * If verifierRegistry IS provided:
   *   - TEE: verify quote, get full confidence (1.0) or failure
   *   - ZK:  verify proof, get full confidence (1.0) or failure
   */
  private async infer(evidence: EvidenceIR): Promise<EvidenceIR> {
    const hardFailureCodes: string[] = [...evidence.hardFailureCodes];
    let confidenceScore = evidence.confidenceScore;

    // HF-001: TEE attestation without verifier registry
    if (evidence.sourceType === 'tee_attestation' && !this.verifierRegistry) {
      confidenceScore = MAX_CONFIDENCE_SCORE - TEE_CONFIDENCE_PENALTY; // 0.69
      hardFailureCodes.push(HARD_FAILURE_CODES.HF_001);
    }

    // HF-002: ZK proof without verifier registry
    if (evidence.sourceType === 'zk_proof' && !this.verifierRegistry) {
      confidenceScore = MAX_CONFIDENCE_SCORE - TEE_CONFIDENCE_PENALTY; // 0.69
      hardFailureCodes.push(HARD_FAILURE_CODES.HF_002);
    }

    // TEE attestation with verifier registry — verify the quote
    if (evidence.sourceType === 'tee_attestation' && this.verifierRegistry) {
      try {
        const raw = evidence.rawPayload as Record<string, unknown> | null;
        const quoteBuffer = raw?.teeQuote as Buffer | undefined;
        const quote = quoteBuffer ?? Buffer.from('');
        const result = await this.verifierRegistry.verifyTEE(quote);
        confidenceScore = result.confidenceScore;
        if (!result.verified) {
          hardFailureCodes.push(HARD_FAILURE_CODES.HF_001);
        }
      } catch (error) {
        // Verification failed — apply penalty
        confidenceScore = MAX_CONFIDENCE_SCORE - TEE_CONFIDENCE_PENALTY;
        hardFailureCodes.push(HARD_FAILURE_CODES.HF_001);
      }
    }

    // ZK proof with verifier registry — verify the proof
    if (evidence.sourceType === 'zk_proof' && this.verifierRegistry) {
      try {
        const raw = evidence.rawPayload as Record<string, unknown> | null;
        const zkInput = raw?.zkProofInput as {
          circuitId: string;
          publicInputs: Record<string, unknown>;
          proofData: Buffer;
        } | undefined;

        if (zkInput) {
          const result = await this.verifierRegistry.verifyZKProof(zkInput);
          confidenceScore = result.confidenceScore;
          if (!result.verified) {
            hardFailureCodes.push(HARD_FAILURE_CODES.HF_002);
          }
        } else {
          // Missing ZK proof input — apply penalty
          confidenceScore = MAX_CONFIDENCE_SCORE - TEE_CONFIDENCE_PENALTY;
          hardFailureCodes.push(HARD_FAILURE_CODES.HF_002);
        }
      } catch (error) {
        // Verification failed — apply penalty
        confidenceScore = MAX_CONFIDENCE_SCORE - TEE_CONFIDENCE_PENALTY;
        hardFailureCodes.push(HARD_FAILURE_CODES.HF_002);
      }
    }

    // VETPS telemetry: inherit confidence from domain metrics if present
    if (evidence.sourceType === 'vetps_filter_state') {
      const parsed = evidence.parsedPayload;
      const brierScore = parsed.brier_score as number | undefined;
      if (brierScore !== undefined) {
        // Translate Brier score to AIR confidence (same formula as HBK adapter)
        confidenceScore = Math.max(0, 1 - (brierScore / 0.10));
      }
    }

    // Clamp confidence to valid range
    confidenceScore = Math.max(0, Math.min(MAX_CONFIDENCE_SCORE, confidenceScore));

    return {
      ...evidence,
      confidenceScore,
      hardFailureCodes,
    };
  }

  // ---------------------------------------------------------------------------
  // Pass 4: Correlate — Cross-reference with existing facts
  // ---------------------------------------------------------------------------

  /**
   * Pass 4: Correlate evidence with existing facts via FactIDs.
   *
   * This pass identifies causal chains and correlation links between
   * the compiled evidence and previously accepted facts. Correlation
   * enables the Epistemic Runtime's causal graph and MMR proof linking.
   *
   * Deterministic: correlation is based on hash-based lookups, not
   * random traversal.
   */
  private correlate(evidence: EvidenceIR): EvidenceIR {
    const correlatedFactIds: string[] = [];

    // Self-correlation: the evidence ID itself
    correlatedFactIds.push(evidence.id);

    // Causal correlation: if the payload references causation/correlation IDs
    const parsed = evidence.parsedPayload;
    if (parsed.causationId && typeof parsed.causationId === 'string') {
      correlatedFactIds.push(parsed.causationId);
    }
    if (parsed.correlationId && typeof parsed.correlationId === 'string') {
      correlatedFactIds.push(parsed.correlationId);
    }
    if (parsed.parentFactId && typeof parsed.parentFactId === 'string') {
      correlatedFactIds.push(parsed.parentFactId);
    }

    // VETPS relativity: causal chain correlation
    if (evidence.sourceType === 'vetps_relativity') {
      const causalChain = parsed.causal_chain as string[] | undefined;
      if (causalChain && Array.isArray(causalChain)) {
        for (const chainId of causalChain) {
          if (typeof chainId === 'string') {
            correlatedFactIds.push(chainId);
          }
        }
      }
    }

    // Deduplicate correlated fact IDs
    const uniqueCorrelatedFactIds = [...new Set(correlatedFactIds)];

    return {
      ...evidence,
      correlatedFactIds: uniqueCorrelatedFactIds,
    };
  }

  // ---------------------------------------------------------------------------
  // Pass 5: CodeGen — Generate actionable artifacts
  // ---------------------------------------------------------------------------

  /**
   * Pass 5: CodeGen — generate actionable artifacts from compiled evidence.
   *
   * Per Decision 6 (Master Blueprint), CodeGen produces:
   *   - confidence_report: Summary of confidence scoring
   *   - failure_fact: FailureFact for any hard failure codes
   *   - correlation_edge: Link evidence to correlated facts
   *   - policy_trigger: Policy evaluation trigger for specific source types
   *   - evidence_receipt: Cryptographic receipt for evidence storage
   *
   * All artifacts are deterministic (hash-based) and replay-safe.
   */
  private codeGen(evidence: EvidenceIR): EvidenceIR {
    const artifacts: CodeGenArtifact[] = [];
    const timestamp = evidence.timestamp;

    // Artifact 1: Confidence Report
    const confidenceReportPayload = {
      evidenceId: evidence.id,
      sourceType: evidence.sourceType,
      confidenceScore: evidence.confidenceScore,
      hardFailures: evidence.hardFailureCodes,
      timestamp,
    };
    artifacts.push({
      type: 'confidence_report',
      payload: confidenceReportPayload,
      hash: computeSHA256(canonicalize(confidenceReportPayload)),
      timestamp,
    });

    // Artifact 2: Failure Facts (for each hard failure code)
    for (const failureCode of evidence.hardFailureCodes) {
      const failureFactPayload = {
        evidenceId: evidence.id,
        failureCode,
        sourceType: evidence.sourceType,
        confidenceScore: evidence.confidenceScore,
        description: HARD_FAILURE_CODES[failureCode as keyof typeof HARD_FAILURE_CODES] ?? 'Unknown failure',
        timestamp,
      };
      artifacts.push({
        type: 'failure_fact',
        payload: failureFactPayload,
        hash: computeSHA256(canonicalize(failureFactPayload)),
        timestamp,
      });
    }

    // Artifact 3: Correlation Edges
    for (const factId of evidence.correlatedFactIds) {
      if (factId !== evidence.id) { // Skip self-correlation edge
        const correlationEdgePayload = {
          fromEvidenceId: evidence.id,
          toFactId: factId,
          sourceType: evidence.sourceType,
          confidenceScore: evidence.confidenceScore,
          timestamp,
        };
        artifacts.push({
          type: 'correlation_edge',
          payload: correlationEdgePayload,
          hash: computeSHA256(canonicalize(correlationEdgePayload)),
          timestamp,
        });
      }
    }

    // Artifact 4: Policy Trigger (for compliance-relevant source types)
    const complianceTypes = ['tee_attestation', 'zk_proof', 'vetps_telemetry', 'vetps_filter_state'];
    if (complianceTypes.includes(evidence.sourceType)) {
      const policyTriggerPayload = {
        evidenceId: evidence.id,
        sourceType: evidence.sourceType,
        confidenceScore: evidence.confidenceScore,
        hardFailures: evidence.hardFailureCodes,
        triggerReason: evidence.hardFailureCodes.length > 0 ? 'hard_failure_detected' : 'evidence_accepted',
        timestamp,
      };
      artifacts.push({
        type: 'policy_trigger',
        payload: policyTriggerPayload,
        hash: computeSHA256(canonicalize(policyTriggerPayload)),
        timestamp,
      });
    }

    // Artifact 5: Evidence Receipt
    const receiptPayload = {
      evidenceId: evidence.id,
      evidenceHash: evidence.hash,
      canonicalBytes: evidence.canonicalBytes,
      confidenceScore: evidence.confidenceScore,
      sourceType: evidence.sourceType,
      artifactCount: artifacts.length,
      timestamp,
    };
    artifacts.push({
      type: 'evidence_receipt',
      payload: receiptPayload,
      hash: computeSHA256(canonicalize(receiptPayload)),
      timestamp,
    });

    return {
      ...evidence,
      codeGenArtifacts: artifacts,
    };
  }
}
