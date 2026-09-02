import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import WorkspaceToggle from "@/components/WorkspaceToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProofBridge · VVU HBK Mk-II Validation Dashboard",
  description:
    "Venture Vision Ubuntu — sovereign, offline-first verification for mining & municipal water infrastructure. Borromean-ringed, B-BBEE Level 1, SANS 1200 compliant.",
  keywords: [
    "VVU",
    "ProofBridge",
    "Hydro-Gateway",
    "Borromean",
    "Gqeberha",
    "SANS 1200",
    "POPIA",
    "B-BBEE Level 1",
    "Zero-Fictional Engineering",
  ],
  authors: [{ name: "Vaguely Vanity LLC (Pty) Ltd", url: "mailto:dvh@venturevisionubuntu.co.za" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='32' r='22' fill='none' stroke='%23C46D1A' stroke-width='6'/%3E%3Ccircle cx='34' cy='60' r='22' fill='none' stroke='%236B8A40' stroke-width='6'/%3E%3Ccircle cx='66' cy='60' r='22' fill='none' stroke='%23F3E38A' stroke-width='6'/%3E%3Ccircle cx='50' cy='50' r='6' fill='%23FFFAC2'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "ProofBridge · VVU HBK Mk-II Validation Dashboard",
    description:
      "Sovereign, offline-first verification · Borromean rings · B-BBEE Level 1 · 135% recognition",
    siteName: "ProofBridge · VVU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ProofBridge · VVU Validation Dashboard",
    description: "Sovereign, offline-first verification · Borromean rings · B-BBEE Level 1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <WorkspaceToggle />
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 20, 16, 0.95)',
              border: '1px solid rgba(107, 138, 64, 0.3)',
              color: '#C9D4BD',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.72rem',
            },
          }}
        />
      </body>
    </html>
  );
}
