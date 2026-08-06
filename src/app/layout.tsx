import type { Metadata, Viewport } from "next";
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
  title: "VVU IVE — Integrated Verification Environment",
  description:
    "Engineer systems that can prove themselves. The VVU Integrated Verification Environment (IVE) combines procedural CAD, AI-assisted specification, bounded formal verification, and cryptographically traceable evidence. HBK MK-II Hydro-Gateway is the demonstration case study.",
  keywords: [
    "VVU",
    "Integrated Verification Environment",
    "IVE",
    "HBK MK-II",
    "Hydro-Gateway",
    "formal verification",
    "Zoo Engine",
    "ROCm",
    "engineering evidence",
  ],
  authors: [{ name: "VVU IVE Team" }],
  icons: {
    icon: "/ive-favicon.svg",
  },
  openGraph: {
    title: "VVU IVE — Integrated Verification Environment",
    description:
      "Engineer systems that can prove themselves. Bounded formal verification with cryptographically traceable evidence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VVU IVE — Integrated Verification Environment",
    description:
      "Engineer systems that can prove themselves.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
