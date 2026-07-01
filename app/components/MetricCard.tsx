'use client';
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  /** Unit suffix (e.g., '%', 'MB', '°C') */
  unit?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'stable';
  /** Trend value for display */
  trendValue?: string;
  /** Color override for the value */
  color?: string;
  /** Optional sparkline data (array of 0-100 numbers) */
  sparkData?: number[];
  /** Optional click handler */
  onClick?: () => void;
  /** Data source / tier label */
  source?: string;
}

/**
 * MetricCard — compact single-metric display with clamp fluid typography.
 *
 * Designed to live inside a container-query parent. The body adjusts
 * layout based on available width (via @container queries in CSS).
 */
export default function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  color,
  sparkData,
  onClick,
  source,
}: MetricCardProps) {
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor =
    trend === 'up'
      ? 'var(--color-green)'
      : trend === 'down'
        ? 'var(--color-crimson)'
        : 'var(--color-text-muted)';

  return (
    <div
      className="vvu-metric-card"
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xs)',
        padding: 'var(--space-md, 12px) var(--space-lg, 16px)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s var(--ease-out)',
        ...(onClick ? {
          ':hover': {
            borderColor: 'var(--color-gold-border)',
            boxShadow: 'var(--color-glow-gold)',
          }
        } : {}),
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-gold-border)';
          e.currentTarget.style.boxShadow = 'var(--color-glow-gold)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Label row */}
      <div
        className="vvu-metric-card__label"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
          color: 'var(--color-text-muted)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{label}</span>
        {source && (
          <span style={{ fontSize: '0.4rem', opacity: 0.6 }}>{source}</span>
        )}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          className="vvu-metric-card__value"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            fontWeight: 700,
            color: color || 'var(--color-text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="vvu-metric-card__unit"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.5rem, 0.8vw, 0.65rem)',
              color: 'var(--color-text-muted)',
            }}
          >
            {unit}
          </span>
        )}
        {trend && trendValue && (
          <span
            className="vvu-metric-card__trend"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.4rem, 0.6vw, 0.5rem)',
              color: trendColor,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {trendSymbol} {trendValue}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <svg
          className="vvu-metric-card__spark"
          viewBox="0 0 100 24"
          style={{
            width: '100%',
            height: 24,
            marginTop: 8,
            overflow: 'visible',
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color || 'var(--color-gold)'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color || 'var(--color-gold)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            fill={`url(#spark-${label.replace(/\s/g, '')})`}
            points={`0,24 ${sparkData.map((v, i) =>
              `${(i / (sparkData.length - 1)) * 100},${24 - (v / 100) * 22}`
            ).join(' ')} 100,24`}
          />
          <polyline
            fill="none"
            stroke={color || 'var(--color-gold)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sparkData.map((v, i) =>
              `${(i / (sparkData.length - 1)) * 100},${24 - (v / 100) * 22}`
            ).join(' ')}
          />
        </svg>
      )}
    </div>
  );
}
