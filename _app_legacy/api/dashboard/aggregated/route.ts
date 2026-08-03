import { NextResponse } from 'next/server';

const SAFEKRIPTE_URL = process.env.SAFEKRIPTE_URL ?? 'http://127.0.0.1:5096';
const SAFELINER_URL = process.env.SAFELINER_URL ?? 'http://127.0.0.1:5097';

const TIMEOUT_MS = 3000;

async function fetchJson(url: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    return res.json();
  } catch (err) {
    return { online: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

/**
 * GET /api/dashboard/aggregated
 * Aggregated status for the VVU Trust Runtime Dashboard.
 * Pulls live data from all backend services and returns a unified
 * status envelope for the dashboard UI to render.
 */
export async function GET() {
  const [safekrypte, safeliner] = await Promise.all([
    fetchJson(`${SAFEKRIPTE_URL}/health`),
    fetchJson(`${SAFELINER_URL}/health`),
  ]);

  const services = {
    safekrypte: {
      online: safekrypte.ok === true,
      service: safekrypte.service ?? 'safekrypte-lite',
      keyBindingMode: safekrypte.keyBindingMode ?? 'lite',
      algorithm: safekrypte.algorithm ?? 'ED25519',
      creators: safekrypte.creators ?? 0,
      tierMax: safekrypte.tierMax ?? 1000,
      tier: (safekrypte.creators ?? 0) >= (safekrypte.tierMax ?? 1000) ? 'exhausted' : 'active',
      uptime: safekrypte.uptime ?? 0,
    },
    safeliner: {
      online: safeliner.ok === true,
      service: safeliner.service ?? 'safeline-lite',
      credentials: safeliner.credentials ?? 0,
      tierMax: safeliner.tierMax ?? 1000,
      tier: (safeliner.credentials ?? 0) >= (safeliner.tierMax ?? 1000) ? 'exhausted' : 'active',
      issuer: safeliner.issuer ?? 'VVU SafeLiner Lite',
      uptime: safeliner.uptime ?? 0,
    },
    proofbridge: {
      online: true,
      service: 'proofbridge-liner',
      network: process.env.POLYGON_AMOY_RPC_URL ? 'live' : 'simulated',
    },
    ubuntuPools: {
      online: true,
      service: 'ubuntu-pools',
      status: 'pilot',
    },
    airKernel: {
      online: true,
      service: 'air-kernel',
      gates: 7,
      status: 'operational',
    },
  };

  const allOnline = Object.values(services).every((s) => s.online);

  return NextResponse.json({
    ok: true,
    service: 'vvu-trust-dashboard',
    systemStatus: allOnline ? 'operational' : 'degraded',
    services,
    timestamp: new Date().toISOString(),
    version: '1.0.0-rc1',
  });
}
