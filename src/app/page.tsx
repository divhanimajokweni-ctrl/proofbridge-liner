'use client';

import { useState } from 'react';
import { Navigation } from '@/components/vvu/navigation';
import { HeroSection } from '@/components/vvu/hero-section';
import { AboutSection } from '@/components/vvu/about-section';
import { MissionSection } from '@/components/vvu/mission-section';
import { ProgramsSection } from '@/components/vvu/programs-section';
import { EngineeringSection } from '@/components/vvu/engineering-section';
import { PartnersSection } from '@/components/vvu/partners-section';
import { CommunitySection } from '@/components/vvu/community-section';
import { NewsSection } from '@/components/vvu/news-section';
import { ContactSection } from '@/components/vvu/contact-section';
import { Footer } from '@/components/vvu/footer';
import { WorkbenchShell } from '@/components/vvu/workbench-shell';
import { AnimatePresence, motion } from 'framer-motion';

export default function VVUHome() {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen flex flex-col"
        >
          <Navigation onEnterWorkspace={() => setView('workspace')} />
          <main className="flex-1">
            <HeroSection onEnterWorkspace={() => setView('workspace')} />
            <AboutSection />
            <MissionSection />
            <ProgramsSection onEnterWorkspace={() => setView('workspace')} />
            <EngineeringSection />
            <PartnersSection />
            <CommunitySection />
            <NewsSection />
            <ContactSection />
          </main>
          <Footer />
        </motion.div>
      ) : (
        <motion.div
          key="workspace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="h-screen"
        >
          <WorkbenchShell onBackToLanding={() => setView('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
