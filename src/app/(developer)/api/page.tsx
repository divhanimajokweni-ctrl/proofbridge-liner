'use client';

export default function ApiPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>API Dashboard</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Token management, usage metrics, and rate limit monitoring for developers.</p>
      <div style={{ border: '1px solid #1c2535', borderRadius: '8px', padding: '2rem', background: '#0d1117', textAlign: 'center', color: '#526660' }}>
        API token management UI — connect credentials to view live metrics.
      </div>
    </div>
  );
}
