import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { DualAuthProvider } from "@/components/auth/dual-auth-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VVU — Structural Evidence Accounting & Redundancy Management",
  description: "Venture Vision Ubuntu (VVU) delivers mathematically rigorous structural evidence accounting for enterprise security.",
  keywords: ["VVU", "SEARM", "Evidence Accounting", "Spectral Diversification", "Fail-Closed Authorization", "Enterprise Security"],
  authors: [{ name: "VVU" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DualAuthProvider>{children}</DualAuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
