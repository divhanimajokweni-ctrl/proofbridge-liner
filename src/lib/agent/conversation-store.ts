/**
 * @deprecated This module is deprecated. Use `src/lib/agents/conversation-store.ts` instead.
 *
 * UnifiedConversationStore provides state-machine-backed conversation storage.
 * Import from '@/lib/agents/conversation-store' going forward.
 *
 * This file is retained for backward compatibility and will be removed in a future sprint.
 */

import fs from 'fs';
import path from 'path';

const STORE_DIR = path.resolve(process.cwd(), '.local', 'conversations');
const MAX_HISTORY = 50;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  threadId: string;
  to: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

function ensureStore(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function filePath(threadId: string): string {
  return path.join(STORE_DIR, `${threadId}.json`);
}

export function getConversation(threadId: string): Conversation {
  ensureStore();
  const fp = filePath(threadId);
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return { threadId, to: '', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
  }
}

export function saveConversation(conv: Conversation): void {
  ensureStore();
  conv.updatedAt = Date.now();
  if (conv.messages.length > MAX_HISTORY) {
    conv.messages = conv.messages.slice(-MAX_HISTORY);
  }
  fs.writeFileSync(filePath(conv.threadId), JSON.stringify(conv, null, 2));
}

export function addMessage(threadId: string, to: string, msg: Message): Conversation {
  const conv = getConversation(threadId);
  conv.to = to || conv.to;
  conv.messages.push(msg);
  saveConversation(conv);
  return conv;
}

export function listConversations(): { threadId: string; to: string; updatedAt: number; messageCount: number }[] {
  ensureStore();
  try {
    const items: ({ threadId: string; to: string; updatedAt: number; messageCount: number } | null)[] = fs.readdirSync(STORE_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const conv: Conversation = JSON.parse(fs.readFileSync(path.join(STORE_DIR, f), 'utf8'));
          return { threadId: conv.threadId, to: conv.to, updatedAt: conv.updatedAt, messageCount: conv.messages.length };
        } catch { return null; }
      });
    return items.filter((x): x is NonNullable<typeof x> => x !== null).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}
