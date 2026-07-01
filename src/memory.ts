import Database from 'better-sqlite3';
import { CONFIG } from './config';

let db: Database.Database | null = null;

export function init_db(): Database.Database {
  if (db) return db;
  const { mkdirSync } = require('fs');
  const dbDir = require('path').dirname(CONFIG.db_path);
  try { mkdirSync(dbDir, { recursive: true }); } catch {}
  db = new Database(CONFIG.db_path);
  db.pragma('journal_mode = WAL');
  db.pragma('PRAGMA busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content TEXT NOT NULL,
      ts INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_conv_jid_ts ON conversations(jid, ts);
  `);
  return db;
}

export function get_db(): Database.Database {
  if (!db) throw new Error('Database not initialised. Call init_db() first.');
  return db;
}

export function close_db(): void {
  if (db) { db.close(); db = null; }
}

export function load_history(jid: string, limit = 40): { role: 'user' | 'assistant'; content: string; timestamp: number }[] {
  const stmt = get_db().prepare(
    'SELECT role, content, ts AS timestamp FROM conversations WHERE jid = ? ORDER BY ts ASC LIMIT ?',
  );
  return stmt.all(jid, limit) as { role: 'user' | 'assistant'; content: string; timestamp: number }[];
}

export function save_turns(jid: string, turns: { role: string; content: string }[]): void {
  const insert = get_db().prepare(
    'INSERT INTO conversations (jid, role, content) VALUES (?, ?, ?)',
  );
  const tx = get_db().transaction(() => {
    for (const t of turns) insert.run(jid, t.role, t.content);
  });
  tx();
}

export function clear_history(jid: string): number {
  const stmt = get_db().prepare('DELETE FROM conversations WHERE jid = ?');
  return stmt.run(jid).changes;
}
