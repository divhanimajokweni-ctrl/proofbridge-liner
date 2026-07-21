"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Play, RotateCw, Trash2, CheckCircle2, XCircle, AlertTriangle,
  Server, FileText, FlaskConical, KeyRound, List, Settings2, Loader2,
  ArrowUp, ArrowDown, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CLI_PORT = "3031";
const CLI_BASE = (path: string) =>
  path.includes("?") ? `${path}&XTransformPort=${CLI_PORT}` : `${path}?XTransformPort=${CLI_PORT}`;

interface CliSample { name: string; filename: string; source: string }
interface CliRunResponse { ok: boolean; exitCode: number; stdout: string; stderr: string; result?: unknown }
interface TerminalEntry { id: string; prompt: string; stdout: string; stderr: string; exitCode: number; ranAt: number }

const ANSI_CLASS: Record<string, string> = {
  "0": "", "1": "font-bold", "2": "opacity-60",
  "31": "text-rose-400", "32": "text-emerald-400", "33": "text-amber-400",
  "34": "text-teal-400", "35": "text-fuchsia-400", "36": "text-teal-300", "90": "text-zinc-500",
};

function renderAnsi(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/\x1b\[(\d+(?:;\d+)*)m/);
  const nodes: React.ReactNode[] = [];
  let active = new Set<string>();
  let key = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 1) {
      for (const code of part.split(";")) {
        if (code === "0" || code === "") active = new Set();
        else { const cls = ANSI_CLASS[code]; if (cls) active.add(cls); }
      }
    } else if (part) {
      nodes.push(<span key={key++} className={Array.from(active).join(" ") || undefined}>{part}</span>);
    }
  }
  return nodes;
}

const DEFAULT_STATE = `{\n  "geo_region": "europe-west",\n  "frequency": 50.01,\n  "generation": [420, 380, 510, 290, 600, 470],\n  "load": [410, 375, 500, 285, 590, 460],\n  "losses": 12,\n  "thermal_headroom": 18\n}`;
const VIOLATING_STATE = `{\n  "geo_region": "europe-west",\n  "frequency": 50.6,\n  "thermal_headroom": 6\n}`;
const SAFE_CURRENT_STATE = { geo_region: "europe-west", frequency: 50.0, generation: [420, 380, 510, 290, 600, 470], load: [410, 375, 500, 285, 590, 460], losses: 12, thermal_headroom: 18 };

type CommandKind = "validate" | "repair" | "proof" | "list-samples";

function BlinkingCursor() {
  return <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-[blink_1s_step-end_infinite] align-text-bottom" />;
}

function ResultBadge({ exitCode }: { exitCode: number }) {
  const failed = exitCode === -1;
  const ok = exitCode === 0;
  const cls = failed ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-amber-500/40 bg-amber-500/10 text-amber-400";
  const Icon = failed ? XCircle : ok ? CheckCircle2 : AlertTriangle;
  const label = failed ? "error" : ok ? "pass" : `exit ${exitCode}`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold", cls)}>
      <Icon className="h-2.5 w-2.5" />{label}
    </span>
  );
}

function AnimatedOutput({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        const chunk = text.length > 200 ? 4 : 1;
        setDisplayed(text.slice(0, i + chunk));
        i += chunk;
        timeout = setTimeout(tick, 8);
      } else setDone(true);
    };
    timeout = setTimeout(tick, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return <span>{renderAnsi(displayed)}{!done && <BlinkingCursor />}</span>;
}

export function CliTerminalSection() {
  const { toast } = useToast();
  const [samples, setSamples] = useState<CliSample[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState("");
  const [source, setSource] = useState("");
  const [stateText, setStateText] = useState(DEFAULT_STATE);
  const [strict, setStrict] = useState(false);
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [running, setRunning] = useState<CommandKind | null>(null);
  const [health, setHealth] = useState<{ ok: boolean; checkedAt: number } | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [latestEntryId, setLatestEntryId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history]);

  const loadSamples = useCallback(async () => {
    setSamplesLoading(true);
    try {
      const r = await fetch(CLI_BASE("/api/samples"));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: { samples: CliSample[] } = await r.json();
      const list = d.samples ?? [];
      setSamples(list);
      if (list.length > 0 && !source) { setSource(list[0].source); setSelectedSample(list[0].filename); }
    } catch (e) {
      toast({ title: "Failed to load samples", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally { setSamplesLoading(false); }
  }, [source, toast]);

  useEffect(() => { loadSamples(); }, [loadSamples]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch(CLI_BASE("/api/health"));
        const d = await r.json();
        if (!cancelled) setHealth({ ok: !!d.ok, checkedAt: Date.now() });
      } catch { if (!cancelled) setHealth({ ok: false, checkedAt: Date.now() }); }
    };
    check();
    const t = setInterval(check, 10_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const loadSample = useCallback((filename: string) => {
    const s = samples.find((x) => x.filename === filename);
    if (s) { setSource(s.source); setSelectedSample(filename); toast({ title: `Loaded ${s.filename}`, description: s.name }); }
  }, [samples, toast]);

  const parseState = useCallback((label: string): Record<string, unknown> | null => {
    try { return JSON.parse(stateText); }
    catch (e) { toast({ title: `Invalid ${label} JSON`, description: e instanceof Error ? e.message : "Parse error", variant: "destructive" }); return null; }
  }, [stateText, toast]);

  const runCommand = useCallback(async (kind: CommandKind) => {
    if (kind !== "list-samples" && !source.trim()) {
      toast({ title: "Source is empty", description: "Load a sample or write a .epd policy.", variant: "destructive" }); return;
    }
    let body: Record<string, unknown>;
    let promptCmd: string;
    if (kind === "validate") {
      const s = parseState("state"); if (!s) return;
      body = { command: "validate", source, state: s, strict };
      promptCmd = `validate${strict ? " --strict" : ""} (inline source) --state (inline)`;
    } else if (kind === "repair") {
      const proposed = parseState("state"); if (!proposed) return;
      body = { command: "repair", source, current: SAFE_CURRENT_STATE, proposed };
      promptCmd = `repair (inline source) --current (safe baseline) --proposed (inline)`;
    } else if (kind === "proof") {
      body = { command: "proof", source, index: 0 };
      promptCmd = `proof (inline source) --index 0`;
    } else {
      body = { command: "list-samples" };
      promptCmd = `list-samples`;
    }
    setRunning(kind);
    try {
      const r = await fetch(CLI_BASE("/api/run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: CliRunResponse = await r.json();
      const entry: TerminalEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, prompt: `$ epd-cli ${promptCmd}`, stdout: d.stdout ?? "", stderr: d.stderr ?? "", exitCode: d.exitCode, ranAt: Date.now() };
      setHistory((prev) => [...prev, entry]);
      setLatestEntryId(entry.id);
      setHistoryIndex(-1);
      toast({ title: d.exitCode === 0 ? "Command succeeded" : "Command failed", description: `exit ${d.exitCode} · ${(d.stdout ?? "").length} bytes output`, variant: d.exitCode === 0 ? "default" : "destructive" });
    } catch (e) {
      const entry: TerminalEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, prompt: `$ epd-cli ${promptCmd}`, stdout: "", stderr: e instanceof Error ? e.message : "Network error", exitCode: -1, ranAt: Date.now() };
      setHistory((prev) => [...prev, entry]);
      setLatestEntryId(entry.id);
      toast({ title: "Request failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally { setRunning(null); }
  }, [source, stateText, strict, parseState, toast]);

  const clearTerminal = useCallback(() => { setHistory([]); setLatestEntryId(null); toast({ title: "Terminal cleared" }); }, [toast]);
  const loadViolating = useCallback(() => { setStateText(VIOLATING_STATE); toast({ title: "Loaded violating state", description: "frequency:50.6 breaches freq_bounds [49.8, 50.2]" }); }, [toast]);
  const loadSafe = useCallback(() => { setStateText(DEFAULT_STATE); toast({ title: "Loaded safe state", description: "frequency:50.01 — all invariants pass" }); }, [toast]);
  const navigateHistory = useCallback((dir: "up" | "down") => {
    if (!history.length) return;
    setHistoryIndex((prev) => dir === "up" ? Math.min(prev + 1, history.length - 1) : Math.max(prev - 1, -1));
  }, [history]);

  const online = health?.ok ?? false;

  const cmdButton = (kind: CommandKind, label: string, icon: React.ReactNode, primary?: boolean) => (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Button onClick={() => runCommand(kind)} disabled={running !== null} variant="outline"
        className={cn("h-8 gap-1.5 w-full", primary ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60")}>
        {running === kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
        <span className="font-mono text-xs">{label}</span>
      </Button>
    </motion.div>
  );

  return (
    <section className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_-3px_var(--verified)]">
            <Terminal className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">epd-cli Terminal</h2>
            <p className="text-xs text-muted-foreground">
              Run the real <span className="font-mono text-emerald-400">epd-cli</span> against custom{" "}
              <span className="font-mono text-emerald-400">.epd</span> policy files — validate, repair, prove ancestry.
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("gap-1.5 text-[10px] font-mono", online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400")}>
          <Server className={cn("h-3 w-3", !online && "animate-pulse")} />
          {online ? `epd-cli online · :${CLI_PORT}` : "offline"}
        </Badge>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* LEFT — composer */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-3 lg:col-span-2">
          <Card className="bg-zinc-950/80 backdrop-blur border-zinc-800/80 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-amber-400" /><span className="text-sm font-semibold text-zinc-200">Command composer</span></div>
                <Badge variant="outline" className="border-zinc-700 text-[9px] font-mono text-zinc-400">:{CLI_PORT}</Badge>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wide text-zinc-500">Load bundled sample</label>
                {samplesLoading ? <Skeleton className="h-8 w-full rounded-md bg-zinc-800" /> : (
                  <Select value={selectedSample} onValueChange={loadSample}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs text-zinc-300"><SelectValue placeholder="Select a sample .epd" /></SelectTrigger>
                    <SelectContent>{samples.map((s) => <SelectItem key={s.filename} value={s.filename}><span className="font-mono">{s.filename}</span><span className="ml-1 text-zinc-500">· {s.name}</span></SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> .epd source</span>
                  <span className="font-mono text-[10px] normal-case text-zinc-600">{source.split("\n").length} lines</span>
                </label>
                <Textarea value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false}
                  className="codeblock bg-zinc-900/80 min-h-[220px] max-h-[420px] resize-y epistemic-scroll border-zinc-800 focus-visible:border-emerald-500/40 text-zinc-300"
                  placeholder="# Write your .epd policy here…" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                  <span>State JSON <span className="normal-case text-zinc-600">(for validate / repair)</span></span>
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={loadSafe} className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors">safe</button>
                    <button type="button" onClick={loadViolating} className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono text-rose-400 hover:bg-rose-500/20 transition-colors">violating</button>
                  </span>
                </label>
                <Textarea value={stateText} onChange={(e) => setStateText(e.target.value)} spellCheck={false}
                  className="codeblock bg-zinc-900/80 min-h-[100px] max-h-[260px] resize-y epistemic-scroll border-zinc-800 focus-visible:border-emerald-500/40 text-zinc-300" />
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-zinc-300"><span className="font-mono">--strict</span></span>
                  <span className="text-[10px] text-zinc-500">soft violations → exit 1</span>
                </div>
                <Switch checked={strict} onCheckedChange={setStrict} />
              </div>
              <Separator className="bg-zinc-800" />
              <div className="grid grid-cols-2 gap-2">
                {cmdButton("validate", "validate", <Play className="h-3.5 w-3.5" />, true)}
                {cmdButton("repair", "repair", <RotateCw className="h-3.5 w-3.5" />)}
                {cmdButton("proof", "proof", <KeyRound className="h-3.5 w-3.5" />)}
                {cmdButton("list-samples", "list-samples", <List className="h-3.5 w-3.5" />)}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* RIGHT — terminal panel */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="lg:col-span-3">
          <Card className="bg-zinc-950 backdrop-blur border-zinc-800/80 p-0 relative overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0" />
            <div className="relative flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-zinc-500">epd-cli — epistemic://policies</span>
              <div className="ml-auto flex items-center gap-2">
                <span className={cn("flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold", online ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-emerald-400" : "bg-rose-400 animate-pulse")} />
                  {online ? "connected" : "disconnected"}
                </span>
                {history.length > 0 && (
                  <div className="flex items-center gap-1">
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <button type="button" onClick={() => navigateHistory("up")} className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-[9px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"><ArrowUp className="h-2.5 w-2.5" /></button>
                    </TooltipTrigger><TooltipContent>Previous command</TooltipContent></Tooltip></TooltipProvider>
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <button type="button" onClick={() => navigateHistory("down")} className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-[9px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"><ArrowDown className="h-2.5 w-2.5" /></button>
                    </TooltipTrigger><TooltipContent>Next command</TooltipContent></Tooltip></TooltipProvider>
                  </div>
                )}
                <Button size="sm" variant="ghost" onClick={clearTerminal} disabled={history.length === 0} className="h-7 px-2 text-[10px] text-zinc-500 hover:text-zinc-300">
                  <Trash2 className="h-3 w-3" />Clear
                </Button>
              </div>
            </div>
            <div ref={scrollRef} className="relative max-h-[640px] min-h-[400px] overflow-y-auto epistemic-scroll p-3 font-mono text-[12px] leading-relaxed text-zinc-300">
              {history.length === 0 ? (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                  <Terminal className="h-8 w-8 mb-2 text-emerald-500/60" />
                  <p className="text-sm text-zinc-400">epd-cli ready · <span className="text-emerald-400">run a command</span> to see output</p>
                  <p className="mt-1.5 font-mono text-[11px] text-zinc-600">try <span className="text-emerald-400 font-semibold">validate</span> with the loaded sample</p>
                  <div className="mt-4 flex items-center gap-1 text-zinc-700"><ChevronRight className="h-3 w-3" /><BlinkingCursor /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {history.map((entry, i) => (
                      <TerminalEntryView key={entry.id} entry={entry} isNew={entry.id === latestEntryId} isHighlighted={historyIndex >= 0 && i === history.length - 1 - historyIndex} />
                    ))}
                  </AnimatePresence>
                  {running && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[11px] text-amber-400">
                      <Loader2 className="h-3 w-3 animate-spin" /><span className="font-mono">executing epd-cli {running}…</span><BlinkingCursor />
                    </motion.div>
                  )}
                  {!running && <div className="flex items-center gap-1 text-zinc-700 pt-1"><ChevronRight className="h-3 w-3" /><BlinkingCursor /></div>}
                </div>
              )}
            </div>
          </Card>
          <Card className="mt-3 bg-zinc-950/60 backdrop-blur border-zinc-800/80 p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0" />
            <div className="relative grid grid-cols-1 gap-2 text-[10.5px] text-zinc-500 sm:grid-cols-2">
              <div className="flex items-start gap-1.5"><Play className="mt-0.5 h-3 w-3 text-emerald-400 shrink-0" /><span><span className="font-mono text-zinc-300">validate</span> — parse + evaluate invariants against <span className="font-mono">state</span>, emit MMR root.</span></div>
              <div className="flex items-start gap-1.5"><RotateCw className="mt-0.5 h-3 w-3 text-amber-400 shrink-0" /><span><span className="font-mono text-zinc-300">repair</span> — least-divergent fix from <span className="font-mono">current</span> → <span className="font-mono">proposed</span>.</span></div>
              <div className="flex items-start gap-1.5"><KeyRound className="mt-0.5 h-3 w-3 text-emerald-400 shrink-0" /><span><span className="font-mono text-zinc-300">proof</span> — generate an MMR ancestry proof for invariant <span className="font-mono">--index n</span>.</span></div>
              <div className="flex items-start gap-1.5"><List className="mt-0.5 h-3 w-3 text-zinc-500 shrink-0" /><span><span className="font-mono text-zinc-300">list-samples</span> — enumerate bundled <span className="font-mono">.epd</span> policies.</span></div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function TerminalEntryView({ entry, isNew, isHighlighted }: { entry: TerminalEntry; isNew: boolean; isHighlighted: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={isNew ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className={cn("rounded-md transition-colors duration-150", hovered && "bg-zinc-900/50", isHighlighted && "ring-1 ring-amber-500/30")}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="space-y-1 p-1.5">
        <div className="flex items-center gap-2"><span className="text-emerald-400">{entry.prompt}</span></div>
        {(entry.stdout || entry.stderr) && (
          <pre className="whitespace-pre-wrap break-words text-zinc-300/90">
            {isNew ? <AnimatedOutput text={entry.stdout} delay={50} /> : renderAnsi(entry.stdout)}
            {entry.stderr && <span className="text-rose-400">{isNew ? <AnimatedOutput text={entry.stderr} delay={100} /> : renderAnsi(entry.stderr)}</span>}
          </pre>
        )}
        <div className="flex items-center gap-1.5 pt-0.5">
          <ResultBadge exitCode={entry.exitCode} />
          <span className="text-[9px] text-zinc-600 font-mono">{new Date(entry.ranAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
