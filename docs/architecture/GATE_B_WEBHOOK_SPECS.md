# Gate B Webhook Payload Specifications

This document outlines the proposed webhook payload structures for Gate B Contribution Rail Infrastructure integration.

## Overview

Gate B handles contribution processing including payments, ledger updates, FX rates, and idempotency controls. Webhooks will be used for asynchronous event notification from external payment processors, banking systems, and market data providers.

## Common Webhook Structure

All Gate B webhooks will follow this base structure:

```typescript
interface BaseWebhookPayload {
  // Unique identifier for this webhook event
  event_id: string;
  
  // Timestamp when the event occurred (ISO 8601)
  timestamp: string;
  
  // Version of the webhook schema
  version: string;
  
  // Type of event that triggered this webhook
  event_type: WebhookEventType;
  
  // Idempotency key to prevent duplicate processing
  idempotency_key: string;
  
  // Source system that generated this webhook
  source: {
    name: string;  // e.g., "stripe", "paypal", "ach_provider"
    version?: string;
    environment: "sandbox" | "production" | "test";
  };
  
  // Optional signature for verification
  signature?: string;
  
  // Event-specific payload
  payload: Record<string, any>;
}
```

## Webhook Event Types

```typescript
type WebhookEventType =
  // Payment Events
  | 'payment.intent.created'
  | 'payment.intent.succeeded'
  | 'payment.intent.failed'
  | 'payment.intent.canceled'
  | 'payment.method.attached'
  | 'payment.method.detached'
  
  // Ledger Events
  | 'ledger.entry.created'
  | 'ledger.entry.updated'
  | 'ledger.balance.threshold_exceeded'
  | 'ledger.reconciliation.completed'
  | 'ledger.reconciliation.failed'
  
  // FX Events
  | 'fx.rate.updated'
  | 'fx.oracle.failover.triggered'
  | 'fx.rate.deviation.alert'
  
  // Compliance Events
  | 'kyc.verification.completed'
  | 'aml.alert.triggered'
  | 'sanctions.screening.result'
  
  // System Events
  | 'system.maintenance.scheduled'
  | 'system.maintenance.started'
  | 'system.maintenance.completed'
  | 'system.health.degraded'
  | 'system.health.recovered';
```

## Specific Payload Structures

### 1. Payment Webhook Payloads

#### Payment Intent Succeeded
```typescript
interface PaymentIntentSucceededPayload extends BaseWebhookPayload {
  event_type: 'payment.intent.succeeded';
  payload: {
    payment_intent: {
      id: string;
      amount: number; // in smallest currency unit
      currency: string;
      status: 'succeeded';
      customer_id: string;
      payment_method: {
        type: 'card' | 'ach' | 'wallet' | 'bank_transfer';
        brand?: string; // for cards
        last4?: string; // for cards
        funding?: string; // credit, debit, prepaid, etc.
      };
      metadata: Record<string, string>;
      // VVU-specific fields
      contribution_id?: string;
      user_id?: string;
      campaign_id?: string;
    };
  };
}
```

#### Payment Intent Failed
```typescript
interface PaymentIntentFailedPayload extends BaseWebhookPayload {
  event_type: 'payment.intent.failed';
  payload: {
    payment_intent: {
      id: string;
      amount: number;
      currency: string;
      status: 'failed';
      failure_code: string;
      failure_message: string;
      customer_id: string;
    };
    // VVU-specific fields
    contribution_id?: string;
    user_id?: string;
  };
}
```

### 2. Ledger Webhook Payloads

#### Ledger Entry Created
```typescript
interface LedgerEntryCreatedPayload extends BaseWebhookPayload {
  event_type: 'ledger.entry.created';
  payload: {
    entry_id: string;
    ledger_id: string;
    timestamp: string;
    amount: number; // in base currency units
    currency: string;
    direction: 'credit' | 'debit';
    account_id: string;
    counter_party_account?: string;
    description: string;
    reference_id: string; // external reference (e.g., payment_intent.id)
    metadata: Record<string, string>;
    // VVU-specific fields
    contribution_id?: string;
    user_id?: string;
    campaign_id?: string;
  };
}
```

#### Ledger Balance Threshold Exceeded
```typescript
interface LedgerBalanceThresholdExceededPayload extends BaseWebhookPayload {
  event_type: 'ledger.balance.threshold_exceeded';
  payload: {
    ledger_id: string;
    account_id: string;
    currency: string;
    current_balance: number;
    threshold_value: number;
    threshold_type: 'low_balance' | 'high_balance' | 'daily_limit';
    timestamp: string;
    // VVU-specific fields
    requires_action: boolean;
    suggested_action: string;
  };
}
```

### 3. FX Oracle Webhook Payloads

#### FX Rate Updated
```typescript
interface FXRateUpdatedPayload extends BaseWebhookPayload {
  event_type: 'fx.rate.updated';
  payload: {
    base_currency: string;
    target_currency: string;
    rate: number;
    timestamp: string;
    provider: string;
    // VVU-specific fields
    is_fallback_rate: boolean;
    deviation_from_market_bps: number; // basis points
  };
}
```

#### FX Oracle Failover Triggered
```typescript
interface FXOracleFailoverTriggeredPayload extends BaseWebhookPayload {
  event_type: 'fx.oracle.failover.triggered';
  payload: {
    primary_provider: string;
    failover_provider: string;
    trigger_reason: 'timeout' | 'deviation' | 'unavailable';
    affected_pairs: Array<{ base: string; target: string }>;
    timestamp: string;
    estimated_recovery_time?: string; // ISO 8601
  };
}
```

### 4. Compliance Webhook Payloads

#### KYC Verification Completed
```typescript
interface KYCVerificationCompletedPayload extends BaseWebhookPayload {
  event_type: 'kyc.verification.completed';
  payload: {
    verification_id: string;
    user_id: string;
    status: 'approved' | 'rejected' | 'requires_review';
    verification_level: 'basic' | 'standard' | 'enhanced';
    checked_at: string;
    expires_at?: string;
    failure_reason?: string;
    // VVU-specific fields
    contribution_eligibility: {
      can_contribute: boolean;
      max_contribution_amount?: number;
      currency?: string;
    };
  };
}
```

## Security Considerations

### Signature Verification
Webhooks should include an HMAC-SHA256 signature for verification:
- Header: `X-VVU-Signature: t=<timestamp>,v1=<hex_signature>`
- Signature computed over: `${timestamp}.${raw_payload_body}`
- Secret stored in Vercel/Supabase environment variables
- **Implementation Note**: The webhook handler verifies signatures using the format above

### Retry Logic
Gate B webhook consumers should implement:
- Exponential backoff (1s, 2s, 4s, 8s, 16s, then every hour for 24h)
- Maximum 10 delivery attempts
- Dead letter queue for permanently failed deliveries
- Alerting after 3 consecutive failures

### Idempotency
All webhook handlers must be idempotent using the `idempotency_key` field:
- Store processed keys with TTL (typically 24-48 hours)
- Reject duplicates with HTTP 202 (Accepted) but no processing
- Log duplicate detection for monitoring
- **Implementation Note**: Current implementation uses in-memory Set; production should use Redis or similar persistent store

## Testing Considerations

### Test Payloads
For Gate B E2E testing, provide mock webhook endpoints that can:
- Simulate success/failure scenarios
- Test idempotency handling
- Validate schema compliance
- Test signature verification

### Mock Webhook Server
```typescript
// Example test webhook handler
app.post('/webhook/test/payment', (req, res) => {
  const { event_type, idempotency_key } = req.body;
  
  // Check idempotency
  if (idempotencyStore.has(idempotency_key)) {
    return res.status(202).json({ status: 'duplicate_ignored' });
  }
  
  idempotencyStore.add(idempotency_key);
  
  // Simulate processing delay
  setTimeout(() => {
    // Process based on event_type
    res.status(200).json({ 
      status: 'processed',
      event_id: `test_${Date.now()}`
    });
  }, 100);
});
```

## Deployment Notes

### Webhook Endpoint Configuration
- Primary endpoint: `https://api.vvu.internal/webhooks/gate-b`
- Health check: `GET /webhooks/gate-b/health`
- Retry endpoint: `GET /webhooks/gate-b/retry?event_id=...`

### Monitoring & Alerting
- Track webhook delivery success rate
- Alert on >5% failure rate for 5-minute window
- Monitor processing latency (p95 < 2s)
- Track idempotency hit rate
- Monitor webhook payload size (alert if >1MB)

## Versioning Strategy

### Schema Versioning
- Webhook version in payload (`version` field)
- Backward compatible changes: increment minor version
- Breaking changes: increment major version
- Support N-2 versions concurrently
- Deprecation notice 90 days before removal

### Example Versions
- `v2.1.0` - Initial Schema v2.1 compliant release
- `v2.1.1` - Added new metadata fields (backward compatible)
- `v2.2.0` - Added FX oracle failover events (backward compatible)
- `v3.0.0` - Breaking change: removed deprecated fields

## Implementation Checklist for Gate B Activation

[ ] Webhook endpoint deployed and accessible
[ ] Signature verification middleware implemented
[ ] Idempotency storage layer (Redis recommended)
[ ] Schema validation middleware
[ ] Dead letter queue configured
[ ] Monitoring dashboards created
[ ] Alerting rules configured
[ ] Test webhook simulator built
[ ] Documentation updated
[ ] Runbook created for on-call engineers
[ ] Chaos engineering tests planned

---
*This specification is designed for zero-friction activation during Gate B pipeline deployment as mentioned in the VVU Platform documentation.*