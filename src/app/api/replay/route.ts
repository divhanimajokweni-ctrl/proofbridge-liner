import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePosteriorMean } from '@/prover/scorer'
import { canonicalize } from '@/prover/chain'
import { createHash } from 'crypto'

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest) {
  const { receiptId } = await req.json()

  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .single()

  if (error || !receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  // Recompute deterministic outcome
  // Note: This assumes the payload contains the necessary alpha/beta or similar inputs
  const { alpha, beta } = receipt.payload
  const recomputed = computePosteriorMean(
    receipt.payload.mismatches,
    receipt.payload.total,
    alpha,
    beta
  )

  const recomputedHash = hash(
    canonicalize({
      ...receipt.payload,
      recomputed
    })
  )

  const match = recomputedHash === receipt.receipt_hash

  return NextResponse.json({
    receiptId,
    match,
    originalHash: receipt.receipt_hash,
    recomputedHash
  })
}
