"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useWorkspace } from "@/lib/workspace";
import { VvuLogo } from "./logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarNav } from "./sidebar-nav";
import { Activity, Bell, Search } from "lucide-react";
function AppShell({
  activeSection,
  onSectionChange,
  pageTitle,
  pageAbbr,
  breadcrumb,
  children,
  statusStrip
}) {
  const { meta, workspace } = useWorkspace();
  const accentColor = workspace === "studi" ? "var(--vvu-studi)" : "var(--vvu-ive)";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50", children: /* @__PURE__ */ jsxs("div", { className: "flex h-14 items-center gap-4 px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsx(VvuLogo, { size: 32 }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col leading-none", children: /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold tracking-tight", children: "VVU" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded px-1 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
              style: {
                backgroundColor: `var(${meta.accentVar})`,
                color: "oklch(0.145 0 0)"
              },
              children: meta.name
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground font-mono", children: [
            "\xB7 ",
            meta.tagline
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-2 rounded-md border border-border bg-background/50 px-2 py-1 text-xs md:flex", children: [
          /* @__PURE__ */ jsx(Search, { className: "h-3 w-3 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search",
              className: "w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60",
              "aria-label": "Search"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 md:inline-flex",
            children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400", style: { boxShadow: "0 0 6px 0 currentColor" } }),
              "LIVE"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "relative rounded-md border border-border bg-background/50 p-1.5 text-muted-foreground hover:text-foreground",
            "aria-label": "Notifications",
            children: [
              /* @__PURE__ */ jsx(Bell, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-background", children: "3" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(WorkspaceSwitcher, {})
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx("aside", { className: "hidden w-56 shrink-0 border-r border-border bg-sidebar/60 md:block", children: /* @__PURE__ */ jsx("div", { className: "max-h-[calc(100vh-3.5rem-2rem)] overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsx(
        SidebarNav,
        {
          activeSection,
          onSectionChange
        }
      ) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-4 py-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "rounded px-1 py-0.5 font-bold tracking-wider",
                style: {
                  backgroundColor: `color-mix(in oklab, ${accentColor} 22%, transparent)`,
                  color: accentColor
                },
                children: meta.name
              }
            ),
            breadcrumb.map((seg, i) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "/" }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: i === breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground",
                  children: seg
                }
              )
            ] }, i))
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-md border border-border bg-background/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: pageAbbr }),
            statusStrip
          ] })
        ] }),
        /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-[1400px] px-4 py-4", children }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-border bg-card/50", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[10px] font-mono text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Activity, { className: "h-2.5 w-2.5 text-emerald-400" }),
        meta.full
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\xB7" }),
      /* @__PURE__ */ jsx("span", { children: "EIS Theorem 5: fail-closed" }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\xB7" }),
      /* @__PURE__ */ jsx("span", { children: "Reliability Contract v1.1 \xB7 locked Aug 18" }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\xB7" }),
      /* @__PURE__ */ jsx("span", { children: "Launch: Sept 15" }),
      /* @__PURE__ */ jsxs("span", { className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { children: "BOOTSTRAP: OK" }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "\xB7" }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "rounded px-1.5 py-0.5 font-bold tracking-wider",
            style: {
              backgroundColor: `color-mix(in oklab, ${accentColor} 22%, transparent)`,
              color: accentColor
            },
            children: meta.name
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AppShell
};
