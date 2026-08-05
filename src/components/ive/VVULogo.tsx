"use client";

import { motion } from "framer-motion";

/**
 * VVULogo
 * -------
 * The recovered VVU mark: three interlocking rings (sage, ember, bone)
 * with a gold core. Used in the boot sequence, header, and boot loader.
 */
export function VVULogo({
  size = 64,
  animated = false,
  showCore = true,
}: {
  size?: number;
  animated?: boolean;
  showCore?: boolean;
}) {
  const rings = [
    { cx: 36, cy: 40, r: 15, stroke: "#8A9A5B" },
    { cx: 64, cy: 40, r: 15, stroke: "#CC7722" },
    { cx: 50, cy: 64, r: 15, stroke: "#E2E3DB" },
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className="flex-none"
    >
      {rings.map((ring, i) => (
        <motion.circle
          key={i}
          cx={ring.cx}
          cy={ring.cy}
          r={ring.r}
          stroke={ring.stroke}
          strokeWidth={3.5}
          initial={animated ? { opacity: 0, scale: 0.4 } : false}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.7, delay: 0.15 * i, ease: "easeOut" }}
          style={{ transformOrigin: `${ring.cx}px ${ring.cy}px` }}
        />
      ))}
      {showCore && (
        <motion.circle
          cx={50}
          cy={48}
          r={3}
          fill="#C9A84C"
          initial={animated ? { opacity: 0 } : false}
          animate={animated ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.7 }}
        />
      )}
    </svg>
  );
}
