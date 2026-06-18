export default function CryptographyDocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 font-syne">Cryptography</h1>
      
      <div className="prose prose-invert">
        <h2>ED25519 Signatures</h2>
        <p>
          All ProofBridge receipts are signed using ED25519, a high-speed 
          elliptic curve signature scheme. Each receipt contains:
        </p>
        <ul>
          <li><strong>Proof Hash</strong> — keccak256(proofId + documentHash + verdict)</li>
          <li><strong>Signature</strong> — ED25519 signed proof hash</li>
          <li><strong>Public Key</strong> — Verifiable by anyone</li>
        </ul>

        <h2>HMAC Verification</h2>
        <p>
          Stitch webhooks are verified using HMAC-SHA256 with timing-safe 
          comparison to prevent timing attacks.
        </p>

        <h2>CircuitBreaker.sol</h2>
        <ul>
          <li><strong>Replay Protection</strong> — <code>usedProofs</code> mapping prevents duplicates</li>
          <li><strong>Quorum</strong> — 3-of-5 oracle threshold</li>
          <li><strong>Audit Trail</strong> — Immutable event logs</li>
        </ul>

        <h2>Attestation</h2>
        <p>
          Current mode: <code>software-attested</code>. Hardware TEE (SGX) 
          integration is pending provisioning.
        </p>
      </div>
    </main>
  );
}
