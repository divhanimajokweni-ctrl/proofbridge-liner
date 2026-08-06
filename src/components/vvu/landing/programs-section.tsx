'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  ShieldCheck,
  Droplets,
  Network,
  GraduationCap,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const PROGRAMS = [
  {
    icon: Coins,
    title: 'Ubuntu Pools',
    tag: 'Community Finance',
    desc: 'Stokvel-inspired community savings pools with cryptographic transparency. Every contribution is tracked, every withdrawal is verified, and every member has equal visibility into pool health.',
    features: ['Cryptographic Transaction Receipts', 'Stokvel-Inspired Design', 'Community Governance', 'Transparent Pool Health'],
    color: 'emerald',
  },
  {
    icon: ShieldCheck,
    title: 'ProofBridge',
    tag: 'Cryptographic Provenance',
    desc: 'Trust infrastructure for digital receipts, MMR proofs, and zero-knowledge verification. Building the bridge between conventional systems and cryptographic trust.',
    features: ['Digital Receipts', 'MMR Proofs', 'Zero-Knowledge Verification', 'Cross-System Trust'],
    color: 'amber',
  },
  {
    icon: Droplets,
    title: 'HBK Mk-II Research',
    tag: 'Hydro-Bayesian Kernel',
    desc: 'Industrial edge-computing appliance for municipal water Non-Revenue Water (NRW) detection. Combining Bayesian inference with deterministic engineering for real-world impact.',
    features: ['NRW Detection', 'Edge Computing', 'Bayesian Inference', 'Municipal Integration'],
    color: 'emerald',
  },
  {
    icon: Network,
    title: 'Epistemic Runtime',
    tag: 'DAG Control Plane',
    desc: 'Deterministic DAG-based control plane for policy-driven infrastructure. Every decision is traceable, every policy is enforceable, and every state change is provable.',
    features: ['DAG-Based Architecture', 'Policy DSL', 'Deterministic State', 'Cryptographic Proofs'],
    color: 'amber',
  },
  {
    icon: GraduationCap,
    title: 'Education & Outreach',
    tag: 'Community Capacity',
    desc: 'Digital literacy, training programmes, and community capacity building. Ensuring that technology serves people by making knowledge accessible to all.',
    features: ['Digital Literacy', 'Training Programmes', 'Community Workshops', 'Knowledge Sharing'],
    color: 'emerald',
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            Our Programs
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Infrastructure That{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Serves Communities
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Five programs, one mission: building trustworthy digital infrastructure for South African communities.
          </p>
        </motion.div>

        {/* Program Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <Card className={`h-full border-${program.color === 'emerald' ? 'emerald' : 'amber'}-900/20 bg-card hover:shadow-lg transition-all`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      program.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-amber-600/10 text-amber-500'
                    }`}>
                      <program.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className={`text-xs ${
                      program.color === 'emerald'
                        ? 'border-emerald-700 text-emerald-500'
                        : 'border-amber-700 text-amber-500'
                    }`}>
                      {program.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-3">{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{program.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {program.features.map((feature) => (
                      <span
                        key={feature}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          program.color === 'emerald'
                            ? 'bg-emerald-950/40 text-emerald-400'
                            : 'bg-amber-950/40 text-amber-400'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
