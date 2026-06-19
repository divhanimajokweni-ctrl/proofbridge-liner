export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace', display: 'flex' }}>
      <aside style={{ width: '240px', borderRight: '1px solid #1c2535', padding: '1rem', background: '#05070B' }}>
        <div style={{ color: '#c8a96e', fontWeight: 'bold', marginBottom: '1rem' }}>VVU APP</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
          <a href="/dashboard" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Dashboard</a>
          <a href="/dashboard/ledger" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Ledger</a>
          <a href="/dashboard/village" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Village</a>
          <a href="/dashboard/wallet" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Wallet</a>
          <a href="/compliance" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Compliance</a>
          <a href="/governance" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Governance</a>
          <a href="/trust" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Trust</a>
        </nav>
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
