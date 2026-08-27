/**
 * Audit Serializer — SHA-256 hashed JSON audit receipt
 * -----------------------------------------------------
 * Reference: 04a brief + 02c EIS spec.
 *
 * Produces a deterministic, reproducible audit receipt that a municipal
 * investigator can use to verify exactly why the system made its decision.
 * The receipt carries:
 *   - The DMA calibration (thresholds, correlation window) — so the verdict
 *     is mathematically reproducible.
 *   - The full 11-field provenance spine for every observation.
 *   - The EIS verdict + score breakdown.
 *   - A SHA-256 hash of the canonical receipt body (integrity proof).
 *
 * Uses the Web Crypto API (SubtleCrypto.digest) so it works both server-side
 * (Node 18+) and client-side (browser) — same code path.
 */

import type {
  DMACalibration,
  EISVerdict,
  Observation,
} from './EISv1Engine';

export interface AuditReceipt {
  schema: 'EISv1/audit-receipt';
  schemaVersion: '1.0';
  generatedAtUtc: string;
  dmaId: string;
  classification: string;          // SIMULATION / OBSERVED / PLACEHOLDER
  calibration: DMACalibration;
  observationCount: number;
  observations: Array<{
    sensorId: string;
    measurementType: string;
    timestampUtc: string;
    location: string;
    value: number | null;
    unit: string;
    qualityFlag: string;
    evidenceClass: string;
    evidenceState: string;
    weight: number;
    rationale: string;
    // 11-field provenance spine (flattened for audit readability)
    provenance: {
      sensorId: string;
      firmwareVersion: string;
      calibrationEpoch: string;
      timestampUtc: string;
      location: string;
      dmaId: string;
      environmentalContext: {
        temperatureC: number | null;
        rainfallMm: number | null;
        groundCondition: string | null;
      };
      processingPipeline: string;
      attestationHash: string;
      qualityFlag: string;
      measurementType: string;
    };
  }>;
  verdict: {
    score: number;
    threshold: number;
    verdict: string;
    hasPrimary: boolean;
    hasCorrelated: boolean;
    hasIndependent: boolean;
    hasContextual: boolean;
    hasPumpContext: boolean;
    primaryObservationId: string | null;
    rejectedReason: string | null;
  };
  receiptHash: string;             // SHA-256 of canonical body
}

/**
 * Canonicalise the receipt body into a deterministic JSON string.
 * Sorts object keys + array entries by sensorId+timestamp to guarantee
 * same-input → same-hash reproducibility (02c spec: 100% deterministic).
 *
 * NOTE: generatedAtUtc is intentionally EXCLUDED from the canonical body —
 * it is metadata about when the receipt was issued, not part of the input
 * evidence. Including it would make the hash non-deterministic across
 * identical-input recomputations, violating the reproducibility guarantee.
 */
export function canonicalize(body: Omit<AuditReceipt, 'receiptHash'>): string {
  const observationsSorted = [...body.observations].sort((a, b) => {
    const ka = `${a.sensorId}|${a.timestampUtc}`;
    const kb = `${b.sensorId}|${b.timestampUtc}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const stable = {
    schema: body.schema,
    schemaVersion: body.schemaVersion,
    // generatedAtUtc deliberately omitted — see jsdoc above.
    dmaId: body.dmaId,
    classification: body.classification,
    calibration: body.calibration,
    observationCount: body.observationCount,
    observations: observationsSorted,
    verdict: body.verdict,
  };
  return JSON.stringify(stable, Object.keys(stable).sort());
}

/**
 * Compute SHA-256 hex digest of a string using Web Crypto.
 * Works in Node 18+ (globalThis.crypto.subtle) and modern browsers.
 */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Build + hash the audit receipt.
 */
export async function serializeAudit(
  verdict: EISVerdict,
  observations: Observation[],
  calibration: DMACalibration,
  opts: { dmaId: string; classification?: string; generatedAtUtc?: string } = {
    dmaId: 'NMBM-DMA-07',
    classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  },
): Promise<AuditReceipt> {
  const generatedAtUtc =
    opts.generatedAtUtc ?? new Date().toISOString();

  // Build observation rows joining provenance + classification output
  const obsRows = observations.map((o, i) => {
    const cls = verdict.observations[i];
    return {
      sensorId: o.provenance.sensorId,
      measurementType: o.provenance.measurementType,
      timestampUtc: o.provenance.timestampUtc,
      location: o.provenance.location,
      value: o.value,
      unit: o.unit,
      qualityFlag: o.provenance.qualityFlag,
      evidenceClass: cls?.evidenceClass ?? 'REJECTED',
      evidenceState: cls?.evidenceState ?? 'VALID',
      weight: cls?.weight ?? 0,
      rationale: cls?.rationale ?? '',
      provenance: {
        sensorId: o.provenance.sensorId,
        firmwareVersion: o.provenance.firmwareVersion,
        calibrationEpoch: o.provenance.calibrationEpoch,
        timestampUtc: o.provenance.timestampUtc,
        location: o.provenance.location,
        dmaId: o.provenance.dmaId,
        environmentalContext: o.provenance.environmentalContext,
        processingPipeline: o.provenance.processingPipeline,
        attestationHash: o.provenance.attestationHash,
        qualityFlag: o.provenance.qualityFlag,
        measurementType: o.provenance.measurementType,
      },
    };
  });

  const body: Omit<AuditReceipt, 'receiptHash'> = {
    schema: 'EISv1/audit-receipt',
    schemaVersion: '1.0',
    generatedAtUtc,
    dmaId: opts.dmaId,
    classification: opts.classification ?? 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
    calibration,
    observationCount: observations.length,
    observations: obsRows,
    verdict: {
      score: verdict.score,
      threshold: verdict.threshold,
      verdict: verdict.verdict,
      hasPrimary: verdict.hasPrimary,
      hasCorrelated: verdict.hasCorrelated,
      hasIndependent: verdict.hasIndependent,
      hasContextual: verdict.hasContextual,
      hasPumpContext: verdict.hasPumpContext,
      primaryObservationId: verdict.primaryObservationId,
      rejectedReason: verdict.rejectedReason,
    },
  };

  const receiptHash = await sha256Hex(canonicalize(body));
  return { ...body, receiptHash };
}

/**
 * Short fingerprint for display in the UI (first 16 hex chars).
 */
export function shortHash(hash: string): string {
  return hash.slice(0, 16);
}
