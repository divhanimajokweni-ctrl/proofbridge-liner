/**
 * Stripe Billing Webhook Integration
 *
 * Receives asynchronous payment success signals from Stripe and
 * automatically upgrades client billing records in Upstash Redis.
 *
 * Cryptographic verification via stripe.webhooks.constructEvent —
 * no HMAC keys required, avoiding HF-4 collision risk.
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import Stripe from 'stripe';

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2023-10-16' as any,
  });
}

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Upstash Redis credentials not configured');
  }
  return new Redis({ url, token });
}

// Tier lookup by Stripe price ID
const TIER_QUOTA_MAP: Record<string, { name: string; limit: number }> = {
  price_enterprise_core_id: { name: 'Enterprise Core', limit: 500000 },
  price_institutional_dedicated_id: {
    name: 'Institutional Dedicated',
    limit: 99999999,
  },
};

export async function POST(request: Request) {
  const payloadText = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(payloadText, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[stripe-webhook] Signature validation failed: ${err.message}`);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const clientId = session.metadata?.clientId || 'default-client';

    // Get price ID from line items
    let priceId = '';
    if (session.line_items?.data?.[0]?.price?.id) {
      priceId = session.line_items.data[0].price.id;
    } else if (session.metadata?.priceId) {
      priceId = session.metadata.priceId;
    }

    const tierConfig = TIER_QUOTA_MAP[priceId] || {
      name: 'Enterprise Core',
      limit: 500000,
    };

    try {
      // Use domain-separated Redis key (billing:) per HF-4
      const redis = getRedisClient();
      await redis.hset(`billing:client:${clientId}`, {
        tier: tierConfig.name,
        monthlyLimit: tierConfig.limit.toString(),
        updatedAt: Date.now().toString(),
        status: 'ACTIVE',
        paymentProcessor: 'stripe',
        stripeSessionId: session.id,
      });

      console.log(
        `[stripe-webhook] Client ${clientId} upgraded to ${tierConfig.name}`
      );

      // Post Slack notification if configured
      try {
        const { dispatchSlackNotification } = await import('../../../../lib/slack-notifier');
        await dispatchSlackNotification({
          eventType: 'BILLING_UPGRADE',
          clientId,
          tierName: tierConfig.name,
          monthlyLimit: tierConfig.limit,
        });
      } catch {
        // Slack notifier is optional
      }
    } catch (dbError: any) {
      console.error('[stripe-webhook] Redis write failed:', dbError.message);
      return NextResponse.json(
        { error: 'Internal database update failure' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
