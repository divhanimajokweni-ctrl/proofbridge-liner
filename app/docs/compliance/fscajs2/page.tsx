import Link from 'next/link';

export default function FscaFramework() {
  return (
    <main style={{ padding: '3rem 2rem', background: '#1E1E1C', color: '#FFFFFF', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto', lineHeight: '1.7' }}>
        <Link href="/" style={{ color: '#CC7722', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', textDecoration: 'none' }}>← BACK TO HUB</Link>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '2rem', fontWeight: 800, margin: '1.5rem 0' }}>FSCA JS2 Compliance Framework</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '2rem' }}>Classification Strategy: Technology Infrastructure Provider (Exempt from deposit-taking structures)</p>
        
        <div style={{ background: '#0C0C0A', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem' }}>
          <div style={{ color: '#CC7722', marginBottom: '0.5rem' }}>■ ON-CHAIN AUDIT LAYER</div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>• traceparent context anchoring validation pipelines</div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>• Consensus Quorum: 3-of-5 Decentralized Oracles</div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>• Non-Repudiation Schema: ED25519 signature tracking</div>
        </div>

        <h3 style={{ marginTop: '2rem', color: '#8A9A5B' }}>Risk Controls & Circuit Breakers</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
          To preserve financial stability inside localized mutual pools, the network utilizes Bayesian anomaly classification engines. If pool transaction velocity spikes beyond defined tolerances, the smart contract validation layout transitions to an automated isolation state via `CircuitBreaker.sol`.
        </p>
      </div>
    </main>
  );
}
