import { type Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "VVU Validation Platform",
  description: "72-hour validation event, evidence portal, and production evidence platform for Venture Vision Ubuntu.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <SiteNav />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
