"use client";

import dynamic from "next/dynamic";

const VvuShell = dynamic(
  () => import("@/components/vvu/vvu-shell").then((m) => m.VvuShell),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7b7d8c",
        fontFamily: "monospace",
        fontSize: "11px",
        letterSpacing: "0.12em",
      }}>
        VVU · initializing trust runtime…
      </div>
    ),
  },
);

export default function Home() {
  return <VvuShell />;
}
