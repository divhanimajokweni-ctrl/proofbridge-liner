import { NextResponse } from 'next/server'
import { createHash, createHmac } from 'node:crypto'

const SECRET = process.env.PROOFBRIDGE_HMAC_SECRET ?? 'dev-secret'

function randHex(n: number) { return createHash('sha256').update(String(Math.random())).digest('hex').slice(0, n) }
function betaMean(a: number, b: number) { return (a + 1) / (a + b + 2) }

export async function GET() {
  const now = Date.now()
  const alpha = Math.floor(Math.random() * 30 + 20)
  const beta  = Math.floor(Math.random() * 10 + 5)
  const avgMu = betaMean(alpha, beta)
  const rejectRate = Math.random() * 0.12 + 0.03

  const queue = Array.from({ length: 20 }, (_, i) => {
    const mu = Math.random() * 0.6 + 0.35
    const ts = new Date(now - (19 - i) * 180000).toISOString().slice(11, 19)
    return { id: `prop_${randHex(6)}`, mu: +mu.toFixed(4), ts }
  })

  const labels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now - (11 - i) * 3600000)
    return `${String(d.getHours()).padStart(2,'0')}:00`
  })

  const hmac = createHmac('sha256', SECRET).update(JSON.stringify({ avgMu, rejectRate, ts: now })).digest('hex')

  return NextResponse.json({
    statusLabel: 'ACTIVE',
    status: avgMu >= 0.60 ? 'complete' : 'warn',
    avgMu: +avgMu.toFixed(4),
    rejectRate: +rejectRate.toFixed(4),
    queue,
    chart: {
      labels,
      mu: labels.map(() => +(Math.random() * 0.4 + 0.45).toFixed(4)),
    },
    hmac,
    ts: now,
  })
}
