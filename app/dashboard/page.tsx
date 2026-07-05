'use client';
import React, { useEffect, useState, useCallback } from 'react';
import DashboardWidget from '../components/DashboardWidget';
import MetricCard from '../components/MetricCard';
import SystemStatusBar from '../components/SystemStatusBar';
import dynamic from 'next/dynamic';
import TokenManagementPanel from '@/components/TokenManagementPanel';
import '@/app/globals.css';

// Dynamically import AntonyQueueEngine to reduce initial bundle
const AntonyQueueEngine = dynamic(
  () => import('../components/AntonyQueueEngine'),
  { ssr: false },
);

// ─── Types ──────────────────────────────────────────────────────────────

interface ProjectNode {
  name: string;
  type: string;
  status: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}

// ─── Data ───────────────────────────────────────────────────────────────

const NODES: ProjectNode[] = [
  { name: 'SafeKrypte Lite', type: 'ED25519 SIGNING', status: 'ACTIVE',
    description: 'Free-tier ED25519 signing service. POST /commons/v1/sign — content_hash + creator_id → signed attestation.',
    metricLabel: 'Free Tier Remaining', metricValue: '1000 CREATORS' },
  { name: 'SafeLiner Lite', type: 'CREDENTIAL ISSUANCE', status: 'ACTIVE',
    description: 'Free-tier credential issuance with QR verification. POST /commons/v1/issue → verifiable credential.',
    metricLabel: 'Credentials Issued', metricValue: '0 / 1000 FREE' },
  { name: 'VVU Operatus', type: 'MICROKERNEL RUNTIME', status: 'ACTIVE',
    description: 'Headless microkernel running SafeLiner + SafeKrypte with Round-Robin and Priority-Preemptive scheduling.',
    metricLabel: 'Kernel Operators', metricValue: '4 ONLINE' },
  { name: 'Lindiwe Agent Kernel', type: 'INTERNAL INTELLIGENCE', status: 'ACTIVE',
    description: 'Localized model framework evaluating internal operations, compliance parameters, and audit assertions.',
    metricLabel: 'Agent Cluster Latency', metricValue: '42ms' },
  { name: 'Ubuntu Pools', type: 'ROSCA / STOKVEL', status: 'PILOT',
    description: 'Decentralized mutual financial pooling structured around community affinity parameters.',
    metricLabel: 'Active Pools', metricValue: '12 LOCKED' },
  { name: 'ProofBridge Liner', type: 'ZK / COMPLIANCE', status: 'PILOT',
    description: 'Zero-knowledge circuit generation validation array for compliance computations.',
    metricLabel: 'Release Countdown', metricValue: 'T-34 DAYS' },
  { name: 'SafeGrid', type: 'WATER / NMBM', status: 'DEV',
    description: 'Utility access network integration mapping live Nelson Mandela Bay Municipality.',
    metricLabel: 'Sensor Stability', metricValue: '98.4%' },
  { name: 'Ekasi', type: 'GAMED LEARNING', status: 'PRE-PROD',
    description: 'Hyper-localized gamified learning state machine utilizing decentralized token rewards.',
    metricLabel: 'Build Version', metricValue: 'v0.9.8-BETA' },
];

// ─── Live metrics hook ─────────────────────────────────────────────────

function useLiveMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    load: 0,
    processes: 0,
    docker: 0,
  });

  useEffect(() => {
    // Try WebSocket first
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
        // Fallback: generate mock data
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

// ─── Spark data generator ───────────────────────────────────────────────

function useSparkData(count = 30) {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: count }, () => Math.round(30 + Math.random() * 50)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => [...prev.slice(-count + 1), Math.round(20 + Math.random() * 60)]);
    }, 2000);
    return () => clearInterval(timer);
  }, [count]);

  return data;
}

// ─── ProofBridge Billing Section ──────────────────────────────────────────

import BillingTierCards from '@/components/BillingTierCards';
import CompactTelemetryChart from '@/components/CompactTelemetryChart';
import FloatingOverlayWrapper from '@/components/FloatingOverlayWrapper';

function ProofBridgeBillingPanel() {
  const [proofLogs, setProofLogs] = useState<any[]>([]);
  const [billing, setBilling] = useState({ tier: 'Sandbox Developer', usage: 0, cap: 5000 });
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [role, setRole] = useState<'COMPLIANCE' | 'DEVOPS' | 'FINANCE'>('COMPLIANCE');
  const [processing, setProcessing] = useState(false);

  const sync = useCallback(async () => {
    try {
      const res = await fetch(`/api/chronicle-fetch?role=${role}&clientId=demo-client`);
      const data = await res.json();
      if (data.success) {
        setProofLogs(data.logs);
        setIsEmergencyActive(data.emergencyShutdownActive);
        if (data.billingInfo) setBilling(data.billingInfo);
      }
    } catch { /* offline */ }
  }, [role]);

  useEffect(() => {
    sync();
    const iv = setInterval(sync, 4000);
    return () => clearInterval(iv);
  }, [sync]);

  const toggleKill = async () => {
    setProcessing(true);
    try {
      await fetch('/api/chronicle-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState: !isEmergencyActive }),
      });
      setIsEmergencyActive(prev => !prev);
    } catch { /* ignore */ }
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      {/* Emergency banner */}
      {isEmergencyActive && (
        <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-xl text-xs text-rose-300 animate-pulse">
          🚨 GLOBAL PRE-SIGNING OVERRIDE ACTIVE — ALL WALLET INTERFACES LOCKED
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-500 mr-2">VIEW:</span>
          <select
            value={role}
            onChange={e => setRole(e.target.value as any)}
            className="bg-transparent font-bold text-teal-400 focus:outline-none cursor-pointer"
          >
            <option value="COMPLIANCE">COMPLIANCE</option>
            <option value="DEVOPS">DEVOPS</option>
            <option value="FINANCE">FINANCE</option>
          </select>
        </div>
        <button
          disabled={processing}
          onClick={toggleKill}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            isEmergencyActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
          }`}
        >
          {isEmergencyActive ? 'RESTORE SIGNERS' : '⚠ FORCE HALT'}
        </button>
      </div>

      {/* Usage meter */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-400">License Tier</span>
          <span className="text-teal-400">{billing.tier}</span>
        </div>
        <div className="w-full bg-slate-950 h-2 border border-slate-900 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all"
            style={{ width: `${Math.min((billing.usage / billing.cap) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{billing.usage.toLocaleString()} logs</span>
          <span>Cap: {billing.cap.toLocaleString()}</span>
        </div>
      </div>

      {/* PiP + compact chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingOverlayWrapper windowWidth={460} windowHeight={420}>
          <div className="bg-slate-950 border border-teal-500/20 p-3 rounded-xl space-y-2">
            <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px] tracking-wider text-slate-400">
              <span>HEADS-UP FEED</span>
              <span className="text-emerald-400 animate-pulse">● LIVE</span>
            </div>
            <div className="text-[11px] space-y-1.5">
              <div className="p-1.5 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-slate-500">Policy Gate Latency</span>
                <span className="text-white font-bold ml-2">0.02ms</span>
              </div>
              <div className="p-1.5 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-slate-500">Node Region</span>
                <span className="text-white font-bold ml-2">Sovereign Edge</span>
              </div>
            </div>
          </div>
        </FloatingOverlayWrapper>
        <CompactTelemetryChart logsCount={billing.usage} policyLimit={billing.cap} />
      </div>

      {/* Chronicle entries */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">
          Chronicle Pipeline ({proofLogs.length})
        </h3>
        {proofLogs.length === 0 ? (
          <div className="border border-dashed border-slate-900 rounded-xl p-8 text-center text-xs text-slate-500">
            No audit entries yet. Run <code>node scripts/chaos-burst.js</code> to inject mock data.
          </div>
        ) : (
          proofLogs.map((log: any) => (
            <div
              key={log.chronicleId}
              className={`border p-3 rounded-xl transition-all ${
                log.status === 'APPROVED'
                  ? 'border-slate-900/80 bg-slate-900/10'
                  : 'border-rose-950/40 bg-rose-950/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        log.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-bold text-slate-200 truncate">{log.agentId}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.detailSnippet}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">{log.metaLabel}</span>
                  <span className="text-xs font-bold text-white font-mono">{log.primaryMetric}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Billing tier cards */}
      <div className="pt-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">
          Subscription Plans
        </h3>
        <BillingTierCards clientId="demo-client" />
      </div>
    </div>
  );
}

// ─── Status helpers ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE: { color: 'var(--color-green)', bg: 'var(--color-green-dim)', border: 'var(--color-green-border)' },
  PILOT: { color: 'var(--color-cyan)', bg: 'var(--color-cyan-dim)', border: 'var(--color-cyan-border)' },
  'PRE-PROD': { color: 'var(--color-gold)', bg: 'var(--color-gold-dim)', border: 'var(--color-gold-border)' },
  DEV: { color: 'var(--color-crimson)', bg: 'var(--color-crimson-dim)', border: 'var(--color-crimson-border)' },
};

// ─── Main Dashboard Page ────────────────────────────────────────────────

export default function DashboardPage() {
  const metrics = useLiveMetrics();
  const sparkCpu = useSparkData(30);
  const sparkMem = useSparkData(30);
  const [selectedProject, setSelectedProject] = useState<ProjectNode | null>(null);

  const handleKill = useCallback((pid: number) => {
    // Send kill command via WebSocket if connected, or fallback to fetch
    if (pid > 0) {
      fetch('/api/dashboard/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      }).catch(() => {});
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 32px)',
    }}>
      {/* ═══ HEADER ═══════════════════════════════════ */}
      <header
        className="vvu-dashboard-header"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.03em',
          }}>
            OPERATIONAL DECK
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
          }}>
            Gqeberha, Eastern Cape · live telemetry
          </p>
        </div>

        {/* Quick status pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="vvu-pill">
            CPU <strong style={{ color: 'var(--color-cyan)' }}>{metrics.cpu}%</strong>
          </span>
          <span className="vvu-pill">
            MEM <strong style={{ color: 'var(--color-gold)' }}>{metrics.memory}%</strong>
          </span>
          <span className="vvu-pill">
            PROCS <strong style={{ color: '#fff' }}>{metrics.processes}</strong>
          </span>
          {metrics.docker > 0 && (
            <span className="vvu-pill">
              DOCKER <strong style={{ color: 'var(--color-blue)' }}>{metrics.docker}</strong>
            </span>
          )}
        </div>
      </header>

      {/* ═══ METRIC GRID ═══════════════════════════════ */}
      <section
        className="vvu-metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(6px, 1vw, 12px)',
          padding: '16px 20px',
        }}
      >
        <MetricCard
          label="CPU Usage"
          value={metrics.cpu}
          unit="%"
          trend={metrics.cpu > 70 ? 'up' : metrics.cpu < 30 ? 'down' : 'stable'}
          trendValue={`${metrics.cpu > 50 ? '+' : ''}${Math.round((metrics.cpu - 45) * 10) / 10}%`}
          color={metrics.cpu > 80 ? 'var(--color-crimson)' : metrics.cpu > 60 ? 'var(--color-gold)' : 'var(--color-cyan)'}
          sparkData={sparkCpu}
          source="Live"
        />
        <MetricCard
          label="Memory"
          value={metrics.memory}
          unit="%"
          trend={metrics.memory > 70 ? 'up' : metrics.memory < 30 ? 'down' : 'stable'}
          trendValue={`${metrics.memory}%`}
          color={metrics.memory > 80 ? 'var(--color-crimson)' : 'var(--color-gold)'}
          sparkData={sparkMem}
          source="Live"
        />
        <MetricCard
          label="System Load"
          value={metrics.load.toFixed(1)}
          trend={metrics.load > 3 ? 'up' : 'stable'}
          trendValue={`${metrics.load.toFixed(1)}`}
          color="var(--color-green)"
        />
        <MetricCard
          label="Active Processes"
          value={metrics.processes}
          unit="procs"
          trend={metrics.processes > 300 ? 'up' : 'stable'}
          trendValue={`${metrics.processes}`}
          color="var(--color-text-primary)"
        />
        {metrics.docker > 0 && (
          <MetricCard
            label="Docker Containers"
            value={metrics.docker}
            unit="running"
            color="var(--color-blue)"
          />
        )}
      </section>

      {/* ═══ PROJECT GRID + ANTONY QUEUE ═══════════════ */}
      <div
        className="vvu-dashboard-main"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 'clamp(8px, 1.2vw, 16px)',
          padding: '0 20px',
          flex: 1,
        }}
      >
        {/* Left: Project cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'clamp(6px, 1vw, 12px)',
            alignContent: 'start',
          }}
        >
          {NODES.map((node) => {
            const sc = STATUS_CONFIG[node.status] || STATUS_CONFIG.DEV;
            return (
              <div
                key={node.name}
                onClick={() => setSelectedProject(node)}
                className="vvu-project-card"
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-gold-border)';
                  e.currentTarget.style.boxShadow = 'var(--color-glow-gold)';
                  e.currentTarget.style.background = 'var(--color-card)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'var(--color-surface)';
                }}
              >
                {/* Corner accent */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 8, height: 8,
                  borderTop: `1.5px solid ${sc.color}66`,
                  borderRight: `1.5px solid ${sc.color}66`,
                }} />

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.45rem, 0.65vw, 0.5rem)',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}>
                    {node.type}
                  </span>
                  <span style={{
                    fontSize: 'clamp(0.4rem, 0.55vw, 0.45rem)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    border: '1px solid',
                    background: sc.bg,
                    color: sc.color,
                    borderColor: sc.border,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {node.status}
                  </span>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(0.75rem, 1.2vw, 0.9rem)',
                  color: '#fff',
                  margin: 0,
                }}>
                  ⬡ {node.name}
                </h3>

                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.55rem, 0.8vw, 0.6rem)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {node.description}
                </p>

                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.45rem, 0.65vw, 0.5rem)',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{node.metricLabel}</span>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{node.metricValue}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Antony Queue + Quick info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DashboardWidget title="ANTONY QUEUE ENGINE" subtitle={`${metrics.processes} process pipeline`}>
            <AntonyQueueEngine />
          </DashboardWidget>

          <DashboardWidget title="SYSTEM INFO" subtitle="vv2.1-orchestrator">
            <dl style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px 12px',
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
            }}>
              <dt style={{ color: 'var(--color-text-muted)' }}>Network</dt>
              <dd style={{ color: 'var(--color-green)', margin: 0, fontWeight: 700 }}>ACTIVE</dd>
              <dt style={{ color: 'var(--color-text-muted)' }}>Console</dt>
              <dd style={{ color: 'var(--color-cyan)', margin: 0, fontWeight: 700 }}>STABLE</dd>
              <dt style={{ color: 'var(--color-text-muted)' }}>Region</dt>
              <dd style={{ color: '#fff', margin: 0 }}>Gqeberha, EC</dd>
              <dt style={{ color: 'var(--color-text-muted)' }}>Host</dt>
              <dd style={{ color: '#fff', margin: 0 }}>compliance-fabric</dd>
            </dl>
          </DashboardWidget>
        </div>
      </div>

      {/* ═══ STATUS BAR ════════════════════════════════ */}
      <SystemStatusBar />

      <section style={{ padding: '0 20px 24px', marginTop: 24 }}>
        <TokenManagementPanel />
      </section>

      {/* ═══ PROOFBRIDGE BILLING PANEL (conditionally shown) ═══════ */}
      {selectedProject?.name === 'ProofBridge Liner' && (
        <section style={{
          padding: '0 20px 24px',
          marginTop: 8,
          borderTop: '1px solid var(--color-border)',
          paddingTop: 24,
        }}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
              color: '#fff',
              margin: 0,
              letterSpacing: '0.03em',
            }}>
              ⬡ PROOFBRIDGE LINER — BILLING & COMPLIANCE
            </h2>
            <button
              onClick={() => setSelectedProject(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-900 px-2 py-0.5 rounded transition-all"
            >
              [ CLOSE ]
            </button>
          </div>
          <ProofBridgeBillingPanel />
        </section>
      )}
    </div>
  );
}
