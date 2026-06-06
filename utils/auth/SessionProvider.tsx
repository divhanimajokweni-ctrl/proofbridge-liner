'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { hasRole } from './roles';

type AuthContext = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isFacilitator: boolean;
};

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isFacilitator: false,
});

function createSafeClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || typeof window === 'undefined') {
    return null;
  }

  try {
    const { createBrowserClient } = require('@supabase/ssr') as {
      createBrowserClient: (url: string, key: string) => SupabaseClient;
    };
    return createBrowserClient(url, key);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFacilitator, setIsFacilitator] = useState(false);

  const supabase = useMemo(() => createSafeClient(), []);

  useEffect(() => {
    const client = supabase as SupabaseClient | null;
    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsFacilitator(hasRole(s?.user ?? null, 'facilitator'));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: string, s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsFacilitator(hasRole(s?.user ?? null, 'facilitator'));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    const client = supabase as SupabaseClient | null;
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut, isFacilitator }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
