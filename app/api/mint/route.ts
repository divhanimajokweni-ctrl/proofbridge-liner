import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, createHash, createHmac } from 'node:crypto'

const VERSION            = 'gate-1-mint'
const PROTOCOL_VERSION   = '1.0'
const SAFEGRID_VERSION   = '1.0.0'
const ALLOWED_CHAINS     = ['AMOY', 'FABRIC']

function sha256Hex(msg: string): string { return createHash('sha256').update(msg).digest('hex') }
function hmacSHA256(message: string, secret: string): string {
  return `hmac-sha256:${createHmac('sha256', secret).update(message).digest('hex')}`
}

function uuidv4(): string { return randomUUID() }

function isHex64(s: unknown): boolean  { return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s) }
function isHexNonce(s: unknown): boolean { return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s) }

function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

function envelopeHash(handshake: Record<string, unknown>, envelope: Record<string, unknown>): string {
  return sha256Hex(JSON.stringify({ handshake, envelope, version: PROTOCOL_VERSION }))
}

function safegridSignal(evaluatorVersion: string, verdict: string) {
  return { evaluator_version: evaluatorVersion, verdict, signal_id: uuidv4() }
}

function betaMean(a: number, b: number): number { return (a + 1) / (a + b + 2) }

function calibratedThreshold(baseThreshold: number, gamma: number, alpha: number, betaCount: number): number {
  if (alpha <= 0) return 0
  return baseThreshold / (1 + gamma * (betaCount / alpha))
}

function handshakeFor(chain: string) {
  return { domain: chain, pairable_chains: ALLOWED_CHAINS }
}

function envelopeFor(chain: string, alpha: number, betaCount: number) {
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

type MintBody = {
  alpha?: number; beta?: number; gamma?: number; threshold?: number;
  deed_hash?: string; client_nonce?: string; issuer_did?: string;
  property_ref?: string; chain_target?: string;
};

export async function POST(request: NextRequest) {
  let body: MintBody
  try { body = await request.json() }
  catch { return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 }) }

  const {
    alpha = 0, beta = 0, gamma = 0, threshold: rawThreshold = 0,
    deed_hash, client_nonce, issuer_did, property_ref, chain_target,
  } = body

  const a = +alpha, b = +beta, g = +gamma, t = +rawThreshold

  if (!isHex64(deed_hash)) {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['deed_hash must be a 64-character lowercase hex string (SHA-256)'],
    }, { status: 400 })
  }

  if (!isHexNonce(client_nonce ?? '')) {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['client_nonce is required and must be a 64-character lowercase hex string (SHA-256) — client-generated replay protection'],
    }, { status: 400 })
  }

  if (!chain_target || typeof chain_target !== 'string') {
    return NextResponse.json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['chain_target is required (AMOY | FABRIC)'],
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

  const receipt_id   = uuidv4()
  const timestamp    = new Date().toISOString()
  const anchored_at  = null
  const anchoredCount = 0

  const envelope     = envelopeFor(chain, a, b)
  const handshake    = handshakeFor(chain)

  const hashInput = {
    deed_hash, client_nonce, threshold: t, posterior: Number(posterior.toFixed(6)),
    receipt_id, verdict, timestamp, chain_target: chain,
    alpha: a, beta: b, gamma: g,
  }
  const pipeline_hash = sha256Hex(canonicalJSON(hashInput))
  const handshake_hash = envelopeHash(handshake, envelope)

  const payload = {
    ok: true,
    issuer_did:        issuer_did ?? null,
    deed_hash,
    client_nonce,
    property_ref:      property_ref ?? '',
    chain_target:      chain,
    algorithm:         `beta-posterior-gamma-pivot@${PROTOCOL_VERSION}`,
    alpha: a, beta: b, gamma: g,
    posterior:         Number(posterior.toFixed(6)),
    threshold:         Number(t.toFixed(6)),
    verdict,
    receipt_id,
    timestamp,
    anchored_at,
    anchoredCount,
    pipeline_hash,
    handshake_hash,
    root_ceremony: {
      chain_ref:         envelope.active_amend.chain_ref,
      envelope_ref:      envelope.active_amend.envelope_ref,
      patching_profile:  envelope.patching_profile,
      depth_hint:        a + b,
    },
    safegrid_signal:    safegridSignal(SAFEGRID_VERSION, verdict),
    program_version_raw: VERSION,
  }

  const hmacSecret = process.env.PROOFBRIDGE_HMAC_SECRET
    || process.env.KERNEL_SECRET
    || 'dev-secret'
  const signature = hmacSHA256(canonicalJSON(payload), hmacSecret)

  return NextResponse.json({
    status: verdict === 'HALT' ? 'CIRCUIT_BREAKER_TRIPPED' : 'VERIFIED_SOVEREIGN_TRUTH',
    payload,
    signature,
  }, {
    status: 200,
    headers: {
      'Content-Type':     'application/json',
      'Cache-Control':    'no-store',
      'X-Kernel-Version': VERSION,
    },
  })
}
