"use client";

import { useState } from "react";
import { SlidersHorizontal, RotateCcw, AlertTriangle } from "lucide-react";
import type { EISConfiguration } from "@/lib/evidence/EISv1Engine";

interface DMAConfigurationPanelProps {
  dmaId: string;
  currentConfig: EISConfiguration;
  onConfigChange: (newConfig: EISConfiguration) => void;
}

/**
 * DMA Calibration Panel — control surface for EIS v1.0 thresholds.
 *
 * Every DMA has a different hydraulic profile. An industrial zone with
 * factories will have massive legitimate flow spikes (high noise), while a
 * residential cul-de-sac will have very predictable, tight flow patterns
 * (low noise). A hardcoded 10% threshold will cause false positives in the
 * former and missed leaks in the latter.
 *
 * This panel exposes the EIS v1.0 parameters so engineers can dynamically
 * tune the engine to the specific DMA's noise profile.
 */
export function DMAConfigurationPanel({
  dmaId,
  currentConfig,
  onConfigChange,
}: DMAConfigurationPanelProps) {
  const [config, setConfig] = useState<EISConfiguration>(currentConfig);

  const handleChange = (key: keyof EISConfiguration, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const resetToDefault = () => {
    const defaults: EISConfiguration = {
      flowDeviationThreshold: 0.10,
      pressureDropThreshold: 0.05,
      correlationTimeWindowMs: 3600000,
    };
    setConfig(defaults);
    onConfigChange(defaults);
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 font-mono text-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 p-3">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <SlidersHorizontal className="h-4 w-4" />
          <h2 className="text-xs uppercase tracking-wider">DMA Calibration: {dmaId}</h2>
        </div>
        <button
          onClick={resetToDefault}
          className="text-slate-400 transition-colors hover:text-white"
          title="Reset to Defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-6 p-4">
        {/* Flow Deviation Threshold */}
        <div>
          <div className="mb-2 flex items-end justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Flow Anomaly Threshold
            </label>
            <span className="font-bold text-emerald-400">
              {(config.flowDeviationThreshold * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mb-2 text-[10px] text-slate-500">
            Deviation from baseline required to flag an anomaly.
          </p>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={config.flowDeviationThreshold}
            onChange={(e) =>
              handleChange("flowDeviationThreshold", parseFloat(e.target.value))
            }
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Pressure Drop Threshold */}
        <div>
          <div className="mb-2 flex items-end justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Pressure Drop Threshold
            </label>
            <span className="font-bold text-sky-400">
              {(config.pressureDropThreshold * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mb-2 text-[10px] text-slate-500">
            Pressure decrease required to establish hydraulic correlation.
          </p>
          <input
            type="range"
            min={0.01}
            max={0.3}
            step={0.01}
            value={config.pressureDropThreshold}
            onChange={(e) =>
              handleChange("pressureDropThreshold", parseFloat(e.target.value))
            }
            className="w-full accent-sky-500"
          />
        </div>

        {/* Time Window */}
        <div>
          <div className="mb-2 flex items-end justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Correlation Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1440}
                value={config.correlationTimeWindowMs / 60000}
                onChange={(e) =>
                  handleChange(
                    "correlationTimeWindowMs",
                    parseInt(e.target.value) * 60000
                  )
                }
                className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-amber-400 outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500">min</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Maximum time gap between flow and pressure events to be considered correlated.
          </p>
        </div>

        {/* High Noise Warning */}
        {config.flowDeviationThreshold > 0.25 && (
          <div className="mt-4 flex items-start gap-2 rounded border border-amber-900/50 bg-amber-950/30 p-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-[10px] leading-tight text-amber-400/80">
              High flow threshold selected (&gt;25%). System may fail to detect
              minor background leaks. Use only for highly volatile industrial DMAs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
