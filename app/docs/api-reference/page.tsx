export default function ApiReferencePage() {
  return (
    <main className="vvu-docs">
      <div className="vvu-docs-container">
        <h1 className="vvu-docs-h1">API Reference</h1>
        
        <div className="vvu-docs-body">
          <h2 className="vvu-docs-h2">POST /api/verify</h2>
          <p className="vvu-docs-p">Verify a proof and anchor to CircuitBreaker.sol</p>
          <pre className="vvu-docs-pre">{`POST /api/verify
Authorization: Bearer <KERNEL_SECRET>

{
  "proofId": "string",
  "verdict": "PASS" | "HOLD" | "BLOCK",
  "confidenceScore": 0.95,
  "documentHash": "string"
}`}</pre>

          <h2 className="vvu-docs-h2">POST /api/webhooks/stitch</h2>
          <p className="vvu-docs-p">Receive Stitch payment webhooks</p>
          <pre className="vvu-docs-pre">{`POST /api/webhooks/stitch
x-stitch-signature: sha256=<64-char-hex>

{
  "type": "payment.completed",
  "id": "stitch_123",
  "data": {
    "payment": {
      "id": "pay_123",
      "amount": { "quantity": 500, "currency": "ZAR" },
      "metadata": { "poolId": "pool_001" }
    }
  }
}`}</pre>

          <h2 className="vvu-docs-h2">POST /api/consent</h2>
          <p className="vvu-docs-p">Record POPIA consent</p>
          <pre className="vvu-docs-pre">{`POST /api/consent

{
  "playerId": "uuid",
  "consentType": "marketing" | "analytics" | "retention"
}`}</pre>

          <h2 className="vvu-docs-h2">POST /api/agent/converse</h2>
          <p className="vvu-docs-p">Agent conversation loop — send a message and receive an AI response</p>
          <pre className="vvu-docs-pre">{`POST /api/agent/converse
Authorization: Bearer <KERNEL_SECRET>
x-internal-request: true  (skip auth for gateway internal use)

{
  "message": "What is the status of Gate D?",
  "threadId": "optional-thread-id-for-continuing",
  "to": "optional@email.com (sends response via email)"
}

{
  "ok": true,
  "threadId": "thread_1712345678901",
  "content": "Gate D (GovernanceAnchor.sol) is deployed on Polygon Amoy...",
  "model": "mistral-small-latest",
  "usage": { ... }
}`}</pre>

          <h2 className="vvu-docs-h2">GET /api/agent/converse</h2>
          <p className="vvu-docs-p">List conversation threads or retrieve a specific thread</p>
          <pre className="vvu-docs-pre">{`GET /api/agent/converse?threadId=<id>
Authorization: Bearer <KERNEL_SECRET>

{
  "ok": true,
  "conversation": {
    "threadId": "thread_...",
    "to": "user@email.com",
    "messages": [
      { "role": "user", "content": "...", "timestamp": 123 },
      { "role": "assistant", "content": "...", "timestamp": 124 }
    ],
    "createdAt": 123,
    "updatedAt": 124
  }
}`}</pre>

          <h2 className="vvu-docs-h2">GET /api/health</h2>
          <p className="vvu-docs-p">System health check</p>
          <pre className="vvu-docs-pre">{`GET /api/health

{
  "status": "healthy",
  "version": "2.1.0",
  "services": {
    "gateway": "online",
    "agent": "online",
    "pools": "online",
    "proofbridge": "online"
  }
}`}</pre>
        </div>
      </div>
    </main>
  );
}
