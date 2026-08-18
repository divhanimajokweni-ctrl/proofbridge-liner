"use client";

/**
 * VVU brand mark — three interlocking rings in gold.
 * Matches the deployed dashboard's top-left logo.
 */

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

export function VvuLogo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vvu-gold-grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="oklch(0.82 0.16 80.5)" />
          <stop offset="50%" stopColor="oklch(0.74 0.18 75)" />
          <stop offset="100%" stopColor="oklch(0.68 0.15 70)" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle
        cx="32"
        cy="32"
        r="29"
        stroke="url(#vvu-gold-grad)"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Three interlocking rings — Borromean-style, gold */}
      <g
        stroke="url(#vvu-gold-grad)"
        strokeWidth="2.4"
        fill="none"
        opacity="0.95"
      >
        {/* ring 1 — top */}
        <circle cx="32" cy="22" r="9" />
        {/* ring 2 — bottom-left */}
        <circle cx="23" cy="38" r="9" />
        {/* ring 3 — bottom-right */}
        <circle cx="41" cy="38" r="9" />
      </g>
      {/* Center V mark */}
      <path
        d="M 24 28 L 32 44 L 40 28"
        stroke="oklch(0.985 0 0)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
