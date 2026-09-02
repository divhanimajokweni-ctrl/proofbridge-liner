'use client';

import { useEffect, useRef, useState } from 'react';
import { TelemetryPayload, TelemetryResult, generateMockTelemetry, validateTelemetry, DEFAULT_TENANT } from '@/lib/vvu-telemetry';

interface TelemetryFeedProps {
  nodeId: string;
}

interface FeedEntry {
  payload: TelemetryPayload;
  result: TelemetryResult;
}

export function TelemetryFeed({ nodeId }: TelemetryFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const entriesRef = useRef<FeedEntry[]>([]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const payload = generateMockTelemetry(DEFAULT_TENANT.id, nodeId);
      const result = validateTelemetry(payload);
      const next = [{ payload, result }, ...entriesRef.current].slice(0, 8);
      setEntries(next);
    }, 2200);
    return () => clearInterval(interval);
  }, [paused, nodeId]);

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
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          Edge Telemetry Stream
        </h3>
        <button
          onClick={() => setPaused((p) => !p)}
          style={{
            padding: '0.25rem 0.55rem',
            borderRadius: 5,
            background: paused ? 'rgba(107, 138, 64, 0.16)' : 'rgba(196, 109, 26, 0.14)',
            border: `1px solid ${paused ? 'rgba(107, 138, 64, 0.35)' : 'rgba(196, 109, 26, 0.35)'}`,
            color: paused ? '#9DB36B' : '#E0944A',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minHeight: 0 }}>
        {entries.length === 0 && (
          <div
            style={{
              padding: '0.8rem',
              textAlign: 'center',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.66rem',
              color: '#5A6B4F',
              fontStyle: 'italic',
            }}
          >
            awaiting first telemetry frame…
          </div>
        )}
        {entries.map((e, i) => {
          const rejected = !e.result.success;
          return (
            <div
              key={e.payload.timestamp + '-' + i}
              style={{
                padding: '0.55rem 0.65rem',
                borderRadius: 7,
                background: rejected ? 'rgba(176, 42, 42, 0.08)' : 'rgba(107, 138, 64, 0.06)',
                border: `1px solid ${rejected ? 'rgba(176, 42, 42, 0.3)' : 'rgba(107, 138, 64, 0.18)'}`,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.3rem 0.8rem',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.62rem',
                animation: i === 0 ? 'vvuFadeIn 320ms ease' : undefined,
              }}
            >
              <Metric label="NODE" value={e.payload.nodeId} color="#F3E38A" />
              <Metric label="STATE" value={e.result.state} color={rejected ? '#E27373' : '#9DB36B'} />
              <Metric label="FLOW" value={`${e.payload.flowRate.toFixed(2)} L/s`} color="#9DB36B" />
              <Metric label="HEAD" value={`${e.payload.pressureHead.toFixed(2)} m`} color="#9DB36B" />
              <Metric label="APU" value={`${e.payload.apuTemperature.toFixed(1)} °C`} color={
                e.payload.apuTemperature >= 85 ? '#E27373'
                  : e.payload.apuTemperature >= 65 ? '#E0944A'
                  : '#9DB36B'
              } />
              <Metric label="CELERITY" value={`${e.result.estimatedCelerity.toFixed(1)} m/s`} color={e.result.invariantOk ? '#9DB36B' : '#E27373'} />
              <div style={{ gridColumn: '1 / -1', color: '#5A6B4F', fontSize: '0.58rem', borderTop: '1px dashed rgba(107,138,64,0.15)', paddingTop: '0.3rem', marginTop: '0.1rem' }}>
                {e.result.logId} · {e.payload.acousticAbnormal ? '⚠ acoustic abnormal' : 'acoustic nominal'} · {new Date(e.payload.timestamp).toLocaleTimeString('en-ZA', { hour12: false })}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes vvuFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'baseline' }}>
      <span style={{ color: '#5A6B4F', minWidth: 48 }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
