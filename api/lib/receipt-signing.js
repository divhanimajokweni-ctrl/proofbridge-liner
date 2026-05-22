import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'

const REQUIRED_PRIVATE_KEY_ENV = 'PROOFBRIDGE_RECEIPT_PRIVATE_KEY'
const OPTIONAL_PUBLIC_KEY_ENV = 'PROOFBRIDGE_RECEIPT_PUBLIC_KEY'

export function canonicalJSON(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJSON(entry)).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`
}

export function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePem(raw) {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (trimmed.includes('-----BEGIN ')) return trimmed.replace(/\\n/g, '\n')

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim()
    if (decoded.includes('-----BEGIN ')) return decoded
  } catch (_) {}

  return trimmed
}

export function getReceiptPrivateKey() {
  const pem = normalizePem(process.env[REQUIRED_PRIVATE_KEY_ENV])
  if (!pem) {
    throw new Error(`${REQUIRED_PRIVATE_KEY_ENV} is required for Gate-1 RS256 receipt signing`)
  }
  return createPrivateKey(pem)
}

export function getReceiptPublicKey(privateKeyObject) {
  const publicPem = normalizePem(process.env[OPTIONAL_PUBLIC_KEY_ENV])
  if (publicPem) return createPublicKey(publicPem)
  return createPublicKey(privateKeyObject)
}

export function signReceiptPayload(payload) {
  const privateKey = getReceiptPrivateKey()
  const canonicalPayload = canonicalJSON(payload)
  const signature = sign('RSA-SHA256', Buffer.from(canonicalPayload), privateKey).toString('base64url')
  const publicKey = getReceiptPublicKey(privateKey)
  const verified = verify('RSA-SHA256', Buffer.from(canonicalPayload), publicKey, Buffer.from(signature, 'base64url'))

  if (!verified) throw new Error('RS256 receipt self-verification failed')

  return {
    alg: 'RS256',
    signature,
    payload_hash: sha256Hex(canonicalPayload),
    key_ref: process.env.PROOFBRIDGE_RECEIPT_KEY_ID || 'proofbridge-gate1-rs256',
  }
}

export function attachReceiptSignature(payload) {
  return {
    ...payload,
    signature: signReceiptPayload(payload),
  }
}
