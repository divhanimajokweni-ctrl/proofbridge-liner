"use client";

/**
 * SettingsPanel — IVE user preferences surface.
 *
 * The single source of truth for user-tunable preferences: boot auto-skip,
 * animation intensity, widget defaults, accent color override, and a
 * transparent view of the persisted settings JSON.
 *
 * All preferences are persisted to localStorage (key `ive-settings-v1`) via
 * `updateSettings` on the canonical Zustand store. No preferences are sent
 * to any server.
 */

import { type ReactNode, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Zap,
  Palette,
  Keyboard as KeyboardIcon,
  Database,
  RotateCcw,
  Check,
  ShieldCheck,
} from "lucide-react";

import { useIveStore, type IVESettings } from "@/store/useIveStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PanelFrame, SectionLabel, Kbd } from "../primitives";
import { toast } from "@/hooks/use-toast";

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

/** Default settings — used for the "Reset all settings" action. Kept in
 *  sync with the DEFAULT_SETTINGS inside useIveStore. */
const DEFAULT_SETTINGS: IVESettings = {
  autoSkipBoot: false,
  animationIntensity: "full",
  defaultOpenMissionControl: false,
  defaultOpenStatsHud: false,
  accentOverride: "gold",
  showBootSoundWave: true,
};

const SETTINGS_KEY = "ive-settings-v1";

const ACCENT_SWATCHES = [
  { key: "gold", label: "Gold", hex: "#C9A84C" },
  { key: "sage", label: "Sage", hex: "#8A9A5B" },
  { key: "ember", label: "Ember", hex: "#CC7722" },
  { key: "mint", label: "Mint", hex: "#3dffb0" },
  { key: "steel", label: "Steel", hex: "#3d9bff" },
  { key: "violet", label: "Violet", hex: "#b23dff" },
] as const;

const ANIMATION_OPTIONS: {
  value: IVESettings["animationIntensity"];
  label: string;
  hint: string;
}[] = [
  { value: "full", label: "Full", hint: "Standard durations" },
  { value: "reduced", label: "Reduced", hint: "Shorter durations" },
  { value: "none", label: "None", hint: "Instant" },
];

const SHORTCUTS: { keys: ReactNode; label: string }[] = [
  {
    keys: (
      <>
        <Kbd>⌘</Kbd> <Kbd>K</Kbd>
      </>
    ),
    label: "Command palette",
  },
  { keys: <Kbd>F8</Kbd>, label: "Activity center" },
  { keys: <Kbd>T</Kbd>, label: "Guided tour" },
  { keys: <Kbd>M</Kbd>, label: "Mission control" },
  { keys: <Kbd>H</Kbd>, label: "Stats HUD" },
  {
    keys: (
      <>
        <Kbd>[</Kbd> <Kbd>]</Kbd>
      </>
    ),
    label: "Prev / next panel",
  },
  {
    keys: (
      <>
        <Kbd>g</Kbd> <Kbd>c</Kbd>/<Kbd>r</Kbd>/<Kbd>u</Kbd>/<Kbd>h</Kbd>/<Kbd>s</Kbd>
      </>
    ),
    label: "Group jumps — core / runtime / case-study / release / system",
  },
  { keys: <Kbd>?</Kbd>, label: "This overlay" },
  { keys: <Kbd>Esc</Kbd>, label: "Skip / close" },
];

/* ------------------------------------------------------------------ *
 * Small composable row components
 * ------------------------------------------------------------------ */

function ToggleRow({
  icon: Icon,
  iconColor,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/[0.06] bg-white/[0.015] p-4 transition-colors hover:border-white/[0.10]">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md border"
          style={{ borderColor: `${iconColor}40`, background: `${iconColor}10` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{label}</div>
          <p className="ive-mono mt-1 max-w-[460px] text-[10px] leading-relaxed text-muted-foreground/75">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-none items-center pt-1">
        <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
      </div>
    </div>
  );
}

function SectionShell({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5"
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md border"
          style={{ borderColor: `${iconColor}40`, background: `${iconColor}10` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-[14px] font-bold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          <p className="ive-mono mt-0.5 max-w-[520px] text-[10px] leading-relaxed text-muted-foreground/75">
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ *
 * Panel
 * ------------------------------------------------------------------ */

export function SettingsPanel() {
  const settings = useIveStore((s) => s.settings);
  const updateSettings = useIveStore((s) => s.updateSettings);

  const [resetArmed, setResetArmed] = useState(false);

  /** True if the current accentOverride is a custom hex not in the palette. */
  const isCustomAccent = useMemo(() => {
    if (settings.accentOverride === "gold") return false;
    return !ACCENT_SWATCHES.some((s) => s.hex === settings.accentOverride);
  }, [settings.accentOverride]);

  /** The resolved hex value of the current accent (for live preview). */
  const currentAccentHex = settings.accentOverride === "gold" ? "#C9A84C" : settings.accentOverride;

  const isSwatchActive = (swatch: (typeof ACCENT_SWATCHES)[number]) => {
    if (swatch.key === "gold") return settings.accentOverride === "gold";
    return settings.accentOverride === swatch.hex;
  };

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    updateSettings(DEFAULT_SETTINGS);
    setResetArmed(false);
    toast({
      title: "Settings reset",
      description:
        "All preferences restored to defaults. localStorage key ive-settings-v1 overwritten.",
    });
  };

  const handleResetAccent = () => {
    updateSettings({ accentOverride: "gold" });
    toast({
      title: "Accent reset",
      description: "Accent override cleared — default Gold (#C9A84C) restored.",
    });
  };

  const settingsJson = useMemo(() => JSON.stringify(settings, null, 2), [settings]);

  return (
    <PanelFrame
      title="Settings"
      tag="SET"
      accent="#8b949e"
      mission="User preferences — boot auto-skip, animation intensity, widget defaults, accent override."
      actions={
        <div className="ive-mono hidden items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-proven)] ive-live-pulse" />
          local · no telemetry
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* -------------------------------------------------------- *
         * 1. Boot & Animation
         * -------------------------------------------------------- */}
        <SectionShell
          icon={Zap}
          iconColor="#C9A84C"
          title="Boot & Animation"
          description="Control the cinematic boot sequence and framer-motion entrance animations across all panels."
        >
          <div className="flex flex-col gap-3">
            <ToggleRow
              icon={SettingsIcon}
              iconColor="#C9A84C"
              label="Auto-skip boot"
              description="Skip the cinematic boot sequence automatically. Press Esc during boot to skip manually."
              checked={settings.autoSkipBoot}
              onChange={(v) => updateSettings({ autoSkipBoot: v })}
            />
            <ToggleRow
              icon={Zap}
              iconColor="#3dffb0"
              label="Show boot sound-wave"
              description="Display the ambient sound-wave visualization during the boot sequence."
              checked={settings.showBootSoundWave}
              onChange={(v) => updateSettings({ showBootSoundWave: v })}
            />

            {/* Animation intensity — segmented control */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">
                    Animation intensity
                  </div>
                  <p className="ive-mono mt-1 max-w-[460px] text-[10px] leading-relaxed text-muted-foreground/75">
                    Controls framer-motion entrance animations across all panels. Reduced =
                    shorter durations, None = instant.
                  </p>
                </div>
              </div>
              <div
                role="radiogroup"
                aria-label="Animation intensity"
                className="mt-3 inline-flex w-full overflow-hidden rounded-md border border-white/[0.08] sm:w-auto"
              >
                {ANIMATION_OPTIONS.map((opt, i) => {
                  const active = settings.animationIntensity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateSettings({ animationIntensity: opt.value })}
                      className={[
                        "ive-mono relative flex flex-1 items-center justify-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors sm:flex-none",
                        i > 0 ? "border-l border-white/[0.08]" : "",
                        active
                          ? "bg-[var(--ive-gold)]/15 text-[var(--ive-gold)]"
                          : "text-muted-foreground/70 hover:bg-white/[0.03] hover:text-foreground",
                      ].join(" ")}
                    >
                      {active && (
                        <Check className="h-3 w-3" style={{ color: "var(--ive-gold)" }} />
                      )}
                      <span>{opt.label}</span>
                      <span className="hidden text-[8.5px] font-normal lowercase tracking-normal text-muted-foreground/50 sm:inline">
                        · {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionShell>

        {/* -------------------------------------------------------- *
         * 2. Widget Defaults
         * -------------------------------------------------------- */}
        <SectionShell
          icon={SettingsIcon}
          iconColor="#8b949e"
          title="Widget Defaults"
          description="Choose which floating widgets open automatically when the workspace mounts."
        >
          <div className="flex flex-col gap-3">
            <ToggleRow
              icon={SettingsIcon}
              iconColor="#C9A84C"
              label="Default-open Mission Control"
              description="Open the Mission Control widget automatically when the workspace mounts."
              checked={settings.defaultOpenMissionControl}
              onChange={(v) => updateSettings({ defaultOpenMissionControl: v })}
            />
            <ToggleRow
              icon={SettingsIcon}
              iconColor="#3d9bff"
              label="Default-open Stats HUD"
              description="Open the Stats HUD overlay automatically when the workspace mounts."
              checked={settings.defaultOpenStatsHud}
              onChange={(v) => updateSettings({ defaultOpenStatsHud: v })}
            />
            <p className="ive-mono rounded-md border border-white/[0.04] bg-white/[0.01] px-3 py-2 text-[9.5px] leading-relaxed text-muted-foreground/60">
              These defaults apply on the next workspace mount. Currently-open widgets are not
              affected.
            </p>
          </div>
        </SectionShell>

        {/* -------------------------------------------------------- *
         * 3. Accent Color
         * -------------------------------------------------------- */}
        <SectionShell
          icon={Palette}
          iconColor="#b23dff"
          title="Accent Color"
          description="Override the global accent color used in the header, sidebar active items, and panel underlines."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_SWATCHES.map((swatch) => {
                const active = isSwatchActive(swatch);
                return (
                  <button
                    key={swatch.key}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        accentOverride: swatch.key === "gold" ? "gold" : swatch.hex,
                      })
                    }
                    aria-label={`${swatch.label} accent${active ? " (selected)" : ""}`}
                    aria-pressed={active}
                    title={`${swatch.label} · ${swatch.hex}`}
                    className="group relative flex flex-col items-center gap-1.5"
                  >
                    <span
                      className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-transform group-hover:scale-105 group-active:scale-95"
                      style={{
                        background: swatch.hex,
                        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.10)",
                        boxShadow: active
                          ? `0 0 0 2px ${swatch.hex}40, 0 0 14px ${swatch.hex}80`
                          : `0 0 0 1px ${swatch.hex}20`,
                      }}
                    >
                      {active && <Check className="h-4 w-4 text-black/85" />}
                    </span>
                    <span
                      className="ive-mono text-[8.5px] font-semibold uppercase tracking-[0.10em] transition-colors"
                      style={{ color: active ? swatch.hex : "rgba(255,255,255,0.45)" }}
                    >
                      {swatch.label}
                    </span>
                  </button>
                );
              })}

              <div className="ml-auto self-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAccent}
                  className="h-8 gap-1.5 border-white/[0.08] bg-white/[0.02] text-[10px] uppercase tracking-[0.10em] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to default
                </Button>
              </div>
            </div>

            {/* Custom-hex readout */}
            <div className="flex flex-col gap-2 rounded-md border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="ive-mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      settings.accentOverride === "gold" ? "#C9A84C" : settings.accentOverride,
                  }}
                />
                Current value
              </div>
              {isCustomAccent ? (
                <input
                  readOnly
                  value={settings.accentOverride}
                  aria-label="Current custom accent hex value"
                  className="ive-mono w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-foreground/85 outline-none sm:w-44"
                />
              ) : (
                <code className="ive-mono text-[11px] text-foreground/85">
                  {settings.accentOverride === "gold"
                    ? '"gold" → #C9A84C'
                    : settings.accentOverride}
                </code>
              )}
            </div>

            {/* Live preview — shows the accent applied to sample UI elements */}
            <div className="rounded-md border border-white/[0.06] bg-white/[0.01] p-3">
              <div className="ive-mono mb-2 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: currentAccentHex }} />
                Live Preview
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="ive-mono rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                  style={{ borderColor: `${currentAccentHex}40`, background: `${currentAccentHex}10`, color: currentAccentHex }}
                >
                  TAG
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: currentAccentHex, boxShadow: `0 0 6px ${currentAccentHex}80` }}
                />
                <div className="h-[2px] w-16 rounded-full" style={{ background: currentAccentHex }} />
                <button
                  type="button"
                  className="ive-mono rounded-md border px-2 py-0.5 text-[9px] font-semibold"
                  style={{ borderColor: `${currentAccentHex}50`, background: `${currentAccentHex}15`, color: currentAccentHex }}
                >
                  Sample
                </button>
                <span className="ive-mono text-[9px]" style={{ color: currentAccentHex }}>
                  applied globally
                </span>
              </div>
            </div>

            <p className="ive-mono text-[9.5px] leading-relaxed text-muted-foreground/60">
              Override the global accent color used in the header, sidebar active items, and panel
              underlines. The frozen engineering colors (proven/blocked/pending) are not affected.
            </p>
          </div>
        </SectionShell>

        {/* -------------------------------------------------------- *
         * 4. Keyboard Shortcuts Reference
         * -------------------------------------------------------- */}
        <SectionShell
          icon={KeyboardIcon}
          iconColor="#3d9bff"
          title="Keyboard Shortcuts"
          description="Quick reference for the workspace keyboard navigation layer."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {SHORTCUTS.map((sc) => (
              <div
                key={sc.label}
                className="flex items-center justify-between gap-3 rounded-md border border-white/[0.04] bg-white/[0.015] px-3 py-2 transition-colors hover:border-white/[0.08]"
              >
                <span className="ive-mono min-w-0 truncate text-[10px] text-muted-foreground/80">
                  {sc.label}
                </span>
                <div className="flex flex-none items-center gap-1">{sc.keys}</div>
              </div>
            ))}
          </div>
        </SectionShell>

        {/* -------------------------------------------------------- *
         * 5. Data & Privacy
         * -------------------------------------------------------- */}
        <SectionShell
          icon={Database}
          iconColor="#3dffb0"
          title="Data & Privacy"
          description="Where preferences live and how to clear them."
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-md border border-white/[0.06] bg-white/[0.015] p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--ive-proven)]" />
              <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground/80">
                Settings are stored in your browser&apos;s localStorage (key:{" "}
                <code className="text-foreground/90">{SETTINGS_KEY}</code>). No data is sent to any
                server. Clearing your browser storage resets all preferences.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.015] p-3.5">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-foreground">Reset all settings</div>
                <p className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/70">
                  Restore boot, animation, widget defaults, and accent to factory values.
                </p>
              </div>
              <Button
                type="button"
                variant={resetArmed ? "destructive" : "outline"}
                size="sm"
                onClick={handleReset}
                onMouseLeave={() => resetArmed && setResetArmed(false)}
                onBlur={() => resetArmed && setResetArmed(false)}
                className="h-8 gap-1.5 text-[10px] uppercase tracking-[0.10em]"
              >
                <RotateCcw className="h-3 w-3" />
                {resetArmed ? "Click again to confirm" : "Reset all settings"}
              </Button>
            </div>
          </div>
        </SectionShell>

        {/* -------------------------------------------------------- *
         * 6. Footer
         * -------------------------------------------------------- */}
        <footer className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="ive-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
              IVE Settings v1 · Preferences are local to this browser.
            </div>
            <div className="ive-mono flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-proven)]" />
              persisted · ive-settings-v1
            </div>
          </div>

          <details className="group mt-3 rounded-md border border-white/[0.04] bg-black/20">
            <summary className="ive-mono flex cursor-pointer select-none items-center justify-between px-3 py-2 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-foreground">
              <span>Current settings JSON · transparency view</span>
              <span className="text-[8.5px] text-muted-foreground/50 group-open:hidden">expand</span>
              <span className="hidden text-[8.5px] text-muted-foreground/50 group-open:inline">
                collapse
              </span>
            </summary>
            <pre className="ive-mono max-h-72 overflow-auto border-t border-white/[0.04] px-3 py-3 text-[10px] leading-relaxed text-[var(--ive-proven)]/85 ive-scroll">
{settingsJson}
            </pre>
          </details>
        </footer>
      </div>
    </PanelFrame>
  );
}
