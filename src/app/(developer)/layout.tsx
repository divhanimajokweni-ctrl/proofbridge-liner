export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace', display: 'flex' }}>
      <aside style={{ width: '220px', borderRight: '1px solid #1c2535', padding: '1rem', background: '#05070B' }}>
        <div style={{ color: '#00E5FF', fontWeight: 'bold', marginBottom: '1rem' }}>DEVELOPER</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
          <a href="/docs" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Docs</a>
          <a href="/api" style={{ color: '#8F9CAE', textDecoration: 'none' }}>API Dashboard</a>
          <a href="/integrations/b2b" style={{ color: '#8F9CAE', textDecoration: 'none' }}>B2B Integrations</a>
          <a href="/integrations/terminal" style={{ color: '#8F9CAE', textDecoration: 'none' }}>Terminal Integrations</a>
        </nav>
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
