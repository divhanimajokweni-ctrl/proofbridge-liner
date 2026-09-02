// src/components/WorkspaceToggle.tsx
// Mobile-safe toggle: larger touch target, responsive padding, safe-area aware.
'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function WorkspaceToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const isAnalytics = pathname?.includes('/analytics') || pathname?.includes('/workspace')

  const handleToggle = () => {
    const target = isAnalytics ? '/' : '/analytics'
    // WORM log for Gate audit
    try {
      const entry = {
        ts: new Date().toISOString(),
        event: 'ROUTE_TOGGLE',
        from: pathname,
        to: target,
        fsm: isAnalytics ? 'STEADY_STATE_LOCKED' : 'LEAK_SIMULATION_ACTIVE',
      }
      const existing = JSON.parse(localStorage.getItem('vvu_events') || '[]')
      existing.push(entry)
      localStorage.setItem('vvu_events', JSON.stringify(existing.slice(-100)))
    } catch (e) {}
    router.push(target)
  }

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={isAnalytics ? 'Switch to Operator Map View' : 'Switch to Analytics Workspace'}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] px-4 py-3 sm:px-5 sm:py-3 bg-[#c8ff00] text-black font-mono text-[10px] sm:text-[11px] font-bold tracking-widest border border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] sm:hover:translate-x-[2px] sm:hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#000] sm:hover:shadow-[2px_2px_0px_0px_#000] transition-all uppercase min-h-[44px] active:scale-[0.97]"
        style={{
          // iOS safe area support
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {isAnalytics ? '◂ MAP' : 'ANALYTICS ▸'}
        <span className="hidden sm:inline ml-1">
          {isAnalytics ? '_TWIN : OPERATOR' : '_WORKSPACE >'}
        </span>
      </button>
    </>
  )
}
