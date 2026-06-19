'use client';

import { useState } from 'react';

export default function AboutPage() {
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2'>('phase1');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)' }}>
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '16px',
        }}>About VVU</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--ink)',
          marginBottom: '24px',
        }}>Building the Village OS for South Africa.</h2>
        <p style={{
          fontSize: '16px', fontWeight: 300, lineHeight: 1.7,
          color: 'rgba(13,13,13,0.6)', marginBottom: '48px',
        }}>
          Venture Vision Ubuntu (VVU) is the foundational layer of a new financial infrastructure — one rooted in Ubuntu philosophy, powered by cryptographic proof, and built for the African context.
        </p>

        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '16px',
        }}>Phase Roadmap</div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={() => setActivePhase('phase1')}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontFamily: 'DM Mono, monospace',
              fontSize: '12px', cursor: 'pointer', border: 'none',
              background: activePhase === 'phase1' ? 'var(--ink)' : 'transparent',
              color: activePhase === 'phase1' ? 'var(--amber)' : 'var(--ink)',
            }}
          >PHASE 1 · LIVE</button>
          <button
            onClick={() => setActivePhase('phase2')}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontFamily: 'DM Mono, monospace',
              fontSize: '12px', cursor: 'pointer',
              border: activePhase === 'phase2' ? '1px solid var(--amber)' : '1px solid var(--card-border)',
              background: 'transparent',
              color: activePhase === 'phase2' ? 'var(--amber)' : 'var(--ink)',
            }}
          >PHASE 2 · Q1 2027</button>
        </div>

        {activePhase === 'phase1' && (
          <div style={{
            border: '1px solid var(--card-border)', borderRadius: '16px', padding: '32px',
            background: 'white',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700,
              marginBottom: '16px', color: 'var(--ink)',
            }}>Ubuntu Pools & ProofBridge — Now Live</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'rgba(13,13,13,0.7)', lineHeight: 1.6 }}>
              <li><strong style={{ color: 'var(--ink)' }}>Ubuntu Pools:</strong> ROSCA-powered community savings with rotating payouts, ED25519-signed receipts, and Stitch payment rails.</li>
              <li><strong style={{ color: 'var(--ink)' }}>ProofBridge:</strong> Every contribution is cryptographically receipted on-chain via Polygon Amoy. Immutable, auditable, verifiable.</li>
              <li><strong style={{ color: 'var(--ink)' }}>Ubuntu Score:</strong> Community-weighted reputation system — Reciprocal (25%), Consistency (20%), Endorsements (20%), Governance (20%), Sharing (15%).</li>
              <li><strong style={{ color: 'var(--ink)' }}>Gate-1:</strong> Flow evaluation layer that reviews all payout requests before disbursement — no blind transfers.</li>
              <li><strong style={{ color: 'var(--ink)' }}>ANT Telemetry:</strong> Real-time network health monitoring with anomaly detection across all pools.</li>
            </ul>
          </div>
        )}

        {activePhase === 'phase2' && (
          <div style={{
            border: '1px solid var(--card-border)', borderRadius: '16px', padding: '32px',
            background: 'white', opacity: 0.85,
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700,
              marginBottom: '16px', color: 'var(--ink)',
            }}>Phase 2 Roadmap — Q1 Next Year</h3>
            <p style={{
              fontSize: '0.95rem', color: 'rgba(13,13,13,0.7)', lineHeight: 1.6, marginBottom: '20px',
            }}>
              During a critical period of transition into automated scaling, we will introduce:
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'rgba(13,13,13,0.7)', lineHeight: 1.6 }}>
              <li><strong style={{ color: 'var(--amber)' }}>SAFEGRID:</strong> Automated security grid for pool evaluation and risk scoring at scale.</li>
              <li><strong style={{ color: 'var(--amber)' }}>SAFESTAKES:</strong> Dual-layer staking mechanism with enhanced collateral for high-value pools.</li>
              <li><strong style={{ color: 'var(--amber)' }}>Parallel Water Economy:</strong> Cross-pool liquidity redistribution — surplus pools fund emerging villages.</li>
              <li><strong style={{ color: 'var(--amber)' }}>Upscaling Ubuntu Pools & ProofBridge-Liner:</strong> Multi-region deployment, sharded indexing, and horizontal scaling architecture.</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
