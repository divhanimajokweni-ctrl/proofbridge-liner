/**
 * @license
 * VVU EARTH TECH - Earth Tech UI
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

'use client';

import React, { useMemo } from 'react';

// ============================================================================
// §1 — Waveform Generation (Pure Math, NO charting libraries)
// ============================================================================

/**
 * Generate a Gaussian waveform (machinery noise signature).
 * The Gaussian distribution simulates continuous machinery vibration
 * characterized by bell-curve amplitude distribution.
 */
function generateGaussianWaveform(
  length: number,
  mean: number,
  stdDev: number,
  amplitude: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < length; i++) {
    const t = (i / length) * 6 - 3; // Range [-3, 3]
    const gaussian = amplitude * Math.exp(-((t - mean) ** 2) / (2 * stdDev ** 2));
    // Add oscillation for visual waveform effect
    const oscillation = gaussian * Math.sin(2 * Math.PI * t * 1.5);
    points.push({ x: i, y: oscillation });
  }
  return points;
}

/**
 * Generate a Poisson waveform (mining blast noise signature).
 * Poisson distribution simulates discrete blast events with
 * burst-like amplitude spikes characteristic of mining operations.
 */
function generatePoissonWaveform(
  length: number,
  lambda: number,
  amplitude: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < length; i++) {
    const t = (i / length) * 10;
    // Poisson PMF: P(k) = (λ^k * e^-λ) / k!
    const k = Math.floor(t);
    const poisson = amplitude * (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    // Add blast-like burst with decay envelope
    const envelope = Math.max(0, 1 - Math.abs(t - Math.floor(t) - 0.5) * 4);
    points.push({ x: i, y: poisson * envelope });
  }
  return points;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Convert waveform points to SVG path string.
 * Pure SVG path generation — no external libraries.
 */
function waveformToSVGPath(
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number,
  offsetY: number = 0,
): string {
  if (points.length === 0) return '';

  const xScale = width / points.length;
  const yMax = Math.max(...points.map((p) => Math.abs(p.y)), 1);
  const yScale = (height * 0.4) / yMax;

  let path = `M ${(points[0].x * xScale).toFixed(2)} ${(offsetY + height / 2 - points[0].y * yScale).toFixed(2)}`;

  for (let i = 1; i < points.length; i++) {
    const x = (points[i].x * xScale).toFixed(2);
    const y = (offsetY + height / 2 - points[i].y * yScale).toFixed(2);
    path += ` L ${x} ${y}`;
  }

  return path;
}

/**
 * Generate suppressed waveform (noise reduction applied).
 * Shows the waveform after noise suppression processing.
 */
function applySuppression(
  waveform: Array<{ x: number; y: number }>,
  suppressionFactor: number,
): Array<{ x: number; y: number }> {
  return waveform.map((p) => ({
    x: p.x,
    y: p.y * (1 - suppressionFactor),
  }));
}

// ============================================================================
// §2 — Noise Suppression Matrix Data
// ============================================================================

export interface NoiseProfile {
  id: string;
  name: string;
  type: 'gaussian' | 'poisson';
  description: string;
  /** Parameters for waveform generation */
  params: {
    mean?: number;
    stdDev?: number;
    lambda?: number;
    amplitude: number;
  };
  /** Suppression effectiveness per filter stage */
  suppressionStages: Array<{
    name: string;
    factor: number; // 0.0 = no suppression, 1.0 = full suppression
    status: 'optimal' | 'partial' | 'failing';
  }>;
}

export const NOISE_PROFILES: NoiseProfile[] = [
  {
    id: 'machinery-gaussian',
    name: 'Machinery Vibration',
    type: 'gaussian',
    description: 'Continuous Gaussian noise from rotating machinery — pump motors, conveyor drives',
    params: { mean: 0, stdDev: 0.8, amplitude: 1.0 },
    suppressionStages: [
      { name: 'Low-Pass Filter', factor: 0.35, status: 'optimal' },
      { name: 'Adaptive Notch', factor: 0.65, status: 'optimal' },
      { name: 'Kalman Smoothing', factor: 0.85, status: 'partial' },
    ],
  },
  {
    id: 'blast-poisson',
    name: 'Mining Blast',
    type: 'poisson',
    description: 'Discrete Poisson-distributed blast events — open-pit mining detonations',
    params: { lambda: 3, amplitude: 1.5 },
    suppressionStages: [
      { name: 'Event Detection', factor: 0.40, status: 'optimal' },
      { name: 'Burst Masking', factor: 0.70, status: 'partial' },
      { name: 'Residual Clean', factor: 0.90, status: 'failing' },
    ],
  },
  {
    id: 'hydraulic-gaussian',
    name: 'Hydraulic Press',
    type: 'gaussian',
    description: 'Broadband Gaussian noise from hydraulic press cycles — stamping operations',
    params: { mean: 0.2, stdDev: 1.2, amplitude: 0.8 },
    suppressionStages: [
      { name: 'Bandpass Isolation', factor: 0.50, status: 'optimal' },
      { name: 'Envelope Removal', factor: 0.75, status: 'optimal' },
      { name: 'Residual Denoise', factor: 0.92, status: 'optimal' },
    ],
  },
  {
    id: 'seismic-poisson',
    name: 'Seismic Burst',
    type: 'poisson',
    description: 'Poisson-clustered seismic micro-events — underground fault activity',
    params: { lambda: 5, amplitude: 2.0 },
    suppressionStages: [
      { name: 'STA/LTA Trigger', factor: 0.30, status: 'partial' },
      { name: 'Cluster Merge', factor: 0.55, status: 'partial' },
      { name: 'Confidence Filter', factor: 0.80, status: 'failing' },
    ],
  },
];

// ============================================================================
// §3 — NoiseSuppressionMatrix Component
// ============================================================================

export interface NoiseSuppressionMatrixProps {
  /** Noise profiles to display (defaults to built-in profiles) */
  profiles?: NoiseProfile[];
  /** SVG waveform width */
  waveformWidth?: number;
  /** SVG waveform height per row */
  waveformHeight?: number;
  /** Number of points in each waveform */
  waveformLength?: number;
}

export function NoiseSuppressionMatrix({
  profiles = NOISE_PROFILES,
  waveformWidth = 300,
  waveformHeight = 40,
  waveformLength = 120,
}: NoiseSuppressionMatrixProps) {
  // Pre-compute all waveforms
  const computedWaveforms = useMemo(() => {
    return profiles.map((profile) => {
      const raw =
        profile.type === 'gaussian'
          ? generateGaussianWaveform(
              waveformLength,
              profile.params.mean || 0,
              profile.params.stdDev || 0.8,
              profile.params.amplitude,
            )
          : generatePoissonWaveform(
              waveformLength,
              profile.params.lambda || 3,
              profile.params.amplitude,
            );

      const suppressed = profile.suppressionStages.map((stage) =>
        applySuppression(raw, stage.factor),
      );

      return { profile, raw, suppressed };
    });
  }, [profiles, waveformLength]);

  const stageStatusColor: Record<string, { bg: string; text: string }> = {
    optimal: { bg: '#10b981', text: '#ffffff' },
    partial: { bg: '#f59e0b', text: '#ffffff' },
    failing: { bg: '#ef4444', text: '#ffffff' },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        background: '#111827',
        borderRadius: '8px',
        color: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Noise Suppression Matrix</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            Gaussian (machinery) &amp; Poisson (blast) waveform suppression effectiveness
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
            <span style={{ color: '#d1d5db' }}>Optimal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
            <span style={{ color: '#d1d5db' }}>Partial</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} />
            <span style={{ color: '#d1d5db' }}>Failing</span>
          </div>
        </div>
      </div>

      {/* Matrix grid */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {computedWaveforms.map(({ profile, raw, suppressed }) => (
          <div
            key={profile.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '12px',
              background: '#1f2937',
              borderRadius: '6px',
              borderLeft: `3px solid ${profile.type === 'gaussian' ? '#06b6d4' : '#f97316'}`,
            }}
          >
            {/* Profile header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: profile.type === 'gaussian' ? '#06b6d4' : '#f97316',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {profile.type === 'gaussian' ? 'Gaussian' : 'Poisson'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{profile.name}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{profile.description}</span>
            </div>

            {/* Waveform rows: Raw → Stages */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {/* Raw waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '80px' }}>Raw Signal</span>
                <svg
                  width={waveformWidth}
                  height={waveformHeight}
                  viewBox={`0 0 ${waveformWidth} ${waveformHeight}`}
                  style={{ background: '#0f172a', borderRadius: '4px' }}
                >
                  {/* Center line */}
                  <line
                    x1="0"
                    y1={waveformHeight / 2}
                    x2={waveformWidth}
                    y2={waveformHeight / 2}
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  {/* Waveform path */}
                  <path
                    d={waveformToSVGPath(raw, waveformWidth, waveformHeight)}
                    fill="none"
                    stroke={profile.type === 'gaussian' ? '#06b6d4' : '#f97316'}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Suppressed stages */}
              {profile.suppressionStages.map((stage, stageIdx) => {
                const colors = stageStatusColor[stage.status];
                const stageWaveform = suppressed[stageIdx];
                return (
                  <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        minWidth: '80px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {stage.status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#d1d5db' }}>{stage.name}</span>
                    </div>
                    <svg
                      width={waveformWidth}
                      height={waveformHeight}
                      viewBox={`0 0 ${waveformWidth} ${waveformHeight}`}
                      style={{ background: '#0f172a', borderRadius: '4px' }}
                    >
                      {/* Center line */}
                      <line
                        x1="0"
                        y1={waveformHeight / 2}
                        x2={waveformWidth}
                        y2={waveformHeight / 2}
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      {/* Suppressed waveform path */}
                      <path
                        d={waveformToSVGPath(stageWaveform, waveformWidth, waveformHeight)}
                        fill="none"
                        stroke={colors.bg}
                        strokeWidth="1.5"
                      />
                    </svg>
                    {/* Effectiveness percentage */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: colors.bg,
                        fontWeight: 600,
                        minWidth: '40px',
                      }}
                    >
                      {Math.round(stage.factor * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoiseSuppressionMatrix;
