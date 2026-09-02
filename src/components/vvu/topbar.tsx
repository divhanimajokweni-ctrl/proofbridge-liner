'use client';

import { BorromeanLogo } from './borromean-logo';

export interface TopbarBadge {
  key: string;
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'fail' | 'pending';
  tooltip?: string;
}

interface TopbarProps {
  badges: TopbarBadge[];
  tenantName: string;
}

const STATUS_COLORS: Record<TopbarBadge['status'], { bg: string; fg: string; dot: string }> = {
  ok: { bg: 'rgba(107, 138, 64, 0.14)', fg: '#9DB36B', dot: '#6B8A40' },
  warn: { bg: 'rgba(196, 109, 26, 0.16)', fg: '#E0944A', dot: '#C46D1A' },
  fail: { bg: 'rgba(176, 42, 42, 0.18)', fg: '#E27373', dot: '#B02A2A' },
  pending: { bg: 'rgba(139, 154, 123, 0.12)', fg: '#8B9A7B', dot: '#5A6B4F' },
};

export function Topbar({ badges, tenantName }: TopbarProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 14, 11, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(107, 138, 64, 0.18)',
        padding: '0.7rem 1.1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          maxWidth: 1600,
          margin: '0 auto',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <BorromeanLogo size={30} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: 'var(--font-geist-sans), sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#FFFAC2',
                letterSpacing: '0.02em',
              }}
            >
              ProofBridge <span style={{ color: '#6B8A40', fontWeight: 500 }}>· VVU</span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.6rem',
                color: '#8B9A7B',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Validation Dashboard · V4 Verified
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {badges.map((b) => {
            const c = STATUS_COLORS[b.status];
            return (
              <div
                key={b.key}
                title={b.tooltip ?? `${b.label}: ${b.value}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.28rem 0.6rem',
                  borderRadius: 999,
                  background: c.bg,
                  border: `1px solid ${c.dot}33`,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.66rem',
                  color: c.fg,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: c.dot,
                    boxShadow: `0 0 6px ${c.dot}aa`,
                  }}
                />
                <span style={{ color: '#8B9A7B' }}>{b.label}</span>
                <span style={{ fontWeight: 600, color: c.fg }}>{b.value}</span>
              </div>
            );
          })}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.28rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(243, 227, 138, 0.08)',
              border: '1px solid rgba(243, 227, 138, 0.22)',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.64rem',
              color: '#F3E38A',
              marginLeft: '0.3rem',
            }}
            title="Active RLS-scoped tenant session"
          >
            <span style={{ color: '#8B9A7B' }}>TENANT</span>
            <span style={{ fontWeight: 600 }}>{tenantName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
