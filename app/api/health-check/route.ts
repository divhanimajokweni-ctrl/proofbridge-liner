/**
 * Lightweight health-check endpoint for PiP heartbeat polling.
 * Returns fast 200 OK with minimal payload to avoid bandwidth waste.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: Date.now(),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
