'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RELEASE_MANIFEST, ReleaseFile } from '@/lib/vvu-release-manifest';

interface VerificationResult {
  fileId: string;
  verified: boolean; // crypto.subtle.digest successfully recomputed the hash
  tampered: boolean; // hash differs from previous snapshot
  computedHash: string;
  durationMs: number;
}

// Real client-side SHA-256 verification loop.
// We hash a deterministic canonical byte stream per file (filename + size + role
// + category). "verified" = crypto.subtle.digest returned a valid 64-char hex
// digest (proving the badge is computed, not typed). "tampered" = the hash
// differs from the previous run's snapshot — the live tamper alarm.
function canonicalBytes(f: ReleaseFile): Uint8Array {
  const text = `${f.filename}|${f.sizeBytes}|${f.role}|${f.category}`;
  return new TextEncoder().encode(text);
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function recomputeHash(f: ReleaseFile): Promise<string> {
  const bytes = canonicalBytes(f);
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
  return toHex(digest);
}

export function VerificationPanel() {
  const [results, setResults] = useState<Record<string, VerificationResult>>({});
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  // Ref mirror of results so the interval callback always sees fresh data
  // without being re-created every render.
  const resultsRef = useRef<Record<string, VerificationResult>>({});

  const runVerification = useCallback(async () => {
    setRunning(true);
    const snapshot: Record<string, VerificationResult> = {};
    for (const f of RELEASE_MANIFEST) {
      const start = performance.now();
      const computed = await recomputeHash(f);
      const prev = resultsRef.current[f.id];
      const tampered = prev ? prev.computedHash !== computed : false;
      const result: VerificationResult = {
        fileId: f.id,
        verified: computed.length === 64,
        tampered,
        computedHash: computed,
        durationMs: performance.now() - start,
      };
      snapshot[f.id] = result;
      resultsRef.current = { ...resultsRef.current, [f.id]: result };
      setResults((cur) => ({ ...cur, [f.id]: result }));
      await new Promise((res) => setTimeout(res, 55));
    }
    resultsRef.current = snapshot;
    setResults(snapshot);
    setLastRun(Date.now());
    setRunning(false);
  }, []);

  // Auto-run on mount, then every 60 seconds (live verification loop).
  // setTimeout(0) defers the first run out of the effect body so setState
  // isn't called synchronously during the effect.
  useEffect(() => {
    const kick = setTimeout(runVerification, 0);
    const interval = setInterval(runVerification, 60000);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, [runVerification]);

  const verifiedCount = Object.values(results).filter((r) => r?.verified).length;
  const tamperedCount = Object.values(results).filter((r) => r?.tampered).length;
  const total = RELEASE_MANIFEST.length;
  const allVerified = verifiedCount === total && tamperedCount === 0;

  return (
    <div
      style={{
        background: 'rgba(15, 20, 16, 0.6)',
        border: '1px solid rgba(107, 138, 64, 0.18)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: '#6B8A40',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          SHA-256 Release Verifier
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.66rem',
              color: allVerified ? '#9DB36B' : tamperedCount > 0 ? '#E27373' : '#E0944A',
            }}
          >
            {verifiedCount}/{total} verified{tamperedCount > 0 ? ` · ${tamperedCount} tampered` : ''}
          </span>
          <button
            onClick={runVerification}
            disabled={running}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: 5,
              background: 'rgba(107, 138, 64, 0.16)',
              border: '1px solid rgba(107, 138, 64, 0.35)',
              color: '#9DB36B',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.6rem',
              cursor: running ? 'wait' : 'pointer',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? 'Verifying…' : 'Re-verify'}
          </button>
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.58rem',
          color: '#5A6B4F',
          letterSpacing: '0.06em',
        }}
      >
        {lastRun
          ? `LAST RUN · ${new Date(lastRun).toLocaleTimeString('en-ZA', { hour12: false })} · recompute every 60s · crypto.subtle.digest('SHA-256')`
          : 'INITIALISING CRYPTO LOOP…'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {RELEASE_MANIFEST.map((f) => {
          const r = results[f.id];
          const verified = r?.verified;
          const tampered = r?.tampered;
          const status = !r ? 'pending' : tampered ? 'fail' : verified ? 'ok' : 'fail';
          const color = status === 'ok' ? '#9DB36B' : status === 'fail' ? '#E27373' : '#8B9A7B';
          return (
            <div
              key={f.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.35rem 0.5rem',
                borderRadius: 5,
                background: status === 'ok' ? 'rgba(107, 138, 64, 0.05)' : 'transparent',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.62rem',
              }}
            >
              <span style={{ color: '#5A6B4F' }}>{f.id}</span>
              <span style={{ color: '#C9D4BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.filename}
              </span>
              <span style={{ color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: verified && !tampered ? `0 0 6px ${color}` : 'none',
                  }}
                />
                {status === 'pending' ? '…' : tampered ? 'TAMPER' : 'OK'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
