'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * DashboardNav — top navigation bar for the /dashboard/* routes.
 * Provides quick links between dashboard views.
 */
export default function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: '🚨 Operational Deck' },
    { href: '/dashboard/infra', label: '⚙️ Infrastructure' },
    { href: '/dashboard/telemetry', label: '🌐 Telemetry Globe' },
    { href: '/proofbridge', label: '🔗 ProofBridge Liner' },
    { href: '/pools', label: '🏦 Ubuntu Pools' },
  ];

  return (
    <nav className="vvu-nav">
      <span style={{
        color: 'var(--color-gold)',
        fontWeight: 800,
        letterSpacing: '0.08em',
        marginRight: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 'inherit',
      }}>
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--color-gold)',
          boxShadow: '0 0 8px var(--color-gold)',
          display: 'inline-block',
        }} />
        VVU·CONTROL
      </span>

      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'active' : ''}
        >
          {link.label}
        </Link>
      ))}

      <Link
        href="/"
        style={{
          marginLeft: 'auto',
          color: 'var(--color-text-muted)',
          opacity: 0.6,
        }}
      >
        ← Main Gateway
      </Link>
    </nav>
  );
}
