'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onEnterWorkspace: () => void;
}

const STATS = [
  { value: '5', label: 'Programs' },
  { value: '12', label: 'Strategic Partners' },
  { value: '6', label: 'Engineering Gates' },
  { value: '1', label: 'Trust Runtime' },
];

export function HeroSection({ onEnterWorkspace }: HeroSectionProps) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-amber-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(217,119,6,0.1),transparent_50%)]" />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" aria-hidden>
              <defs>
                <linearGradient id="hero-rg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8A9A5B"/><stop offset="100%" stopColor="#6B7A3E"/></linearGradient>
                <linearGradient id="hero-rg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CC7722"/><stop offset="100%" stopColor="#A85E15"/></linearGradient>
                <linearGradient id="hero-rg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2E3DB"/><stop offset="100%" stopColor="#C4C5BD"/></linearGradient>
              </defs>
              <circle cx="35" cy="40" r="16" stroke="url(#hero-rg1)" strokeWidth="5.5" />
              <circle cx="65" cy="40" r="16" stroke="url(#hero-rg2)" strokeWidth="5.5" />
              <circle cx="50" cy="64" r="16" stroke="url(#hero-rg3)" strokeWidth="5.5" />
              <circle cx="50" cy="50" r="2" fill="#C9A84C" opacity="0.8" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-500 bg-clip-text text-transparent">
              Venture Vision Ubuntu
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-4 text-lg font-medium text-emerald-300/80 sm:text-xl">
            Trusted Digital Infrastructure for South Africa
          </p>

          {/* Mission statement */}
          <p className="mx-auto mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Building trusted digital infrastructure for South African communities through deterministic engineering, cryptographic provenance, and the Ubuntu philosophy.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={onEnterWorkspace}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 text-base"
            >
              <LayoutDashboard className="h-5 w-5" />
              Enter Workspace
            </Button>
            <Button
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              className="border-amber-600/40 text-amber-600 hover:bg-amber-600/10 hover:text-amber-500 gap-2 px-8 text-base"
            >
              Partner With Us
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              className="flex flex-col items-center rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6 backdrop-blur-sm"
            >
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent sm:text-4xl">
                {stat.value}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
