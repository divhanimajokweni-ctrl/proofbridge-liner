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

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// §1 — Types & Constants
// ============================================================================

export interface CredibleIntervalSnapshot {
  /** Timestamp of this snapshot */
  timestamp: number;
  /** Current 95% credible interval radius in meters */
  radius: number;
  /** Confidence score at this snapshot */
  confidence: number;
  /** Number of evidence items accumulated */
  evidenceCount: number;
  /** Whether the interval has collapsed below the 500m target */
  belowTarget: boolean;
}

export interface TargetTrackerProps {
  /** Operational target boundary radius in meters (default: 500m) */
  targetRadius?: number;
  /** Maximum display radius for the SVG circle (default: 1200m) */
  maxDisplayRadius?: number;
  /** Initial credible interval radius in meters */
  initialRadius?: number;
  /** Rate of collapse per tick (meters reduced per evidence accumulation) */
  collapseRate?: number;
  /** Minimum radius (floor for credible interval) */
  minRadius?: number;
  /** SVG canvas size */
  size?: number;
  /** Auto-animate the collapsing circle */
  animate?: boolean;
  /** Animation interval in ms */
  animationInterval?: number;
}

// ============================================================================
// §2 — 500m Target Tracker Component
// ============================================================================

export function FiveHundredMeterTargetTracker({
  targetRadius = 500,
  maxDisplayRadius = 1200,
  initialRadius = 1100,
  collapseRate = 80,
  minRadius = 150,
  size = 400,
  animate = true,
  animationInterval = 1500,
}: TargetTrackerProps) {
  const [currentRadius, setCurrentRadius] = useState(initialRadius);
  const [evidenceCount, setEvidenceCount] = useState(1);
  const [history, setHistory] = useState<CredibleIntervalSnapshot[]>([
    {
      timestamp: Date.now() - animationInterval,
      radius: initialRadius,
      confidence: 0.12,
      evidenceCount: 1,
      belowTarget: initialRadius < targetRadius,
    },
  ]);
  const [isRunning, setIsRunning] = useState(animate);

  // SVG coordinate helpers
  const centerX = size / 2;
  const centerY = size / 2;
  const scaleFactor = (size / 2 - 20) / maxDisplayRadius;

  // Convert meters to SVG pixel radius
  const metersToPixels = useCallback(
    (meters: number) => meters * scaleFactor,
    [scaleFactor],
  );

  // Animate the collapsing credible interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentRadius((prev) => {
        const newRadius = Math.max(minRadius, prev - collapseRate);
        return newRadius;
      });
      setEvidenceCount((prev) => prev + 1);
    }, animationInterval);

    return () => clearInterval(interval);
  }, [isRunning, collapseRate, minRadius, animationInterval]);

  // Record history snapshots
  useEffect(() => {
    const confidence = Math.min(1.0, evidenceCount / 12);
    const snapshot: CredibleIntervalSnapshot = {
      timestamp: Date.now(),
      radius: currentRadius,
      confidence,
      evidenceCount,
      belowTarget: currentRadius < targetRadius,
    };

    setHistory((prev) => [...prev.slice(-20), snapshot]); // Keep last 20
  }, [currentRadius, evidenceCount, targetRadius]);

  // Compute current values
  const currentConfidence = Math.min(1.0, evidenceCount / 12);
  const isBelowTarget = currentRadius < targetRadius;
  const targetPixelRadius = metersToPixels(targetRadius);
  const currentPixelRadius = metersToPixels(currentRadius);

  // Generate concentric "certainty rings" from history
  const certaintyRings = history.filter((_, idx) => idx % 2 === 0).slice(-6);

  // Reset handler
  const handleReset = useCallback(() => {
    setCurrentRadius(initialRadius);
    setEvidenceCount(1);
    setHistory([
      {
        timestamp: Date.now(),
        radius: initialRadius,
        confidence: 0.12,
        evidenceCount: 1,
        belowTarget: initialRadius < targetRadius,
      },
    ]);
  }, [initialRadius, targetRadius]);

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ width: '100%', maxWidth: `${size + 200}px` }}
    >
      {/* Main SVG visualization */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ background: '#0f172a', borderRadius: '8px' }}
        >
          {/* Grid lines for scale reference */}
          {[0, 200, 400, 600, 800, 1000, 1200].map((meters) => {
            const r = metersToPixels(meters);
            return (
              <circle
                key={`grid-${meters}`}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Scale labels */}
          {[0, 500, 1000].map((meters) => {
            const r = metersToPixels(meters);
            return (
              <text
                key={`label-${meters}`}
                x={centerX + r + 4}
                y={centerY - 4}
                fill="#475569"
                fontSize="10"
                fontFamily="system-ui"
              >
                {meters}m
              </text>
            );
          })}

          {/* Historical certainty rings (ghost rings showing narrowing) */}
          {certaintyRings.map((snapshot, idx) => {
            const r = metersToPixels(snapshot.radius);
            const opacity = 0.08 + idx * 0.03;
            return (
              <circle
                key={`ghost-${idx}`}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeOpacity={opacity}
              />
            );
          })}

          {/* 500m operational target boundary — dashed circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={targetPixelRadius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="8,6"
          />

          {/* Target label */}
          <text
            x={centerX}
            y={centerY - targetPixelRadius - 8}
            fill="#f59e0b"
            fontSize="12"
            fontWeight="bold"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            500m Target
          </text>

          {/* Current 95% credible interval — collapsing circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={currentPixelRadius}
            fill={
              isBelowTarget
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.12)'
            }
            stroke={isBelowTarget ? '#10b981' : '#ef4444'}
            strokeWidth="3"
          />

          {/* Credible interval label */}
          <text
            x={centerX}
            y={centerY + 4}
            fill={isBelowTarget ? '#10b981' : '#ef4444'}
            fontSize="14"
            fontWeight="bold"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {Math.round(currentRadius)}m
          </text>

          {/* Center point marker */}
          <circle cx={centerX} cy={centerY} r="4" fill="#f9fafb" />

          {/* Confidence label */}
          <text
            x={centerX}
            y={centerY + 20}
            fill="#9ca3af"
            fontSize="11"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            95% CI · conf {currentConfidence.toFixed(2)}
          </text>
        </svg>
      </div>

      {/* Status panel */}
      <div
        className="flex flex-wrap gap-3 items-center justify-center w-full"
        style={{ padding: '12px', background: '#1f2937', borderRadius: '8px' }}
      >
        {/* Current radius */}
        <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>CI Radius</span>
          <span
            style={{
              color: isBelowTarget ? '#10b981' : '#ef4444',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            {Math.round(currentRadius)}m
          </span>
        </div>

        {/* Target */}
        <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Target</span>
          <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>
            {targetRadius}m
          </span>
        </div>

        {/* Confidence */}
        <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Confidence</span>
          <span style={{ color: '#06b6d4', fontSize: '18px', fontWeight: 'bold' }}>
            {currentConfidence.toFixed(2)}
          </span>
        </div>

        {/* Evidence count */}
        <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Evidence</span>
          <span style={{ color: '#f9fafb', fontSize: '18px', fontWeight: 'bold' }}>
            {evidenceCount}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Status</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: isBelowTarget ? '#10b981' : '#ef4444',
            }}
          >
            {isBelowTarget ? '✓ Below Target' : '→ Collapsing'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setIsRunning((r) => !r)}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              background: isRunning ? '#ef4444' : '#10b981',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              background: '#6b7280',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress history bar */}
      <div
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#111827',
          borderRadius: '6px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
          Certainty Ring Collapse History
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '16px' }}>
          {history.map((snapshot, idx) => {
            const ratio = snapshot.radius / maxDisplayRadius;
            const barWidth = `${Math.max(4, (1 - ratio) * 100)}%`;
            return (
              <div
                key={idx}
                style={{
                  width: barWidth,
                  height: '100%',
                  background: snapshot.belowTarget ? '#10b981' : '#ef4444',
                  borderRadius: '2px',
                  opacity: 0.4 + (idx / history.length) * 0.6,
                  minWidth: '4px',
                }}
                title={`t=${idx}: ${Math.round(snapshot.radius)}m (conf: ${snapshot.confidence.toFixed(2)})`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FiveHundredMeterTargetTracker;
