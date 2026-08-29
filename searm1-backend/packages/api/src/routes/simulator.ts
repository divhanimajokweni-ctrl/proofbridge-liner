// ─────────────────────────────────────────────────────────────
// /api/simulator — leak / burst trigger endpoints
// ─────────────────────────────────────────────────────────────
// POST /leak runs the full VVU-IVE pipeline:
//   baseline → observation → evidence vector → EIS → persist event
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { queryOne, run } from '../db';
import {
  computeEvidenceVector,
  calculateEIS,
  type Observation,
  type EvidenceEvent,
} from '@searm1/engine';

const router = Router();

// Baseline lookup (mirrors packages/simulator/src/sensor-generator.ts + seed.ts).
// Used when no telemetry row exists yet — keeps the simulator self-sufficient.
const FALLBACK_BASELINE: Record<string, { pressure: number; flow: number }> = {
  PIP1: { pressure: 5.2, flow: 72 },
  PIP2: { pressure: 5.0, flow: 68 },
  PIP3: { pressure: 4.8, flow: 91 },
  PIP4: { pressure: 4.5, flow: 55 },
  PIP5: { pressure: 4.2, flow: 44 },
  PIP6: { pressure: 3.9, flow: 37 },
  PIP7: { pressure: 4.1, flow: 61 },
  PIP8: { pressure: 5.5, flow: 78 },
  PIP9: { pressure: 4.6, flow: 64 },
  PIP10: { pressure: 3.7, flow: 42 },
};

// POST /leak — trigger a leak on a pipe
// Body (all optional): { assetId?: string (default PIP3), pressureFactor?: number (default 0.7), flowFactor?: number (default 1.2) }
router.post('/leak', (req: Request, res: Response) => {
  const assetId = (req.body?.assetId as string) || 'PIP3';
  const pressureFactor = typeof req.body?.pressureFactor === 'number' ? req.body.pressureFactor : 0.7;
  const flowFactor = typeof req.body?.flowFactor === 'number' ? req.body.flowFactor : 1.2;

  // 1) Resolve baseline — prefer the latest persisted telemetry row.
  let baselinePressure: number;
  let baselineFlow: number;
  let sensorId: string;

  const lastRow = queryOne<{ pressure: number; flow: number; sensor_id: string }>(
    `SELECT pressure, flow, sensor_id FROM telemetry
     WHERE asset_id = ?
     ORDER BY time DESC, id DESC
     LIMIT 1`,
    assetId,
  );

  if (lastRow) {
    baselinePressure = lastRow.pressure;
    baselineFlow = lastRow.flow;
    sensorId = lastRow.sensor_id;
  } else if (FALLBACK_BASELINE[assetId]) {
    baselinePressure = FALLBACK_BASELINE[assetId].pressure;
    baselineFlow = FALLBACK_BASELINE[assetId].flow;
    sensorId = `SENS_${assetId}`;
  } else {
    res.status(404).json({ error: 'unknown asset — no baseline available', assetId });
    return;
  }

  const baseline: Observation = {
    sensorId,
    assetId,
    pressure: baselinePressure,
    flow: baselineFlow,
    timestamp: new Date(),
  };

  // 2) Generate leak observation.
  const leakPressure = Math.max(0, baselinePressure * pressureFactor);
  const leakFlow = baselineFlow * flowFactor;
  const leakObs: Observation = {
    sensorId,
    assetId,
    pressure: leakPressure,
    flow: leakFlow,
    timestamp: new Date(),
  };

  // 3) Persist telemetry row.
  const telemetryTime = leakObs.timestamp.toISOString();
  run(
    `INSERT INTO telemetry (time, sensor_id, asset_id, pressure, flow)
     VALUES (?, ?, ?, ?, ?)`,
    telemetryTime,
    sensorId,
    assetId,
    leakPressure,
    leakFlow,
  );

  // 4) Compute evidence vector using engine.
  const evidence = computeEvidenceVector(leakObs, baseline);

  // 5) Calculate EIS using engine.
  const eis = calculateEIS(evidence);

  // 6) Persist evidence_event row.
  const eventId = `EVT-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  run(
    `INSERT INTO evidence_events
       (id, asset_id, event_type, confidence, classification, evidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    eventId,
    assetId,
    'leak',
    eis.confidence,
    eis.classification,
    JSON.stringify(evidence),
    createdAt,
  );

  // 7) Return the event payload.
  const event: EvidenceEvent = {
    assetId,
    eventType: 'leak',
    confidence: eis.confidence,
    classification: eis.classification,
    evidence,
    timestamp: new Date(createdAt),
  };

  res.status(201).json({
    event,
    id: eventId,
    baseline: {
      pressure: baselinePressure,
      flow: baselineFlow,
      sensorId,
    },
    observation: {
      pressure: leakPressure,
      flow: leakFlow,
      pressureFactor,
      flowFactor,
    },
    evidence,
    eis,
    createdAt,
  });
});

// POST /burst — convenience endpoint with more aggressive factors.
router.post('/burst', (req: Request, res: Response) => {
  // Reuse /leak logic with burst-tier factors.
  req.body = {
    ...(req.body ?? {}),
    pressureFactor: req.body?.pressureFactor ?? 0.4,
    flowFactor: req.body?.flowFactor ?? 1.6,
    eventType: 'burst',
  };
  // Fall through to /leak handler by re-invoking. For simplicity we
  // just inline a second leak trigger here.
  // (Express doesn't let us "forward" easily; this keeps the code DRY.)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  leakHandler(req, res);
});

function leakHandler(req: Request, res: Response): void {
  const assetId = (req.body?.assetId as string) || 'PIP3';
  const pressureFactor = typeof req.body?.pressureFactor === 'number' ? req.body.pressureFactor : 0.7;
  const flowFactor = typeof req.body?.flowFactor === 'number' ? req.body.flowFactor : 1.2;

  let baselinePressure: number;
  let baselineFlow: number;
  let sensorId: string;

  const lastRow = queryOne<{ pressure: number; flow: number; sensor_id: string }>(
    `SELECT pressure, flow, sensor_id FROM telemetry
     WHERE asset_id = ?
     ORDER BY time DESC, id DESC
     LIMIT 1`,
    assetId,
  );

  if (lastRow) {
    baselinePressure = lastRow.pressure;
    baselineFlow = lastRow.flow;
    sensorId = lastRow.sensor_id;
  } else if (FALLBACK_BASELINE[assetId]) {
    baselinePressure = FALLBACK_BASELINE[assetId].pressure;
    baselineFlow = FALLBACK_BASELINE[assetId].flow;
    sensorId = `SENS_${assetId}`;
  } else {
    res.status(404).json({ error: 'unknown asset — no baseline available', assetId });
    return;
  }

  const baseline: Observation = {
    sensorId,
    assetId,
    pressure: baselinePressure,
    flow: baselineFlow,
    timestamp: new Date(),
  };

  const leakPressure = Math.max(0, baselinePressure * pressureFactor);
  const leakFlow = baselineFlow * flowFactor;
  const leakObs: Observation = {
    sensorId,
    assetId,
    pressure: leakPressure,
    flow: leakFlow,
    timestamp: new Date(),
  };

  const telemetryTime = leakObs.timestamp.toISOString();
  run(
    `INSERT INTO telemetry (time, sensor_id, asset_id, pressure, flow)
     VALUES (?, ?, ?, ?, ?)`,
    telemetryTime,
    sensorId,
    assetId,
    leakPressure,
    leakFlow,
  );

  const evidence = computeEvidenceVector(leakObs, baseline);
  const eis = calculateEIS(evidence);

  const eventType = (req.body?.eventType as string) || 'leak';
  const eventId = `EVT-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  run(
    `INSERT INTO evidence_events
       (id, asset_id, event_type, confidence, classification, evidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    eventId,
    assetId,
    eventType,
    eis.confidence,
    eis.classification,
    JSON.stringify(evidence),
    createdAt,
  );

  const event: EvidenceEvent = {
    assetId,
    eventType,
    confidence: eis.confidence,
    classification: eis.classification,
    evidence,
    timestamp: new Date(createdAt),
  };

  res.status(201).json({
    event,
    id: eventId,
    baseline: { pressure: baselinePressure, flow: baselineFlow, sensorId },
    observation: { pressure: leakPressure, flow: leakFlow, pressureFactor, flowFactor },
    evidence,
    eis,
    createdAt,
  });
}

export default router;
