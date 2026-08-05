"use client";

import { useEffect, useMemo, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { useIveStore, PANELS } from "@/store/useIveStore";

/**
 * CommandPalette
 * --------------
 * Cmd/Ctrl+K palette for fast panel navigation across the IVE workspace.
 *
 * The query state lives in the inner `PaletteBody` component, which only
 * mounts when `open` is true. This means the input resets naturally on
 * every open (fresh mount) without any setState-in-effect.
 */
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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return PANELS;
    return PANELS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        p.mission.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <CommandPrimitive className="flex flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <CommandPrimitive.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Jump to panel…"
          className="ive-mono flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <kbd className="ive-mono rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
          Esc
        </kbd>
      </div>
      <CommandPrimitive.List className="ive-scroll max-h-[340px] overflow-y-auto p-1.5">
        <CommandPrimitive.Empty className="ive-mono px-3 py-6 text-center text-[11px] text-muted-foreground/60">
          No panels match “{query}”.
        </CommandPrimitive.Empty>
        {filtered.map((p) => (
          <CommandPrimitive.Item
            key={p.id}
            onSelect={() => {
              setActivePanel(p.id);
              onOpenChange(false);
            }}
            className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors data-[selected=true]:bg-white/[0.05] ${
              activePanel === p.id ? "bg-white/[0.04]" : ""
            }`}
          >
            <span
              className="ive-mono flex h-7 w-7 flex-none items-center justify-center rounded border text-[9px] font-bold"
              style={{ borderColor: `${p.accent}40`, background: `${p.accent}10`, color: p.accent }}
            >
              {p.tag}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">{p.label}</div>
              <div className="ive-mono truncate text-[9.5px] text-muted-foreground/60">{p.mission}</div>
            </div>
            <span className="ive-mono text-[8.5px] uppercase tracking-wider text-muted-foreground/40">
              {p.group}
            </span>
          </CommandPrimitive.Item>
        ))}
      </CommandPrimitive.List>
    </CommandPrimitive>
  );
}
