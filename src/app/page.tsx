'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/vvu/landing/navigation';
import { HeroSection } from '@/components/vvu/landing/hero-section';
import { AboutSection } from '@/components/vvu/landing/about-section';
import { MissionSection } from '@/components/vvu/landing/mission-section';
import { ProgramsSection } from '@/components/vvu/landing/programs-section';
import { EngineeringSection } from '@/components/vvu/landing/engineering-section';
import { PartnersSection } from '@/components/vvu/landing/partners-section';
import { CommunitySection } from '@/components/vvu/landing/community-section';
import { NewsSection } from '@/components/vvu/landing/news-section';
import { ContactSection } from '@/components/vvu/landing/contact-section';
import { PricingSection } from '@/components/vvu/landing/pricing-section';
import { Footer } from '@/components/vvu/landing/footer';
import { PartnerModal } from '@/components/vvu/partner-modal';
import { IgnitionSequence } from '@/components/vvu/ignition-sequence';

const WorkbenchShell = dynamic(
  () => import('@/components/vvu/workbench-shell').then((m) => m.WorkbenchShell),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7b7d8c',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.12em',
        }}
      >
        VVU · initializing operating environment…
      </div>
    ),
  },
);

type View = 'landing' | 'ignition' | 'workspace';

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  // For demo purposes, default to community tier.
  // In production, this would be resolved from Clerk auth + license lookup.
  const [licenseTier] = useState<'community' | 'professional' | 'enterprise'>('community');

  const enterWorkspace = useCallback(() => setView('ignition'), []);
  const enterLanding = useCallback(() => setView('landing'), []);
  const handleIgnitionComplete = useCallback(() => setView('workspace'), []);

  // Dismiss the Clerk keyless prompt overlay when in workspace mode
  // so it doesn't interfere with workspace interactions
  useEffect(() => {
    if (view === 'workspace') {
      // Try to dismiss the Clerk keyless prompt
      const dismissBtn = document.querySelector('[data-clerk-keyless-dismiss]') as HTMLElement;
      if (dismissBtn) dismissBtn.click();

      // Also try to close the Clerk overlay by clicking its close button
      const clerkOverlay = document.querySelector('.clerk-keyless-prompt') as HTMLElement;
      if (clerkOverlay) clerkOverlay.style.display = 'none';
    }
  }, [view]);

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen flex flex-col overflow-x-hidden"
        >
          <Navigation onEnterWorkspace={enterWorkspace} onPartnerWithUs={() => setPartnerModalOpen(true)} />
          <main className="flex-1">
            <HeroSection onEnterWorkspace={enterWorkspace} />
            <AboutSection />
            <MissionSection />
            <ProgramsSection />
            <EngineeringSection />
            <PricingSection />
            <PartnersSection onPartnerWithUs={() => setPartnerModalOpen(true)} />
            <CommunitySection />
            <NewsSection />
            <ContactSection />
          </main>
          <Footer />
          <PartnerModal open={partnerModalOpen} onOpenChange={setPartnerModalOpen} />
        </motion.div>
      ) : view === 'ignition' ? (
        <motion.div
          key="ignition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0"
        >
          <IgnitionSequence
            userName="Operator"
            licenseTier={licenseTier}
            onComplete={handleIgnitionComplete}
          />
        </motion.div>
      ) : (
        <motion.div
          key="workspace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative h-screen overflow-hidden"
        >
          {/* Back to website button */}
          <div className="absolute top-3 right-3 z-50">
            <Button
              onClick={enterLanding}
              size="sm"
              variant="outline"
              className="border-amber-600/40 text-amber-500 hover:bg-amber-600/10 hover:text-amber-400 gap-2 backdrop-blur-sm"
            >
              <Globe className="h-4 w-4" />
              Website
            </Button>
          </div>
          <WorkbenchShell />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
