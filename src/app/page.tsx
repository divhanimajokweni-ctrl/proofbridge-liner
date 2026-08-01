'use client';

import { useState } from 'react';
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
import { Footer } from '@/components/vvu/landing/footer';
import { PartnerModal } from '@/components/vvu/partner-modal';

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

export default function Home() {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  const enterWorkspace = () => setView('workspace');
  const enterLanding = () => setView('landing');

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
            <PartnersSection onPartnerWithUs={() => setPartnerModalOpen(true)} />
            <CommunitySection />
            <NewsSection />
            <ContactSection />
          </main>
          <Footer />
          <PartnerModal open={partnerModalOpen} onOpenChange={setPartnerModalOpen} />
        </motion.div>
      ) : (
        <motion.div
          key="workspace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
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
