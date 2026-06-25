'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/receipts')
      .then(r => r.json())
      .then(setReceipts)
  }, [])

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-bold">Audit Dashboard</h1>

      {receipts.map(r => (
        <div key={r.id} className="border p-4 rounded-2xl shadow cursor-pointer" onClick={() => setSelectedEvent(r)}>
          <div className="text-sm text-gray-500">{r.id}</div>
          <div>Chain Hash: {r.chain_hash.slice(0, 16)}...</div>
          <div>Receipt Hash: {r.receipt_hash.slice(0, 16)}...</div>
        </div>
      ))}

      {selectedEvent && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow space-y-3 border">
          <h2 className="font-bold text-xl">AI Compliance Analysis</h2>
          <p><b>Transaction:</b> {selectedEvent.id}</p>
          <div className="bg-gray-50 p-4 rounded">
            <p><b>Summary:</b> {selectedEvent.payload.explanation?.summary || 'N/A'}</p>
            <p><b>Root Cause:</b> {selectedEvent.payload.explanation?.root_cause || 'N/A'}</p>
            <p><b>Impact:</b> {selectedEvent.payload.explanation?.impact || 'N/A'}</p>
            <p><b>Recommended Action:</b> {selectedEvent.payload.explanation?.recommended_action || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
