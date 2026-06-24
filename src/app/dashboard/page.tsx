'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [receipts, setReceipts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/receipts')
      .then(r => r.json())
      .then(setReceipts)
  }, [])

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-bold">Audit Dashboard</h1>

      {receipts.map(r => (
        <div key={r.id} className="border p-4 rounded-2xl shadow">
          <div className="text-sm text-gray-500">{r.id}</div>
          <div>Chain Hash: {r.chain_hash.slice(0, 16)}...</div>
          <div>Receipt Hash: {r.receipt_hash.slice(0, 16)}...</div>
          <button
            onClick={async () => {
              const res = await fetch('/api/replay', {
                method: 'POST',
                body: JSON.stringify({ receiptId: r.id })
              })
              const result = await res.json()
              alert(result.match ? '✅ Valid' : '❌ Tampered')
            }}
            className="mt-2 bg-black text-white px-3 py-1 rounded"
          >
            Verify Replay
          </button>
        </div>
      ))}
    </div>
  )
}
