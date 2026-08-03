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
  Hexagon,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { useIDEStore, PLUGINS, LIFECYCLE_COLORS, type PluginId, type Adapter } from './ide-store';

// ---------------------------------------------------------------------------
// Icon resolver
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
  Hexagon,
  ShieldAlert,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Files;
}

// ---------------------------------------------------------------------------
// Adapter Lifecycle Indicator — shows dormant/active count per plugin
// ---------------------------------------------------------------------------

function PluginLifecycleBadge({ pluginId }: { pluginId: PluginId }) {
  const adapters = useIDEStore((s) => s.adapters);

  // Map plugins to their relevant adapters
  const pluginAdapterMap: Record<string, string[]> = {
    AIR_COMPUTE: ['amd-compute'],
    HBK: ['cad'],
    PROOFBRIDGE: ['plc'],
    ZOOKEEPER: ['amd-compute', 'github', 'zoom', 'figma', 'cad', 'matlab', 'ros2', 'plc'],
  };

  const relevantIds = pluginAdapterMap[pluginId];
  if (!relevantIds) return null;

  const relevantAdapters = adapters.filter((a) => relevantIds.includes(a.id));
  const activeCount = relevantAdapters.filter(
    (a) => a.lifecycle === 'activated' || a.lifecycle === 'running'
  ).length;
  const dormantCount = relevantAdapters.filter(
    (a) => a.lifecycle === 'dormant' || a.lifecycle === 'installed'
  ).length;
  const notInstalledCount = relevantAdapters.filter(
    (a) => a.lifecycle === 'not_installed'
  ).length;

  if (activeCount === 0 && dormantCount === 0) return null;

  return (
    <div className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0">
      {activeCount > 0 && (
        <div
          className="w-2.5 h-2.5 rounded-full border border-[#1c1c1c] flex items-center justify-center"
          style={{ backgroundColor: LIFECYCLE_COLORS.running }}
          title={`${activeCount} active adapter(s)`}
        >
          <span className="text-[5px] font-bold text-[#1c1c1c]">{activeCount}</span>
        </div>
      )}
      {dormantCount > 0 && activeCount === 0 && (
        <div
          className="w-2 h-2 rounded-full border border-[#1c1c1c]"
          style={{ backgroundColor: LIFECYCLE_COLORS.dormant }}
          title={`${dormantCount} dormant adapter(s)`}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Bar
// ---------------------------------------------------------------------------

export function ActivityBar() {
  const activePlugin = useIDEStore((s) => s.activePlugin);
  const setActivePlugin = useIDEStore((s) => s.setActivePlugin);
  const toggleSidebar = useIDEStore((s) => s.toggleSidebar);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);
  const zookeeperOnline = useIDEStore((s) => s.zookeeperOnline);

  const handlePluginClick = (id: PluginId) => {
    if (id === activePlugin) {
      toggleSidebar();
    } else {
      setActivePlugin(id);
    }
  };

  // Group plugins: Core (Zookeeper) → Products → Specialists → Bottom
  const corePlugins = PLUGINS.filter((p) => p.isCore);
  const productPlugins = PLUGINS.filter((p) => !p.isCore && !p.isSpecialist);
  const specialistPlugins = PLUGINS.filter((p) => p.isSpecialist);

  return (
    <nav
      className="w-[52px] bg-[#1c1c1c] flex flex-col items-center py-3 gap-1 shrink-0 z-50 border-r border-[#2d2d2d]"
      aria-label="Activity Bar — Zookeeper Plugin Rail"
    >
      {/* Core Runtime — Zookeeper is always at the top */}
      <div className="flex flex-col items-center gap-1 mb-1">
        {corePlugins.map((plugin) => {
          const Icon = resolveIcon(plugin.icon);
          const isActive = activePlugin === plugin.id;

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
              {isActive && (
                <motion.div
                  layoutId="activity-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r"
                  style={{ backgroundColor: plugin.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Zookeeper online pulse */}
              {zookeeperOnline && (
                <motion.div
                  className="absolute inset-0 rounded-md"
                  style={{ boxShadow: `0 0 8px 1px ${plugin.color}20` }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}

              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2 : 1.5}
                style={isActive ? { color: plugin.color } : undefined}
              />

              {/* Lifecycle badge */}
              <PluginLifecycleBadge pluginId={plugin.id} />

              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#3c3c3c] rounded text-[11px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-xl">
                <span className="font-semibold">{plugin.label}</span>
                <span className="ml-2 text-[10px] text-[#3dffb0]">● CORE</span>
                {plugin.shortcut && (
                  <span className="ml-2 text-[10px] text-[#858585]">{plugin.shortcut}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-6 h-px bg-[#3c3c3c] my-1" />

      {/* Product Plugins */}
      <div className="flex flex-col items-center gap-1">
        {productPlugins.map((plugin) => {
          const Icon = resolveIcon(plugin.icon);
          const isActive = activePlugin === plugin.id;

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
              {isActive && (
                <motion.div
                  layoutId="activity-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r"
                  style={{ backgroundColor: plugin.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2 : 1.5}
                style={isActive ? { color: plugin.color } : undefined}
              />

              {/* Lifecycle badge */}
              <PluginLifecycleBadge pluginId={plugin.id} />

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

      {/* Separator */}
      <div className="w-6 h-px bg-[#3c3c3c] my-1" />

      {/* Specialist Agents — Lindiwe & Watchdog */}
      <div className="flex flex-col items-center gap-1">
        {specialistPlugins.map((plugin) => {
          const Icon = resolveIcon(plugin.icon);
          const isActive = activePlugin === plugin.id;
          const isWatchdog = plugin.id === 'WATCHDOG';
          const isTriggered = isWatchdog && circuitBreaker === 'TRIGGERED';

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
              {isActive && (
                <motion.div
                  layoutId="activity-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r"
                  style={{ backgroundColor: plugin.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Watchdog triggered glow */}
              {isTriggered && (
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

              {/* Specialist badge */}
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1c1c1c]" style={{ backgroundColor: plugin.color }} />

              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#3c3c3c] rounded text-[11px] text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[100] shadow-xl">
                <span className="font-semibold">{plugin.label}</span>
                <span className="ml-2 text-[10px] text-[#a855f7]">● SPECIALIST</span>
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
