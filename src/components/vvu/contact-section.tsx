'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Building2,
  Globe,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ContactFormData {
  name: string;
  email: string;
  organization: string;
  interest: string;
  message: string;
}

export function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    organization: '',
    interest: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message.');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', organization: '', interest: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'General Enquiries',
      value: 'hello@venturevisionubuntu.co.za',
      description: 'Partnership discussions and general questions',
    },
    {
      icon: Mail,
      label: 'Founder',
      value: 'divh@venturevisionubuntu.co.za',
      description: 'Direct contact for the founder and CEO',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'South Africa',
      description: 'Sarah Baartman District, Eastern Cape',
    },
    {
      icon: Building2,
      label: 'Entity',
      value: 'Venture Vision Ubuntu',
      description: 'Registered South African organization',
    },
  ];

  const interestOptions = [
    'Strategic Partnership',
    'Community Ambassador',
    'Driver Ambassador',
    'Digital Creator',
    'Research Collaboration',
    'Ubuntu Pools',
    'ProofBridge',
    'HBK Research',
    'Investment',
    'General Enquiry',
  ];

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-4 block">
            Contact
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Get Involved
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Venture Vision Ubuntu is building trusted digital infrastructure for South Africa.
            We are inviting strategic partners to help shape that journey.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold mb-4">Let&apos;s Connect</h3>
              <p className="text-muted-foreground leading-relaxed">
                Whether you are a potential partner, community member, researcher, or
                volunteer — we would like to hear from you. VVU is an organization
                that grows through collaboration.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/20 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <info.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">{info.label}</h4>
                    <p className="font-semibold">{info.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Areas of Interest
              </h4>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((option, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
                    onClick={() => setFormData(prev => ({ ...prev, interest: option }))}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-card">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message Received</h3>
                    <p className="text-muted-foreground">
                      Thank you for your interest in Venture Vision Ubuntu.
                      We will be in touch soon.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-xl font-bold">Send a Message</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Full Name *
                        </label>
                        <Input
                          placeholder="Your name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          placeholder="you@organization.co.za"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Organization
                        </label>
                        <Input
                          placeholder="Your organization"
                          value={formData.organization}
                          onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Area of Interest
                        </label>
                        <Input
                          placeholder="e.g. Strategic Partnership"
                          value={formData.interest}
                          onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Message *
                      </label>
                      <Textarea
                        placeholder="Tell us about your interest in VVU, how you'd like to collaborate, or any questions you have..."
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-background/50 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>

                    {error && (
                      <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to be contacted by Venture Vision Ubuntu
                      regarding your enquiry.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
