"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, GraduationCap, HardHat } from "lucide-react";
import { WORKSPACE_ORDER, WORKSPACES, useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace();
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "tablist",
      "aria-label": "VVU workspace",
      className: "inline-flex items-center rounded-md border border-border bg-card/60 p-0.5 text-xs font-mono",
      children: WORKSPACE_ORDER.map((id) => {
        const meta = WORKSPACES[id];
        const active = workspace === id;
        const Icon = id === "studi" ? GraduationCap : HardHat;
        const accent = id === "studi" ? "var(--vvu-studi)" : "var(--vvu-ive)";
        return /* @__PURE__ */ jsxs(
          "button",
          {
            role: "tab",
            "aria-selected": active,
            onClick: () => setWorkspace(id),
            className: cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            ),
            style: active ? {
              color: "oklch(0.145 0 0)",
              backgroundColor: `var(${meta.accentVar})`
            } : void 0,
            title: `Switch to ${meta.full}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5", style: { color: active ? "oklch(0.145 0 0)" : accent } }),
              /* @__PURE__ */ jsx("span", { className: "tracking-wider font-bold", children: meta.name }),
              active && /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 opacity-80" })
            ]
          },
          id
        );
      })
    }
  );
}
export {
  WorkspaceSwitcher
};
