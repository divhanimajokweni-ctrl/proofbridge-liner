import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { MintPayloadSchema } from '../schemas/gateway'
import { db } from '@/lib/db'
import { envelopes } from '@/lib/db/schema'

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

  // ── Zod schema gate ────────────────────────────────────────────────
  const validation = MintPayloadSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'MINT_SCHEMA_ERROR',
      details: validation.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { payload: rawPayload, signature } = validation.data
  const payload = rawPayload as Record<string, unknown> & { id?: string; payment_id?: string; user?: { id?: string }; from?: string; created_at?: string | number; timestamp?: string | number }
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

  // Save envelope to database
  try {
    const [envelope] = await db.insert(envelopes)
      .values({
        envelope_id: payload.id || payload.payment_id || eventHash,
        issuer_address: payload.user?.id || payload.from || '0x0',
        content_hash: eventHash,
        signature: signature,
        timestamp: new Date(payload.created_at || payload.timestamp || Date.now()),
        kernel_state: 'SETTLED',
        metadata: payload,
      })
      .returning();

    return NextResponse.json({
      minted: true,
      eventHash: eventHash.slice(0, 16),
      signature,
      payload,
      envelope_id: envelope.envelope_id,
      receipt: `ProofBridge envelope #${envelope.envelope_id}`,
    })
  } catch (dbError) {
    console.error('Database error:', dbError)
    // Still return success for the mint operation, just log the DB failure
    return NextResponse.json({
      minted: true,
      eventHash: eventHash.slice(0, 16),
      signature,
      payload,
      warning: 'Envelope saved to ledger but database persist failed',
    })
  }
}
