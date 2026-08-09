"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FilePlus2, Loader2 } from "lucide-react";

interface UserStateResponse {
  hasData: boolean;
  artifactCount: number;
}

/**
 * UserStateGate deliberately does NOT replace the production IVE.
 * It renders the existing IVE underneath and adds only the authenticated
 * user's empty-state prompt until the user creates their first artifact.
 */
export function UserStateGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserStateResponse | null>(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadState() {
    try {
      const response = await fetch("/api/ive/user-state", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load workspace state");
      const data = (await response.json()) as UserStateResponse;
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace state");
    }
  }

  useEffect(() => {
    void loadState();
  }, []);

  async function createFirstArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ive/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setState({ hasData: true, artifactCount: 1 });
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create artifact");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative h-screen">
      {children}

      {state && !state.hasData && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[1px]">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-xl border border-[var(--ive-gold)]/25 bg-[#0f0f18]/95 shadow-2xl"
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-[var(--ive-gold)] to-transparent" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--ive-gold)]/30 bg-[var(--ive-gold)]/10">
                  <FilePlus2 className="h-5 w-5 text-[var(--ive-gold)]" />
                </div>
                <div>
                  <div className="ive-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ive-gold)]">
                    User workspace
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">Nothing here yet</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    This is the production IVE. Your account has no workspace artifacts yet. Create the first one to initialize your workspace state.
                  </p>
                </div>
              </div>

              <form onSubmit={createFirstArtifact} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Name your first artifact"
                  maxLength={160}
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-[var(--ive-gold)]/50"
                  aria-label="First artifact name"
                />
                <button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--ive-gold)]/40 bg-[var(--ive-gold)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--ive-gold)] transition-colors hover:bg-[var(--ive-gold)]/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Create first artifact
                </button>
              </form>

              {error && (
                <p className="mt-3 text-xs text-[var(--ive-blocked)]" role="alert">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
