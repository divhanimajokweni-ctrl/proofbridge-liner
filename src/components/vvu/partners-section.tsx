'use client';

import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Wifi,
  Landmark,
  GraduationCap,
  Building2,
  Cpu,
  ArrowRight,
  Handshake,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Partner {
  name: string;
  category: string;
  icon: React.ElementType;
  objective: string;
  collaboration: string;
  color: string;
}

const partners: Partner[] = [
  {
    name: 'Makro',
    category: 'Retail',
    icon: ShoppingBag,
    objective: 'Ubuntu Pools procurement ecosystem',
    collaboration: 'Strategic retail partnership, procurement options for pools, possible equipment assistance',
    color: 'text-red-400',
  },
  {
    name: 'Massmart',
    category: 'Retail',
    icon: ShoppingBag,
    objective: 'Retail and supply-chain ecosystem',
    collaboration: 'Procurement collaboration across its retail network',
    color: 'text-orange-400',
  },
  {
    name: 'Pepkor',
    category: 'Retail',
    icon: ShoppingBag,
    objective: 'Community accessibility',
    collaboration: 'Explore retail payment and accessibility opportunities',
    color: 'text-amber-400',
  },
  {
    name: 'Vodacom',
    category: 'Connectivity',
    icon: Wifi,
    objective: 'Connectivity & IoT',
    collaboration: 'Connectivity, IoT, edge infrastructure, ecosystem collaboration',
    color: 'text-emerald-400',
  },
  {
    name: 'MTN',
    category: 'Connectivity',
    icon: Wifi,
    objective: 'Communications & digital infrastructure',
    collaboration: 'Communications and digital infrastructure collaboration',
    color: 'text-yellow-400',
  },
  {
    name: 'Standard Bank',
    category: 'Financial',
    icon: Landmark,
    objective: 'Financial ecosystem',
    collaboration: 'Strategic engagement around Ubuntu Pools and ProofBridge-related infrastructure',
    color: 'text-blue-400',
  },
  {
    name: 'Absa',
    category: 'Financial',
    icon: Landmark,
    objective: 'Financial ecosystem',
    collaboration: 'Banking collaboration and future financial integration discussions',
    color: 'text-red-300',
  },
  {
    name: 'UCT / NMU / VUT',
    category: 'Academic',
    icon: GraduationCap,
    objective: 'Applied research',
    collaboration: 'Formal applied research partnerships and student collaboration',
    color: 'text-purple-400',
  },
  {
    name: 'AMD',
    category: 'Compute',
    icon: Cpu,
    objective: 'Hardware collaboration',
    collaboration: 'Hardware collaboration, developer support, technical engagement',
    color: 'text-cyan-400',
  },
  {
    name: 'Sarah Baartman DM',
    category: 'Municipal',
    icon: Building2,
    objective: 'Pilot deployment',
    collaboration: 'Future municipal collaboration around infrastructure and applied research',
    color: 'text-teal-400',
  },
];

const categories = [
  { label: 'Retail', count: 3, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { label: 'Connectivity', count: 2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { label: 'Financial', count: 2, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { label: 'Academic', count: 1, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { label: 'Compute', count: 1, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { label: 'Municipal', count: 1, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
];

export function PartnersSection() {
  return (
    <section id="partners" className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-emerald-950/10 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-4 block">
            Strategic Partners
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            The VVU Partner Consortium
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We are not asking organizations to fund unrelated projects. We are inviting them
            to participate in building the VVU ecosystem, with each partner contributing where
            they have the most strategic leverage.
          </p>
        </motion.div>

        {/* Partnership approach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 sm:mb-16"
        >
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-card">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Handshake className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold">Our Partnership Approach</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    q: 'Who are we?',
                    a: 'Venture Vision Ubuntu and its long-term mission — building trusted digital infrastructure for South Africa.',
                  },
                  {
                    q: 'What have we achieved?',
                    a: 'Demonstrated execution and progress across engineering, community finance, and cryptographic provenance.',
                  },
                  {
                    q: 'Why your organization?',
                    a: 'Specific strategic alignment — not a generic request, but a targeted value proposition.',
                  },
                  {
                    q: 'How can you participate?',
                    a: 'Concrete opportunities: research, technology, infrastructure, funding, distribution, or pilot deployments.',
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="font-semibold text-emerald-400">{item.q}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {categories.map((cat, i) => (
            <Badge key={i} variant="outline" className={`${cat.color} text-xs px-3 py-1`}>
              {cat.label} ({cat.count})
            </Badge>
          ))}
        </motion.div>

        {/* Partner cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full border-border/50 hover:border-emerald-500/20 transition-all group cursor-pointer">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/10 to-amber-500/10 flex items-center justify-center shrink-0`}>
                      <partner.icon className={`w-5 h-5 ${partner.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base group-hover:text-emerald-400 transition-colors truncate">
                        {partner.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px] mt-1">{partner.category}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Objective</span>
                      <p className="text-sm text-foreground/90 mt-1">{partner.objective}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collaboration</span>
                      <p className="text-sm text-muted-foreground mt-1">{partner.collaboration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            Interested in becoming a strategic partner?
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25"
            onClick={() => {
              const el = document.querySelector('#contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Start the Conversation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
