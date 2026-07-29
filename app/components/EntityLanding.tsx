'use client';

import Link from 'next/link';
import { EntityConfig } from '../lib/entities';

interface Props {
  config: EntityConfig;
}

export default function EntityLanding({ config }: Props) {
  const { name, tag, status, accentColor, icon, description, metrics, events, ctaLabel, ctaHref } = config;

  return (
    <div className="vvu-entity" style={{
      background: 'var(--color-void)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-body)',
      minHeight: '100vh',
      padding: '40px 24px',
    }}>
      <style>{`
        .vvu-entity { animation: vvu-fade-up 0.5s var(--ease-out); }
        .vvu-entity .el-container { max-width: 960px; margin: 0 auto; }
        .vvu-entity .el-hero {
          display: flex; align-items: center; gap: 24px;
          margin-bottom: 40px; padding: 24px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          position: relative; overflow: hidden;
        }
        .vvu-entity .el-hero::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${accentColor}, transparent);
        }
        .vvu-entity .el-icon { font-size: 48px; line-height: 1; position: relative; }
        .vvu-entity .el-name {
          font-family: var(--font-display); font-weight: 800; font-size: 1.75rem;
          letter-spacing: -0.02em; margin: 0 0 2px;
        }
        .vvu-entity .el-tag {
          font-family: var(--font-mono); font-size: 0.65rem;
          letter-spacing: 0.18em; text-transform: uppercase;
        }
        .vvu-entity .el-status {
          display: inline-block; font-family: var(--font-mono);
          font-size: 0.55rem; letter-spacing: 0.1em;
          padding: 4px 12px; border-radius: 20px;
          margin-left: auto; white-space: nowrap;
          animation: vvu-glow 3s infinite;
        }
        .vvu-entity .el-desc-card {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;
          transition: all var(--transition);
        }
        .vvu-entity .el-desc-card:hover {
          border-color: var(--color-border-hover);
        }
        .vvu-entity .el-desc { font-size: 0.92rem; line-height: 1.7; color: var(--color-text-secondary); margin: 0; }
        .vvu-entity .el-label {
          font-family: var(--font-mono); font-size: 0.55rem;
          color: var(--color-text-muted); letter-spacing: 0.15em;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .vvu-entity .el-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .vvu-entity .el-card {
          background: var(--color-card); border: 1px solid var(--color-border);
          border-radius: var(--radius-sm); padding: 16px;
          transition: all var(--transition);
        }
        .vvu-entity .el-card:hover {
          border-color: var(--color-border-hover);
          transform: translateY(-2px);
        }
        .vvu-entity .el-card-label {
          font-family: var(--font-mono); font-size: 0.6rem;
          color: var(--color-text-muted); margin-bottom: 4px;
        }
        .vvu-entity .el-card-value {
          font-family: var(--font-mono); font-size: 0.85rem;
          color: var(--color-text-primary); font-weight: 500;
        }
        .vvu-entity .el-events {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 20px; margin-bottom: 32px;
        }
        .vvu-entity .el-event {
          display: flex; gap: 10px; padding: 8px 0;
          border-bottom: 1px solid var(--color-border);
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--color-text-secondary); line-height: 1.5;
        }
        .vvu-entity .el-event:last-child { border-bottom: none; }
        .vvu-entity .el-event-arrow { flex-shrink: 0; }
        .vvu-entity .el-cta {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-weight: 700; font-size: 0.85rem;
          padding: 12px 28px; border-radius: 40px;
          text-decoration: none; transition: all var(--transition);
          letter-spacing: 0.03em;
        }
        .vvu-entity .el-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px ${accentColor}30;
        }
      `}</style>

      <div className="el-container">
        <div className="el-hero">
          <div className="el-icon" style={{ color: accentColor }}>{icon}</div>
          <div>
            <h1 className="el-name">{name}</h1>
            <div className="el-tag" style={{ color: accentColor }}>{tag}</div>
          </div>
          <div className="el-status" style={{
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}50`,
            color: accentColor,
          }}>
            {status}
          </div>
        </div>

        <div className="el-desc-card">
          <div className="el-label">About</div>
          <p className="el-desc">{description}</p>
        </div>

        <div className="el-label">Metrics</div>
        <div className="el-grid">
          {metrics.map((m) => (
            <div key={m.label} className="el-card">
              <div className="el-card-label">{m.label}</div>
              <div className="el-card-value">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="el-events">
          <div className="el-label" style={{ marginBottom: 12 }}>Recent Events</div>
          {events.map((ev, i) => (
            <div key={i} className="el-event">
              <span className="el-event-arrow" style={{ color: accentColor }}>→</span>
              <span>{ev}</span>
            </div>
          ))}
        </div>

        <Link
          href={ctaHref}
          className="el-cta"
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}55`,
            color: accentColor,
          }}
        >
          {ctaLabel} →
        </Link>
      </div>
    </div>
  );
}
