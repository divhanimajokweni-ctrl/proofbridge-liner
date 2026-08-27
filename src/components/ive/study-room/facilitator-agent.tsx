'use client';

/**
 * Facilitator Agent · Study Room · VVU IVE
 * ---------------------------------------
 * LLM chat interface that talks to POST /api/facilitator.
 *
 * The Facilitator is a domain expert on EIS v1.0, HBK, HOM, the 72-hour
 * validation protocol, and the Zero Fabrication Mandate. Suggested-question
 * chips seed the conversation; typing indicator + auto-scroll keep the live
 * transcript readable.
 *
 * Self-contained — accepts no props. Uses local state only (no Zustand, no
 * TanStack Query — the chat is ephemeral per session).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  CornerDownLeft,
  Eraser,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface FacilitatorResponse {
  content: string;
  model?: string;
  classification?: string;
}

const SUGGESTED = [
  { label: 'What is EIS v1.0?', icon: Sparkles },
  { label: 'How does HBK localize leaks?', icon: Sparkles },
  { label: 'What is the Zero Fabrication rule?', icon: Sparkles },
  { label: 'Explain the 72h protocol', icon: Sparkles },
];

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'VVU IVE Facilitator online. I am the domain assistant for the Evidence Independence Scoring engine (EIS v1.0), the Hydro-Bayesian Kernel (HBK), the Hydraulic Observability Model (HOM), and the 72-hour validation protocol. Ask me anything — or pick a starter question below.\n\nAll demo data referenced in this room is SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.',
  ts: Date.now(),
};

export default function FacilitatorAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // ─── Auto-scroll to bottom whenever messages or loading change ─────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // ─── Send a message ──────────────────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      };

      const transcript = [...messages, userMsg];
      setMessages(transcript);
      setInput('');
      setLoading(true);
      setErrorBanner(null);

      try {
        const payload = transcript.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/facilitator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payload }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as FacilitatorResponse;
        const reply: ChatMessage = {
          role: 'assistant',
          content:
            data.content?.trim() ||
            '[facilitator returned no content — please rephrase]',
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, reply]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorBanner(`facilitator unreachable · ${msg}`);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '[facilitator offline — the LLM endpoint did not respond. Lesson Stepper and Residual Trunk remain fully functional.]',
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, messages],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([{ ...WELCOME, ts: Date.now() }]);
    setInput('');
    setErrorBanner(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--k-bg)]">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--k-line)] bg-[var(--k-panel)]">
        <Avatar className="h-9 w-9 border border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)]">
          <AvatarFallback className="bg-transparent">
            <Bot className="h-5 w-5 k-cyan" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold k-fg-bright uppercase tracking-wider truncate">
            VVU IVE Facilitator
          </h2>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <span className="inline-flex items-center gap-1 k-pass">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--k-green-bright)] shadow-[0_0_6px_var(--k-green-bright)]" />
              ONLINE
            </span>
            <span className="k-dim">·</span>
            <span className="k-dim">DOMAIN EXPERT · EIS v1.0 / HBK / HOM</span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={clearChat}
          className="border-[var(--k-line-strong)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-red-bright)]"
          aria-label="Clear transcript"
        >
          <Eraser className="h-3.5 w-3.5 mr-1.5" />
          CLEAR
        </Button>
      </header>

      {/* ─── Message list ─── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 k-grid-bg"
        role="log"
        aria-live="polite"
      >
        <div className="flex flex-col gap-3 max-w-3xl mx-auto">
          {messages.map((m, i) => (
            <MessageBubble key={`${i}-${m.ts}`} message={m} />
          ))}
          {loading && <TypingBubble />}
          {errorBanner && (
            <div className="text-[10px] k-danger uppercase tracking-widest text-center py-1">
              {errorBanner}
            </div>
          )}
        </div>
      </div>

      {/* ─── Suggested question chips ─── */}
      <div className="px-3 sm:px-4 pt-2 pb-1 border-t border-[var(--k-line)] bg-[var(--k-panel)]">
        <div className="flex flex-wrap items-center gap-1.5 max-w-3xl mx-auto">
          <span className="text-[10px] k-dim uppercase tracking-widest mr-1">
            STARTERS:
          </span>
          {SUGGESTED.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                type="button"
                disabled={loading}
                onClick={() => send(s.label)}
                className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--k-line-strong)] bg-[var(--k-bg-elevated)] text-[10px] uppercase tracking-wider k-fg hover:border-[var(--k-cyan-bright)] hover:text-[var(--k-cyan-bright)] hover:bg-[rgba(0,212,255,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Ask: ${s.label}`}
              >
                <Icon className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Input ─── */}
      <form
        onSubmit={onSubmit}
        className="px-3 sm:px-4 py-3 border-t border-[var(--k-line)] bg-[var(--k-panel)]"
      >
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 min-w-0 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask the facilitator about EIS, HBK, HOM, the 72h protocol…"
              rows={2}
              disabled={loading}
              className="min-h-[44px] resize-none bg-[var(--k-bg-elevated)] border-[var(--k-line-strong)] text-[var(--k-fg-bright)] placeholder:text-[var(--k-dim)] focus-visible:border-[var(--k-cyan-bright)] focus-visible:ring-[var(--k-cyan-bright)]/30 font-mono text-xs leading-relaxed"
              aria-label="Facilitator chat input"
            />
            <span className="hidden sm:flex items-center gap-1 absolute right-2 bottom-1.5 text-[9px] k-dim uppercase tracking-widest pointer-events-none">
              <CornerDownLeft className="h-3 w-3" />
              to send
            </span>
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 shrink-0 border border-[var(--k-cyan-bright)] bg-[var(--k-cyan-bright)]/10 text-[var(--k-cyan-bright)] hover:bg-[var(--k-cyan-bright)]/20 hover:text-[var(--k-cyan-bright)] shadow-[0_0_12px_rgba(0,212,255,0.15)]"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline uppercase tracking-wider text-xs font-bold">
              Send
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <Avatar className="mt-0.5 h-7 w-7 shrink-0 border border-[var(--k-cyan-bright)]/60 bg-[var(--k-bg-elevated)]">
          <AvatarFallback className="bg-transparent">
            <Bot className="h-4 w-4 k-cyan" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[80%] sm:max-w-[75%] rounded-md border px-3 py-2 ${
          isUser
            ? 'border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)] text-[var(--k-cyan-bright)]'
            : 'border-[var(--k-line-strong)] bg-[var(--k-panel-2)] text-[var(--k-fg)]'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1 text-[9px] uppercase tracking-widest opacity-70">
          <span className={isUser ? 'k-cyan' : 'k-dim'}>
            {isUser ? 'USER' : 'FACILITATOR'}
          </span>
          <span className="k-dim">·</span>
          <span className="k-dim">
            {new Date(message.ts).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
          {message.content}
        </p>
      </div>
      {isUser && (
        <Avatar className="mt-0.5 h-7 w-7 shrink-0 border border-[var(--k-line-strong)] bg-[var(--k-bg-elevated)]">
          <AvatarFallback className="bg-transparent">
            <User className="h-4 w-4 k-dim" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div className="flex gap-2 justify-start">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0 border border-[var(--k-cyan-bright)]/60 bg-[var(--k-bg-elevated)]">
        <AvatarFallback className="bg-transparent">
          <Bot className="h-4 w-4 k-cyan" />
        </AvatarFallback>
      </Avatar>
      <div className="rounded-md border border-[var(--k-line-strong)] bg-[var(--k-panel-2)] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
          <span className="ml-2 text-[9px] uppercase tracking-widest k-dim">
            facilitator thinking…
          </span>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--k-cyan-bright)] animate-pulse"
      style={{ animationDelay: delay, animationDuration: '900ms' }}
    />
  );
}
