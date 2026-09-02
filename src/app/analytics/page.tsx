// src/app/analytics/page.tsx - Analyst View - Same FSM, Deeper Data
// Mobile-first responsive: uses JS window-width detection + CSS media queries.
'use client'
import { useEffect, useState } from 'react'
import { VVU_FSM } from '@/components/vvu-fsm-controller-20260901'

export default function AnalyticsPage() {
  const [fsm] = useState(() => new VVU_FSM())
  const [state, setState] = useState(fsm.current)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fsm.transition('INIT')
    fsm.transition('CHAL')
    fsm.transition('TOTP_OK') // -> STEADY_STATE at -33.9608,25.6022
    setState(fsm.current)
  }, [fsm])

  // JS-based responsive detection — works even when CSS media queries can't
  // (e.g. when the viewport is overridden via JS for testing).
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // CSS class for grid: single column on mobile, 12-col on desktop
  const gridClass = isMobile
    ? 'grid grid-cols-1 gap-3'
    : 'grid grid-cols-12 gap-4'

  return (
    <div className="min-h-screen bg-[#080808] text-[#c8ff00] p-3 sm:p-6 font-mono text-[11px] sm:text-xs">
      <header className="border-b border-[#c8ff00]/20 pb-3 sm:pb-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
        <h1 className="text-[13px] sm:text-base font-bold tracking-tight">VVU WORKSPACE / ANALYTICS [GATE 3B-3C]</h1>
        <span className="px-2 py-1 bg-[#c8ff00] text-black text-[10px] sm:text-xs font-bold whitespace-nowrap self-start sm:self-auto">FSM: {state}</span>
      </header>

      <div className={gridClass}>
        {/* LEFT: Map + physics overlays */}
        <div className={isMobile ? 'col-span-1' : 'lg:col-span-8 col-span-8'} style={!isMobile ? { gridColumn: 'span 8' } : undefined}>
          <div className="border border-[#c8ff00]/30 p-3 sm:p-4">
            <p className="mb-2 text-[10px] sm:text-xs">3D GIS BENCH v3 - ENU Mesh @ -33.9608,25.6022</p>
            <div className="bg-black/50 h-[280px] sm:h-[400px] lg:h-[500px] flex items-center justify-center border border-dashed">
              <span className="text-[9px] sm:text-[10px] text-center px-4">[INSERT YOUR UPSCALED 3D GIS COMPONENT HERE - keep vvu-3d-gis-bench-v3-20260901.tsx]</span>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9px] sm:text-[10px] leading-relaxed">
              <div className="border-l-2 border-[#c8ff00]/30 pl-2">Transient: 228.96kN hydrostatic | 386.69kN sep | 154.7Nm clamp [SANS 1123 PN16]</div>
              <div className="border-l-2 border-[#c8ff00]/30 pl-2">FAVAD: N1=2.5 AC degraded | SNR ≥45dB P0/P3 star ground</div>
              <div className="border-l-2 border-[#c8ff00]/30 pl-2">HBK: 614Wh 6.5kg | 8S4P 25.6V 75% I²R save | Pyrogel 0.015 W/mK</div>
            </div>
          </div>
        </div>

        {/* RIGHT: EPANET + Trust Gates + WORM */}
        <div className={isMobile ? 'col-span-1' : 'col-span-4'} style={!isMobile ? { gridColumn: 'span 4' } : undefined}>
          <div className="space-y-3 sm:space-y-4">
            <div className="border border-[#ff4400]/50 p-3">
              <h2 className="text-[#ff4400] mb-2 text-[11px] sm:text-xs font-bold">LEAK_SIMULATION_ACTIVE</h2>
              <p className="text-[10px] sm:text-[11px]">Class IV Air-Slam if wave celerity {'>'}1200 m/s</p>
              <button
                onClick={() => { fsm.transition('CLICK'); setState(fsm.current) }}
                className="mt-2 w-full bg-[#ff4400] text-black py-2.5 text-[10px] sm:text-[11px] font-bold tracking-wide active:scale-[0.98] transition-transform"
              >
                TRIGGER RAYCASTER LEAK
              </button>
              <button
                onClick={() => { fsm.transition('CLEAR'); setState(fsm.current) }}
                className="mt-1.5 w-full border border-[#ff4400] py-2.5 text-[10px] sm:text-[11px] font-bold tracking-wide active:scale-[0.98] transition-transform"
              >
                CLEAR
              </button>
            </div>

            <div className="border border-[#c8ff00]/20 p-3">
              <h2 className="text-[11px] sm:text-xs font-bold mb-2">TRUST GATES - ZERO CAPITAL</h2>
              <div className="space-y-1.5 text-[10px] sm:text-[11px]">
                <div className="flex justify-between border-b border-[#c8ff00]/10 pb-1">
                  <span>Gate 3A (1x R5k)</span>
                  <span className="text-[#c8ff00] font-bold">66.93%</span>
                </div>
                <div className="flex justify-between border-b border-[#c8ff00]/10 pb-1">
                  <span>Gate 3B (R50k MRR)</span>
                  <span className="text-[#c8ff00] font-bold">68.44%</span>
                </div>
                <div className="flex justify-between">
                  <span>Gate 3C (3 nodes)</span>
                  <span className="text-[#c8ff00] font-bold">70.66% TERMINAL</span>
                </div>
                <div className="text-[9px] opacity-60 mt-2 leading-relaxed">
                  MOI Art 5.3.4 Top-Up · Reg 2026/259053/07 · 90,900 Class A @20:1
                </div>
              </div>
            </div>

            <div className="border border-[#c8ff00]/20 p-3 h-[160px] sm:h-[200px] overflow-auto">
              <h2 className="text-[11px] sm:text-xs font-bold mb-2">WORM EVENTS (localStorage)</h2>
              <pre className="text-[8px] sm:text-[9px] mt-1 whitespace-pre-wrap break-all leading-relaxed">
                {typeof window !== 'undefined' ? localStorage.getItem('vvu_events')?.slice(-500) : '...'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-6 border-t border-[#c8ff00]/20 pt-4 text-[9px] sm:text-[10px] opacity-60 leading-relaxed">
        Vaguely Vanity (Pty) Ltd · Reg 2026/259053/07 · B-BBEE Level 1 · 135% · 100% Black Owned · CIPC RF Suffix · MOI Article 5.3.4
      </footer>
    </div>
  )
}
