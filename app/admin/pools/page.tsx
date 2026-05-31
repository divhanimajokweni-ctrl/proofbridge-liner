'use client';

import { useAuth } from '@/utils/auth/SessionProvider';
import Nav from '@/components/Nav';

export default function AdminPoolsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 40, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#FF3D3D' }}>
        Unauthorized. <a href="/auth" style={{ color: '#E8A020' }}>Sign in →</a>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#E8A020', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
          Admin · Pool Management
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Pool Dashboard
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 40 }}>
          Signed in as {user.email}
        </p>
        <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.14)', padding: 24, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>
          <div style={{ color: '#00C853', marginBottom: 16 }}>// Gate A session active</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 2 }}>
            auth.uid(): <span style={{ color: 'rgba(255,255,255,0.88)' }}>{user.id}</span><br />
            email: <span style={{ color: 'rgba(255,255,255,0.88)' }}>{user.email}</span><br />
            role: <span style={{ color: '#E8A020' }}>{user.user_metadata?.role ?? 'member'}</span>
          </div>
        </div>
      </main>
    </>
  );
}
