"use client";

import { useEffect, useMemo, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Clock, CornerDownLeft } from "lucide-react";
import { useIveStore, PANELS, type PanelMeta } from "@/store/useIveStore";
import type { WorkspacePanelId } from "@/lib/ive/types";

/**
 * CommandPalette
 * --------------
 * Cmd/Ctrl+K palette for fast panel navigation across the IVE workspace.
 *
 * Features:
 *  - Content search: matches against label, tag, mission, AND group.
 *  - Recent commands: tracks the last 5 navigated panels (localStorage),
 *    shown when the query is empty.
 *  - Keyboard hint chips: shows ⌘K / Esc hints in the header.
 *
 * The query state lives in the inner `PaletteBody` component, which only
 * mounts when `open` is true — the input resets naturally on every open
 * (fresh mount) without any setState-in-effect.
 */

const RECENT_KEY = "ive-recent-commands-v1";
const MAX_RECENT = 5;

function loadRecent(): WorkspacePanelId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT);
    return [];
  } catch {
    return [];
  }
}

function saveRecent(ids: WorkspacePanelId[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-white/[0.1]"
        style={{ background: "rgba(15,15,24,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <PaletteBody onOpenChange={onOpenChange} />
      </div>
    </div>
  );
}

function PaletteBody({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const setActivePanel = useIveStore((s) => s.setActivePanel);
  const activePanel = useIveStore((s) => s.activePanel);
  const [query, setQuery] = useState("");
  // Lazy initializer — loads recent commands on first render (fresh mount
  // each open), avoiding the setState-in-effect pattern.
  const [recent, setRecent] = useState<WorkspacePanelId[]>(() => loadRecent());

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return PANELS;
    return PANELS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        p.mission.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q),
    );
  }, [query]);

  const recentPanels = useMemo<PanelMeta[]>(
    () =>
      recent
        .map((id) => PANELS.find((p) => p.id === id))
        .filter((p): p is PanelMeta => Boolean(p)),
    [recent],
  );

  function navigate(id: WorkspacePanelId) {
    setActivePanel(id);
    onOpenChange(false);
    // Update recent history.
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  }

  const showRecent = !query && recentPanels.length > 0;

  return (
    <CommandPrimitive className="flex flex-col">
      {/* Search header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <CommandPrimitive.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search panels, tags, or descriptions…"
          className="ive-mono flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <kbd className="ive-mono rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
          Esc
        </kbd>
      </div>

      <CommandPrimitive.List className="ive-scroll max-h-[380px] overflow-y-auto p-1.5">
        <CommandPrimitive.Empty className="ive-mono px-3 py-6 text-center text-[11px] text-muted-foreground/60">
          No panels match “{query}”.
        </CommandPrimitive.Empty>

        {/* Recent commands section (only when query is empty) */}
        {showRecent && (
          <>
            <div className="ive-mono flex items-center gap-1.5 px-2.5 py-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              Recent
            </div>
            {recentPanels.map((p) => (
              <PaletteItem
                key={`recent-${p.id}`}
                panel={p}
                active={activePanel === p.id}
                onSelect={() => navigate(p.id)}
                recent
              />
            ))}
            <div className="ive-mono mt-1 flex items-center gap-1.5 px-2.5 py-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/50">
              <span className="h-1 w-3 rounded-full bg-[var(--ive-gold)]/40" />
              All Panels
            </div>
          </>
        )}

        {/* All panels */}
        {filtered.map((p) => (
          <PaletteItem
            key={p.id}
            panel={p}
            active={activePanel === p.id}
            onSelect={() => navigate(p.id)}
          />
        ))}
      </CommandPrimitive.List>

      {/* Footer with hints */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-3.5 py-2">
        <div className="ive-mono flex items-center gap-3 text-[8.5px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-2.5 w-2.5" /> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 text-[7.5px]">↑↓</kbd>
            select
          </span>
        </div>
        <div className="ive-mono text-[8.5px] text-muted-foreground/40">
          {filtered.length} panel{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>
    </CommandPrimitive>
  );
}

function PaletteItem({
  panel,
  active,
  onSelect,
  recent = false,
}: {
  panel: PanelMeta;
  active: boolean;
  onSelect: () => void;
  recent?: boolean;
}) {
  return (
    <CommandPrimitive.Item
      onSelect={onSelect}
      className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors data-[selected=true]:bg-white/[0.05] ${
        active ? "bg-white/[0.04]" : ""
      }`}
    >
      <span
        className="ive-mono flex h-7 w-7 flex-none items-center justify-center rounded border text-[9px] font-bold"
        style={{ borderColor: `${panel.accent}40`, background: `${panel.accent}10`, color: panel.accent }}
      >
        {panel.tag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium text-foreground">{panel.label}</span>
          {recent && (
            <Clock className="h-2.5 w-2.5 flex-none text-muted-foreground/40" />
          )}
          {active && (
            <span className="ive-mono rounded bg-[var(--ive-gold)]/15 px-1 py-0.5 text-[7.5px] font-semibold uppercase text-[var(--ive-gold)]">
              active
            </span>
          )}
        </div>
        <div className="ive-mono truncate text-[9.5px] text-muted-foreground/60">{panel.mission}</div>
      </div>
      <span className="ive-mono text-[8.5px] uppercase tracking-wider text-muted-foreground/40">
        {panel.group}
      </span>
    </CommandPrimitive.Item>
  );
}
