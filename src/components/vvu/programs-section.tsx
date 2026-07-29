'use client';

import { motion } from 'framer-motion';
import {
  Droplets,
  Fingerprint,
  Cpu,
  Brain,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Program {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  status: string;
  statusColor: string;
  gradient: string;
  accentColor: string;
}

const programs: Program[] = [
  {
    id: 'ubuntu-pools',
    icon: Droplets,
    title: 'Ubuntu Pools',
    subtitle: 'Community Finance Infrastructure',
    description:
      'Empowering stokvels, savings groups, and community pools with trusted digital infrastructure. Ubuntu Pools brings transparency, accountability, and cryptographic proof to community finance — replacing trust with verification.',
    features: [
      'Community savings pool management',
      'Cryptographic transaction verification',
      'Transparent contribution tracking',
      'Append-only audit ledger',
      'Stokvel digitization and onboarding',
      'Mobile-first accessibility',
    ],
    status: 'Active Development',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-950/30 to-card',
    accentColor: 'text-emerald-400',
  },
  {
    id: 'proofbridge',
    icon: Fingerprint,
    title: 'ProofBridge',
    subtitle: 'Cryptographic Provenance Layer',
    description:
      'An append-only provenance layer that provides cryptographic evidence for every engineering decision, workflow, and artifact. ProofBridge ensures that every output is traceable, verifiable, and reproducible — from requirements to production.',
    features: [
      'Ed25519 cryptographic signatures',
      'Append-only immutable ledger',
      'Merkle Mountain Range proofs',
      'Replay engine for verification',
      'Validator registry and quorum',
      'Assembly receipt generation',
    ],
    status: 'Core Complete',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gradient: 'from-amber-950/20 to-card',
    accentColor: 'text-amber-400',
  },
  {
    id: 'hbk-research',
    icon: Cpu,
    title: 'HBK Mk-II Research',
    subtitle: 'Hydro-Bayesian Kernel Mark II',
    description:
      'An industrial edge-computing appliance for municipal water infrastructure and Non-Revenue Water (NRW) detection. The HBK Mk-II combines AMD-based edge compute, Bayesian inference, and acoustic sensing in a deterministic, maintainable design.',
    features: [
      'AMD-based edge compute platform',
      'Bayesian inference for NRW detection',
      'Acoustic sensing integration',
      'Modular compute cartridge',
      'Serviceable battery drawer',
      'Sheet aluminium industrial enclosure',
    ],
    status: 'Engineering Baseline',
    statusColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    gradient: 'from-cyan-950/20 to-card',
    accentColor: 'text-cyan-400',
  },
  {
    id: 'epistemic-runtime',
    icon: Brain,
    title: 'Epistemic Runtime',
    subtitle: 'Invariant-Enforced DAG Control Plane',
    description:
      'A verifiable, real-time shared-reality engine featuring a Policy DSL, invariant-aware sharded CRDTs, self-repairing merges, MMR ancestry proofs, and a Shadow Bridge for cyber-physical systems. The runtime enforces invariants at the data layer.',
    features: [
      'Policy DSL (.epd) for invariant enforcement',
      'Sharded CRDTs with self-repairing merges',
      'MMR ancestry and consistency proofs',
      'Shadow Bridge for cyber-physical systems',
      'Federation and gossip protocol',
      'Policy versioning and diff engine',
    ],
    status: 'Prototype',
    statusColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gradient: 'from-purple-950/20 to-card',
    accentColor: 'text-purple-400',
  },
  {
    id: 'education',
    icon: GraduationCap,
    title: 'Education & Outreach',
    subtitle: 'Community Learning Programmes',
    description:
      'Building educational pathways that connect communities with technology. From digital literacy workshops to engineering mentorship programmes, VVU Education ensures that knowledge flows as freely as the infrastructure we build.',
    features: [
      'Digital literacy workshops',
      'Engineering mentorship programmes',
      'University research partnerships',
      'Student collaboration projects',
      'Community training materials',
      'Open-source contribution guides',
    ],
    status: 'Planning',
    statusColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    gradient: 'from-rose-950/20 to-card',
    accentColor: 'text-rose-400',
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="relative py-24 sm:py-32">
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
            Programs
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            What We Are Building
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Five interconnected programmes advancing trusted infrastructure, community finance,
            applied engineering, and knowledge sharing — all under one organizational roof.
          </p>
        </motion.div>

        {/* Programs grid */}
        <div className="space-y-6 sm:space-y-8">
          {programs.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className={`overflow-hidden border-border/50 hover:border-emerald-500/20 transition-all bg-gradient-to-r ${program.gradient}`}>
                <CardContent className="p-0">
                  <div className={`grid lg:grid-cols-5 gap-0`}>
                    {/* Left: Icon and title area */}
                    <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 flex items-center justify-center`}>
                          <program.icon className={`w-6 h-6 ${program.accentColor}`} />
                        </div>
                        <Badge variant="outline" className={`${program.statusColor} text-xs`}>
                          {program.status}
                        </Badge>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-2">{program.title}</h3>
                      <p className={`text-sm font-medium ${program.accentColor} mb-4`}>
                        {program.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {program.description}
                      </p>
                    </div>

                    {/* Right: Features */}
                    <div className="lg:col-span-3 p-6 sm:p-8">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Key Features
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {program.features.map((feature, j) => (
                          <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${program.accentColor}`} />
                            <span className="text-sm text-foreground/90">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
