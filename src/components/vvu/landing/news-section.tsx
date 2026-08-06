'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, Rocket } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const MILESTONES = [
  {
    date: 'May 2025',
    title: 'Organization Founded',
    desc: 'Venture Vision Ubuntu established as a trust-based digital infrastructure organization in Gqeberha, Eastern Cape.',
    type: 'foundation',
  },
  {
    date: 'May 2025',
    title: 'Core Team Assembly',
    desc: 'Engineering, community, and operations teams formed with a shared commitment to deterministic principles.',
    type: 'team',
  },
  {
    date: 'June 2025',
    title: 'HBK Mk-II Prototype',
    desc: 'First working prototype of the Hydro-Bayesian Kernel for municipal water NRW detection.',
    type: 'engineering',
  },
  {
    date: 'June 2025',
    title: 'Community Launch',
    desc: 'Ambassador programmes activated, community onboarding begins across Gqeberha and the Eastern Cape.',
    type: 'community',
  },
  {
    date: 'July 2025',
    title: 'First Partnerships',
    desc: 'Strategic partnerships established with retail, telecom, and financial sector organizations.',
    type: 'partnership',
  },
  {
    date: 'July 2025',
    title: 'Pilot Programme',
    desc: 'Ubuntu Pools pilot launched with initial community groups. ProofBridge integration with first partners.',
    type: 'program',
  },
  {
    date: 'July 2025',
    title: 'Epistemic Runtime v0.8',
    desc: 'DAG-based control plane reaches feature-complete status with policy DSL and cryptographic proofs.',
    type: 'engineering',
  },
  {
    date: 'August 2025',
    title: 'Production Launch',
    desc: 'All systems operational. Trust Runtime live. Full production deployment with cryptographic attestation.',
    type: 'launch',
  },
];

const TYPE_COLORS: Record<string, { badge: string; dot: string }> = {
  foundation: { badge: 'border-emerald-700 text-emerald-500 bg-emerald-950/30', dot: 'bg-emerald-500' },
  team: { badge: 'border-emerald-700 text-emerald-400 bg-emerald-950/20', dot: 'bg-emerald-400' },
  engineering: { badge: 'border-amber-700 text-amber-500 bg-amber-950/30', dot: 'bg-amber-500' },
  community: { badge: 'border-emerald-700 text-emerald-400 bg-emerald-950/20', dot: 'bg-emerald-400' },
  partnership: { badge: 'border-amber-700 text-amber-400 bg-amber-950/20', dot: 'bg-amber-400' },
  program: { badge: 'border-emerald-700 text-emerald-500 bg-emerald-950/30', dot: 'bg-emerald-500' },
  launch: { badge: 'border-amber-600 text-amber-500 bg-amber-950/30', dot: 'bg-amber-500' },
};

export function NewsSection() {
  return (
    <section id="news" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            News & Updates
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Our{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Journey
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From foundation to production — every milestone in our path to trusted digital infrastructure.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="mt-16 relative">
          {/* Center line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-600 via-amber-500 to-amber-700 sm:-translate-x-px" />

          <div className="space-y-8 sm:space-y-12">
            {MILESTONES.map((milestone, i) => {
              const colors = TYPE_COLORS[milestone.type] || TYPE_COLORS.foundation;
              const isLast = i === MILESTONES.length - 1;

              return (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`relative flex flex-col sm:flex-row ${
                    i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 z-10">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background ${colors.dot} shadow-lg`}>
                      {isLast ? (
                        <Rocket className="h-4 w-4 text-white" />
                      ) : (
                        <Calendar className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${
                    i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12 sm:text-left'
                  }`}>
                    <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-emerald-900/30 transition-colors">
                      <div className={`flex items-center gap-2 ${i % 2 === 0 ? 'sm:justify-end' : ''}`}>
                        <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                          {milestone.date}
                        </Badge>
                      </div>
                      <h4 className="mt-2 text-lg font-semibold text-foreground">{milestone.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{milestone.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
