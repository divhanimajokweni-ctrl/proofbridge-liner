export default function CryptographyDocsPage() {
  return (
    <main className="vvu-docs">
      <div className="vvu-docs-container">
        <h1 className="vvu-docs-h1">Cryptography</h1>
        
        <div className="vvu-docs-body">
          <h2 className="vvu-docs-h2">ED25519 Signatures</h2>
          <p className="vvu-docs-p">
            All ProofBridge receipts are signed using ED25519, a high-speed 
            elliptic curve signature scheme. Each receipt contains:
          </p>
          <ul className="vvu-docs-ul">
            <li><strong>Proof Hash</strong> — keccak256(proofId + documentHash + verdict)</li>
            <li><strong>Signature</strong> — ED25519 signed proof hash</li>
            <li><strong>Public Key</strong> — Verifiable by anyone</li>
          </ul>

          <h2 className="vvu-docs-h2">HMAC Verification</h2>
          <p className="vvu-docs-p">
            Stitch webhooks are verified using HMAC-SHA256 with timing-safe 
            comparison to prevent timing attacks.
          </p>

          <h2 className="vvu-docs-h2">CircuitBreaker.sol</h2>
          <ul className="vvu-docs-ul">
            <li><strong>Replay Protection</strong> — <code className="vvu-docs-code">usedProofs</code> mapping prevents duplicates</li>
            <li><strong>Quorum</strong> — 3-of-5 oracle threshold</li>
            <li><strong>Audit Trail</strong> — Immutable event logs</li>
          </ul>

          <h2 className="vvu-docs-h2">Attestation</h2>
          <p className="vvu-docs-p">
            Current mode: <code className="vvu-docs-code">software-attested</code>. Hardware TEE (SGX) 
            integration is pending provisioning.
          </p>
        </div>
      </div>
    </main>
  );
}
