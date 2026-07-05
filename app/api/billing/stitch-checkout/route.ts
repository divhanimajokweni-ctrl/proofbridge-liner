/**
 * Stitch Checkout Session Initialization (South Africa)
 *
 * Creates a Stitch clientPaymentInitiationRequest via GraphQL,
 * returning a secure hosted payment URL for open-banking / instant EFT.
 *
 * @see https://stitch.money/docs/payments
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { clientId, tierPriceZAR } = await request.json();

    if (!clientId || !tierPriceZAR) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientId, tierPriceZAR' },
        { status: 400 }
      );
    }

    const client_id = process.env.STITCH_CLIENT_ID;
    const client_secret = process.env.STITCH_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'Stitch client credentials not configured' },
        { status: 500 }
      );
    }

    // 1. Fetch OAuth client access token
    const tokenResponse = await fetch('https://stitch.money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
        scope: 'client:payment-initiation',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error(`Stitch OAuth failed: ${tokenResponse.status} ${errBody}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Build Stitch GraphQL payment initiation mutation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const graphQLMutation = {
      query: `
        mutation CreatePayment($amount: MoneyInput!, $payerRef: String!, $beneficiaryRef: String!) {
          clientPaymentInitiationRequestCreate(input: {
            amount: $amount
            payerReference: $payerRef
            beneficiaryReference: $beneficiaryRef
            redirectUrl: "${appUrl}/dashboard?stitch_sync=success"
          }) {
            paymentInitiationRequest {
              id
              url
            }
          }
        }
      `,
      variables: {
        amount: { currency: 'ZAR', value: tierPriceZAR.toString() },
        payerRef: `PB-${clientId.substring(0, 10)}`,
        beneficiaryRef: 'PROOFBRIDGE_REVENUE',
      },
    };

    // 3. Post to Stitch GraphQL API
    const stitchResponse = await fetch('https://api.stitch.money/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphQLMutation),
    });

    if (!stitchResponse.ok) {
      const errBody = await stitchResponse.text();
      throw new Error(`Stitch GraphQL failed: ${stitchResponse.status} ${errBody}`);
    }

    const stitchData = await stitchResponse.json();

    if (stitchData.errors) {
      throw new Error(
        `Stitch GraphQL errors: ${JSON.stringify(stitchData.errors)}`
      );
    }

    const checkoutUrl =
      stitchData.data?.clientPaymentInitiationRequestCreate?.paymentInitiationRequest?.url;

    if (!checkoutUrl) {
      throw new Error('Stitch did not return a payment URL');
    }

    return NextResponse.json({ success: true, url: checkoutUrl });
  } catch (err: any) {
    console.error('[stitch-checkout] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
