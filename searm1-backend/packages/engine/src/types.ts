// ─────────────────────────────────────────────────────────────
// VVU-IVE Evidence Engine — Core Types
// ─────────────────────────────────────────────────────────────
// The engine operates on hydraulic observations from sparse
// pressure/flow sensors deployed across the Ward 42 DMA. It
// produces an EvidenceVector and EIS classification per the
// EIS v1.0 specification (02c_EIS_v1.md).
// ─────────────────────────────────────────────────────────────

/**
 * A raw observation from a single physical sensor attached to an asset.
 * Pressure in bar, flow in L/min, timestamp in UTC.
 */
export interface Observation {
  sensorId: string;
  assetId: string;
  pressure: number;
  flow: number;
  timestamp: Date;
}

/**
 * Normalized evidence vector in [0,1]³ per asset.
 * Each component captures an independent axis of evidence:
 *   - pressureSignal : relative deviation from baseline pressure
 *   - flowSignal    : relative deviation from baseline flow
 *   - spatialSignal : cross-asset correlation weight (HBK-influenced)
 */
export interface EvidenceVector {
  pressureSignal: number;
  flowSignal: number;
  spatialSignal: number;
}

/**
 * The classification of an evidence event under EIS v1.0.
 * VERIFIED     — confidence ≥ 0.75, event meets independence threshold
 * CANDIDATE    — confidence ≥ 0.50, partial evidence; needs more sensors
 * INSUFFICIENT — confidence < 0.50, evidence too weak to act on
 */
export type EvidenceClassification = 'VERIFIED' | 'CANDIDATE' | 'INSUFFICIENT';

/**
 * A computed evidence event — the atomic unit produced by the engine
 * and persisted to the evidence_events table.
 */
export interface EvidenceEvent {
  assetId: string;
  eventType: string;
  confidence: number;
  classification: EvidenceClassification;
  evidence: EvidenceVector;
  timestamp: Date;
}
