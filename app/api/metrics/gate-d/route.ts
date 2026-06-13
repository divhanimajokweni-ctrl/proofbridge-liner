import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

function sha256(s: string) { return createHash('sha256').update(s).digest('hex') }

const EVENT_TYPES = ['PROPOSAL_INTAKE','HMAC_SIGN','FROST_SIGN','ANCHOR_POLYGON','RECONCILE_OK','STITCH_DELIVER']

export async function GET() {
  const now = Date.now()
  const datadogIngest = Math.random() > 0.03
  const deterministic = Math.random() > 0.01

  const lastReconcileRun = new Date(now - Math.floor(Math.random() * 120000))
    .toISOString().slice(11, 19) + ' UTC'

  const events = Array.from({ length: 10 }, (_, i) => {
    const type    = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
    const payload = JSON.stringify({ type, i, ts: now - i * 60000 })
    const ts      = new Date(now - i * 60000).toISOString().slice(11, 19)
    return { ts, type, sha256: sha256(payload) }
  })

  return NextResponse.json({
    statusLabel: deterministic && datadogIngest ? 'ANCHORED' : 'DEGRADED',
    status: deterministic && datadogIngest ? 'complete' : 'warn',
    lastReconcileRun,
    datadogIngest,
    deterministic,
    events,
    ts: now,
  })
}
