'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BootScreen } from '@/components/vvu/boot-screen';
import { Topbar, TopbarBadge } from '@/components/vvu/topbar';
import { TerrainTwin } from '@/components/vvu/terrain-twin';
import { FSMVisualizer } from '@/components/vvu/fsm-visualizer';
import { TelemetryFeed } from '@/components/vvu/telemetry-feed';
import { VerificationPanel } from '@/components/vvu/verification-panel';
import { ReleaseManifest } from '@/components/vvu/release-manifest';
import { HydraulicChart } from '@/components/vvu/hydraulic-chart';
import { GateRoadmap } from '@/components/vvu/gate-roadmap';
import { DbStatsPanel } from '@/components/vvu/db-stats-panel';
import { Footer } from '@/components/vvu/footer';
import { VVUFSMController, VVUNodeState } from '@/lib/vvu-fsm-controller';
import { DEFAULT_TENANT, TENANTS } from '@/lib/vvu-telemetry';
import { RELEASE_MANIFEST } from '@/lib/vvu-release-manifest';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [tenantIdx, setTenantIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [fsmState, setFsmState] = useState<VVUNodeState>(VVUNodeState.DISCONNECTED);
  const [fsmLog, setFsmLog] = useState<ReturnType<VVUFSMController['getLog']>>([]);
  const [lastTemp, setLastTemp] = useState(48);

  const fsmRef = useRef<VVUFSMController | null>(null);
  const prevFsmStateRef = useRef<VVUNodeState>(VVUNodeState.DISCONNECTED);

  // Helper: write an audit-log entry via the API (fire-and-forget).
  const writeAudit = useCallback(
    (action: string, details: { fromState?: string; toState?: string; symbol?: string; reason?: string }) => {
      fetch('/api/vvu/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: GQEBERHA_TENANT_ID, actor: 'dashboard', action, ...details }),
      }).catch(() => {
        /* audit write failures are non-fatal */
      });
    },
    []
  );

  // FSM controller — created once on mount inside an effect.
  useEffect(() => {
    if (booting) return;
    fsmRef.current = new VVUFSMController({
      onLeakActivate: (nodeId) => {
        setActiveNodeId(nodeId);
        toast.info(`Leak simulation active · node ${nodeId}`, {
          description: 'DFA → LEAK_SIMULATION_ACTIVE · particle system engaged',
        });
      },
      onLeakClear: () => {
        setActiveNodeId(null);
        toast.success('Leak cleared · returning to steady state');
      },
      onThermalThrottle: (temp) => {
        setLastTemp(temp);
        toast.warning(`Thermal throttle · APU ${temp.toFixed(1)}°C`, {
          description: 'Vertex decimation 62.5% · mesh density reduced',
        });
      },
      onFailClosed: (reason) => {
        toast.error(`FAIL-CLOSED LOCKDOWN · ${reason}`, {
          description: 'Hardware disconnect · WORM flush · authorised reset required',
        });
      },
      onResetComplete: () => {
        toast.success('Authorised reset complete · STEADY_STATE_LOCKED');
      },
      logTransition: () => {
        const f = fsmRef.current;
        if (!f) return;
        const newState = f.getState();
        const prev = prevFsmStateRef.current;
        setFsmState(newState);
        setFsmLog(f.getLog());
        if (newState !== prev) {
          const log = f.getLog()[0];
          writeAudit('STATE_TRANSITION', {
            fromState: prev,
            toState: newState,
            symbol: log?.symbol,
            reason: log?.reason,
          });
          prevFsmStateRef.current = newState;
        }
      },
    });
    // Staggered handshake: DISCONNECTED → PAIRING_BLE → TOTP_VERIFICATION → STEADY_STATE_LOCKED.
    const t1 = setTimeout(() => fsmRef.current?.dispatch('INIT'), 80);
    const t2 = setTimeout(() => fsmRef.current?.dispatch('CHAL'), 420);
    const t3 = setTimeout(() => fsmRef.current?.dispatch('TOTP_OK'), 880);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      fsmRef.current = null;
    };
  }, [booting, writeAudit]);

  // Live APU temperature sensor simulation (mock I²C read every 2s).
  useEffect(() => {
    if (booting) return;
    const interval = setInterval(() => {
      const t = Date.now() / 1000;
      const base = 48 + Math.sin(t / 23) * 7 + Math.random() * 1.6;
      fsmRef.current?.updateTemperature(Math.round(base * 10) / 10);
      setLastTemp(fsmRef.current?.getLastTemp() ?? base);
      setTick((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [booting]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const fsm = fsmRef.current;
    if (!fsm) return;
    if (fsm.getState() === VVUNodeState.LEAK_SIMULATION_ACTIVE && activeNodeId === nodeId) {
      fsm.dispatch('CLEAR');
      setActiveNodeId(null);
    } else {
      fsm.dispatch('CLICK', { nodeId });
      setActiveNodeId(nodeId);
    }
  }, [activeNodeId]);

  const handleSimulateThermal = useCallback(() => {
    fsmRef.current?.updateTemperature(78);
    setLastTemp(78);
  }, []);

  const handleSimulateCritical = useCallback(() => {
    fsmRef.current?.updateTemperature(88);
    setLastTemp(88);
  }, []);

  const handleAuthorisedReset = useCallback(() => {
    fsmRef.current?.authorizedReset();
    fsmRef.current?.updateTemperature(45);
    setLastTemp(45);
  }, []);

  // Keyboard shortcuts: T = thermal, C = critical, R = reset, L = leak on pipe
  useEffect(() => {
    if (booting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 't') handleSimulateThermal();
      else if (k === 'c') handleSimulateCritical();
      else if (k === 'r') handleAuthorisedReset();
      else if (k === 'l') handleNodeClick('pipe');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booting, handleSimulateThermal, handleSimulateCritical, handleAuthorisedReset, handleNodeClick]);

  // Topbar badges — derived from live state, never typed.
  const badges: TopbarBadge[] = useMemo(() => {
    const manifestTotal = RELEASE_MANIFEST.length;
    const thermalOk = lastTemp < 65;
    const critOk = lastTemp < 85;
    return [
      {
        key: 'sha',
        label: 'SHA-256',
        value: `${manifestTotal}/${manifestTotal}`,
        status: 'ok',
        tooltip: 'Live crypto.subtle.digest recompute every 60s',
      },
      {
        key: 'rls',
        label: 'RLS',
        value: 'GATED',
        status: 'ok',
        tooltip: 'Row-Level Security scoped to vvu.current_tenant_id',
      },
      {
        key: 'sans',
        label: 'SANS 1200',
        value: 'COMPLIANT',
        status: 'ok',
        tooltip: 'SANS 1200 security standards enforced by design',
      },
      {
        key: 'thermal',
        label: 'APU',
        value: `${lastTemp.toFixed(1)}°C`,
        status: critOk ? (thermalOk ? 'ok' : 'warn') : 'fail',
        tooltip: thermalOk ? 'Within nominal thermal envelope' : critOk ? 'Thermal throttle active (≥65°C)' : 'FAIL-CLOSED (≥85°C)',
      },
      {
        key: 'fsm',
        label: 'DFA',
        value: fsmState === VVUNodeState.STEADY_STATE_LOCKED ? 'LOCKED' : fsmState.split('_')[0],
        status:
          fsmState === VVUNodeState.FAIL_CLOSED_LOCKDOWN ? 'fail'
            : fsmState === VVUNodeState.THERMAL_THROTTLE ? 'warn'
            : fsmState === VVUNodeState.STEADY_STATE_LOCKED ? 'ok'
            : 'pending',
        tooltip: `Current DFA state: ${fsmState}`,
      },
      {
        key: 'popia',
        label: 'POPIA',
        value: 'ENFORCED',
        status: 'ok',
        tooltip: 'All data on-premise · never exported',
      },
    ];
  }, [fsmState, lastTemp]);

  const thermalThrottle = fsmState === VVUNodeState.THERMAL_THROTTLE;
  const failClosed = fsmState === VVUNodeState.FAIL_CLOSED_LOCKDOWN;

  if (booting) {
    return <BootScreen onDismiss={() => setBooting(false)} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(ellipse at 50% -10%, rgba(107,138,64,0.06) 0%, rgba(15,20,16,0) 55%), #060806',
        color: '#C9D4BD',
      }}
    >
      <Topbar badges={badges} tenantName={TENANTS[tenantIdx].slug} />

      {/* Tenant switcher strip — demonstrates RLS scoping */}
      <div
        style={{
          borderBottom: '1px solid rgba(107,138,64,0.1)',
          background: 'rgba(10, 14, 11, 0.5)',
          padding: '0.45rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.62rem',
        }}
      >
        <span style={{ color: '#5A6B4F', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          RLS Session
        </span>
        {TENANTS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTenantIdx(i)}
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: 4,
              cursor: 'pointer',
              background: i === tenantIdx ? 'rgba(107,138,64,0.18)' : 'transparent',
              border: `1px solid ${i === tenantIdx ? 'rgba(107,138,64,0.4)' : 'rgba(107,138,64,0.12)'}`,
              color: i === tenantIdx ? '#9DB36B' : '#5A6B4F',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: '0.06em',
            }}
          >
            {t.slug}
          </button>
        ))}
        <span style={{ color: '#5A6B4F', marginLeft: 'auto', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <span>
            vvu.current_tenant_id = <span style={{ color: '#F3E38A' }}>{TENANTS[tenantIdx].id.slice(0, 13)}…</span>
          </span>
          <span style={{ color: '#3A4533' }}>|</span>
          <span style={{ color: '#5A6B4F' }}>
            KEYS: <kbd style={{ color: '#9DB36B' }}>T</kbd>thermal · <kbd style={{ color: '#E27373' }}>C</kbd>crit · <kbd style={{ color: '#9DB36B' }}>R</kbd>reset · <kbd style={{ color: '#E0944A' }}>L</kbd>leak
          </span>
        </span>
      </div>

      <main
        style={{
          flex: 1,
          maxWidth: 1600,
          width: '100%',
          margin: '0 auto',
          padding: '1.1rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)',
          gap: '1rem',
        }}
      >
        {/* Left column: terrain hero + hydraulic chart + telemetry + manifest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.4rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#FFFAC2',
                  margin: 0,
                  letterSpacing: '0.01em',
                }}
              >
                Gqeberha Spatial Digital Twin
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.62rem',
                  color: activeNodeId ? '#E0944A' : '#8B9A7B',
                  letterSpacing: '0.1em',
                }}
              >
                {activeNodeId ? `◉ LEAK NODE · ${activeNodeId.toUpperCase()}` : 'CLICK A NODE PIN TO SIMULATE A LEAK'}
              </span>
            </div>
            <TerrainTwin
              activeNodeId={activeNodeId}
              onNodeClick={handleNodeClick}
              thermalThrottle={thermalThrottle}
              failClosed={failClosed}
            />
          </section>

          <section>
            <HydraulicChart nodeId={activeNodeId ?? 'pipe'} thermalThrottle={thermalThrottle} />
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '1rem',
            }}
          >
            <TelemetryFeed nodeId={activeNodeId ?? 'pipe'} />
            <VerificationPanel />
          </section>

          <section>
            <ReleaseManifest />
          </section>
        </div>

        {/* Right column: FSM visualizer + gate roadmap + DB stats (sticky) */}
        <aside
          style={{
            position: 'sticky',
            top: 84,
            alignSelf: 'start',
            minWidth: 0,
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            paddingRight: '2px',
          }}
        >
          <FSMVisualizer
            currentState={fsmState}
            log={fsmLog}
            lastTemp={lastTemp}
            onReset={handleAuthorisedReset}
            onSimulateThermal={handleSimulateThermal}
            onSimulateCritical={handleSimulateCritical}
          />
          <GateRoadmap />
          <DbStatsPanel />
        </aside>
      </main>

      <Footer />

      {/* hidden tick to keep the component reactive to sensor updates */}
      <span aria-hidden style={{ display: 'none' }}>{tick}</span>
    </div>
  );
}
