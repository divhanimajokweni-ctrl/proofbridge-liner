"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles } from "lucide-react";
import {
  getEpistemicStats
} from "@/lib/studi/epistemic-objects";
import { useEffect, useState } from "react";
function ChallengeModeBadge({ variant = "compact", className }) {
  const [stats, setStats] = useState({
    total: 0,
    resolution_rate: 0
  });
  useEffect(() => {
    setStats(getEpistemicStats());
    const onFocus = () => setStats(getEpistemicStats());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  if (variant === "compact") {
    return /* @__PURE__ */ jsxs(
      Badge,
      {
        variant: "outline",
        className: `gap-1.5 border-vvu-studi/40 bg-vvu-studi/5 font-mono text-[10px] uppercase tracking-wider ${className != null ? className : ""}`,
        style: { color: "var(--vvu-studi)" },
        title: "This system challenges assumptions to improve accuracy.",
        children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3 w-3" }),
          "Challenge Mode"
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex items-center gap-2 rounded-md border border-vvu-studi/30 bg-vvu-studi/5 px-2.5 py-1 ${className != null ? className : ""}`,
      children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5", style: { color: "var(--vvu-studi)" } }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "font-mono text-[10px] font-semibold uppercase tracking-wider",
              style: { color: "var(--vvu-studi)" },
              children: "Challenge Mode Active"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "This system challenges assumptions to improve accuracy." })
        ] }),
        stats.total > 0 && /* @__PURE__ */ jsxs(
          Badge,
          {
            variant: "outline",
            className: "ml-2 font-mono text-[9px] uppercase tracking-wider",
            children: [
              stats.total,
              " challenges \xB7 ",
              Math.round(stats.resolution_rate * 100),
              "% resolved"
            ]
          }
        )
      ]
    }
  );
}
export {
  ChallengeModeBadge
};
