export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem' }}>Sign in to VVU</h1>
        <p style={{ color: 'rgba(13,13,13,0.65)', marginBottom: '2rem' }}>Authentication is handled by your Supabase session via middleware.</p>
        <a href="/" style={{ background: 'var(--ink)', color: 'var(--amber)', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontFamily: 'DM Mono, monospace', fontSize: '0.875rem' }}>← Back to Ubuntu Pools</a>
      </div>
    </div>
  );
}
