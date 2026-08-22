"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function VvuLogo({ size = 32, className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 64 64",
      fill: "none",
      className: cn("shrink-0", className),
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vvu-gold-grad", x1: "0", y1: "0", x2: "64", y2: "64", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.82 0.16 80.5)" }),
          /* @__PURE__ */ jsx("stop", { offset: "50%", stopColor: "oklch(0.74 0.18 75)" }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.68 0.15 70)" })
        ] }) }),
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r: "29",
            stroke: "url(#vvu-gold-grad)",
            strokeWidth: "2.5",
            fill: "none"
          }
        ),
        /* @__PURE__ */ jsxs(
          "g",
          {
            stroke: "url(#vvu-gold-grad)",
            strokeWidth: "2.4",
            fill: "none",
            opacity: "0.95",
            children: [
              /* @__PURE__ */ jsx("circle", { cx: "32", cy: "22", r: "9" }),
              /* @__PURE__ */ jsx("circle", { cx: "23", cy: "38", r: "9" }),
              /* @__PURE__ */ jsx("circle", { cx: "41", cy: "38", r: "9" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M 24 28 L 32 44 L 40 28",
            stroke: "oklch(0.985 0 0)",
            strokeWidth: "2.4",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "none"
          }
        )
      ]
    }
  );
}
export {
  VvuLogo
};
