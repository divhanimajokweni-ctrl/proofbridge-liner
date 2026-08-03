'use client';

import { motion } from 'framer-motion';
import {
  Files,
  Globe,
  ShieldCheck,
  Droplets,
  Zap,
  Bot,
  Wallet,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useIDEStore, PLUGINS, type PluginId } from './ide-store';

// ---------------------------------------------------------------------------
// Icon resolver — maps string icon names to Lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Files,
  Globe,
  ShieldCheck,
  Droplets,
  Zap,
  Bot,
  Wallet,
  Settings,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Files;
}

// ---------------------------------------------------------------------------
// Activity Bar
// ---------------------------------------------------------------------------

export function ActivityBar() {
  const activePlugin = useIDEStore((s) => s.activePlugin);
  const setActivePlugin = useIDEStore((s) => s.setActivePlugin);
  const sidebarOpen = useIDEStore((s) => s.sidebarOpen);
  const toggleSidebar = useIDEStore((s) => s.toggleSidebar);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);

  const handlePluginClick = (id: PluginId) => {
    // If clicking the already-active plugin, toggle sidebar
    if (id === activePlugin) {
      toggleSidebar();
    } else {
      setActivePlugin(id);
    }
  };

  return (
    <nav
      className="w-[52px] bg-[#1c1c1c] flex flex-col items-center py-3 gap-1 shrink-0 z-50 border-r border-[#2d2d2d]"
      aria-label="Activity Bar — Plugin Rail"
    >
      {/* Top plugin icons */}
      <div className="flex flex-col items-center gap-1">
        {PLUGINS.map((plugin) => {
          const Icon = resolveIcon(plugin.icon);
          const isActive = activePlugin === plugin.id;
          const isLindiwe = plugin.id === 'LINDIWE';
          const isWatchdog = isLindiwe && circuitBreaker === 'TRIGGERED';

          return (
            <button
              key={plugin.id}
              onClick={() => handlePluginClick(plugin.id)}
              className={`
                relative w-11 h-11 flex items-center justify-center rounded-md
                transition-all duration-150 group
                ${isActive
                  ? 'text-white bg-[#2a2d2e]'
                  : 'text-[#858585] hover:text-white hover:bg-[#2a2d2e]/50'
                }
              `}
              title={plugin.label}
              aria-label={plugin.label}
              aria-pressed={isActive}
            >
              {/* Active indicator — left border */}
              {isActive && (
                <motion.div
                  layoutId="activity-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r"
                  style={{ backgroundColor: plugin.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Watchdog pulsing glow */}
              {isWatchdog && (
                <motion.div
                  className="absolute inset-0 rounded-md"
                  style={{ boxShadow: `0 0 12px 2px ${plugin.color}40` }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}

              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2 : 1.5}
                style={isActive ? { color: plugin.color } : undefined}
              />

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#3c3c3c] rounded text-[11px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-xl">
                <span className="font-semibold">{plugin.label}</span>
                {plugin.shortcut && (
                  <span className="ml-2 text-[10px] text-[#858585]">{plugin.shortcut}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom icons — Wallet & Settings */}
      <div className="flex flex-col items-center gap-1">
        <button
          className="w-11 h-11 flex items-center justify-center rounded-md text-[#858585] hover:text-white hover:bg-[#2a2d2e]/50 transition-all duration-150 group relative"
          title="Wallet & Identity"
          aria-label="Wallet & Identity"
        >
          <Wallet className="h-[22px] w-[22px]" strokeWidth={1.5} />
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#3c3c3c] rounded text-[11px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-xl">
            Wallet & Identity
          </div>
        </button>
        <button
          className="w-11 h-11 flex items-center justify-center rounded-md text-[#858585] hover:text-white hover:bg-[#2a2d2e]/50 transition-all duration-150 group relative"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-[22px] w-[22px]" strokeWidth={1.5} />
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#3c3c3c] rounded text-[11px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-xl">
            Settings
          </div>
        </button>
      </div>
    </nav>
  );
}
