'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const PARTNERSHIP_QUESTIONS = [
  'What do they need?',
  'What can we offer?',
  'Is there mutual trust?',
  'Can we measure impact?',
];

const PARTNERS = [
  { name: 'Makro', category: 'Retail', desc: 'Retail Distribution', badge: 'Retail' },
  { name: 'Massmart', category: 'Retail', desc: 'Wholesale Supply Chain', badge: 'Retail' },
  { name: 'Pepkor', category: 'Retail', desc: 'Affordable Retail', badge: 'Retail' },
  { name: 'Vodacom', category: 'Telecom', desc: 'Telecommunications', badge: 'Telecom' },
  { name: 'MTN', category: 'Telecom', desc: 'Mobile Networks', badge: 'Telecom' },
  { name: 'Standard Bank', category: 'Finance', desc: 'Financial Services', badge: 'Finance' },
  { name: 'Absa', category: 'Finance', desc: 'Banking', badge: 'Finance' },
  { name: 'University of Cape Town', category: 'Academic', desc: 'Academic Research', badge: 'Academic' },
  { name: 'Nelson Mandela University', category: 'Academic', desc: 'Academic Research', badge: 'Academic' },
  { name: 'Vaal University of Technology', category: 'Academic', desc: 'Academic Research', badge: 'Academic' },
  { name: 'AMD', category: 'Hardware', desc: 'Hardware & Compute', badge: 'Academic' },
  { name: 'Sarah Baartman DM', category: 'Government', desc: 'Local Government — Gqeberha', badge: 'Government' },
];

const BADGE_COLORS: Record<string, string> = {
  Retail: 'border-emerald-700 text-emerald-500 bg-emerald-950/30',
  Telecom: 'border-amber-700 text-amber-500 bg-amber-950/30',
  Finance: 'border-emerald-700 text-emerald-400 bg-emerald-950/20',
  Academic: 'border-amber-600 text-amber-400 bg-amber-950/20',
  Government: 'border-amber-800 text-amber-500 bg-amber-950/30',
};

const CARD_ACCENTS: Record<string, string> = {
  Retail: 'border-emerald-900/20 hover:border-emerald-700/40',
  Telecom: 'border-amber-900/20 hover:border-amber-700/40',
  Finance: 'border-emerald-900/20 hover:border-emerald-700/40',
  Academic: 'border-amber-900/20 hover:border-amber-700/40',
  Government: 'border-amber-900/20 hover:border-amber-700/40',
};

export function PartnersSection() {
  return (
    <section id="partners" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            Strategic Partners
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Partnerships Built on{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Mutual Trust
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Every partnership is evaluated through a four-question framework ensuring mutual benefit and measurable impact.
          </p>
        </motion.div>

        {/* Partnership Framework */}
        <motion.div {...fadeInUp} className="mt-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PARTNERSHIP_QUESTIONS.map((q, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4"
              >
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-600/10 text-emerald-500">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{q}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partner Cards */}
        <motion.div {...fadeInUp} className="mt-16">
          <h3 className="text-center text-xl font-semibold text-foreground mb-8">
            12 Strategic Partners
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PARTNERS.map((partner, i) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className={`h-full transition-all ${CARD_ACCENTS[partner.badge] || 'border-border'}`}>
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border border-border/50 text-foreground font-bold text-lg">
                      {partner.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{partner.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{partner.desc}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${BADGE_COLORS[partner.badge] || ''}`}>
                      {partner.badge}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
