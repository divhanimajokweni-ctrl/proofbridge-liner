import React from 'react';

export default function Disclaimer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      background: '#0C0C0A',
      padding: '2.5rem 1.5rem',
      fontFamily: '"DM Mono", monospace',
      fontSize: '0.65rem',
      color: '#5A5A55',
      lineHeight: '1.6',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <p style={{ color: '#CC7722', fontWeight: 700, marginBottom: '0.75rem' }}>🚨 PILOT PROGRAM DISCLAIMER</p>
        <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.5)' }}>
          VVU is a pilot service under active development. All metrics displayed are <span style={{ textDecoration: 'underline' }}>SIMULATED</span> for demonstration unless explicitly labeled as LIVE in production environments. TEE attestation is currently software-attested.
        </p>
        <p style={{ color: '#8A9A5B', fontSize: '0.6rem' }}>
          POPIA §18 Compliant · FSCA JS2 Regulatory Framework · Gqeberha, Eastern Cape, South Africa
        </p>
      </div>
    </footer>
  );
}
