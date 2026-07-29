import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: Date.now(),
    environment: 'pilot-space',
    version: '2.1.0-alpha',
    systems: {
      gateway: 'online',
      poolsEngine: 'online',
      proofbridgeLiner: 'online',
      stitchAdapter: 'simulated'
    }
  }, { status: 200 });
}
