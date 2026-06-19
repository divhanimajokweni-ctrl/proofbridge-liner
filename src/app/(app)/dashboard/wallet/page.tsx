'use client';

export default function WalletPage() {
  const accounts = [
    { name: 'Primary Vault', balance: 'R 127,450', type: 'SAVINGS', locked: 'R 0', apy: '0%' },
    { name: 'Pool Escrow', balance: 'R 45,200', type: 'ESCROW', locked: 'R 12,500', apy: '—' },
    { name: 'Ubuntu Rewards', balance: 'R 3,200', type: 'REWARDS', locked: 'R 0', apy: '0%' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Wallet</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Financial operations, vault balances, and escrow management.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {accounts.map((a) => (
          <div key={a.name} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.5rem',
            background: '#0d1117',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#526660', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>{a.type}</span>
              <span style={{ fontSize: '0.65rem', color: '#526660', fontFamily: 'DM Mono, monospace' }}>LIVE</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#e6edf3', marginBottom: '0.25rem' }}>{a.balance}</div>
            <div style={{ fontSize: '0.75rem', color: '#8F9CAE', marginBottom: '1rem' }}>{a.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#526660', borderTop: '1px solid #1c2535', paddingTop: '0.75rem' }}>
              <span>Locked: {a.locked}</span>
              <span>APY: {a.apy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
