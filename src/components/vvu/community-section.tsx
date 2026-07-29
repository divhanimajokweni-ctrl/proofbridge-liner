'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Car,
  Video,
  Award,
  Star,
  Trophy,
  Shield,
  CheckCircle2,
  ArrowRight,
  Heart,
  Megaphone,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ambassadorPrograms = [
  {
    icon: Users,
    title: 'Community Ambassadors',
    description:
      'Recruit volunteers who genuinely believe in the mission. They receive VVU T-shirts, ID badges, training, flyers, QR code cards, and referral codes. Their role is not to sell — it is to explain Ubuntu Pools, answer questions, and help people onboard.',
    benefits: ['VVU T-shirt & ID badge', 'Training materials', 'Flyers & QR code cards', 'Referral code', 'Community recognition'],
    color: 'text-emerald-400',
    gradient: 'from-emerald-950/20 to-card',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: Car,
    title: 'Driver Ambassador Programme',
    description:
      'A branded mobility programme with three tiers — Bronze, Silver, and Gold. Vehicle branding with verified compliance, monthly verification, and performance-based incentives. This is organized marketing, not just paying for advertising.',
    benefits: ['Branded vehicle programme', 'Tiered recognition (Bronze/Silver/Gold)', 'Performance-based incentives', 'Monthly verification', 'Signed agreement & compliance'],
    color: 'text-amber-400',
    gradient: 'from-amber-950/20 to-card',
    borderColor: 'border-amber-500/20',
    tiers: [
      { name: 'Bronze', icon: Shield, desc: 'Base participation, vehicle inspection, signed agreement' },
      { name: 'Silver', icon: Star, desc: 'Verified referrals, consistent branding compliance' },
      { name: 'Gold', icon: Trophy, desc: 'Top performer, community onboarding leader, recognition' },
    ],
  },
  {
    icon: Video,
    title: 'Digital Creator Programme',
    description:
      'Recruit many smaller creators instead of only large influencers. Provide ready-made graphics, short videos, weekly talking points, referral links, and recognition. Dozens of smaller creators can outperform one large influencer because they reach different communities.',
    benefits: ['Ready-made graphics & videos', 'Weekly talking points', 'Referral links', 'Recognition for top contributors', 'Cross-community reach'],
    color: 'text-purple-400',
    gradient: 'from-purple-950/20 to-card',
    borderColor: 'border-purple-500/20',
  },
  {
    icon: Heart,
    title: 'Community Champions',
    description:
      'Find respected local people — not celebrities, but teachers, pastors, youth leaders, NGO organisers, stokvel leaders, and small business owners. If they trust VVU, others are much more likely to listen.',
    benefits: ['Trusted local voices', 'Community credibility', 'Organic word-of-mouth', 'Cultural bridge', 'Long-term relationships'],
    color: 'text-rose-400',
    gradient: 'from-rose-950/20 to-card',
    borderColor: 'border-rose-500/20',
  },
];

const outreachTargets = [
  { label: 'Churches', icon: '⛪' },
  { label: 'Schools', icon: '🏫' },
  { label: 'Universities', icon: '🎓' },
  { label: 'Community Centres', icon: '🏛️' },
  { label: 'Taxi Ranks', icon: '🚐' },
  { label: 'Small Business Forums', icon: '💼' },
  { label: 'Youth Organisations', icon: '🌟' },
  { label: 'Entrepreneur Groups', icon: '🚀' },
];

export function CommunitySection() {
  return (
    <section id="community" className="relative py-24 sm:py-32">
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
            Community
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            The VVU Community Engine
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Most startups launch a product and then try to find users. VVU is building a movement
            around a mission and then growing products inside that movement. That changes the
            order of operations.
          </p>
        </motion.div>

        {/* Ambassador programmes */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {ambassadorPrograms.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className={`h-full ${program.borderColor} bg-gradient-to-br ${program.gradient} hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                      <program.icon className={`w-5 h-5 ${program.color}`} />
                    </div>
                    <h3 className="text-xl font-bold">{program.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {program.description}
                  </p>

                  {/* Tiers (for Driver programme) */}
                  {program.tiers && (
                    <div className="mb-6 space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ambassador Tiers</h4>
                      {program.tiers.map((tier, j) => (
                        <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-background/40">
                          <tier.icon className={`w-4 h-4 ${program.color}`} />
                          <div>
                            <span className="font-medium text-sm">{tier.name}</span>
                            <span className="text-muted-foreground text-sm ml-2">— {tier.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Benefits */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">What You Get</h4>
                    <div className="flex flex-wrap gap-2">
                      {program.benefits.map((benefit, j) => (
                        <Badge key={j} variant="secondary" className="text-xs bg-background/50 hover:bg-background/80">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Outreach targets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 sm:mb-20"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Local Community Outreach
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            The objective is education first, onboarding second. We meet communities where they are.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {outreachTargets.map((target, i) => (
              <motion.div
                key={target.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all cursor-default"
              >
                <span className="text-2xl">{target.icon}</span>
                <span className="text-sm font-medium text-center">{target.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Community Launch Kit CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-card">
            <CardContent className="p-6 sm:p-10 text-center">
              <Megaphone className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                VVU Community Launch Kit
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                A complete digital package ready for distribution — including a one-page overview,
                Ubuntu Pools flyer, volunteer application form, ambassador handbook, partnership
                prospectus, presentation deck, social media graphics, vehicle branding guidelines,
                consent forms, and referral tracking system.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {['One-page overview', 'Flyer & QR codes', 'Ambassador handbook', 'Partnership prospectus', 'Presentation deck', 'Social media assets', 'Vehicle branding guide', 'Consent & forms'].map((item, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                    {item}
                  </Badge>
                ))}
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25"
                onClick={() => {
                  const el = document.querySelector('#contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Join the Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
