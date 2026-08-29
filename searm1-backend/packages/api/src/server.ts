// ─────────────────────────────────────────────────────────────
// @searm1/api — Express server entrypoint
// ─────────────────────────────────────────────────────────────
// Boots on PORT (default 3001). Mounts:
//   /api/health     — liveness probe
//   /api/network    — assets + telemetry
//   /api/events     — evidence events (latest + history)
//   /api/simulator  — leak/burst triggers
//   /api/pilot      — pilot proposal intake
//
// Engine: @searm1/engine (pure TS — same package the simulator uses).
// Database: SQLite via better-sqlite3 (sandbox) — swap for pg/TimescaleDB
// in production without touching route handlers.
// ─────────────────────────────────────────────────────────────

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { initDb, db } from './db';
import networkRouter from './routes/network';
import eventsRouter from './routes/events';
import simulatorRouter from './routes/simulator';
import pilotRouter from './routes/pilot';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Minimal request log (dev convenience — stdout for `bun --watch`).
app.use((req: Request, _res: Response, next) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ── Liveness ────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'searm1-api',
    version: '1.0.0',
    engine: 'vvu-ive / EIS v1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/network', networkRouter);
app.use('/api/events', eventsRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/pilot', pilotRouter);

// ── Root redirect (helps anyone hitting / directly) ─────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'SEARM1 API',
    description: 'VVU-IVE evidence pipeline — Express backend',
    endpoints: [
      'GET  /api/health',
      'GET  /api/network/assets',
      'GET  /api/network/assets/:id',
      'GET  /api/network/telemetry/:assetId/latest',
      'POST /api/network/telemetry',
      'GET  /api/events/latest',
      'GET  /api/events/history?limit=20',
      'POST /api/simulator/leak',
      'POST /api/simulator/burst',
      'POST /api/pilot',
      'GET  /api/pilot',
    ],
  });
});

// ── 404 fallback ────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'not found',
    path: req.path,
    method: req.method,
    hint: 'GET / for endpoint list',
  });
});

// ── Error fallback ──────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next) => {
  // eslint-disable-next-line no-console
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: 'internal server error', message: err.message });
});

// ── Boot ────────────────────────────────────────────────────
// Ensure schema exists (also called by db.ts on import — keep here
// for clarity / explicit init logging).
initDb();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SEARM1 · VVU-IVE Evidence Pipeline API                      ║
║  Engine: EIS v1.0 + HBK                                     ║
║  Listening on http://localhost:${PORT}                          ║
║  DB: SQLite (better-sqlite3) — see docker-compose.yml for pg ║
╚══════════════════════════════════════════════════════════════╝
`);
});

// Graceful shutdown — close DB handle so WAL checkpoints flush.
function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n[api] ${signal} received, shutting down...`);
  server.close(() => {
    try {
      db.close();
      // eslint-disable-next-line no-console
      console.log('[api] DB closed cleanly. Bye.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[api] error closing DB:', e);
    }
    process.exit(0);
  });
  // Force-exit after 5s if server.close hangs.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app, server };
