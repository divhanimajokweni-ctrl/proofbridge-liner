'use client';

import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';

const mono = 'IBM Plex Mono, ui-monospace, monospace';

export default function LoginPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>VENTURE VISION UBUNTU</div>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>
          Verifiable infrastructure for digital assets, governance, and trusted financial systems.
        </p>
        <Suspense fallback={null}>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/login?mode=signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                cardBox: { background: 'transparent', boxShadow: 'none', border: 'none' },
                rootBox: { width: '100%' },
                formButtonPrimary: {
                  background: 'rgba(200,168,74,0.18)',
                  border: '1px solid rgba(200,168,74,0.5)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '11px 12px',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'rgba(200,168,74,0.3)',
                    border: '1px solid rgba(200,168,74,0.7)',
                  },
                },
                socialButtonsBlockButton: {
                  background: 'rgba(200,168,74,0.08)',
                  border: '1px solid rgba(200,168,74,0.25)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontSize: 13,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'rgba(200,168,74,0.15)',
                  },
                },
                socialButtonsBlockButtonText: {
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontWeight: 400,
                },
                formFieldInput: {
                  background: 'rgba(9,14,20,0.9)',
                  border: '1px solid rgba(200,168,74,0.25)',
                  borderRadius: 6,
                  color: '#e6f1ff',
                  fontFamily: mono,
                  fontSize: 14,
                  '&:focus': {
                    border: '1px solid rgba(200,168,74,0.5)',
                    boxShadow: '0 0 0 1px rgba(200,168,74,0.15)',
                  },
                },
                formFieldLabel: { color: 'rgba(230,241,255,0.7)', fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' },
                headerTitle: { color: '#e6f1ff', fontFamily: mono, fontSize: 18, fontWeight: 600 },
                headerSubtitle: { color: 'rgba(230,241,255,0.5)', fontFamily: mono, fontSize: 12 },
                footerActionLink: { color: 'rgba(200,168,74,0.8)', fontFamily: mono, fontSize: 12 },
                dividerLine: { background: 'rgba(200,168,74,0.15)' },
                dividerText: { color: 'rgba(230,241,255,0.4)', fontFamily: mono, fontSize: 11 },
                formFieldSuccessText: { color: '#9bffcf' },
                formFieldErrorText: { color: '#ff9b9b' },
                alertBox: {
                  background: 'rgba(255,80,80,0.1)',
                  border: '1px solid rgba(255,80,80,0.3)',
                  borderRadius: 6,
                  color: '#ff9b9b',
                },
                identityPreviewEditButton: { color: 'rgba(200,168,74,0.8)' },
              },
            }}
          />
        </Suspense>
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
    background: '#07090C',
    padding: 24,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 420,
    padding: '28px 26px',
    background: 'rgba(12,18,26,0.9)',
    border: '1px solid rgba(200,168,74,0.2)',
    borderRadius: 12,
    color: '#e6f1ff',
    fontFamily: mono,
  },
  brand: {
    fontSize: 10,
    letterSpacing: '0.18em',
    color: 'rgba(200,168,74,0.7)',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: 'rgba(230,241,255,0.4)',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 320,
  },
};
