'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  Eye,
  Coins,
  Link,
  Code2,
  Lock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  EDITIONS,
  TRUST_TIERS,
  PRODUCT_LICENSES,
  PRODUCT_PRICING_GRID,
  formatAnnualSavings,
  type Edition,
  type ProductLicense,
} from '@/lib/vvu/pricing-structure';

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

/* ------------------------------------------------------------------ */
/*  Pricing Tiers                                                      */
/* ------------------------------------------------------------------ */

function PricingTiers() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="mt-16 grid gap-6 lg:grid-cols-3">
      {EDITIONS.map((edition, i) => (
        <motion.div
          key={edition.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          whileHover={{ y: -4 }}
          className="relative"
        >
          {edition.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-emerald-600 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg shadow-emerald-600/20">
                {edition.badge}
              </Badge>
            </div>
          )}
          <Card
            className={`h-full flex flex-col ${
              edition.highlight
                ? 'border-emerald-600/50 bg-emerald-950/10 shadow-lg shadow-emerald-600/5'
                : 'border-white/[0.06] bg-card'
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{edition.label}</CardTitle>
                {edition.id === 'community' && (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
                {edition.id === 'professional' && (
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                )}
                {edition.id === 'enterprise' && (
                  <Building2 className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{edition.tagline}</p>

              {/* Price */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">
                    {edition.priceMonthly === null && edition.id === 'enterprise'
                      ? 'Custom'
                      : edition.priceMonthly === null
                        ? 'Free'
                        : annual
                          ? `R${(edition.priceAnnual ?? 0).toLocaleString('en-ZA')}`
                          : `R${edition.priceMonthly.toLocaleString('en-ZA')}`}
                  </span>
                  {edition.priceMonthly !== null && (
                    <span className="text-sm text-muted-foreground">
                      /{annual ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
                {edition.priceMonthly !== null && edition.priceAnnual !== null && annual && (
                  <p className="text-xs text-emerald-500 mt-1">
                    {formatAnnualSavings(edition.priceMonthly, edition.priceAnnual)}
                  </p>
                )}
                {edition.priceMonthly !== null && !annual && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed monthly.{' '}
                    <button
                      onClick={() => setAnnual(true)}
                      className="text-emerald-500 hover:underline"
                    >
                      Save with annual billing →
                    </button>
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                {edition.targetAudience}
              </p>

              {/* Features */}
              <div className="flex-1 space-y-2.5">
                {edition.features.map((feature) => (
                  <div key={feature.label} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground/50'
                        }`}
                      >
                        {feature.label}
                      </span>
                      {feature.detail && feature.included && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground/40 ml-1 inline" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-[260px] text-xs bg-popover border-border"
                            >
                              {feature.detail}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <Button
                  className={`w-full ${
                    edition.highlight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : edition.id === 'enterprise'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-white/[0.06] hover:bg-white/[0.1] text-foreground'
                  }`}
                  size="lg"
                >
                  {edition.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Limits summary */}
              <div className="mt-3 flex flex-wrap gap-2">
                {edition.limits.maxUsers && (
                  <span className="text-[10px] font-mono text-muted-foreground/50 bg-white/[0.03] px-2 py-0.5 rounded">
                    Up to {edition.limits.maxUsers} user{edition.limits.maxUsers > 1 ? 's' : ''}
                  </span>
                )}
                {edition.limits.maxUsers === null && edition.id === 'enterprise' && (
                  <span className="text-[10px] font-mono text-muted-foreground/50 bg-white/[0.03] px-2 py-0.5 rounded">
                    Unlimited users
                  </span>
                )}
                <span className="text-[10px] font-mono text-muted-foreground/50 bg-white/[0.03] px-2 py-0.5 rounded">
                  {edition.limits.maxStorage} storage
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50 bg-white/[0.03] px-2 py-0.5 rounded">
                  {edition.limits.support} support
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Tiers                                                        */
/* ------------------------------------------------------------------ */

function TrustTiersSection() {
  const TIER_ICONS: Record<string, React.ReactNode> = {
    Eye: <Eye className="h-5 w-5" />,
    ShieldCheck: <ShieldCheck className="h-5 w-5" />,
    Coins: <Coins className="h-5 w-5" />,
    Link: <Link className="h-5 w-5" />,
  };

  const TIER_COLORS: Record<string, string> = {
    browse: 'text-muted-foreground border-muted-foreground/20 bg-muted-foreground/5',
    verified: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    financial: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    web3: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  };

  return (
    <div className="mt-16">
      <motion.div {...fadeInUp} className="text-center mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
          Authentication Levels
        </span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight">
          Trust Tiers — What You Can Access
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          VVU uses progressive trust tiers — the more you verify, the more you can do.
          No paywalls on trust — just verification.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_TIERS.map((tier, i) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="h-full border-white/[0.06] bg-card">
              <CardContent className="pt-6">
                <div className={`inline-flex p-2.5 rounded-lg border ${TIER_COLORS[tier.id]}`}>
                  {TIER_ICONS[tier.icon]}
                </div>
                <h4 className="mt-3 text-lg font-semibold">{tier.label}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                    Requirement
                  </span>
                  <p className="text-xs mt-0.5 text-muted-foreground">{tier.requirement}</p>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                    Unlocks
                  </span>
                  <ul className="mt-1 space-y-1">
                    {tier.unlocks.map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-xs">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Pricing Grid                                               */
/* ------------------------------------------------------------------ */

function ProductPricingGrid() {
  return (
    <div className="mt-16">
      <motion.div {...fadeInUp} className="text-center mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
          Per-Product Breakdown
        </span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight">
          What Each Product Costs by Edition
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Every product, every edition, every price. No hidden fees, no surprises.
        </p>
      </motion.div>

      <Card className="border-white/[0.06] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-center p-4 font-medium">
                  <span className="text-muted-foreground">Community</span>
                </th>
                <th className="text-center p-4 font-medium">
                  <span className="text-emerald-500">Professional</span>
                </th>
                <th className="text-center p-4 font-medium">
                  <span className="text-amber-500">Enterprise</span>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_PRICING_GRID.map((product, i) => (
                <tr
                  key={product.productId}
                  className={`border-b border-white/[0.03] ${
                    i % 2 === 0 ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  <td className="p-4 font-medium">{product.productLabel}</td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-mono ${
                      product.communityPrice === '—'
                        ? 'text-muted-foreground/30'
                        : product.communityPrice === 'Free'
                          ? 'text-emerald-500'
                          : 'text-foreground'
                    }`}>
                      {product.communityPrice}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-mono ${
                      product.professionalPrice === '—'
                        ? 'text-muted-foreground/30'
                        : product.professionalPrice === 'Included'
                          ? 'text-emerald-500'
                          : 'text-foreground'
                    }`}>
                      {product.professionalPrice}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-mono ${
                      product.enterprisePrice === '—'
                        ? 'text-muted-foreground/30'
                        : product.enterprisePrice === 'Included'
                          ? 'text-emerald-500'
                          : product.enterprisePrice === 'Custom'
                            ? 'text-amber-500'
                            : 'text-foreground'
                    }`}>
                      {product.enterprisePrice}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell">
                    {product.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Proprietary Structure                                               */
/* ------------------------------------------------------------------ */

function ProprietaryStructure() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const MODEL_COLORS: Record<string, string> = {
    'open-source': 'border-emerald-500/30 bg-emerald-950/10 text-emerald-500',
    'open-core': 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400',
    'freemium': 'border-amber-500/30 bg-amber-950/10 text-amber-400',
    'community-free': 'border-amber-500/30 bg-amber-950/10 text-amber-500',
    'proprietary': 'border-red-500/30 bg-red-950/10 text-red-400',
  };

  const MODEL_LABELS: Record<string, string> = {
    'open-source': 'Open Source',
    'open-core': 'Open Core',
    'freemium': 'Freemium',
    'community-free': 'Community Free',
    'proprietary': 'Proprietary',
  };

  return (
    <div className="mt-16">
      <motion.div {...fadeInUp} className="text-center mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
          Open vs Proprietary
        </span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight">
          Proprietary Structure — What&apos;s Open, What&apos;s Not
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          We believe in transparency. Here&apos;s exactly what&apos;s open source, what&apos;s proprietary, and where the boundary is for every product.
        </p>
      </motion.div>

      <div className="space-y-3">
        {PRODUCT_LICENSES.map((product) => (
          <Collapsible
            key={product.productId}
            open={expanded === product.productId}
            onOpenChange={(open) => setExpanded(open ? product.productId : null)}
          >
            <Card className="border-white/[0.06] bg-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full text-left">
                  <div className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.productLabel}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${MODEL_COLORS[product.licensingModel]}`}
                        >
                          {product.openSource ? (
                            <Code2 className="h-3 w-3 mr-1" />
                          ) : (
                            <Lock className="h-3 w-3 mr-1" />
                          )}
                          {MODEL_LABELS[product.licensingModel]}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground/50">
                          {product.license}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.boundary}
                      </p>
                    </div>
                    {expanded === product.productId ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-white/[0.04]">
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                          Free / Open Source
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {product.freeIncludes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                          Paid / Proprietary
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {product.paidIncludes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {product.sourceUrl && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04]">
                      <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-500 hover:underline inline-flex items-center gap-1"
                      >
                        <Code2 className="h-3 w-3" />
                        View Source on GitHub
                      </a>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Pricing Section                                               */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Honest Pricing for{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Trust Infrastructure
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Three editions. South African Rand pricing. No hidden fees. No &quot;contact us for pricing&quot; on standard tiers. What you see is what you pay.
          </p>
        </motion.div>

        {/* Pricing Tiers */}
        <PricingTiers />

        {/* Trust Tiers */}
        <TrustTiersSection />

        {/* Product Pricing Grid */}
        <ProductPricingGrid />

        {/* Proprietary Structure */}
        <ProprietaryStructure />

        {/* Bottom CTA */}
        <motion.div
          {...fadeInUp}
          className="mt-16 text-center"
        >
          <Card className="border-emerald-600/20 bg-emerald-950/10 inline-block">
            <CardContent className="py-8 px-12">
              <h3 className="text-lg font-semibold">
                Not sure which edition is right for you?
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Start with Community — it&apos;s free forever. Upgrade when you need Growth Infrastructure, unlimited receipts, or team collaboration.
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" className="border-amber-600/40 text-amber-500 hover:bg-amber-600/10">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
