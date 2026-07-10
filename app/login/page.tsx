'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/auth/client';

const mono = 'IBM Plex Mono, ui-monospace, monospace';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      setBusy(false);
      if (error) {
        setError(error.message);
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
      setError(error.message);
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
};
