'use client';

import { VVUNodeState, VVU_STATE_LABELS, VVU_STATE_DESCRIPTIONS, VVUTransitionLogEntry } from '@/lib/vvu-fsm-controller';

interface FSMVisualizerProps {
  currentState: VVUNodeState;
  log: VVUTransitionLogEntry[];
  lastTemp: number;
  onReset: () => void;
  onSimulateThermal: () => void;
  onSimulateCritical?: () => void;
}

const STATE_ORDER: VVUNodeState[] = [
  VVUNodeState.DISCONNECTED,
  VVUNodeState.PAIRING_BLE,
  VVUNodeState.TOTP_VERIFICATION,
  VVUNodeState.STEADY_STATE_LOCKED,
  VVUNodeState.LEAK_SIMULATION_ACTIVE,
  VVUNodeState.THERMAL_THROTTLE,
  VVUNodeState.FAIL_CLOSED_LOCKDOWN,
];

const STATE_ACCENT: Record<VVUNodeState, string> = {
  DISCONNECTED: '#5A6B4F',
  PAIRING_BLE: '#F3E38A',
  TOTP_VERIFICATION: '#E0944A',
  STEADY_STATE_LOCKED: '#6B8A40',
  LEAK_SIMULATION_ACTIVE: '#C46D1A',
  THERMAL_THROTTLE: '#E0944A',
  FAIL_CLOSED_LOCKDOWN: '#B02A2A',
};

export function FSMVisualizer({
  currentState,
  log,
  lastTemp,
  onReset,
  onSimulateThermal,
  onSimulateCritical,
}: FSMVisualizerProps) {
  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        height: '100%',
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
          DFA State Machine
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.62rem',
            color: '#8B9A7B',
          }}
        >
          APU {lastTemp.toFixed(1)}°C
        </span>
      </div>

      {/* Current state banner */}
      <div
        style={{
          padding: '0.7rem 0.9rem',
          borderRadius: 8,
          background: `${STATE_ACCENT[currentState]}1a`,
          border: `1px solid ${STATE_ACCENT[currentState]}55`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATE_ACCENT[currentState],
              boxShadow: `0 0 8px ${STATE_ACCENT[currentState]}`,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: STATE_ACCENT[currentState],
              letterSpacing: '0.04em',
            }}
          >
            {VVU_STATE_LABELS[currentState]}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-geist-sans), sans-serif',
            fontSize: '0.7rem',
            color: '#8B9A7B',
            lineHeight: 1.4,
          }}
        >
          {VVU_STATE_DESCRIPTIONS[currentState]}
        </span>
      </div>

      {/* State ladder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {STATE_ORDER.map((s) => {
          const active = s === currentState;
          return (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.55rem',
                borderRadius: 5,
                background: active ? `${STATE_ACCENT[s]}14` : 'transparent',
                borderLeft: `2px solid ${active ? STATE_ACCENT[s] : 'transparent'}`,
                transition: 'all 180ms ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.66rem',
                  color: active ? STATE_ACCENT[s] : '#5A6B4F',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {VVU_STATE_LABELS[s]}
              </span>
              {active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: '0.58rem',
                    color: STATE_ACCENT[s],
                    letterSpacing: '0.1em',
                  }}
                >
                  ◂ HERE
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Transition log */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6rem',
            color: '#8B9A7B',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Transition Log
        </span>
        <div
          style={{
            flex: 1,
            minHeight: 120,
            maxHeight: 180,
            overflowY: 'auto',
            paddingRight: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.62rem',
          }}
        >
          {log.length === 0 && (
            <div style={{ color: '#5A6B4F', fontStyle: 'italic' }}>— no transitions yet —</div>
          )}
          {log.slice(0, 12).map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                gap: '0.4rem',
                color: '#9DB36B',
                lineHeight: 1.3,
              }}
            >
              <span style={{ color: '#5A6B4F' }}>{e.id}</span>
              <span style={{ color: '#8B9A7B' }}>{e.from}</span>
              <span style={{ color: '#C46D1A' }}>-{e.symbol}→</span>
              <span style={{ color: STATE_ACCENT[e.to], fontWeight: 600 }}>{e.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={onSimulateThermal}
            style={{
              flex: 1,
              padding: '0.45rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(196, 109, 26, 0.14)',
              border: '1px solid rgba(196, 109, 26, 0.35)',
              color: '#E0944A',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
            title="Keyboard: T"
          >
            Sim 78°C <span style={{ color: '#5A6B4F', fontSize: '0.55rem' }}>[T]</span>
          </button>
          {onSimulateCritical && (
            <button
              onClick={onSimulateCritical}
              style={{
                flex: 1,
                padding: '0.45rem 0.6rem',
                borderRadius: 6,
                background: 'rgba(176, 42, 42, 0.18)',
                border: '1px solid rgba(176, 42, 42, 0.45)',
                color: '#E27373',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
              title="Keyboard: C"
            >
              Sim 88°C <span style={{ color: '#5A6B4F', fontSize: '0.55rem' }}>[C]</span>
            </button>
          )}
        </div>
        <button
          onClick={onReset}
          style={{
            padding: '0.45rem 0.6rem',
            borderRadius: 6,
            background: 'rgba(107, 138, 64, 0.12)',
            border: '1px solid rgba(107, 138, 64, 0.35)',
            color: '#9DB36B',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.64rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
          title="Keyboard: R"
        >
          Authorised Reset <span style={{ color: '#5A6B4F', fontSize: '0.55rem' }}>[R]</span>
        </button>
      </div>
    </div>
  );
}
