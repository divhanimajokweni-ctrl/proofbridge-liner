'use client';
import React, { useEffect, useState, useCallback } from 'react';
import DashboardWidget from '../../components/DashboardWidget';
import ProcessTable from '../../components/ProcessTable';
import MetricCard from '../../components/MetricCard';
import SystemStatusBar from '../../components/SystemStatusBar';
import dynamic from 'next/dynamic';

const VelocityChart = dynamic(
  () => import('../../components/VelocityChart'),
  { ssr: false },
);

// ─── Types ──────────────────────────────────────────────────────────────

interface DockerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  pids: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  state: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRssKb: number;
  user: string;
  command: string;
}

// ─── Live data hook ─────────────────────────────────────────────────────

function useInfraData() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [docker, setDocker] = useState<DockerInfo[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('—');

  useEffect(() => {
    let mounted = true;
    let ws: WebSocket | null = null;
    let fallbackTimer: ReturnType<typeof setInterval>;

    try {
      ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => { if (mounted) setConnected(true); };
      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry:pulse' && msg.data) {
            const d = msg.data;

            setProcesses(
              (d.processes || []).map((p: any) => ({
                pid: p.pid,
                name: p.name,
                state: p.state,
                cpuPercent: p.cpuPercent ?? 0,
                memoryPercent: p.memoryPercent ?? 0,
                memoryRssKb: p.memoryRssKb ?? 0,
                user: p.user ?? 'root',
                command: p.command ?? p.name,
              })),
            );

            setDocker(
              (d.docker || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                image: c.image,
                state: c.state,
                status: c.status,
                cpuPercent: c.cpuPercent ?? 0,
                memoryUsageMb: c.memoryUsageMb ?? 0,
                memoryLimitMb: c.memoryLimitMb ?? 0,
                memoryPercent: c.memoryPercent ?? 0,
                pids: c.pids ?? 0,
              })),
            );

            setLastUpdate(new Date(d.timestamp).toLocaleTimeString());
          }
        } catch { /* ignore */ }
      };
      ws.onclose = () => { if (mounted) setConnected(false); };
      ws.onerror = () => { ws?.close(); };
    } catch {
      // Fallback: generate mock data
      fallbackTimer = setInterval(() => {
        if (!mounted) return;
        setProcesses(
          Array.from({ length: 50 }, (_, i) => ({
            pid: 1000 + i,
            name: ['systemd', 'sshd', 'nginx', 'node', 'dockerd', 'bash', 'cron'][
              Math.floor(Math.random() * 7)
            ],
            state: Math.random() > 0.2 ? 'R' : 'S',
            cpuPercent: Math.round(Math.random() * 30 * 10) / 10,
            memoryPercent: Math.round(Math.random() * 5 * 10) / 10,
            memoryRssKb: Math.round(Math.random() * 256000),
            user: ['root', 'runner', 'daemon', 'nobody'][Math.floor(Math.random() * 4)],
            command: '/usr/bin/service --daemon',
          })),
        );
        setDocker([
          { id: 'a1b2c3d4e5f6', name: 'safekrypte-lite', image: 'node:22', state: 'running', status: 'Up 2 hours', cpuPercent: 2.3, memoryUsageMb: 128, memoryLimitMb: 512, memoryPercent: 25, pids: 12 },
          { id: 'f7e8d9c0b1a2', name: 'safeline-lite', image: 'node:22', state: 'running', status: 'Up 2 hours', cpuPercent: 1.8, memoryUsageMb: 96, memoryLimitMb: 512, memoryPercent: 18.8, pids: 8 },
        ]);
        setLastUpdate(new Date().toLocaleTimeString());
      }, 3000);
    }

    return () => {
      mounted = false;
      clearInterval(fallbackTimer);
      ws?.close();
    };
  }, []);

  return { processes, docker, connected, lastUpdate };
}

// ─── Infrastructure Dashboard ───────────────────────────────────────────

export default function InfraDashboardPage() {
  const { processes, docker, connected, lastUpdate } = useInfraData();

  const handleKill = useCallback(async (pid: number) => {
    if (!confirm(`Kill PID ${pid}?`)) return;
    try {
      const ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'command:exec',
          command: 'kill',
          args: { pid, signal: 'SIGTERM' },
          pid: String(pid),
        }));
        ws.close();
      };
    } catch (err) {
      console.error('Kill command failed:', err);
    }
  }, []);

  const cpuTotal = processes.reduce((s, p) => s + p.cpuPercent, 0);
  const memTotal = processes.reduce((s, p) => s + p.memoryRssKb, 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 32px)',
    }}>
      {/* ═══ HEADER ═══════════════════════════════════ */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: '#fff',
            margin: 0,
          }}>
            ⚙️ INFRASTRUCTURE
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
          }}>
            Processes · Containers · Compute Resources · Last update: {lastUpdate}
            <span style={{
              display: 'inline-block',
              width: 5, height: 5,
              borderRadius: '50%',
              background: connected ? 'var(--color-green)' : 'var(--color-crimson)',
              marginLeft: 8,
            }} />
          </p>
        </div>
      </header>

      {/* ═══ QUICK STATS ═══════════════════════════════ */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        padding: '12px 20px',
      }}>
        <MetricCard label="Total Processes" value={processes.length} color="var(--color-cyan)" source={connected ? 'Live' : 'Mock'} />
        <MetricCard label="CPU Aggregate" value={cpuTotal.toFixed(0)} unit="%" trend={cpuTotal > 100 ? 'up' : 'stable'} trendValue={`${cpuTotal.toFixed(0)}%`} color={cpuTotal > 200 ? 'var(--color-crimson)' : 'var(--color-gold)'} />
        <MetricCard label="Memory Total" value={(memTotal / (1024 * 1024)).toFixed(1)} unit="GB" color="var(--color-green)" />
        <MetricCard label="Docker Containers" value={docker.length} unit="running" color="var(--color-blue)" />
      </section>

      {/* ═══ MAIN GRID ═════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '12px',
        padding: '0 20px',
        flex: 1,
      }}>
        {/* Left: Process Table */}
        <DashboardWidget
          title="PROCESS TABLE"
          subtitle={`${processes.length} processes · virtual-scrolled (${Math.min(processes.length, 20)}+ buffer rows)`}
          statusColor={connected ? 'var(--color-green)' : 'var(--color-crimson)'}
        >
          <ProcessTable
            processes={processes}
            visibleRows={18}
            onKill={handleKill}
          />
        </DashboardWidget>

        {/* Right: Docker + Velocity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DashboardWidget
            title="DOCKER CONTAINERS"
            subtitle={docker.length > 0 ? `${docker.length} running` : 'No Docker daemon'}
            statusColor={docker.length > 0 ? 'var(--color-blue)' : 'var(--color-text-muted)'}
          >
            {docker.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.4rem, 0.6vw, 0.5rem)',
              }}>
                {docker.map(c => (
                  <div
                    key={c.id}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--color-card)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.55rem' }}>{c.name}</span>
                      <span style={{
                        color: c.state === 'running' ? 'var(--color-green)' : 'var(--color-crimson)',
                        fontSize: '0.4rem',
                        padding: '1px 6px',
                        border: '1px solid',
                        borderColor: c.state === 'running' ? 'var(--color-green-border)' : 'var(--color-crimson-border)',
                        borderRadius: 4,
                      }}>
                        {c.state.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>CPU</span>
                      <span style={{ color: 'var(--color-cyan)', textAlign: 'right' }}>{c.cpuPercent.toFixed(1)}%</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>Memory</span>
                      <span style={{ color: 'var(--color-gold)', textAlign: 'right' }}>{c.memoryUsageMb.toFixed(0)} MB</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>PIDs</span>
                      <span style={{ color: '#fff', textAlign: 'right' }}>{c.pids}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>Image</span>
                      <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{c.image}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                color: 'var(--color-text-muted)',
              }}>
                Docker daemon not reachable on /var/run/docker.sock
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget title="VELOCITY CHART" subtitle="Token allocation (12h window)">
            <VelocityChart />
          </DashboardWidget>
        </div>
      </div>

      {/* ═══ STATUS BAR ════════════════════════════════ */}
      <SystemStatusBar />
    </div>
  );
}
