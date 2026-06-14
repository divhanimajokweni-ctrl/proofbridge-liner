export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace' }}>
      <header style={{ borderBottom: '1px solid #1c2535', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#05070B' }}>
        <div style={{ fontWeight: 'bold', color: '#c8a96e', letterSpacing: '0.1em' }}>VENTURE VISION UBUNTU</div>
        <nav style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: '#8F9CAE' }}>
          <a href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="/faqs" style={{ color: 'inherit', textDecoration: 'none' }}>FAQs</a>
          <a href="/ubuntu-pools" style={{ color: 'inherit', textDecoration: 'none' }}>Ubuntu Pools</a>
          <a href="/dashboard" style={{ color: '#00E5FF', textDecoration: 'none' }}>Dashboard</a>
        </nav>
      </header>
      <main>{children}</main>
      <footer style={{ borderTop: '1px solid #1c2535', padding: '1rem 1.25rem', fontSize: '0.7rem', color: '#526660', background: '#05070B' }}>
        © 2026 VVU Foundation · Gqeberha · FSCA JS2
      </footer>
    </div>
  );
}
