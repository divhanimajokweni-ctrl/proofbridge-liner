# SEARM1 Backend

**VVU-IVE Evidence Pipeline** — Node.js + TypeScript monorepo. Replaces
synthetic frontend data with a real event pipeline: sensor simulator →
Express API → SQLite/TimescaleDB → VVU-IVE evidence engine → dashboard.

> Built for the [NMBM / DWS domain-validation demo](../docs/executive-bundle).
> SIMULATION DATA · Zero Fabrication Mandate.

---

## Architecture

```
┌──────────────────┐   POST /api/network/telemetry    ┌────────────────────┐
│  @searm1/sim     │ ───────────────────────────────► │  @searm1/api        │
│  sensor-gen.ts   │  (every 5s, 10 pipes, ±2% noise) │  Express + CORS     │
└──────────────────┘                                    │                     │
                                                       │  /api/network       │
┌──────────────────┐   POST /api/simulator/leak        │  /api/events        │
│  frontend/       │ ───────────────────────────────► │  /api/simulator     │
│  index.html     │   (operator triggers leak/burst)   │  /api/pilot         │
└──────────────────┘                                    │                     │
       ▲                                                │  uses @searm1/engine │
       │  GET /api/events/latest (poll 2s)             │  (EIS v1.0 + HBK)    │
       └───────────────────────────────────────────────┤                     │
                                                        │  better-sqlite3     │
                                                        │  → searm1.db        │
                                                        └─────────┬───────────┘
                                                                  │
                                                         (production swap)
                                                                  ▼
                                                        TimescaleDB / PostGIS
                                                        (see docker-compose.yml)
```

### Packages

| Package | Description |
|---|---|
| `@searm1/engine` | Pure TypeScript evidence engine — `computeEvidenceVector` + `calculateEIS` (EIS v1.0 thresholds). |
| `@searm1/api` | Express server on port **3001**. SQLite via `better-sqlite3`. |
| `@searm1/simulator` | Sensor data generator. POSTs 10 pipes × 1 telemetry row every 5s. |
| `packages/database` | TimescaleDB production schema (`schema.sql`). |

---

## Quickstart (sandbox — Bun + SQLite)

```bash
cd searm1-backend

# 1. Install all workspace deps
bun install

# 2. Seed the network (10 pipes PIP1–PIP10, 8 nodes N1–N8, baseline telemetry)
bun run seed

# 3. Start the API (port 3001)
bun run dev:api
#   →  bun --watch src/server.ts

# 4. In another terminal, start the simulator
bun run dev:sim
#   →  bun --watch src/sensor-generator.ts

# 5. Open the dashboard
#   →  open frontend/index.html
#   (or copy to Next.js public/ folder and visit /searm1-pipeline.html)
```

### Sanity-check with curl

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/network/assets
curl -X POST http://localhost:3001/api/simulator/leak
curl http://localhost:3001/api/events/latest
curl 'http://localhost:3001/api/events/history?limit=5'
```

---

## API Endpoints

### `GET /api/health`
Liveness probe. Returns `{ status: "ok", service, version, engine, uptime }`.

### `GET /api/network/assets`
All pipes + nodes. Each asset has `id`, `type`, `geometry`, `metadata` (diameter, length, material, baseline pressure/flow).

### `GET /api/network/assets/:id`
Single asset.

### `GET /api/network/telemetry/:assetId/latest`
Latest telemetry row for the asset (pressure in bar, flow in L/min).

### `POST /api/network/telemetry`
Insert a telemetry row. Body:
```json
{ "sensorId": "SENS_PIP3", "assetId": "PIP3", "pressure": 4.8, "flow": 91, "time": "2026-08-29T10:30:00Z" }
```

### `GET /api/events/latest`
Latest `evidence_event` row (or 404 if none).

### `GET /api/events/history?limit=20`
Last N evidence events (default 20, max 100), newest first.

### `POST /api/simulator/leak`
Trigger a leak simulation. Optional body:
```json
{ "assetId": "PIP3", "pressureFactor": 0.7, "flowFactor": 1.2 }
```
Pipeline: get baseline → generate leak observation → insert telemetry → compute evidence vector → calculate EIS → persist `evidence_event` → return event.

### `POST /api/simulator/burst`
Same pipeline with burst-tier factors (`pressureFactor=0.4`, `flowFactor=1.6`, `eventType="burst"`).

### `POST /api/pilot`
Submit a pilot proposal. Required: `company`, `contact`, `email`. Returns `{ success: true, id }`.

### `GET /api/pilot?limit=20`
List recent pilot proposals (admin/debug).

---

## EIS v1.0 Evidence Engine

The engine lives in `packages/engine/src/` and is pure TypeScript — no I/O,
no side effects (besides `Math.random()` in the spatial signal). It produces
two outputs:

### 1. Evidence Vector (3 axes ∈ [0,1])

```typescript
{
  pressureSignal,  // |ΔP| / baseline P  (clamped to [0,1])
  flowSignal,      // |ΔQ| / baseline Q  (clamped to [0,1])
  spatialSignal    // HBK cross-asset correlation weight (0.65–0.95)
}
```

### 2. EIS Classification (3 states)

```typescript
confidence = mean(pressureSignal, flowSignal, spatialSignal)

if      (confidence >= 0.75) → VERIFIED
else if (confidence >= 0.50) → CANDIDATE
else                         → INSUFFICIENT
```

These thresholds come from `02c_EIS_v1.md §4` and match the Next.js frontend's
EIS workspace (`src/lib/evidence/EISv1Engine.ts`).

---

## Production (Docker + TimescaleDB)

The sandbox uses SQLite (`better-sqlite3`) because the cloud environment
doesn't have a PostgreSQL server. Production swaps to TimescaleDB without
touching route handlers — the schema shape is identical:

```bash
cd searm1-backend
docker-compose up
#  →  timescaledb  (postgres://searm1:searm1_dev@localhost:5432/searm1)
#  →  api          (http://localhost:3001)
#  →  simulator    (POSTs to http://api:3001)
```

The `packages/database/schema.sql` file is mounted as a docker-entrypoint
init script, so the database is created with hypertables + PostGIS on first
boot. Override `DATABASE_URL` in `docker-compose.yml` to point the API at
PostgreSQL instead of SQLite.

---

## Repository layout

```
searm1-backend/
├── package.json                    # workspaces root
├── tsconfig.base.json
├── .env                            # DATABASE_URL, PORT, API_URL
├── docker-compose.yml              # TimescaleDB + api + simulator
├── README.md                       # this file
├── packages/
│   ├── engine/                     # @searm1/engine (pure TS)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts            # Observation, EvidenceVector, EvidenceEvent
│   │       ├── evidence.ts         # computeEvidenceVector()
│   │       ├── eis.ts              # calculateEIS() → VERIFIED/CANDIDATE/INSUFFICIENT
│   │       └── index.ts            # public API
│   ├── api/                        # @searm1/api (Express)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── server.ts           # boot, mount routes, graceful shutdown
│   │       ├── db.ts               # better-sqlite3 + initDb()
│   │       ├── seed.ts             # PIP1–PIP10, N1–N8, baseline telemetry
│   │       └── routes/
│   │           ├── network.ts      # /assets, /telemetry
│   │           ├── events.ts       # /latest, /history
│   │           ├── simulator.ts    # /leak, /burst (full pipeline)
│   │           └── pilot.ts        # pilot proposal intake
│   ├── simulator/                  # @searm1/simulator
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── sensor-generator.ts # 5s tick, 10 pipes, ±2% jitter
│   └── database/
│       └── schema.sql              # TimescaleDB + PostGIS (production)
├── frontend/
│   └── index.html                  # live API-connected dashboard
└── searm1.db                       # SQLite file (created on first boot)
```

---

## EIS thresholds reference

| Confidence | Classification | Meaning |
|---|---|---|
| ≥ 0.75 | `VERIFIED` | Evidence meets independence threshold — actionable. |
| ≥ 0.50 | `CANDIDATE` | Partial evidence — needs more sensors / more time. |
| < 0.50 | `INSUFFICIENT` | Evidence too weak — no action. |

---

## Zero Fabrication Mandate

All data produced by this pipeline is **SIMULATION DATA** — synthetic
baselines calibrated against the NMBM Ward 42 hydraulic model. No field
telemetry is consumed and no production decisions should be made from these
outputs. The engine + audit log shape is what is being validated, not the
specific numbers.

The pilot proposal form is for **intake only** — submitted records are
stored locally in `searm1.db` and never transmitted off-host.
