'use client';

import { useAuth } from '@/lib/auth/SessionProvider';

export default function Nav() {
  const { user, signOut, loading } = useAuth();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 90,
      background: 'rgba(8,8,8,0.94)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)', height: 56,
      display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between',
    }}>
      <a href="/" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 500, color: '#E8A020', textDecoration: 'none' }}>
        ProofBridge Liner
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loading ? null : user ? (
          <>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#00C853' }}>
              {user.email}
            </span>
            <button onClick={signOut} style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.14)', padding: '6px 12px', cursor: 'pointer',
            }}>
              Sign out
            </button>
          </>
        ) : (
          <a href="/auth" style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
            color: '#E8A020', background: 'transparent',
            border: '1px solid #E8A020', padding: '6px 12px', textDecoration: 'none',
          }}>
            Sign in →
          </a>
        )}
      </div>
    </nav>
  );
}
