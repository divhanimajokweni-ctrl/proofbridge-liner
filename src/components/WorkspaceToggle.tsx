// src/components/WorkspaceToggle.tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function WorkspaceToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const isAnalytics = pathname?.includes('/analytics') || pathname?.includes('/workspace')

  const handleToggle = () => {
    const target = isAnalytics? '/' : '/analytics'
    // WORM log for Gate audit
    try {
      const entry = { ts: new Date().toISOString(), event: 'ROUTE_TOGGLE', from: pathname, to: target, fsm: isAnalytics? 'STEADY_STATE_LOCKED' : 'LEAK_SIMULATION_ACTIVE' }
      const existing = JSON.parse(localStorage.getItem('vvu_events') || '[]')
      existing.push(entry)
      localStorage.setItem('vvu_events', JSON.stringify(existing.slice(-100)))
    } catch(e){}
    router.push(target)
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle workspace"
      className="fixed bottom-6 right-6 z-[9999] px-5 py-3 bg-[#c8ff00] text-black font-mono text-[11px] font-bold tracking-widest border border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all uppercase"
    >
      {isAnalytics? '< MAP_TWIN : OPERATOR' : 'WORKSPACE_ANALYTICS >'}
    </button>
  )
}
