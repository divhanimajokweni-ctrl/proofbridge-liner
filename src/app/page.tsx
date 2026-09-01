'use client';
import { useEffect } from 'react';

/**
 * VVU · Landing Route — REGRESSION-PROTECTED (v5)
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DO NOT OVERWRITE THIS FILE.                                       ║
 * ║  The FIRST thing every visitor sees at `/` MUST be the VVU         ║
 * ║  Validation Dashboard with the Borromean 3-ring logo + 3D terrain  ║
 * ║  + Google Maps. That hero lives at                                 ║
 * ║  /public/vvu-validation-dashboard.html.                            ║
 * ║  This route simply redirects `/` → that file.                     ║
 * ║  If you need a different UI, put it at a DIFFERENT route.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
const VALIDATION_DASHBOARD_HREF = '/vvu-validation-dashboard.html';

export default function Home() {
  useEffect(() => {
    window.location.replace(VALIDATION_DASHBOARD_HREF);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050a18',
        color: '#F3E38A',
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
          VVU
        </div>
        <div style={{ marginTop: 12, opacity: 0.7 }}>
          INITIALIZING VALIDATION DASHBOARD…
        </div>
      </div>
    </div>
  );
}
