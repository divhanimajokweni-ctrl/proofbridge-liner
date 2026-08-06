'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Cog,
  FlaskConical,
  Megaphone,
  Settings,
  Scale,
  Fingerprint,
  ShieldCheck,
  Heart,
  Wrench,
  UserCheck,
  BarChart3,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const ORG_FUNCTIONS = [
  { icon: Users, label: 'Community & Partnerships', desc: 'Building bridges between organizations and communities' },
  { icon: Cog, label: 'Engineering', desc: 'Deterministic systems with cryptographic provenance' },
  { icon: FlaskConical, label: 'Research', desc: 'Evidence-based approaches to infrastructure challenges' },
  { icon: Megaphone, label: 'Marketing', desc: 'Amplifying impact through authentic storytelling' },
  { icon: Settings, label: 'Operations', desc: 'Ensuring reliable and reproducible delivery' },
  { icon: Scale, label: 'Finance & Legal', desc: 'Transparent governance and fiscal responsibility' },
];

const CORE_VALUES = [
  {
    icon: Fingerprint,
    title: 'Deterministic Systems',
    desc: 'Every outcome is reproducible. No randomness, no ambiguity — every computation yields the same result given the same inputs.',
    color: 'emerald',
  },
  {
    icon: ShieldCheck,
    title: 'Cryptographic Provenance',
    desc: 'Every action is traceable to its origin through cryptographic proofs. Trust is verified, not assumed.',
    color: 'amber',
  },
  {
    icon: Heart,
    title: 'Ubuntu Philosophy',
    desc: '"I am because we are." Our technology serves communities, not individuals. Collective well-being drives every decision.',
    color: 'emerald',
  },
  {
    icon: Wrench,
    title: 'Open Engineering',
    desc: 'All processes, decisions, and code are open to scrutiny. Transparency is not optional — it is foundational.',
    color: 'amber',
  },
  {
    icon: UserCheck,
    title: 'Community First',
    desc: 'Every product, every feature, every line of code exists to serve communities. Technology is the means, not the end.',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Evidence-Based',
    desc: 'Decisions are backed by data, not opinions. Every claim is verifiable, every metric is measurable.',
    color: 'amber',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            About VVU
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            An Organization,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Not a Personality
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Venture Vision Ubuntu is built on collective effort, not individual heroics. Our organizational
            structure ensures resilience, accountability, and impact at scale.
          </p>
        </motion.div>

        {/* Organizational Functions */}
        <motion.div {...fadeInUp} className="mt-16">
          <h3 className="text-center text-xl font-semibold text-foreground mb-8">
            Organizational Functions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORG_FUNCTIONS.map((fn) => (
              <motion.div
                key={fn.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group rounded-xl border border-emerald-900/20 bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-emerald-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500">
                    <fn.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{fn.label}</h4>
                    <p className="text-sm text-muted-foreground">{fn.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Core Values */}
        <motion.div {...fadeInUp} className="mt-20">
          <h3 className="text-center text-xl font-semibold text-foreground mb-8">
            Core Values
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_VALUES.map((val) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <Card className={`h-full border-${val.color === 'emerald' ? 'emerald' : 'amber'}-900/20 bg-card hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      val.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-amber-600/10 text-amber-500'
                    }`}>
                      <val.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg mt-3">{val.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
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
