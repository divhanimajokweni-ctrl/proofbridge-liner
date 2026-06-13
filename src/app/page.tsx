/**
 * File: src/app/page.tsx
 * Description: Dashboard showing VVU Infrastructure and Gate status.
 */
import React, { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');

  const handleLindiweQuery = async () => {
    if (!query.trim()) return;
    const res = await fetch('/api/lindiwe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        state: { posture: 'NOMINAL', tauDynamics: {}, failureCascades: [] },
      }),
    });
    const data = await res.json();
    console.log('Lindiwe:', data);
  };

  return (
    <main style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ color: '#c8a96e' }}>VVU Infrastructure Dashboard</h1>

      <section style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
        <h2 style={{ color: '#3ecf8e' }}>Lindiwe</h2>
        <input
          style={{ background: '#0d1117', color: '#fff', border: '1px solid #1c2535', padding: '0.5rem', width: '100%' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Lindiwe..."
        />
        <button
          onClick={handleLindiweQuery}
          style={{ marginTop: '0.5rem', background: '#c8a96e', color: '#000', padding: '0.5rem', border: 'none' }}
        >
          Query
        </button>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        <div className="gate-card" style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
          <h3>Gate A: Health</h3>
          <p style={{ color: '#3ecf8e' }}>✓ Infrastructure Remediated</p>
          <p style={{ color: '#8b949e' }}>Pre-flight verified</p>
          <p style={{ color: '#8b949e' }}>Cookie probe active</p>
        </div>

        <div className="gate-card" style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
          <h3>Gate B: Payments</h3>
          <p style={{ color: '#3ecf8e' }}>✓ Webhook Router Active</p>
          <p style={{ color: '#8b949e' }}>Idempotency lock: ON</p>
          <p style={{ color: '#8b949e' }}>Ledger threshold: OK</p>
        </div>

        <div className="gate-card" style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
          <h3>Gate C: Ledger</h3>
          <p style={{ color: '#4a8fd9' }}>○ Stubs Registered</p>
          <p style={{ color: '#8b949e' }}>Reconciliation: pending</p>
          <p style={{ color: '#8b949e' }}>Audit export: ready</p>
        </div>

        <div className="gate-card" style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
          <h3>Gate D: FX Oracle</h3>
          <p style={{ color: '#4a8fd9' }}>○ Stubs Registered</p>
          <p style={{ color: '#8b949e' }}>Deviation alert: armed</p>
          <p style={{ color: '#8b949e' }}>Fallback oracle: hot</p>
        </div>

        <div className="gate-card" style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117' }}>
          <h3>Gate E: Compliance</h3>
          <p style={{ color: '#4a8fd9' }}>○ Stubs Registered</p>
          <p style={{ color: '#8b949e' }}>KYC/AML: observing</p>
          <p style={{ color: '#8b949e' }}>SAR prototype: staged</p>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #2a3a50', background: '#111820' }}>
        <h3>Watchdog Status</h3>
        <p>Orchestrator Engine: RUNNING</p>
        <p>Heartbeat Bus: ACTIVE</p>
        <p>Audit Export: <span style={{ color: '#3ecf8e' }}>READY</span></p>
      </div>
    </main>
  );
}
