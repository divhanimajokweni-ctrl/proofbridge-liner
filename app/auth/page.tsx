'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type State = 'idle' | 'loading' | 'sent' | 'error';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Enter a valid email address.');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setState('error');
      return;
    }

    setState('sent');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'IBM Plex Mono', monospace", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, color: '#00C896', letterSpacing: '0.25em', marginBottom: 10 }}>
            PROOFBRIDGE LINER · GATE A
          </div>
          <h1 style={{ fontSize: 22, color: '#F0F0E8', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Sign In
          </h1>
          <p style={{ fontSize: 11, color: '#555', marginTop: 8, lineHeight: 1.7 }}>
            Enter your email. We&apos;ll send a secure sign-in link — no password needed.
          </p>
        </div>

        {state === 'sent' ? (
          <div style={{ padding: 24, background: '#081410', border: '1px solid #00C89640', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 13, color: '#00C896', fontWeight: 700, marginBottom: 8 }}>Link Sent</div>
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.7 }}>
              Check <strong style={{ color: '#999' }}>{email}</strong> for your sign-in link. It expires in 1 hour.
            </div>
            <button onClick={() => { setState('idle'); setEmail(''); }}
              style={{ marginTop: 20, fontSize: 9, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>
              Use a different email →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 9, color: '#555', letterSpacing: '0.2em', marginBottom: 8 }}>
                EMAIL ADDRESS
              </label>
              <input id="email" type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
                placeholder="you@example.com" disabled={state === 'loading'} autoFocus
                style={{ width: '100%', padding: '12px 14px', background: '#111113',
                  border: `1px solid ${state === 'error' ? '#FF4D0060' : '#1E1E22'}`, borderRadius: 3,
                  color: '#E8E8E0', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
              {state === 'error' && (
                <div style={{ fontSize: 10, color: '#FF4D00', marginTop: 6 }}>{errorMsg}</div>
              )}
            </div>
            <button type="submit" disabled={state === 'loading' || !email}
              style={{ padding: '13px', background: state === 'loading' ? '#1A1A1E' : '#00C896',
                color: state === 'loading' ? '#444' : '#000', border: 'none', borderRadius: 3,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
                cursor: state === 'loading' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {state === 'loading' ? 'SENDING...' : 'SEND SIGN-IN LINK →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
