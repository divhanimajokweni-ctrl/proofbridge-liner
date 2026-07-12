/**
 * Minimal in-memory conversation store stub.
 * This file was missing and blocked the build.
 * Replace with a persistent implementation if needed.
 */

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type Conversation = {
  messages: Message[];
};

const conversations = new Map<string, Conversation>();

export function getConversation(threadId: string): Conversation {
  if (!conversations.has(threadId)) {
    conversations.set(threadId, { messages: [] });
  }
  return conversations.get(threadId)!;
}

export function addMessage(
  threadId: string,
  to: string,
  message: Message
): void {
  const conversation = getConversation(threadId);
  conversation.messages.push(message);
}

export function listConversations(): { threadId: string; messageCount: number }[] {
  return Array.from(conversations.entries()).map(([threadId, conv]) => ({
    threadId,
    messageCount: conv.messages.length,
  }));
}
