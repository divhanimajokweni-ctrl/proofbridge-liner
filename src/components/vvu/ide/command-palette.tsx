'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft, Hexagon, ShieldAlert, Bot, Download, Power, Zap } from 'lucide-react';
import { useIDEStore, COMMANDS, PLUGINS, type PluginId, type IDECommand, type Adapter } from './ide-store';

// ---------------------------------------------------------------------------
// Zookeeper Command Extensions — Execute Real Actions
// ---------------------------------------------------------------------------

interface ZKCommand extends IDECommand {
  perform?: () => void;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

function buildZKCommands(): ZKCommand[] {
  const store = useIDEStore.getState();
  const adapters = store.adapters;

  // Adapter-specific commands
  const adapterCommands: ZKCommand[] = adapters
    .filter((a) => a.lifecycle === 'not_installed')
    .map((a) => ({
      id: `zk-install-${a.id}`,
      label: `VVU: Install ${a.label} Adapter`,
      plugin: 'ZOOKEEPER' as PluginId,
      category: 'Adapter Registry',
      icon: Download,
      perform: () => {
        useIDEStore.getState().installAdapter(a.id);
        useIDEStore.getState().addTerminalEntry({
          level: 'info',
          source: 'plugin-manager',
          message: `> vvu plugin install ${a.id} — ${a.label} adapter installed. Lifecycle: installed.`,
        });
      },
    }));

  const activateCommands: ZKCommand[] = adapters
    .filter((a) => a.lifecycle === 'dormant' || a.lifecycle === 'installed')
    .map((a) => ({
      id: `zk-activate-${a.id}`,
      label: `VVU: Activate ${a.label} Adapter`,
      plugin: 'ZOOKEEPER' as PluginId,
      category: 'Adapter Registry',
      icon: Power,
      perform: () => {
        useIDEStore.getState().activateAdapter(a.id);
        useIDEStore.getState().addTerminalEntry({
          level: 'info',
          source: 'plugin-manager',
          message: `> vvu plugin activate ${a.id} — ${a.label} adapter activated. initialize() → discover() → authenticate() complete.`,
        });
      },
    }));

  const shutdownCommands: ZKCommand[] = adapters
    .filter((a) => a.lifecycle === 'activated' || a.lifecycle === 'running')
    .map((a) => ({
      id: `zk-shutdown-${a.id}`,
      label: `VVU: Shutdown ${a.label} Adapter`,
      plugin: 'ZOOKEEPER' as PluginId,
      category: 'Adapter Registry',
      icon: Power,
      perform: () => {
        useIDEStore.getState().shutdownAdapter(a.id);
        useIDEStore.getState().addTerminalEntry({
          level: 'info',
          source: 'plugin-manager',
          message: `> vvu plugin shutdown ${a.id} — ${a.label} adapter returned to dormant. shutdown() complete.`,
        });
      },
    }));

  // Specialist commands
  const specialistCommands: ZKCommand[] = [
    {
      id: 'zk-trigger-watchdog',
      label: 'Watchdog: Manual Circuit Break (Lockdown)',
      plugin: 'WATCHDOG',
      category: 'Security',
      icon: ShieldAlert,
      perform: () => {
        useIDEStore.getState().setCircuitBreaker('TRIGGERED', 'MANUAL_OPERATOR_OVERRIDE');
      },
    },
    {
      id: 'zk-lindiwe-advisor',
      label: 'Lindiwe: Toggle Advisor Panel',
      plugin: 'LINDIWE',
      category: 'Specialist Agents',
      icon: Bot,
      perform: () => {
        useIDEStore.getState().toggleLindiwePanel();
      },
    },
    {
      id: 'zk-lindiwe-terminal',
      label: 'Lindiwe: Toggle Operator Terminal',
      plugin: 'LINDIWE',
      category: 'Specialist Agents',
      icon: Bot,
      perform: () => {
        useIDEStore.getState().toggleLindiweTerminal();
      },
    },
    {
      id: 'zk-autonomy-observer',
      label: 'Set Autonomy: Observer (L1)',
      plugin: 'LINDIWE',
      category: 'Autonomy',
      perform: () => {
        useIDEStore.getState().setAutonomyLevel(1);
      },
    },
    {
      id: 'zk-autonomy-action-safe',
      label: 'Set Autonomy: Action-Safe (L2)',
      plugin: 'LINDIWE',
      category: 'Autonomy',
      perform: () => {
        useIDEStore.getState().setAutonomyLevel(2);
      },
    },
    {
      id: 'zk-autonomy-watchdog',
      label: 'Set Autonomy: Watchdog (L3)',
      plugin: 'LINDIWE',
      category: 'Autonomy',
      perform: () => {
        useIDEStore.getState().setAutonomyLevel(3);
      },
    },
    {
      id: 'zk-circuit-reset',
      label: 'Watchdog: Reset Circuit Breaker',
      plugin: 'WATCHDOG',
      category: 'Security',
      icon: Zap,
      perform: () => {
        useIDEStore.getState().setCircuitBreaker('NORMAL');
      },
    },
  ];

  return [...adapterCommands, ...activateCommands, ...shutdownCommands, ...specialistCommands];
}

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

  // Build all commands: base + ZK dynamic
  const allCommands: ZKCommand[] = [...COMMANDS, ...buildZKCommands()];

  // Filter commands by query
  const filtered = query.trim()
    ? allCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.plugin.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  const executeCommand = useCallback((cmd: ZKCommand) => {
    // If the command has a perform action, execute it
    if (cmd.perform) {
      cmd.perform();
    }

    // Also switch to the relevant plugin and log the command
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

  // Group commands by category
  const groupedCommands = filtered.reduce<Record<string, ZKCommand[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

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
          className="relative w-full max-w-[620px] bg-[#1c1c1c] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden"
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
              placeholder="Type a command… (e.g. 'VVU: Install Zoom Adapter')"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#555] outline-none font-mono"
              autoFocus
            />
            <kbd className="text-[10px] text-[#858585] border border-[#3c3c3c] rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-[#858585] text-sm">
                No commands found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Grouped commands */}
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] font-mono text-[#555] tracking-wider uppercase bg-[#1a1a1a] sticky top-0">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const flatIndex = filtered.indexOf(cmd);
                  const pluginColor = getPluginColor(cmd.plugin);
                  const isSelected = flatIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
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
                      {/* Command icon if available */}
                      {cmd.icon && (
                        <cmd.icon className="h-3.5 w-3.5 text-[#858585] shrink-0" strokeWidth={1.5} />
                      )}
                      <span className="flex-1 truncate text-left">{cmd.label}</span>
                      {/* Action indicator for perform-able commands */}
                      {cmd.perform && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3dffb0]/10 text-[#3dffb0] shrink-0">
                          EXEC
                        </span>
                      )}
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
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[#2d2d2d] text-[10px] text-[#555]">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[#3dffb0]">{filtered.filter((c) => (c as ZKCommand).perform).length}</span> executable
              <span className="text-[#858585]">·</span>
              <span>{filtered.length} total</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
