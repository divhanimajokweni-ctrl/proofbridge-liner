'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

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

type PartnerStatus = 'PROPOSED' | 'TARGET';

interface Partner {
  name: string;
  category: string;
  desc: string;
  badge: string;
  status: PartnerStatus;
  abbreviation?: string;
}

const PARTNERS: Partner[] = [
  { name: 'Makro', category: 'Retail', desc: 'Retail Distribution', badge: 'Retail', status: 'TARGET' },
  { name: 'Massmart', category: 'Retail', desc: 'Wholesale Supply Chain', badge: 'Retail', status: 'PROPOSED' },
  { name: 'Pepkor', category: 'Retail', desc: 'Affordable Retail', badge: 'Retail', status: 'PROPOSED' },
  { name: 'Vodacom', category: 'Telecom', desc: 'Telecommunications', badge: 'Telecom', status: 'TARGET' },
  { name: 'MTN', category: 'Telecom', desc: 'Mobile Networks', badge: 'Telecom', status: 'PROPOSED' },
  { name: 'Standard Bank', category: 'Finance', desc: 'Financial Services', badge: 'Finance', status: 'TARGET' },
  { name: 'Absa', category: 'Finance', desc: 'Banking', badge: 'Finance', status: 'PROPOSED' },
  { name: 'University of Cape Town', category: 'Academic', desc: 'Top Engineering Institution (UCT)', badge: 'Academic', status: 'TARGET', abbreviation: 'UCT' },
  { name: 'AMD', category: 'Hardware', desc: 'Hardware & Compute', badge: 'Hardware', status: 'TARGET' },
  { name: 'Sarah Baartman DM', category: 'Government', desc: 'Local Government — Gqeberha', badge: 'Government', status: 'PROPOSED' },
];

const BADGE_COLORS: Record<string, string> = {
  Retail: 'border-emerald-700 text-emerald-500 bg-emerald-950/30',
  Telecom: 'border-amber-700 text-amber-500 bg-amber-950/30',
  Finance: 'border-emerald-700 text-emerald-400 bg-emerald-950/20',
  Academic: 'border-amber-600 text-amber-400 bg-amber-950/20',
  Hardware: 'border-emerald-700 text-emerald-400 bg-emerald-950/20',
  Government: 'border-amber-800 text-amber-500 bg-amber-950/30',
};

const STATUS_STYLES: Record<PartnerStatus, string> = {
  PROPOSED: 'border-amber-500/50 text-amber-400 bg-amber-950/10',
  TARGET: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/10',
};

interface PartnersSectionProps {
  onPartnerWithUs?: () => void;
}

export function PartnersSection({ onPartnerWithUs }: PartnersSectionProps) {
  return (
    <section id="partners" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            Target Ecosystem
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Organizations We Are{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Building For
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            These are target integrations we are actively pursuing. No confirmed partnerships exist yet — every relationship listed below represents a proposed pathway, not a done deal.
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

        {/* Active Network (empty) */}
        <motion.div {...fadeInUp} className="mt-16">
          <h3 className="text-center text-xl font-semibold text-foreground mb-4">
            Active Network
          </h3>
          <div className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No active integrations yet. Our target ecosystem is listed below.
            </p>
          </div>
        </motion.div>

        {/* Target Ecosystem Cards */}
        <motion.div {...fadeInUp} className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-center text-xl font-semibold text-foreground flex-1">
              10 Target Integrations
            </h3>
            {onPartnerWithUs && (
              <Button
                onClick={onPartnerWithUs}
                variant="outline"
                size="sm"
                className="border-amber-600/40 text-amber-600 hover:bg-amber-600/10 hover:text-amber-500 ml-4"
              >
                Partner With Us
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PARTNERS.map((partner, i) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4, opacity: 1 }}
                className="group opacity-70 hover:opacity-100 transition-opacity duration-300"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="h-full transition-all border-border/30 hover:border-emerald-700/30">
                      <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                        {/* Greyscale initial box */}
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 border border-border/30 text-muted-foreground/60 font-bold text-lg">
                          {partner.abbreviation || partner.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{partner.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{partner.desc}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <Badge variant="outline" className={`text-xs ${BADGE_COLORS[partner.badge] || ''}`}>
                            {partner.badge}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${STATUS_STYLES[partner.status]}`}>
                            {partner.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg"
                  >
                    <p className="text-xs">
                      We are actively developing pathways to integrate with {partner.name}. No official partnership is currently in place.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partner With Us CTA at bottom */}
        {onPartnerWithUs && (
          <motion.div {...fadeInUp} className="mt-16 text-center">
            <Button
              onClick={onPartnerWithUs}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              Partner With Us
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Explore target integrations, sponsorship tiers, and how to build together.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
