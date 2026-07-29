'use client';

import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  date: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: string;
  milestone?: boolean;
}

const newsItems: NewsItem[] = [
  {
    date: '2025-08-01',
    title: 'VVU Public Launch',
    excerpt: 'Open-source platforms go live. Validation demonstrations, public evidence, and partnership announcements mark the beginning of VVU\'s public presence.',
    category: 'Milestone',
    categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    milestone: true,
  },
  {
    date: '2025-07-15',
    title: 'Community Ambassador Network Active',
    excerpt: 'Community Ambassadors, Driver Ambassadors, Digital Creators, and Community Champions onboarded and operational across South African communities.',
    category: 'Community',
    categoryColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    date: '2025-07-01',
    title: 'ProofBridge v12 Core Complete',
    excerpt: 'Ed25519 cryptographic verification, MMR proofs, replay engine, validator registry, and gRPC/TLS service all verified and passing adversarial tests.',
    category: 'Engineering',
    categoryColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    date: '2025-06-30',
    title: 'Strategic Partner Consortium Established',
    excerpt: 'Partner prospectus delivered, outreach templates customized for ten first-wave partners, and CRM system operational for tracking engagement.',
    category: 'Partnership',
    categoryColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    date: '2025-06-15',
    title: 'Community Launch Kit Delivered',
    excerpt: 'Complete digital package including one-page overview, Ubuntu Pools flyer, ambassador handbook, partnership prospectus, and presentation deck.',
    category: 'Community',
    categoryColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    date: '2025-06-01',
    title: 'ECS v1.0 Specification Frozen',
    excerpt: 'Engineering Compiler Specification completed as the controlling document for the HBK Mk-II engineering baseline. Compiler kernel Sprint 0.1 delivered.',
    category: 'Engineering',
    categoryColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    date: '2025-05-15',
    title: 'HBK Mk-II Engineering Baseline Frozen',
    excerpt: 'Mechanical, electrical, thermal, and manufacturing parameters locked. Engineering Knowledge Graph populated with authoritative source files.',
    category: 'Engineering',
    categoryColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    date: '2025-05-01',
    title: 'VVU Website and Brand Identity Launched',
    excerpt: 'Organizational website, brand kit, and digital presence established. VVU communicates as an institution from day one.',
    category: 'Milestone',
    categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
];

export function NewsSection() {
  return (
    <section id="news" className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-emerald-950/10 to-background">
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
            News & Updates
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Latest from VVU
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Tracking our progress from engineering milestones to community launches. Every
            update represents verified, evidence-backed progress.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />

          <div className="space-y-4 sm:space-y-6">
            {newsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative pl-12 sm:pl-20"
              >
                {/* Timeline dot */}
                <div className={`absolute left-2 sm:left-6 top-6 w-4 h-4 rounded-full border-2 ${
                  item.milestone
                    ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30'
                    : 'bg-background border-emerald-500/50'
                }`} />

                <Card className={`border-border/50 hover:border-emerald-500/20 transition-all ${
                  item.milestone ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-card' : 'bg-card/50'
                }`}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline" className={item.categoryColor}>
                        {item.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
