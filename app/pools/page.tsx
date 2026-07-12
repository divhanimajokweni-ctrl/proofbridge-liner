// app/pools/page.tsx
// Full rewrite. Original file used raw Tailwind utility defaults
// (bg-blue-600, border rounded, text-white on an unstyled white
// background) with zero VVU tokens and no guide component — the
// literal white-on-white regression. This version uses the same
// card/badge/token language as dashboard/page.tsx and adds the
// pool-creation guide that was the actual original ask.
'use client';
import { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import '../styles/variables.css';
import '../styles/dashboard-shell.css';
import { PageGuide } from '../components/PageGuide';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PoolsPage() {
  const [name, setName] = useState('');
  const [contributionAmountZar, setContributionAmountZar] = useState(1000);
  const [rotationFrequency, setRotationFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: pools, mutate } = useSWR('/api/pools', fetcher);

  const handleCreatePool = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/pools', {
        name,
        contributionAmountZar,
        rotationFrequency,
      });
      setSuccess(`Pool created: ${response.data.poolName}`);
      mutate();
      setName('');
      setContributionAmountZar(1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create pool');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vvu-page">
      <div className="vvu-page-header">
        <div>
          <h1 className="vvu-page-title">UBUNTU POOLS</h1>
          <p className="vvu-page-subtitle">ROSCA / Stokvel · On-chain contribution receipts</p>
        </div>
        <span className="vvu-badge vvu-badge--pilot">PILOT</span>
      </div>

      <PageGuide index={1} title="Create a pool in three fields">
        Name it, set the contribution amount in ZAR, and choose weekly or monthly
        rotation. Every contribution is recorded as an on-chain receipt — members
        can verify the pool's history at any time from this page.
      </PageGuide>

      <div className="vvu-card" style={{ maxWidth: 480, gap: 14 }}>
        <div>
          <label className="vvu-field-label">Pool Name</label>
          <input
            type="text"
            placeholder="e.g. Gqeberha Stokvel Circle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="vvu-input"
          />
        </div>

        <div>
          <label className="vvu-field-label">Contribution (ZAR)</label>
          <input
            type="number"
            placeholder="1000"
            value={contributionAmountZar}
            onChange={(e) => setContributionAmountZar(Number(e.target.value))}
            className="vvu-input"
          />
        </div>

        <div>
          <label className="vvu-field-label">Rotation Frequency</label>
          <select
            value={rotationFrequency}
            onChange={(e) => setRotationFrequency(e.target.value as 'weekly' | 'monthly')}
            className="vvu-select"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <button
          onClick={handleCreatePool}
          disabled={isLoading || !name}
          className="vvu-btn-primary"
        >
          {isLoading ? 'Creating…' : 'Create Pool'}
        </button>

        {error && <div className="vvu-alert-error">{error}</div>}
        {success && <div className="vvu-alert-success">{success}</div>}
      </div>

      <div>
        <h2 className="vvu-eyebrow" style={{ marginBottom: 10 }}>Existing Pools</h2>
        {pools?.length === 0 || !pools ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)' }}>
            No pools yet — create the first one above.
          </p>
        ) : (
          <div className="vvu-card-grid">
            {pools.map((pool: any) => (
              <div key={pool.id} className="vvu-card">
                <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: '1.5px solid rgba(62,207,142,0.4)', borderRight: '1.5px solid rgba(62,207,142,0.4)' }} />
                <span className="vvu-eyebrow">{pool.cycle}</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', margin: 0 }}>
                  {pool.poolName}
                </h3>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>R{pool.contributionZar}</span>
                  <span className={`vvu-badge ${pool.status === 'ACTIVE' ? 'vvu-badge--active' : 'vvu-badge--offline'}`}>
                    {pool.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
