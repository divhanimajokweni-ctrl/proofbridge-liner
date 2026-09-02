'use client';

// 5-Gate roadmap panel — visualises the VVU growth-gate framework.
// Gates: 0 (Discovery), 1 (Pilot), 2 (Scale), 3 (Trust), 5 (IPO).
// Current position: Gate 1 (Pilot) — Gqeberha test grounds active.

interface Gate {
  id: number;
  name: string;
  label: string;
  criteria: string;
  status: 'done' | 'active' | 'locked';
}

const GATES: Gate[] = [
  { id: 0, name: 'Discovery', label: 'G0', criteria: 'Site survey · MOI filed', status: 'done' },
  { id: 1, name: 'Pilot', label: 'G1', criteria: '1 customer · R5k MRR · 3 nodes', status: 'active' },
  { id: 2, name: 'Scale', label: 'G2', criteria: '10 customers · R50k MRR', status: 'locked' },
  { id: 3, name: 'Trust', label: 'G3', criteria: '25 customers · 3 physical nodes', status: 'locked' },
  { id: 5, name: 'IPO', label: 'G5', criteria: 'JSE-ready · 70.66% founder control', status: 'locked' },
];

export function GateRoadmap() {
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
          5-Gate Roadmap
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            color: '#F3E38A',
            letterSpacing: '0.08em',
          }}
        >
          CURRENT · G1 PILOT
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          position: 'relative',
        }}
      >
        {GATES.map((g, i) => {
          const accent =
            g.status === 'done' ? '#6B8A40'
              : g.status === 'active' ? '#C46D1A'
              : '#3A4533';
          return (
            <div
              key={g.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                position: 'relative',
                padding: '0.4rem 0.3rem',
              }}
            >
              {/* Connector line to next gate */}
              {i < GATES.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    left: '50%',
                    width: '100%',
                    height: 2,
                    background:
                      g.status === 'done'
                        ? 'linear-gradient(90deg, #6B8A40, #6B8A40aa)'
                        : 'rgba(107,138,64,0.15)',
                    zIndex: 0,
                  }}
                />
              )}
              {/* Gate node */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: g.status === 'locked' ? 'rgba(58,69,51,0.4)' : `${accent}22`,
                  border: `2px solid ${accent}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: g.status === 'locked' ? '#5A6B4F' : accent,
                  zIndex: 1,
                  position: 'relative',
                  boxShadow: g.status === 'active' ? `0 0 12px ${accent}66` : 'none',
                  animation: g.status === 'active' ? 'vvuGatePulse 2.4s ease-in-out infinite' : undefined,
                }}
              >
                {g.label}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: g.status === 'locked' ? '#5A6B4F' : '#C9D4BD',
                }}
              >
                {g.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.55rem',
                  color: '#5A6B4F',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  minHeight: '2.4em',
                }}
              >
                {g.criteria}
              </span>
              {g.status === 'active' && (
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: '0.52rem',
                    color: '#C46D1A',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  ◂ HERE
                </span>
              )}
              {g.status === 'done' && (
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: '0.52rem',
                    color: '#6B8A40',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  ✓ DONE
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '0.6rem 0.75rem',
          borderRadius: 8,
          background: 'rgba(196, 109, 26, 0.06)',
          border: '1px solid rgba(196, 109, 26, 0.2)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.6rem',
          color: '#C9D4BD',
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: '#E0944A' }}>G1 → G2:</span>{' '}
        9 more pilots to reach R50k MRR · R500k valuation · self-funding ratio 520%
      </div>

      <style>{`
        @keyframes vvuGatePulse {
          0%, 100% { box-shadow: 0 0 12px rgba(196,109,26,0.4); }
          50% { box-shadow: 0 0 20px rgba(196,109,26,0.7); }
        }
      `}</style>
    </div>
  );
}
