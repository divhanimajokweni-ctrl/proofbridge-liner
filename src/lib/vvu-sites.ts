// Per-site terrain configurations for the VVU Spatial Digital Twin.
// Each site has different node coordinates (ENU mm) and a site-specific accent.

export interface SiteConfig {
  slug: string;
  name: string;
  label: string;
  accent: string;
  coords: { lat: number; lon: number };
  hudLabel: string;
  // Stylised isometric pin positions (gx, gy, gz) for the terrain SVG.
  // Different sites have different layouts reflecting their physical topology.
  pins: { id: string; label: string; gx: number; gy: number; gz: number }[];
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  'gqeberha-beachfront-rd': {
    slug: 'gqeberha-beachfront-rd',
    name: 'Gqeberha Beachfront R&D',
    label: 'Gqeberha',
    accent: '#C46D1A',
    coords: { lat: -33.9608, lon: 25.6022 },
    hudLabel: 'GQEBERHA · HUMEWOOD TEST GROUNDS',
    pins: [
      { id: 'inlet', label: 'Inlet Meter Pod', gx: -2.4, gy: -1.6, gz: 0.62 },
      { id: 'outlet', label: 'Outlet Meter Pod', gx: 2.4, gy: 1.6, gz: 0.6 },
      { id: 'pipe', label: 'Pressure Pipe', gx: 0, gy: 0, gz: 0.48 },
      { id: 'cabinet', label: 'Edge Cabinet', gx: 0.4, gy: -2.2, gz: 0.32 },
      { id: 'battery', label: 'Power Backup', gx: -0.4, gy: 2.2, gz: 0.3 },
      { id: 'mast', label: 'Telemetry Mast', gx: -2.6, gy: 0.6, gz: 0.92 },
      { id: 'beacon', label: 'Top Beacon', gx: 2.6, gy: -0.6, gz: 0.98 },
      { id: 'skidN', label: 'N Datum Skid', gx: 0.2, gy: -2.6, gz: 0.12 },
      { id: 'skidS', label: 'S Datum Skid', gx: -0.2, gy: 2.6, gz: 0.12 },
    ],
  },
  'anglo-mogalakwena': {
    slug: 'anglo-mogalakwena',
    name: 'Anglo American Mogalakwena',
    label: 'Mogalakwena',
    accent: '#F3E38A',
    coords: { lat: -24.18, lon: 28.81 },
    hudLabel: 'MOGALAKWENA · LIMPOPO PLATINUM BELT',
    pins: [
      { id: 'inlet', label: 'Inlet Valve', gx: -2.2, gy: -1.8, gz: 0.7 },
      { id: 'outlet', label: 'Outlet Valve', gx: 2.2, gy: 1.4, gz: 0.65 },
      { id: 'pipe', label: 'Slurry Line', gx: 0, gy: 0.2, gz: 0.52 },
      { id: 'cabinet', label: 'Edge Node', gx: 0.6, gy: -2.0, gz: 0.4 },
      { id: 'battery', label: 'Solar Bank', gx: -0.6, gy: 2.4, gz: 0.35 },
      { id: 'mast', label: 'Comms Tower', gx: -2.4, gy: 0.8, gz: 0.95 },
      { id: 'beacon', label: 'Tailings Marker', gx: 2.4, gy: -0.8, gz: 0.85 },
      { id: 'skidN', label: 'North Skid', gx: 0.4, gy: -2.4, gz: 0.15 },
      { id: 'skidS', label: 'South Skid', gx: -0.4, gy: 2.8, gz: 0.1 },
    ],
  },
  'sibanye-marikana': {
    slug: 'sibanye-marikana',
    name: 'Sibanye-Stillwater Marikana',
    label: 'Marikana',
    accent: '#6B8A40',
    coords: { lat: -25.67, lon: 27.51 },
    hudLabel: 'MARICANA · WESTERN BUSHVELD',
    pins: [
      { id: 'inlet', label: 'Borehole Inlet', gx: -2.6, gy: -1.4, gz: 0.58 },
      { id: 'outlet', label: 'Decline Outlet', gx: 2.0, gy: 1.8, gz: 0.62 },
      { id: 'pipe', label: 'Rising Main', gx: 0.2, gy: -0.2, gz: 0.5 },
      { id: 'cabinet', label: 'Shaft Edge Node', gx: 0.2, gy: -2.4, gz: 0.38 },
      { id: 'battery', label: 'UPS Bank', gx: -0.8, gy: 2.0, gz: 0.32 },
      { id: 'mast', label: 'Ventilation Mast', gx: -2.2, gy: 0.4, gz: 0.9 },
      { id: 'beacon', label: 'Headgear Beacon', gx: 2.8, gy: -0.4, gz: 0.96 },
      { id: 'skidN', label: 'Surface Skid', gx: 0.6, gy: -2.8, gz: 0.14 },
      { id: 'skidS', label: 'Sub-level Skid', gx: -0.2, gy: 2.4, gz: 0.16 },
    ],
  },
};

export function getSiteConfig(slug: string): SiteConfig {
  return SITE_CONFIGS[slug] ?? SITE_CONFIGS['gqeberha-beachfront-rd'];
}
