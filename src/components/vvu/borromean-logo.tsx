'use client';

// True Borromean 3-ring logo — interlinked, NOT concentric.
// All 3 rings meet at the center dot in triangle formation.
// Source: VVU brand spec · Borromean rings composition.

interface BorromeanLogoProps {
  size?: number;
  className?: string;
  showDot?: boolean;
  strokeWidth?: number;
}

export function BorromeanLogo({
  size = 28,
  className,
  showDot = true,
  strokeWidth = 4,
}: BorromeanLogoProps) {
  // Triangle formation around a shared center (50,50) in a 100×100 viewBox.
  // Top ring center: (50, 32), bottom-left: (34, 60), bottom-right: (66, 60)
  // Radius ~22 keeps them interlinked with overlap at the center.
  const r = 22;
  const top = { cx: 50, cy: 32 };
  const bl = { cx: 34, cy: 60 };
  const br = { cx: 66, cy: 60 };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ProofBridge Borromean logo"
    >
      {/* Top — Venture — Burnt Orange */}
      <circle cx={top.cx} cy={top.cy} r={r} stroke="#C46D1A" strokeWidth={strokeWidth} fill="none" />
      {/* Bottom-left — Ubuntu — Olive Green */}
      <circle cx={bl.cx} cy={bl.cy} r={r} stroke="#6B8A40" strokeWidth={strokeWidth} fill="none" />
      {/* Bottom-right — Vision — Cream/Yellow */}
      <circle cx={br.cx} cy={br.cy} r={r} stroke="#F3E38A" strokeWidth={strokeWidth} fill="none" />
      {/* Center dot — ProofBridge — Cream */}
      {showDot && <circle cx="50" cy="50" r="5" fill="#FFFAC2" />}
    </svg>
  );
}

export function BorromeanLogoMark({ size = 72, className }: { size?: number; className?: string }) {
  // Larger boot-screen variant with subtle glow.
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.18,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(196,109,26,0.18), rgba(107,138,64,0.10) 45%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      <BorromeanLogo size={size} strokeWidth={5} />
    </div>
  );
}
