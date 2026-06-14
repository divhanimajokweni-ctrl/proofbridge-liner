import React, { useState, useEffect, lazy, Suspense } from 'react';
import AntColonyLoader from '@/components/fx/AntColonyLoader';
const AdvancedGlobeTelemetry = lazy(() => import('@/components/fx/AdvancedGlobeTelemetry'));

interface GateState {
  id: string;
  label: string;
  name: string;
  status: 'NOMINAL' | 'DEGRADED' | 'FAULT';
  metrics: [string, string][];
}

function buildGateCard(gate: GateState) {
  const statusColor = gate.status === 'NOMINAL' ? '#3ecf8e' : gate.status === 'DEGRADED' ? '#c8a96e' : '#FF3333';
  return (
    <div key={gate.id} style={{ border: '1px solid #1c2535', padding: '1rem', background: '#0d1117', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '0.7rem', color: '#8F9CAE', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        GATE {gate.id} · {gate.label.toUpperCase()}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c8a96e', marginBottom: '4px' }}>{gate.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem', color: '#8F9CAE' }}>
        {gate.metrics.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{k}</span>
            <span style={{ color: '#FFF' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #1c2535', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: statusColor }}>{gate.status}</span>
        <span style={{ fontSize: '0.65rem', color: '#526660', fontFamily: 'monospace' }}>INTERCEPT_LISTENER</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gates] = useState<GateState[]>(() => [
    { id: 'A', label: 'gate-1', name: 'ORIGINATION', status: 'NOMINAL', metrics: [['Avg μ (1h)', '0.684'], ['Reject rate', '4.2%'], ['Queue depth', '6']] },
    { id: 'B', label: 'gate-2', name: 'STITCH / REPLAY', status: 'NOMINAL', metrics: [['Deflections 1h', '1'], ['Redlock locks', '58'], ['Replay attempts', '0']] },
    { id: 'C', label: 'gate-3', name: 'BAYESIAN SAFETY', status: 'NOMINAL', metrics: [['Proposals > τ_A', '87'], ['HMAC valid', 'YES'], ['MC tests', '4']] },
    { id: 'D', label: 'gate-4', name: 'EVIDENCE', status: 'DEGRADED', metrics: [['Last reconcile', new Date().toTimeString().slice(0, 8) + ' UTC'], ['Datadog ingest', 'ACTIVE'], ['StableStr', 'ENFORCED']] },
    { id: 'E', label: 'gate-5', name: 'FROST SIGNER', status: 'NOMINAL', metrics: [['Online signers', '5/5'], ['Verify rate', '99.8%'], ['Last sig', 'a3f8c9...']] },
    { id: 'F', label: 'gate-6', name: 'SETTLEMENT', status: 'NOMINAL', metrics: [['Circuit state', 'CLOSED'], ['Drift', '142ms'], ['Anchors', '187']] },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 8500);
    return () => clearTimeout(timer);
  }, []);

  const handleLindiweQuery = async () => {
    if (!query.trim()) return;
    setResponse('QUERYING...');
    try {
      const res = await fetch('/api/lindiwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: query,
          state: { posture: 'NOMINAL', tauDynamics: {}, failureCascades: [] },
        }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data).slice(0, 120) + '...');
    } catch (e) {
      setResponse('ERR: Lindiwe node unreachable. Fallback simulation active.');
    }
  };

  return (
    <main style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#8F9CAE', fontFamily: 'monospace', overflow: 'hidden', boxSizing: 'border-box' }}>
      <AntColonyLoader isLoading={isLoading} onComplete={() => setIsLoading(false)} />

      {!isLoading && (
        <>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1c2535', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#05070B' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c8a96e', letterSpacing: '0.1em' }}>VVU INFRASTRUCTURE DASHBOARD</div>
            <div style={{ fontSize: '0.7rem', color: '#526660' }}>PROTOCOL: AMOY_TESTNET · KERNEL: V2.5</div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr auto', gap: '1rem', padding: '1rem', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center', background: '#0a0d12', border: '1px solid #1c2535', padding: '0.75rem 1rem', borderRadius: '4px' }}>
              <span style={{ color: '#00E5FF', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>LINDIWE://</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query payload..."
                style={{ flex: 1, background: '#0d1117', color: '#FFF', border: '1px solid #1c2535', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', borderRadius: '2px', outline: 'none' }}
                onKeyDown={(e) => e.key === 'Enter' && handleLindiweQuery()}
              />
              <button onClick={handleLindiweQuery} style={{ background: '#c8a96e', color: '#000', border: 'none', padding: '0.5rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>EXECUTE</button>
              {response && <span style={{ fontSize: '0.7rem', color: '#3ecf8e', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{response}</span>}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
              {gates.map((g) => (
                <div key={g.id} style={{ minWidth: 0 }}>{buildGateCard(g)}</div>
              ))}
            </div>

            <div style={{ gridColumn: '1 / -1', minHeight: 0, overflow: 'hidden' }}>
              <Suspense fallback={<div style={{ color: '#8F9CAE', padding: '1rem' }}>Initializing telemetry renderer...</div>}>
              <AdvancedGlobeTelemetry />
            </Suspense>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: '0.75rem 1rem', borderTop: '1px solid #1c2535', background: '#05070B', display: 'flex', gap: '2rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
              <div><span style={{ color: '#8F9CAE' }}>ORCHESTRATOR ENGINE:</span> <span style={{ color: '#3ecf8e' }}>RUNNING</span></div>
              <div><span style={{ color: '#8F9CAE' }}>HEARTBEAT BUS:</span> <span style={{ color: '#3ecf8e' }}>ACTIVE</span></div>
              <div><span style={{ color: '#8F9CAE' }}>AUDIT EXPORT:</span> <span style={{ color: '#3ecf8e' }}>READY</span></div>
              <div><span style={{ color: '#8F9CAE', marginLeft: 'auto' }}>PROOFBRIDGE LINER v2.1 · GQEBERHA NODE</span></div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
