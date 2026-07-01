import Link from 'next/link';
import { ENTITIES } from '../lib/entities';

export default function SiteFooter() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      background: '#0C0C0A',
      padding: '2.5rem 1.5rem 1.5rem',
      fontFamily: '"DM Mono", monospace',
      fontSize: '0.65rem',
      color: '#5A5A55',
      lineHeight: '1.6',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
        <p style={{ color: '#CC7722', fontWeight: 700, marginBottom: '0.75rem' }}>PILOT PROGRAM DISCLAIMER</p>
        <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.5)' }}>
          VVU is a pilot service under active development. All metrics displayed are <span style={{ textDecoration: 'underline' }}>SIMULATED</span> for demonstration unless explicitly labeled as LIVE in production environments. TEE attestation is currently software-attested.
        </p>
        <p style={{ color: '#8A9A5B', fontSize: '0.6rem', marginBottom: '1.5rem' }}>
          POPIA §18 Compliant · FSCA JS2 Regulatory Framework · Gqeberha, Eastern Cape, South Africa
        </p>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <Link href="/" style={{ color: '#6A8099', textDecoration: 'none', fontSize: '0.6rem' }}>Home</Link>
        {ENTITIES.map((e) => (
          <Link
            key={e.id}
            href={e.ctaHref}
            style={{ color: '#6A8099', textDecoration: 'none', fontSize: '0.6rem' }}
          >
            {e.name}
          </Link>
        ))}
        <Link href="/gateway" style={{ color: '#C8A84A', textDecoration: 'none', fontSize: '0.6rem' }}>Gateway OS</Link>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '1rem auto 0',
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.6rem',
        color: 'rgba(255,255,255,0.3)',
      }}>
        &copy; 2026 Vaguely Vanity LLC (CIPC 2026/259053/07) &middot; Gqeberha, Eastern Cape, South Africa
      </div>
    </footer>
  );
}
