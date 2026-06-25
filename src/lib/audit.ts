import { supabase } from '@/lib/supabase'
import { createChainedReceipt } from '@/prover/chain'
import { signPayload } from '@/prover/signer'

export async function persistReceipt(payload: any) {
  const { data: last, error: fetchError } = await supabase
    .from('receipts')
    .select('chain_hash')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Ignore error if table is empty
  const prevChainHash = fetchError && fetchError.code !== 'PGRST116' ? null : last?.chain_hash || null

  const chained = createChainedReceipt(
    {
      id: crypto.randomUUID(),
      prevHash: prevChainHash,
      payload,
      timestamp: Date.now()
    },
    prevChainHash
  )

  const signature = signPayload(chained)

  const { error: insertError } = await supabase.from('receipts').insert({
    ...chained,
    key_id: signature.keyId,
    signature: signature.signature
  })

  if (insertError) throw insertError

  return chained
}
