'use client';

import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';

const mono = 'IBM Plex Mono, ui-monospace, monospace';

export default function ClerkSignInPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>VENTURE VISION UBUNTU</div>
        <h1 style={styles.title}>Sign in (Backup)</h1>
        <p style={styles.subtitle}>
          Supabase is unavailable. Use Clerk with Google or Apple to continue.
        </p>
        <Suspense fallback={null}>
          <SignIn
            routing="path"
            path="/clerk/sign-in"
            signUpUrl="/clerk/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                cardBox: { background: 'transparent', boxShadow: 'none' },
                formButtonPrimary: {
                  background: 'rgba(120,170,255,0.18)',
                  border: '1px solid rgba(120,170,255,0.5)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                },
                socialButtonsBlockButton: {
                  background: 'rgba(120,170,255,0.08)',
                  border: '1px solid rgba(120,170,255,0.3)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontSize: 13,
                },
                formFieldInput: {
                  background: 'rgba(9,14,20,0.9)',
                  border: '1px solid rgba(120,170,255,0.3)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                },
                headerTitle: { color: '#e6f1ff', fontFamily: mono },
                headerSubtitle: { color: 'rgba(230,241,255,0.7)', fontFamily: mono },
                formFieldLabel: { color: 'rgba(230,241,255,0.7)', fontFamily: mono },
                footerActionLink: { color: 'rgba(120,170,255,0.8)' },
                dividerLine: { background: 'rgba(120,170,255,0.15)' },
                dividerText: { color: 'rgba(230,241,255,0.5)' },
              },
            }}
          />
        </Suspense>
        <a href="/login" style={styles.backLink}>
          Back to primary login
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    background: '#0b0f14',
    padding: 24,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 400,
    padding: '28px 26px',
    background: 'rgba(12,18,26,0.9)',
    border: '1px solid rgba(120,170,255,0.25)',
    borderRadius: 12,
    color: '#e6f1ff',
    fontFamily: mono,
  },
  brand: {
    fontSize: 10,
    letterSpacing: '0.18em',
    color: 'rgba(120,170,255,0.7)',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: 'rgba(230,241,255,0.5)',
    textAlign: 'center',
  },
  backLink: {
    fontSize: 12,
    color: 'rgba(120,170,255,0.8)',
    textDecoration: 'none',
    fontFamily: mono,
    marginTop: 8,
  },
};
