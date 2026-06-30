import Link from 'next/link';

export default function FscaFramework() {
  return (
    <main className="vvu-docs">
      <div className="vvu-docs-container">
        <p className="vvu-docs-back-link">
          <Link href="/" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.05em' }}>← BACK TO HUB</Link>
        </p>
        <h1 className="vvu-docs-h1">FSCA JS2 Compliance Framework</h1>
        <p className="vvu-docs-p" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '2rem' }}>
          Classification Strategy: Technology Infrastructure Provider (Exempt from deposit-taking structures)
        </p>
        
        <div className="vvu-docs-pre" style={{ 
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{ color: 'var(--color-gold)', marginBottom: '0.5rem' }}>■ ON-CHAIN AUDIT LAYER</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>• traceparent context anchoring validation pipelines</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>• Consensus Quorum: 3-of-5 Decentralized Oracles</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>• Non-Repudiation Schema: ED25519 signature tracking</div>
        </div>

        <h3 className="vvu-docs-h3">Risk Controls & Circuit Breakers</h3>
        <p className="vvu-docs-p">
          To preserve financial stability inside localized mutual pools, the network utilizes Bayesian anomaly classification engines. If pool transaction velocity spikes beyond defined tolerances, the smart contract validation layout transitions to an automated isolation state via <code className="vvu-docs-code">CircuitBreaker.sol</code>.
        </p>
      </div>
    </main>
  );
}
