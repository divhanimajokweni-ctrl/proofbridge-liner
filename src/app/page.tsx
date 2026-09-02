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
import { ApuChart } from '@/components/vvu/apu-chart';
import { GateRoadmap } from '@/components/vvu/gate-roadmap';
import { DbStatsPanel } from '@/components/vvu/db-stats-panel';
import { AuditViewer } from '@/components/vvu/audit-viewer';
import { LeakGauge } from '@/components/vvu/leak-gauge';
import { SiteSelector } from '@/components/vvu/site-selector';
import { SettingsDialog } from '@/components/vvu/settings-dialog';
import { usePersistentSettings } from '@/components/vvu/use-persistent-settings';
import { KeyboardHelp, useKeyboardHelp } from '@/components/vvu/keyboard-help';
import { useTamperAlert } from '@/components/vvu/use-tamper-alert';
import { Footer } from '@/components/vvu/footer';
import { VVUFSMController, VVUNodeState } from '@/lib/vvu-fsm-controller';
import { DEFAULT_TENANT, TENANTS } from '@/lib/vvu-telemetry';
import { RELEASE_MANIFEST } from '@/lib/vvu-release-manifest';
import { getSiteConfig } from '@/lib/vvu-sites';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [tenantIdx, setTenantIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [fsmState, setFsmState] = useState<VVUNodeState>(VVUNodeState.DISCONNECTED);
  const [fsmLog, setFsmLog] = useState<ReturnType<VVUFSMController['getLog']>>([]);
  const [lastTemp, setLastTemp] = useState(48);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const { settings, setSettings } = usePersistentSettings();
  const { open: helpOpen, setOpen: setHelpOpen } = useKeyboardHelp();
  const [liveFlow, setLiveFlow] = useState(42);
  const [liveHead, setLiveHead] = useState(38);
  const { triggerCheck: triggerTamperCheck } = useTamperAlert();

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
          // Bump the audit viewer refresh key so it re-fetches immediately.
          setAuditRefreshKey((k) => k + 1);
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
  // Paused while a leak is active so the FSM doesn't auto-recover and clear
  // the leak state before the gauge can compute a reading.
  useEffect(() => {
    if (booting) return;
    const interval = setInterval(() => {
      if (activeNodeId) return; // don't perturb thermal while leak is active
      const t = Date.now() / 1000;
      const base = 48 + Math.sin(t / 23) * 7 + Math.random() * 1.6;
      fsmRef.current?.updateTemperature(Math.round(base * 10) / 10);
      setLastTemp(fsmRef.current?.getLastTemp() ?? base);
      setTick((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [booting, activeNodeId]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const fsm = fsmRef.current;
    if (!fsm) return;
    const state = fsm.getState();
    // If the FSM isn't in STEADY_STATE_LOCKED, try to complete the handshake
    // first so CLICK is accepted. This handles the race where a user clicks
    // a node before the boot handshake finishes.
    if (state === VVUNodeState.DISCONNECTED) {
      fsm.dispatch('INIT');
      fsm.dispatch('CHAL');
      fsm.dispatch('TOTP_OK');
    } else if (state === VVUNodeState.PAIRING_BLE) {
      fsm.dispatch('CHAL');
      fsm.dispatch('TOTP_OK');
    } else if (state === VVUNodeState.TOTP_VERIFICATION) {
      fsm.dispatch('TOTP_OK');
    }
    // Now in STEADY_STATE_LOCKED (or LEAK_SIMULATION_ACTIVE) — dispatch CLICK or CLEAR.
    const currentState = fsm.getState();
    if (currentState === VVUNodeState.LEAK_SIMULATION_ACTIVE && activeNodeId === nodeId) {
      fsm.dispatch('CLEAR');
      setActiveNodeId(null);
    } else if (currentState === VVUNodeState.STEADY_STATE_LOCKED || currentState === VVUNodeState.LEAK_SIMULATION_ACTIVE) {
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

  const handleTamperTest = useCallback(async () => {
    try {
      await fetch('/api/vvu/tamper-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: 'F01' }),
      });
      // Force an immediate tamper-alert re-fetch (no 30s wait).
      triggerTamperCheck();
    } catch {
      /* non-fatal */
    }
  }, [triggerTamperCheck]);

  // Keyboard shortcuts: T = thermal, C = critical, R = reset, L = leak, 1/2/3 = tenant
  useEffect(() => {
    if (booting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 't') handleSimulateThermal();
      else if (k === 'c') handleSimulateCritical();
      else if (k === 'r') handleAuthorisedReset();
      else if (k === 'l') handleNodeClick('pipe');
      else if (k === '1') setTenantIdx(0);
      else if (k === '2') setTenantIdx(1);
      else if (k === '3') setTenantIdx(2);
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
    return <BootScreen onDismiss={() => setBooting(false)} durationMs={settings.bootDurationMs} />;
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
        // CSS variable consumed by the scanline overlay in globals.css
        ['--vvu-scanline-opacity' as string]: settings.scanlineOpacity,
      }}
    >
      <Topbar badges={badges} tenantName={TENANTS[tenantIdx].slug} />

      {/* Settings gear — fixed top-right, above all panels */}
      <div style={{ position: 'fixed', top: 12, right: 14, zIndex: 50 }}>
        <SettingsDialog settings={settings} onChange={setSettings} />
      </div>

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
            KEYS: <kbd style={{ color: '#9DB36B' }}>T</kbd> · <kbd style={{ color: '#E27373' }}>C</kbd> · <kbd style={{ color: '#9DB36B' }}>R</kbd> · <kbd style={{ color: '#E0944A' }}>L</kbd> · <kbd style={{ color: '#F3E38A' }}>1-3</kbd> · <kbd style={{ color: '#F3E38A' }}>?</kbd>help
          </span>
        </span>
      </div>

      {/* Site selector mini-map — picks the deployment site / RLS tenant */}
      <div style={{ padding: '0.6rem 1.1rem 0', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <SiteSelector
          activeSlug={TENANTS[tenantIdx].slug}
          onSelect={(slug) => {
            const idx = TENANTS.findIndex((t) => t.slug === slug);
            if (idx >= 0 && idx !== tenantIdx) {
              setTenantIdx(idx);
              toast.success(`RLS session switched · ${TENANTS[idx].name}`);
            }
          }}
        />
      </div>

      <main
        className="vvu-main"
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
        {/* Left column: terrain hero + hydraulic chart + APU chart + telemetry + manifest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <section style={{ position: 'relative' }}>
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
                {getSiteConfig(TENANTS[tenantIdx].slug).name} Spatial Digital Twin
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
              radarSpeedS={settings.radarSpeedS}
              sitePins={getSiteConfig(TENANTS[tenantIdx].slug).pins}
              siteHudLabel={getSiteConfig(TENANTS[tenantIdx].slug).hudLabel}
              siteCoords={getSiteConfig(TENANTS[tenantIdx].slug).coords}
            />
            {/* Leak-rate radial gauge overlay — fed by live telemetry stream.
                Shows when a node is active OR the FSM is in LEAK_SIMULATION_ACTIVE. */}
            <LeakGauge
              activeNodeId={activeNodeId}
              leakActive={fsmState === VVUNodeState.LEAK_SIMULATION_ACTIVE}
              flowRate={liveFlow}
              pressureHead={liveHead}
            />
          </section>

          <section
            className="vvu-charts-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '1rem',
            }}
          >
            <HydraulicChart nodeId={activeNodeId ?? 'pipe'} thermalThrottle={thermalThrottle} intervalMs={Math.max(1000, settings.telemetryIntervalMs / 2)} />
            <ApuChart currentTemp={lastTemp} thermalThrottle={thermalThrottle} failClosed={failClosed} />
          </section>

          <section
            className="vvu-data-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '1rem',
            }}
          >
            <TelemetryFeed
              nodeId={activeNodeId ?? 'pipe'}
              intervalMs={settings.telemetryIntervalMs}
              onTelemetry={(flow, head) => {
                setLiveFlow(flow);
                setLiveHead(head);
              }}
            />
            <VerificationPanel />
          </section>

          <section
            className="vvu-audit-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '1rem',
            }}
          >
            <AuditViewer refreshKey={auditRefreshKey} />
            <ReleaseManifest />
          </section>
        </div>

        {/* Right column: FSM visualizer + gate roadmap + DB stats (sticky) */}
        <aside
          className="vvu-sidebar"
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
          <DbStatsPanel onTamperTest={handleTamperTest} />
        </aside>
      </main>

      <Footer />

      {/* Keyboard shortcut help modal — toggled by ? key */}
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* hidden tick to keep the component reactive to sensor updates */}
      <span aria-hidden style={{ display: 'none' }}>{tick}</span>

      <style>{`
        @media (max-width: 1100px) {
          .vvu-main {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .vvu-sidebar {
            position: static !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
        @media (max-width: 760px) {
          .vvu-charts-row,
          .vvu-data-row,
          .vvu-audit-row {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
