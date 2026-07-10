'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { trustRuntimeHtml } from './trustRuntimeLayout';

export default function Home() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SignedOut>
          <SignInButton mode="modal">
            <button
              style={{
                cursor: 'pointer',
                fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#e6f1ff',
                background: 'rgba(9,14,20,0.72)',
                border: '1px solid rgba(120,170,255,0.35)',
                borderRadius: 6,
                padding: '6px 12px',
                backdropFilter: 'blur(6px)',
              }}
            >
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
      <iframe
        title="VVU · Trust Runtime"
        srcDoc={trustRuntimeHtml}
        style={{
          border: 'none',
          display: 'block',
          width: '100%',
          height: '100vh',
        }}
      />
    </div>
  );
}
