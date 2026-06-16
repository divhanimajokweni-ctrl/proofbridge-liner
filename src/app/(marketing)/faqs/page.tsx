'use client';

const faqs = [
  {
    q: 'What is Ubuntu Pools?',
    a: 'Ubuntu Pools is a ROSCA (Rotating Savings and Credit Association) platform built for South African communities. It combines traditional stokvel savings wisdom with modern cryptographic proof — every contribution is receipted on-chain via ProofBridge.',
  },
  {
    q: 'What is ProofBridge?',
    a: 'ProofBridge is our on-chain anchoring layer. Every pool transaction (contribution, payout, governance vote) generates an ED25519-signed receipt on the Polygon Amoy testnet. Your pool&apos;s history is immutable and publicly auditable.',
  },
  {
    q: 'How does Ubuntu Score work?',
    a: 'Ubuntu Score is a community-weighted reputation metric. It combines five signals: Reciprocity (25%), Consistency (20%), Endorsements (20%), Governance Participation (20%), and Resource Sharing (15%). Higher scores unlock better pools, lower fees, and governance privileges.',
  },
  {
    q: 'Is Ubuntu Pools POPIA compliant?',
    a: 'Yes. We implement data minimisation, retention schedules, and right-to-erasure for all member PII per POPIA Act 4 of 2013. Our KYC uses W3C DIDs with minimal disclosure — your village vouches for you, not a centralised database.',
  },
  {
    q: 'What payment rails do you use?',
    a: 'We use Stitch for instant EFT payments from South African bank accounts. Stitch handles webhook reconciliation and provides the payment rail layer under the hood.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'The Village OS is designed to be mobile-first via our web interface. WhatsApp onboarding is available for pool creation and member invites. Native iOS/Android apps are on the Phase 2 roadmap.',
  },
];

export default function FAQsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)' }}>
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '16px',
        }}>FAQs</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--ink)',
          marginBottom: '48px',
        }}>Got questions?<br />We have answers.</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((f, i) => (
            <details key={i} style={{
              border: '1px solid var(--card-border)', borderRadius: '12px',
              background: 'white', padding: '0',
            }}>
              <summary style={{
                padding: '1.25rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                fontSize: '1rem', fontWeight: 600, color: 'var(--ink)',
                listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {f.q}
                <span style={{
                  fontSize: '1.25rem', color: 'var(--amber)', fontFamily: 'DM Mono, monospace',
                  transition: 'transform 0.2s',
                }}>+</span>
              </summary>
              <div style={{
                padding: '0 1.25rem 1.25rem', fontSize: '0.95rem', lineHeight: 1.7,
                color: 'rgba(13,13,13,0.65)',
              }}>
                {f.a}
              </div>
            </details>
          ))}
        </div>

        <div style={{
          marginTop: '48px', padding: '24px', borderRadius: '12px',
          background: 'var(--bone)', border: '1px solid var(--card-border)',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px', color: 'var(--ink)' }}>
            Still have questions?
          </p>
          <p style={{ fontSize: '0.9rem', color: 'rgba(13,13,13,0.55)', marginBottom: '16px' }}>
            Ask Lindiwe, our AI assistant, or reach out to the VVU team directly.
          </p>
          <a href="/dashboard" style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: '8px',
            background: 'var(--ink)', color: 'var(--amber)', textDecoration: 'none',
            fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.04em',
          }}>Open Dashboard</a>
        </div>
      </section>
    </div>
  );
}
