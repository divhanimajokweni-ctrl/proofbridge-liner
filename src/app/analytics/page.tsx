// src/app/analytics/page.tsx - Analyst View - Same FSM, Deeper Data
'use client'
import { useEffect, useState } from 'react'
import { VVU_FSM } from '@/components/vvu-fsm-controller-20260901'

export default function AnalyticsPage() {
  const [fsm] = useState(() => new VVU_FSM())
  const [state, setState] = useState(fsm.current)

  useEffect(() => {
    fsm.transition('INIT')
    fsm.transition('CHAL')
    fsm.transition('TOTP_OK') // -> STEADY_STATE at -33.9608,25.6022
    setState(fsm.current)
  }, [fsm])

  return (
    <div className="min-h-screen bg-[#080808] text-[#c8ff00] p-6 font-mono text-xs">
      <header className="border-b border-[#c8ff00]/20 pb-4 mb-6 flex justify-between">
        <h1>VVU WORKSPACE / ANALYTICS [GATE 3B-3C]</h1>
        <span className="px-2 py-1 bg-[#c8ff00] text-black">FSM: {state}</span>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Same map but with physics overlays */}
        <div className="col-span-8 border border-[#c8ff00]/30 h-[600px] p-4">
          <p className="mb-2">3D GIS BENCH v3 - ENU Mesh @ -33.9608,25.6022</p>
          <div className="bg-black/50 h-[500px] flex items-center justify-center border border-dashed">
            {/* TODO: Paste your upscaled 3D component here */}
            <span>[INSERT YOUR UPSCALED 3D GIS COMPONENT HERE - keep vvu-3d-gis-bench-v3-20260901.tsx]</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
            <div>Transient: 228.96kN hydrostatic | 386.69kN sep | 154.7Nm clamp [SANS 1123 PN16]</div>
            <div>FAVAD: N1=2.5 AC degraded | SNR ≥45dB P0/P3 star ground</div>
            <div>HBK: 614Wh 6.5kg | 8S4P 25.6V 75% I²R save | Pyrogel 0.015 W/mK</div>
          </div>
        </div>

        {/* RIGHT: EPANET + CORROSION */}
        <div className="col-span-4 space-y-4">
          <div className="border border-[#ff4400]/50 p-3">
            <h2 className="text-[#ff4400] mb-2">LEAK_SIMULATION_ACTIVE</h2>
            <p>Class IV Air-Slam if wave celerity {'>'}1200 m/s</p>
            <button onClick={()=>{fsm.transition('CLICK'); setState(fsm.current)}} className="mt-2 w-full bg-[#ff4400] text-black py-2">TRIGGER RAYCASTER LEAK</button>
            <button onClick={()=>{fsm.transition('CLEAR'); setState(fsm.current)}} className="mt-1 w-full border border-[#ff4400] py-2">CLEAR</button>
          </div>
          <div className="border border-[#c8ff00]/20 p-3">
            <h2>TRUST GATES - ZERO CAPITAL EDITION</h2>
            <div className="mt-2 space-y-1">
              <div>Gate 3A (1x R5k): +10k Class B = 66.93%</div>
              <div>Gate 3B (R50k MRR): +40k Class B = 68.44%</div>
              <div>Gate 3C (3 nodes): +59.1k Class B = 70.66% TERMINAL</div>
              <div className="text-[10px] opacity-60">MOI Art 5.3.4 Top-Up, Reg 2026/259053/07, 90,900 Class A @20:1</div>
            </div>
          </div>
          <div className="border border-[#c8ff00]/20 p-3 h-[200px] overflow-auto">
            <h2>WORM EVENTS (localStorage)</h2>
            <pre className="text-[9px] mt-2">{typeof window!== 'undefined'? localStorage.getItem('vvu_events')?.slice(-500) : '...'}</pre>
          </div>
        </div>
      </div>

      <footer className="mt-6 border-t border-[#c8ff00]/20 pt-4 text-[10px] opacity-60">
        Vaguely Vanity (Pty) Ltd · Reg 2026/259053/07 · B-BBEE Level 1 · 135% · 100% Black Owned · CIPC RF Suffix · MOI Article 5.3.4
      </footer>
    </div>
  )
}
