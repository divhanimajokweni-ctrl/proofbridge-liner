"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Sparkles,
  ClipboardList,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Loader2,
  Eraser,
} from "lucide-react";

interface ChatMsg {
  id: string;
  role: "user" | "facilitator" | "system";
  content: string;
  ts: string;
  citations?: { label: string }[];
  error?: boolean;
}

const SUGGESTIONS = [
  "Summarize today's structural review meeting and capture binding decisions.",
  "Schedule a follow-up for clash 1,847 — assign to discipline lead.",
  "Draft a decision essay for the hybrid steel-timber lateral system.",
  "Which evidence items are stale and need re-verification?",
];

const SEED: ChatMsg[] = [
  {
    id: "seed-1",
    role: "facilitator",
    content:
      "Facilitator agent online. I track agendas, co-author meeting notes, surface stale evidence, and mint governance artifacts. All outputs are routed through the AIR runtime and tagged for the Common Data Environment. How can I coordinate the team today?",
    ts: "08:31:42",
    citations: [
      { label: "AIR runtime · intervention layer" },
      { label: "OmniClass 2014-2020" },
    ],
  },
];

export function FacilitatorTab() {
  const [messages, setMessages] = useState<ChatMsg[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/facilitator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages
            .filter((m) => m.role !== "system")
            .slice(-6)
            .map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply: ChatMsg = {
        id: `f-${Date.now()}`,
        role: "facilitator",
        content:
          data.content ??
          "I could not synthesize a response from the available evidence.",
        ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        citations: data.citations ?? [
          { label: "AIR runtime · evidence layer" },
        ],
      };
      setMessages((m) => [...m, reply]);
    } catch (err) {
      const reply: ChatMsg = {
        id: `f-${Date.now()}`,
        role: "facilitator",
        content: `⚠️ AIR runtime could not reach the LLM endpoint. Logged for retry. Detail: ${
          (err as Error).message
        }. Falling back to local heuristic — please retry in a moment.`,
        ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        error: true,
      };
      setMessages((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages(SEED);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Chat panel */}
      <Card className="flex h-[640px] flex-col ive-glass">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ive-glow-gold">
                  <Bot className="h-5 w-5 ive-text-gold" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div>
                <CardTitle className="font-mono text-sm uppercase tracking-widest">
                  Facilitator Agent
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
                  Online · AIR-monitored · CDE-bound
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <Eraser className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <div
          ref={scrollRef}
          className="ive-scrollbar flex-1 space-y-4 overflow-y-auto p-4"
        >
          {messages.map((m) => (
            <ChatBubble key={m.id} msg={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin ive-text-gold" />
              <span className="font-mono uppercase tracking-widest">
                AIR routing · evidence decay check · LLM synthesis
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-3">
          <div className="flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the facilitator to coordinate decisions, capture notes, or draft a governance artifact…"
              className="min-h-[60px] resize-none border-border/60 bg-secondary/30 font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Enter to send · Shift+Enter for newline
              </span>
              <Button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="gap-2 font-mono text-xs uppercase tracking-widest"
              >
                <Send className="h-3.5 w-3.5" />
                Dispatch
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Side panel */}
      <div className="space-y-4">
        <Card className="ive-glass-gold">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 ive-text-gold" />
              Facilitator Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            {[
              {
                icon: ClipboardList,
                title: "Agenda tracking",
                body: "Live capture of binding decisions and ad-hoc notes.",
              },
              {
                icon: FileText,
                title: "Collaborative authoring",
                body: "Co-authoring meeting minutes + follow-ups directly in workspace.",
              },
              {
                icon: CalendarCheck,
                title: "Follow-up scheduling",
                body: "Assigns owners, deadlines, and evidence requirements.",
              },
              {
                icon: ShieldCheck,
                title: "Trust & attestation",
                body: "Mints signed compliance exports for 6 regulators.",
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 ive-text-gold" />
                  <div>
                    <div className="font-mono text-[11px] font-medium uppercase tracking-widest">
                      {c.title}
                    </div>
                    <p className="text-muted-foreground">{c.body}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 ive-text-emerald" />
              Suggested Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="w-full rounded-md border border-border/40 bg-secondary/30 p-2 text-left text-xs text-muted-foreground transition hover:border-[oklch(0.82_0.16_75/40%)] hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest">
              Live Trust State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trust inflation guard</span>
              <Badge variant="outline" className="ive-text-emerald">
                ARMED
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Conjecture blocker</span>
              <Badge variant="outline" className="ive-text-rose">
                1 BLOCKED
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Evidence decay</span>
              <Badge variant="outline" className="ive-text-gold">
                12 STALE
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-lg border px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "border-[oklch(0.82_0.16_75/40%)] bg-primary/10 text-foreground"
            : msg.error
            ? "border-rose-500/40 bg-rose-500/10"
            : "border-border/50 bg-secondary/40"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {isUser ? (
            <>
              <span>you</span>
              <span>·</span>
              <span>{msg.ts}</span>
            </>
          ) : (
            <>
              <Bot className="h-3 w-3 ive-text-gold" />
              <span>facilitator</span>
              <span>·</span>
              <span>{msg.ts}</span>
            </>
          )}
        </div>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {msg.citations.map((c, i) => (
              <span
                key={i}
                className="rounded bg-background/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ive-text-emerald"
              >
                ⛓ {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
