'use client';

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

export default function VVUHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <MissionSection />
        <ProgramsSection />
        <EngineeringSection />
        <PartnersSection />
        <CommunitySection />
        <NewsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
