'use client';
import React, { useEffect, useRef, useState } from 'react';

interface StatusBarData {
  cpu: number;
  memory: number;
  load: number;
  processes: number;
  docker: number;
  uptime: number;
  connected: boolean;
}

interface SystemStatusBarProps {
  /** WebSocket URL to connect to */
  wsUrl?: string;
  /** Fallback data if WebSocket unavailable */
  fallbackData?: Partial<StatusBarData>;
}

/**
 * SystemStatusBar — a thin, always-visible status bar that connects
 * to the telemetry WebSocket and displays live system health.
 *
 * Shows: CPU, Memory, Load, Processes, Docker containers, Uptime.
 * Falls back to static data if telemetry server is down.
 */
export default function SystemStatusBar({
  wsUrl = 'ws://localhost:3001',
  fallbackData,
}: SystemStatusBarProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<StatusBarData>({
    cpu: fallbackData?.cpu ?? 0,
    memory: fallbackData?.memory ?? 0,
    load: fallbackData?.load ?? 0,
    processes: fallbackData?.processes ?? 0,
    docker: fallbackData?.docker ?? 0,
    uptime: fallbackData?.uptime ?? 0,
    connected: false,
  });
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (!mounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setData(prev => ({ ...prev, connected: true }));
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'telemetry:pulse' && msg.data) {
              const s = msg.data;
              setData(prev => ({
                ...prev,
                cpu: s.cpu?.totalPercent ?? prev.cpu,
                memory: s.memory?.usedPercent ?? prev.memory,
                load: s.load?.load1 ?? prev.load,
                processes: s.processes?.length ?? prev.processes,
                docker: s.docker?.length ?? prev.docker,
                uptime: Math.floor((Date.now() - s.timestamp) / 1000),
                connected: true,
              }));
            }
          } catch { /* ignore parse errors */ }
        };

        ws.onclose = () => {
          if (!mounted) return;
          setData(prev => ({ ...prev, connected: false }));
          wsRef.current = null;
          // Reconnect after 5s with exponential backoff capped at 30s
          const delay = Math.min(5000 * Math.pow(1.5, reconnectCount), 30000);
          reconnectTimer = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, delay);
        };

        ws.onerror = () => {
          // onerror triggers onclose, which handles reconnect
          ws.close();
        };
      } catch {
        // WebSocket URL invalid — reconnect later
        reconnectTimer = setTimeout(() => {
          setReconnectCount(prev => prev + 1);
          connect();
        }, 10000);
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [wsUrl, reconnectCount]);

  const statusColor = data.connected ? 'var(--color-green)' : 'var(--color-crimson)';
  const uptimeStr = data.uptime < 60
    ? `${data.uptime}s`
    : data.uptime < 3600
      ? `${Math.floor(data.uptime / 60)}m ${data.uptime % 60}s`
      : `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`;

  return (
    <div
      className="vvu-status-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: 'var(--color-void)',
        borderTop: '1px solid var(--color-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.4rem, 0.6vw, 0.5rem)',
        color: 'var(--color-text-muted)',
        gap: 12,
        flexWrap: 'wrap',
        minHeight: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Connection status */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
          {data.connected ? 'LIVE' : 'OFFLINE'}
        </span>

        <span style={{ color: 'var(--color-border)' }}>|</span>

        {/* Metrics */}
        <span>
          CPU: <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{data.cpu.toFixed(1)}%</span>
        </span>
        <span>
          MEM: <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{data.memory.toFixed(1)}%</span>
        </span>
        <span>
          LOAD: <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>{data.load.toFixed(2)}</span>
        </span>
        <span>
          PROCS: <span style={{ fontWeight: 700, color: '#fff' }}>{data.processes}</span>
        </span>

        {data.docker > 0 && (
          <>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>
              DOCKER: <span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>{data.docker}</span>
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>⏱ {uptimeStr}</span>
        {!data.connected && reconnectCount > 0 && (
          <span style={{ color: 'var(--color-crimson)' }}>
            reconnecting ({reconnectCount})…
          </span>
        )}
      </div>
    </div>
  );
}
