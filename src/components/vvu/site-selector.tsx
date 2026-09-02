'use client';

import { useState } from 'react';

// Site selector mini-map — picks between the 3 tenants (Gqeberha, Anglo
// Mogalakwena, Sibanye Marikana). Renders a tiny stylised SA map with
// pulsing location pins. Changing the site updates the tenant context
// (which would re-scope RLS queries in a real deployment).

interface Site {
  id: string;
  label: string;
  sub: string;
  // Stylised SVG coordinates on a 200×140 mini-map of SA
  x: number;
  y: number;
  accent: string;
}

const SITES: Site[] = [
  {
    id: 'gqeberha-beachfront-rd',
    label: 'Gqeberha',
    sub: 'Humewood · R&D',
    x: 150,
    y: 95,
    accent: '#C46D1A',
  },
  {
    id: 'anglo-mogalakwena',
    label: 'Mogalakwena',
    sub: 'Anglo American',
    x: 95,
    y: 55,
    accent: '#F3E38A',
  },
  {
    id: 'sibanye-marikana',
    label: 'Marikana',
    sub: 'Sibanye-Stillwater',
    x: 70,
    y: 65,
    accent: '#6B8A40',
  },
];

interface SiteSelectorProps {
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function SiteSelector({ activeSlug, onSelect }: SiteSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '0.8rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            color: '#6B8A40',
            textTransform: 'uppercase',
          }}
        >
          Deployment Site
        </span>
        <span style={{ fontFamily: 'var(--font-geist-sans), sans-serif', fontSize: '0.7rem', color: '#8B9A7B' }}>
          RSA · multi-tenant
        </span>
      </div>

      {/* Mini-map SVG */}
      <svg viewBox="0 0 200 140" width={120} height={84} style={{ display: 'block', flexShrink: 0 }}>
        {/* Stylised South Africa outline */}
        <path
          d="M 30 50 Q 40 30 70 28 L 110 30 Q 140 32 160 45 L 175 70 Q 180 90 165 105 L 140 115 Q 100 122 70 115 L 45 108 Q 25 95 28 75 Z"
          fill="rgba(107, 138, 64, 0.06)"
          stroke="rgba(107, 138, 64, 0.3)"
          strokeWidth={0.8}
        />

        {/* Site pins */}
        {SITES.map((s) => {
          const isActive = s.id === activeSlug;
          const isHovered = hovered === s.id;
          const r = isActive ? 4.5 : 3;
          return (
            <g
              key={s.id}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(s.id)}
              style={{ cursor: 'pointer' }}
            >
              {isActive && (
                <circle cx={s.x} cy={s.y} r={r + 4} fill="none" stroke={s.accent} strokeWidth={0.8} opacity={0.5}>
                  <animate attributeName="r" from={r} to={r + 7} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={s.x}
                cy={s.y}
                r={r}
                fill={isActive ? s.accent : isHovered ? s.accent + 'cc' : s.accent + '88'}
                style={{ filter: isActive ? `drop-shadow(0 0 4px ${s.accent})` : 'none' }}
              />
              {(isActive || isHovered) && (
                <text
                  x={s.x + 7}
                  y={s.y + 2}
                  fontSize={6}
                  fontFamily="monospace"
                  fill={s.accent}
                  fontWeight={isActive ? 700 : 400}
                >
                  {s.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Site list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 160 }}>
        {SITES.map((s) => {
          const isActive = s.id === activeSlug;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.55rem',
                borderRadius: 5,
                background: isActive ? `${s.accent}14` : 'transparent',
                border: `1px solid ${isActive ? s.accent + '55' : 'rgba(107,138,64,0.1)'}`,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.62rem',
                color: isActive ? s.accent : '#8B9A7B',
                transition: 'all 160ms ease',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: s.accent,
                  boxShadow: isActive ? `0 0 6px ${s.accent}` : 'none',
                  flexShrink: 0,
                }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontWeight: isActive ? 700 : 500 }}>{s.label}</span>
                <span style={{ fontSize: '0.52rem', color: '#5A6B4F' }}>{s.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
