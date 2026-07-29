'use client';

import { useState } from 'react';
import { Heart, ArrowUp, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  Programs: [
    { label: 'Ubuntu Pools', href: '#programs' },
    { label: 'ProofBridge', href: '#programs' },
    { label: 'HBK Research', href: '#programs' },
    { label: 'Epistemic Runtime', href: '#programs' },
    { label: 'Education', href: '#programs' },
  ],
  Community: [
    { label: 'Ambassadors', href: '#community' },
    { label: 'Driver Programme', href: '#community' },
    { label: 'Digital Creators', href: '#community' },
    { label: 'Community Champions', href: '#community' },
    { label: 'Launch Kit', href: '#community' },
  ],
  Partners: [
    { label: 'Retail', href: '#partners' },
    { label: 'Connectivity', href: '#partners' },
    { label: 'Financial', href: '#partners' },
    { label: 'Academic', href: '#partners' },
    { label: 'Municipal', href: '#partners' },
  ],
  Organization: [
    { label: 'About VVU', href: '#about' },
    { label: 'Mission', href: '#mission' },
    { label: 'Engineering', href: '#engineering' },
    { label: 'Contact', href: '#contact' },
    { label: 'Partnerships', href: '#partners' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleNav = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      }
    } catch {
      // Silently fail for newsletter
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-background to-emerald-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Top section */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/vvu-logo.svg"
                alt="VVU Logo"
                className="w-9 h-9"
              />
              <div>
                <span className="text-base font-bold tracking-tight text-foreground">VVU</span>
                <span className="block text-[10px] text-muted-foreground tracking-widest uppercase">
                  Venture Vision Ubuntu
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Building trusted digital infrastructure for South Africa through
              deterministic, evidence-backed processes.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-muted-foreground">Built with</span>
              <Heart className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-muted-foreground">in South Africa</span>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Stay Updated</h4>
              {subscribed ? (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Welcome to the VVU community!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 text-sm h-9"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={subscribing}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleNav(link.href)}
                      className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mb-8" />

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Venture Vision Ubuntu. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span>Apache License 2.0</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-emerald-400"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              Back to top
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
