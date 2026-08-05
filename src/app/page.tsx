"use client";

import dynamic from "next/dynamic";

/**
 * IVE root route.
 *
 * The VVU Integrated Verification Environment launches as a cinematic
 * engineering operating system: a boot sequence first, then the IVE
 * workspace. The shell is loaded dynamically (ssr:false) because the boot
 * animation and the canvas-based Trust Sphere are inherently client-side.
 */
const IveRoot = dynamic(
  () => import("@/components/ive/IveRoot").then((m) => m.IveRoot),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "#7b7d8c",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "11px",
          letterSpacing: "0.18em",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="36" cy="40" r="15" stroke="#8A9A5B" strokeWidth="4" />
          <circle cx="64" cy="40" r="15" stroke="#CC7722" strokeWidth="4" />
          <circle cx="50" cy="64" r="15" stroke="#E2E3DB" strokeWidth="4" />
        </svg>
        <div>IVE · initializing trust runtime…</div>
      </div>
    ),
  },
);

export default function Home() {
  return <IveRoot />;
}
