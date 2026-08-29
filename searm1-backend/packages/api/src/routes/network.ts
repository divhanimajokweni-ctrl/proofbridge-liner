// ─────────────────────────────────────────────────────────────
// /api/network — assets + telemetry endpoints
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { db, query, queryOne, run } from '../db';

const router = Router();

// GET /assets — return all assets (pipes, nodes, sensors)
router.get('/assets', (_req: Request, res: Response) => {
  const rows = query<{
    id: string;
    type: string;
    geometry: string;
    metadata: string;
  }>('SELECT id, type, geometry, metadata FROM assets ORDER BY id');

  const parsed = rows.map((r) => ({
    id: r.id,
    type: r.type,
    geometry: r.geometry ? JSON.parse(r.geometry) : null,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
  }));

  res.json({ assets: parsed, count: parsed.length });
});

// GET /assets/:id — return single asset
router.get('/assets/:id', (req: Request, res: Response) => {
  const row = queryOne<{ id: string; type: string; geometry: string; metadata: string }>(
    'SELECT id, type, geometry, metadata FROM assets WHERE id = ?',
    req.params.id,
  );
  if (!row) {
    res.status(404).json({ error: 'asset not found', id: req.params.id });
    return;
  }
  res.json({
    id: row.id,
    type: row.type,
    geometry: row.geometry ? JSON.parse(row.geometry) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  });
});

// GET /telemetry/:assetId/latest — return latest telemetry row for asset
router.get('/telemetry/:assetId/latest', (req: Request, res: Response) => {
  const row = queryOne<{
    id: number;
    time: string;
    sensor_id: string;
    asset_id: string;
    pressure: number;
    flow: number;
  }>(
    `SELECT id, time, sensor_id, asset_id, pressure, flow
     FROM telemetry
     WHERE asset_id = ?
     ORDER BY time DESC, id DESC
     LIMIT 1`,
    req.params.assetId,
  );
  if (!row) {
    res.status(404).json({ error: 'no telemetry for asset', assetId: req.params.assetId });
    return;
  }
  res.json({
    ...row,
    time: new Date(row.time).toISOString(),
  });
});

// POST /telemetry — insert a new telemetry row
// Body: { sensorId, assetId, pressure, flow, time? }
router.post('/telemetry', (req: Request, res: Response) => {
  const { sensorId, assetId, pressure, flow, time } = req.body ?? {};
  if (!sensorId || !assetId || typeof pressure !== 'number' || typeof flow !== 'number') {
    res.status(400).json({
      error: 'missing required fields',
      required: ['sensorId', 'assetId', 'pressure', 'flow'],
      received: req.body,
    });
    return;
  }
  const isoTime = time ? new Date(time).toISOString() : new Date().toISOString();
  const result = run(
    `INSERT INTO telemetry (time, sensor_id, asset_id, pressure, flow)
     VALUES (?, ?, ?, ?, ?)`,
    isoTime,
    sensorId,
    assetId,
    pressure,
    flow,
  );
  res.status(201).json({
    id: result.lastInsertRowid,
    sensorId,
    assetId,
    pressure,
    flow,
    time: isoTime,
  });
});

export default router;
