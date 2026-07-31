'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Binary,
  ShieldCheck,
  BarChart3,
  Unlock,
  Users,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const PRINCIPLES = [
  { icon: Binary, label: 'Deterministic', over: 'Probabilistic', color: 'emerald' },
  { icon: ShieldCheck, label: 'Cryptographic provenance', over: 'Trust', color: 'emerald' },
  { icon: BarChart3, label: 'Evidence', over: 'Opinion', color: 'amber' },
  { icon: Unlock, label: 'Open', over: 'Closed', color: 'emerald' },
  { icon: Users, label: 'Community', over: 'Individual', color: 'amber' },
  { icon: RefreshCw, label: 'Reproducible', over: 'Convenient', color: 'emerald' },
];

const GATES = [
  { id: 'G-01', label: 'Requirements & Constraints', desc: 'Define what must be true before any code is written' },
  { id: 'G-02', label: 'Architecture & Design', desc: 'Formalize the system architecture and design decisions' },
  { id: 'G-03', label: 'Implementation', desc: 'Write code that is deterministic and reproducible' },
  { id: 'G-04', label: 'Unit & Integration Testing', desc: 'Verify every component works in isolation and together' },
  { id: 'G-05', label: 'Security Review', desc: 'Cryptographic provenance and threat model verification' },
  { id: 'G-06', label: 'Performance & Load Testing', desc: 'Prove the system handles expected and peak loads' },
  { id: 'G-07', label: 'Documentation & Evidence', desc: 'Record every decision, every proof, every result' },
  { id: 'G-08', label: 'Community Review', desc: 'Open review by community members and stakeholders' },
  { id: 'G-09', label: 'Staging Deployment', desc: 'Deploy to staging with full monitoring and observability' },
  { id: 'G-10', label: 'Production Release', desc: 'Final gate. Production deployment with cryptographic attestation' },
];

const HBK_FEATURES = [
  'TEE Attestation',
  'ZK Proof Verification',
  'MCMC Derivation Logging',
  'Brier Score Thresholds',
  '72-Hour Blackout Survival',
  'HLC Deterministic Merge',
  'Circuit Breaker Pattern',
  'Trust Passport',
  'Capability-Driven UX',
  'Edge Computing',
];

export function EngineeringSection() {
  return (
    <section id="engineering" className="relative py-24 sm:py-32 bg-amber-950/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
            Engineering
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Engineering{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Principles
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Our engineering is guided by six foundational principles and enforced through ten sequential gates.
          </p>
        </motion.div>

        {/* Principles */}
        <motion.div {...fadeInUp} className="mt-16">
          <h3 className="text-center text-xl font-semibold text-foreground mb-8">
            Foundational Principles
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <motion.div
                key={principle.label}
                whileHover={{ scale: 1.03 }}
                className={`flex items-center gap-4 rounded-xl border p-5 ${
                  principle.color === 'emerald'
                    ? 'border-emerald-900/20 bg-emerald-950/10'
                    : 'border-amber-900/20 bg-amber-950/10'
                }`}
              >
                <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
                  principle.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-amber-600/10 text-amber-500'
                }`}>
                  <principle.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-semibold text-foreground">{principle.label}</span>
                  <span className="text-muted-foreground mx-2">over</span>
                  <span className="text-muted-foreground line-through">{principle.over}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Engineering Gates */}
        <motion.div {...fadeInUp} className="mt-20">
          <h3 className="text-center text-xl font-semibold text-foreground mb-8">
            10 Engineering Gates
          </h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-600 via-amber-500 to-amber-700 hidden sm:block" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {GATES.map((gate, i) => (
                <motion.div
                  key={gate.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card className="border-border/50 bg-card hover:border-emerald-900/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500 font-mono text-xs font-bold">
                          {gate.id}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{gate.label}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{gate.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* HBK Mk-II Direction */}
        <motion.div {...fadeInUp} className="mt-20">
          <Card className="border-emerald-900/30 bg-emerald-950/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">HBK Mk-II Engineering Direction</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hydro-Bayesian Kernel — Industrial edge-computing appliance design features
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {HBK_FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 rounded-lg border border-emerald-900/20 bg-emerald-950/20 p-3"
                  >
                    <Zap className="h-4 w-4 flex-none text-emerald-500" />
                    <span className="text-xs font-medium text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
