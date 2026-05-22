import { randomUUID } from 'node:crypto'
import { attachReceiptSignature, canonicalJSON, sha256Hex } from '../lib/receipt-signing.js'
import { readJsonBody } from '../lib/request-body.js'

const SCHEMA_VERSION = 'liquidity-leap.telemetry.v1'
const MAX_BODY_BYTES = 16 * 1024
const EVENTS = new Set([
  'SESSION_CONNECTED',
  'PLAYER_JUMP_ACTION',
  'MARKET_SHOCK_STARTED',
  'MARKET_SHOCK_ENDED',
  'VALIDATION_REQUIRED',
])

function finiteNumber(value, name, min, max, errors) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    errors.push(`${name} must be a finite number in [${min}, ${max}]`)
  }
  return n
}

function requireString(value, name, errors, maxLength = 96) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    errors.push(`${name} must be a non-empty string with length <= ${maxLength}`)
    return ''
  }
  return value.trim()
}

function assertTelemetryAuth(req) {
  const expected = process.env.LIQUIDITY_LEAP_TELEMETRY_KEY
  if (!expected) return
  const supplied = req.headers?.['x-proofbridge-telemetry-key']
  if (supplied !== expected) throw new Error('UNAUTHORIZED_TELEMETRY_INGRESS')
}

function riskDecision(body) {
  const shockActive = body.shock_type && body.shock_type !== 'NONE'
  const panicAction = body.last_action === 'JUMP_HIGH_RISK' && shockActive
  const unstableImpulse = body.impulse_stability_score < 0.35
  const depletedPool = body.current_pool_balance <= 0
  const validation_required = panicAction || unstableImpulse || depletedPool

  return {
    validation_required,
    reasons: [
      panicAction ? 'PANIC_BUY_DURING_MARKET_SHOCK' : null,
      unstableImpulse ? 'IMPULSE_STABILITY_BELOW_0_35' : null,
      depletedPool ? 'POOL_BALANCE_DEPLETED' : null,
    ].filter(Boolean),
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed', allowed: ['POST'] })
  }

  try {
    assertTelemetryAuth(req)
  } catch (err) {
    return res.status(401).json({ ok: false, error: err.message })
  }

  let body
  try {
    body = await readJsonBody(req, { maxBytes: MAX_BODY_BYTES })
  } catch (_) {
    return res.status(400).json({ ok: false, error: 'INVALID_JSON' })
  }

  const errors = []
  const schemaVersion = requireString(body.schema_version, 'schema_version', errors)
  const sessionId = requireString(body.session_id, 'session_id', errors)
  const gameEvent = requireString(body.game_event, 'game_event', errors)
  const lastAction = requireString(body.last_action, 'last_action', errors)
  const assetClass = requireString(body.asset_class, 'asset_class', errors)
  const shockType = requireString(body.shock_type, 'shock_type', errors)
  const currentPoolBalance = finiteNumber(body.current_pool_balance, 'current_pool_balance', 0, 1000000000, errors)
  const impulseStabilityScore = finiteNumber(body.impulse_stability_score, 'impulse_stability_score', 0, 1, errors)
  const volatilityMultiplier = finiteNumber(body.volatility_multiplier, 'volatility_multiplier', 0, 1000, errors)
  const clientUnixMs = finiteNumber(body.client_unix_ms, 'client_unix_ms', 0, 9999999999999, errors)

  if (schemaVersion !== SCHEMA_VERSION) errors.push(`schema_version must equal ${SCHEMA_VERSION}`)
  if (!EVENTS.has(gameEvent)) errors.push(`game_event must be one of ${Array.from(EVENTS).join(', ')}`)

  if (errors.length) {
    return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', errors })
  }

  const normalized = {
    schema_version: schemaVersion,
    session_id: sessionId,
    game_event: gameEvent,
    last_action: lastAction,
    asset_class: assetClass,
    shock_type: shockType,
    current_pool_balance: Number(currentPoolBalance.toFixed(6)),
    impulse_stability_score: Number(impulseStabilityScore.toFixed(6)),
    volatility_multiplier: Number(volatilityMultiplier.toFixed(6)),
    client_unix_ms: Math.trunc(clientUnixMs),
  }
  const decision = riskDecision(normalized)
  const receipt = attachReceiptSignature({
    ok: true,
    receipt_id: randomUUID(),
    received_at: new Date().toISOString(),
    ingress: 'liquidity-leap',
    telemetry_hash: sha256Hex(canonicalJSON(normalized)),
    telemetry: normalized,
    decision,
    program_version_raw: 'liquidity-leap-ingress-1',
  })

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(receipt)
}

export default handler
