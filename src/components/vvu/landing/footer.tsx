'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const LINK_COLUMNS = [
  {
    title: 'About',
    links: [
      { label: 'Our Mission', href: '#mission' },
      { label: 'Engineering', href: '#engineering' },
      { label: 'Team', href: '#about' },
      { label: 'Careers', href: '#contact' },
    ],
  },
  {
    title: 'Programs',
    links: [
      { label: 'Ubuntu Pools', href: '#programs' },
      { label: 'ProofBridge', href: '#programs' },
      { label: 'HBK Mk-II', href: '#programs' },
      { label: 'Epistemic Runtime', href: '#programs' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Ambassadors', href: '#community' },
      { label: 'Creators', href: '#community' },
      { label: 'Champions', href: '#community' },
      { label: 'Outreach', href: '#community' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Compliance', href: '#' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-border/50 bg-emerald-950/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <div className="py-12 border-b border-border/30">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Stay Updated</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get the latest updates on VVU programs, partnerships, and community news.
              </p>
            </div>
            {success ? (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Subscribed!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-background flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 flex-none"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Subscribe</span>
                </Button>
              </form>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* Links */}
        <div className="py-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {LINK_COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold text-foreground">{column.title}</h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 py-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" aria-hidden className="flex-none">
              <defs>
                <linearGradient id="ft-rg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8A9A5B"/><stop offset="100%" stopColor="#6B7A3E"/></linearGradient>
                <linearGradient id="ft-rg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CC7722"/><stop offset="100%" stopColor="#A85E15"/></linearGradient>
                <linearGradient id="ft-rg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2E3DB"/><stop offset="100%" stopColor="#C4C5BD"/></linearGradient>
              </defs>
              <circle cx="35" cy="40" r="16" stroke="url(#ft-rg1)" strokeWidth="5.5" />
              <circle cx="65" cy="40" r="16" stroke="url(#ft-rg2)" strokeWidth="5.5" />
              <circle cx="50" cy="64" r="16" stroke="url(#ft-rg3)" strokeWidth="5.5" />
              <circle cx="50" cy="50" r="2" fill="#C9A84C" opacity="0.8" />
            </svg>
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Venture Vision Ubuntu. All rights reserved.
            </span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Trusted Digital Infrastructure for South Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
