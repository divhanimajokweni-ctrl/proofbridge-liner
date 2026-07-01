'use client';
import React from 'react';

interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  /** Optional status indicator color */
  statusColor?: string;
  /** Optional action button label */
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  /** Full-width mode */
  fullWidth?: boolean;
  className?: string;
}

/**
 * DashboardWidget — reusable card shell with container-query-friendly layout.
 *
 * CSS container query behavior is controlled by the parent's `container-type`.
 * Usage:
 *   <div style={{ containerType: 'inline-size' }}>
 *     <DashboardWidget title="CPU">...</DashboardWidget>
 *   </div>
 */
export default function DashboardWidget({
  title,
  subtitle,
  statusColor,
  actionLabel,
  onAction,
  children,
  fullWidth,
  className = '',
}: DashboardWidgetProps) {

  return (
    <div
      className={`vvu-widget ${fullWidth ? 'vvu-widget--full' : ''} ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: fullWidth ? 'auto' : '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: statusColor
            ? `linear-gradient(90deg, ${statusColor}, transparent)`
            : 'linear-gradient(90deg, var(--color-gold), transparent)',
        }}
      />

      {/* Header */}
      <div
        className="vvu-widget__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md, 12px) var(--space-lg, 16px)',
          borderBottom: '1px solid var(--color-border)',
          minHeight: 44,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {statusColor && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <h3
              className="vvu-widget__title"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)',
                color: '#fff',
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className="vvu-widget__subtitle"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
                  color: 'var(--color-text-muted)',
                  margin: '2px 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionLabel && (
          <button
            onClick={onAction}
            className="vvu-widget__action"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-gold)';
              e.currentTarget.style.color = 'var(--color-gold)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Body */}
      <div
        className="vvu-widget__body"
        style={{
          flex: 1,
          padding: 'var(--space-lg, 16px)',
          overflow: 'auto',
          containerType: 'inline-size',
          containerName: 'widget-body',
        }}
      >
        {children}
      </div>
    </div>
  );
}
