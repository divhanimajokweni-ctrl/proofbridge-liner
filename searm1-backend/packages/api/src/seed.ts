// ─────────────────────────────────────────────────────────────
// @searm1/api — Database seed
// ─────────────────────────────────────────────────────────────
// Loads the Ward 42 DMA network: 10 pipes (PIP1–PIP10) + 8 nodes
// (N1–N8) + baseline telemetry. Idempotent — safe to re-run.
//
// Run: `bun --filter=@searm1/api seed`  (or  `bun src/seed.ts`)
// ─────────────────────────────────────────────────────────────

import { db, run, queryOne } from './db';

// ─────────────────────────────────────────────────────────────
// Baselines (mirror packages/simulator/src/sensor-generator.ts)
// Pressure in bar, flow in L/min — MNF (Minimum Night Flow)
// reference values per asset, calibrated against the NMBM Ward 42
// hydraulic model.
// ─────────────────────────────────────────────────────────────
export const BASELINE: Record<string, { pressure: number; flow: number }> = {
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

// ─────────────────────────────────────────────────────────────
// Pipe geometry — approx Ward 42 DMA grid (meters, EPSG:4326-ish).
// Coordinates are illustrative for the sandbox; production deploys
// real NMBM GIS coordinates from the 04b NMBM sandbox spec.
// ─────────────────────────────────────────────────────────────
const PIPE_DEFS: Array<{
  id: string;
  diameter: number;
  length: number;
  material: string;
  from: string;
  to: string;
}> = [
  { id: 'PIP1', diameter: 300, length: 412, material: 'uPVC', from: 'N1', to: 'N2' },
  { id: 'PIP2', diameter: 250, length: 318, material: 'uPVC', from: 'N2', to: 'N3' },
  { id: 'PIP3', diameter: 200, length: 274, material: 'AC',   from: 'N3', to: 'N4' },
  { id: 'PIP4', diameter: 150, length: 198, material: 'AC',   from: 'N4', to: 'N5' },
  { id: 'PIP5', diameter: 150, length: 221, material: 'HDPE', from: 'N5', to: 'N6' },
  { id: 'PIP6', diameter: 100, length: 156, material: 'HDPE', from: 'N6', to: 'N7' },
  { id: 'PIP7', diameter: 200, length: 243, material: 'uPVC', from: 'N2', to: 'N7' },
  { id: 'PIP8', diameter: 250, length: 305, material: 'uPVC', from: 'N1', to: 'N8' },
  { id: 'PIP9', diameter: 150, length: 187, material: 'AC',   from: 'N8', to: 'N5' },
  { id: 'PIP10', diameter: 100, length: 142, material: 'HDPE', from: 'N7', to: 'N8' },
];

// Node geometry — intersections / demand points on the same grid.
const NODE_DEFS: Array<{ id: string; x: number; y: number; role: string }> = [
  { id: 'N1', x: 0,    y: 0,    role: 'reservoir_inlet' },
  { id: 'N2', x: 412,  y: 0,    role: 'junction' },
  { id: 'N3', x: 730,  y: 0,    role: 'junction' },
  { id: 'N4', x: 1004, y: 0,    role: 'junction' },
  { id: 'N5', x: 1202, y: 0,    role: 'junction' },
  { id: 'N6', x: 1423, y: 0,    role: 'dma_outlet' },
  { id: 'N7', x: 655,  y: 243,  role: 'junction' },
  { id: 'N8', x: 305,  y: 305,  role: 'junction' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function upsertAsset(
  id: string,
  type: 'pipe' | 'node',
  geometry: object,
  metadata: object,
): void {
  run(
    `INSERT INTO assets (id, type, geometry, metadata)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       type      = excluded.type,
       geometry  = excluded.geometry,
       metadata  = excluded.metadata`,
    id,
    type,
    JSON.stringify(geometry),
    JSON.stringify(metadata),
  );
}

function insertTelemetry(
  sensorId: string,
  assetId: string,
  pressure: number,
  flow: number,
  isoTime: string,
): void {
  run(
    `INSERT INTO telemetry (time, sensor_id, asset_id, pressure, flow)
     VALUES (?, ?, ?, ?, ?)`,
    isoTime,
    sensorId,
    assetId,
    pressure,
    flow,
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
function seed(): void {
  console.log('[seed] Initializing SEARM1 database...');

  // 1) Pipes
  for (const p of PIPE_DEFS) {
    const baseline = BASELINE[p.id];
    upsertAsset(p.id, 'pipe', { type: 'LineString', from: p.from, to: p.to }, {
      diameter: p.diameter,
      length: p.length,
      material: p.material,
      baselinePressure: baseline.pressure,
      baselineFlow: baseline.flow,
    });
  }
  console.log(`[seed] ✓ inserted ${PIPE_DEFS.length} pipes (PIP1–PIP10)`);

  // 2) Nodes
  for (const n of NODE_DEFS) {
    upsertAsset(n.id, 'node', { type: 'Point', x: n.x, y: n.y }, { role: n.role });
  }
  console.log(`[seed] ✓ inserted ${NODE_DEFS.length} nodes (N1–N8)`);

  // 3) Baseline telemetry — one row per pipe, back-dated 5 min.
  const now = Date.now();
  const t = new Date(now - 5 * 60 * 1000);
  for (const p of PIPE_DEFS) {
    const baseline = BASELINE[p.id];
    insertTelemetry(`SENS_${p.id}`, p.id, baseline.pressure, baseline.flow, t.toISOString());
  }
  console.log(`[seed] ✓ inserted ${PIPE_DEFS.length} baseline telemetry rows`);

  // Sanity check counts.
  const assetCount = queryOne<{ c: number }>('SELECT COUNT(*) AS c FROM assets')?.c ?? 0;
  const teleCount = queryOne<{ c: number }>('SELECT COUNT(*) AS c FROM telemetry')?.c ?? 0;
  console.log(`[seed] DB ready — assets=${assetCount}, telemetry=${teleCount}`);
}

seed();
