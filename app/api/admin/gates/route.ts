import { NextResponse } from 'next/server'

const GATES = [
  { id: 'A', label: 'Origination',     description: 'Inbound proposal intake and μ scoring' },
  { id: 'B', label: 'Stitch/Replay',   description: 'Webhook replay protection and Redlock' },
  { id: 'C', label: 'Bayesian Safety', description: 'Beta posterior inference and HMAC chain' },
  { id: 'D', label: 'Evidence',        description: 'Immutable audit chain and reconciler' },
  { id: 'E', label: 'FROST Signer',    description: 'Threshold signatures 3-of-5' },
  { id: 'F', label: 'Settlement',      description: 'Polygon Amoy on-chain anchoring' },
]

export async function GET() {
  const gates = GATES.map(g => {
    let status = 'complete'
    let statusLabel = 'NOMINAL'
    let gaps: string[] = []

    if (g.id === 'D') {
      status = 'not_implemented'
      statusLabel = 'NOT IMPLEMENTED'
      gaps = ['Hash chain integrity monitoring not wired to API']
    } else if (g.id === 'F') {
      status = 'complete'
      statusLabel = 'NOMINAL'
      gaps = []
    }

    return {
      ...g,
      status,
      statusLabel,
      gaps,
      ts: Date.now(),
    }
  })
  return NextResponse.json(gates)
}
