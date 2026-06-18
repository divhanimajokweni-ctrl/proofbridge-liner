import type { Metadata } from "next";
import Disclaimer from "./components/Disclaimer";

export const metadata: Metadata = {
  title: "VVU Gateway · Venture Vision Ubuntu",
  description: "Cryptographic Attestation & Sovereign ROSCA Infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#1E1E1C", color: "#FFFFFF", WebkitFontSmoothing: "antialiased" }}>
        {children}
        <Disclaimer />
      </body>
    </html>
  );
}
