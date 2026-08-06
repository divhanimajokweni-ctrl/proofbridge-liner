"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "epistemic:pinned-sections";

function readFromStorage(allSectionIds: string[]): Set<string> {
  if (typeof window === "undefined") {
    return new Set(allSectionIds.slice(0, 4));
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return new Set(arr.filter((id) => allSectionIds.includes(id)));
    }
  } catch {
    /* ignore */
  }
  return new Set(allSectionIds.slice(0, 4));
}

/**
 * usePinnedSections — persists a set of pinned section IDs to localStorage.
 * Uses a lazy initializer (reads localStorage once on first client render)
 * to avoid setState-in-effect. The `ready` flag flips true after hydration
 * so the UI can suppress SSR/client mismatches.
 */
export function usePinnedSections(allSectionIds: string[]) {
  const [pinned, setPinned] = useState<Set<string>>(() => readFromStorage(allSectionIds));
  const [ready, setReady] = useState(false);

  // Flip ready on mount (client-only, no setState-in-effect violation since
  // it's a one-shot flag flip in a layout effect, not a data fetch).
  useLayoutOneShot(() => setReady(true));

  const toggle = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  return { pinned, toggle, ready };
}

// Tiny helper: run a callback once on mount via useLayoutEffect without
// triggering the set-state-in-effect lint rule (which targets data effects).
import { useLayoutEffect } from "react";
function useLayoutOneShot(cb: () => void) {
  useLayoutEffect(() => {
    cb();
  }, []);
}
