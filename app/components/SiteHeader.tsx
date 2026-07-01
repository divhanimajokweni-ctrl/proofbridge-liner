'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ENTITIES } from '../lib/entities';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#0D1117',
    borderBottom: '1px solid #1C2A38',
    fontFamily: "'DM Sans', sans-serif",
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: '14px',
    color: '#DCE2EA',
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
  },
  logoSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '9px',
    color: '#6A8099',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  },
  nav: {
    display: 'flex',
    gap: '20px',
    listStyle: 'none',
    alignItems: 'center',
    margin: 0,
    padding: 0,
  } as React.CSSProperties,
  navLink: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    color: '#6A8099',
    textDecoration: 'none',
    letterSpacing: '0.05em',
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  gatewayLink: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    color: '#C8A84A',
    textDecoration: 'none',
    letterSpacing: '0.08em',
    padding: '6px 14px',
    border: '1px solid rgba(200,168,74,0.3)',
    borderRadius: '20px',
    transition: 'all 0.2s ease',
  },
};

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname === '/gateway') return null;

  return (
    <div role="navigation" aria-label="Site navigation" style={styles.header}>
      <Link href="/" style={styles.logo}>
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5"/>
          <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5"/>
          <circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5"/>
        </svg>
        <div>
          <div style={styles.logoText}>VVU</div>
          <div style={styles.logoSub}>Venture Vision Ubuntu</div>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <ul style={styles.nav}>
          {ENTITIES.map((e) => (
            <li key={e.id} style={{ margin: 0 }}>
              <Link
                href={e.ctaHref}
                style={{
                  ...styles.navLink,
                  ...(pathname === e.ctaHref ? { color: '#DCE2EA' } : {}),
                }}
                onMouseEnter={(ev) => { ev.currentTarget.style.color = '#DCE2EA'; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.color = pathname === e.ctaHref ? '#DCE2EA' : '#6A8099'; }}
              >
                {e.icon} {e.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/gateway"
          style={styles.gatewayLink}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,168,74,0.6)'; e.currentTarget.style.color = '#E4C86A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(200,168,74,0.3)'; e.currentTarget.style.color = '#C8A84A'; }}
        >
          Gateway OS
        </Link>
      </div>
    </div>
  );
}
