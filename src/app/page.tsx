"use client";

import dynamic from "next/dynamic";

const WorkbenchShell = dynamic(
  () => import("@/components/vvu/workbench-shell").then((m) => m.WorkbenchShell),
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
        VVU · initializing trust operating environment…
      </div>
    ),
  },
);

export default function Home() {
  return <WorkbenchShell />;
}
