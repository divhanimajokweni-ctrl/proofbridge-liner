import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Venture Vision Ubuntu — Trusted Digital Infrastructure for South Africa",
  description: "Building trusted digital infrastructure for South African communities through deterministic engineering, cryptographic provenance, and the Ubuntu philosophy.",
  icons: { icon: "/vvu-logo.svg", apple: "/vvu-logo-github.png" },
  openGraph: {
    title: "Venture Vision Ubuntu",
    description: "Trusted Digital Infrastructure for South Africa",
    siteName: "Venture Vision Ubuntu",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#059669",
          colorBackground: "#0a0a0f",
          colorInputBackground: "#141420",
          colorInputText: "#e2e3db",
          colorText: "#e2e3db",
          colorTextSecondary: "#7b7d8c",
          colorNeutral: "#1a1a2e",
        },
        elements: {
          formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
          card: "bg-[#0f0f18] border-white/10",
          socialButtonsBlockButton: "border-white/10 bg-white/5 hover:bg-white/10 text-foreground",
          formFieldLabel: "text-foreground",
          formFieldInput: "bg-[#141420] border-white/10 text-foreground",
          dividerLine: "bg-white/10",
          dividerText: "text-muted-foreground",
          footerActionLink: "text-emerald-400 hover:text-emerald-300",
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
