import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Epistemic Runtime — Invariant-Enforced DAG Control Plane",
  description:
    "Verifiable, real-time shared-reality engine: a Policy DSL (.epd), invariant-aware sharded CRDTs, self-repairing merges, MMR ancestry proofs, and a Shadow Bridge for cyber-physical systems.",
  keywords: [
    "epistemic runtime",
    "CRDT",
    "DAG",
    "invariants",
    "shadow bridge",
    "policy DSL",
    "distributed systems",
    "cyber-physical",
  ],
  authors: [{ name: "Epistemic Runtime" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
