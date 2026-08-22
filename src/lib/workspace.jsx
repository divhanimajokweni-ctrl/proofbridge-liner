"use client";
import { jsx } from "react/jsx-runtime";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
const WORKSPACES = {
  studi: {
    id: "studi",
    name: "STUDI",
    full: "VVU \u2014 STUDI",
    tagline: "Corporate Governance & Academic Instruction",
    accentVar: "--vvu-studi",
    domains: ["governance", "academic", "compliance", "instruction"]
  },
  ive: {
    id: "ive",
    name: "IVE",
    full: "VVU \u2014 IVE",
    tagline: "Integrated Verification Environment",
    accentVar: "--vvu-ive",
    domains: ["engineering", "verification", "release", "trust"]
  }
};
const WORKSPACE_ORDER = ["studi", "ive"];
const WorkspaceContext = createContext(null);
const STORAGE_KEY = "vvu:workspace";
function WorkspaceProvider({ children }) {
  const [workspace, setWorkspaceState] = useState("ive");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "studi" || stored === "ive") {
        setWorkspaceState(stored);
      }
    } catch (e) {
    }
  }, []);
  const setWorkspace = useCallback((id) => {
    setWorkspaceState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
    }
  }, []);
  const toggle = useCallback(() => {
    setWorkspaceState((cur) => {
      const next = cur === "studi" ? "ive" : "studi";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
      }
      return next;
    });
  }, []);
  const value = useMemo(
    () => ({
      workspace,
      meta: WORKSPACES[workspace],
      setWorkspace,
      toggle
    }),
    [workspace, setWorkspace, toggle]
  );
  return /* @__PURE__ */ jsx(WorkspaceContext.Provider, { value, children });
}
function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  }
  return ctx;
}
export {
  WORKSPACES,
  WORKSPACE_ORDER,
  WorkspaceProvider,
  useWorkspace
};
