"use client";

import { useEffect } from "react";

interface KeyboardShortcutOptions {
  onNewClaim?: () => void;
  onRefresh?: () => void;
  onSeed?: () => void;
  onIngest?: () => void;
  onAuthorize?: () => void;
  onNavigateHome?: () => void;
  onNavigateDocs?: () => void;
  onNavigateIve?: () => void;
  onNavigateRoles?: () => void;
  onNavigatePilot?: () => void;
  enabled?: boolean;
}

/**
 * Hook for IVE keyboard shortcuts.
 * Shortcuts:
 *   n     — New claim
 *   r     — Refresh
 *   s     — Seed demo data
 *   i     — Ingest evidence
 *   a     — Authorize
 *   1     — Navigate to Home (landing)
 *   2     — Navigate to Docs
 *   3     — Navigate to IVE
 *   4     — Navigate to Roles
 *   5     — Navigate to Pilot
 *   Alt+R — Navigate to Roles (Alt-modified, won't conflict with refresh)
 *   Alt+P — Navigate to Pilot
 *   ?     — Show shortcuts help (handled in component)
 *   Esc   — Close modals (default browser behavior)
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  const {
    onNewClaim,
    onRefresh,
    onSeed,
    onIngest,
    onAuthorize,
    onNavigateHome,
    onNavigateDocs,
    onNavigateIve,
    onNavigateRoles,
    onNavigatePilot,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.getAttribute("role") === "combobox" ||
        target.getAttribute("role") === "textbox"
      ) {
        return;
      }

      // Alt+R — Navigate to Roles (handled before the generic modifier skip
      // so the Alt modifier is allowed for this specific shortcut)
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          onNavigateRoles?.();
        }
        if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          onNavigatePilot?.();
        }
        return;
      }

      // Skip if modifier keys are pressed (except Shift for some)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case "n":
          e.preventDefault();
          onNewClaim?.();
          break;
        case "r":
          e.preventDefault();
          onRefresh?.();
          break;
        case "s":
          e.preventDefault();
          onSeed?.();
          break;
        case "i":
          e.preventDefault();
          onIngest?.();
          break;
        case "a":
          e.preventDefault();
          onAuthorize?.();
          break;
        case "1":
          e.preventDefault();
          onNavigateHome?.();
          break;
        case "2":
          e.preventDefault();
          onNavigateDocs?.();
          break;
        case "3":
          e.preventDefault();
          onNavigateIve?.();
          break;
        case "4":
          e.preventDefault();
          onNavigateRoles?.();
          break;
        case "5":
          e.preventDefault();
          onNavigatePilot?.();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    onNewClaim,
    onRefresh,
    onSeed,
    onIngest,
    onAuthorize,
    onNavigateHome,
    onNavigateDocs,
    onNavigateIve,
    onNavigateRoles,
    onNavigatePilot,
    enabled,
  ]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: "n", label: "New claim", group: "IVE" },
  { key: "r", label: "Refresh data", group: "IVE" },
  { key: "s", label: "Seed demo", group: "IVE" },
  { key: "i", label: "Ingest evidence", group: "IVE" },
  { key: "a", label: "Authorize", group: "IVE" },
  { key: "1", label: "Home", group: "Nav" },
  { key: "2", label: "Docs", group: "Nav" },
  { key: "3", label: "IVE", group: "Nav" },
  { key: "4", label: "Roles", group: "Nav" },
  { key: "5", label: "Pilot", group: "Nav" },
  { key: "Alt+R", label: "Roles", group: "Nav" },
  { key: "Alt+P", label: "Go to Pilot", group: "Nav" },
] as const;
