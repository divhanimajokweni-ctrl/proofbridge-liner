'use client';

import { useState, useEffect } from 'react';

export default function MarketingHome() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)', color: 'var(--ink)' }}>
      {/* ANT Ticker */}
      <div style={{
        background: 'var(--ink)', color: 'var(--bone)',
        fontFamily: 'DM Mono, monospace', fontSize: '11px',
        letterSpacing: '0.05em', padding: '6px 0', position: 'relative', zIndex: 100,
        overflow: 'hidden', borderBottom: '2px solid var(--amber)',
      }}>
        <div style={{
          display: 'flex', gap: '48px', whiteSpace: 'nowrap',
          animation: 'tickerScroll 30s linear infinite',
        }}>
          {[
            ['NETWORK VELOCITY', '842'], ['ACTIVE POOLS', '8'], ['VAULTED', 'R 127,500'],
            ['VERIFIED TXS', '342'], ['CYCLE 2 PAYOUT', 'R 15,000'], ['STITCH RAIL', 'ONLINE'],
            ['PROOFBRIDGE', 'v2.1.0'], ['AVG UBUNTU SCORE', '764'], ['POPIA', 'COMPLIANT'],
            ['AMOY TESTNET', 'LIVE'],
            ['NETWORK VELOCITY', '842'], ['ACTIVE POOLS', '8'], ['VAULTED', 'R 127,500'],
            ['VERIFIED TXS', '342'], ['CYCLE 2 PAYOUT', 'R 15,000'], ['STITCH RAIL', 'ONLINE'],
            ['PROOFBRIDGE', 'v2.1.0'], ['AVG UBUNTU SCORE', '764'], ['POPIA', 'COMPLIANT'],
            ['AMOY TESTNET', 'LIVE'],
          ].map(([label, val], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--dust)', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em' }}>{label}</span>
              <span style={{ color: val === 'ONLINE' || val === 'LIVE' || val === 'COMPLIANT' ? '#4CAF50' : 'var(--amber)', fontWeight: 500 }}>{val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em',
              color: 'var(--sage)', background: 'rgba(61,90,71,0.08)',
              padding: '6px 12px', borderRadius: '20px', marginBottom: '28px', textTransform: 'uppercase',
            }}>
              <span style={{
                width: '6px', height: '6px', background: 'var(--sage)',
                borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block',
              }} />
              Collective savings · Amoy testnet live
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(42px, 5vw, 72px)',
              fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.03em',
              marginBottom: '24px', color: 'var(--ink)',
            }}>
              Saving together,<br />
              <span style={{ color: 'var(--amber)' }}>proven</span> on-chain.<br />
              <span style={{ color: 'var(--sage)' }}>Ubuntu</span> made financial.
            </h1>
            <p style={{
              fontSize: '16px', fontWeight: 300, lineHeight: 1.7,
              color: 'rgba(13,13,13,0.65)', maxWidth: '480px', marginBottom: '40px',
            }}>
              Ubuntu Pools is a ROSCA-powered community savings platform. Every contribution is cryptographically receipted via ProofBridge, every payout is verified by your pool — no trust required.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '48px' }}>
              <a href="#how-it-works" style={{
                background: 'var(--amber)', color: 'var(--ink)',
                fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700,
                padding: '16px 32px', borderRadius: '8px', textDecoration: 'none',
                letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                Start your pool →
              </a>
              <a href="#how-it-works" style={{
                background: 'transparent', color: 'var(--ink)',
                fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600,
                padding: '16px 28px', borderRadius: '8px', textDecoration: 'none',
                border: '1.5px solid var(--card-border)',
              }}>
                See how it works
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex' }}>
                {['T', 'L', 'M', '+'].map((c, i) => (
                  <div key={i} style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '2px solid var(--warm-white)',
                    marginLeft: i === 0 ? '0' : '-8px',
                    fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 1 ? 'var(--sage)' : i === 2 ? 'var(--amber)' : 'var(--ink)',
                    color: i === 1 ? 'white' : i === 2 ? 'var(--ink)' : 'var(--amber)',
                  }}>{c}</div>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(13,13,13,0.55)' }}>
                <strong style={{ color: 'var(--ink)' }}>342 members</strong> saving collectively across 8 active pools
              </p>
            </div>
          </div>

          <div style={{ paddingLeft: '60px', animation: loaded ? 'fadeSlideUp 0.8s ease 0.2s both' : 'none' }}>
            <div style={{
              background: 'var(--ink)', borderRadius: '16px', padding: '28px', color: 'white',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(232,160,32,0.15) 0%, transparent 70%)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Pilot Cohort — Cycle 2</div>
                <div style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.1em',
                  color: 'var(--amber)', background: 'rgba(232,160,32,0.12)',
                  padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase',
                }}>● Active</div>
              </div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '42px', fontWeight: 800,
                color: 'white', letterSpacing: '-0.03em', marginBottom: '4px',
              }}>R 15,750</div>
              <div style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px',
                fontFamily: 'DM Mono, monospace',
              }}>COLLECTIVE_SAVINGS // FACILITATOR_APPROVED</div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: '68%',
                  background: 'linear-gradient(90deg, var(--amber) 0%, var(--amber-light) 100%)',
                  borderRadius: '4px', animation: 'progressFill 1.5s ease 0.5s both',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>T</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Sawubona, Thabo</div>
                    <div style={{ color: 'var(--amber)', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>R 500 / cycle</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232,160,32,0.2)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>L</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Lerato K.</div>
                    <div style={{ color: 'var(--amber)', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>R 500 / cycle</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white', borderRadius: '12px', padding: '16px 20px',
              border: '1px solid var(--card-border)', marginTop: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(13,13,13,0.45)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.03em', marginBottom: '4px' }}>UPCOMING PAYOUT</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>R 15,000</div>
              </div>
              <span style={{
                fontSize: '11px', fontFamily: 'DM Mono, monospace', padding: '4px 10px',
                borderRadius: '20px', background: 'rgba(61,90,71,0.1)', color: 'var(--sage)',
              }}>Facilitator approved</span>
            </div>

            <div style={{
              background: 'white', borderRadius: '12px', padding: '16px 20px',
              border: '1px solid var(--card-border)', marginTop: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(13,13,13,0.45)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.03em', marginBottom: '4px' }}>NETWORK VELOCITY</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>842</div>
              </div>
              <span style={{
                fontSize: '11px', fontFamily: 'DM Mono, monospace', padding: '4px 10px',
                borderRadius: '20px', background: 'rgba(232,160,32,0.1)', color: 'var(--amber-muted)',
              }}>Ubuntu Prime</span>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes progressFill { from { width: 0; } to { width: 68%; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
