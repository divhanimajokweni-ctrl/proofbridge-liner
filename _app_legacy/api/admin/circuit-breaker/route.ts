import { NextResponse, NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { action } = body ?? {}

  if (action !== 'close' && action !== 'open') {
    return NextResponse.json({ ok: false, error: 'invalid_action', allowed: ['close', 'open'] }, { status: 400 })
  }

  // In production this would call CircuitBreaker.sol via ethers.js
  // For now returns a signed acknowledgement
  return NextResponse.json({
    ok: true,
    action,
    message: `Circuit ${action} acknowledged`,
    ts: Date.now(),
  })
}
