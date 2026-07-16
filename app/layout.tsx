import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./styles/variables.css";
import "./globals.css";
import "./air.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VVU AIR — Architecture Intelligence Runtime",
  description:
    "VVU Architecture Intelligence Runtime — Deterministic terminal interface for the Bayesian Safety Kernel and Trust Runtime.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`h-full bg-slate-950 ${jetbrainsMono.variable}`}>
      <body
        className="h-full antialiased text-slate-100 flex selection:bg-cyan-500/30"
        style={{ margin: 0, padding: 0 }}
      >
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
