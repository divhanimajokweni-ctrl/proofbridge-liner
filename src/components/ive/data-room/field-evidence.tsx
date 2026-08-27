'use client';

/**
 * Field Evidence — Data Room · VVU IVE
 * --------------------------------------
 * Construction photo gallery + vision analysis panel. Each "photo" is an
 * inline SVG placeholder (no external network required) representing a
 * piece of water-infrastructure imagery (pipe joint, valve, DMA inlet,
 * hydrant, manhole, segment break). Clicking a photo loads its vision
 * pass: detected features with confidence %, correlation to EIS evidence,
 * and a mock attestation hash.
 *
 * Panels:
 *   1. Photo Gallery (left)  — grid of 6 thumbnails with location + date
 *   2. Vision Analysis       — selected photo metadata + detected features
 *      + correlation + attestation hash
 *
 * All imagery is SIMULATION / SYNTHETIC — no real photographs, no real
 * vision model. The detection results are deterministic mock data.
 */

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Camera,
  ScanEye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  Hash,
  MapPin,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

type FeatureStatus = 'DETECTED' | 'NONE' | 'COMPROMISED';

interface VisionFeature {
  label: string;
  status: FeatureStatus;
  confidence: number; // 0-1
}

interface FieldPhoto {
  id: string;
  title: string;
  location: string;
  date: string;
  segment: string;
  svg: 'pipe-joint' | 'valve' | 'dma-inlet' | 'hydrant' | 'manhole' | 'segment-break';
  features: VisionFeature[];
  correlation: string;
  attestationHash: string;
}

// ─── Mock photos ──────────────────────────────────────────────────────

const PHOTOS: FieldPhoto[] = [
  {
    id: 'PH-001',
    title: 'Pipe Joint S-142',
    location: 'Segment S-142 · Walmer',
    date: '2026-08-12 05:10 UTC',
    segment: 'S-142',
    svg: 'pipe-joint',
    features: [
      { label: 'Surface moisture', status: 'DETECTED', confidence: 0.87 },
      { label: 'Pipe corrosion', status: 'NONE', confidence: 0.94 },
      { label: 'Joint integrity', status: 'COMPROMISED', confidence: 0.72 },
      { label: 'Ground discoloration', status: 'DETECTED', confidence: 0.91 },
    ],
    correlation: 'Correlates with FLOW-DMA07-INLET anomaly at 04:00 UTC (+14.4% deviation)',
    attestationHash: '0xa4f8e1c7b2d95a3f8e0c1d2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f',
  },
  {
    id: 'PH-002',
    title: 'DMA-7 Inlet Chamber',
    location: 'DMA-7 Inlet · Govan Mbeki',
    date: '2026-08-12 04:30 UTC',
    segment: 'INLET-7',
    svg: 'dma-inlet',
    features: [
      { label: 'Surface moisture', status: 'NONE', confidence: 0.92 },
      { label: 'Pipe corrosion', status: 'DETECTED', confidence: 0.68 },
      { label: 'Joint integrity', status: 'NONE', confidence: 0.97 },
      { label: 'Ground discoloration', status: 'NONE', confidence: 0.89 },
    ],
    correlation: 'Inlet pressure trace matches SCADA readings (46.1 m ± 0.2)',
    attestationHash: '0x9e2a4f8c1b3d7e6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f',
  },
  {
    id: 'PH-003',
    title: 'Valve V-08 Body',
    location: 'Valve V-08 · Kabega Park',
    date: '2026-08-12 04:45 UTC',
    segment: 'V-08',
    svg: 'valve',
    features: [
      { label: 'Surface moisture', status: 'DETECTED', confidence: 0.79 },
      { label: 'Pipe corrosion', status: 'DETECTED', confidence: 0.81 },
      { label: 'Joint integrity', status: 'NONE', confidence: 0.95 },
      { label: 'Ground discoloration', status: 'NONE', confidence: 0.88 },
    ],
    correlation: 'Valve position log confirms NORMAL (no operational cause)',
    attestationHash: '0xc1d4b3a2f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b',
  },
  {
    id: 'PH-004',
    title: 'Hydrant H-12 Cap',
    location: 'Hydrant H-12 · Newton Park',
    date: '2026-08-12 05:00 UTC',
    segment: 'H-12',
    svg: 'hydrant',
    features: [
      { label: 'Surface moisture', status: 'NONE', confidence: 0.91 },
      { label: 'Pipe corrosion', status: 'NONE', confidence: 0.93 },
      { label: 'Joint integrity', status: 'NONE', confidence: 0.96 },
      { label: 'Ground discoloration', status: 'DETECTED', confidence: 0.71 },
    ],
    correlation: 'No anomaly correlates — control observation (background)',
    attestationHash: '0x7b3d4e6f8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
  },
  {
    id: 'PH-005',
    title: 'Manhole MH-19 Lid',
    location: 'Manhole MH-19 · Central',
    date: '2026-08-12 05:25 UTC',
    segment: 'MH-19',
    svg: 'manhole',
    features: [
      { label: 'Surface moisture', status: 'DETECTED', confidence: 0.84 },
      { label: 'Pipe corrosion', status: 'NONE', confidence: 0.9 },
      { label: 'Joint integrity', status: 'COMPROMISED', confidence: 0.66 },
      { label: 'Ground discoloration', status: 'DETECTED', confidence: 0.78 },
    ],
    correlation: 'Moisture pattern aligns with acoustic anomaly at S-142 (700 m S)',
    attestationHash: '0xf3b2a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
  },
  {
    id: 'PH-006',
    title: 'Segment Break SB-04',
    location: 'Break SB-04 · Kragga Kamma',
    date: '2026-08-12 05:40 UTC',
    segment: 'SB-04',
    svg: 'segment-break',
    features: [
      { label: 'Surface moisture', status: 'DETECTED', confidence: 0.93 },
      { label: 'Pipe corrosion', status: 'DETECTED', confidence: 0.86 },
      { label: 'Joint integrity', status: 'COMPROMISED', confidence: 0.88 },
      { label: 'Ground discoloration', status: 'DETECTED', confidence: 0.95 },
    ],
    correlation: 'High-confidence leak signature — flagged as INDEPENDENT evidence',
    attestationHash: '0x5d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
  },
];

// ─── Inline SVG "photos" ─────────────────────────────────────────────

function PhotoSvg({ kind }: { kind: FieldPhoto['svg'] }) {
  // Each variant renders a distinct dark abstract scene with a label.
  const palettes: Record<
    FieldPhoto['svg'],
    { primary: string; accent: string; label: string }
  > = {
    'pipe-joint': { primary: '#1e3140', accent: '#00d4ff', label: 'PIPE-JOINT' },
    'dma-inlet': { primary: '#1a2a36', accent: '#00ff88', label: 'DMA-INLET' },
    valve: { primary: '#2a1e36', accent: '#ffb800', label: 'VALVE' },
    hydrant: { primary: '#362a1e', accent: '#ff4d4d', label: 'HYDRANT' },
    manhole: { primary: '#1e2a36', accent: '#22d3ee', label: 'MANHOLE' },
    'segment-break': { primary: '#361e1e', accent: '#ff4d4d', label: 'BREAK' },
  };
  const p = palettes[kind];

  return (
    <svg
      viewBox="0 0 400 300"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${kind} placeholder`}
    >
      <defs>
        <linearGradient id={`bg-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#060a10" />
          <stop offset="100%" stopColor={p.primary} />
        </linearGradient>
        <pattern
          id={`grid-${kind}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(0,212,255,0.08)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <rect width="400" height="300" fill={`url(#bg-${kind})`} />
      <rect width="400" height="300" fill={`url(#grid-${kind})`} />

      {/* Distinct shape per kind */}
      {kind === 'pipe-joint' && (
        <>
          <circle cx="200" cy="150" r="80" fill="none" stroke={p.accent} strokeWidth="6" opacity="0.7" />
          <circle cx="200" cy="150" r="60" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.4" />
          <path d="M 120 150 Q 200 130 280 150" stroke="#00ff88" strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="180" cy="160" r="4" fill="#00ff88" opacity="0.9" />
        </>
      )}
      {kind === 'dma-inlet' && (
        <>
          <rect x="100" y="100" width="200" height="100" fill="none" stroke={p.accent} strokeWidth="4" opacity="0.6" />
          <line x1="100" y1="150" x2="300" y2="150" stroke={p.accent} strokeWidth="2" opacity="0.4" />
          <line x1="200" y1="100" x2="200" y2="200" stroke={p.accent} strokeWidth="2" opacity="0.4" />
          <text x="200" y="240" textAnchor="middle" fill={p.accent} fontSize="14" fontFamily="monospace" opacity="0.7">INLET-7</text>
        </>
      )}
      {kind === 'valve' && (
        <>
          <circle cx="200" cy="150" r="50" fill="none" stroke={p.accent} strokeWidth="4" opacity="0.6" />
          <line x1="160" y1="150" x2="240" y2="150" stroke={p.accent} strokeWidth="4" opacity="0.5" />
          <line x1="200" y1="100" x2="200" y2="200" stroke={p.accent} strokeWidth="3" opacity="0.5" />
          <circle cx="200" cy="150" r="8" fill={p.accent} opacity="0.7" />
        </>
      )}
      {kind === 'hydrant' && (
        <>
          <rect x="180" y="100" width="40" height="100" fill="none" stroke={p.accent} strokeWidth="4" opacity="0.6" />
          <circle cx="200" cy="100" r="12" fill="none" stroke={p.accent} strokeWidth="3" opacity="0.6" />
          <rect x="170" y="180" width="60" height="20" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.4" />
        </>
      )}
      {kind === 'manhole' && (
        <>
          <circle cx="200" cy="150" r="90" fill="none" stroke={p.accent} strokeWidth="4" opacity="0.6" />
          <circle cx="200" cy="150" r="60" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.4" />
          <line x1="110" y1="150" x2="290" y2="150" stroke={p.accent} strokeWidth="1" opacity="0.3" />
          <line x1="200" y1="60" x2="200" y2="240" stroke={p.accent} strokeWidth="1" opacity="0.3" />
        </>
      )}
      {kind === 'segment-break' && (
        <>
          <path d="M 80 150 L 180 130 L 220 170 L 320 150" stroke={p.accent} strokeWidth="6" fill="none" opacity="0.7" />
          <path d="M 180 130 L 220 170" stroke="#ff4d4d" strokeWidth="4" opacity="0.9" />
          <circle cx="200" cy="150" r="6" fill="#ff4d4d" />
          <text x="200" y="240" textAnchor="middle" fill="#ff4d4d" fontSize="14" fontFamily="monospace" opacity="0.8">LEAK</text>
        </>
      )}

      {/* Top label band */}
      <rect x="0" y="0" width="400" height="22" fill="rgba(6,10,16,0.8)" />
      <text x="10" y="15" fill={p.accent} fontSize="11" fontFamily="monospace" opacity="0.9">
        {p.label}
      </text>
      <text x="390" y="15" textAnchor="end" fill="#5b7280" fontSize="10" fontFamily="monospace">
        SIMULATION
      </text>

      {/* Bottom corner hash */}
      <text x="10" y="290" fill="#5b7280" fontSize="9" fontFamily="monospace">
        VVU IVE · FIELD EVIDENCE · SYNTHETIC
      </text>
    </svg>
  );
}

// ─── Feature row renderer ─────────────────────────────────────────────

function FeatureRow({ feature }: { feature: VisionFeature }) {
  const meta =
    feature.status === 'DETECTED'
      ? { color: 'k-warn', badge: 'k-badge-warn', icon: AlertTriangle }
      : feature.status === 'COMPROMISED'
        ? { color: 'k-danger', badge: 'k-badge-danger', icon: XCircle }
        : { color: 'k-pass', badge: 'k-badge-pass', icon: CheckCircle2 };
  const Icon = meta.icon;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--k-line)]/30 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
        <span className="text-xs k-fg-bright truncate">{feature.label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] k-dim tabular-nums">
          {(feature.confidence * 100).toFixed(0)}%
        </span>
        <span className={`k-badge ${meta.badge} text-[9px]`}>
          {feature.status}
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function FieldEvidence() {
  const [selectedId, setSelectedId] = useState<string>(PHOTOS[0].id);
  const selected =
    PHOTOS.find((p) => p.id === selectedId) ?? PHOTOS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 p-4">
      {/* Left: photo gallery */}
      <div className="flex flex-col gap-3">
        <div className="k-card">
          <div className="k-card-title">
            <Camera className="h-4 w-4" /> FIELD EVIDENCE GALLERY
          </div>
          <p className="text-[11px] k-dim mb-3">
            6 construction-site photos captured during 2026-08-12 field
            inspection. Click a thumbnail to load its vision pass.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {PHOTOS.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedId(photo.id)}
                className={`group relative rounded-md overflow-hidden border transition-all hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--k-cyan-bright)] ${
                  selectedId === photo.id
                    ? 'border-[var(--k-cyan-bright)] k-glow-cyan'
                    : 'border-[var(--k-line-strong)]'
                }`}
                aria-label={`Open ${photo.title} for vision analysis`}
              >
                <div className="aspect-[4/3] bg-[var(--k-bg-elevated)]">
                  <PhotoSvg kind={photo.svg} />
                </div>
                <div className="px-2 py-1.5 bg-[var(--k-panel-2)] border-t border-[var(--k-line)]">
                  <p className="text-[11px] font-bold k-fg-bright truncate">
                    {photo.title}
                  </p>
                  <p className="text-[9px] k-dim uppercase tracking-wider truncate">
                    {photo.location}
                  </p>
                </div>
                {selectedId === photo.id && (
                  <span className="absolute top-1 right-1 k-badge k-badge-process text-[8px] bg-[var(--k-panel-2)]">
                    SELECTED
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: vision analysis */}
      <div className="flex flex-col gap-4">
        <div className="k-card">
          <div className="k-card-title">
            <ScanEye className="h-4 w-4" /> VISION ANALYSIS
            <span className="ml-auto k-badge k-badge-pass normal-case tracking-normal text-[9px]">
              <CheckCircle2 className="h-3 w-3" /> VISION PASS
            </span>
          </div>
          <Separator className="mb-3" />

          {/* Photo header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-24 h-18 sm:w-32 sm:h-24 shrink-0 rounded border border-[var(--k-line-strong)] overflow-hidden">
              <PhotoSvg kind={selected.svg} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold k-fg-bright uppercase tracking-wide">
                {selected.title}
              </h3>
              <p className="text-xs k-cyan mb-1.5">{selected.id}</p>
              <div className="flex flex-wrap gap-3 text-[10px] k-dim uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selected.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selected.date}
                </span>
              </div>
            </div>
          </div>

          <Separator className="mb-3" />

          {/* Detected features */}
          <div>
            <p className="text-[10px] k-dim uppercase tracking-widest mb-2">
              Detected Features
            </p>
            <div>
              {selected.features.map((f) => (
                <FeatureRow key={f.label} feature={f} />
              ))}
            </div>
          </div>

          <Separator className="my-3" />

          {/* Correlation */}
          <div>
            <p className="text-[10px] k-dim uppercase tracking-widest mb-1.5">
              Correlation · EIS Evidence Chain
            </p>
            <div className="flex items-start gap-2 p-2.5 border border-[var(--k-cyan-bright)]/30 bg-[rgba(0,212,255,0.04)] rounded-md">
              <Link2 className="h-3.5 w-3.5 k-cyan shrink-0 mt-0.5" />
              <p className="text-xs k-fg-bright leading-relaxed">
                {selected.correlation}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Attestation hash */}
          <div>
            <p className="text-[10px] k-dim uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Attestation Hash
            </p>
            <div className="flex items-center gap-2 p-2 bg-[var(--k-bg-elevated)] border border-[var(--k-line)] rounded-md">
              <Hash className="h-3.5 w-3.5 k-pass shrink-0" />
              <code className="text-[10px] k-pass font-mono break-all">
                {selected.attestationHash}
              </code>
            </div>
            <p className="text-[9px] k-dim mt-1 uppercase tracking-widest">
              SHA-256 · VISION MODEL: VVU-FIELD-v0.1 · SIMULATION · NOT REAL
              VISION PASS
            </p>
          </div>
        </div>

        {/* Footer summary */}
        <div className="k-card">
          <div className="k-card-title">
            <Camera className="h-4 w-4" /> GALLERY SUMMARY
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SummaryTile label="PHOTOS" value={PHOTOS.length.toString()} />
            <SummaryTile
              label="DETECTIONS"
              value={PHOTOS.reduce(
                (sum, p) =>
                  sum +
                  p.features.filter((f) => f.status !== 'NONE').length,
                0,
              ).toString()}
            />
            <SummaryTile
              label="HIGH-CONF"
              value={PHOTOS.reduce(
                (sum, p) =>
                  sum +
                  p.features.filter(
                    (f) => f.status !== 'NONE' && f.confidence >= 0.8,
                  ).length,
                0,
              ).toString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 rounded border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
      <span className="text-lg font-bold k-fg-bright tabular-nums">{value}</span>
      <span className="text-[10px] k-dim uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
