/**
 * Stripe Checkout Session Initialization
 *
 * Creates an encrypted Stripe Checkout Session for subscription billing.
 * On completion, the user is redirected to the Stripe payment page.
 * Stripe sends a webhook to /api/webhooks/stripe on success.
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { clientId, priceId } = await request.json();

    if (!clientId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientId, priceId' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      metadata: { clientId },
      success_url: `${appUrl}/dashboard?billing_sync=success`,
      cancel_url: `${appUrl}/dashboard?billing_sync=cancelled`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error('[stripe-checkout] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
