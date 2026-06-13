import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

function randHex(n: number) { return createHash('sha256').update(String(Math.random())).digest('hex').slice(0, n) }

export async function GET() {
  const now = Date.now()
  const deflections1h   = Math.floor(Math.random() * 4)
  const redlockActive   = Math.floor(Math.random() * 20 + 40)
  const replayAttempts  = Math.floor(Math.random() * 2)
  const healthy = deflections1h < 10 && replayAttempts < 5

  const logs = Array.from({ length: 8 }, (_, i) => {
    const deflected = Math.random() < 0.15
    const ts = new Date(now - (7 - i) * 420000).toISOString().slice(11, 19)
    return { ts, event: 'webhook.mint', deflected, sig: randHex(64) }
  })

  const labels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now - (11 - i) * 3600000)
    return `${String(d.getHours()).padStart(2,'0')}:00`
  })

  return NextResponse.json({
    healthy,
    deflections1h,
    redlockActive,
    replayAttempts,
    logs,
    chart: {
      labels,
      deflections: labels.map(() => Math.floor(Math.random() * 3)),
    },
    ts: now,
  })
}
