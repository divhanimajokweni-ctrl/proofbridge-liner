export default function ArchitectureDocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 font-syne">VVU Architecture</h1>
      
      <div className="prose prose-invert">
        <h2>System Overview</h2>
        <p>
          VVU (Venture Vision Ubuntu) is a two-product ecosystem combining 
          cryptographic attestation (ProofBridge) with collective savings 
          infrastructure (Ubuntu Pools).
        </p>

        <h3>Core Components</h3>
        <ul>
          <li><strong>ProofBridge Liner</strong> — ED25519-signed on-chain receipts</li>
          <li><strong>Ubuntu Pools</strong> — ROSCA-powered village savings</li>
          <li><strong>CircuitBreaker.sol</strong> — 3-of-5 oracle quorum</li>
          <li><strong>ANT Telemetry</strong> — Real-time anomaly detection</li>
        </ul>

        <h3>Security Model</h3>
        <ul>
          <li><strong>Layer 1 (TEE)</strong> — Software-attested (SGX pending)</li>
          <li><strong>Layer 2 (Bayesian)</strong> — Beta-Binomial fraud detection</li>
          <li><strong>Layer 3 (On-Chain)</strong> — 3-of-5 oracle quorum</li>
        </ul>

        <h3>Data Flow</h3>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`Stitch EFT -> HMAC Verification -> Event Store -> Proof Queue -> ED25519 Sign -> CircuitBreaker.sol -> On-Chain Receipt`}
        </pre>
      </div>
    </main>
  );
}
