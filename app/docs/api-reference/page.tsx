export default function ApiReferencePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 font-syne">API Reference</h1>
      
      <div className="prose prose-invert">
        <h2>POST /api/verify</h2>
        <p>Verify a proof and anchor to CircuitBreaker.sol</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`POST /api/verify
Authorization: Bearer <KERNEL_SECRET>

{
  "proofId": "string",
  "verdict": "PASS" | "HOLD" | "BLOCK",
  "confidenceScore": 0.95,
  "documentHash": "string"
}`}
        </pre>

        <h2>POST /api/webhooks/stitch</h2>
        <p>Receive Stitch payment webhooks</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`POST /api/webhooks/stitch
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
}`}
        </pre>

        <h2>POST /api/consent</h2>
        <p>Record POPIA consent</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`POST /api/consent

{
  "playerId": "uuid",
  "consentType": "marketing" | "analytics" | "retention"
}`}
        </pre>

        <h2>POST /api/agent/converse</h2>
        <p>Agent conversation loop — send a message and receive an AI response</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`POST /api/agent/converse
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
}`}
        </pre>

        <h2>GET /api/agent/converse</h2>
        <p>List conversation threads or retrieve a specific thread</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`GET /api/agent/converse?threadId=<id>
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
}`}
        </pre>

        <h2>GET /api/health</h2>
        <p>System health check</p>
        <pre className="bg-gray-800 p-4 rounded-lg text-sm">
{`GET /api/health

{
  "status": "healthy",
  "version": "2.1.0",
  "services": {
    "gateway": "online",
    "agent": "online",
    "pools": "online",
    "proofbridge": "online"
  }
}`}
        </pre>
      </div>
    </main>
  );
}
