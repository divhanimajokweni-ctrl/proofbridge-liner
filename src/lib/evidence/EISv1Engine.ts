/**
 * EIS v1.0 Engine — Evidence Independence Scoring
 * ------------------------------------------------
 * Reference: 02c_EVIDENCE_INDEPENDENCE_SPEC_EIS_v1.md
 *
 * Core principle: counting correlated observations as independent evidence
 * inflates confidence. 5 sensors on the same DMA agreeing ≠ 5 independent
 * proofs. EIS classifies each observation and computes a true independence
 * score.
 *
 * Score = (has_primary × 0.3) + (has_correlated × 0.2) + (has_independent × 0.4)
 * If has_primary AND has_pump_context → REJECTED (false positive)
 * If score ≥ 0.8 → VERIFIED_CANDIDATE
 * Else → INSUFFICIENT_EVIDENCE
 *
 * Zero Fabrication Rule: missing data is never guessed. It is flagged UNDEFINED
 * and dropped from the observation count.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type QualityFlag =
  | 'VALID'
  | 'MISSING'          // no data for 17+ minutes
  | 'IMPOSSIBLE_PHYSICS' // e.g. 999m pressure spike, -999 L/s flow
  | 'UNDEFINED';

export type MeasurementType =
  | 'FLOW'
  | 'PRESSURE'
  | 'LEVEL'
  | 'PUMP_STATUS'
  | 'VALVE_STATUS'
  | 'FIELD_VISUAL'
  | 'ACOUSTIC'
  | 'CONTEXT';

/**
 * Evidence classification per EIS v1.0 spec (02c).
 * - PRIMARY: the leading anomaly observation (e.g. flow deviation at DMA inlet)
 * - CORRELATED: same DMA, same time window, same measurement type
 * - INDEPENDENT: different measurement principle / different location
 * - DERIVED: computed from same time series (e.g. MNF minimum from flow)
 * - CONTEXTUAL: rules out operational cause (pump/valve status unchanged)
 */
export type EvidenceClass =
  | 'PRIMARY'
  | 'CORRELATED'
  | 'INDEPENDENT'
  | 'DERIVED'
  | 'CONTEXTUAL'
  | 'REJECTED';

export type EvidenceState =
  | 'VALID'
  | 'MISSING'
  | 'ANOMALOUS'
  | 'CORRELATED'
  | 'INDEPENDENT'
  | 'INSUFFICIENT';

export type Verdict =
  | 'VERIFIED_CANDIDATE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REJECTED_FALSE_POSITIVE';

/**
 * 11-field provenance spine. Every observation carries this. Reference: 01a.
 */
export interface ProvenanceSpine {
  // 1–3: Sensor identity
  sensorId: string;
  firmwareVersion: string;
  calibrationEpoch: string;       // ISO 8601
  // 4–6: Spatiotemporal
  timestampUtc: string;           // ISO 8601, timezone-aware
  location: string;               // e.g. "NMBM-DMA-07/SEG-S-142"
  dmaId: string;
  // 7–9: Environmental + processing
  environmentalContext: {
    temperatureC: number | null;
    rainfallMm: number | null;
    groundCondition: string | null;
  };
  processingPipeline: string;     // e.g. "EISv1/pass1-normalize"
  attestationHash: string;        // SHA-256 hex of canonical observation
  // 10–11: Quality
  qualityFlag: QualityFlag;
  measurementType: MeasurementType;
}

export interface Observation {
  provenance: ProvenanceSpine;
  value: number | null;           // null = MISSING (never guessed)
  unit: string;                   // 'L/s', 'm', 'ON/OFF', etc.
  baseline?: number | null;        // expected value under nominal conditions
}

export interface DMACalibration {
  flowDeviationThresholdPct: number;   // default 10, range 1–50
  pressureDropThresholdPct: number;    // default 5,  range 1–30
  correlationTimeWindowMin: number;    // default 60, range 1–1440
  mnfWindowStart: string;              // '02:00'
  mnfWindowEnd: string;                // '04:00'
  rejectOnPumpContextMatch: boolean;   // EIS rule: PRIMARY + pump_context → REJECTED
}

export const DEFAULT_CALIBRATION: DMACalibration = {
  flowDeviationThresholdPct: 10,
  pressureDropThresholdPct: 5,
  correlationTimeWindowMin: 60,
  mnfWindowStart: '02:00',
  mnfWindowEnd: '04:00',
  rejectOnPumpContextMatch: true,
};

// ─── Quality Gate (Pass 1 + Pass 2) ──────────────────────────────────────

/**
 * Pass 1: Collect & Normalize — reject IMPOSSIBLE_PHYSICS, flag MISSING.
 * Zero Fabrication Rule: null values are preserved as UNDEFINED, never interpolated.
 */
export function classifyQuality(obs: Observation): QualityFlag {
  if (obs.value === null || obs.value === undefined) return 'MISSING';
  const v = obs.value;
  // Physical impossibility bounds per measurement type
  switch (obs.provenance.measurementType) {
    case 'FLOW':
      if (v < 0 || v > 5000) return 'IMPOSSIBLE_PHYSICS';
      break;
    case 'PRESSURE':
      if (v < 0 || v > 500) return 'IMPOSSIBLE_PHYSICS';
      break;
    case 'LEVEL':
      if (v < 0 || v > 1000) return 'IMPOSSIBLE_PHYSICS';
      break;
  }
  return 'VALID';
}

// ─── Anomaly Detection (Pass 3) ───────────────────────────────────────────

export interface AnomalyResult {
  isAnomalous: boolean;
  deviationPct: number;          // signed; +ve = above baseline, -ve = below
  signature: string;             // human-readable signature
  kind: 'FLOW_INCREASE' | 'PRESSURE_DROP' | 'BASELINE_NOMINAL' | 'CONTEXT_NO_CHANGE';
}

/**
 * Pass 3: MNF baseline comparison.
 * Reference 02a HOM anomaly signatures table.
 */
export function detectAnomaly(
  obs: Observation,
  cal: DMACalibration,
): AnomalyResult {
  if (obs.provenance.qualityFlag !== 'VALID' || obs.value === null || obs.baseline === null) {
    return {
      isAnomalous: false,
      deviationPct: 0,
      signature: 'NO_BASELINE',
      kind: 'BASELINE_NOMINAL',
    };
  }
  const baseline = obs.baseline;
  const deviation = obs.value - baseline;
  const deviationPct = baseline !== 0 ? (deviation / baseline) * 100 : 0;

  if (obs.provenance.measurementType === 'FLOW') {
    if (Math.abs(deviationPct) >= cal.flowDeviationThresholdPct && deviation > 0) {
      return {
        isAnomalous: true,
        deviationPct,
        signature: `Flow up ${deviationPct.toFixed(1)}% vs baseline`,
        kind: 'FLOW_INCREASE',
      };
    }
  }
  if (obs.provenance.measurementType === 'PRESSURE') {
    if (Math.abs(deviationPct) >= cal.pressureDropThresholdPct && deviation < 0) {
      return {
        isAnomalous: true,
        deviationPct,
        signature: `Pressure down ${Math.abs(deviationPct).toFixed(1)}% vs baseline`,
        kind: 'PRESSURE_DROP',
      };
    }
  }
  if (obs.provenance.measurementType === 'CONTEXT') {
    return {
      isAnomalous: false,
      deviationPct: 0,
      signature: 'No pump/valve state change in anomaly window',
      kind: 'CONTEXT_NO_CHANGE',
    };
  }
  return {
    isAnomalous: false,
    deviationPct,
    signature: 'Within baseline tolerance',
    kind: 'BASELINE_NOMINAL',
  };
}

// ─── Evidence Correlation (Pass 4 part A) ─────────────────────────────────

export interface CorrelatedObservation {
  observation: Observation;
  anomaly: AnomalyResult;
  evidenceClass: EvidenceClass;
  evidenceState: EvidenceState;
  weight: number;                // contribution to independence score
  rationale: string;
}

/**
 * Classify an observation's independence relative to a primary anomaly.
 * Two observations are CORRELATED if they:
 *   - share the same DMA,
 *   - share the same measurement TYPE,
 *   - fall within the correlationTimeWindowMs of each other.
 * Otherwise they are INDEPENDENT (different principle or location).
 *
 * Note: if THIS observation IS the primary candidate (matched by sensorId +
 * timestamp identity), it is classified as PRIMARY regardless of correlation.
 */
export function classifyIndependence(
  obs: Observation,
  anomaly: AnomalyResult,
  primaryObs: Observation | null,
  cal: DMACalibration,
): { evidenceClass: EvidenceClass; evidenceState: EvidenceState; weight: number; rationale: string } {
  // CONTEXTUAL observations (pump/valve status) rule out operational cause
  if (obs.provenance.measurementType === 'CONTEXT' ||
      obs.provenance.measurementType === 'PUMP_STATUS' ||
      obs.provenance.measurementType === 'VALVE_STATUS') {
    return {
      evidenceClass: 'CONTEXTUAL',
      evidenceState: 'VALID',
      weight: 0,
      rationale: 'Operating context — rules out pump/valve cause',
    };
  }

  // Non-anomalous, non-context observations carry no weight
  if (!anomaly.isAnomalous && obs.provenance.measurementType !== 'FIELD_VISUAL' && obs.provenance.measurementType !== 'ACOUSTIC') {
    return {
      evidenceClass: 'REJECTED',
      evidenceState: 'VALID',
      weight: 0,
      rationale: 'Within baseline — no anomaly',
    };
  }

  // If this observation IS the primary candidate (by identity), it is PRIMARY.
  // This prevents the primary flow anomaly from being classified as
  // CORRELATED with itself.
  if (
    primaryObs !== null &&
    obs.provenance.sensorId === primaryObs.provenance.sensorId &&
    obs.provenance.timestampUtc === primaryObs.provenance.timestampUtc
  ) {
    return {
      evidenceClass: 'PRIMARY',
      evidenceState: 'ANOMALOUS',
      weight: 0.3,
      rationale: 'Leading anomaly — primary evidence (flow deviation at DMA inlet)',
    };
  }

  // FIELD_VISUAL and ACOUSTIC are by definition INDEPENDENT (different principle)
  if (obs.provenance.measurementType === 'FIELD_VISUAL') {
    return {
      evidenceClass: 'INDEPENDENT',
      evidenceState: 'INDEPENDENT',
      weight: 0.5,    // per SEARM1 HTML: FIELD = +0.50
      rationale: 'Field observation — different measurement principle, different location',
    };
  }
  if (obs.provenance.measurementType === 'ACOUSTIC') {
    return {
      evidenceClass: 'INDEPENDENT',
      evidenceState: 'INDEPENDENT',
      weight: 0.4,    // per EIS v1.0 spec
      rationale: 'Acoustic signal — different measurement principle',
    };
  }

  // Otherwise check correlation against the primary
  if (primaryObs !== null) {
    const sameDma = obs.provenance.dmaId === primaryObs.provenance.dmaId;
    // Hydraulic family: FLOW, PRESSURE, LEVEL all react to the same
    // hydraulic event in a DMA. Per 04a brief: "pressure — same DMA as flow"
    // is classified as CORRELATED. Per 02c bad example: multiple pressure
    // sensors on the same DMA collapse to a single correlated event.
    const HYDRAULIC = new Set(['FLOW', 'PRESSURE', 'LEVEL']);
    const sameFamily =
      HYDRAULIC.has(obs.provenance.measurementType) &&
      HYDRAULIC.has(primaryObs.provenance.measurementType);
    const t1 = Date.parse(obs.provenance.timestampUtc);
    const t2 = Date.parse(primaryObs.provenance.timestampUtc);
    const withinWindow =
      !Number.isNaN(t1) &&
      !Number.isNaN(t2) &&
      Math.abs(t1 - t2) <= cal.correlationTimeWindowMin * 60 * 1000;

    if (sameDma && sameFamily && withinWindow) {
      return {
        evidenceClass: 'CORRELATED',
        evidenceState: 'CORRELATED',
        weight: 0.2,
        rationale: `Same DMA (${obs.provenance.dmaId}), same hydraulic family, within ${cal.correlationTimeWindowMin}min window`,
      };
    }
    if (sameDma && !sameFamily) {
      return {
        evidenceClass: 'INDEPENDENT',
        evidenceState: 'INDEPENDENT',
        weight: 0.4,
        rationale: 'Same DMA but different measurement principle',
      };
    }
  }

  return {
    evidenceClass: 'REJECTED',
    evidenceState: 'VALID',
    weight: 0,
    rationale: 'No correlation path',
  };
}

// ─── Independence Score (Pass 4 part B) ──────────────────────────────────

export interface EISVerdict {
  score: number;                  // 0.0 – 1.0
  hasPrimary: boolean;
  hasCorrelated: boolean;
  hasIndependent: boolean;
  hasContextual: boolean;
  hasPumpContext: boolean;        // true if a pump status change overlaps anomaly
  verdict: Verdict;
  threshold: number;              // 0.8 per spec
  observations: CorrelatedObservation[];
  primaryObservationId: string | null;
  rejectedReason: string | null;
}

/**
 * Compute the EIS v1.0 verdict from a set of observations.
 *
 * Rules (02c):
 *   Score = (has_primary × 0.3) + (has_correlated × 0.2) + (has_independent × 0.4)
 *   If has_primary AND has_pump_context → REJECTED (false positive)
 *   If score ≥ 0.8 → VERIFIED_CANDIDATE
 *   Else → INSUFFICIENT_EVIDENCE
 */
export function computeEIS(
  observations: Observation[],
  cal: DMACalibration = DEFAULT_CALIBRATION,
): EISVerdict {
  // Pass 1 + 2: classify quality (zero fabrication — MISSING/IMPOSSIBLE dropped from evidence, but recorded)
  const qualityClassified = observations.map((o) => {
    const q = classifyQuality(o);
    return { obs: { ...o, provenance: { ...o.provenance, qualityFlag: q } }, q };
  });

  // Only VALID observations participate in evidence scoring.
  // MISSING and IMPOSSIBLE_PHYSICS are preserved in audit trail but contribute weight 0.
  const validObs = qualityClassified.filter((x) => x.q === 'VALID').map((x) => x.obs);

  // Pass 3: anomaly detection — find PRIMARY candidate (first flow increase wins)
  let primaryObs: Observation | null = null;
  for (const o of validObs) {
    const a = detectAnomaly(o, cal);
    if (a.kind === 'FLOW_INCREASE') {
      primaryObs = o;
      break;
    }
  }

  // Pass 4: classify independence for each observation
  const correlated: CorrelatedObservation[] = validObs.map((o) => {
    const anomaly = detectAnomaly(o, cal);
    const cls = classifyIndependence(o, anomaly, primaryObs, cal);
    return { observation: o, anomaly, ...cls };
  });

  const hasPrimary = correlated.some((c) => c.evidenceClass === 'PRIMARY');
  const hasCorrelated = correlated.some((c) => c.evidenceClass === 'CORRELATED');
  const hasIndependent = correlated.some((c) => c.evidenceClass === 'INDEPENDENT');
  const hasContextual = correlated.some((c) => c.evidenceClass === 'CONTEXTUAL');

  // Pump context rule: if a PUMP_STATUS observation shows a state change
  // during the anomaly window, the flow anomaly is likely operational, not a leak.
  const hasPumpContext = correlated.some(
    (c) =>
      c.observation.provenance.measurementType === 'PUMP_STATUS' &&
      c.observation.value !== null &&
      c.observation.value > 0 && // a state change recorded
      c.observation.provenance.qualityFlag === 'VALID',
  );

  // Score composition per EIS v1.0 formula
  const primaryWeight = hasPrimary ? 0.3 : 0;
  const correlatedWeight = hasCorrelated ? 0.2 : 0;
  const independentWeight = correlated
    .filter((c) => c.evidenceClass === 'INDEPENDENT')
    .reduce((sum, c) => sum + c.weight, 0);
  // Cap independent weight at 0.5 (field + acoustic max)
  const independentCapped = Math.min(independentWeight, 0.5);
  const score = primaryWeight + correlatedWeight + independentCapped;

  // Verdict logic
  let verdict: Verdict;
  let rejectedReason: string | null = null;
  if (hasPrimary && hasPumpContext && cal.rejectOnPumpContextMatch) {
    verdict = 'REJECTED_FALSE_POSITIVE';
    rejectedReason = 'Pump status change during anomaly window — likely operational cause, not a leak';
  } else if (score >= 0.8) {
    verdict = 'VERIFIED_CANDIDATE';
  } else {
    verdict = 'INSUFFICIENT_EVIDENCE';
    rejectedReason = `Score ${score.toFixed(2)} below threshold 0.80`;
  }

  return {
    score: Math.round(score * 100) / 100,
    hasPrimary,
    hasCorrelated,
    hasIndependent,
    hasContextual,
    hasPumpContext,
    verdict,
    threshold: 0.8,
    observations: correlated,
    primaryObservationId: primaryObs?.provenance.sensorId ?? null,
    rejectedReason,
  };
}

// ─── 5-Pass Pipeline (orchestration labels) ──────────────────────────────

export interface PipelinePass {
  id: number;
  name: string;
  description: string;
  status: 'pass' | 'process' | 'fail' | 'pending';
}

export function buildPipeline(verdict: EISVerdict, hasAnyInput: boolean): PipelinePass[] {
  return [
    {
      id: 1,
      name: 'Collect & Normalize',
      description: 'Import observations, normalize UTC timestamps, classify quality flags',
      status: hasAnyInput ? 'pass' : 'pending',
    },
    {
      id: 2,
      name: 'Physical Boundary Checks',
      description: 'Reject IMPOSSIBLE_PHYSICS, preserve MISSING as UNDEFINED (Zero Fabrication)',
      status: hasAnyInput ? 'pass' : 'pending',
    },
    {
      id: 3,
      name: 'MNF Baseline (Median)',
      description: 'Compute minimum night flow baseline per DMA (02:00–04:00)',
      status: hasAnyInput ? 'pass' : 'pending',
    },
    {
      id: 4,
      name: 'EIS v1.0 Independence',
      description: 'Classify observations as PRIMARY / CORRELATED / INDEPENDENT',
      status: verdict.verdict === 'VERIFIED_CANDIDATE' ||
        verdict.verdict === 'INSUFFICIENT_EVIDENCE' ||
        verdict.verdict === 'REJECTED_FALSE_POSITIVE'
        ? (verdict.verdict === 'REJECTED_FALSE_POSITIVE' ? 'fail' : 'process')
        : 'pending',
    },
    {
      id: 5,
      name: 'Evidence Log Export',
      description: 'Serialize audit receipt with SHA-256 hash + 11-field provenance',
      status: verdict.verdict === 'VERIFIED_CANDIDATE' ? 'pass' : 'pending',
    },
  ];
}
