'use client';

const poolTypes = [
  {
    emoji: '🫱🏿‍🫲🏽',
    name: 'Burial Society',
    desc: 'Community support pools with fixed monthly contributions and mutual aid disbursement. Governed by unanimous consent.',
    amount: 'R 500 / month',
    meta: 'MIN STAKE · GATE-1 EVALUATED',
    featured: false,
  },
  {
    emoji: '💰',
    name: 'Savings Stokvel',
    desc: 'Classic rotating payout model. Members contribute equally; one member receives the full pot each cycle, rotating until every member has been paid.',
    amount: 'R 500 – R 5,000 / month',
    meta: 'MOST POPULAR · PROOFBRIDGE RECEIPTED',
    featured: true,
  },
  {
    emoji: '📈',
    name: 'Investment Circle',
    desc: 'Pool members vote on collective investment decisions. Returns distributed proportionally. Requires Ubuntu Trusted score or above.',
    amount: 'R 1,000+ / month',
    meta: 'UBUNTU TRUSTED+ · FSCA ALIGNED',
    featured: false,
  },
];

const steps = [
  {
    num: '01',
    icon: '🏦',
    title: 'Connect via Stitch',
    desc: 'Link your South African bank account in under 60 seconds. Stitch handles instant EFT payments — no manual transfers, no delays.',
    tag: 'Stitch / WEBHOOKS',
    tagClass: 'tag-stitch',
  },
  {
    num: '02',
    icon: '🔐',
    title: 'Receive cryptographic proof',
    desc: 'Every contribution mints an ED25519-signed receipt via ProofBridge. Immutable proof that your money entered the pool — no intermediary required.',
    tag: 'ED25519 / ON-CHAIN',
    tagClass: 'tag-ed25519',
  },
  {
    num: '03',
    icon: '📡',
    title: 'Pool broadcasts in real-time',
    desc: 'Every pool event — contributions, votes, payouts — broadcasts live to all members via WebSocket. Nothing happens behind closed doors.',
    tag: 'WEBSOCKET / LIVE',
    tagClass: 'tag-ws',
  },
];

export default function UbuntuPoolsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)' }}>
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '16px',
        }}>Ubuntu Pools</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
          marginBottom: '20px', color: 'var(--ink)',
        }}>
          Collective savings,<br />cryptographically proven.
        </h2>
        <p style={{
          fontSize: '16px', fontWeight: 300, lineHeight: 1.7,
          color: 'rgba(13,13,13,0.6)', maxWidth: '560px', marginBottom: '60px',
        }}>
          Ubuntu Pools combines ancient African savings wisdom with modern cryptographic proof. Your stokvel, made verifiable.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '80px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              background: 'white', border: '1px solid var(--card-border)', borderRadius: '16px',
              padding: '32px', position: 'relative', transition: 'transform 0.25s, box-shadow 0.25s',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '48px', fontWeight: 800,
                color: 'rgba(13,13,13,0.06)', position: 'absolute', top: '20px', right: '24px',
              }}>{s.num}</div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px', fontSize: '22px',
              }}>{s.icon}</div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700,
                marginBottom: '10px', letterSpacing: '-0.01em',
              }}>{s.title}</div>
              <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(13,13,13,0.55)' }}>{s.desc}</p>
              <span style={{
                display: 'inline-block', marginTop: '16px',
                fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase',
                background: s.tagClass === 'tag-stitch' ? 'rgba(61,90,71,0.1)' : s.tagClass === 'tag-ed25519' ? 'rgba(232,160,32,0.1)' : 'rgba(196,66,42,0.1)',
                color: s.tagClass === 'tag-stitch' ? 'var(--sage)' : s.tagClass === 'tag-ed25519' ? 'var(--amber-muted)' : 'var(--rust)',
              }}>{s.tag}</span>
            </div>
          ))}
        </div>

        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '16px',
        }}>Pool types</div>
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
          marginBottom: '20px', color: 'var(--ink)',
        }}>Choose your collective structure.</h3>
        <p style={{
          fontSize: '16px', fontWeight: 300, lineHeight: 1.7,
          color: 'rgba(13,13,13,0.6)', maxWidth: '560px', marginBottom: '48px',
        }}>
          From traditional stokvels to investment circles, every pool structure is governed by the same cryptographic rails.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {poolTypes.map((pool, i) => (
            <div key={i} style={{
              border: '1px solid var(--card-border)', borderRadius: '16px', padding: '28px',
              background: pool.featured ? 'var(--ink)' : 'white',
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              transition: 'all 0.25s',
            }}>
              <span style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}>{pool.emoji}</span>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700,
                marginBottom: '8px', letterSpacing: '-0.01em',
                color: pool.featured ? 'white' : 'var(--ink)',
              }}>{pool.name}</div>
              <p style={{
                fontSize: '13px', lineHeight: 1.65, marginBottom: '20px',
                color: pool.featured ? 'rgba(255,255,255,0.5)' : 'rgba(13,13,13,0.55)',
              }}>{pool.desc}</p>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700,
                color: 'var(--amber)', marginBottom: '8px',
              }}>{pool.amount}</div>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '11px',
                color: pool.featured ? 'rgba(255,255,255,0.3)' : 'rgba(13,13,13,0.35)',
              }}>{pool.meta}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
