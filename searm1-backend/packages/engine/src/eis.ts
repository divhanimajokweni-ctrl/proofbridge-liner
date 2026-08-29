// ─────────────────────────────────────────────────────────────
// VVU-IVE Evidence Engine — EIS v1.0 Scoring & Classification
// ─────────────────────────────────────────────────────────────
// Implements the Evidence Independence Specification (EIS v1.0)
// scoring function. Maps a 3-axis EvidenceVector to a scalar
// confidence ∈ [0,1] and a 3-state classification.
//
// Thresholds (per 02c_EIS_v1.md §4):
//   VERIFIED     ≥ 0.75
//   CANDIDATE    ≥ 0.50
//   INSUFFICIENT < 0.50
// ─────────────────────────────────────────────────────────────

import { EvidenceVector, EvidenceClassification } from './types';

export interface EISResult {
  confidence: number;
  classification: EvidenceClassification;
}

/**
 * Calculate the EIS v1.0 confidence and classification for a
 * normalized evidence vector.
 *
 * The raw score is the unweighted mean of the three axes — under
 * EIS v1.0 no axis may dominate (independence is enforced by the
 * engine before this function is called, not by weighting here).
 *
 * @param evidence - The normalized 3-axis evidence vector.
 * @returns {EISResult} confidence ∈ [0,1] and classification label.
 */
export function calculateEIS(evidence: EvidenceVector): EISResult {
  const raw =
    (evidence.pressureSignal + evidence.flowSignal + evidence.spatialSignal) /
    3;
  const confidence = Math.min(1, Math.max(0, raw));

  let classification: EvidenceClassification;
  if (confidence >= 0.75) {
    classification = 'VERIFIED';
  } else if (confidence >= 0.5) {
    classification = 'CANDIDATE';
  } else {
    classification = 'INSUFFICIENT';
  }

  return { confidence, classification };
}
