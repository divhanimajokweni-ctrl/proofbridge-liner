export interface MessageSlice {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}
