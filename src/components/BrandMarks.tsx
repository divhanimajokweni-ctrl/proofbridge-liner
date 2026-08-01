interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function VVUTripleRing({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-gold)' }}
    >
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="25" cy="23" r="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function UbuntuPoolsTriangle({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-green)' }}
    >
      <polygon
        points="24,6 44,42 4,42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ProofBridgeAnchor({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-cyan)' }}
    >
      <line x1="24" y1="6" x2="24" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="34" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 40 Q14 28 24 28 Q34 28 34 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function AIRKernelBadge({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-crimson-bright)' }}
    >
      <polygon
        points="24,3 44,14 44,34 24,45 4,34 4,14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SafeKrypteShield({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-purple)' }}
    >
      <path
        d="M8 6 H40 V22 Q40 38 24 45 Q8 38 8 22 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="23" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="29" x2="27" y2="29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SafeLinerArray({ size = 48, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--color-blue)' }}
    >
      <rect x="4" y="6" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="19" y="6" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="6" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="21" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="19" y="21" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="21" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="36" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="19" y="36" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="36" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
