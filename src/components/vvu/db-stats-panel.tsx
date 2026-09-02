'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

// Sovereign DB stats panel — reads from /api/vvu/db-stats (which calls the
// Prisma-backed seeder). Shows live row counts per table, proving the
// multi-tenant RLS schema is materialised in SQLite.

interface DbStats {
  tenants: number;
  nodes: number;
  spools: number;
  invariants: number;
  telemetry: number;
  audit: number;
  ledger: number;
  seedResult?: {
    tenantCreated: boolean;
    nodesCreated: number;
    spoolsCreated: number;
  };
}

export function DbStatsPanel() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/vvu/db-stats', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DbStats;
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerTamperTest = async () => {
    setTesting(true);
    try {
      await fetch('/api/vvu/tamper-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: 'F01' }),
      });
      // The tamper alert hook will pick this up on its next 30s poll.
    } catch {
      /* non-fatal */
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    const kick = setTimeout(fetchStats, 0);
    const interval = setInterval(fetchStats, 8000);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, []);

  const rows: { label: string; value: number; accent: string }[] = stats
    ? [
        { label: 'TENANTS', value: stats.tenants, accent: '#F3E38A' },
        { label: 'PHYSICAL NODES', value: stats.nodes, accent: '#9DB36B' },
        { label: 'PIPE SPOOLS', value: stats.spools, accent: '#9DB36B' },
        { label: 'HYDRAULIC INVARIANTS', value: stats.invariants, accent: '#9DB36B' },
        { label: 'TELEMETRY LOGS', value: stats.telemetry, accent: '#E0944A' },
        { label: 'AUDIT LOGS', value: stats.audit, accent: '#E0944A' },
        { label: 'LEDGER ENTRIES', value: stats.ledger, accent: '#C46D1A' },
      ]
    : [];

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
          Sovereign DB · SQLite
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.58rem',
            color: loading ? '#8B9A7B' : error ? '#E27373' : '#6B8A40',
          }}
        >
          {loading ? 'SYNCING…' : error ? `ERR ${error}` : '● LIVE'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.1rem',
              padding: '0.45rem 0.55rem',
              borderRadius: 6,
              background: 'rgba(107, 138, 64, 0.05)',
              border: '1px solid rgba(107, 138, 64, 0.1)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.55rem',
                color: '#5A6B4F',
                letterSpacing: '0.1em',
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: r.accent,
                lineHeight: 1,
              }}
            >
              {r.value.toString().padStart(3, '0')}
            </span>
          </div>
        ))}
      </div>

      {stats?.seedResult && (stats.seedResult.tenantCreated || stats.seedResult.nodesCreated > 0) && (
        <div
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 5,
            background: 'rgba(107, 138, 64, 0.1)',
            border: '1px solid rgba(107, 138, 64, 0.25)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.58rem',
            color: '#9DB36B',
          }}
        >
          ✓ Seeded: {stats.seedResult.tenantCreated ? 'tenant + ' : ''}
          {stats.seedResult.nodesCreated} nodes, {stats.seedResult.spoolsCreated} spools
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.55rem',
          color: '#5A6B4F',
          letterSpacing: '0.06em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span>file:/home/z/my-project/db/custom.db · RLS-scoped</span>
        <button
          onClick={triggerTamperTest}
          disabled={testing}
          title="Artificially flag ledger entry F01 as tampered to demo the alert"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 4,
            background: 'rgba(176, 42, 42, 0.12)',
            border: '1px solid rgba(176, 42, 42, 0.3)',
            color: '#E27373',
            fontFamily: 'inherit',
            fontSize: '0.55rem',
            cursor: testing ? 'wait' : 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: testing ? 0.6 : 1,
          }}
        >
          <ShieldAlert size={11} />
          {testing ? 'Testing…' : 'Tamper Test'}
        </button>
      </div>
    </div>
  );
}
