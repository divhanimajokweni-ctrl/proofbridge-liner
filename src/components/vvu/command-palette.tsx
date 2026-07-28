"use client";

import { useMemo } from "react";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PRODUCTS, type ProductId } from "./products";
import { ALL_SECTIONS, type SectionId } from "./epistemic-runtime-dashboard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (id: ProductId) => void;
  onEpistemicSectionSelect: (id: SectionId) => void;
}

export function VvuCommandPalette({ open, onOpenChange, onProductSelect, onEpistemicSectionSelect }: Props) {
  const handleProduct = (id: ProductId) => { onProductSelect(id); onOpenChange(false); };
  const handleSection = (id: SectionId) => { onEpistemicSectionSelect(id); onOpenChange(false); };
  const productItems = useMemo(() => PRODUCTS, []);
  const sectionItems = useMemo(() => ALL_SECTIONS, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-[640px]" showCloseButton={false}>
        <DialogTitle className="sr-only">VVU Command Palette</DialogTitle>
        <DialogDescription className="sr-only">Jump to any VVU product or Epistemic Runtime section.</DialogDescription>
        <Command shouldFilter loop className="rounded-none">
          <div className="flex items-center gap-2 border-b border-border/60 px-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">VVU</span>
            <CommandInput placeholder="Jump to a product or Epistemic section…" className="h-12 flex-1 border-none outline-none bg-transparent text-sm placeholder:text-muted-foreground/60" />
            <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">Esc</kbd>
          </div>
          <CommandList className="max-h-[420px] overflow-y-auto">
            <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">No matches.</CommandEmpty>
            <CommandGroup heading="Products" className="text-muted-foreground">
              {productItems.map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem key={p.id} value={`${p.label} ${p.tag} ${p.tagline} ${p.id}`} onSelect={() => handleProduct(p.id)}
                    className="group cursor-pointer aria-selected:bg-[#C9A84C]/10 aria-selected:text-foreground">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md border" style={{ borderColor: `${p.accent}40`, background: `${p.accent}10` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: p.accent }} strokeWidth={1.8} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{p.label}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{p.tag}</span>
                        {p.status === "COMING_ONLINE" && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-400">Soon</span>}
                      </div>
                      <span className="truncate text-[10px] text-muted-foreground">{p.tagline}</span>
                    </div>
                    <kbd className="ml-auto hidden rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:inline-block">Alt+{p.shortcut}</kbd>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Epistemic Runtime · Sections" className="text-muted-foreground">
              {sectionItems.map((s) => {
                const Icon = s.icon;
                return (
                  <CommandItem key={s.id} value={`epistemic ${s.label} ${s.hint} ${s.id}`} onSelect={() => handleSection(s.id)}
                    className="group cursor-pointer aria-selected:bg-[#b23dff]/10 aria-selected:text-foreground">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md border border-[#b23dff]/30 bg-[#b23dff]/10">
                      <Icon className="h-3 w-3 text-[#b23dff]" strokeWidth={1.8} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      <span className="truncate text-[10px] text-muted-foreground">{s.hint}</span>
                    </div>
                    <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">Epistemic ›</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
            <span className="font-mono">{productItems.length} products · {sectionItems.length} epistemic sections</span>
            <span className="flex items-center gap-2 font-mono">
              <span><kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[9px]">↑↓</kbd> navigate</span>
              <span><kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[9px]">↵</kbd> select</span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
