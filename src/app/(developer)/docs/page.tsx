'use client';

export default function DocsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>API & SDK Documentation</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Technical documentation for ProofBridge, Ubuntu Score API, Stitch integration, and ANT Telemetry.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {[
          { title: 'ProofBridge REST API', method: 'REST', endpoint: '/api/v1/proofbridge' },
          { title: 'Ubuntu Score SDK', method: 'TS / PY', endpoint: '@vvu/score-sdk' },
          { title: 'Stitch Webhooks', method: 'Webhook', endpoint: '/api/v1/webhooks/stitch' },
          { title: 'ANT Telemetry Stream', method: 'WebSocket', endpoint: 'wss://ant.vvu.africa/v1/stream' },
        ].map((doc) => (
          <div key={doc.title} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'DM Mono, monospace', color: '#c8a96e', padding: '2px 6px', border: '1px solid #1c2535', borderRadius: '4px' }}>{doc.method}</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 'bold', color: '#e6edf3', marginBottom: '0.25rem' }}>{doc.title}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#526660' }}>{doc.endpoint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
