'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/session/clerk-config';

export default function ClerkProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) return <>{children}</>;

  return (
    <BaseClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: '#78aaff',
          colorBackground: '#0b0f14',
          borderRadius: '6px',
          fontFamily: 'IBM Plex Mono, monospace',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
