// ─────────────────────────────────────────────────────────────
// @searm1/api — SQLite database layer
// ─────────────────────────────────────────────────────────────
// Runtime-tolerant loader:
//   • Sandbox (Bun)  → bun:sqlite          (built-in, no native deps)
//   • Production     → better-sqlite3      (Node + Docker)
//
// Both drivers expose the same sync API surface that this module
// relies on:
//   new Database(path)
//   db.prepare(sql).all(...params)
//   db.prepare(sql).get(...params)
//   db.prepare(sql).run(...params)
//   db.exec(sql)
//   db.pragma(...)
//
// Schema mirrors packages/database/schema.sql (TimescaleDB shape)
// minus hypertables/PostGIS so a production swap can be done by
// changing the driver without touching route handlers.
// ─────────────────────────────────────────────────────────────

import path from 'node:path';
import fs from 'node:fs';

// ─────────────────────────────────────────────────────────────
// Runtime detection — try bun:sqlite first, fall back to
// better-sqlite3. Both are sync and have a near-identical API.
// ─────────────────────────────────────────────────────────────
type SqliteDb = {
  prepare(sql: string): SqliteStmt;
  exec(sql: string): void;
  pragma(pragma: string): unknown;
  close(): void;
};
type SqliteStmt = {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): RunResult;
};
type RunResult = {
  changes: number;
  lastInsertRowid?: number | bigint;
  success?: boolean;
};

let DatabaseCtor: new (path: string, options?: unknown) => SqliteDb;
let driverName: string;
try {
  // Bun runtime — built-in SQLite, no native build needed.
  DatabaseCtor = (require('bun:sqlite') as { Database: typeof DatabaseCtor }).Database;
  driverName = 'bun:sqlite';
} catch {
  // Node runtime — better-sqlite3 native binding (production / Docker).
  DatabaseCtor = (require('better-sqlite3') as { default: typeof DatabaseCtor }).default
    ?? (require('better-sqlite3') as unknown as typeof DatabaseCtor);
  driverName = 'better-sqlite3';
}

// ─────────────────────────────────────────────────────────────
// Resolve DB path. Anchor to the searm1-backend root regardless
// of which cwd `bun --filter` is invoked from — this prevents
// accidentally writing to the parent Next.js project's custom.db.
//
// __dirname = .../packages/api/src/   →  ../../../ = searm1-backend/
// ─────────────────────────────────────────────────────────────
function resolveDbPath(): string {
  const BACKEND_ROOT = path.resolve(__dirname, '../../..');
  const envUrl = process.env.DATABASE_URL || '';
  if (envUrl.startsWith('file:')) {
    const p = envUrl.slice('file:'.length);
    // Only honor DATABASE_URL if it explicitly mentions searm1 —
    // otherwise (e.g. parent project's custom.db) ignore + fall through.
    if (p && /searm1/i.test(p)) {
      return path.isAbsolute(p) ? p : path.resolve(BACKEND_ROOT, p);
    }
  }
  // Default: searm1.db at the backend root.
  return path.resolve(BACKEND_ROOT, 'searm1.db');
}

const resolvedPath = resolveDbPath();

// Ensure parent directory exists (in case of ./data/searm1.db etc.)
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db: SqliteDb = new DatabaseCtor(resolvedPath);

// Strict foreign keys + WAL for concurrency during simulation.
// Use exec() — works on both bun:sqlite and better-sqlite3 (the
// .pragma() method is missing on bun:sqlite 1.3.x).
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[db] pragma setup skipped:', (e as Error).message);
}

// eslint-disable-next-line no-console
console.log(`[db] SQLite driver: ${driverName}  file: ${resolvedPath}`);

// ─────────────────────────────────────────────────────────────
// Schema initialization — idempotent (CREATE IF NOT EXISTS).
// Mirrors packages/database/schema.sql shape (minus hypertables).
// ─────────────────────────────────────────────────────────────
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id        TEXT PRIMARY KEY,
      type      TEXT NOT NULL,            -- 'pipe' | 'node' | 'sensor' | 'valve'
      geometry  TEXT,                     -- GeoJSON Point/LineString (stringified)
      metadata  TEXT                      -- JSON metadata (length, diameter, etc.)
    );

    CREATE TABLE IF NOT EXISTS telemetry (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      time       TEXT    NOT NULL,        -- ISO 8601 UTC
      sensor_id  TEXT    NOT NULL,
      asset_id   TEXT    NOT NULL,
      pressure   REAL    NOT NULL,        -- bar
      flow       REAL    NOT NULL         -- L/min
    );

    CREATE TABLE IF NOT EXISTS evidence_events (
      id             TEXT PRIMARY KEY,
      asset_id       TEXT    NOT NULL,
      event_type     TEXT    NOT NULL,    -- 'leak' | 'burst' | 'pressure_anomaly'
      confidence     REAL    NOT NULL,    -- [0,1]
      classification TEXT    NOT NULL,    -- VERIFIED | CANDIDATE | INSUFFICIENT
      evidence       TEXT    NOT NULL,    -- JSON EvidenceVector
      created_at     TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pilot_proposals (
      id                     TEXT PRIMARY KEY,
      company                TEXT NOT NULL,
      contact                TEXT NOT NULL,
      email                  TEXT NOT NULL,
      facility_type          TEXT,
      current_method         TEXT,
      pain_points            TEXT,
      desired_outcomes       TEXT,
      budget_range           TEXT,
      timeline               TEXT,
      scada_available        INTEGER DEFAULT 0,
      gis_available          INTEGER DEFAULT 0,
      dma_size               TEXT,
      sensor_count           INTEGER,
      telemetry_interval     INTEGER,
      historical_incidents   INTEGER,
      submitted_at           TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time
      ON telemetry(asset_id, time DESC);

    CREATE INDEX IF NOT EXISTS idx_evidence_created
      ON evidence_events(created_at DESC);
  `);
}

// ─────────────────────────────────────────────────────────────
// Query helpers — thin wrappers for ergonomic one-liners.
// ─────────────────────────────────────────────────────────────
export function query<T = unknown>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T = unknown>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: unknown[]): RunResult {
  return db.prepare(sql).run(...params);
}

// Auto-init on module load (server + seed both import this).
initDb();
