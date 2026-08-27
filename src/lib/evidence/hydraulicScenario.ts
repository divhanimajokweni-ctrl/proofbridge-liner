/**
 * Hydraulic Scenario — DMA-7 Simulation
 * -------------------------------------
 * Reference: 04a_WATER_INFRASTRUCTURE_EVIDENCE_LEAKAGE_VALIDATION_BRIEF.md
 *            08-NMBM-DATA-SANDBOX-SPECIFICATION.md
 *
 * All data labelled: SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.
 *
 * Defines:
 *   1. The night-flow baseline (00:00–03:00 UTC, stable).
 *   2. The anomaly onset (04:00–06:00 UTC, flow ↑ + pressure ↓).
 *   3. Quality edge cases (IMPOSSIBLE_PHYSICS at 07:00, MISSING at 08:00).
 *   4. Corroborating evidence (field visual + acoustic at segment S-142).
 *   5. Operating context (pump/valve status unchanged — rules out operational cause).
 *   6. The 10-step incident replay sequence (per 04a brief).
 */

import type { Observation } from './EISv1Engine';

// ─── DMA identity ────────────────────────────────────────────────────────

export const DMA_ID = 'NMBM-DMA-07';
export const SEGMENT_ID = 'NMBM-SEG-S-142';
export const SCENARIO_DATE = '2026-08-26';

// ─── SCADA telemetry table (replicates SEARM1 mock + Zero Fabrication cases) ──

export interface ScadaRow {
  timeUtc: string;          // 'HH:MM'
  flow: number | null;      // L/s
  pressure: number;         // m
  status: 'VALID' | 'ANOMALY' | 'IMPOSSIBLE' | 'MISSING';
}

export const SCADA_TABLE: ScadaRow[] = [
  { timeUtc: '00:00', flow: 102.0, pressure: 48.2, status: 'VALID' },
  { timeUtc: '01:00', flow: 98.0,  pressure: 48.5, status: 'VALID' },
  { timeUtc: '02:00', flow: 97.0,  pressure: 48.4, status: 'VALID' },
  { timeUtc: '03:00', flow: 96.0,  pressure: 48.6, status: 'VALID' },
  { timeUtc: '04:00', flow: 111.0, pressure: 46.1, status: 'ANOMALY' },
  { timeUtc: '05:00', flow: 114.0, pressure: 45.7, status: 'ANOMALY' },
  { timeUtc: '06:00', flow: 116.0, pressure: 45.4, status: 'ANOMALY' },
  { timeUtc: '07:00', flow: -999.0, pressure: 45.2, status: 'IMPOSSIBLE' },
  { timeUtc: '08:00', flow: null,  pressure: 45.1, status: 'MISSING' },
];

// MNF baseline = median of night-flow window (02:00–04:00)
// = median(97, 96, 102, 98) = 97.5 — we round to 97.0 to match the spec brief.
export const MNF_BASELINE_FLOW = 97.0;
// Pressure baseline = the 03:00 nominal reading (48.6 m) — gives a 5.14% drop
// at 04:00 (46.1 m), which exceeds the default 5% pressureDropThreshold.
export const MNF_BASELINE_PRESSURE = 48.6;

// ─── Observation set ─────────────────────────────────────────────────────

/**
 * Build the full observation set used by EIS at the "fully loaded" replay state
 * (step 6 onwards in the 10-step replay). Each observation carries the full
 * 11-field provenance spine.
 *
 * Note: attestationHash is a short synthetic fingerprint per observation.
 * In production these would be SHA-256 of the raw sensor reading.
 */
export function buildObservationSet(opts?: {
  includeField?: boolean;
  includeAcoustic?: boolean;
  includeContext?: boolean;
  includeAnomaly?: boolean;  // when false (step 1 BASELINE), no flow/pressure anomaly
  pumpStateChanged?: boolean; // toggles the pump_status observation to "change detected"
}): Observation[] {
  const includeField = opts?.includeField ?? true;
  const includeAcoustic = opts?.includeAcoustic ?? true;
  const includeContext = opts?.includeContext ?? true;
  const includeAnomaly = opts?.includeAnomaly ?? true;
  const pumpStateChanged = opts?.pumpStateChanged ?? false;

  const flowSensorId = 'FLOW-DMA07-INLET';
  const pressureSensorId = 'PRESS-DMA07-P14';
  const fieldObsId = 'OBS-FLD-20260826-001';
  const acousticObsId = 'OBS-ACO-20260826-002';
  const contextObsId = 'CTX-DMA07-PUMPVALVE';

  const ts = (h: string) => `${SCENARIO_DATE}T${h}:00Z`;

  const obs: Observation[] = [];

  if (includeAnomaly) {
    // PRIMARY — flow anomaly at DMA inlet at 04:00
    obs.push({
      provenance: {
        sensorId: flowSensorId,
        firmwareVersion: 'flowfw-2.4.1',
        calibrationEpoch: '2026-07-01T00:00:00Z',
        timestampUtc: ts('04:00'),
        location: `${DMA_ID}/INLET`,
        dmaId: DMA_ID,
        environmentalContext: { temperatureC: 12.4, rainfallMm: 0, groundCondition: 'dry' },
        processingPipeline: 'EISv1/pass1-normalize',
        attestationHash: '0x7e8a9f02b',
        qualityFlag: 'VALID',
        measurementType: 'FLOW',
      },
      value: 111.0,
      unit: 'L/s',
      baseline: MNF_BASELINE_FLOW,
    });
    // CORRELATED — pressure drop on same DMA, 5 minutes later (within 60min window)
    obs.push({
      provenance: {
        sensorId: pressureSensorId,
        firmwareVersion: 'pressfw-3.1.0',
        calibrationEpoch: '2026-07-01T00:00:00Z',
        timestampUtc: ts('04:05'),
        location: `${DMA_ID}/P14`,
        dmaId: DMA_ID,
        environmentalContext: { temperatureC: 12.4, rainfallMm: 0, groundCondition: 'dry' },
        processingPipeline: 'EISv1/pass1-normalize',
        attestationHash: '0x3c9f22e8d',
        qualityFlag: 'VALID',
        measurementType: 'PRESSURE',
      },
      value: 46.1,
      unit: 'm',
      baseline: MNF_BASELINE_PRESSURE,
    });
  }

  if (includeField) {
    obs.push({
      provenance: {
        sensorId: fieldObsId,
        firmwareVersion: 'field-report-v1',
        calibrationEpoch: '2026-08-26T00:00:00Z',
        timestampUtc: ts('06:30'),
        location: `${DMA_ID}/${SEGMENT_ID}`,
        dmaId: DMA_ID,
        environmentalContext: { temperatureC: 14.1, rainfallMm: 0, groundCondition: 'moist' },
        processingPipeline: 'EISv1/pass1-normalize',
        attestationHash: '0x9b41c0e77',
        qualityFlag: 'VALID',
        measurementType: 'FIELD_VISUAL',
      },
      value: 1, // 1 = ground moisture reported
      unit: 'presence',
      baseline: 0,
    });
  }

  if (includeAcoustic) {
    obs.push({
      provenance: {
        sensorId: acousticObsId,
        firmwareVersion: 'acofw-1.8.2',
        calibrationEpoch: '2026-08-01T00:00:00Z',
        timestampUtc: ts('08:00'),
        location: `${DMA_ID}/${SEGMENT_ID}`,
        dmaId: DMA_ID,
        environmentalContext: { temperatureC: 15.0, rainfallMm: 0, groundCondition: 'moist' },
        processingPipeline: 'EISv1/pass1-normalize',
        attestationHash: '0xa2d7e5f01',
        qualityFlag: 'VALID',
        measurementType: 'ACOUSTIC',
      },
      value: 1, // 1 = anomalous acoustic signal detected
      unit: 'presence',
      baseline: 0,
    });
  }

  if (includeContext) {
    obs.push({
      provenance: {
        sensorId: contextObsId,
        firmwareVersion: 'scada-ctx-v2',
        calibrationEpoch: '2026-08-26T00:00:00Z',
        timestampUtc: ts('04:00'),
        location: `${DMA_ID}/SCADA-CTX`,
        dmaId: DMA_ID,
        environmentalContext: { temperatureC: 12.4, rainfallMm: 0, groundCondition: 'dry' },
        processingPipeline: 'EISv1/pass1-normalize',
        attestationHash: '0x5f8e1a9bc',
        qualityFlag: 'VALID',
        // When pumpStateChanged=true the observation semantically represents
        // a pump status change, which fires the EIS false-positive rule:
        // PRIMARY + pump_context → REJECTED_FALSE_POSITIVE.
        measurementType: pumpStateChanged ? 'PUMP_STATUS' : 'CONTEXT',
      },
      value: pumpStateChanged ? 1 : 0, // 0 = no pump/valve state change (rules out operational cause)
      unit: 'state-change',
      baseline: 0,
    });
  }

  return obs;
}

// ─── 10-Step Incident Replay (per 04a brief) ──────────────────────────────

export interface ReplayStep {
  id: number;
  key: string;
  title: string;
  description: string;
  /** Whether the flow/pressure anomaly is present at this step */
  includeAnomaly: boolean;
  /** Which observations are visible at this step */
  includeField: boolean;
  includeAcoustic: boolean;
  includeContext: boolean;
  pumpStateChanged: boolean;
  /** Human annotation shown in the timeline */
  annotation: string;
}

export const REPLAY_STEPS: ReplayStep[] = [
  {
    id: 1,
    key: 'BASELINE',
    title: '1. Baseline — Stable Profile',
    description: 'DMA-7 night-flow baseline established (00:00–03:00 UTC). Flow ~97 L/s, pressure ~48.5 m.',
    includeAnomaly: false,
    includeField: false,
    includeAcoustic: false,
    includeContext: false,
    pumpStateChanged: false,
    annotation: 'NOMINAL — within MNF tolerance',
  },
  {
    id: 2,
    key: 'ANOMALY',
    title: '2. Introduce Anomaly',
    description: 'At 04:00 UTC, flow rises to 111 L/s while pressure drops to 46.1 m. Flow-up + pressure-down signature = potential loss.',
    includeAnomaly: true,
    includeField: false,
    includeAcoustic: false,
    includeContext: false,
    pumpStateChanged: false,
    annotation: 'FLOW_INCREASE + PRESSURE_DROP detected',
  },
  {
    id: 3,
    key: 'FIELD',
    title: '3. Add Field Evidence',
    description: 'Field technician reports persistent ground moisture at segment NMBM-SEG-S-142 (06:30 UTC).',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: false,
    includeContext: false,
    pumpStateChanged: false,
    annotation: 'Independent evidence source #1 added',
  },
  {
    id: 4,
    key: 'ACOUSTIC',
    title: '4. Add Acoustic Evidence',
    description: 'Acoustic logger detects anomalous signal at segment NMBM-SEG-S-142 (08:00 UTC).',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: false,
    pumpStateChanged: false,
    annotation: 'Independent evidence source #2 added',
  },
  {
    id: 5,
    key: 'CONTEXT',
    title: '5. Check Operational Context',
    description: 'No pump/valve status changes in DMA-7 during the anomaly window. Operational cause ruled out.',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: 'CONTEXTUAL — rules out operational cause',
  },
  {
    id: 6,
    key: 'CORRELATE',
    title: '6. Correlate Evidence',
    description: 'Evidence correlation: 1 flow anomaly + 1 pressure anomaly + 1 field observation + 1 acoustic signal.',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: '5 observations linked across sensors + time',
  },
  {
    id: 7,
    key: 'INDEPENDENCE',
    title: '7. Assess Independence (EIS v1.0)',
    description: 'EIS classifies: 1 PRIMARY (flow) + 1 CORRELATED (pressure, same DMA) + 2 INDEPENDENT (field + acoustic). Score = 0.3 + 0.2 + 0.5 = 1.0.',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: 'Score 1.00 — VERIFIED_CANDIDATE',
  },
  {
    id: 8,
    key: 'CLAIM',
    title: '8. Generate Claim',
    description: 'Claim: "Potential underground leakage event — Zone S-142, DMA-7."',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: 'Candidate leak zone narrowed',
  },
  {
    id: 9,
    key: 'VERIFY',
    title: '9. Field Verification',
    description: 'Simulated field confirmation: technician dispatched, leak confirmed at pipe joint in segment S-142.',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: 'Leak CONFIRMED in field',
  },
  {
    id: 10,
    key: 'AUDIT',
    title: '10. Audit Trail',
    description: 'Complete provenance chain serialized to audit receipt (SHA-256 hash + 11-field provenance per observation).',
    includeAnomaly: true,
    includeField: true,
    includeAcoustic: true,
    includeContext: true,
    pumpStateChanged: false,
    annotation: 'Audit receipt exported',
  },
];

// ─── False-positive demo toggle ──────────────────────────────────────────

/**
 * Demo variant: toggles a pump status change in the context observation.
 * EIS rule: PRIMARY + pump_context → REJECTED_FALSE_POSITIVE.
 * Used by the "Simulate pump event" switch in the UI to demonstrate the
 * false-positive rejection rule from 02c.
 */
export const FALSE_POSITIVE_STEP: ReplayStep = {
  ...REPLAY_STEPS[6],
  pumpStateChanged: true,
  annotation: 'Pump state change detected — REJECTED_FALSE_POSITIVE',
};
