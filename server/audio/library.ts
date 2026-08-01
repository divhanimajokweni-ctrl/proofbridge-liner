/**
 * server/audio/library.ts
 *
 * UbuntuLibrary — open-source asset catalog.
 * Every project from SafeSpace IDE and SafeDeck is automatically published here.
 * All assets are free forever for the community.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// ─── Configuration ──────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data', 'library');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');

// ─── Types ──────────────────────────────────────────────────────────────

export interface LibraryAsset {
  id: string;
  name: string;
  description: string;
  category: 'audio' | 'game' | 'tool' | 'template' | 'document';
  tags: string[];
  creator: string;
  source: 'safespace' | 'safedeck' | 'ubuntu-studio' | 'ubuntu-games';
  archiveFile: string;
  downloadCount: number;
  publishedAt: string;
  version: string;
}

export interface LibraryCatalog {
  version: string;
  lastUpdated: string;
  assets: LibraryAsset[];
}

// ─── Catalog Management ─────────────────────────────────────────────────

function ensureDirs() {
  [DATA_DIR, ASSETS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function loadCatalog(): LibraryCatalog {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
  } catch {
    const empty: LibraryCatalog = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      assets: [],
    };
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
}

function saveCatalog(catalog: LibraryCatalog) {
  ensureDirs();
  catalog.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
}

// ─── Public API ─────────────────────────────────────────────────────────

export function listAssets(filters?: {
  category?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): LibraryAsset[] {
  const catalog = loadCatalog();
  let assets = [...catalog.assets];

  if (filters?.category) {
    assets = assets.filter(a => a.category === filters.category);
  }
  if (filters?.source) {
    assets = assets.filter(a => a.source === filters.source);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    assets = assets.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term) ||
      a.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  // Sort by newest first
  assets.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;
  return assets.slice(offset, offset + limit);
}

export function getAsset(id: string): LibraryAsset | null {
  const catalog = loadCatalog();
  return catalog.assets.find(a => a.id === id) || null;
}

export function publishAsset(params: {
  name: string;
  description: string;
  category: LibraryAsset['category'];
  tags: string[];
  creator: string;
  source: LibraryAsset['source'];
  archiveFile: string;
  version?: string;
}): LibraryAsset {
  const catalog = loadCatalog();

  const asset: LibraryAsset = {
    id: `asset_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    name: params.name,
    description: params.description,
    category: params.category,
    tags: params.tags,
    creator: params.creator,
    source: params.source,
    archiveFile: params.archiveFile,
    downloadCount: 0,
    publishedAt: new Date().toISOString(),
    version: params.version || '1.0.0',
  };

  catalog.assets.push(asset);
  saveCatalog(catalog);

  console.log(`[UBUNTULIBRARY] Published: ${asset.name} (${asset.category}) from ${asset.source}`);
  return asset;
}

export function recordDownload(id: string) {
  const catalog = loadCatalog();
  const asset = catalog.assets.find(a => a.id === id);
  if (asset) {
    asset.downloadCount++;
    saveCatalog(catalog);
  }
}

export function getCatalogStats() {
  const catalog = loadCatalog();
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let totalDownloads = 0;

  for (const asset of catalog.assets) {
    byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    bySource[asset.source] = (bySource[asset.source] || 0) + 1;
    totalDownloads += asset.downloadCount;
  }

  return {
    totalAssets: catalog.assets.length,
    byCategory,
    bySource,
    totalDownloads,
    lastUpdated: catalog.lastUpdated,
  };
}

// ─── Seed Demo Assets ───────────────────────────────────────────────────

export function seedDemoAssets() {
  const catalog = loadCatalog();
  if (catalog.assets.length > 0) return; // Already seeded

  const demos = [
    {
      name: 'VVU Soft Clip Distortion',
      description: 'Analog-style saturation effect with cubic soft-clipping algorithm. Perfect for warming up digital mixes.',
      category: 'audio' as const,
      tags: ['distortion', 'saturation', 'effect', 'dsp'],
      creator: 'VVU Audio Lab',
      source: 'ubuntu-studio' as const,
      archiveFile: 'studio-vvu-softclip-distortion.tar.gz',
    },
    {
      name: 'VVU Stereo Delay',
      description: 'Stereo delay with feedback modulation and time sync. Clean digital delay for creative sound design.',
      category: 'audio' as const,
      tags: ['delay', 'echo', 'stereo', 'effect'],
      creator: 'VVU Audio Lab',
      source: 'ubuntu-studio' as const,
      archiveFile: 'studio-vvu-stereo-delay.tar.gz',
    },
    {
      name: 'VVU Basic Oscillator',
      description: 'Wavetable synthesizer with sine, saw, and square waveforms. FM modulation capable.',
      category: 'audio' as const,
      tags: ['synth', 'oscillator', 'wavetable', 'fm'],
      creator: 'VVU Audio Lab',
      source: 'ubuntu-studio' as const,
      archiveFile: 'studio-vvu-basic-oscillator.tar.gz',
    },
    {
      name: 'VVU Dynamic Compressor',
      description: 'RMS compressor with configurable attack, release, threshold, and makeup gain.',
      category: 'audio' as const,
      tags: ['compressor', 'dynamics', 'mastering', 'tool'],
      creator: 'VVU Audio Lab',
      source: 'ubuntu-studio' as const,
      archiveFile: 'studio-vvu-compressor.tar.gz',
    },
    {
      name: 'EconMesh Physics Core',
      description: 'High-performance 3D physics engine extension with gravity, collision, and velocity tracking.',
      category: 'game' as const,
      tags: ['physics', '3d', 'engine', 'c++'],
      creator: 'VVU Games Lab',
      source: 'ubuntu-games' as const,
      archiveFile: 'games-econmesh-physics-core.tar.gz',
    },
    {
      name: 'VVU Shader Pack',
      description: 'Collection of GLSL/Vulkan fragment shaders for post-processing effects.',
      category: 'game' as const,
      tags: ['shader', 'glsl', 'vulkan', 'post-processing'],
      creator: 'VVU Games Lab',
      source: 'ubuntu-games' as const,
      archiveFile: 'games-vvu-shader-pack.tar.gz',
    },
    {
      name: 'VVU Project Template',
      description: 'Starter template for new SafeSpace projects. Includes README, manifest, and CI config.',
      category: 'template' as const,
      tags: ['template', 'starter', 'boilerplate'],
      creator: 'VVU Platform',
      source: 'safespace' as const,
      archiveFile: 'safespace-vvu-project-template.tar.gz',
    },
    {
      name: 'UbuntuLearn C++ Guide',
      description: 'Complete C++ tutorial for audio plugin development. Covers JUCE, CLAP, and DSP basics.',
      category: 'document' as const,
      tags: ['tutorial', 'c++', 'juce', 'learning'],
      creator: 'UbuntuLearn',
      source: 'safedeck' as const,
      archiveFile: 'safedeck-ubuntulearn-cpp-guide.tar.gz',
    },
  ];

  demos.forEach(d => publishAsset({ ...d, version: '1.0.0' }));
  console.log(`[UBUNTULIBRARY] Seeded ${demos.length} demo assets`);
}

// Auto-seed on import
seedDemoAssets();
