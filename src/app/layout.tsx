/**
 * File: src/app/layout.tsx
 * Description: Root layout with scrolling disabled as requested.
 */
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'VVU · Ubuntu Pools',
  description: 'Flagship Ubuntu Pools engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
