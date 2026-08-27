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
  title: "VVU AIR KERNEL — Evidence Analysis Workspace",
  description: "Evidence Independence Scoring (EIS v1.0) for water infrastructure validation. NMBM-DMA-07 hydraulic incident replay with audit-grade provenance.",
  keywords: ["VVU", "EIS v1.0", "NMBM", "DWS", "water infrastructure", "evidence verification", "SCADA", "leakage validation"],
  authors: [{ name: "Venture Vision Ubuntu (VVU)" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "VVU AIR KERNEL — Evidence Analysis Workspace",
    description: "EIS v1.0 evidence independence scoring for NMBM water infrastructure validation",
    url: "https://chat.z.ai",
    siteName: "VVU IVE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VVU AIR KERNEL",
    description: "EIS v1.0 evidence independence scoring for NMBM water infrastructure validation",
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
        <Toaster />
      </body>
    </html>
  );
}
