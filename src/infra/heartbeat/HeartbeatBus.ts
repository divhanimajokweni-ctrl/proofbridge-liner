import {
  HeartbeatState, Incident, SCHEMA_VERSION,
  makeIncidentId, utcNow, sortByPriority, PRIORITY,
} from "./HeartbeatSchema";

const IDB_DB_NAME    = "vvu_heartbeat";
const IDB_STORE_NAME = "heartbeat_state";
const IDB_KEY        = "singleton";
const BC_CHANNEL     = "vvu_heartbeat_bus";

type HeartbeatListener = (state: HeartbeatState) => void;

export class HeartbeatBus {
  private state: HeartbeatState = {
    schemaVersion: SCHEMA_VERSION,
    lastCheck:     utcNow(),
    systemStatus:  "NOMINAL",
    cycle:         0,
    openCount:     0,
    resolvedCount: 0,
    incidents:     [],
  };

  private listeners: Set<HeartbeatListener> = new Set();
  private channel   = new BroadcastChannel(BC_CHANNEL);
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    this.db = await this._openDB();
    const persisted = await this._loadFromIDB();
    if (persisted) this.state = persisted;

    this.channel.onmessage = (ev) => {
      if (ev.data?.type === "HEARTBEAT_STATE_UPDATE") {
        this.state = ev.data.payload;
        this._notify();
      }
    };
  }

  async appendIncident(
    summary:     string,
    errorLog:    string,
    opHint:      Incident["opHint"],
    priority:    Incident["priority"],
    triggeredBy: string,
    specRef:     string,
  ): Promise<Incident> {
    const incident: Incident = {
      id:          makeIncidentId(),
      summary,
      priority,
      errorLog,
      opHint,
      triggeredBy,
      timestamp:   utcNow(),
      specRef,
      resolved:    false,
    };
    this.state.incidents.push(incident);
    this.state.openCount++;
    this.state.systemStatus = "REMEDIATING";
    this.state.lastCheck    = utcNow();
    await this._persist();
    return incident;
  }

  async resolveIncident(
    id:               string,
    resolutionOutput: string,
  ): Promise<void> {
    const inc = this.state.incidents.find(i => i.id === id);
    if (!inc) return;
    inc.resolved         = true;
    inc.resolvedAt       = utcNow();
    inc.resolutionOutput = resolutionOutput;
    this.state.openCount    = Math.max(0, this.state.openCount - 1);
    this.state.resolvedCount++;
    this.state.systemStatus = this.state.openCount === 0 ? "NOMINAL" : "REMEDIATING";
    this.state.lastCheck    = utcNow();
    await this._persist();
  }

  async stampCycle(): Promise<void> {
    this.state.cycle++;
    this.state.lastCheck = utcNow();
    await this._persist();
  }

  getOpenIncidents(): Incident[] {
    return sortByPriority(
      this.state.incidents.filter(i => !i.resolved)
    );
  }

  getSnapshot(): Readonly<HeartbeatState> {
    return { ...this.state };
  }

  subscribe(fn: HeartbeatListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private _notify() {
    for (const fn of this.listeners) fn(this.state);
  }

  private async _persist(): Promise<void> {
    this._notify();
    this.channel.postMessage({
      type:    "HEARTBEAT_STATE_UPDATE",
      payload: this.state,
    });
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx    = this.db!.transaction(IDB_STORE_NAME, "readwrite");
      const store = tx.objectStore(IDB_STORE_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
      tx.onabort    = () => reject(new Error(`IDB abort: ${tx.error?.message}`));
      store.put({ key: IDB_KEY, state: this.state });
    });
  }

  private async _loadFromIDB(): Promise<HeartbeatState | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx    = this.db!.transaction(IDB_STORE_NAME, "readonly");
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result?.state ?? null);
      req.onerror   = () => resolve(null);
    });
  }

  private _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = (ev) => {
        const db = (ev.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }
}

export const heartbeatBus = new HeartbeatBus();
