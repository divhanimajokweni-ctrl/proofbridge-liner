import {
  VVUTripleRing,
  UbuntuPoolsTriangle,
  ProofBridgeAnchor,
  AIRKernelBadge,
  SafeKrypteShield,
  SafeLinerArray,
} from './BrandMarks';

const marks = [
  { Component: VVUTripleRing, label: 'VVU' },
  { Component: UbuntuPoolsTriangle, label: 'Ubuntu Pools' },
  { Component: ProofBridgeAnchor, label: 'ProofBridge' },
  { Component: AIRKernelBadge, label: 'AIR Kernel' },
  { Component: SafeKrypteShield, label: 'SafeKrypte' },
  { Component: SafeLinerArray, label: 'SafeLiner' },
];

export default function BrandLogoRow({ size = 48, gap = 16 }: { size?: number; gap?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
      }}
    >
      {marks.map(({ Component, label }) => (
        <span
          key={label}
          style={{
            display: 'inline-flex',
            transition: 'transform 150ms ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Component size={size} />
        </span>
      ))}
    </div>
  );
}
