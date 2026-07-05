'use client';

/**
 * Billing Tier Cards — Subscription Plan Selector
 *
 * Renders product tier cards with click-to-checkout redirect
 * for Stripe (USD) and Stitch (ZAR) payment processing.
 *
 * Integrates with:
 *   - /api/billing/checkout (Stripe)
 *   - /api/billing/stitch-checkout (Stitch)
 */

import React, { useState } from 'react';

interface Tier {
  id: string;
  name: string;
  priceUSD: string;
  priceZAR: string;
  priceZARCents: number;
  stripePriceId: string;
  features: string[];
  highlighted?: boolean;
}

const TIERS: Tier[] = [
  {
    id: 'sandbox',
    name: 'Sandbox Developer',
    priceUSD: '$0 / mo',
    priceZAR: 'R0 / mo',
    priceZARCents: 0,
    stripePriceId: 'free_sandbox',
    features: ['1 Active Agent', '5,000 logs/mo', 'Standard Templates', 'Community Support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Core',
    priceUSD: '$299 / mo',
    priceZAR: 'R5,500 / mo',
    priceZARCents: 5500_00,
    stripePriceId: 'price_enterprise_core_id',
    features: ['10 Active Agents', '500,000 logs/mo', 'Custom View Mappers', 'Role-based Dashboards', 'Email & Slack Alerts'],
    highlighted: true,
  },
  {
    id: 'institutional',
    name: 'Institutional Dedicated',
    priceUSD: '$1,499 / mo',
    priceZAR: 'R27,000 / mo',
    priceZARCents: 27000_00,
    stripePriceId: 'price_institutional_dedicated_id',
    features: ['Unlimited Agents', 'Unlimited Logs', 'Dedicated Signer Nodes', 'On-chain Anchoring', '24/7 Priority Support'],
  },
];

interface BillingTierCardsProps {
  clientId?: string;
}

export default function BillingTierCards({
  clientId = 'demo-client',
}: BillingTierCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (tier: Tier) => {
    if (tier.id === 'sandbox') return; // Free — no checkout needed
    setLoadingTier(tier.id);
    setError(null);

    try {
      // Use Stitch for ZAR pricing, Stripe for USD
      const endpoint =
        tier.priceZARCents > 0
          ? '/api/billing/stitch-checkout'
          : '/api/billing/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          priceId: tier.stripePriceId,
          tierPriceZAR: tier.priceZARCents,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout initialization failed');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('[billing] Checkout error:', err);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">
          Payment Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 backdrop-blur transition-all ${
              tier.highlighted
                ? 'border-teal-500/30 bg-teal-500/5 shadow-lg shadow-teal-500/10'
                : 'border-slate-800 bg-slate-900/20'
            }`}
          >
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {tier.name}
              </h3>

              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-teal-400">
                  {tier.priceUSD}
                </div>
                <div className="text-xs text-slate-500">{tier.priceZAR}</div>
              </div>

              <ul className="space-y-1.5 pt-2">
                {tier.features.map((feat, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-400 flex items-center gap-2"
                  >
                    <span className="text-teal-500 shrink-0">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled={loadingTier !== null || tier.id === 'sandbox'}
              onClick={() => handleCheckout(tier)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
                tier.id === 'sandbox'
                  ? 'bg-slate-950 text-slate-500 border-slate-800 cursor-not-allowed'
                  : loadingTier === tier.id
                  ? 'bg-slate-900 text-slate-400 border-slate-800 animate-pulse'
                  : 'bg-teal-500 text-slate-950 border-transparent hover:bg-teal-400'
              }`}
            >
              {tier.id === 'sandbox'
                ? 'CURRENT PLAN'
                : loadingTier === tier.id
                ? 'REDIRECTING...'
                : 'UPGRADE ↗'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
