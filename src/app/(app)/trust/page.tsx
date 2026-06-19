'use client';

export default function TrustPage() {
  const items = [
    { label: 'ED25519 Receipts', status: 'ALL VALID', result: '342 / 342', color: '#3ecf8e' },
    { label: 'ProofBridge Anchors', status: 'SYNCED', result: 'Height 12,847,291', color: '#c8a96e' },
    { label: 'Sybil Defense (GNN)', status: 'CLEAN', result: '0 anomalies', color: '#3ecf8e' },
    { label: 'Gate-1 Flow Eval', status: 'NOMINAL', result: 'Reject 4.2%', color: '#3ecf8e' },
    { label: 'ANT Telemetry', status: 'HEALTHY', result: 'Uptime 99.8%', color: '#3ecf8e' },
    { label: 'POPIA Retention', status: 'COMPLIANT', result: 'JS2 Verified', color: '#c8a96e' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Trust & Security</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Security audit overview, signature verification, and compliance status.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {items.map((item) => (
          <div key={item.label} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#526660', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              {item.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 'bold', color: item.color }}>{item.status}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#e6edf3' }}>{item.result}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
