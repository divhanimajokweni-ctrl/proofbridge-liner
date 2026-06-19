import Link from 'next/link';

export default function GatewayRoot() {
  return (
    <main style={{
      minHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(204, 119, 34, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(204, 119, 34, 0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{ zIndex: 1, maxWidth: '750px' }}>
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" style={{ marginBottom: '1rem' }}>
          <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5"/>
          <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5"/>
          <circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5"/>
        </svg>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, textTransform: 'uppercase' }}>
          Venture Vision<br/><span style={{ color: '#CC7722' }}>Ubuntu</span>
        </h1>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#8A9A5B', letterSpacing: '4px', margin: '0.5rem 0 2rem' }}>
          EARTH-TECH GATEWAY
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          <Link href="/pools" style={{
            background: '#0C0C0A',
            border: '1px solid rgba(138, 154, 91, 0.15)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            textDecoration: 'none',
            color: '#FFFFFF',
            transition: 'border-color 0.2s ease'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🏘️</span>
            <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.3rem' }}>Ubuntu Pools</h2>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
              Village OS · ROSCA Core engines for local pooling assets.
            </p>
            <span style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '0.6rem', fontFamily: '"DM Mono", monospace', background: 'rgba(138, 154, 91, 0.1)', color: '#8A9A5B', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 700 }}>
              ANT TELEMETRY ACTIVE
            </span>
          </Link>

          <Link href="/proofbridge" style={{
            background: '#0C0C0A',
            border: '1px solid rgba(204, 119, 34, 0.15)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            textDecoration: 'none',
            color: '#FFFFFF',
            transition: 'border-color 0.2s ease'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔗</span>
            <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.3rem' }}>ProofBridge Liner</h2>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
              Cryptographic receipt generation and on-chain attestation matrices.
            </p>
            <span style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '0.6rem', fontFamily: '"DM Mono", monospace', background: 'rgba(204, 119, 34, 0.1)', color: '#CC7722', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 700 }}>
              3D SPHERICAL VECTOR
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
