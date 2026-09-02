// src/app/analytics/page.tsx - Analyst View — redirects to the REAL 3D spatial intelligence page
// The 3D lives in /public/vvu-spatial-intelligence.html (2694 lines, Three.js + Canvas2D + Google Maps)
// This route simply redirects /analytics → that file, same as / → vvu-validation-dashboard.html
'use client'
import { useEffect } from 'react'

const SPATIAL_INTELLIGENCE_HREF = '/vvu-validation-dashboard.html'

export default function AnalyticsPage() {
  useEffect(() => {
    // WORM log for Gate audit
    try {
      const entry = {
        ts: new Date().toISOString(),
        event: 'ROUTE_TOGGLE',
        from: window.location.pathname,
        to: SPATIAL_INTELLIGENCE_HREF,
        fsm: 'LEAK_SIMULATION_ACTIVE',
      }
      const existing = JSON.parse(localStorage.getItem('vvu_events') || '[]')
      existing.push(entry)
      localStorage.setItem('vvu_events', JSON.stringify(existing.slice(-100)))
    } catch (e) {}

    window.location.replace(SPATIAL_INTELLIGENCE_HREF)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0e17',
        color: '#00d4ff',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        letterSpacing: '0.2em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Loading VVU Spatial Intelligence"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.3em' }}>
          VVU
        </div>
        <div style={{ marginTop: 12, opacity: 0.7 }}>
          INITIALIZING ANALYTICS WORKSPACE…
        </div>
      </div>
    </div>
  )
}
