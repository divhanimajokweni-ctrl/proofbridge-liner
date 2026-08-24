"use client";

/**
 * Pure-CSS holographic icosahedron used as the platform sigil.
 * Three concentric rotating rings + a glowing core suggest the
 * "Hydro-Bayesian Kernel" interplay of physics + GP inference.
 */
export function HoloSigil({ size = 120 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full ive-anim-spin-slow"
        style={{
          border: "1px solid oklch(0.82 0.16 75 / 45%)",
          boxShadow: "0 0 24px -4px oklch(0.82 0.16 75 / 45%)",
        }}
      >
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "oklch(0.88 0.18 80)",
            boxShadow: "0 0 12px 2px oklch(0.82 0.16 75 / 80%)",
          }}
        />
      </div>
      {/* Middle ring */}
      <div
        className="absolute inset-2 rounded-full ive-anim-spin-rev"
        style={{ border: "1px dashed oklch(0.72 0.17 162 / 55%)" }}
      >
        <div
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "oklch(0.78 0.17 162)",
            boxShadow: "0 0 10px 2px oklch(0.72 0.17 162 / 80%)",
          }}
        />
      </div>
      {/* Inner ring (jade) */}
      <div
        className="absolute inset-5 rounded-full ive-anim-spin-slow"
        style={{ border: "1px solid oklch(0.7 0.18 145 / 50%)" }}
      />
      {/* Core */}
      <div
        className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 ive-anim-pulse-gold"
        style={{
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: 999,
          background:
            "radial-gradient(circle, oklch(0.95 0.16 75) 0%, oklch(0.7 0.16 75 / 60%) 60%, transparent 100%)",
        }}
      />
      {/* Crosshair axes */}
      <div
        className="absolute left-1/2 top-0 h-full"
        style={{
          width: 1,
          background: "linear-gradient(180deg, transparent, oklch(0.82 0.16 75 / 40%), transparent)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="absolute left-0 top-1/2 w-full"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, oklch(0.82 0.16 75 / 40%), transparent)",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
