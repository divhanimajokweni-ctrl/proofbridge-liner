import { NextResponse } from 'next/server';

const SAFEKRIPTE_URL = process.env.SAFEKRIPTE_URL ?? 'http://127.0.0.1:5096';
const SAFEKRIPTE_TIMEOUT = 3000;

interface SafeKrypteStatus {
  online: boolean;
  service?: string;
  uptime?: number;
  creators?: number;
  tierMax?: number;
  tier?: string;
  keyBindingMode?: string;
  algorithm?: string;
  error?: string;
}

async function fetchSafeKrypteHealth(): Promise<SafeKrypteStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SAFEKRIPTE_TIMEOUT);
    const res = await fetch(`${SAFEKRIPTE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      online: data.ok === true,
      service: data.service,
      uptime: data.uptime,
      creators: data.creators,
      tierMax: data.tierMax,
      tier: data.creators >= data.tierMax ? 'exhausted' : 'active',
      keyBindingMode: data.keyBindingMode,
      algorithm: data.algorithm,
    };
  } catch (err) {
    return {
      online: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

/**
 * GET /api/safekrypte/status
 * Live status for SafeKrypte ED25519 signing service.
 * Connects to the real SafeKrypte service on port 5096.
 */
export async function GET() {
  const status = await fetchSafeKrypteHealth();

  return NextResponse.json({
    ok: true,
    service: 'safekrypte',
    status,
    timestamp: new Date().toISOString(),
  });
}
