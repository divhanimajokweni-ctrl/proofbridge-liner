import { NextResponse } from 'next/server';

/**
 * VVU EARTH TECH 72-Hour Simulation API
 *
 * Proxies requests to the simulation engine mini-service on port 3003.
 * GET /api/simulation/status — Full simulation state
 * GET /api/simulation/metrics — Current metrics
 * GET /api/simulation/hbk-twin — HBK digital twin telemetry
 * GET /api/simulation/git-actions — Git Actions log
 * GET /api/simulation/phases — Phase definitions
 * GET /api/simulation/milestones — Milestone tracker
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/simulation', '/api/sim');
    const target = `http://localhost:3003${path}`;

    const res = await fetch(target, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Simulation engine returned ${res.status}`, engineOnline: false },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ ...data, engineOnline: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Simulation engine offline — start mini-services/sim-engine',
        engineOnline: false,
        port: 3003,
      },
      { status: 503 },
    );
  }
}
