// app/api/evidence/[envelopeId]/verify/route.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Third-Party Evidence Verification Endpoint
// Allows external auditors to verify envelope signatures.
// ───────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { NodeCryptoEvidenceSigner } from "@/lib/evidence/signer";
import { InMemoryEvidenceLedger } from "@/lib/evidence/ledger";
import { verifyEnvelopeHash } from "@/lib/evidence/hashing";

// ─── Singleton Instances (dev/test) ───────────────────────────
// In production, these would be injected via dependency injection
// or loaded from persistent storage.

let _signer: NodeCryptoEvidenceSigner | null = null;
let _ledger: InMemoryEvidenceLedger | null = null;

function getSigner(): NodeCryptoEvidenceSigner {
  if (!_signer) {
    _signer = new NodeCryptoEvidenceSigner();
  }
  return _signer;
}

function getLedger(): InMemoryEvidenceLedger {
  if (!_ledger) {
    _ledger = new InMemoryEvidenceLedger();
  }
  return _ledger;
}

/**
 * Export for testing: allow tests to inject mock signer/ledger.
 */
export function setEvidenceDeps(deps: {
  signer?: NodeCryptoEvidenceSigner;
  ledger?: InMemoryEvidenceLedger;
}): void {
  if (deps.signer) _signer = deps.signer;
  if (deps.ledger) _ledger = deps.ledger;
}

/**
 * Export for testing: reset singletons.
 */
export function resetEvidenceDeps(): void {
  _signer = null;
  _ledger = null;
}

// ─── GET /api/evidence/:envelopeId/verify ─────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> },
) {
  const { envelopeId } = await params;

  if (!envelopeId || typeof envelopeId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid envelopeId" },
      { status: 400 },
    );
  }

  try {
    const ledger = getLedger();
    const signer = getSigner();

    // Fetch envelope from ledger
    const envelope = await ledger.get(envelopeId);
    if (!envelope) {
      return NextResponse.json(
        { error: "Envelope not found" },
        { status: 404 },
      );
    }

    // Verify hash integrity
    const hashValid = verifyEnvelopeHash(envelope);

    // Verify ED25519 signature
    const signatureValid = await signer.verify(envelope);

    // Get public key for third-party verification
    const publicKey = await signer.getPublicKey();

    return NextResponse.json({
      envelope_id: envelope.envelope_id,
      valid: hashValid && signatureValid,
      hash_verified: hashValid,
      signature_verified: signatureValid,
      created_at: envelope.created_at,
      signed_at: envelope.signed_at,
      tenant_id: envelope.tenant_id,
      capability_id: envelope.capability_id,
      agent_id: envelope.agent_id,
      policy_decision: envelope.policy_decision.decision,
      validation_score: envelope.validation.validation_score,
      validation_passed: envelope.validation.passed,
      signing_key_id: envelope.signing_key_id,
      public_key: publicKey,
      algorithm: "ed25519",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Verification failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
