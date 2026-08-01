'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface ProcessRow {
  pid: number;
  name: string;
  state: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRssKb: number;
  user: string;
  command: string;
}

interface ProcessTableProps {
  processes: ProcessRow[];
  /** Row height in pixels */
  rowHeight?: number;
  /** Maximum visible rows */
  visibleRows?: number;
  /** Called when a kill/signal action is requested */
  onKill?: (pid: number) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * ProcessTable — virtual-scrolled table that renders only visible DOM nodes.
 *
 * Uses a simple windowing approach: computes the scroll position and
 * renders only `visibleRows` + 2 buffer rows. Reuses DOM nodes as the
 * user scrolls through thousands of processes.
 */
export default function ProcessTable({
  processes,
  rowHeight = 36,
  visibleRows = 20,
  onKill,
  loading = false,
}: ProcessTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = processes.length * rowHeight;
  const bufferRows = 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRows);
  const endIndex = Math.min(
    processes.length,
    Math.ceil((scrollTop + visibleRows * rowHeight) / rowHeight) + bufferRows,
  );

  const visibleItems = processes.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // State colors
  const stateColor = (state: string): string => {
    switch (state) {
      case 'R': return 'var(--color-green)';
      case 'S': return 'var(--color-cyan)';
      case 'D': return 'var(--color-orange)';
      case 'Z': return 'var(--color-crimson)';
      case 'T': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const stateLabel = (state: string): string => {
    const labels: Record<string, string> = {
      R: 'RUN', S: 'SLP', D: 'DISK', Z: 'ZOMB', T: 'STOP', t: 'TRACE', X: 'DEAD',
    };
    return labels[state] || state;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: visibleRows * rowHeight,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'var(--color-text-muted)',
      }}>
        <span style={{ color: 'var(--color-gold)', animation: 'vvu-pulse 1s infinite' }}>●</span>
        &nbsp; Loading processes...
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: visibleRows * rowHeight,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'var(--color-text-muted)',
      }}>
        No process data available (/proc access restricted)
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="vvu-scroll"
      style={{
        height: visibleRows * rowHeight,
        overflowY: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xs)',
        background: 'var(--color-void)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
      }}
    >
      {/* Spacer div to create the full scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible window */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 50px 70px 80px 70px',
              padding: '0 12px',
              height: rowHeight,
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.45rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              position: 'sticky',
              top: 0,
              background: 'var(--color-void)',
              zIndex: 2,
            }}
          >
            <span>PID</span>
            <span>NAME</span>
            <span>STATE</span>
            <span>CPU%</span>
            <span>MEM (RSS)</span>
            <span>USER</span>
          </div>

          {/* Rows */}
          {visibleItems.map((proc) => (
            <div
              key={proc.pid}
              className="vvu-process-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 50px 70px 80px 1fr',
                padding: '0 12px',
                height: rowHeight,
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-card)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {proc.pid}
              </span>
              <span
                style={{
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={proc.name}
              >
                {proc.name}
              </span>
              <span style={{ color: stateColor(proc.state) }}>
                {stateLabel(proc.state)}
              </span>
              <span style={{ color: proc.cpuPercent > 50 ? 'var(--color-gold)' : undefined }}>
                {proc.cpuPercent.toFixed(1)}
              </span>
              <span>
                {(proc.memoryRssKb / 1024).toFixed(1)} MB
              </span>
              <span style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proc.user}
                </span>
                {onKill && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onKill(proc.pid);
                    }}
                    title={`Kill PID ${proc.pid}`}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-crimson-border)',
                      color: 'var(--color-crimson)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '1px 6px',
                      fontSize: '0.4rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    KILL
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
