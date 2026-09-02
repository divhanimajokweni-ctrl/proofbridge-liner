import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import WorkspaceToggle from "@/components/WorkspaceToggle";

export const metadata: Metadata = {
  title: "Venture Vision Ubuntu — We Serve Trust",
  description: "VVU Trust Runtime · Verification State Space · Evidence-Validation Platform",
  keywords: ["VVU", "Venture Vision Ubuntu", "Trust", "SEARM1", "EIS v1.0", "Infrastructure Intelligence"],
  authors: [{ name: "Venture Vision Ubuntu (VVU)" }],
  icons: {
    icon: "/brand/vvu-three-rings.svg",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#060a10',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ background: '#060a10' }}>
        {children}
        <WorkspaceToggle />
        <Toaster />
      </body>
    </html>
  );
}
