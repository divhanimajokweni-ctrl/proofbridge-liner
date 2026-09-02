'use client';

import { BorromeanLogoMark } from './borromean-logo';
import { useEffect, useState } from 'react';

interface BootScreenProps {
  onDismiss: () => void;
  durationMs?: number;
}

const BOOT_STEPS = [
  'Spawning physical database layer…',
  'Compiling multi-tenant RLS policies…',
  'Loading Gqeberha ENU coordinates (11 nodes)…',
  'Verifying DN300 surge torque boundary (154.7 Nm)…',
  'Initialising ED25519 deploy key handshake…',
  'Mounting WORM NVMe evidence store…',
  'Activating Bayesian Hydro-Kernel (HBK)…',
  'Engaging DFA state machine → STEADY_STATE_LOCKED…',
];

export function BootScreen({ onDismiss, durationMs = 3600 }: BootScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stepInterval = durationMs / BOOT_STEPS.length;
    const stepTimer = setInterval(() => {
      setStepIdx((i) => {
        if (i >= BOOT_STEPS.length - 1) {
          clearInterval(stepTimer);
          return i;
        }
        return i + 1;
      });
    }, stepInterval);

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setDone(true);
        setTimeout(onDismiss, 280);
      }
    }, 33);

    return () => {
      clearInterval(stepTimer);
      clearInterval(tick);
    };
  }, [durationMs, onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background:
          'radial-gradient(ellipse at center, #0F1410 0%, #060806 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.2rem',
        opacity: done ? 0 : 1,
        transition: 'opacity 280ms ease',
        padding: '2rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
        <BorromeanLogoMark size={88} />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.32em',
              color: '#6B8A40',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            Venture · Vision · Ubuntu
          </div>
          <div
            style={{
              fontFamily: 'var(--font-geist-sans), sans-serif',
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#FFFAC2',
              letterSpacing: '0.04em',
            }}
          >
            ProofBridge · VVU HBK Mk-II
          </div>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.68rem',
              color: '#8B9A7B',
              marginTop: '0.4rem',
              letterSpacing: '0.12em',
            }}
          >
            Hydro-Gateway · Release 20260901 · v1.5.2
          </div>
        </div>
      </div>

      <div style={{ width: 'min(420px, 90vw)' }}>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: 'rgba(255, 250, 194, 0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${progress}%`,
              background:
                'linear-gradient(90deg, #C46D1A, #F3E38A 60%, #6B8A40)',
              transition: 'width 60ms linear',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.7rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.68rem',
            color: '#8B9A7B',
          }}
        >
          <span style={{ color: '#F3E38A' }}>{BOOT_STEPS[stepIdx]}</span>
          <span style={{ color: '#6B8A40' }}>{progress.toFixed(0).padStart(3, ' ')}%</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '1.6rem',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.62rem',
          color: 'rgba(139, 154, 123, 0.55)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        Zero-Fictional Engineering · Sovereign · Offline-First
      </div>
    </div>
  );
}
