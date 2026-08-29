-- ─────────────────────────────────────────────────────────────
-- SEARM1 — Production TimescaleDB schema
-- ─────────────────────────────────────────────────────────────
-- Loaded automatically as a docker-entrypoint init script by
-- docker-compose.yml (./packages/database/schema.sql →
-- /docker-entrypoint-initdb.d/schema.sql).
--
-- Shape mirrors the sandbox SQLite schema in
-- packages/api/src/db.ts. The only divergence:
--   • telemetry.time       → TIMESTAMPTZ + hypertable (1-day chunks)
--   • evidence_events.created_at → TIMESTAMPTZ + hypertable
--   • assets                → PostGIS geometry(Geometry,4326)
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────
-- assets — physical network elements (pipes, nodes, sensors)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,             -- 'pipe' | 'node' | 'sensor' | 'valve'
    geometry   geometry(Geometry, 4326),  -- GeoJSON Point/LineString
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- ─────────────────────────────────────────────────────────────
-- telemetry — high-frequency pressure/flow samples (hypertable)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry (
    time       TIMESTAMPTZ NOT NULL,
    sensor_id  TEXT NOT NULL,
    asset_id   TEXT NOT NULL REFERENCES assets(id),
    pressure   DOUBLE PRECISION NOT NULL,  -- bar
    flow       DOUBLE PRECISION NOT NULL   -- L/min
);

SELECT create_hypertable('telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time
    ON telemetry(asset_id, time DESC);

-- ─────────────────────────────────────────────────────────────
-- evidence_events — VVU-IVE engine output (hypertable, append-only)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_events (
    id             TEXT NOT NULL,
    asset_id       TEXT NOT NULL REFERENCES assets(id),
    event_type     TEXT NOT NULL,         -- 'leak' | 'burst' | 'pressure_anomaly'
    confidence     DOUBLE PRECISION NOT NULL,
    classification TEXT NOT NULL,         -- VERIFIED | CANDIDATE | INSUFFICIENT
    evidence       JSONB NOT NULL,        -- {pressureSignal, flowSignal, spatialSignal}
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('evidence_events', 'created_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_evidence_created
    ON evidence_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_classification
    ON evidence_events(classification, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- pilot_proposals — sales/pilot intake
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pilot_proposals (
    id                    TEXT PRIMARY KEY,
    company               TEXT NOT NULL,
    contact               TEXT NOT NULL,
    email                 TEXT NOT NULL,
    facility_type         TEXT,
    current_method        TEXT,
    pain_points           TEXT,
    desired_outcomes      TEXT,
    budget_range          TEXT,
    timeline              TEXT,
    scada_available       BOOLEAN DEFAULT FALSE,
    gis_available         BOOLEAN DEFAULT FALSE,
    dma_size              TEXT,
    sensor_count          INTEGER,
    telemetry_interval    INTEGER,
    historical_incidents  INTEGER,
    submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_submitted
    ON pilot_proposals(submitted_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Continuous aggregates (optional, for dashboards)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW evidence_classification_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket(INTERVAL '1 hour', created_at) AS bucket,
    classification,
    COUNT(*) AS event_count,
    AVG(confidence) AS avg_confidence
FROM evidence_events
GROUP BY bucket, classification;
