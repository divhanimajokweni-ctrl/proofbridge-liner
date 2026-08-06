'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Target, MapPin, Calendar } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const CURRENT_PRIORITIES = [
  'Complete HBK Mk-II prototype for municipal water NRW detection',
  'Establish first strategic partnerships in retail and telecom sectors',
  'Launch community ambassador programme in Gqeberha',
  'Finalize Epistemic Runtime v0.8 for production deployment',
  'Build Ubuntu Pools pilot with 3 community groups',
];

const ROADMAP = [
  {
    phase: 'Now',
    title: 'Foundation',
    desc: 'Core team assembly, organizational structure, engineering principles, and initial partnerships.',
    color: 'emerald',
    status: 'active',
  },
  {
    phase: 'June',
    title: 'Community Launch',
    desc: 'Ambassador programme activation, community onboarding, and outreach to target municipalities.',
    color: 'emerald',
    status: 'upcoming',
  },
  {
    phase: 'July',
    title: 'Pilot Programs',
    desc: 'Ubuntu Pools pilot, HBK Mk-II field deployment, ProofBridge integration with first partners.',
    color: 'amber',
    status: 'upcoming',
  },
  {
    phase: 'August 1',
    title: 'Production',
    desc: 'Full production launch. All systems operational. Trust Runtime live. Epistemic Runtime v1.0.',
    color: 'amber',
    status: 'upcoming',
  },
];

export function MissionSection() {
  return (
    <section id="mission" className="relative py-24 sm:py-32 bg-emerald-950/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
            Our Mission
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Building the{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Infrastructure of Trust
            </span>
          </h2>
        </motion.div>

        {/* Vision & Priorities */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-emerald-900/30 bg-emerald-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500">
                    <Eye className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground leading-relaxed italic">
                  &ldquo;A South Africa where every community has access to trustworthy digital
                  infrastructure — water systems that don&apos;t leak, financial tools that don&apos;t
                  exploit, and knowledge systems that don&apos;t exclude.&rdquo;
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Priorities */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-amber-900/30 bg-amber-950/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Current Priorities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {CURRENT_PRIORITIES.map((priority, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-600/10 text-amber-500 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{priority}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Roadmap */}
        <motion.div {...fadeInUp} className="mt-20">
          <h3 className="text-center text-xl font-semibold text-foreground mb-10">
            Roadmap to Launch
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-600 to-amber-600 sm:left-1/2 sm:-translate-x-px" />

            <div className="space-y-8 sm:space-y-12">
              {ROADMAP.map((phase, i) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex flex-col sm:flex-row ${
                    i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 z-10">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      phase.status === 'active'
                        ? 'border-emerald-500 bg-emerald-600/20 text-emerald-400'
                        : 'border-amber-700 bg-amber-900/20 text-amber-500'
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${
                    i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12 sm:text-left'
                  }`}>
                    <Card className={`border-${phase.color === 'emerald' ? 'emerald' : 'amber'}-900/20`}>
                      <CardContent className="p-5">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          phase.color === 'emerald' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {phase.phase}
                        </span>
                        <h4 className="mt-1 text-lg font-semibold text-foreground">{phase.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{phase.desc}</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
