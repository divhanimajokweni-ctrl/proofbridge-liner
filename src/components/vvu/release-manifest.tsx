'use client';

import { RELEASE_MANIFEST, MANIFEST_CATEGORIES, RELEASE_STAMP, RELEASE_VERSION, DESIGN_FREEZE } from '@/lib/vvu-release-manifest';

export function ReleaseManifest() {
  const byCategory = MANIFEST_CATEGORIES.map((c) => ({
    ...c,
    files: RELEASE_MANIFEST.filter((f) => f.category === c.key),
  })).filter((c) => c.files.length > 0);

  const totalSize = RELEASE_MANIFEST.reduce((sum, f) => sum + f.sizeBytes, 0);

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: '#6B8A40',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Release Manifest · 15 Files
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            color: '#8B9A7B',
            letterSpacing: '0.1em',
          }}
        >
          {RELEASE_STAMP} · {RELEASE_VERSION} · FREEZE {DESIGN_FREEZE} · {(totalSize / 1024).toFixed(1)} KB
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {byCategory.map((cat) => (
          <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.6rem',
                color: cat.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.accent }} />
              {cat.label}
              <span style={{ color: '#5A6B4F' }}>· {cat.files.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', paddingLeft: '1.1rem' }}>
              {cat.files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '0.6rem',
                    alignItems: 'baseline',
                    padding: '0.2rem 0',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: '0.62rem',
                    borderBottom: '1px dashed rgba(107,138,64,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                    <span style={{ color: '#C9D4BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.filename}
                    </span>
                    <span style={{ color: '#5A6B4F', fontSize: '0.58rem' }}>{f.role}</span>
                  </div>
                  <span style={{ color: '#8B9A7B', fontSize: '0.58rem', whiteSpace: 'nowrap' }}>
                    {(f.sizeBytes / 1024).toFixed(2)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
