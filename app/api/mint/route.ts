import { NextResponse } from 'next/server'
import crypto from 'crypto'

function verifyHmac(payload: unknown, signature: string, secret: string): boolean {
  if (!secret || !signature) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  try {
    const a = new Uint8Array(Buffer.from(expected, 'hex'))
    const b = new Uint8Array(Buffer.from(signature, 'hex'))
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function computeEventHash(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { payload, signature } = body
  if (!payload || !signature) {
    return NextResponse.json({ error: 'Missing payload or signature' }, { status: 400 })
  }

  const secret = process.env.STITCH_WEBHOOK_SECRET || ''
  if (!secret) {
    return NextResponse.json({
      error: 'HMAC secret not configured',
      minted: false,
    }, { status: 500 })
  }

  const valid = verifyHmac(payload, signature, secret)
  if (!valid) {
    return NextResponse.json({
      error: 'HMAC_VERIFICATION_FAILED',
      minted: false,
    }, { status: 401 })
  }

  const eventHash = computeEventHash(payload)

  return NextResponse.json({
    minted: true,
    eventHash: eventHash.slice(0, 16),
    signature,
    payload,
  })
}
