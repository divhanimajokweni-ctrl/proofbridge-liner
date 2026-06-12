import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const { payload, signature } = body
  if (!signature) {
    return NextResponse.json({ error: 'Signature missing' }, { status: 400 })
  }
  return NextResponse.json({ minted: true, signature, payload })
}
