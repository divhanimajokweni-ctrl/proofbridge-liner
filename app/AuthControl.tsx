'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/session/client';

const mono = 'IBM Plex Mono, ui-monospace, monospace';

const pill: React.CSSProperties = {
  cursor: 'pointer',
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#e6f1ff',
  background: 'rgba(9,14,20,0.72)',
  border: '1px solid rgba(120,170,255,0.35)',
  borderRadius: 6,
  padding: '6px 12px',
  backdropFilter: 'blur(6px)',
  textDecoration: 'none',
};

export default function AuthControl() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setReady(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (!email) {
    return (
      <Link href="/login" style={pill}>
        Sign in
      </Link>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ ...pill, cursor: 'default', textTransform: 'none' }}>
        {email}
      </span>
      <form action="/session/signout" method="post" style={{ margin: 0 }}>
        <button type="submit" style={pill}>
          Sign out
        </button>
      </form>
    </div>
  );
}
