"use client";

import { Component, type ReactNode } from "react";

/**
 * ChunkLoadErrorBoundary
 * ----------------------
 * Catches chunk-loading failures (common in Turbopack dev mode under memory
 * pressure) and retries by reloading the page once. Without this boundary,
 * a failed dynamic import leaves a blank "Application error" screen.
 *
 * The boundary distinguishes chunk-load errors from other runtime errors:
 * only ChunkLoadError / "Failed to load chunk" / "Loading chunk" messages
 * trigger the reload; genuine errors propagate normally.
 */

interface State {
  retrying: boolean;
}

export class ChunkLoadErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { retrying: false };

  static getDerivedStateFromError(error: Error): State {
    const msg = String(error?.message ?? error ?? "");
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      msg.includes("Failed to load chunk") ||
      msg.includes("Loading chunk") ||
      msg.includes("Loading CSS chunk");
    if (isChunkError) {
      return { retrying: true };
    }
    // Re-throw non-chunk errors so they propagate to the real error UI.
    throw error;
  }

  componentDidCatch(error: Error) {
    const msg = String(error?.message ?? error ?? "");
    if (this.state.retrying) {
      // Schedule a single reload after a short delay.
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 600);
    }
  }

  render() {
    if (this.state.retrying) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            color: "#7b7d8c",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "11px",
            letterSpacing: "0.16em",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" aria-hidden>
            <circle cx="36" cy="40" r="15" stroke="#8A9A5B" strokeWidth="4" />
            <circle cx="64" cy="40" r="15" stroke="#CC7722" strokeWidth="4" />
            <circle cx="50" cy="64" r="15" stroke="#E2E3DB" strokeWidth="4" />
          </svg>
          <div>reloading workspace…</div>
          <div style={{ fontSize: "9px", opacity: 0.5 }}>
            a dev-mode chunk failed to load — refreshing automatically
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
