'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/session/client';
import { isClerkConfigured } from '@/lib/session/clerk-config';

const mono = 'IBM Plex Mono, ui-monospace, monospace';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const APPLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e6f1ff">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';
  const [clerkAvailable, setClerkAvailable] = useState<boolean | null>(null);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const configured = isClerkConfigured();
      setClerkAvailable(configured);
    } catch {
      setClerkAvailable(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/session/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      setBusy(false);
      if (error) {
        if (clerkAvailable) {
          setError(`${error.message} — Try Google or Apple sign-in below, or use the Clerk backup.`);
        } else {
          setError(error.message);
        }
        return;
      }
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
        return;
      }
      setNotice('Account created. Check your email to confirm, then sign in.');
      setMode('signin');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (clerkAvailable) {
        setError(`${error.message} — Try Google or Apple sign-in below, or use the Clerk backup.`);
      } else {
        setError(error.message);
      }
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <div style={styles.brand}>VENTURE VISION UBUNTU</div>
      <h1 style={styles.title}>
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h1>

      <label style={styles.label}>
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Password
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
      </label>

      {error && <div style={styles.error}>{error}</div>}
      {notice && <div style={styles.notice}>{notice}</div>}

      <button type="submit" disabled={busy} style={styles.submit}>
        {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
          setNotice(null);
        }}
        style={styles.toggle}
      >
        {mode === 'signin'
          ? "Don't have an account? Create one"
          : 'Already have an account? Sign in'}
      </button>

      {clerkAvailable && (
        <>
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with</span>
            <span style={styles.dividerLine} />
          </div>

          <div style={styles.oauthRow}>
            <a
              href={`/clerk/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
              style={styles.oauthBtn}
            >
              {GOOGLE_SVG}
              <span>Google</span>
            </a>
            <a
              href={`/clerk/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
              style={styles.oauthBtn}
            >
              {APPLE_SVG}
              <span>Apple</span>
            </a>
          </div>

          <a
            href={`/clerk/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
            style={styles.backupLink}
          >
            Use Clerk backup sign-in
          </a>
        </>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
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
    gap: 14,
    width: '100%',
    maxWidth: 360,
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
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(230,241,255,0.7)',
  },
  input: {
    background: 'rgba(9,14,20,0.9)',
    border: '1px solid rgba(120,170,255,0.3)',
    borderRadius: 6,
    padding: '10px 12px',
    color: '#e6f1ff',
    fontSize: 14,
    fontFamily: mono,
    outline: 'none',
  },
  submit: {
    marginTop: 4,
    cursor: 'pointer',
    background: 'rgba(120,170,255,0.18)',
    border: '1px solid rgba(120,170,255,0.5)',
    borderRadius: 6,
    padding: '11px 12px',
    color: '#e6f1ff',
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: mono,
  },
  toggle: {
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: 'rgba(120,170,255,0.8)',
    fontSize: 12,
    fontFamily: mono,
    padding: 0,
  },
  error: {
    fontSize: 12,
    color: '#ff9b9b',
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: 6,
    padding: '8px 10px',
  },
  notice: {
    fontSize: 12,
    color: '#9bffcf',
    background: 'rgba(80,255,160,0.08)',
    border: '1px solid rgba(80,255,160,0.3)',
    borderRadius: 6,
    padding: '8px 10px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(120,170,255,0.15)',
  },
  dividerText: {
    fontSize: 11,
    color: 'rgba(230,241,255,0.4)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: mono,
  },
  oauthRow: {
    display: 'flex',
    gap: 10,
  },
  oauthBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'rgba(120,170,255,0.08)',
    border: '1px solid rgba(120,170,255,0.3)',
    borderRadius: 6,
    color: '#e6f1ff',
    fontSize: 13,
    fontFamily: mono,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  backupLink: {
    fontSize: 11,
    color: 'rgba(120,170,255,0.6)',
    textDecoration: 'underline',
    textAlign: 'center',
    fontFamily: mono,
  },
};
