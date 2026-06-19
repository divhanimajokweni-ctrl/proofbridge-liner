import React from 'react';
import './globals.css';

export const metadata = {
  title: 'VVU · Ubuntu Pools — Collective Prosperity, Cryptographically Secured',
  description: 'Flagship Ubuntu Pools engine. ROSCA-powered community savings with ProofBridge on-chain receipts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-ZA">
      <body>
        {children}
      </body>
    </html>
  );
}
