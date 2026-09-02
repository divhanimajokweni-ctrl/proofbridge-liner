'use client';

import { Settings, X } from 'lucide-react';
import { useState } from 'react';

export interface VvuSettings {
  bootDurationMs: number;
  radarSpeedS: number;
  telemetryIntervalMs: number;
  scanlineOpacity: number; // 0–1
  autoScrollOnLeak: boolean;
}

export const DEFAULT_SETTINGS: VvuSettings = {
  bootDurationMs: 3600,
  radarSpeedS: 6,
  telemetryIntervalMs: 2200,
  scanlineOpacity: 0.012,
  autoScrollOnLeak: true,
};

interface SettingsDialogProps {
  settings: VvuSettings;
  onChange: (next: VvuSettings) => void;
}

export function SettingsDialog({ settings, onChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<VvuSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Settings (gear)"
        aria-label="Open settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'rgba(107, 138, 64, 0.1)',
          border: '1px solid rgba(107, 138, 64, 0.25)',
          color: '#9DB36B',
          cursor: 'pointer',
          transition: 'all 160ms ease',
        }}
      >
        <Settings size={14} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(6, 8, 6, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            animation: 'vvuFadeIn 200ms ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(15, 20, 16, 0.98)',
              border: '1px solid rgba(107, 138, 64, 0.3)',
              borderRadius: 12,
              padding: '1.2rem 1.4rem',
              width: 'min(440px, 100%)',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.78rem',
                  letterSpacing: '0.16em',
                  color: '#F3E38A',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Dashboard Settings
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close settings"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8B9A7B',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <SettingRow
              label="Boot screen duration"
              value={`${(settings.bootDurationMs / 1000).toFixed(1)}s`}
              hint="How long the Borromean boot screen shows on load"
            >
              <RangeInput
                min={1200}
                max={8000}
                step={400}
                value={settings.bootDurationMs}
                onChange={(v) => update({ bootDurationMs: v })}
                accent="#C46D1A"
              />
            </SettingRow>

            <SettingRow
              label="Radar sweep speed"
              value={`${settings.radarSpeedS}s/rev`}
              hint="Terrain radar sweep rotation period"
            >
              <RangeInput
                min={2}
                max={20}
                step={1}
                value={settings.radarSpeedS}
                onChange={(v) => update({ radarSpeedS: v })}
                accent="#6B8A40"
              />
            </SettingRow>

            <SettingRow
              label="Telemetry interval"
              value={`${(settings.telemetryIntervalMs / 1000).toFixed(1)}s`}
              hint="How often mock telemetry frames are generated + persisted"
            >
              <RangeInput
                min={1000}
                max={6000}
                step={200}
                value={settings.telemetryIntervalMs}
                onChange={(v) => update({ telemetryIntervalMs: v })}
                accent="#F3E38A"
              />
            </SettingRow>

            <SettingRow
              label="Scanline opacity"
              value={`${(settings.scanlineOpacity * 100).toFixed(1)}%`}
              hint="SCADA CRT overlay intensity (0 = off)"
            >
              <RangeInput
                min={0}
                max={0.05}
                step={0.002}
                value={settings.scanlineOpacity}
                onChange={(v) => update({ scanlineOpacity: v })}
                accent="#8B9A7B"
              />
            </SettingRow>

            <SettingRow label="Auto-scroll on leak" value={settings.autoScrollOnLeak ? 'ON' : 'OFF'} hint="Scroll the terrain into view when a leak starts">
              <ToggleSwitch
                checked={settings.autoScrollOnLeak}
                onChange={(v) => update({ autoScrollOnLeak: v })}
              />
            </SettingRow>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => onChange(DEFAULT_SETTINGS)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 6,
                  background: 'rgba(107, 138, 64, 0.1)',
                  border: '1px solid rgba(107, 138, 64, 0.25)',
                  color: '#9DB36B',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.62rem',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Reset defaults
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 6,
                  background: 'rgba(196, 109, 26, 0.16)',
                  border: '1px solid rgba(196, 109, 26, 0.35)',
                  color: '#E0944A',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.62rem',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes vvuFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function SettingRow({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        padding: '0.6rem 0.7rem',
        borderRadius: 8,
        background: 'rgba(107, 138, 64, 0.04)',
        border: '1px solid rgba(107, 138, 64, 0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--font-geist-sans), sans-serif',
            fontSize: '0.72rem',
            color: '#C9D4BD',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.62rem',
            color: '#F3E38A',
            fontWeight: 600,
          }}
        >
          {value}
        </span>
      </div>
      {children}
      {hint && (
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.55rem',
            color: '#5A6B4F',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

function RangeInput({
  min,
  max,
  step,
  value,
  onChange,
  accent,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        height: 4,
        appearance: 'none',
        WebkitAppearance: 'none',
        background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${pct}%, rgba(107,138,64,0.15) ${pct}%, rgba(107,138,64,0.15) 100%)`,
        borderRadius: 2,
        outline: 'none',
        cursor: 'pointer',
      }}
    />
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: 40,
        height: 20,
        borderRadius: 10,
        background: checked ? 'rgba(107, 138, 64, 0.4)' : 'rgba(107, 138, 64, 0.12)',
        border: `1px solid ${checked ? 'rgba(107, 138, 64, 0.6)' : 'rgba(107, 138, 64, 0.2)'}`,
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 200ms ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: checked ? '#9DB36B' : '#5A6B4F',
          transition: 'all 200ms ease',
          boxShadow: checked ? '0 0 6px #9DB36B' : 'none',
        }}
      />
    </button>
  );
}
