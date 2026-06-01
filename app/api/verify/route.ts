import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, createHash, createHmac } from 'node:crypto'

const VERSION          = 'gate-1'
const PROTOCOL_VERSION = '1.0'
const SAFEGRID_VERSION = '1.0.0'
const ALLOWED_CHAINS   = ['AMOY', 'FABRIC']

function sha256(msg: string): string { return createHash('sha256').update(msg).digest('hex') }
function hmacSHA256(msg: string, secret: string): string {
  return createHmac('sha256', secret).update(msg).digest('hex')
}

function receiptUUID(): string { return randomUUID() }

function envelopeHash(handshake: Record<string, unknown>, envelope: Record<string, unknown>): string {
  return sha256(JSON.stringify({ handshake, envelope, version: PROTOCOL_VERSION }))
}

function safegridSignal(evaluatorVersion: string, verdict: string) {
  return { evaluator_version: evaluatorVersion, verdict, signal_id: receiptUUID() }
}

function betaMean(a: number, b: number): number { return (a + 1) / (a + b + 2) }

function calibratedThreshold(baseThreshold: number, gamma: number, alpha: number, betaCount: number): number {
  if (alpha <= 0) return 0
  return baseThreshold / (1 + gamma * (betaCount / alpha))
}

function buildEnvelope(chain: string, alpha: number, betaCount: number) {
  return {
    handler: chain,
    patching_profile: [500, 10, 2],
    active_amend: {
      chain_ref:    'active-456ea29',
      envelope_ref: 'envelope-c78be8b6',
    },
    tier: -1,
    machine_order: { candidate_pairs: [[alpha / 10, 0], [0, betaCount / 10]] },
    calibration: { steps_required: 4, steps_taken: 4, status: 'completed' },
  }
}

function buildHandshake(chain: string) {
  return { domain: chain, pairable_chains: ALLOWED_CHAINS }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 }) }

  const {
    alpha, beta, gamma, threshold,
    deed_hash, issuer_did, property_ref, chain_target,
  } = body ?? {}

  const a = +alpha, b = +beta, g = +gamma, t = +threshold

  if (![a, b, g, t].every(Number.isFinite) || a < 0 || b < 0 || g <= 0 || t < 0 || t > 1) {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['alpha must be ≥ 0', 'beta must be ≥ 0', 'gamma must be > 0', 'threshold must be between 0 and 1'],
    }, { status: 400 })
  }

  if (!deed_hash || !chain_target) {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['deed_hash and chain_target are required'],
    }, { status: 400 })
  }

  const chain = String(chain_target).toUpperCase()
  if (!ALLOWED_CHAINS.includes(chain)) {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: [
        `chain_target "${chain}" is not a permitted network.`,
        `Permitted at Gate-1: ${ALLOWED_CHAINS.join(', ')}.`,
        'MAINNET is rejected before proof computation.',
      ],
    }, { status: 400 })
  }

  const posterior  = betaMean(a, b)
  const cal        = calibratedThreshold(t, g, a, b)
  const margin      = posterior - cal
  const verdict     = margin > 0 ? 'PASS' : margin === 0 ? 'WARN' : 'HALT'

  const envelope  = buildEnvelope(chain, a, b)
  const handshake = buildHandshake(chain)

  const receipt_id  = receiptUUID()
  const anchored_at = null
  const anchoredCount = 0
  const pipeline_hash = envelopeHash(handshake, envelope)

  const hmacSecret = process.env.PROOFBRIDGE_HMAC_SECRET
    || process.env.KERNEL_SECRET
    || 'dev-secret'
  const signingString = `${posterior.toFixed(6)}:${t.toFixed(6)}:${verdict}`
  const signature = `hmac-sha256:${hmacSHA256(signingString, hmacSecret)}`

  const payload = {
    ok: true,
    posterior:        Number(posterior.toFixed(6)),
    threshold:        t,
    verdict,
    receipt_id,
    deed_hash:        String(deed_hash),
    chain_target:     chain,
    issuer_did:       issuer_did ?? null,
    property_ref:     property_ref ?? null,
    anchored_at,
    anchoredCount,
    pipeline_hash,
    root_ceremony: {
      chain_ref:         envelope.active_amend.chain_ref,
      envelope_ref:      envelope.active_amend.envelope_ref,
      patching_profile:  envelope.patching_profile,
      depth_hint:        a + b,
    },
    signature,
    safegrid_signal: safegridSignal(SAFEGRID_VERSION, verdict),
    program_version_raw: VERSION,
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Content-Type':     'application/json',
      'Cache-Control':    'no-store',
      'X-Kernel-Version': VERSION,
    },
  })
}
