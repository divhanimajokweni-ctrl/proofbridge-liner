// app/dashboard/DashboardNav.tsx
// Rewritten: the emoji-prefixed labels ("🚨 Operational Deck") broke the
// terminal/trust identity established on the landing page (IBM Plex Mono,
// gold-on-void, no decorative emoji anywhere else in the brand). This
// brings the nav in line with that identity instead of contradicting it.
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../styles/dashboard-shell.css';

export default function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Operational Deck' },
    { href: '/pools', label: 'Ubuntu Pools' },
    { href: '/safekrypte', label: 'SafeKrypte' },
    { href: '/trust-runtime', label: 'Trust Runtime' },
    { href: '/dashboard/security', label: 'Security' },
  ];

  return (
    <nav
      className="vvu-nav"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '14px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-void)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      <span style={{
        color: 'var(--color-gold)',
        fontWeight: 800,
        letterSpacing: '0.08em',
        marginRight: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--color-gold)',
          boxShadow: '0 0 8px var(--color-gold)',
          display: 'inline-block',
        }} />
        VVU · CONTROL
      </span>

      {links.map(link => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: active ? 'var(--color-gold-bright)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
              paddingBottom: 4,
              borderBottom: active ? '1.5px solid var(--color-gold)' : '1.5px solid transparent',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
          >
            {link.label}
          </Link>
        );
      })}

      <Link
        href="/"
        style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', textDecoration: 'none', opacity: 0.7 }}
      >
        ← Main Gateway
      </Link>
    </nav>
  );
}
