'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Car,
  Palette,
  Award,
  Globe,
  MapPin,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const AMBASSADOR_PROGRAMS = [
  {
    icon: Users,
    title: 'Community Ambassadors',
    desc: 'Local community leaders who represent VVU in their communities, facilitate engagement, and provide grassroots feedback.',
    color: 'emerald',
    tier: null,
  },
  {
    icon: Car,
    title: 'Driver Ambassador Programme',
    desc: 'Engagement-driven ambassadors with tiered recognition based on community impact and participation.',
    color: 'amber',
    tiers: [
      { name: 'Bronze', desc: 'Initial engagement and community introduction' },
      { name: 'Silver', desc: 'Consistent participation and community growth' },
      { name: 'Gold', desc: 'Sustained impact and mentorship of new ambassadors' },
    ],
  },
  {
    icon: Palette,
    title: 'Digital Creator Programme',
    desc: 'Content creators and storytellers who amplify VVU\'s mission through authentic, community-driven narratives.',
    color: 'emerald',
    tier: null,
  },
  {
    icon: Award,
    title: 'Community Champions',
    desc: 'Long-term community advocates who have demonstrated sustained commitment to VVU\'s mission and values.',
    color: 'amber',
    tier: null,
  },
];

const OUTREACH_TARGETS = [
  'Municipal Water Departments',
  'Community Savings Groups',
  'Local Government Officials',
  'Academic Institutions',
  'Small Business Networks',
  'Rural Communities',
  'Youth Organizations',
  'Cooperative Movements',
];

export function CommunitySection() {
  return (
    <section id="community" className="relative py-24 sm:py-32 bg-emerald-950/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
            Community
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Powered by{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Community
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Ubuntu means &ldquo;I am because we are.&rdquo; Our community programmes are the heart of everything we build.
          </p>
        </motion.div>

        {/* Ambassador Programs */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {AMBASSADOR_PROGRAMS.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className={`h-full border-${program.color === 'emerald' ? 'emerald' : 'amber'}-900/20 bg-card`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      program.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-amber-600/10 text-amber-500'
                    }`}>
                      <program.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{program.desc}</p>

                  {/* Tiers */}
                  {program.tiers && (
                    <div className="mt-4 space-y-3">
                      {program.tiers.map((tier) => (
                        <div key={tier.name} className="flex items-start gap-3">
                          <Badge
                            variant="outline"
                            className={`flex-none text-xs ${
                              tier.name === 'Bronze'
                                ? 'border-amber-800 text-amber-600'
                                : tier.name === 'Silver'
                                ? 'border-gray-500 text-gray-400'
                                : 'border-yellow-600 text-yellow-500'
                            }`}
                          >
                            {tier.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{tier.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Outreach Targets */}
        <motion.div {...fadeInUp} className="mt-16">
          <Card className="border-amber-900/20 bg-amber-950/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-500">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Outreach Targets</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Communities and organizations we are actively engaging
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OUTREACH_TARGETS.map((target) => (
                  <div
                    key={target}
                    className="flex items-center gap-2 rounded-lg border border-amber-900/20 bg-amber-950/20 p-3"
                  >
                    <MapPin className="h-4 w-4 flex-none text-amber-500" />
                    <span className="text-xs font-medium text-foreground">{target}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Community Launch Kit */}
        <motion.div {...fadeInUp} className="mt-8">
          <div className="rounded-xl border border-emerald-900/30 bg-gradient-to-r from-emerald-950/20 to-amber-950/20 p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground">Community Launch Kit</h3>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Everything you need to bring VVU to your community. Toolkits, guides, and resources
              for ambassadors, creators, and champions.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['Ambassador Guide', 'Content Toolkit', 'Community Templates', 'Impact Metrics'].map((item) => (
                <Badge key={item} variant="outline" className="border-emerald-700 text-emerald-400">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
