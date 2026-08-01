'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  onEnterWorkspace: () => void;
  onPartnerWithUs?: () => void;
}

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Mission', href: '#mission' },
  { label: 'Programs', href: '#programs' },
  { label: 'Engineering', href: '#engineering' },
  { label: 'Partners', href: '#partners' },
  { label: 'Community', href: '#community' },
  { label: 'Contact', href: '#contact' },
];

export function Navigation({ onEnterWorkspace, onPartnerWithUs }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-emerald-900/20 shadow-lg shadow-emerald-950/10'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none" aria-hidden className="flex-none">
                <defs>
                  <linearGradient id="nav-rg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8A9A5B"/><stop offset="100%" stopColor="#6B7A3E"/></linearGradient>
                  <linearGradient id="nav-rg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CC7722"/><stop offset="100%" stopColor="#A85E15"/></linearGradient>
                  <linearGradient id="nav-rg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2E3DB"/><stop offset="100%" stopColor="#C4C5BD"/></linearGradient>
                </defs>
                <circle cx="35" cy="40" r="16" stroke="url(#nav-rg1)" strokeWidth="5.5" />
                <circle cx="65" cy="40" r="16" stroke="url(#nav-rg2)" strokeWidth="5.5" />
                <circle cx="50" cy="64" r="16" stroke="url(#nav-rg3)" strokeWidth="5.5" />
                <circle cx="50" cy="50" r="2" fill="#C9A84C" opacity="0.8" />
              </svg>
              <span className="text-lg font-bold tracking-tight">
                Venture Vision{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
                  Ubuntu
                </span>
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-emerald-950/30"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-3 lg:flex">
              {onPartnerWithUs && (
                <Button
                  onClick={onPartnerWithUs}
                  variant="outline"
                  size="sm"
                  className="border-emerald-600/40 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-500"
                >
                  Partner With Us
                </Button>
              )}
              <Button
                onClick={() => handleLinkClick('#contact')}
                variant="outline"
                size="sm"
                className="border-amber-600/40 text-amber-600 hover:bg-amber-600/10 hover:text-amber-500"
              >
                Get Involved
              </Button>
              <Button
                onClick={onEnterWorkspace}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Enter Workspace
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 lg:hidden"
          >
            <div className="flex flex-col gap-2 px-6">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className="rounded-md px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-emerald-950/30"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                {onPartnerWithUs && (
                  <Button
                    onClick={() => { setMobileOpen(false); onPartnerWithUs(); }}
                    variant="outline"
                    className="w-full border-emerald-600/40 text-emerald-600 hover:bg-emerald-600/10"
                  >
                    Partner With Us
                  </Button>
                )}
                <Button
                  onClick={() => { setMobileOpen(false); handleLinkClick('#contact'); }}
                  variant="outline"
                  className="w-full border-amber-600/40 text-amber-600 hover:bg-amber-600/10"
                >
                  Get Involved
                </Button>
                <Button
                  onClick={() => { setMobileOpen(false); onEnterWorkspace(); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Enter Workspace
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
