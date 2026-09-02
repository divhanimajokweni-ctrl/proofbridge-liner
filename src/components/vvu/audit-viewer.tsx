'use client';

import { useEffect, useState } from 'react';

// Audit-log viewer — fetches recent AuditLog entries from /api/vvu/audit
// and displays them as a scrolling timeline with state-transition badges.

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  fromState?: string | null;
  toState?: string | null;
  symbol?: string | null;
  reason?: string | null;
  createdAt: string;
}

interface AuditViewerProps {
  refreshKey: number; // bump to force a refresh after a known transition
}

const SYMBOL_COLORS: Record<string, string> = {
  INIT: '#F3E38A',
  CHAL: '#E0944A',
  TOTP_OK: '#9DB36B',
  FAIL: '#E27373',
  CLICK: '#C46D1A',
  CLEAR: '#6B8A40',
  WARN: '#E0944A',
  CRIT: '#B02A2A',
  RESET: '#9DB36B',
};

export function AuditViewer({ refreshKey }: AuditViewerProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/vvu/audit?limit=20', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { entries: AuditEntry[] };
      setEntries(data.entries ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const kick = setTimeout(fetchAudit, 0);
    const interval = setInterval(fetchAudit, 5000);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, [refreshKey]);

  const shown = expanded ? entries : entries.slice(0, 6);

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
          Audit Log · WORM
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.58rem',
            color: loading ? '#8B9A7B' : error ? '#E27373' : '#6B8A40',
          }}
        >
          {loading ? 'SYNCING…' : error ? `ERR ${error}` : `${entries.length} ENTRIES`}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          maxHeight: expanded ? 320 : 180,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {entries.length === 0 && !loading && (
          <div
            style={{
              padding: '0.8rem',
              textAlign: 'center',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.62rem',
              color: '#5A6B4F',
              fontStyle: 'italic',
            }}
          >
            no audit entries yet — trigger a state transition to populate
          </div>
        )}
        {shown.map((e) => {
          const symColor = e.symbol ? SYMBOL_COLORS[e.symbol] ?? '#8B9A7B' : '#8B9A7B';
          const time = new Date(e.createdAt);
          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.4rem 0.5rem',
                borderRadius: 5,
                background: 'rgba(107, 138, 64, 0.04)',
                borderLeft: `2px solid ${symColor}`,
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.6rem',
                animation: 'vvuAuditIn 240ms ease',
              }}
            >
              <span
                style={{
                  color: symColor,
                  fontWeight: 700,
                  fontSize: '0.58rem',
                  letterSpacing: '0.06em',
                  minWidth: 44,
                }}
              >
                {e.symbol ?? e.action}
              </span>
              <span style={{ color: '#C9D4BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.fromState && e.toState ? (
                  <>
                    <span style={{ color: '#8B9A7B' }}>{e.fromState.split('_')[0]}</span>
                    <span style={{ color: symColor }}> → </span>
                    <span style={{ color: '#FFFAC2' }}>{e.toState.split('_')[0]}</span>
                  </>
                ) : (
                  <span style={{ color: '#8B9A7B' }}>{e.action}</span>
                )}
              </span>
              <span style={{ color: '#5A6B4F', fontSize: '0.55rem', whiteSpace: 'nowrap' }}>
                {time.toLocaleTimeString('en-ZA', { hour12: false })}
              </span>
            </div>
          );
        })}
      </div>

      {entries.length > 6 && (
        <button
          onClick={() => setExpanded((x) => !x)}
          style={{
            padding: '0.3rem 0.6rem',
            borderRadius: 5,
            background: 'rgba(107, 138, 64, 0.08)',
            border: '1px solid rgba(107, 138, 64, 0.2)',
            color: '#9DB36B',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.58rem',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            alignSelf: 'center',
          }}
        >
          {expanded ? '▲ Show less' : `▼ Show ${entries.length - 6} more`}
        </button>
      )}

      <style>{`
        @keyframes vvuAuditIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
