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
    const circuitOpen = g.id === 'F' && Math.random() < 0.05
    const status = circuitOpen ? 'circuit_open' : 'complete'
    return {
      ...g,
      status,
      statusLabel: circuitOpen ? 'CIRCUIT OPEN' : 'NOMINAL',
      gaps: circuitOpen ? ['drift > threshold: Canton/Polygon parity mismatch'] : [],
      ts: Date.now(),
    }
  })
  return NextResponse.json(gates)
}
