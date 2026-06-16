'use client';

export default function LedgerPage() {
  const txns = [
    { id: 'TX-4821', pool: 'Gqeberha Builders', type: 'CONTRIBUTION', amount: 'R 500', status: 'CONFIRMED', time: '2 min ago' },
    { id: 'TX-4820', pool: 'Khayelitsha Stokvel', type: 'PAYOUT', amount: 'R 5,000', status: 'PENDING', time: '18 min ago' },
    { id: 'TX-4819', pool: 'Mitchells Plain', type: 'CONTRIBUTION', amount: 'R 1,200', status: 'CONFIRMED', time: '32 min ago' },
    { id: 'TX-4818', pool: 'New Brighton', type: 'ANCHOR', amount: '—', status: 'CONFIRMED', time: '1h ago' },
    { id: 'TX-4817', pool: 'Gqeberha Builders', type: 'CONTRIBUTION', amount: 'R 500', status: 'CONFIRMED', time: '1d ago' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Ledger</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Cryptographic transaction records, immutable and on-chain verified.</p>

      <div style={{ border: '1px solid #1c2535', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#0a0d12', borderBottom: '1px solid #1c2535' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>TX ID</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pool</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#8F9CAE', fontWeight: 'normal', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1c2535' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#c8a96e' }}>{t.id}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#e6edf3' }}>{t.pool}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.type}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#e6edf3' }}>{t.amount}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'DM Mono, monospace',
                    background: t.status === 'CONFIRMED' ? 'rgba(62,207,142,0.1)' : 'rgba(232,160,32,0.1)',
                    color: t.status === 'CONFIRMED' ? '#3ecf8e' : '#E8A020',
                    border: `1px solid ${t.status === 'CONFIRMED' ? 'rgba(62,207,142,0.3)' : 'rgba(232,160,32,0.3)'}`,
                  }}>{t.status}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#526660' }}>{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
