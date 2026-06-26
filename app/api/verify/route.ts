import { NextRequest, NextResponse } from 'next/server';
import { generateAttestation } from '@/lib/tee/attestation';

const rateLimitCache = new Map<string, number[]>();
const LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, [now]);
    return false;
  }
  const timestamps = rateLimitCache.get(ip)!.filter(t => now - t < LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  rateLimitCache.set(ip, timestamps);
  return false;
}

function hexToBytes32(hex: string): string {
  const cleaned = hex.replace('0x', '').padStart(64, '0');
  return '0x' + cleaned;
}

export async function POST(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown-client';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too Many Requests — Rate Boundary Crossed' }, { status: 429 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized Access', detail: 'Missing valid security bearer context mapping' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { documentHash, signals, deed_hash, alpha, beta, gamma, threshold } = payload;

    const effectiveDocHash = documentHash || deed_hash;

    if (!effectiveDocHash || effectiveDocHash.length !== 66) {
      return NextResponse.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        errors: ['documentHash (or deed_hash) must be a 66-char 0x-prefixed hex string'],
      }, { status: 400 });
    }

    const assetId = hexToBytes32(effectiveDocHash);
    let circuitOpen = true;
    let circuitBreakerAddress: string | null = null;
    let anchorTxHash: string | null = null;

    const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
    const cbAddress = process.env.CIRCUIT_BREAKER_ADDRESS;

    if (rpcUrl && cbAddress) {
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const { CIRCUIT_BREAKER_ABI } = await import('@/lib/contracts/circuitBreakerAbi');
        const contract = new ethers.Contract(cbAddress, CIRCUIT_BREAKER_ABI, provider);
        circuitOpen = await contract.circuitOpen();
        circuitBreakerAddress = cbAddress;

        // Gate D hard enforcement: if circuit is tripped, halt immediately
        if (!circuitOpen) {
          return NextResponse.json({
            ok: false,
            error: 'GATE_D_TRIPPED',
            detail: 'CircuitBreaker is tripped. No attestation or proof update issued.',
            circuitState: 'TRIPPED',
            circuitBreakerAddress,
          }, { status: 423 });
        }

        // Anchor deed hash on-chain via updateProof (oracle-gated on contract)
        const deedHashBytes32 = hexToBytes32(effectiveDocHash);
        const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
        const contractWithSigner = contract.connect(wallet);
        const tx = await (contractWithSigner as any).updateProof(assetId, deedHashBytes32);
        const receipt = await tx.wait();
        anchorTxHash = receipt.hash;
      } catch (e) {
        // In environments without on-chain config, fail closed rather than soft-attest
        if (rpcUrl && cbAddress) {
          return NextResponse.json({
            ok: false,
            error: 'CIRCUIT_BREAKER_UNREACHABLE',
            detail: 'On-chain verification configured but call failed.',
          }, { status: 502 });
        }
        // If no env configured at all, proceed with software-attest but mark degraded
        circuitBreakerAddress = null;
      }
    }

    const a = +alpha || 24;
    const b = +beta || 8;
    const g = +gamma || 1.0;
    const t = +threshold || 0.55;
    const posterior = (a + 1) / (a + b + 2);
    const margin = posterior - t;
    const verdict = margin > 0 ? 'SAFE' : 'TRIP';

    // If Bayesian kernel itself trips, halt regardless of circuit state
    if (verdict === 'TRIP') {
      return NextResponse.json({
        ok: false,
        error: 'BAYESIAN_TRIP',
        detail: 'Posterior below threshold. Attestation withheld.',
        posterior: Number(posterior.toFixed(6)),
        threshold: t,
        margin: Number(margin.toFixed(6)),
      }, { status: 423 });
    }

    const teeAttestation = generateAttestation(effectiveDocHash);

    return NextResponse.json({
      ok: true,
      attestation: circuitBreakerAddress ? 'on-chain-verified' : 'software-attested',
      documentHash: effectiveDocHash,
      deed_hash: effectiveDocHash,
      circuitState: 'OPEN',
      circuitBreakerStatus: circuitBreakerAddress ? 'ON-CHAIN' : 'SOFTWARE-ATTESTED',
      circuitBreakerAddress,
      anchorTxHash,
      posterior: Number(posterior.toFixed(6)),
      threshold: t,
      verdict,
      margin: Number(margin.toFixed(6)),
      teeAttestation: {
        mode: teeAttestation.mode,
        measurement: teeAttestation.measurement,
        pcrHash: teeAttestation.pcrHash,
        signingKeyFingerprint: teeAttestation.signingKeyFingerprint,
        timestamp: teeAttestation.timestamp,
      },
      timestamp: Date.now(),
      traceparent: req.headers.get('traceparent') || '00-simulatedtraceid1234567890-00',
    }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Invalid compilation framework body structure' }, { status: 400 });
  }
}
