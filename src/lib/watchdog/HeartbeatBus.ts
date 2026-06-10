/**
 * File: src/lib/watchdog/HeartbeatBus.ts
 * Description: Distributed event bus utilizing IndexedDB storage and BroadcastChannel syncing.
 */
import { Incident } from './HeartbeatSchema';
export type BusStatus = 'OFFLINE' | 'INITIALIZING' | 'ONLINE' | 'SUSPENDED';
export class HeartbeatBus {
  private static instance: HeartbeatBus | null = null;
  private status: BusStatus = 'OFFLINE';
  private db: IDBDatabase | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(inc: Incident) => void> = new Set();

  private constructor() {}

  public static getInstance(): HeartbeatBus {
    if (!HeartbeatBus.instance) {
      HeartbeatBus.instance = new HeartbeatBus();
    }
    return HeartbeatBus.instance;
  }

  public async activate(): Promise<void> {
    if (typeof window === 'undefined') {
      this.status = 'ONLINE'; // Clean handling for Server-Side Environments
      return;
    }
    if (this.status === 'ONLINE' || this.status === 'INITIALIZING') return;
    this.status = 'INITIALIZING';

    try {
      this.db = await this.initDB();
      this.channel = new BroadcastChannel('vvu-heartbeat-bus');
      this.channel.onmessage = (e: MessageEvent<Incident>) => {
        this.listeners.forEach(cb => cb(e.data));
      };
      this.status = 'ONLINE';
    } catch (e) {
      this.status = 'OFFLINE';
      console.error('Failed to activate HeartbeatBus:', e);
    }
  }

  public suspend(): void {
    if (this.status !== 'ONLINE') return;
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.status = 'SUSPENDED';
  }

  public deactivate(): void {
    this.suspend();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.listeners.clear();
    this.status = 'OFFLINE';
  }

  public async dispatch(incident: Incident): Promise<void> {
    // Graceful preservation when database layers are offline or executing on SSR engines
    if (this.status === 'OFFLINE' || typeof window === 'undefined') {
      this.listeners.forEach(cb => cb(incident));
      return;
    }

    try {
      if (this.db) {
        const tx = this.db.transaction('incidents', 'readwrite');
        await new Promise<void>((res, rej) => {
          const req = tx.objectStore('incidents').add(incident);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      }
      if (this.channel) {
        this.channel.postMessage(incident);
      }
      this.listeners.forEach(cb => cb(incident));
    } catch (err) {
      console.error('Incident tracking write hazard:', err);
    }
  }

  public subscribe(callback: (inc: Incident) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getStatus(): BusStatus {
    return this.status;
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('vvu_watchdog_db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('incidents')) {
          db.createObjectStore('incidents', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}