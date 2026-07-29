'use client';

import { motion } from 'framer-motion';
import {
  GitBranch,
  Shield,
  FileCheck,
  Fingerprint,
  Lock,
  ArrowRight,
  CheckCircle2,
  Layers,
  Cpu,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const gates = [
  { name: 'Requirements', desc: 'Define what the system must accomplish', icon: FileCheck },
  { name: 'Architecture', desc: 'Establish the structural foundation', icon: Layers },
  { name: 'Electrical', desc: 'Design the power and signal infrastructure', icon: Cpu },
  { name: 'Mechanical', desc: 'Define the physical form and assembly', icon: Wrench },
  { name: 'Thermal', desc: 'Validate thermal management and cooling', icon: Shield },
  { name: 'Manufacturing', desc: 'Specify production processes and tolerances', icon: Wrench },
  { name: 'Assembly', desc: 'Define the assembly sequence and quality gates', icon: Lock },
  { name: 'Verification', desc: 'Confirm every requirement is met with evidence', icon: CheckCircle2 },
  { name: 'Pilot Build', desc: 'Build and validate the first production-representative units', icon: Cpu },
  { name: 'Production', desc: 'Release to production with full traceability', icon: Fingerprint },
];

const principles = [
  {
    title: 'Deterministic Systems',
    description: 'Every decision backed by evidence. Every workflow replayable. Every record immutable. No speculative or undocumented decisions.',
    icon: Shield,
  },
  {
    title: 'Append-Only Replayable Architectures',
    description: 'Canonical serialization, immutable fact logs, and replay engines that reconstruct any prior state from the ground up.',
    icon: GitBranch,
  },
  {
    title: 'Cryptographic Provenance',
    description: 'Ed25519 signatures, MMR proofs, and validator quorums ensure that every artifact is traceable, verifiable, and reproducible.',
    icon: Fingerprint,
  },
  {
    title: 'Compiler-Style Engineering',
    description: 'The Engineering Compiler System (ECS) processes source files through deterministic stages, producing signed outputs at each gate.',
    icon: Cpu,
  },
  {
    title: 'Separation of Probabilistic and Deterministic',
    description: 'Bayesian inference is separated from deterministic decision operators. The probabilistic layer informs; the deterministic layer decides.',
    icon: Layers,
  },
  {
    title: 'Capability-Based Access Control',
    description: 'Trust-based onboarding with cryptographic capability tokens. No role-based assumptions — every access is evidence-backed.',
    icon: Lock,
  },
];

export function EngineeringSection() {
  return (
    <section id="engineering" className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-emerald-950/10 to-background">
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
            Engineering Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            How We Engineer
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            VVU operates with compiler-style engineering: formal gates, cryptographic provenance,
            and deterministic workflows. Every output is verified, reproducible, and traceable
            from requirements to production.
          </p>
        </motion.div>

        {/* Engineering principles */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {principles.map((principle, i) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all group">
                <CardContent className="p-6">
                  <principle.icon className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-lg mb-2">{principle.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Engineering Gate Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 sm:mb-20"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Sequential Engineering Gates
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            Every VVU project passes through formal engineering gates. No gate is skipped.
            Each gate produces a signed, traceable artifact before advancing.
          </p>

          {/* Gate flow visualization */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              {gates.map((gate, i) => (
                <motion.div
                  key={gate.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all group">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                      <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                    </div>
                    <gate.icon className="w-5 h-5 text-emerald-400/60 mb-2" />
                    <h4 className="font-medium text-sm">{gate.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{gate.desc}</p>
                  </div>
                  {/* Arrow between gates (hidden on mobile) */}
                  {i < gates.length - 1 && i % 5 !== 4 && (
                    <div className="hidden sm:block absolute top-1/2 -right-3 text-emerald-400/30">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* HBK Mk-II Engineering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-card">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">HBK Mk-II Engineering Direction</h3>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20 mt-1">
                    Engineering Baseline
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The Hydro-Bayesian Kernel Mark II is an industrial edge-computing appliance for
                municipal water infrastructure. Its design philosophy prioritizes maintainability
                over minimum size, with deterministic cable routing, torque-angle fastening, and
                stainless steel thread inserts in aluminium.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Modular compute cartridge',
                  'Serviceable battery drawer',
                  'Vertically stacked architecture',
                  'Active cooling tunnel',
                  'Isolated analog sensor compartment',
                  'Grounded structural divider',
                  'Sheet aluminium industrial enclosure',
                  'Deterministic cable routing',
                  'Torque-angle fastening',
                  'Stainless steel thread inserts',
                  'Maintainability over minimum size',
                  'AMD-based edge compute',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-background/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-foreground/90">{feature}</span>
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
