'use client';

import { motion } from 'framer-motion';
import { Building2, Globe, Heart, Shield, Users, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const values = [
  {
    icon: Shield,
    title: 'Deterministic Systems',
    description: 'Every decision backed by evidence. Every workflow replayable. Every record immutable.',
  },
  {
    icon: Users,
    title: 'Ubuntu Philosophy',
    description: '"I am because we are." Community-first design that puts people at the centre of technology.',
  },
  {
    icon: Zap,
    title: 'Engineering Rigour',
    description: 'Compiler-style engineering with formal gates, cryptographic provenance, and reproducible outputs.',
  },
  {
    icon: Globe,
    title: 'South African Built',
    description: 'Designed and built in South Africa for African communities, with global applicability.',
  },
  {
    icon: Heart,
    title: 'Community Finance',
    description: 'Empowering stokvels, savings groups, and community pools with trusted digital infrastructure.',
  },
  {
    icon: Building2,
    title: 'Institutional Integrity',
    description: 'VVU operates as an organization, not a personality. Built to last beyond any single individual.',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
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
            About VVU
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Who We Are
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Venture Vision Ubuntu is a South African technology and research organization
            focused on community finance, trusted digital infrastructure, and applied engineering.
            We are building an engineering operating system capable of coordinating humans, AI agents,
            verification engines, manufacturing pipelines, and physical infrastructure through
            deterministic, evidence-backed processes.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-16 sm:mb-20">
          {/* Left: Identity */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">
              An Organization, Not a Personality
            </h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Venture Vision Ubuntu is not a personal project. It is an institution being built
                to outlast any single individual. Every communication, partnership, and engineering
                decision is made in the name of the organization.
              </p>
              <p>
                When we speak to a university, municipality, bank, or technology partner, the
                message is consistent: <em className="text-foreground font-medium">&quot;Venture Vision Ubuntu is building
                trusted digital infrastructure. Here is what we have achieved, here is where we
                are going, and here is how your organization can participate.&quot;</em>
              </p>
              <p>
                The HBK research programme is one project within the VVU portfolio. Ubuntu Pools,
                ProofBridge, SafeKrypte, and the Epistemic Runtime are all parts of the same
                organization — not competing for attention, but advancing together.
              </p>
            </div>
          </motion.div>

          {/* Right: Organizational structure */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">
              Organizational Functions
            </h3>
            <p className="text-muted-foreground mb-6">
              Even before the team grows, VVU operates with defined organizational functions.
              As the company scales, hats are replaced with people — not reinvented.
            </p>
            {[
              { name: 'Community & Partnerships', desc: 'Ambassador programmes, outreach, and strategic relationships' },
              { name: 'Engineering', desc: 'HBK Mk-II, ProofBridge, and the Engineering Compiler System' },
              { name: 'Research', desc: 'Applied research partnerships with universities and institutions' },
              { name: 'Marketing & Communications', desc: 'Brand, digital content, and public presence' },
              { name: 'Operations', desc: 'Infrastructure, logistics, and day-to-day execution' },
              { name: 'Finance & Legal', desc: 'Compliance, governance, and financial management' },
            ].map((func, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">{func.name}</h4>
                  <p className="text-sm text-muted-foreground">{func.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Values grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Our Values
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {values.map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all group">
                  <CardContent className="p-6">
                    <val.icon className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-lg mb-2">{val.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.description}</p>
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
