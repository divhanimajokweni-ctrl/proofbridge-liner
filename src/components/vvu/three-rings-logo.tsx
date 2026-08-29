"use client";

import { cn } from "@/lib/utils";

interface ThreeRingsLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

export function ThreeRingsLogo({ size = 80, className, animated = false, glow = true }: ThreeRingsLogoProps) {
  const r = size * 0.28;
  const cx = size / 2;
  const cy = size / 2;
  const offset = r * 0.58;

  const rings = [
    { cx: cx, cy: cy - offset * 0.6, color: "#059669", colorLight: "#34d399", label: "Structural" },
    { cx: cx - offset * 0.85, cy: cy + offset * 0.5, color: "#D97706", colorLight: "#fbbf24", label: "Evidence" },
    { cx: cx + offset * 0.85, cy: cy + offset * 0.5, color: "#6B7280", colorLight: "#9ca3af", label: "Fidelity" },
  ];

  const strokeWidth = size * 0.045;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(className)}
    >
      <defs>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation={glow ? "2" : "0"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ring-inner-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>
      {rings.map((ring, i) => (
        <g key={i}>
          {/* Glow layer */}
          {glow && (
            <circle
              cx={ring.cx}
              cy={ring.cy}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth * 2}
              opacity={0.08}
              filter="url(#ring-inner-glow)"
            />
          )}
          {/* Main ring */}
          <circle
            cx={ring.cx}
            cy={ring.cy}
            r={r}
            fill="none"
            stroke={ring.color}
            strokeWidth={strokeWidth}
            opacity={0.85}
            strokeLinecap="round"
            className={cn(
              animated && "transition-all duration-700",
              animated && i === 0 && "animate-[spin_20s_linear_infinite]",
              animated && i === 1 && "animate-[spin_25s_linear_infinite_reverse]",
              animated && i === 2 && "animate-[spin_30s_linear_infinite]"
            )}
            style={
              animated
                ? {
                    transformOrigin: `${ring.cx}px ${ring.cy}px`,
                  }
                : undefined
            }
          />
          {/* Highlight arc */}
          <circle
            cx={ring.cx}
            cy={ring.cy}
            r={r}
            fill="none"
            stroke={ring.colorLight}
            strokeWidth={strokeWidth * 0.5}
            opacity={0.3}
            strokeDasharray={`${r * 0.8} ${r * 5.2}`}
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.02} fill="currentColor" opacity={0.4} />
    </svg>
  );
}
