export default function ArchitectureDocsPage() {
  return (
    <main className="vvu-docs">
      <div className="vvu-docs-container">
        <h1 className="vvu-docs-h1">VVU Architecture</h1>
        
        <div className="vvu-docs-body">
          <h2 className="vvu-docs-h2">System Overview</h2>
          <p className="vvu-docs-p">
            VVU (Venture Vision Ubuntu) is a two-product ecosystem combining 
            cryptographic attestation (ProofBridge) with collective savings 
            infrastructure (Ubuntu Pools).
          </p>

          <h3 className="vvu-docs-h3">Runtime — VVU Operatus</h3>
          <ul className="vvu-docs-ul">
            <li><strong>VVU Operatus</strong> — Microkernel runtime with Round-Robin & Priority-Preemptive scheduling</li>
            <li><strong>SafeLiner</strong> — MAC enforcement operator (access control, policy evaluation)</li>
            <li><strong>SafeKrypte</strong> — Key management operator (key generation, threshold escrow)</li>
            <li><strong>Headless Server</strong> — Standalone REST API on port 4096 for non-Next.js deployments</li>
          </ul>
          <h3 className="vvu-docs-h3">Core Components</h3>
          <ul className="vvu-docs-ul">
            <li><strong>ProofBridge Liner</strong> — ED25519-signed on-chain receipts</li>
            <li><strong>Ubuntu Pools</strong> — ROSCA-powered village savings</li>
            <li><strong>CircuitBreaker.sol</strong> — 3-of-5 oracle quorum</li>
            <li><strong>ANT Telemetry</strong> — Real-time anomaly detection</li>
          </ul>

          <h3 className="vvu-docs-h3">Security Model</h3>
          <ul className="vvu-docs-ul">
            <li><strong>Layer 1 (TEE)</strong> — Software-attested (SGX pending)</li>
            <li><strong>Layer 2 (Bayesian)</strong> — Beta-Binomial fraud detection</li>
            <li><strong>Layer 3 (On-Chain)</strong> — 3-of-5 oracle quorum</li>
          </ul>

          <h3 className="vvu-docs-h3">Data Flow</h3>
          <pre className="vvu-docs-pre">{`Stitch EFT -> HMAC Verification -> Event Store -> Proof Queue -> ED25519 Sign -> CircuitBreaker.sol -> On-Chain Receipt`}</pre>
        </div>
      </div>
    </main>
  );
}
