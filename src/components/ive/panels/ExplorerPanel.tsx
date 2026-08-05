"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  File as FileIcon,
  FileCode2,
  FileJson,
  FileText,
  Hash,
  Lock,
  History,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";
import type { ExplorerNode } from "@/lib/ive/types";
import type { CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/* File-type icon resolver                                             */
/* ------------------------------------------------------------------ */

const FILE_ICON_BY_EXT: Record<string, LucideIcon> = {
  kcl: FileCode2,
  json: FileJson,
  md: FileText,
  txt: Hash,
  yaml: FileText,
  yml: FileText,
};

function extOf(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/** Module-level icon renderer (avoids creating a component during render). */
function FilePreviewIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = FILE_ICON_BY_EXT[extOf(name)] ?? FileIcon;
  return <Icon className={className} style={style} />;
}

/** Module-level tree-node icon renderer (dir / file by extension). */
function TreeNodeIcon({
  node,
  isOpen,
  className,
  style,
}: {
  node: ExplorerNode;
  isOpen: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  if (node.kind === "dir") {
    return isOpen ? (
      <FolderOpen className={className} style={style} />
    ) : (
      <Folder className={className} style={style} />
    );
  }
  return <FilePreviewIcon name={node.name} className={className} style={style} />;
}

/* ------------------------------------------------------------------ */
/* Tree row                                                            */
/* ------------------------------------------------------------------ */

interface TreeRowProps {
  node: ExplorerNode;
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  selectedPath: string | null;
  onSelect: (node: ExplorerNode) => void;
}

function TreeRow({
  node,
  depth,
  expanded,
  toggle,
  selectedPath,
  onSelect,
}: TreeRowProps) {
  const isDir = node.kind === "dir";
  const isOpen = expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  const accent = isDir ? "var(--ive-gold)" : "rgba(255,255,255,0.7)";

  return (
    <div>
      <button
        onClick={() => (isDir ? toggle(node.path) : onSelect(node))}
        className={`group flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left transition-colors ${
          isSelected
            ? "bg-[var(--ive-gold)]/12"
            : "hover:bg-white/[0.03]"
        }`}
        style={{ paddingLeft: depth * 14 + 6 }}
      >
        {isDir ? (
          <ChevronRight
            className={`h-3 w-3 flex-none text-muted-foreground transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        ) : (
          <span className="flex h-3 w-3 flex-none items-center justify-center">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          </span>
        )}
        <TreeNodeIcon
          node={node}
          isOpen={isOpen}
          className="h-3.5 w-3.5 flex-none"
          style={{ color: accent }}
        />
        <span
          className={`ive-mono truncate text-[10.5px] ${
            isSelected
              ? "font-semibold text-[var(--ive-gold)]"
              : isDir
                ? "text-foreground/90"
                : "text-foreground/80"
          }`}
        >
          {node.name}
        </span>
        {node.meta && (
          <span className="ive-mono ml-auto truncate pl-2 text-[8.5px] text-muted-foreground/45">
            {node.meta}
          </span>
        )}
      </button>

      {isDir && isOpen && node.children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          {node.children.map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function ExplorerPanel() {
  const explorerTree = useIveStore((s) => s.explorerTree);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["/", "/cad", "/outputs", "/ive-output", "/runs", "/docs"]),
  );
  const [selected, setSelected] = useState<ExplorerNode | null>(null);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function onSelect(node: ExplorerNode) {
    setSelected(node);
  }

  // Breadcrumb segments from selected path
  const crumbs = useMemo(() => {
    if (!selected) return [] as string[];
    const parts = selected.path.split("/").filter(Boolean);
    return parts;
  }, [selected]);

  // Flatten file count for stats
  const fileCount = useMemo(() => {
    let n = 0;
    const walk = (nodes: ExplorerNode[]) => {
      for (const node of nodes) {
        if (node.kind === "file") n += 1;
        if (node.children) walk(node.children);
      }
    };
    walk(explorerTree);
    return n;
  }, [explorerTree]);

  const dirCount = useMemo(() => {
    let n = 0;
    const walk = (nodes: ExplorerNode[]) => {
      for (const node of nodes) {
        if (node.kind === "dir") n += 1;
        if (node.children) walk(node.children);
      }
    };
    walk(explorerTree);
    return n;
  }, [explorerTree]);

  return (
    <PanelFrame
      title="Explorer"
      tag="FS"
      accent="#8b949e"
      mission="Repository file tree — proofbridge-liner layout."
      actions={
        <div className="hidden items-center gap-2 sm:flex">
          <StatusPill state={`${dirCount} dirs`} accent="#8b949e" />
          <StatusPill state={`${fileCount} files`} accent="var(--ive-gold)" />
        </div>
      }
    >
      {/* Breadcrumbs */}
      <div className="ive-surface mb-4 flex items-center gap-1.5 overflow-x-auto rounded-lg border border-white/[0.06] px-3 py-2">
        <Folder className="h-3.5 w-3.5 flex-none" style={{ color: "var(--ive-gold)" }} />
        <span className="ive-mono flex-none text-[10px] text-muted-foreground">proofbridge-liner</span>
        {crumbs.length > 0 && (
          <>
            {crumbs.map((c, i) => (
              <div key={i} className="flex flex-none items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span
                  className={`ive-mono text-[10px] ${
                    i === crumbs.length - 1
                      ? "font-semibold text-[var(--ive-gold)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {c}
                </span>
              </div>
            ))}
          </>
        )}
        {!selected && (
          <span className="ive-mono ml-2 truncate text-[9.5px] italic text-muted-foreground/50">
            no file selected — pick a file to inspect
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: tree */}
        <div>
          <SectionLabel>Repository Tree</SectionLabel>
          <div className="ive-surface max-h-[560px] overflow-y-auto rounded-xl border border-white/[0.06] p-2 ive-scroll">
            {explorerTree.map((node) => (
              <TreeRow
                key={node.path}
                node={node}
                depth={0}
                expanded={expanded}
                toggle={toggle}
                selectedPath={selected?.path ?? null}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/50">
            <span>proofbridge-liner · frozen layout</span>
            <span>click folder to expand · click file to inspect</span>
          </div>
        </div>

        {/* Right: file detail */}
        <div>
          <SectionLabel>File Detail</SectionLabel>
          {selected ? (
            <motion.div
              key={selected.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="ive-surface flex flex-col gap-3 rounded-xl border border-white/[0.06] p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-md border"
                  style={{
                    borderColor: "rgba(201,168,76,0.3)",
                    background: "rgba(201,168,76,0.08)",
                  }}
                >
                  <FilePreviewIcon name={selected.name} className="h-5 w-5" style={{ color: "var(--ive-gold)" }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-foreground">
                    {selected.name}
                  </div>
                  <div className="ive-mono mt-0.5 truncate text-[10px] text-muted-foreground/70">
                    {selected.path}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                    Kind
                  </div>
                  <div className="ive-mono mt-1 text-[11px] font-semibold text-foreground">
                    {selected.kind.toUpperCase()}
                  </div>
                </div>
                <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <div className="ive-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                    Meta
                  </div>
                  <div className="ive-mono mt-1 truncate text-[11px] text-foreground/85">
                    {selected.meta ?? "—"}
                  </div>
                </div>
              </div>

              {/* Mock preview area */}
              <div>
                <div className="ive-mono mb-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                  Preview
                </div>
                <div
                  className="relative flex h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-[var(--ive-blocked)]/20 bg-black/40 p-3"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)",
                  }}
                >
                  <FilePreviewIcon
                    name={selected.name}
                    className="h-7 w-7 opacity-40"
                    style={{ color: "var(--ive-blocked)" }}
                  />
                  <div className="text-center">
                    <div
                      className="ive-mono text-[10px] font-semibold"
                      style={{ color: "var(--ive-blocked)" }}
                    >
                      REQUIRES VALIDATION
                    </div>
                    <div className="ive-mono mt-0.5 text-[9px] text-muted-foreground/70">
                      file preview not available in this environment
                    </div>
                  </div>
                </div>
              </div>

              <div className="ive-mono flex items-center gap-1.5 rounded-md border border-white/[0.05] bg-white/[0.015] p-2 text-[9px] text-muted-foreground/70">
                <Lock className="h-3 w-3" />
                contents not rendered — no fabricated file data
              </div>
            </motion.div>
          ) : (
            <div className="ive-surface flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.08] p-4 text-center">
              <FileIcon className="h-7 w-7 text-muted-foreground/30" />
              <div className="ive-mono text-[10.5px] text-muted-foreground/70">
                select a file from the tree
              </div>
              <div className="ive-mono text-[9px] text-muted-foreground/50">
                file preview will not fabricate contents
              </div>
            </div>
          )}

          {/* Freeze note */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"
          >
            <History className="mt-0.5 h-3.5 w-3.5 flex-none" style={{ color: "var(--ive-gold)" }} />
            <p className="ive-mono text-[9.5px] leading-relaxed text-muted-foreground/80">
              Repository layout frozen per{" "}
              <span style={{ color: "var(--ive-gold)" }}>RELEASE_FREEZE.md</span>. Historical runs
              preserved in <span style={{ color: "var(--ive-gold)" }}>/runs</span> registry.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--ive-blocked)]/20 bg-[var(--ive-blocked)]/[0.03] p-4"
      >
        <TriangleAlert
          className="mt-0.5 h-4 w-4 flex-none"
          style={{ color: "var(--ive-blocked)" }}
        />
        <p className="ive-mono text-[10.5px] leading-relaxed text-muted-foreground/85">
          File previews are <span style={{ color: "var(--ive-blocked)" }}>REQUIRES VALIDATION</span> —
          the explorer renders paths and metadata only. No file contents are fabricated or
          interpreted within this environment.
        </p>
      </motion.div>
    </PanelFrame>
  );
}
