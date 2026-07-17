import type { Metadata } from "next";
import ClerkProvider from "@/components/ClerkProvider";
import "./styles/variables.css";

export const metadata: Metadata = {
  title: "VVU · Trust Runtime — Venture Vision Ubuntu",
  description:
    "Venture Vision Ubuntu — Trust Runtime Operating System. Deterministic projection of the Bayesian Safety Kernel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className="h-full bg-slate-950">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased text-slate-100 flex selection:bg-cyan-500/30" style={{ margin: 0, padding: 0 }}>
        <ClerkProvider>
          <main className="flex-1 min-w-0 flex flex-col min-h-screen">
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
