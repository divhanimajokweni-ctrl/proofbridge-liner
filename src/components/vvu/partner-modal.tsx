'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Handshake, Building2, Heart, Rocket, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

type PartnerStatus = 'PROPOSED' | 'TARGET';

interface ModalPartner {
  name: string;
  category: string;
  badge: string;
  status: PartnerStatus;
  abbreviation?: string;
  whyThem: string;
}

const MODAL_PARTNERS: ModalPartner[] = [
  { name: 'Makro', category: 'Retail', badge: 'Retail', status: 'TARGET', whyThem: 'Targeting Makro to integrate retail supply-chain provenance for consumer goods verification.' },
  { name: 'Massmart', category: 'Retail', badge: 'Retail', status: 'PROPOSED', whyThem: 'Proposed integration with Massmart for wholesale distribution trust verification across South Africa.' },
  { name: 'Pepkor', category: 'Retail', badge: 'Retail', status: 'PROPOSED', whyThem: 'Targeting Pepkor to bring affordable retail verification to community-scale transactions.' },
  { name: 'Vodacom', category: 'Telecom', badge: 'Telecom', status: 'TARGET', whyThem: 'Targeting Vodacom to integrate enterprise-grade messaging queues for real-time trust verification.' },
  { name: 'MTN', category: 'Telecom', badge: 'Telecom', status: 'PROPOSED', whyThem: 'Proposed integration with MTN for mobile network identity verification across African markets.' },
  { name: 'Standard Bank', category: 'Finance', badge: 'Finance', status: 'TARGET', whyThem: 'Proposed integration with Standard Bank for verified financial identity anchoring.' },
  { name: 'Absa', category: 'Finance', badge: 'Finance', status: 'PROPOSED', whyThem: 'Targeting Absa for cross-bank trust attestation in financial services pipelines.' },
  { name: 'University of Cape Town', category: 'Academic', badge: 'Academic', status: 'TARGET', abbreviation: 'UCT', whyThem: 'Targeting UCT for collaborative research on epistemic trust maturation in academic settings.' },
  { name: 'University of the Witwatersrand', category: 'Academic', badge: 'Academic', status: 'TARGET', abbreviation: 'Wits', whyThem: 'Targeting Wits for joint research on computational trust and Bayesian inference in education.' },
  { name: 'University of Pretoria', category: 'Academic', badge: 'Academic', status: 'PROPOSED', abbreviation: 'UP', whyThem: 'Proposed research partnership with UP for engineering systems trust verification.' },
  { name: 'AMD', category: 'Hardware', badge: 'Hardware', status: 'TARGET', whyThem: 'Targeting AMD for TEE-attested compute infrastructure powering the Epistemic Runtime.' },
  { name: 'Sarah Baartman DM', category: 'Government', badge: 'Government', status: 'PROPOSED', whyThem: 'Proposed integration with Sarah Baartman District Municipality for community governance trust infrastructure.' },
];

const BADGE_COLORS: Record<string, string> = {
  Retail: 'border-emerald-700 text-emerald-500 bg-emerald-950/30',
  Telecom: 'border-amber-700 text-amber-500 bg-amber-950/30',
  Finance: 'border-emerald-700 text-emerald-400 bg-emerald-950/20',
  Academic: 'border-amber-600 text-amber-400 bg-amber-950/20',
  Hardware: 'border-emerald-700 text-emerald-400 bg-emerald-950/20',
  Government: 'border-amber-800 text-amber-500 bg-amber-950/30',
};

const STATUS_STYLES: Record<PartnerStatus, string> = {
  PROPOSED: 'border-amber-500/50 text-amber-400 bg-amber-950/10',
  TARGET: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/10',
};

const SPONSOR_TIERS = [
  {
    name: 'Community Backer',
    price: 'Free',
    icon: Heart,
    description: 'Spread the word. Community backers receive early updates, community access, and their name on our supporters page.',
    accent: 'border-emerald-700/40 text-emerald-500',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-950/20',
  },
  {
    name: 'Infrastructure Sponsor',
    price: 'R5k – R50k',
    icon: Building2,
    description: 'Fund core infrastructure: server compute, TEE hardware, and HBK pipeline scaling. Sponsors receive quarterly impact reports and integration previews.',
    accent: 'border-amber-700/40 text-amber-500',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-950/20',
  },
  {
    name: 'Enterprise Patron',
    price: 'R50k+',
    icon: Rocket,
    description: 'Shape the roadmap. Enterprise patrons receive dedicated integration support, priority feature requests, and co-branded trust infrastructure deployments.',
    accent: 'border-emerald-600/40 text-emerald-400',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/30',
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerModal({ open, onOpenChange }: PartnerModalProps) {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [orgName, setOrgName] = useState('');
  const [partnershipType, setPartnershipType] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    try {
      const res = await fetch('/api/partner-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: orgName,
          partnershipType,
          message,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setFormState('success');
      setOrgName('');
      setPartnershipType('');
      setMessage('');
    } catch {
      setFormState('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0f] border-emerald-900/30 text-foreground"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Partner With VVU</DialogTitle>
          <DialogDescription>
            Explore target integrations, sponsorship tiers, and partnership application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-10 pt-2">
          {/* ---- Section 1: Hero ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Handshake className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Build the{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
                Trust Infrastructure
              </span>{' '}
              of Tomorrow
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-base">
              VVU needs partners to expand the Epistemic Runtime, scale HBK pipelines,
              and build verified trust networks for South Africa and beyond. Every
              integration strengthens the cryptographic provenance chain — and every
              sponsor accelerates the infrastructure that makes it possible.
            </p>
          </motion.div>

          {/* ---- Section 2: Target Ecosystem ---- */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Who We Are Looking For
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              12 target organizations across retail, telecom, finance, academia, hardware, and government.
              None of these are confirmed partnerships — they represent the ecosystem we are building toward.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODAL_PARTNERS.map((partner) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group opacity-70 hover:opacity-100 transition-opacity duration-300"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="h-full border-border/20 hover:border-emerald-700/30 transition-colors">
                        <CardContent className="p-4 flex gap-3">
                          {/* Greyscale initial */}
                          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-muted/30 border border-border/20 text-muted-foreground/50 font-bold text-sm">
                            {partner.abbreviation || partner.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-foreground/80 group-hover:text-foreground transition-colors truncate">
                                {partner.name}
                              </h4>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[partner.status]}`}>
                                {partner.status}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${BADGE_COLORS[partner.badge] || ''}`}>
                                {partner.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {partner.whyThem}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[260px] bg-popover text-popover-foreground border border-border shadow-lg"
                    >
                      <p className="text-xs">
                        We are actively developing pathways to integrate with {partner.name}. No official partnership is currently in place.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ---- Section 3: Sponsor Us ---- */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Back the Infrastructure
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Three ways to fund the trust infrastructure — from community advocacy to enterprise-grade deployments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SPONSOR_TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className={`h-full border ${tier.accent} hover:scale-[1.02] transition-transform`}>
                      <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tier.bgColor}`}>
                          <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                        </div>
                        <h4 className="font-semibold text-foreground">{tier.name}</h4>
                        <span className={`text-lg font-bold ${tier.iconColor}`}>{tier.price}</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tier.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ---- Section 4: Partnership Application ---- */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Partnership Application
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Authenticated applications receive priority review.{' '}
              <span className="text-amber-500 font-medium">Sign in</span> to verify your identity.
            </p>

            {formState === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-xl border border-emerald-700/30 bg-emerald-950/10 p-6 text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-semibold text-emerald-400 text-lg">Application Received</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for your interest in building together. We will review your application and reach out soon.
                </p>
                <Button
                  onClick={() => setFormState('idle')}
                  variant="outline"
                  className="mt-4 border-emerald-700/40 text-emerald-500 hover:bg-emerald-600/10"
                >
                  Submit Another
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="org-name" className="block text-sm font-medium text-foreground mb-1.5">
                    Company / Organization Name
                  </label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Vodacom Group"
                    required
                    className="bg-muted/20 border-border/40 focus-visible:border-emerald-600/50 focus-visible:ring-emerald-600/20"
                  />
                </div>

                <div>
                  <label htmlFor="partnership-type" className="block text-sm font-medium text-foreground mb-1.5">
                    Partnership Type
                  </label>
                  <Select value={partnershipType} onValueChange={setPartnershipType} required>
                    <SelectTrigger
                      id="partnership-type"
                      className="bg-muted/20 border-border/40 focus:ring-emerald-600/20"
                    >
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-border/40">
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Sponsorship">Sponsorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="build-together" className="block text-sm font-medium text-foreground mb-1.5">
                    How can we build together?
                  </label>
                  <Textarea
                    id="build-together"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your organization and what a partnership could look like..."
                    rows={4}
                    required
                    className="bg-muted/20 border-border/40 focus-visible:border-emerald-600/50 focus-visible:ring-emerald-600/20"
                  />
                </div>

                {formState === 'error' && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Something went wrong. Please try again.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {formState === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
