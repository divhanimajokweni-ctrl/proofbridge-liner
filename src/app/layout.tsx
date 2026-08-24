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
  title: "IVE v2.0 · HBK Mk-II — Immersive Virtual Environment",
  description:
    "Immersive Virtual Environment (IVE) usage model with the Hydro-Bayesian Kernel Mk-II upgrade. Facilitator agents, agnostic CAD/GIS integration, model-driven V-design, AIR runtime, zipenc cryptographic pipeline, and traceable governance artifacts.",
  keywords: [
    "IVE",
    "HBK Mk-II",
    "Hydro-Bayesian Kernel",
    "Facilitator Agent",
    "AIR Runtime",
    "BIM",
    "CAD",
    "GIS",
    "V-Model",
    "OmniClass",
    "zipenc",
    "CDE",
    "Zero-Trust",
  ],
  authors: [{ name: "Venture Vision Ubuntu" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "IVE v2.0 · HBK Mk-II",
    description: "Immersive Virtual Environment — Hydro-Bayesian Kernel Mk-II upgrade.",
    siteName: "IVE Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IVE v2.0 · HBK Mk-II",
    description: "Immersive Virtual Environment — Hydro-Bayesian Kernel Mk-II upgrade.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
