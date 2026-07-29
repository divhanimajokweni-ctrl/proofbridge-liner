'use client';

import { motion } from 'framer-motion';
import { Target, Eye, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const milestones = [
  'Freeze the HBK Mk-II engineering baseline',
  'Build the Engineering Knowledge Graph as the authoritative system of record',
  'Build the Engineering Compiler System',
  'Integrate AI agents into deterministic engineering workflows',
  'Ensure all generated artifacts are verified, reproducible, and cryptographically traceable',
  'Advance the VVU HBK Applied Research Programme',
  'Launch open-source platforms on 1 August',
  'Establish strategic partnerships across academia, industry, and municipalities',
  'Grow Ubuntu Pools by onboarding early communities',
  'Recruit the first core employees and volunteers',
];

const timeline = [
  {
    phase: 'Now — June 15',
    title: 'Community Launch Kit',
    items: ['One-page VVU overview', 'Ubuntu Pools flyer', 'Ambassador handbook', 'Partnership prospectus', 'Presentation deck'],
  },
  {
    phase: 'June — June 30',
    title: 'Strategic Partner Consortium',
    items: ['Partner prospectus', 'Tailored outreach emails', 'CRM setup', 'Pitch deck'],
  },
  {
    phase: 'July — July 15',
    title: 'Community & Ambassador Programs',
    items: ['Community Ambassadors', 'Driver Ambassador Programme', 'Digital Creator Programme', 'Community Champions'],
  },
  {
    phase: 'August 1',
    title: 'Public Launch',
    items: ['Open-source platforms live', 'Validation demonstrations', 'Public evidence', 'Partnership announcements'],
  },
];

export function MissionSection() {
  return (
    <section id="mission" className="relative py-24 sm:py-32 bg-gradient-to-b from-emerald-950/10 via-background to-background">
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
            Our Mission
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            What We Are Building
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We are building an engineering operating system capable of coordinating humans,
            AI agents, verification engines, manufacturing pipelines, and physical infrastructure
            through deterministic, evidence-backed processes.
          </p>
        </motion.div>

        {/* Vision & Mission cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-card">
              <CardContent className="p-6 sm:p-8">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Venture Vision Ubuntu is developing trustworthy digital and engineering
                  infrastructure for South Africa. We are inviting strategic partners to help
                  shape that journey. The hardware is viewed as one output of the operating
                  system, not the end goal.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-card">
              <CardContent className="p-6 sm:p-8">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Current Priorities</h3>
                <ul className="space-y-3">
                  {milestones.slice(0, 6).map((m, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Roadmap to Launch
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {timeline.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
              >
                <Card className="h-full border-border/50 hover:border-emerald-500/30 transition-all group">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                        {phase.phase}
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg mb-4 group-hover:text-emerald-400 transition-colors">
                      {phase.title}
                    </h4>
                    <ul className="space-y-2">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-3 h-3 text-emerald-400/60 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
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
