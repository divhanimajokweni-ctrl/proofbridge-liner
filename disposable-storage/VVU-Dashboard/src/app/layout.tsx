import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Venture Vision Ubuntu — Trust Runtime",
  description:
    "VVU Production Dashboard. A living verification state space integrating the Epistemic Runtime, ProofBridge, AIR Runtime, Ubuntu Pools, and the HBK. Identity, contribution, receipt, hash, ZK proof, trust.",
  keywords: [
    "Venture Vision Ubuntu", "VVU", "Trust Runtime", "Epistemic Runtime",
    "AIR Kernel", "ProofBridge", "HBK", "Ubuntu Pools", "stokvel",
    "ZK proof", "72-hour resilience",
  ],
  authors: [{ name: "Venture Vision Ubuntu" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
