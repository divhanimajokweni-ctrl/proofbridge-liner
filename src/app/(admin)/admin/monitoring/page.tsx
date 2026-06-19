'use client';

export default function MonitoringPage() {
  const services = [
    { name: 'API Gateway', latency: '12ms', uptime: '99.99%', status: 'HEALTHY' },
    { name: 'ProofBridge Indexer', latency: '45ms', uptime: '99.97%', status: 'HEALTHY' },
    { name: 'Stitch Webhook', latency: '89ms', uptime: '99.95%', status: 'HEALTHY' },
    { name: 'ANT Telemetry', latency: '3ms', uptime: '99.99%', status: 'HEALTHY' },
    { name: 'Ubuntu Score Engine', latency: '156ms', uptime: '99.92%', status: 'DEGRADED' },
    { name: 'Village OS Core', latency: '23ms', uptime: '99.98%', status: 'HEALTHY' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF3333', marginBottom: '0.5rem' }}>System Monitoring</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Distributed systems health, circuit breakers, and alert management.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {services.map((s) => (
          <div key={s.name} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 'bold', color: '#e6edf3' }}>{s.name}</span>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'DM Mono, monospace',
                background: s.status === 'HEALTHY' ? 'rgba(62,207,142,0.1)' : 'rgba(232,160,32,0.1)',
                color: s.status === 'HEALTHY' ? '#3ecf8e' : '#E8A020',
                border: `1px solid ${s.status === 'HEALTHY' ? 'rgba(62,207,142,0.3)' : 'rgba(232,160,32,0.3)'}`,
              }}>{s.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.75rem', color: '#8F9CAE' }}>
              <div><div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e6edf3', fontFamily: 'DM Mono, monospace' }}>{s.latency}</div><div>Latency</div></div>
              <div><div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e6edf3', fontFamily: 'DM Mono, monospace' }}>{s.uptime}</div><div>Uptime</div></div>
              <div><div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#c8a96e', fontFamily: 'DM Mono, monospace' }}>●</div><div>Live</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
