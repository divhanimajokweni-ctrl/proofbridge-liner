'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ── Data Structures ──────────────────────────────────────────────────────────

export interface ProofStep {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'pending' | 'active' | 'solved' | 'failed';
  parents: string[];
}

export interface VisualizerProps {
  /** Optional external trace. Falls back to a built-in demo graph. */
  trace?: ProofStep[];
  /** Whether the auto-play loop is running. Defaults to true. */
  playing?: boolean;
  /** Step interval in ms. Defaults to 1200. */
  intervalMs?: number;
  /** Color tint for the graph lines/nodes. */
  tint?: 'blue' | 'green' | 'purple' | 'red';
  className?: string;
}

// ── Demo Graph (used when no trace is provided) ──────────────────────────────

function defaultDemoTrace(): ProofStep[] {
  return [
    { id: '1', x: 20, y: 50, label: 'Goal', status: 'solved', parents: [] },
    { id: '2', x: 50, y: 20, label: 'Induction', status: 'solved', parents: ['1'] },
    { id: '3', x: 50, y: 80, label: 'Base Case', status: 'active', parents: ['1'] },
    { id: '4', x: 80, y: 50, label: 'Q.E.D.', status: 'pending', parents: ['2', '3'] },
  ];
}

// ── Color Maps ───────────────────────────────────────────────────────────────

const TINT_COLORS: Record<string, { active: string; solved: string; pending: string; edgeActive: string; edgePending: string }> = {
  blue:   { active: '#F59E0B', solved: '#3B82F6', pending: '#1E293B', edgeActive: '#10B981', edgePending: '#1E293B' },
  green:  { active: '#F59E0B', solved: '#10B981', pending: '#1E293B', edgeActive: '#10B981', edgePending: '#1E293B' },
  purple: { active: '#F59E0B', solved: '#A855F7', pending: '#1E293B', edgeActive: '#C084FC', edgePending: '#1E293B' },
  red:    { active: '#F59E0B', solved: '#EF4444', pending: '#1E293B', edgeActive: '#FCA5A5', edgePending: '#1E293B' },
};

// ── Component ────────────────────────────────────────────────────────────────

export function TacticVisualizerPlay({
  trace: traceProp,
  playing = true,
  intervalMs = 1200,
  tint = 'blue',
  className = '',
}: VisualizerProps) {
  const trace = traceProp ?? defaultDemoTrace();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const palette = TINT_COLORS[tint] ?? TINT_COLORS.blue;

  // Auto-play loop: advance through the proof DAG, looping back to start
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setActiveStepIndex(prev => (prev >= trace.length - 1 ? 0 : prev + 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [playing, intervalMs, trace.length]);

  const activeId = trace[activeStepIndex]?.id;

  return (
    <div
      className={`tactic-viz ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── 1. Grid Background ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.18 }}
        aria-hidden="true"
      >
        <pattern id="tactic-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#tactic-grid)" />
      </svg>

      {/* ── 2. Proof DAG ── */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {trace.map(node =>
          node.parents.map(parentId => {
            const parent = trace.find(n => n.id === parentId);
            if (!parent) return null;
            const nodeIdx = trace.indexOf(node);
            const isActive = nodeIdx <= activeStepIndex;
            return (
              <motion.line
                key={`${parentId}-${node.id}`}
                x1={`${parent.x}%`}
                y1={`${parent.y}%`}
                x2={`${node.x}%`}
                y2={`${node.y}%`}
                stroke={isActive ? palette.edgeActive : palette.edgePending}
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: isActive ? 1 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            );
          })
        )}

        {/* Nodes */}
        {trace.map((node, index) => {
          const isActive = node.id === activeId;
          const isPast = index < activeStepIndex;
          const fill =
            node.status === 'failed'
              ? '#EF4444'
              : isActive
                ? palette.active
                : isPast
                  ? palette.solved
                  : palette.pending;

          return (
            <g key={node.id}>
              {/* Pulse ring for active node */}
              {isActive && (
                <motion.circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="10"
                  stroke={palette.active}
                  strokeWidth="0.8"
                  fill="none"
                  initial={{ opacity: 0.8, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                />
              )}

              {/* Core node */}
              <motion.circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={isActive ? 5 : 3.5}
                fill={fill}
                stroke={isActive ? '#FCD34D' : 'none'}
                strokeWidth={isActive ? 1.2 : 0}
                animate={{ scale: isActive ? 1.35 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                filter={isActive ? 'url(#glow)' : undefined}
              />

              {/* Label */}
              <text
                x={`${node.x}%`}
                y={`${node.y + 7}%`}
                textAnchor="middle"
                style={{
                  fontSize: '3.2px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fill: isActive || isPast ? '#E5E7EB' : '#6A8099',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── 3. Playback HUD ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          color: '#10B981',
          background: 'rgba(0,0,0,0.55)',
          padding: '2px 6px',
          borderRadius: 3,
          pointerEvents: 'none',
        }}
      >
        TACTIC_TRACE: {trace[activeStepIndex]?.label ?? 'INIT'}
      </div>
    </div>
  );
}
