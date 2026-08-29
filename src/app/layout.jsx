import { jsx, jsxs } from "react/jsx-runtime";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});
const metadata = {
  title: "VVU \u2014 IVE / STUDI",
  description: "VVU dual workspace \u2014 Integrated Verification Environment (IVE) for industrial engineering verification, and STUDI for corporate governance & academic instruction. Backed by the Evidence Independence Specification (EIS).",
  keywords: [
    "VVU",
    "IVE",
    "STUDI",
    "EIS",
    "Evidence Independence Specification",
    "verification",
    "governance",
    "authorization",
    "participation ratio",
    "heat kernel",
    "circuit breaker",
    "webhook",
    "fail-closed"
  ],
  authors: [{ name: "VVU \u2014 Venture Vision Ubuntu" }],
  icons: {
    icon: "/logo.svg"
  },
  openGraph: {
    title: "VVU \u2014 IVE / STUDI",
    description: "Dual workspace: industrial verification + corporate governance. Fail-closed by EIS Theorem 5.",
    siteName: "VVU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "VVU \u2014 IVE / STUDI",
    description: "Industrial verification + corporate governance, fail-closed."
  }
};
function RootLayout({
  children
}) {
  return /* @__PURE__ */ jsx("html", { lang: "en", className: "dark", suppressHydrationWarning: true, children: /* @__PURE__ */ jsxs(
    "body",
    {
      className: `${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`,
      children: [
        children,
        /* @__PURE__ */ jsx(Toaster, {})
      ]
    }
  ) });
}
export {
  RootLayout as default,
  metadata
};
