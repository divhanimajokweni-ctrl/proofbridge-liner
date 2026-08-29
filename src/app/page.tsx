'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to the black + gold Trust Dashboard — the VVU brand landing page
    window.location.replace('/vvu-trust-dashboard.html');
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#060a10',
        color: '#D4AF37',
        fontFamily: 'ui-monospace, monospace',
        gap: '1rem',
      }}
    >
      <div style={{ width: '48px', height: '48px' }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="40" r="16" stroke="#D4AF37" strokeWidth="5" />
          <circle cx="65" cy="40" r="16" stroke="#C9A84C" strokeWidth="5" />
          <circle cx="50" cy="64" r="16" stroke="#8A6E2F" strokeWidth="5" />
        </svg>
      </div>
      <h1 style={{ fontSize: '1.2em', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Venture Vision <span style={{ color: '#D4AF37' }}>Ubuntu</span>
      </h1>
      <p style={{ fontSize: '0.7em', color: '#5b7280', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Trust Runtime · Loading…
      </p>
    </div>
  );
}
