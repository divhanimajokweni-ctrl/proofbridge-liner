import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

const CONTRACT_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS ?? '0x' + createHash('sha256').update('mock-contract').digest('hex').slice(0, 40)
const ORACLE_ADDRESS   = process.env.HEALTH_ORACLE_ADDRESS   ?? '0x' + createHash('sha256').update('mock-oracle').digest('hex').slice(0, 40)

function randHex(n: number) { return createHash('sha256').update(String(Math.random())).digest('hex').slice(0, n) }

export async function GET() {
  const now        = Date.now()
  const circuitOpen = Math.random() < 0.05
  const drift       = Math.floor(Math.random() * 350) + 'ms'

  const anchors = Array.from({ length: 6 }, (_, i) => ({
    block: 14000000 + Math.floor(Math.random() * 999999),
    hash:  randHex(64),
    tx:    '0x' + randHex(64),
    ts:    new Date(now - (5 - i) * 1800000).toISOString(),
  }))

  return NextResponse.json({
    address: CONTRACT_ADDRESS,
    circuitOpen,
    drift,
    hookIntegrated: true,
    oracle: ORACLE_ADDRESS,
    anchors,
    ts: now,
  })
}
