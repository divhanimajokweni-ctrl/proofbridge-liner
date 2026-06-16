'use client';

export default function GovernancePage() {
  const proposals = [
    { id: 'PROP-47', title: 'Increase Steward pool cap to R50,000', quorum: '71.3%', threshold: '67%', status: 'ACTIVE', closes: '18h 42m' },
    { id: 'PROP-46', title: 'Add Merchant verification tier (Level 2)', quorum: '100%', threshold: '80%', status: 'PASSED', closes: 'Closed' },
    { id: 'PROP-45', title: 'Extend Ubuntu Score weighting to smallholders', quorum: '88.1%', threshold: '67%', status: 'PASSED', closes: 'Closed' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Governance</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Voting, proposal management, DAO controls, and liquid democracy delegation.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {proposals.map((p) => (
          <div key={p.id} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#c8a96e' }}>{p.id}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'DM Mono, monospace',
                  background: p.status === 'ACTIVE' ? 'rgba(232,160,32,0.1)' : 'rgba(62,207,142,0.1)',
                  color: p.status === 'ACTIVE' ? '#E8A020' : '#3ecf8e',
                  border: `1px solid ${p.status === 'ACTIVE' ? 'rgba(232,160,32,0.3)' : 'rgba(62,207,142,0.3)'}`,
                }}>{p.status}</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 'bold', color: '#e6edf3', marginBottom: '0.5rem' }}>{p.title}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#8F9CAE' }}>
                <span>Quorum: <span style={{ color: '#c8a96e', fontFamily: 'DM Mono, monospace' }}>{p.quorum}</span></span>
                <span>Threshold: <span style={{ color: '#c8a96e', fontFamily: 'DM Mono, monospace' }}>{p.threshold}</span></span>
                <span>Closes: <span style={{ fontFamily: 'DM Mono, monospace' }}>{p.closes}</span></span>
              </div>
            </div>
            <div style={{ marginLeft: '1.5rem' }}>
              <button style={{
                padding: '0.5rem 1rem', borderRadius: '6px',
                background: 'var(--ink)', color: 'var(--amber)',
                fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', border: '1px solid #1c2535',
                cursor: 'pointer',
              }}>VOTE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
