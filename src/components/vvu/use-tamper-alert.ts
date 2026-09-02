'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Active tamper alert — polls /api/vvu/ledger periodically and fires a toast
// if any ledger entry is flagged `tampered: true`. Also fires once on mount
// to confirm the ledger is clean. Returns a `triggerCheck` function so the
// tamper-test button can force an immediate re-fetch (no 30s wait).

const POLL_INTERVAL_MS = 30000; // 30s

interface LedgerEntry {
  fileId: string;
  filename: string;
  sha256: string;
  tampered: boolean;
}

export function useTamperAlert() {
  const prevTamperedRef = useRef<Set<string>>(new Set());
  const [trigger, setTrigger] = useState(0);

  const triggerCheck = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/vvu/ledger', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { entries?: LedgerEntry[] };
        const entries = data.entries ?? [];
        const tampered = entries.filter((e) => e.tampered);

        if (tampered.length > 0) {
          const newTampered = tampered.filter((e) => !prevTamperedRef.current.has(e.fileId));
          if (newTampered.length > 0) {
            for (const e of newTampered) {
              toast.error(`Tamper detected · ${e.fileId} ${e.filename}`, {
                description: `SHA-256 hash drift — WORM ledger entry no longer matches the manifest`,
                duration: 8000,
              });
            }
          }
          prevTamperedRef.current = new Set(tampered.map((e) => e.fileId));
        } else {
          prevTamperedRef.current = new Set();
        }
      } catch {
        /* network errors are non-fatal for tamper checks */
      }
    };

    const kick = setTimeout(check, 2000); // first check after boot settles
    const interval = setInterval(check, POLL_INTERVAL_MS);
    // When triggerCheck is called, re-fetch after a short delay (lets the
    // tamper-test API write complete first).
    if (trigger > 0) {
      const manual = setTimeout(check, 500);
      return () => {
        clearTimeout(kick);
        clearInterval(interval);
        clearTimeout(manual);
      };
    }
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, [trigger]);

  return { triggerCheck };
}
