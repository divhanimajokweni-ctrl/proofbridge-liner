'use client';

export default function VillagePage() {
  const nodes = [
    { name: 'Gqeberha Hub', status: 'ONLINE', members: 124, pools: 8, latency: '14ms' },
    { name: 'Khayelitsha Node', status: 'ONLINE', members: 89, pools: 5, latency: '22ms' },
    { name: 'Mitchells Plain', status: 'DEGRADED', members: 56, pools: 3, latency: '89ms' },
    { name: 'New Brighton', status: 'ONLINE', members: 73, pools: 4, latency: '18ms' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c8a96e', marginBottom: '0.5rem' }}>Village Operations</h1>
      <p style={{ fontSize: '0.875rem', color: '#8F9CAE', marginBottom: '1.5rem' }}>Monitor village nodes, connectivity, and pool health across the network.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {nodes.map((n) => (
          <div key={n.name} style={{
            border: '1px solid #1c2535', borderRadius: '8px', padding: '1.25rem',
            background: '#0d1117',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 'bold', fontSize: '1rem' }}>{n.name}</span>
              <span style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'DM Mono, monospace',
                background: n.status === 'ONLINE' ? 'rgba(62,207,142,0.1)' : 'rgba(232,160,32,0.1)',
                color: n.status === 'ONLINE' ? '#3ecf8e' : '#E8A020',
                border: `1px solid ${n.status === 'ONLINE' ? 'rgba(62,207,142,0.3)' : 'rgba(232,160,32,0.3)'}`,
              }}>{n.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.75rem', color: '#8F9CAE' }}>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e6edf3', fontFamily: 'Syne, sans-serif' }}>{n.members}</div><div>Members</div></div>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e6edf3', fontFamily: 'Syne, sans-serif' }}>{n.pools}</div><div>Pools</div></div>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c8a96e', fontFamily: 'DM Mono, monospace' }}>{n.latency}</div><div>Latency</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
