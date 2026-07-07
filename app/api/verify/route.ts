import { NextRequest, NextResponse } from 'next/server';
import { generateAttestation } from '@/lib/tee/attestation';
import { VerifyPayloadSchema } from '../schemas/gateway';
import { checkRateLimit } from '@/lib/rate-limiter';

function hexToBytes32(hex: string): string {
  const cleaned = hex.replace('0x', '').padStart(64, '0');
  return '0x' + cleaned;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { maxRequests: 30 });
  if (rateLimitResponse) return rateLimitResponse;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized Access', detail: 'Missing valid security bearer context mapping' }, { status: 401 });
  }

  try {
    const payload = await req.json();

    // ── Zod schema gate ────────────────────────────────────────────
    const validation = VerifyPayloadSchema.safeParse(payload);
    if (!validation.success) {
      return NextResponse.json({
        ok: false,
        error: 'SCHEMA_VALIDATION_ERROR',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { documentHash, deed_hash, alpha, beta, gamma, threshold } = validation.data;

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
    let verdict = margin > 0 ? 'SAFE' : 'TRIP';
    let gemmaOpinion: any = null;

    // ── Borderline zone: call Gemma LLM judge for secondary opinion ──
    if (verdict === 'SAFE' && process.env.FIREWORKS_API_KEY) {
      const { isBorderline, gemmaJudge } = await import(
        '../../../lib/compliance/gemma-judge'
      );
      if (isBorderline(posterior, t)) {
        gemmaOpinion = await gemmaJudge({
          agentId: validation.data.agentId || 'unknown',
          targetContract: validation.data.targetContract,
          valueETH: validation.data.valueETH,
          chronicleId: validation.data.chronicleId,
          posterior,
          threshold: t,
          gamma: g,
        });
        // If Gemma flags FRAUD, override Bayesian SAFE to TRIP
        if (gemmaOpinion.verdict === 'FRAUD') {
          verdict = 'TRIP';
        }
      }
    }

    // If Bayesian kernel itself trips, halt regardless of circuit state
    if (verdict === 'TRIP') {
      return NextResponse.json({
        ok: false,
        error: 'BAYESIAN_TRIP',
        detail: 'Posterior below threshold. Attestation withheld.',
        posterior: Number(posterior.toFixed(6)),
        threshold: t,
        margin: Number(margin.toFixed(6)),
        gemmaOpinion: gemmaOpinion
          ? { verdict: gemmaOpinion.verdict, confidence: gemmaOpinion.confidence, modelUsed: gemmaOpinion.modelUsed }
          : undefined,
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
      gemmaOpinion: gemmaOpinion
        ? {
            verdict: gemmaOpinion.verdict,
            confidence: gemmaOpinion.confidence,
            reasoning: gemmaOpinion.reasoning,
            modelUsed: gemmaOpinion.modelUsed,
            latencyMs: gemmaOpinion.latencyMs,
          }
        : undefined,
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
