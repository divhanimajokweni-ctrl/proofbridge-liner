/**
 * File: src/app/layout.tsx
 * Description: Root layout.
 */
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'ProofBridge · Compliance OS',
  description: 'Production-grade deterministic runtime.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="p-4 border-b bg-white flex justify-between items-center">
          <h1 className="font-bold text-lg">ProofBridge Compliance OS</h1>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            PRODUCTION READY
          </span>
        </nav>
        {children}
      </body>
    </html>
  );
}
