'use client';

import { BorromeanLogo } from './borromean-logo';
import { CORPORATE_FACTS } from '@/lib/vvu-release-manifest';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        marginTop: 'auto',
        background: 'rgba(6, 8, 6, 0.9)',
        borderTop: '1px solid rgba(107, 138, 64, 0.22)',
        padding: '1.4rem 1.1rem',
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.4fr) minmax(220px, 1fr)',
          gap: '1.4rem',
          alignItems: 'start',
        }}
      >
        {/* Brand block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BorromeanLogo size={26} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#FFFAC2',
                }}
              >
                ProofBridge · VVU
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.58rem',
                  color: '#8B9A7B',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Hydro-Gateway · Mk-II
              </span>
            </div>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-geist-sans), sans-serif',
              fontSize: '0.68rem',
              color: '#8B9A7B',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {CORPORATE_FACTS.site}. Sovereign, offline-first verification for mining &amp; municipal water infrastructure.
          </p>
        </div>

        {/* B-BBEE compliance block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            padding: '0.85rem 0.95rem',
            borderRadius: 10,
            background:
              'linear-gradient(135deg, rgba(196,109,26,0.06), rgba(107,138,64,0.06))',
            border: '1px solid rgba(243, 227, 138, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <ComplianceChip label="B-BBEE" value={`LEVEL ${CORPORATE_FACTS.bbbeeLevel}`} accent="#C46D1A" />
            <ComplianceChip label="RECOGNITION" value={CORPORATE_FACTS.bbbeeRecognition} accent="#F3E38A" />
            <ComplianceChip label="OWNERSHIP" value={CORPORATE_FACTS.blackOwned} accent="#6B8A40" />
            <ComplianceChip label="SARS" value="COMPLIANT" accent="#9DB36B" />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.62rem',
              color: '#C9D4BD',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}
          >
            {CORPORATE_FACTS.entity} · CIPC {CORPORATE_FACTS.cipc}
            <br />
            <span style={{ color: '#5A6B4F' }}>
              Registered {CORPORATE_FACTS.registered} · B-BBEE valid until {CORPORATE_FACTS.bbbeeExpiry}
            </span>
          </div>
        </div>

        {/* Signature block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            textAlign: 'right',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.6rem',
              color: '#8B9A7B',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Sovereign Operator
          </div>
          <a
            href={`mailto:${CORPORATE_FACTS.contactEmail}`}
            style={{
              fontFamily: 'var(--font-geist-sans), sans-serif',
              fontSize: '0.82rem',
              color: '#F3E38A',
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: '0.02em',
              borderBottom: '1px dotted rgba(243,227,138,0.4)',
              paddingBottom: 1,
            }}
          >
            {CORPORATE_FACTS.contactEmail}
          </a>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.58rem',
              color: '#5A6B4F',
              letterSpacing: '0.08em',
            }}
          >
            © {year} · Trust through transparent cycles
          </div>
        </div>
      </div>
    </footer>
  );
}

function ComplianceChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.55rem',
        borderRadius: 5,
        background: `${accent}1a`,
        border: `1px solid ${accent}44`,
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: '0.58rem',
        letterSpacing: '0.06em',
      }}
    >
      <span style={{ color: '#8B9A7B' }}>{label}</span>
      <span style={{ color: accent, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
