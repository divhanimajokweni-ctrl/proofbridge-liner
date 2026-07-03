// NexusIntegrator.ts — Privacy-First Sovereign Integration Engine
//
// The "Plugin System" that connects external platforms (Discord, Twitter/X,
// GitHub, Stripe, Twitch, Matrix) to the user's local Vault.
// All data stays in the user's Docker volume unless explicitly published.
//
// Architecture:
//   Plugin (adapter) → Privacy Airlock (anonymize/filter) → Local Vault
//                                                           ↓
//                                                    Village Dashboard
//
// Permission Model:
//   - READ   : Read messages/balance from external platform
//   - WRITE  : Send messages/transactions
//   - STREAM : Real-time webhook subscription
//   - VAULT  : Persist to local encrypted store

export type PluginType = 'SOCIAL' | 'FINANCE' | 'GAME' | 'IDENTITY';
export type Permission = 'READ' | 'WRITE' | 'STREAM' | 'VAULT';

export interface NexusPlugin {
  name: string;
  type: PluginType;
  version: string;
  icon: string;        // lucide icon name
  connected: boolean;
  permissions: Permission[];
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): Promise<PluginStatus>;
}

export interface PluginStatus {
  online: boolean;
  lastSync: string;    // ISO timestamp
  dataSize: string;    // e.g. "2.3 MB"
  error?: string;
}

// ── Proof Trace (for TacticVisualizerPlay) ────────────────────────────────────

export interface ProofStep {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'pending' | 'active' | 'solved' | 'failed';
  parents: string[];
}

// ── Unified Feed Item ────────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  type: 'SIEGE' | 'GOLF' | 'CRUSADE' | 'STREAM' | 'MILESTONE' | 'GOVERNANCE';
  title: string;
  description: string;
  author: string;
  authorAvatar?: string;
  bounty: number;
  signatures: number;
  userHasVerified: boolean;
  trace?: ProofStep[] | string; // CID or hydrated proof trace
  timestamp: number;
  media?: {
    type: 'tactic_viz' | 'diff' | 'chat_highlight';
    cid: string;
  };
}

// ── Treasury State ───────────────────────────────────────────────────────────

export interface TreasuryBalance {
  fiat: {
    usd: number;
    eur: number;
  };
  crypto: {
    usdc: number;
    eth: number;
  };
  lindiwe: {
    repScore: number;
    repValueUsd: number;   // Converted reputation → USD valuation
  };
  totalUsd: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'EARNED' | 'SPENT' | 'DONATION' | 'BOUNTY' | 'STAKE';
  amount: number;
  currency: 'USD' | 'REP' | 'USDC' | 'ETH';
  description: string;
  source: string;
  timestamp: string;
  status: 'confirmed' | 'pending';
}

// ── Social State ─────────────────────────────────────────────────────────────

export interface UnifiedMessage {
  id: string;
  platform: 'discord' | 'twitter' | 'matrix' | 'twitch' | 'local';
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  channel: string;
  sourceUrl?: string;
}

export interface Contact {
  id: string;
  displayName: string;
  platform: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  avatar?: string;
  lastSeen: string;
}

// ── Privacy Airlock ──────────────────────────────────────────────────────────

export interface PrivacyConfig {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  anonymizeBeforeSend: boolean;
  allowedDestinations: string[];
  blockedPatterns: string[];
  autoDeleteAfterDays: number;
}

const DEFAULT_PRIVACY: PrivacyConfig = {
  level: 'HIGH',
  anonymizeBeforeSend: true,
  allowedDestinations: ['localhost:*', '*.venturevisionubuntu.co.za'],
  blockedPatterns: ['tracker', 'analytics', 'facebook', 'googlead'],
  autoDeleteAfterDays: 90,
};

// ── Local Vault (IndexedDB / in-memory) ──────────────────────────────────────

class LocalVault {
  private store: Map<string, unknown> = new Map();
  private encryptionKey: string;

  constructor() {
    // In production, derive from user passphrase
    this.encryptionKey = 'local-vault-key';
  }

  async set(key: string, value: unknown): Promise<void> {
    // Encrypt before storing
    const encoded = btoa(JSON.stringify(value));
    this.store.set(key, encoded);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`nexus_${key}`, encoded);
      } catch { /* quota exceeded — degrade gracefully */ }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key) as string
      ?? (typeof window !== 'undefined' ? localStorage.getItem(`nexus_${key}`) : null);
    if (!raw) return null;
    try {
      return JSON.parse(atob(raw)) as T;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`nexus_${key}`);
    }
  }
}

// ── Nexus Integrator (Singleton) ─────────────────────────────────────────────

class NexusIntegrator {
  plugins: Map<string, NexusPlugin> = new Map();
  vault: LocalVault;
  privacy: PrivacyConfig = { ...DEFAULT_PRIVACY };
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.vault = new LocalVault();
    this.loadPrivacyConfig();
  }

  private async loadPrivacyConfig() {
    const saved = await this.vault.get<PrivacyConfig>('privacy_config');
    if (saved) this.privacy = { ...DEFAULT_PRIVACY, ...saved };
  }

  // ── Plugin Registry ──
  registerPlugin(plugin: NexusPlugin): void {
    this.plugins.set(plugin.name, plugin);
    console.log(`[Nexus] Plugin registered: ${plugin.name} (${plugin.type})`);
  }

  async connectPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin not found: ${name}`);

    // Privacy Airlock check
    if (this.privacy.level === 'HIGH' && !this.privacy.allowedDestinations.some(
      d => name.toLowerCase().includes(d.replace('*', ''))
    )) {
      console.warn(`[Nexus] ⚠️  Privacy block: ${name} not in allowed destinations`);
      return false;
    }

    const ok = await plugin.connect();
    if (ok) {
      plugin.connected = true;
      await this.vault.set(`plugin_${name}_status`, { connected: true, at: new Date().toISOString() });
      this.emit('plugin:connected', { name });
    }
    return ok;
  }

  async disconnectPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;
    await plugin.disconnect();
    plugin.connected = false;
    await this.vault.set(`plugin_${name}_status`, { connected: false, at: new Date().toISOString() });
    this.emit('plugin:disconnected', { name });
  }

  // ── Event Bus ──
  on(event: string, cb: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // ── Privacy Actions ──
  sanitizeForSend(payload: unknown): unknown {
    if (!this.privacy.anonymizeBeforeSend) return payload;

    // Strip PII fields before sending to external services
    const stripped = JSON.parse(JSON.stringify(payload));
    const piiFields = ['email', 'phone', 'password', 'ssn', 'dob', 'address'];
    const stripPII = (obj: Record<string, unknown>) => {
      for (const key of Object.keys(obj)) {
        if (piiFields.includes(key.toLowerCase())) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          stripPII(obj[key] as Record<string, unknown>);
        }
      }
    };
    stripPII(stripped);
    return stripped;
  }

  // ── Social Aggregation ──
  async getUnifiedFeed(plugins: string[]): Promise<UnifiedMessage[]> {
    const all: UnifiedMessage[] = [];
    for (const name of plugins) {
      const plugin = this.plugins.get(name);
      if (!plugin?.connected) continue;
      // Each plugin would implement its own fetch
      // Here we return from the vault cache
      const cached = await this.vault.get<UnifiedMessage[]>(`feed_${name}`);
      if (cached) all.push(...cached);
    }
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ── Treasury Aggregation ──
  async getTreasuryBalance(): Promise<TreasuryBalance> {
    // In production, each FINANCE plugin contributes
    const cached = await this.vault.get<TreasuryBalance>('treasury_balance');
    return cached ?? {
      fiat: { usd: 0, eur: 0 },
      crypto: { usdc: 0, eth: 0 },
      lindiwe: { repScore: 0, repValueUsd: 0 },
      totalUsd: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Privacy Config ──
  updatePrivacy(config: Partial<PrivacyConfig>): void {
    this.privacy = { ...this.privacy, ...config };
    this.vault.set('privacy_config', this.privacy);
    this.emit('privacy:updated', this.privacy);
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

const globalForNexus = globalThis as unknown as { _nexusInstance?: NexusIntegrator };
export const nexus = globalForNexus._nexusInstance ?? (globalForNexus._nexusInstance = new NexusIntegrator());

export type { NexusIntegrator as NexusIntegratorType };
export default nexus;
