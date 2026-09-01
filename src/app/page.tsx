'use client';
import { useEffect } from 'react';

/**
 * VVU · Landing Route — REGRESSION-PROTECTED (v5)
 * ==============================================
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DO NOT OVERWRITE THIS FILE.                                       ║
 * ║  The user has explicitly stated — multiple times — that the       ║
 * ║  FIRST thing every visitor sees at `/` MUST be the VVU             ║
 * ║  Validation Dashboard with the 3D terrain + Google Maps.           ║
 * ║  That hero lives at /public/vvu-validation-dashboard.html.         ║
 * ║  This route simply redirects `/` → that file.                     ║
 * ║                                                                    ║
 * ║  If you need to build a different UI, put it at a DIFFERENT        ║
 * ║  route (e.g. /ive, /dashboard), NOT at `/`.                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * CONTRACT: VALIDATION_DASHBOARD_HREF below is the canonical path to
 * the landing file. If the file is renamed, update BOTH the file and
 * this constant together — they are a pair.
 *
 * The Google Maps API key is hardcoded in the HTML file directly
 * (AIzaSyDvWTTuSKTIbs1g8m5XIjh3eWZSPb8M_a0) AND set in .env as
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 *
 * Mission Flow (4 stages):
 *   01: Validation Dashboard (this landing) →
 *   02: Spatial Intelligence (/vvu-spatial-intelligence.html) →
 *   03: B2B Dashboard (/searm1-b2b-dashboard.html) →
 *   04: GIS Verification Bench (/vvu-gis-bench.html)
 */

// ─── CONTRACT: update this if the landing file is ever renamed ────────
const VALIDATION_DASHBOARD_HREF = '/vvu-validation-dashboard.html';

export default function Home() {
  useEffect(() => {
    window.location.replace(VALIDATION_DASHBOARD_HREF);
  }, []);

  // While the redirect is in flight, render the same dark background as
  // the landing page so there is no white flash.
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050a18',
        color: '#D4AF37',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        letterSpacing: '0.2em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Loading VVU Validation Dashboard"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.3em' }}>
          ▲ VVU
        </div>
        <div style={{ marginTop: 12, opacity: 0.7 }}>
          INITIALIZING VALIDATION DASHBOARD…
        </div>
      </div>
    </div>
  );
}
