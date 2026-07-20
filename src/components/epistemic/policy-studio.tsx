"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Braces,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Play,
  Save,
  FileCode2,
  Cpu,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Shield,
  Activity,
  Hash,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_POLICIES, BROKEN_POLICY_SOURCE, type ValidationResult, type PolicyNode } from "@/lib/epd";
import type { PolicyRow } from "@/lib/types";
import { SeverityBadge, StatusPill, GradientBorderCard, containerVariants, cardVariants, itemVariants, fmtTimestamp } from "./primitives";
import { cn } from "@/lib/utils";

const DEFAULT_SOURCE = SAMPLE_POLICIES[0].source;

/** Policy health indicator showing pass/fail ratio */
function PolicyHealthGauge({ evaluations }: { evaluations: { passed: boolean }[] | null }) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">No evaluations</span>
      </div>
    );
  }
  const passed = evaluations.filter((e) => e.passed).length;
  const total = evaluations.length;
  const ratio = Math.round((passed / total) * 100);
  const status = ratio === 100 ? "verified" : ratio >= 60 ? "repairing" : "violating";

  const colorMap: Record<string, string> = {
    verified: "text-verified",
    repairing: "text-repairing",
    violating: "text-violating",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={cn("h-4 w-4", colorMap[status])} />
          <span className="text-xs font-medium">Policy Health</span>
        </div>
        <span className={cn("text-sm font-mono font-bold tabular-nums", colorMap[status])}>
          {ratio}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "verified" ? "bg-verified" : status === "repairing" ? "bg-repairing" : "bg-violating",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${ratio}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-2.5 w-2.5 text-verified" /> {passed} pass
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-2.5 w-2.5 text-violating" /> {total - passed} fail
        </span>
      </div>
    </div>
  );
}

/** Live validation indicator */
function ValidationIndicator({ validating, result }: { validating: boolean; result: ValidationResult | null }) {
  return (
    <AnimatePresence mode="wait">
      {validating ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5"
        >
          <Loader2 className="h-4 w-4 text-repairing animate-spin" />
          <span className="text-xs text-repairing font-medium">Validating…</span>
        </motion.div>
      ) : result ? (
        <motion.div
          key={result.ok ? "ok" : "err"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5"
        >
          {result.ok ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <CheckCircle2 className="h-4 w-4 text-verified" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <XCircle className="h-4 w-4 text-violating" />
            </motion.div>
          )}
          <span className={cn("text-xs font-medium", result.ok ? "text-verified" : "text-violating")}>
            {result.ok ? "Valid" : "Invalid"}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5"
        >
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Idle</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PolicyStudioSection() {
  const { toast } = useToast();
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [filename, setFilename] = useState(SAMPLE_POLICIES[0].filename);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [stateJson, setStateJson] = useState(
    `{\n  "frequency": 50.01,\n  "generation": [420, 380, 510, 290, 600, 470],\n  "load": [410, 375, 500, 285, 590, 460],\n  "losses": 12,\n  "thermal_headroom": 18\n}`,
  );
  const [evaluations, setEvaluations] = useState<
    { name: string; passed: boolean; severity: string; soft: boolean; actual?: string; expected?: string }[] | null
  >(null);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enforcerTab, setEnforcerTab] = useState<"rust" | "wasm" | "tla">("rust");
  const [astCopied, setAstCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/policies")
      .then((r) => r.json())
      .then((d) => setPolicies(d.policies ?? []))
      .catch(() => {});
  }, []);

  const lines = useMemo(() => source.split("\n"), [source]);

  const syncScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const validate = async () => {
    setValidating(true);
    try {
      let state: Record<string, unknown> | undefined;
      try {
        state = stateJson.trim() ? JSON.parse(stateJson) : undefined;
      } catch {

      }
      const res = await fetch("/api/policies/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, state }),
      });
      const data: ValidationResult & { evaluations?: typeof evaluations } = await res.json();
      setResult(data);
      setEvaluations(data.evaluations ?? null);
    } catch (e) {
      toast({ title: "Validation failed", description: String(e), variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, filename }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save rejected",
          description: data.diagnostics?.[0]?.message ?? "invalid .epd",
          variant: "destructive",
        });
      } else {
        toast({ title: "Policy compiled & saved", description: data.policy.name });
        fetch("/api/policies")
          .then((r) => r.json())
          .then((d) => setPolicies(d.policies ?? []));
      }
    } finally {
      setSaving(false);
    }
  };

  const loadSample = (name: string) => {
    const s = SAMPLE_POLICIES.find((p) => p.name === name || p.filename === name);
    if (s) {
      setSource(s.source);
      setFilename(s.filename);
      setResult(null);
      setEvaluations(null);
    }
  };

  const loadBroken = () => {
    setSource(BROKEN_POLICY_SOURCE);
    setFilename("broken.epd");
    setResult(null);
    setEvaluations(null);
  };

  const loadSaved = async (id: string) => {
    setSelectedPolicyId(id);
    if (!id) return;
    const res = await fetch(`/api/policies/${id}`);
    const data = await res.json();
    if (data.policy) {
      setSource(data.policy.source);
      setFilename(data.policy.filename);
      setResult(null);
      setEvaluations(null);
    }
  };

  const copyAst = async () => {
    if (!policy) return;
    try {
      await navigator.clipboard.writeText(formatAst(policy));
      setAstCopied(true);
      setTimeout(() => setAstCopied(false), 1500);
      toast({ title: "AST copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const ast = result?.ast;
  const policy: PolicyNode | undefined = ast?.policies[0];
  const enforcer = result?.compiledEnforcer;

  const diagCounts = {
    error: result?.diagnostics.filter((d) => d.level === "error").length ?? 0,
    warning: result?.diagnostics.filter((d) => d.level === "warning").length ?? 0,
    info: result?.diagnostics.filter((d) => d.level === "info").length ?? 0,
  };

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Editor column */}
        <div className="xl:col-span-3 space-y-4">
          <motion.div variants={cardVariants}>
            <GradientBorderCard gradient="from-verified/30 via-verified/10 to-repairing/20">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2 bg-background/40">
                <FileCode2 className="h-4 w-4 text-verified" />
                <span className="text-sm font-medium font-mono">{filename}</span>
                <div className="ml-2 flex items-center gap-1.5">
                  <Select value={filename} onValueChange={(v) => loadSample(v)}>
                    <SelectTrigger className="h-7 w-[200px] text-xs">
                      <SelectValue placeholder="Samples" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_POLICIES.map((s) => (
                        <SelectItem key={s.filename} value={s.filename}>
                          {s.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPolicyId} onValueChange={loadSaved}>
                    <SelectTrigger className="h-7 w-[180px] text-xs">
                      <SelectValue placeholder="Saved policies" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <ValidationIndicator validating={validating} result={result} />
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadBroken}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Broken demo
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={save} disabled={saving}>
                    <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Compile & Save"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-verified/90 hover:bg-verified text-primary-foreground"
                    onClick={validate}
                    disabled={validating}
                  >
                    {validating ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1" />
                    )}
                    {validating ? "Validating…" : "Validate"}
                  </Button>
                </div>
              </div>

              {/* Editor with line numbers — dark code editor style */}
              <div className="relative flex bg-[oklch(0.12_0.01_165)] h-[460px]">
                <div
                  ref={gutterRef}
                  className="select-none overflow-hidden py-3 pl-3 pr-2 text-right font-mono text-xs bg-[oklch(0.10_0.008_165)] border-r border-border/30 shrink-0"
                  style={{ minWidth: 52 }}
                  aria-hidden
                >
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "transition-colors duration-150",
                        i % 2 === 0 ? "text-muted-foreground/50" : "text-muted-foreground/35",
                      )}
                      style={{ height: "1.55em", lineHeight: "1.55em" }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <Textarea
                  ref={textareaRef}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  onScroll={syncScroll}
                  spellCheck={false}
                  className="codeblock flex-1 h-full resize-none border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[oklch(0.82_0.04_160)] placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Gradient accent bar at bottom of editor */}
              <div className="h-[2px] bg-gradient-to-r from-verified/60 via-repairing/40 to-verified/60" />
            </GradientBorderCard>
          </motion.div>

          {/* State evaluator */}
          <motion.div variants={cardVariants}>
            <GradientBorderCard gradient="from-repairing/30 via-repairing/10 to-verified/20">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-repairing" />
                  <h3 className="text-sm font-semibold">Invariant Evaluation State</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">JSON — evaluated on validate</span>
                </div>
                <Textarea
                  value={stateJson}
                  onChange={(e) => setStateJson(e.target.value)}
                  spellCheck={false}
                  className="codeblock min-h-[110px] font-mono text-xs bg-[oklch(0.12_0.01_165)] border-border/40"
                />
                {evaluations && evaluations.length > 0 && (
                  <motion.div
                    className="space-y-1.5"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {evaluations.map((ev, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01, backgroundColor: "oklch(0.25 0.015 168 / 0.6)" }}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-all duration-150 cursor-default",
                          ev.passed
                            ? "border-verified/30 bg-verified/5 hover:border-verified/50"
                            : "border-violating/30 bg-violating/5 hover:border-violating/50",
                        )}
                      >
                        <AnimatePresence mode="wait">
                          {ev.passed ? (
                            <motion.div
                              key="pass"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="fail"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                              <XCircle className="h-3.5 w-3.5 text-violating shrink-0" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-xs font-mono font-medium">{ev.name}</span>
                        <SeverityBadge severity={ev.severity as "critical" | "high" | "medium" | "low"} soft={ev.soft} />
                        <span className={cn(
                          "ml-auto text-[11px] font-mono tabular-nums",
                          ev.passed ? "text-verified" : "text-violating",
                        )}>
                          {ev.passed ? "PASS" : "FAIL"} · {ev.actual}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </GradientBorderCard>
          </motion.div>
        </div>

        {/* Diagnostics + AST + Enforcer column */}
        <div className="xl:col-span-2 space-y-4">
          {/* Validation summary */}
          <motion.div variants={cardVariants}>
            <GradientBorderCard gradient={result?.ok ? "from-verified/30 via-verified/10 to-verified/20" : result ? "from-violating/30 via-violating/10 to-repairing/20" : "from-border/30 via-border/10 to-border/20"}>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Braces className="h-4 w-4 text-verified" />
                  <h3 className="text-sm font-semibold">Validation</h3>
                  {result && (
                    <span className="ml-auto">
                      {result.ok ? (
                        <StatusPill status="verified" label={`${policy?.invariants.length ?? 0} invariants OK`} />
                      ) : (
                        <StatusPill status="violating" label={`${diagCounts.error} error(s)`} />
                      )}
                    </span>
                  )}
                </div>
                {result ? (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {result.diagnostics.length === 0 && (
                      <p className="text-xs text-verified flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> No diagnostics — policy is well-formed.
                      </p>
                    )}
                    {result.diagnostics.map((d, i) => {
                      const Icon =
                        d.level === "error" ? XCircle : d.level === "warning" ? AlertTriangle : Info;
                      const color =
                        d.level === "error"
                          ? "text-violating"
                          : d.level === "warning"
                            ? "text-repairing"
                            : "text-muted-foreground";
                      const borderColor =
                        d.level === "error"
                          ? "border-violating/30"
                          : d.level === "warning"
                            ? "border-repairing/30"
                            : "border-border/40";
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "flex items-start gap-2 rounded-md border bg-background/40 px-2.5 py-1.5 text-xs",
                            borderColor,
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", color)} />
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">L{d.line}</span>
                          <span className={color}>{d.message}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Press <span className="font-mono text-verified">Validate</span> to parse & semantically check the policy.
                  </p>
                )}

                {/* Policy health gauge */}
                {evaluations && evaluations.length > 0 && (
                  <div className="border-t border-border/40 pt-3">
                    <PolicyHealthGauge evaluations={evaluations} />
                  </div>
                )}
              </div>
            </GradientBorderCard>
          </motion.div>

          {/* Compiled enforcer */}
          <motion.div variants={cardVariants}>
            <GradientBorderCard gradient="from-verified/20 via-repairing/10 to-verified/20">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-verified" />
                  <h3 className="text-sm font-semibold">Compiled Enforcer</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                    {enforcer ? `${enforcer.invariantFingerprints.length} guardians` : "—"}
                  </span>
                </div>
                {enforcer ? (
                  <Tabs value={enforcerTab} onValueChange={(v) => setEnforcerTab(v as typeof enforcerTab)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="rust" className="text-xs">Rust</TabsTrigger>
                      <TabsTrigger value="wasm" className="text-xs">Wasm</TabsTrigger>
                      <TabsTrigger value="tla" className="text-xs">TLA+</TabsTrigger>
                    </TabsList>
                    {(["rust", "wasm", "tla"] as const).map((tab) => (
                      <TabsContent key={tab} value={tab}>
                        <ScrollArea className="max-h-[220px] rounded-md border border-border/40 bg-[oklch(0.12_0.01_165)]">
                          <pre className="codeblock p-3 text-[11px] text-[oklch(0.82_0.04_160)] leading-relaxed">
                            {tab === "rust" ? enforcer.rustPreview : tab === "wasm" ? enforcer.wasmPreview : enforcer.tlaPreview}
                          </pre>
                        </ScrollArea>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Compiled, zero-overhead guardians appear here after a successful validation.
                  </p>
                )}
                {enforcer && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Invariant fingerprints
                    </p>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                      {enforcer.invariantFingerprints.map((f, i) => (
                        <motion.div
                          key={f.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-2 text-[11px] rounded-md px-2 py-1 hover:bg-muted/20 transition-colors"
                        >
                          <Hash className="h-2.5 w-2.5 text-verified/60 shrink-0" />
                          <span className="font-mono text-muted-foreground truncate flex-1">{f.name}</span>
                          <span className="font-mono text-verified tabular-nums">{f.hash}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GradientBorderCard>
          </motion.div>

          {/* AST viewer */}
          <motion.div variants={cardVariants}>
            <GradientBorderCard gradient="from-repairing/20 via-verified/10 to-repairing/20">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Braces className="h-4 w-4 text-repairing" />
                  <h3 className="text-sm font-semibold">Parsed AST</h3>
                  {policy && (
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                      {policy.name}
                    </span>
                  )}
                  {policy && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 ml-1"
                          onClick={copyAst}
                        >
                          {astCopied ? (
                            <Check className="h-3 w-3 text-verified" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy AST to clipboard</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {policy ? (
                  <ScrollArea className="max-h-[260px] rounded-md border border-border/40 bg-[oklch(0.12_0.01_165)]">
                    <pre className="codeblock p-3 text-[11px] text-[oklch(0.82_0.04_160)] leading-relaxed">
                      {formatAst(policy)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground">No parsed policy yet.</p>
                )}
              </div>
            </GradientBorderCard>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

function formatAst(p: PolicyNode): string {
  const lines: string[] = [];
  lines.push(`Policy "${p.name}"`);
  if (p.domain) lines.push(`  domain: ${p.domain}`);
  if (p.version) lines.push(`  version: ${p.version}`);
  if (p.shard) {
    lines.push(
      `  shard by ${p.shard.dimension ?? "?"} {`,
    );
    lines.push(`    key: "${p.shard.key}"`);
    lines.push(`    strategy: ${p.shard.strategy}`);
    if (p.shard.count) lines.push(`    count: ${p.shard.count}`);
    if (p.shard.replication) lines.push(`    replication: ${p.shard.replication}`);
    lines.push(`  }`);
  }
  lines.push(`  invariants (${p.invariants.length}):`);
  for (const inv of p.invariants) {
    lines.push(
      `    ${inv.soft ? "soft " : ""}${inv.name} [${inv.severity}]`,
    );
    lines.push(`      predicate: ${inv.rawPredicate}`);
    if (inv.message) lines.push(`      message: "${inv.message}"`);
  }
  if (p.expectMerge) {
    lines.push(`  expect merge {`);
    for (const pres of p.expectMerge.preserves) lines.push(`    preserves ${pres}`);
    if (p.expectMerge.localityPreserving !== undefined)
      lines.push(`    locality_preserving: ${p.expectMerge.localityPreserving}`);
    for (const req of p.expectMerge.requires) lines.push(`    requires ${req}`);
    if (p.expectMerge.maxDivergence !== undefined)
      lines.push(`    max_divergence: ${p.expectMerge.maxDivergence}`);
    lines.push(`  }`);
  }
  if (p.onViolation) {
    lines.push(`  on_violation {`);
    lines.push(`    strategy: ${p.onViolation.strategy}`);
    lines.push(`    objective: ${p.onViolation.objective}`);
    if (p.onViolation.maxIters) lines.push(`    max_iters: ${p.onViolation.maxIters}`);
    lines.push(`  }`);
  }
  if (p.ancestry) {
    lines.push(`  ancestry {`);
    lines.push(`    proof: ${p.ancestry.proof}`);
    lines.push(`    zk: ${p.ancestry.zk}`);
    lines.push(`    gossip: ${p.ancestry.gossip}`);
    lines.push(`    anchor: ${p.ancestry.anchor}`);
    lines.push(`  }`);
  }
  if (p.shadowBridge) {
    lines.push(`  shadow_bridge {`);
    lines.push(`    enabled: ${p.shadowBridge.enabled}`);
    if (p.shadowBridge.takeoverLatencyMs !== undefined)
      lines.push(`    takeover_latency_ms: ${p.shadowBridge.takeoverLatencyMs}`);
    if (p.shadowBridge.whatifBranching !== undefined)
      lines.push(`    whatif_branching: ${p.shadowBridge.whatifBranching}`);
    lines.push(`  }`);
  }
  if (p.exports.length) lines.push(`  exports: ${p.exports.join(", ")}`);
  return lines.join("\n");
}
