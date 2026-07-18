import { NextResponse } from 'next/server';

const SAFEKRIPTE_URL = process.env.SAFEKRIPTE_URL ?? 'http://127.0.0.1:5096';
const SAFEKRIPTE_TIMEOUT = 3000;

interface SafeLinerStatus {
  online: boolean;
  service?: string;
  uptime?: number;
  credentials?: number;
  tierMax?: number;
  tier?: string;
  issuer?: string;
  safekrypteConnected?: boolean;
  error?: string;
}

async function fetchSafeLinerHealth(): Promise<SafeLinerStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SAFEKRIPTE_TIMEOUT);
    const res = await fetch('http://127.0.0.1:5097/health', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      online: data.ok === true,
      service: data.service,
      uptime: data.uptime,
      credentials: data.credentials,
      tierMax: data.tierMax,
      tier: data.credentials >= data.tierMax ? 'exhausted' : 'active',
      issuer: data.issuer,
    };
  } catch (err) {
    return {
      online: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkSafeKrypteConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${SAFEKRIPTE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/safeliner/status
 * Live status for SafeLiner credential issuance service.
 * Connects to the real SafeLiner service on port 5097 and checks
 * SafeKrypte connectivity for signing integration.
 */
export async function GET() {
  const [status, safekrypteConnected] = await Promise.all([
    fetchSafeLinerHealth(),
    checkSafeKrypteConnection(),
  ]);

  return NextResponse.json({
    ok: true,
    service: 'safeliner',
    status: { ...status, safekrypteConnected },
    timestamp: new Date().toISOString(),
  });
}
