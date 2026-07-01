import { MessageSlice } from './types';
import { logger } from './logger';

interface ContextOutput {
  role: 'user' | 'assistant';
  content: string;
}

const CHARS_PER_TOKEN_ESTIMATE = 4;

export function buildBoundedContext(
  userText: string,
  history: MessageSlice[],
  maxTokens = 8000,
): ContextOutput[] {
  const userSlice = { role: 'user' as const, content: userText };

  const tokenLength = (msgs: MessageSlice[]) =>
    Math.ceil(msgs.reduce((sum, m) => sum + m.content.length, 0) / CHARS_PER_TOKEN_ESTIMATE);

  const full = [...history, userSlice];
  const total = tokenLength(full);

  if (total <= maxTokens) {
    return full.map(m => ({ role: m.role, content: m.content }));
  }

  const truncatedHistory = [...history];

  while (truncatedHistory.length > 0 && tokenLength([...truncatedHistory, userSlice]) > maxTokens) {
    truncatedHistory.shift();
  }

  if (truncatedHistory.length !== history.length) {
    logger.debug(
      {
        removed: history.length - truncatedHistory.length,
        kept: truncatedHistory.length,
        user_chars: userText.length,
      },
      '[CTX] Context truncated',
    );
  }

  return [...truncatedHistory.map(m => ({ role: m.role, content: m.content })), userSlice];
}
