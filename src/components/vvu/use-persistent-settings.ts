'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, VvuSettings } from './settings-dialog';

const STORAGE_KEY = 'vvu-dashboard-settings';

// Persist the dashboard settings to localStorage so they survive page reloads.
// Falls back to DEFAULT_SETTINGS if localStorage is unavailable or the stored
// value is corrupt. Merges stored settings over defaults so new fields added
// in future rounds get their default value automatically.

function loadSettings(): VvuSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<VvuSettings>;
    // Merge over defaults so missing fields get sensible values.
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function usePersistentSettings() {
  const [settings, setSettings] = useState<VvuSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client-only).
  // Deferred via setTimeout(0) to avoid calling setState synchronously
  // inside the effect body (react-hooks/set-state-in-effect rule).
  useEffect(() => {
    const kick = setTimeout(() => {
      setSettings(loadSettings());
      setHydrated(true);
    }, 0);
    return () => clearTimeout(kick);
  }, []);

  // Persist to localStorage whenever settings change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [settings, hydrated]);

  return { settings, setSettings, hydrated };
}
