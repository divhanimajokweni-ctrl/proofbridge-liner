'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { useIDEStore, COMMANDS, PLUGINS, type PluginId, type IDECommand } from './ide-store';

// ---------------------------------------------------------------------------
// Command Palette
// ---------------------------------------------------------------------------

export function IDECommandPalette() {
  const commandPaletteOpen = useIDEStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useIDEStore((s) => s.toggleCommandPalette);
  const setActivePlugin = useIDEStore((s) => s.setActivePlugin);
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands by query
  const filtered = query.trim()
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.plugin.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const executeCommand = useCallback((cmd: IDECommand) => {
    setActivePlugin(cmd.plugin);
    addTerminalEntry({
      level: 'info',
      source: 'command-palette',
      message: `> ${cmd.label}`,
    });
    toggleCommandPalette();
  }, [setActivePlugin, addTerminalEntry, toggleCommandPalette]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        executeCommand(filtered[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleCommandPalette();
      }
    },
    [filtered, selectedIndex, executeCommand, toggleCommandPalette],
  );

  // Get plugin color
  const getPluginColor = (id: PluginId) => {
    return PLUGINS.find((p) => p.id === id)?.color ?? '#858585';
  };

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) toggleCommandPalette();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Palette */}
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-[560px] bg-[#1c1c1c] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
            <Search className="h-4 w-4 text-[#858585] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command… (e.g. 'VVU: Initialize HBK')"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#555] outline-none font-mono"
              autoFocus
            />
            <kbd className="text-[10px] text-[#858585] border border-[#3c3c3c] rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-[#858585] text-sm">
                No commands found for &ldquo;{query}&rdquo;
              </div>
            )}

            {filtered.map((cmd, i) => {
              const pluginColor = getPluginColor(cmd.plugin);
              const isSelected = i === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors
                    ${isSelected ? 'bg-[#094771] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}
                  `}
                >
                  {/* Plugin badge */}
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: pluginColor }}
                  />
                  <span className="text-[10px] text-[#858585] font-mono w-20 shrink-0">
                    {cmd.category}:
                  </span>
                  <span className="flex-1 truncate">{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] text-[#858585] border border-[#3c3c3c] rounded px-1.5 py-0.5 font-mono shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  {isSelected && (
                    <CornerDownLeft className="h-3 w-3 text-[#858585] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[#2d2d2d] text-[10px] text-[#555]">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
            <span className="ml-auto">{filtered.length} commands</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
