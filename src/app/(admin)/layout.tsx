export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace' }}>
      <header style={{ borderBottom: '1px solid #1c2535', padding: '1rem', background: '#05070B' }}>
        <div style={{ color: '#FF3333', fontWeight: 'bold' }}>ADMIN</div>
      </header>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}
