import type { Metadata } from 'next';
import { SessionProvider } from '@/lib/auth/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProofBridge Liner — Cryptographic Financial Truth',
  description: 'Safety Kernel for tokenised real-world assets on Polygon Amoy.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
