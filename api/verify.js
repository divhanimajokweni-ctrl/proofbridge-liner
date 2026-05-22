import { randomUUID, createHash } from 'node:crypto'
import { attachReceiptSignature } from './lib/receipt-signing.js'

const VERSION          = 'gate-1'
const PROTOCOL_VERSION = '1.0'
const SAFEGRID_VERSION = '1.0.0'
const ALLOWED_CHAINS   = ['AMOY', 'FABRIC']

export function    sha256(msg) { return createHash('sha256').update(msg).digest('hex') }
function receiptUUID() { return randomUUID() }

function envelopeHash(handshake, envelope) {
  return sha256(JSON.stringify({ handshake, envelope, version: PROTOCOL_VERSION }))
}

function safegridSignal(evaluatorVersion, verdict) {
  return { evaluator_version: evaluatorVersion, verdict, signal_id: receiptUUID() }
}

function betaMean(a, b) { return (a + 1) / (a + b + 2) }

function calibratedThreshold(baseThreshold, gamma, alpha, betaCount) {
  if (alpha <= 0) return 0
  return baseThreshold / (1 + gamma * (betaCount / alpha))
}

function buildEnvelope(chain, alpha, betaCount) {
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

function buildHandshake(chain) {
  return { domain: chain, pairable_chains: ALLOWED_CHAINS }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'proofbridge-gate-1',
      receipt_algorithm: 'RS256',
      telemetry_ingress: '/api/liquidity-leap/telemetry',
      required_env: ['PROOFBRIDGE_RECEIPT_PRIVATE_KEY'],
      optional_env: ['PROOFBRIDGE_RECEIPT_PUBLIC_KEY', 'PROOFBRIDGE_RECEIPT_KEY_ID', 'LIQUIDITY_LEAP_TELEMETRY_KEY'],
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', allowed: ['POST'] })
  }

  let body
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body }
  catch { return res.status(400).json({ ok: false, error: 'INVALID_JSON' }) }

  const {
    alpha, beta, gamma, threshold,
    deed_hash, issuer_did, property_ref, chain_target,
  } = body ?? {}

  const a = +alpha, b = +beta, g = +gamma, t = +threshold

  if (![a, b, g, t].every(Number.isFinite) || a < 0 || b < 0 || g <= 0 || t < 0 || t > 1) {
    return res.status(400).json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['alpha must be ≥ 0', 'beta must be ≥ 0', 'gamma must be > 0', 'threshold must be between 0 and 1'],
    })
  }

  if (!deed_hash || !chain_target) {
    return res.status(400).json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: ['deed_hash and chain_target are required'],
    })
  }

  const chain = String(chain_target).toUpperCase()
  if (!ALLOWED_CHAINS.includes(chain)) {
    return res.status(400).json({
      ok: false, error: 'VALIDATION_ERROR',
      errors: [
        `chain_target "${chain}" is not a permitted network.`,
        `Permitted at Gate-1: ${ALLOWED_CHAINS.join(', ')}.`,
        'MAINNET is rejected before proof computation.',
      ],
    })
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

  const payload = attachReceiptSignature({
    ok: true,
    posterior:        Number(posterior.toFixed(6)),
    threshold:        t,
    verdict,
    receipt_id,
    deed_hash:        String(deed_hash),
    chain_target:     chain,
    issuer_did:       issuer_did ?? null,
    property_ref:     property_ref ?? null,
    anchored_at,               // null — 'active amends do not overwrite' invariant
    anchoredCount,
    pipeline_hash,
    root_ceremony: {
      chain_ref:         envelope.active_amend.chain_ref,
      envelope_ref:      envelope.active_amend.envelope_ref,
      patching_profile:  envelope.patching_profile,
      depth_hint:        a + b,
    },
    safegrid_signal: safegridSignal(SAFEGRID_VERSION, verdict),
    program_version_raw: VERSION,
  })

  res.setHeader('Content-Type',     'application/json')
  res.setHeader('Cache-Control',    'no-store')
  res.setHeader('X-Kernel-Version', VERSION)
  return res.status(200).json(payload)
}

export default handler
