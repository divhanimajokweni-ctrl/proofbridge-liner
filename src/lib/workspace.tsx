"use client";

/**
 * Workspace context — toggles between VVU STUDI and VVU IVE.
 * Persisted in localStorage so refresh keeps the user's last workspace.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type WorkspaceId = "studi" | "ive";

export interface WorkspaceMeta {
  id: WorkspaceId;
  name: string;          // short name — used in switcher
  full: string;          // long name — used in header
  tagline: string;       // one-liner description
  accentVar: string;     // CSS var for accent color (without --)
  domains: string[];     // e.g. ["governance", "academic", "compliance"]
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceMeta> = {
  studi: {
    id: "studi",
    name: "STUDI",
    full: "VVU — STUDI",
    tagline: "Corporate Governance & Academic Instruction",
    accentVar: "--vvu-studi",
    domains: ["governance", "academic", "compliance", "instruction"],
  },
  ive: {
    id: "ive",
    name: "IVE",
    full: "VVU — IVE",
    tagline: "Integrated Verification Environment",
    accentVar: "--vvu-ive",
    domains: ["engineering", "verification", "release", "trust"],
  },
};

export const WORKSPACE_ORDER: WorkspaceId[] = ["studi", "ive"];

interface WorkspaceContextValue {
  workspace: WorkspaceId;
  meta: WorkspaceMeta;
  setWorkspace: (id: WorkspaceId) => void;
  toggle: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "vvu:workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspaceState] = useState<WorkspaceId>("ive");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "studi" || stored === "ive") {
        setWorkspaceState(stored);
      }
    } catch {
      // ignore — localStorage unavailable (SSR / privacy mode)
    }
  }, []);

  const setWorkspace = useCallback((id: WorkspaceId) => {
    setWorkspaceState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setWorkspaceState((cur) => {
      const next = cur === "studi" ? "ive" : "studi";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      meta: WORKSPACES[workspace],
      setWorkspace,
      toggle,
    }),
    [workspace, setWorkspace, toggle]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  }
  return ctx;
}
