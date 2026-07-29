'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Shield, Cpu, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onEnterWorkspace?: () => void;
}

export function HeroSection({ onEnterWorkspace }: HeroSectionProps) {
  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-emerald-950/20" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-amber-500/10 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[500px] sm:h-[500px] rounded-full bg-emerald-600/5 blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Building Trusted Digital Infrastructure for South Africa
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-foreground">Venture Vision</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
            Ubuntu
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          A South African technology and research organization building
          community finance, trusted digital infrastructure, and applied engineering
          through deterministic, evidence-backed processes.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          {onEnterWorkspace && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 px-8 py-6 text-base gap-2"
              onClick={onEnterWorkspace}
            >
              <LayoutDashboard className="w-5 h-5" />
              Enter Workspace
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-8 py-6 text-base"
            onClick={() => handleScroll('#programs')}
          >
            Explore Our Programs
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: '7', label: 'Trust Products', icon: Cpu },
            { value: '10+', label: 'Strategic Partners', icon: Shield },
            { value: '1 Aug', label: 'Public Launch', icon: Sparkles },
            { value: 'ZA', label: 'South African Built', icon: ArrowDown },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3">
              <stat.icon className="w-5 h-5 text-emerald-400/60" />
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <button
          onClick={() => handleScroll('#about')}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          <span className="text-xs uppercase tracking-widest">Discover</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
}
