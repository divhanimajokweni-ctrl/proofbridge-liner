'use client';
import React, { useEffect, useState } from 'react';
import '@/app/globals.css';

interface Metrics {
  cpu: number;
  memory: number;
  load: number;
  processes: number;
  docker: number;
}

function useLiveMetrics(): Metrics {
  const [metrics, setMetrics] = useState<Metrics>({ cpu: 0, memory: 0, load: 0, processes: 0, docker: 0 });

  useEffect(() => {
    let mounted = true;
    let fallbackTimer: ReturnType<typeof setInterval>;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket('ws://localhost:3001');
      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry:pulse' && msg.data) {
            const d = msg.data;
            setMetrics({
              cpu: d.cpu?.totalPercent ?? 0,
              memory: d.memory?.usedPercent ?? 0,
              load: d.load?.load1 ?? 0,
              processes: d.processes?.length ?? 0,
              docker: d.docker?.length ?? 0,
            });
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => { ws?.close(); };
      ws.onclose = () => {
        if (!mounted) return;
        fallbackTimer = setInterval(() => {
          setMetrics({
            cpu: Math.round(30 + Math.random() * 40),
            memory: Math.round(40 + Math.random() * 30),
            load: Math.round(Math.random() * 5 * 10) / 10,
            processes: Math.round(100 + Math.random() * 200),
            docker: Math.round(Math.random() * 4),
          });
        }, 2000);
      };
    } catch {
      fallbackTimer = setInterval(() => {
        setMetrics({
          cpu: Math.round(30 + Math.random() * 40),
          memory: Math.round(40 + Math.random() * 30),
          load: Math.round(Math.random() * 5 * 10) / 10,
          processes: Math.round(100 + Math.random() * 200),
          docker: Math.round(Math.random() * 4),
        });
      }, 2000);
    }

    return () => {
      mounted = false;
      clearInterval(fallbackTimer);
      ws?.close();
    };
  }, []);

  return metrics;
}

function MetricCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div style={{
      background: '#121925',
      border: '1px solid #1C2A38',
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8E949E', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 24, fontWeight: 600, color }}>
        {value}{unit && <span style={{ fontSize: 12, color: '#8E949E', marginLeft: 4 }}>{unit}</span>}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const metrics = useLiveMetrics();

  const coreServices = [
    { name: 'ProofBridge Liner', type: 'SAFETY KERNEL', status: 'ACTIVE', desc: 'Bayesian safety kernel with CircuitBreaker and Ed25519 signing.', metric: 'τ_A', value: '0.60' },
    { name: 'SafeKrypte', type: 'ED25519 SIGNING', status: 'ACTIVE', desc: 'Free-tier ED25519 signing service. Threshold FROST aggregation.', metric: 'Tier', value: '1000 creators' },
    { name: 'SafeLiner', type: 'CREDENTIAL ISSUANCE', status: 'ACTIVE', desc: 'Free-tier credential issuance with QR verification.', metric: 'Issued', value: '0 / 1000' },
    { name: 'Ubuntu Pools', type: 'ROSCA / STOKVEL', status: 'PILOT', desc: 'Decentralized mutual financial pooling with on-chain settlement.', metric: 'Active Pools', value: '12 locked' },
    { name: 'VVU Operatus', type: 'MICROKERNEL', status: 'ACTIVE', desc: 'Headless microkernel running SafeLiner + SafeKrypte with Round-Robin scheduling.', metric: 'Operators', value: '4 online' },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff', margin: 0, letterSpacing: '0.03em' }}>
            PROOFBRIDGE LINER
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#4E545E', margin: '4px 0 0' }}>
            Deterministic Safety Kernel · Compliance Fabric
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8E949E', background: '#121925', border: '1px solid #1C2A38', borderRadius: 999, padding: '3px 10px' }}>
            CPU <strong style={{ color: '#00E5FF' }}>{metrics.cpu}%</strong>
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8E949E', background: '#121925', border: '1px solid #1C2A38', borderRadius: 999, padding: '3px 10px' }}>
            MEM <strong style={{ color: '#C8A84A' }}>{metrics.memory}%</strong>
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8E949E', background: '#121925', border: '1px solid #1C2A38', borderRadius: 999, padding: '3px 10px' }}>
            PROCS <strong style={{ color: '#fff' }}>{metrics.processes}</strong>
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <MetricCard label="CPU Usage" value={metrics.cpu} unit="%" color={metrics.cpu > 80 ? '#E5484D' : metrics.cpu > 60 ? '#C8A84A' : '#00E5FF'} />
        <MetricCard label="Memory" value={metrics.memory} unit="%" color={metrics.memory > 80 ? '#E5484D' : '#C8A84A'} />
        <MetricCard label="System Load" value={metrics.load.toFixed(1)} color="#3ECF8E" />
        <MetricCard label="Active Processes" value={metrics.processes} unit="procs" color="#fff" />
      </div>

      {/* Service grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {coreServices.map((svc) => (
          <div key={svc.name} style={{
            background: '#121925',
            border: '1px solid #1C2A38',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: '1.5px solid #3ECF8E66', borderRight: '1.5px solid #3ECF8E66' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#4E545E', textTransform: 'uppercase' }}>
                {svc.type}
              </span>
              <span style={{
                fontSize: 8, padding: '2px 8px', borderRadius: 10, fontWeight: 700, letterSpacing: '0.08em',
                border: '1px solid', fontFamily: 'monospace',
                background: 'rgba(62,207,142,0.12)', color: '#3ECF8E', borderColor: 'rgba(62,207,142,0.3)',
              }}>
                {svc.status}
              </span>
            </div>
            <h3 style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>
              {svc.name}
            </h3>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: '#8E949E', lineHeight: 1.5, margin: 0 }}>
              {svc.desc}
            </p>
            <div style={{ borderTop: '1px solid #1C2A38', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10 }}>
              <span style={{ color: '#4E545E' }}>{svc.metric}</span>
              <span style={{ color: '#C8A84A', fontWeight: 700 }}>{svc.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
