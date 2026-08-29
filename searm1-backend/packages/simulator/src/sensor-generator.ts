// ─────────────────────────────────────────────────────────────
// @searm1/simulator — sensor data generator
// ─────────────────────────────────────────────────────────────
// POSTs one telemetry row per pipe (PIP1–PIP10) to the API every
// 5 seconds. Values jitter ±2% around the MNF baseline to simulate
// a quiescent DMA — the EIS engine will see INSUFFICIENT evidence
// until an operator triggers /api/simulator/leak.
//
// Run: `bun --filter=@searm1/simulator dev`  (or  `bun src/sensor-generator.ts`)
// ─────────────────────────────────────────────────────────────

// Baseline MNF (Minimum Night Flow) reference values per pipe.
// Mirrors packages/api/src/seed.ts and the 04b NMBM sandbox spec.
const BASELINE: Record<string, { pressure: number; flow: number }> = {
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

const PIPE_IDS = Object.keys(BASELINE);
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TICK_MS = parseInt(process.env.TICK_MS || '5000', 10);

// ─────────────────────────────────────────────────────────────
// Jitter helper — ±2% Gaussian-ish noise around the baseline.
// Keeps pressure/flow realistic (not perfectly constant) so the
// EIS engine sees sub-threshold variation under normal operation.
// ─────────────────────────────────────────────────────────────
function jitter(value: number, pct = 0.02): number {
  const delta = value * pct * (Math.random() * 2 - 1);
  return Math.round((value + delta) * 100) / 100;
}

interface TelemetryPayload {
  sensorId: string;
  assetId: string;
  pressure: number;
  flow: number;
  time: string;
}

async function postTelemetry(payload: TelemetryPayload): Promise<void> {
  const url = `${API_URL}/api/network/telemetry`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[sim] POST ${url} → ${res.status} ${res.statusText}: ${text}`);
      return;
    }
    const json = (await res.json()) as { id: number; assetId: string; pressure: number; flow: number };
    console.log(
      `[sim] ✓ ${json.assetId.padEnd(5)} P=${json.pressure.toFixed(2)} bar  Q=${json.flow.toFixed(1)} L/min  (row ${json.id})`,
    );
  } catch (err) {
    console.error(`[sim] network error posting to ${url}:`, err);
  }
}

async function tick(): Promise<void> {
  const timestamp = new Date().toISOString();
  const payloads: TelemetryPayload[] = PIPE_IDS.map((id) => {
    const base = BASELINE[id];
    return {
      sensorId: `SENS_${id}`,
      assetId: id,
      pressure: jitter(base.pressure),
      flow: jitter(base.flow),
      time: timestamp,
    };
  });

  // Fire all 10 in parallel — they're independent.
  await Promise.all(payloads.map(postTelemetry));
  console.log(`[sim] ── tick complete @ ${timestamp} (${payloads.length} pipes) ──`);
}

async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SEARM1 · Sensor Simulator                                   ║
║  Target: ${API_URL.padEnd(50)}║
║  Pipes:  ${PIPE_IDS.length}  (PIP1–PIP${PIPE_IDS.length})                                  ║
║  Tick:   every ${TICK_MS}ms                                       ║
╚══════════════════════════════════════════════════════════════╝
`);

  // First tick immediately so the operator sees data right away.
  await tick();

  // Then schedule recurring ticks.
  setInterval(() => {
    void tick();
  }, TICK_MS);

  // Keep process alive + handle Ctrl-C.
  process.on('SIGINT', () => {
    console.log('\n[sim] SIGINT — stopping simulator.');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('\n[sim] SIGTERM — stopping simulator.');
    process.exit(0);
  });
}

void main();
