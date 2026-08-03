import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

function randHex(n: number) { return createHash('sha256').update(String(Math.random())).digest('hex').slice(0, n) }

export async function GET() {
  const now = Date.now()

  const signers = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    online: Math.random() > 0.05,
  }))

  const onlineCount = signers.filter(s => s.online).length
  const groupKey    = randHex(64)
  const lastSig     = randHex(64)
  const verifyRate  = +(Math.random() * 0.02 + 0.98).toFixed(4)

  const logs = Array.from({ length: 6 }, (_, i) => {
    const available = signers.filter(s => s.online).map(s => s.id)
    const chosen    = available.sort(() => Math.random() - 0.5).slice(0, 3)
    const ts        = new Date(now - (5 - i) * 600000).toISOString().slice(11, 19)
    return {
      ts,
      proposal_id: `prop_${randHex(6)}`,
      signer_ids: chosen,
      verified: chosen.length >= 3,
    }
  })

  return NextResponse.json({
    statusLabel: onlineCount >= 3 ? 'THRESHOLD MET' : 'BELOW THRESHOLD',
    status: onlineCount >= 3 ? 'complete' : 'error',
    groupKey,
    lastSig,
    verifyRate,
    signers,
    logs,
    ts: now,
  })
}
