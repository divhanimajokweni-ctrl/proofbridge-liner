import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const startedAt = Date.now()

function formatUptime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export async function GET() {
  const uptimeMs = Date.now() - startedAt
  const tx24h = Number(process.env.VVU_TX_24H || process.env.NEXT_PUBLIC_VVU_TX_24H || 0)
  const avgGas = process.env.VVU_AVG_GAS || process.env.NEXT_PUBLIC_VVU_AVG_GAS || '--'
  const p99Lat = Number(process.env.VVU_P99_LAT_MS || process.env.NEXT_PUBLIC_VVU_P99_LAT_MS || 0)
  const drift = Number(process.env.VVU_DRIFT_MS || process.env.NEXT_PUBLIC_VVU_DRIFT_MS || 0)

  return NextResponse.json({
    uptime: formatUptime(uptimeMs),
    uptimeMs,
    tx24h,
    avgGas,
    p99Lat,
    drift,
    sampledAt: new Date().toISOString(),
  })
}
