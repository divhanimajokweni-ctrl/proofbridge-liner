/**
 * File: src/app/api/webhooks/route.ts
 * Description: Gate B Webhook Handler for Contribution Rail Infrastructure
 */
import { NextResponse } from 'next/server';
import { GateBPaymentWebhookFailProbe, GateBLedgerMismatchProbe, GateBFxOracleTimeoutProbe, GateBIdempotencyLockProbe } from '@/lib/watchdog/WatchdogProbes';

// Idempotency storage - in production, use Supabase table or Redis
// For this implementation, we'll simulate with a Map with TTL cleanup
// In production, replace with actual Supabase database calls
interface IdempotencyRecord {
  key: string;
  expiresAt: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean old idempotency keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (record.expiresAt < now) {
      idempotencyStore.delete(key);
    }
  }
}, IDEMPOTENCY_TTL_MS);

// Helper function to check and set idempotency key
function checkIdempotency(key: string): boolean {
  const now = Date.now();
  const record = idempotencyStore.get(key);

  if (!record) {
    // Key not found, add it
    idempotencyStore.set(key, { key, expiresAt: now + IDEMPOTENCY_TTL_MS });
    return false; // Not a duplicate
  }

  if (record.expiresAt < now) {
    // Key expired, remove it and treat as new
    idempotencyStore.delete(key);
    idempotencyStore.set(key, { key, expiresAt: now + IDEMPOTENCY_TTL_MS });
    return false; // Not a duplicate (was expired)
  }

  // Valid, unexpired key found
  return true; // Is a duplicate
}

export async function POST(req: Request) {
  // Gate B Webhook Security: Verify signature
  const signatureHeader = req.headers.get('x-vvu-signature');

  if (!signatureHeader) {
    new GateBPaymentWebhookFailProbe().fire('Missing webhook signature', '');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  // Parse signature header: t=<timestamp>,v1=<hex_signature>
  const signatureParts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = signatureParts['t'];
  const signature = signatureParts['v1'];

  if (!timestamp || !signature) {
    new GateBPaymentWebhookFailProbe().fire('Malformed webhook signature', '');
    return NextResponse.json(
      { error: 'Invalid signature format' },
      { status: 400 }
    );
  }

  // Get request body for signature verification
  const payloadBody = await req.text();

  // TODO: Implement actual signature verification using a secret key
  // In production, use:
  // import crypto from 'crypto';
  // const isValid = crypto.createHmac('sha256', process.env.VVU_WEBHOOK_SECRET!)
  //   .update(`${timestamp}.${payloadBody}`)
  //   .digest('hex') === signature;
  //
  // For development/testing purposes only - REMOVE IN PRODUCTION
  const isValid = process.env.NODE_ENV !== 'production' && signature === 'test_signature';

  if (!isValid) {
    new GateBPaymentWebhookFailProbe().fire('Invalid webhook signature', '');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = JSON.parse(payloadBody);

    // Basic payload validation
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-null object');
    }

    if (typeof payload.event_type !== 'string' || !payload.event_type) {
      throw new Error('Missing or invalid event_type');
    }

    if (typeof payload.idempotency_key !== 'string' || !payload.idempotency_key) {
      throw new Error('Missing or invalid idempotency_key');
    }

    if (typeof payload.timestamp !== 'string' || !payload.timestamp) {
      throw new Error('Missing or invalid timestamp');
    }

    if (typeof payload.version !== 'string' || !payload.version) {
      throw new Error('Missing or invalid version');
    }

    if (!payload.source || typeof payload.source !== 'object') {
      throw new Error('Missing or invalid source object');
    }

    if (typeof payload.source.name !== 'string' || !payload.source.name) {
      throw new Error('Missing or invalid source.name');
    }

    if (typeof payload.payload !== 'object' || payload.payload === null) {
      throw new Error('Missing or invalid payload object');
    }
  } catch (err) {
    new GateBPaymentWebhookFailProbe().fire('Invalid webhook payload', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    );
  }

  // Gate B Idempotency Check
  const idempotencyKey = payload.idempotency_key;
  if (checkIdempotency(idempotencyKey)) {
    // Duplicate webhook - acknowledge but don't process
    return NextResponse.json({ status: 'DUPLICATE_IGNORED' }, { status: 202 });
  }

  try {
    // Route to appropriate handler based on event type
    switch (payload.event_type) {
      // Payment Events
      case 'payment.intent.failed':
        await handlePaymentFailed(payload);
        break;

      case 'payment.intent.succeeded':
        await handlePaymentSucceeded(payload);
        break;

      case 'payment.method.attached':
        await handlePaymentMethodAttached(payload);
        break;

      // Ledger Events
      case 'ledger.balance.threshold_exceeded':
        await handleLedgerThresholdExceeded(payload);
        break;

      case 'ledger.reconciliation.failed':
        await handleLedgerReconciliationFailed(payload);
        break;

      // FX Events
      case 'fx.oracle.failover.triggered':
        await handleFXOracleFailover(payload);
        break;

      case 'fx.rate.deviation.alert':
        await handleFXRateDeviationAlert(payload);
        break;

      // Compliance Events
      case 'kyc.verification.completed':
        await handleKYCVerificationCompleted(payload);
        break;

      case 'aml.alert.triggered':
        await handleAMLAlertTriggered(payload);
        break;

      default:
        // Log unhandled event types for monitoring
        console.warn(`Unhandled Gate B webhook event type: ${payload.event_type}`);
        break;
    }

    return NextResponse.json({ status: 'PROCESSED' }, { status: 200 });
  } catch (error) {
    // Gate B Error Handling: Classify and notify via watchdog
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (payload.event_type.startsWith('payment.')) {
      new GateBPaymentWebhookFailProbe().fire(
        `Payment webhook processing failed: ${errorMessage}`,
        JSON.stringify({ event_type: payload.event_type, idempotencyKey })
      );
    } else if (payload.event_type.startsWith('ledger.')) {
      new GateBLedgerMismatchProbe().fire(
        `Ledger webhook processing failed: ${errorMessage}`,
        JSON.stringify({ event_type: payload.event_type, idempotencyKey })
      );
    } else if (payload.event_type.startsWith('fx.')) {
      new GateBFxOracleTimeoutProbe().fire(
        `FX oracle webhook processing failed: ${errorMessage}`,
        JSON.stringify({ event_type: payload.event_type, idempotencyKey })
      );
    } else {
      new GateBIdempotencyLockProbe().fire(
        `Webhook processing failed: ${errorMessage}`,
        JSON.stringify({ event_type: payload.event_type, idempotencyKey })
      );
    }

    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }
}

// Handler implementations
async function handlePaymentFailed(payload: any) {
  // In production, this would:
  // 1. Update contribution status to failed
  // 2. Notify user via email/notification
  // 3. Trigger retry logic if applicable
  // 4. Update analytics

  console.log(`Processing failed payment: ${payload.payload.payment_intent.id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handlePaymentSucceeded(payload: any) {
  // In production, this would:
  // 1. Update contribution status to succeeded
  // 2. Update user's contribution record
  // 3. Send confirmation email/receipt
  // 4. Update analytics and ledger

  console.log(`Processing successful payment: ${payload.payload.payment_intent.id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handlePaymentMethodAttached(payload: any) {
  // In production, this would:
  // 1. Update user's payment method on file
  // 2. Mark payment method as verified
  // 3. Enable future one-click payments

  console.log(`Payment method attached: ${payload.payload.payment_method.id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleLedgerThresholdExceeded(payload: any) {
  // In production, this would:
  // 1. Trigger alert to finance team
  // 2. Potentially freeze new contributions
  // 3. Initiate reconciliation process
  // 4. Update dashboard metrics

  console.log(`Ledger threshold exceeded: ${payload.payload.account_id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleLedgerReconciliationFailed(payload: any) {
  // In production, this would:
  // 1. Alert finance and engineering teams
  // 2. Freeze ledger modifications
  // 3. Initiate forensic audit
  // 4. Notify stakeholders of potential discrepancies

  console.log(`Ledger reconciliation failed: ${payload.payload.ledger_id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleFXOracleFailover(payload: any) {
  // In production, this would:
  // 1. Switch to fallback FX rates
  // 2. Notify trading/finance teams
  // 3. Log the event for audit
  // 4. Monitor for recovery

  console.log(`FX oracle failover triggered: ${payload.payload.trigger_reason}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleFXRateDeviationAlert(payload: any) {
  // In production, this would:
  // 1. Log significant rate deviations
  // 2. Notify trading desk if deviation exceeds threshold
  // 3. Consider switching to backup oracle
  // 4. Update internal rate tracking systems

  console.log(`FX rate deviation alert: ${payload.payload.base_currency}/${payload.payload.target_currency}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleKYCVerificationCompleted(payload: any) {
  // In production, this would:
  // 1. Update user's KYC status
  // 2. Enable/disable contribution capabilities based on verification level
  // 3. Update compliance systems
  // 4. Notify user of verification outcome

  console.log(`KYC verification completed for user: ${payload.payload.user_id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function handleAMLAlertTriggered(payload: any) {
  // In production, this would:
  // 1. Freeze associated accounts/contributions
  // 2. Notify compliance officer immediately
  // 3. Begin SAR (Suspicious Activity Report) preparation
  // 4. Lock funds pending investigation

  console.log(`AML alert triggered: ${payload.payload.alert_id}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}
