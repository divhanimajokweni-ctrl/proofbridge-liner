'use client';

export default function CompliancePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Compliance Portal</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>KYC/AML verification, POPIA consent management, and FSCA disclosure tracking.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {[
          { title: 'KYC Verification', status: 'VERIFIED', members: '342 / 342', lastCheck: '2 min ago' },
          { title: 'AML Screening', status: 'CLEAR', flags: '0', lastCheck: '1h ago' },
          { title: 'POPIA Consent Log', status: 'ACTIVE', records: '1,247', retention: '7y' },
          { title: 'FSCA Disclosure', status: 'SUBMITTED', ref: 'FSCA-2026-0042', date: '2026-06-01' },
        ].map((item) => (
          <div key={item.title} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#526660', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              {item.title.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: '#e6edf3', marginBottom: '0.5rem' }}>
              {item.status}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8F9CAE', lineHeight: 1.6 }}>
              {Object.entries(item).filter(([k]) => !['title', 'status'].includes(k)).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c2535', padding: '0.25rem 0' }}>
                  <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
