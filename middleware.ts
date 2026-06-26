import { NextResponse, NextRequest } from 'next/server';

const CIRCUIT_BREAKER_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;

async function isCircuitTripped(): Promise<boolean> {
  if (!CIRCUIT_BREAKER_ADDRESS || !POLYGON_AMOY_RPC_URL) return false;
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC_URL);
    const { CIRCUIT_BREAKER_ABI } = await import('@/lib/contracts/circuitBreakerAbi');
    const contract = new ethers.Contract(CIRCUIT_BREAKER_ADDRESS, CIRCUIT_BREAKER_ABI, provider);
    const open = await contract.circuitOpen();
    return !open;
  } catch {
    return false; // fail open on RPC error to avoid self-inflicted outage
  }
}

export async function middleware(request: NextRequest) {
  const tripped = await isCircuitTripped();
  if (tripped) {
    return NextResponse.json(
      { error: 'GATE_D_TRIPPED', detail: 'Global circuit breaker is active. Service halted.' },
      { status: 423 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
