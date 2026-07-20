"use client";

import { useCallback, useMemo, useState } from "react";
import { CircuitBoard, Lock, KeyRound, ArrowRight, Cpu, ShieldCheck, Zap, FileKey, Eye, EyeOff, Clock, CheckCircle2, XCircle, Activity, BarChart3, Hash, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SAMPLE_POLICIES, validateEpd, type PolicyNode } from "@/lib/epd";
import { motion } from "framer-motion";
import { GradientBorderCard, containerVariants, cardVariants, itemVariants, GridOverlay, StatusPill } from "./primitives";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

interface CircuitGate { id: string; type: "input" | "constraint" | "aggregate" | "output"; label: string; sublabel?: string; x: number; y: number; invariant?: string }
interface CircuitWire { from: string; to: string; kind: "private" | "public" }
interface ProofHistoryEntry { id: string; timestamp: string; status: "verified" | "pending" | "failed"; provingTimeMs: number; constraintCount: number; shardKey: string }
interface Circuit { gates: CircuitGate[]; wires: CircuitWire[]; publicInputs: string[]; privateInputs: string[]; constraintCount: number; estimatedRows: number; provingKeySize: string; verificationKeySize: string }
interface VerificationAttempt { id: string; timestamp: string; proofId: string; verified: boolean; timeMs: number }

function synthesizeCircuit(policy: PolicyNode): Circuit {
  const gates: CircuitGate[] = [], wires: CircuitWire[] = [];
  const fields = new Set<string>();
  for (const inv of policy.invariants) { if (inv.predicate) extractIdents(inv.predicate, fields); }
  const privateInputs = Array.from(fields), publicInputs = ["mmr_root", "policy_hash", "nonce"];
  const inputX = 40, constraintX = 220, aggregateX = 420, outputX = 560;
  privateInputs.forEach((f, i) => {
    const y = 50 + i * 42;
    gates.push({ id: `in-${f}`, type: "input", label: f, sublabel: "private", x: inputX, y });
    policy.invariants.forEach((inv) => { const invFields = new Set<string>(); if (inv.predicate) extractIdents(inv.predicate, invFields); if (invFields.has(f)) wires.push({ from: `in-${f}`, to: `c-${inv.name}`, kind: "private" }); });
  });
  policy.invariants.forEach((inv, j) => {
    const y = 50 + j * 52;
    gates.push({ id: `c-${inv.name}`, type: "constraint", label: inv.name, sublabel: inv.severity + (inv.soft ? " · soft" : ""), x: constraintX, y, invariant: inv.name });
    wires.push({ from: `c-${inv.name}`, to: "agg-all", kind: "private" });
  });
  const aggY = 50 + (policy.invariants.length - 1) * 26;
  gates.push({ id: "agg-all", type: "aggregate", label: "ALL(invariants)", sublabel: "conjunction", x: aggregateX, y: aggY });
  gates.push({ id: "out-pass", type: "output", label: "pass", sublabel: "public", x: outputX, y: aggY - 20 });
  gates.push({ id: "out-root", type: "output", label: "new_mmr_root", sublabel: "public", x: outputX, y: aggY + 20 });
  wires.push({ from: "agg-all", to: "out-pass", kind: "public" }, { from: "agg-all", to: "out-root", kind: "public" });
  publicInputs.forEach((p, i) => {
    gates.push({ id: `pub-${p}`, type: "input", label: p, sublabel: "public", x: inputX, y: 50 + (privateInputs.length + i) * 42 + 20 });
    wires.push({ from: `pub-${p}`, to: "agg-all", kind: "public" });
  });
  const constraintCount = policy.invariants.length + privateInputs.length * 2 + 4;
  const estimatedRows = constraintCount * 8 + privateInputs.length * 3;
  return { gates, wires, publicInputs, privateInputs, constraintCount, estimatedRows, provingKeySize: `${(estimatedRows * 0.12).toFixed(1)} MB`, verificationKeySize: `${(constraintCount * 0.04 + 0.8).toFixed(1)} KB` };
}

function extractIdents(expr: unknown, out: Set<string>) {
  if (!expr || typeof expr !== "object") return;
  const e = expr as Record<string, unknown>;
  if (e.kind === "ident") out.add(e.name as string);
  else if (e.kind === "unary") extractIdents(e.operand, out);
  else if (e.kind === "binary" || e.kind === "logic" || e.kind === "compare") { extractIdents(e.left, out); extractIdents(e.right, out); }
  else if (e.kind === "in") { extractIdents(e.value, out); extractIdents((e.range as unknown[])[0], out); extractIdents((e.range as unknown[])[1], out); }
  else if (e.kind === "call") (e.args as unknown[]).forEach((a) => extractIdents(a, out));
}

function generateProofHistory(circuit: Circuit): ProofHistoryEntry[] {
  const entries: ProofHistoryEntry[] = [], now = Date.now();
  for (let i = 0; i < 8; i++) {
    const status = i === 2 ? "failed" : i === 5 ? "pending" : "verified";
    entries.push({ id: `proof-${i + 1}`, timestamp: new Date(now - (8 - i) * 180000).toISOString(), status, provingTimeMs: Math.round(800 + Math.random() * 2400), constraintCount: circuit.constraintCount + Math.round(Math.random() * 4 - 2), shardKey: `shard-${String.fromCharCode(65 + (i % 3))}` });
  }
  return entries;
}

export function ZkCircuitSection() {
  const [filename, setFilename] = useState(SAMPLE_POLICIES[0].filename);
  const [showWires, setShowWires] = useState(true);
  const [revealPrivate, setRevealPrivate] = useState(false);
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);
  const [selectedProofId, setSelectedProofId] = useState<string>("");
  const [verifyingSteps, setVerifyingSteps] = useState<Array<{ label: string; status: "idle" | "running" | "done" | "failed" }>>([]);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; timeMs: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationAttempt[]>([]);
  const [constraintOverrides, setConstraintOverrides] = useState<Record<string, boolean>>({});

  const { policy, circuit, proofHistory } = useMemo(() => {
    const sample = SAMPLE_POLICIES.find((s) => s.filename === filename);
    if (!sample) return { policy: null, circuit: null, proofHistory: [] as ProofHistoryEntry[] };
    const result = validateEpd(sample.source);
    const p = result.ast?.policies[0];
    if (!p) return { policy: null, circuit: null, proofHistory: [] as ProofHistoryEntry[] };
    const c = synthesizeCircuit(p);
    return { policy: p, circuit: c, proofHistory: generateProofHistory(c) };
  }, [filename]);

  const constraintData = useMemo(() => {
    if (!circuit) return [];
    return [
      { name: "Constraints", value: circuit.constraintCount, fill: "oklch(0.80 0.15 80 / 0.7)" },
      { name: "Private", value: circuit.privateInputs.length, fill: "oklch(0.68 0.015 160 / 0.5)" },
      { name: "Public", value: circuit.publicInputs.length, fill: "oklch(0.78 0.16 160 / 0.7)" },
      { name: "R1CS rows", value: Math.round(circuit.estimatedRows / 10), fill: "oklch(0.70 0.13 40 / 0.6)" },
    ];
  }, [circuit]);

  const constraintGates = useMemo(() => circuit.gates.filter(g => g.type === "constraint"), [circuit]);

  const constraintEnabled = useMemo(() => {
    const result: Record<string, boolean> = {};
    constraintGates.forEach(g => { result[g.id] = g.id in constraintOverrides ? constraintOverrides[g.id] : true; });
    return result;
  }, [constraintGates, constraintOverrides]);

  // Reset verification state when policy changes (render-time adjustment per React docs)
  const [prevFilename, setPrevFilename] = useState(filename);
  if (prevFilename !== filename) {
    setPrevFilename(filename);
    setSelectedProofId("");
    setVerifyingSteps([]);
    setVerificationResult(null);
    setIsVerifying(false);
  }

  const circuitSatisfied = useMemo(() =>
    constraintGates.length > 0 && constraintGates.every(g => constraintEnabled[g.id] !== false),
    [constraintGates, constraintEnabled]
  );

  const runVerification = useCallback(() => {
    if (!selectedProofId || isVerifying) return;
    const proof = proofHistory.find(p => p.id === selectedProofId);
    if (!proof) return;

    setIsVerifying(true);
    setVerificationResult(null);

    const stepsConfig = [
      { label: "Loading verification key...", delay: 300 },
      { label: "Computing public inputs...", delay: 500 },
      { label: "Checking pairing equation...", delay: 700 },
      { label: "Verifying MMR root inclusion...", delay: 400 },
    ];

    const willVerify = proof.status === "verified";
    const startTime = Date.now();

    setVerifyingSteps(stepsConfig.map(s => ({ label: s.label, status: "idle" as const })));

    let offset = 0;
    stepsConfig.forEach((step, i) => {
      setTimeout(() => {
        setVerifyingSteps(prev =>
          prev.map((s, j) =>
            j < i ? { ...s, status: "done" as const } :
            j === i ? { ...s, status: "running" as const } : s
          )
        );
      }, offset);
      offset += step.delay;
      setTimeout(() => {
        setVerifyingSteps(prev =>
          prev.map((s, j) =>
            j <= i ? { ...s, status: "done" as const } : s
          )
        );
      }, offset);
    });

    setTimeout(() => {
      const totalTime = Date.now() - startTime;
      const finalLabel = willVerify ? "Proof verified \u2713" : "Verification failed \u2717";
      setVerifyingSteps(prev => [
        ...prev.map(s => ({ ...s, status: "done" as const })),
        { label: finalLabel, status: willVerify ? ("done" as const) : ("failed" as const) },
      ]);
      setVerificationResult({ verified: willVerify, timeMs: totalTime });
      setIsVerifying(false);
      setVerificationHistory(prev => [
        { id: `v-${Date.now()}`, timestamp: new Date().toISOString(), proofId: selectedProofId, verified: willVerify, timeMs: totalTime },
        ...prev,
      ].slice(0, 10));
    }, offset + 200);
  }, [selectedProofId, isVerifying, proofHistory]);

  if (!policy || !circuit) return <GradientBorderCard gradientFrom="oklch(0.64 0.21 25 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-8 text-center"><p className="text-sm text-muted-foreground">Select a valid policy.</p></GradientBorderCard>;

  const zkEnabled = policy.ancestry?.zk ?? false;
  const width = 640, height = Math.max(280, 80 + Math.max(circuit.privateInputs.length, policy.invariants.length) * 46);

  return (
    <motion.section className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
      <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.4)" gradientTo="oklch(0.64 0.21 25 / 0.2)" className="p-4">
        <GridOverlay />
        <div className="relative flex flex-wrap items-center gap-3">
          <motion.div variants={cardVariants} className={cn("flex h-10 w-10 items-center justify-center rounded-lg border shrink-0", zkEnabled ? "border-verified/30 bg-verified/10 glow-verified" : "border-border/60 bg-muted/30")}>
            <CircuitBoard className={cn("h-5 w-5", zkEnabled ? "text-verified" : "text-muted-foreground")} />
          </motion.div>
          <motion.div variants={cardVariants} className="min-w-0 flex-1">
            <h2 className="text-base font-semibold flex items-center gap-2">
              ZK Proof Circuit
              {zkEnabled ? <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono"><Lock className="h-2.5 w-2.5 mr-0.5" /> zk-SNARK enabled</Badge>
                : <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground text-[9px] font-mono"><EyeOff className="h-2.5 w-2.5 mr-0.5" /> zk disabled in policy</Badge>}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Each invariant compiles to a constraint gate; state fields are private witnesses; the MMR root + pass/fail are public outputs.</p>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Select value={filename} onValueChange={setFilename}>
              <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{SAMPLE_POLICIES.map((s) => <SelectItem key={s.filename} value={s.filename}>{s.filename}</SelectItem>)}</SelectContent>
            </Select>
          </motion.div>
        </div>
      </GradientBorderCard>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div variants={cardVariants} className="lg:col-span-1 space-y-3">
          <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
            <div className="relative space-y-2.5">
              <div className="flex items-center gap-2 mb-1"><Cpu className="h-3.5 w-3.5 text-verified" /><span className="text-xs font-semibold">Circuit metrics</span></div>
              <Metric label="Constraints" value={String(circuit.constraintCount)} />
              <Metric label="R1CS rows" value={circuit.estimatedRows.toLocaleString()} />
              <Metric label="Private witnesses" value={String(circuit.privateInputs.length)} />
              <Metric label="Public inputs" value={String(circuit.publicInputs.length)} />
              <Metric label="Proving key" value={circuit.provingKeySize} accent="repairing" />
              <Metric label="Verification key" value={circuit.verificationKeySize} accent="verified" />
            </div>
          </GradientBorderCard>
          <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-3.5 w-3.5 text-repairing" /><span className="text-xs font-semibold">Constraint breakdown</span></div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={constraintData} layout="vertical" barCategoryGap={4}>
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "oklch(0.55 0.01 160)" }} axisLine={false} tickLine={false} width={70} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "oklch(0.22 0.014 168)", border: "1px solid oklch(0.32 0.014 165)", borderRadius: "6px", fontSize: "11px" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>{constraintData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GradientBorderCard>
          <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.2)" gradientTo="oklch(0.80 0.15 80 / 0.1)" className="p-4">
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 mb-1"><Eye className="h-3.5 w-3.5 text-repairing" /><span className="text-xs font-semibold">View options</span></div>
              <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">show wires</span><Switch checked={showWires} onCheckedChange={setShowWires} /></div>
              <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">reveal private</span><Switch checked={revealPrivate} onCheckedChange={setRevealPrivate} /></div>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{revealPrivate ? "Private witness values visible (debug mode)" : "Private witnesses hidden (production ZK)"}</p>
            </div>
          </GradientBorderCard>
          <GradientBorderCard gradientFrom="oklch(0.70 0.13 40 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
            <div className="relative space-y-1.5">
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-3.5 w-3.5 text-quarantined" /><span className="text-xs font-semibold">Privacy guarantee</span></div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{zkEnabled ? "A prover convinces a verifier that the proposed merge satisfies all invariants without revealing the underlying state. Only the MMR root and pass/fail are public." : "ZK is disabled for this policy. Enable ancestry.zk = true in the .epd source to compile a SNARK."}</p>
            </div>
          </GradientBorderCard>
        </motion.div>

        <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.78 0.16 160 / 0.2)" className="lg:col-span-3 p-4">
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CircuitBoard className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">{policy.name} · constraint graph</span>
              <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-verified/60" /> public wire</span>
                <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-muted-foreground/40" /> private witness</span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border/40 bg-background/40 p-2">
              <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label="ZK proof circuit diagram">
                <defs>
                  <filter id="gate-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <filter id="gate-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="oklch(0 0 0)" floodOpacity="0.3" /></filter>
                </defs>
                {showWires && circuit.wires.map((w, i) => {
                  const from = circuit.gates.find((g) => g.id === w.from), to = circuit.gates.find((g) => g.id === w.to);
                  if (!from || !to) return null;
                  const isPublic = w.kind === "public", isHovered = hoveredGate === w.from || hoveredGate === w.to;
                  return (
                    <g key={`w-${i}`}>
                      <path d={bezierPath(from.x + 90, from.y, to.x - 10, to.y)} fill="none"
                        stroke={isPublic ? "oklch(0.78 0.16 160)" : "oklch(0.42 0.01 165)"}
                        strokeWidth={isHovered ? 2.2 : isPublic ? 1.4 : 1} strokeOpacity={isHovered ? 1 : isPublic ? 0.7 : 0.45}
                        strokeDasharray={isPublic ? "0" : "4 3"} />
                      {isHovered && <circle r={2.5} fill={isPublic ? "oklch(0.78 0.16 160)" : "oklch(0.68 0.015 160)"} opacity={0.8}><animateMotion dur="1.5s" repeatCount="indefinite" path={bezierPath(from.x + 90, from.y, to.x - 10, to.y)} /></circle>}
                    </g>
                  );
                })}
                {circuit.gates.map((g) => <GateShape key={g.id} gate={g} revealPrivate={revealPrivate} isHovered={hoveredGate === g.id} onHover={setHoveredGate} />)}
              </svg>
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
              <LegendItem color="bg-verified/20 border-verified/40" label="input" />
              <LegendItem color="bg-repairing/20 border-repairing/40" label="constraint" />
              <LegendItem color="bg-quarantined/20 border-quarantined/40" label="aggregate" />
              <LegendItem color="bg-verified/30 border-verified/50" label="output" />
              <span className="ml-auto italic">hover a gate to trace connections</span>
            </div>
          </div>
        </GradientBorderCard>
      </div>

      <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.78 0.16 160 / 0.2)" className="p-4">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3"><FileKey className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Proving &amp; verification flow</span></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <FlowStep n={1} icon={Cpu} title="witness" detail="state delta + ancestry" />
            <FlowStep n={2} icon={CircuitBoard} title="R1CS" detail="constraint system" />
            <FlowStep n={3} icon={Zap} title="prove" detail="SNARK generation" accent="repairing" />
            <FlowStep n={4} icon={ArrowRight} title="submit" detail="proof + public I/O" />
            <FlowStep n={5} icon={ShieldCheck} title="verify" detail="constant-time check" accent="verified" />
          </div>
        </div>
      </GradientBorderCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
          <div className="relative">
            <div className="flex items-center gap-2 mb-2"><KeyRound className="h-4 w-4 text-verified" /><span className="text-sm font-semibold">Verification key registry</span></div>
            <div className="space-y-1.5">
              <VkEntry label="Proving key" value={circuit.provingKeySize} hash={`pk_${policy.name.slice(0, 4)}_${circuit.constraintCount}_${circuit.estimatedRows}`} accent="repairing" />
              <VkEntry label="Verification key" value={circuit.verificationKeySize} hash={`vk_${policy.name.slice(0, 4)}_${circuit.constraintCount}_${Math.round(circuit.estimatedRows / 8)}`} accent="verified" />
              <VkEntry label="Circuit hash" value={`${circuit.constraintCount} constraints`} hash={`ch_${policy.name.slice(0, 4)}_${circuit.gates.length}g_${circuit.wires.length}w`} accent="verified" />
            </div>
          </div>
        </GradientBorderCard>
        <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
          <div className="relative">
            <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-repairing" /><span className="text-sm font-semibold">Proof history</span><Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing font-mono ml-auto">{proofHistory.length} proofs</Badge></div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {proofHistory.map((p, i) => (
                <motion.div key={p.id} variants={itemVariants} custom={i} whileHover={{ x: 2, scale: 1.005 }}
                  className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]", p.status === "verified" ? "border-verified/30 bg-verified/5" : p.status === "pending" ? "border-repairing/30 bg-repairing/5" : "border-violating/30 bg-violating/5")}>
                  {p.status === "verified" ? <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" /> : p.status === "pending" ? <Activity className="h-3.5 w-3.5 text-repairing shrink-0 animate-pulse" /> : <XCircle className="h-3.5 w-3.5 text-violating shrink-0" />}
                  <span className="font-mono font-medium">{p.id}</span><span className="text-muted-foreground">· {p.shardKey}</span><span className="text-muted-foreground">· {p.provingTimeMs}ms</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proofHistory.map((p) => ({ time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), provingTime: p.provingTimeMs, status: p.status }))} barCategoryGap={2}>
                  <XAxis dataKey="time" tick={{ fontSize: 8, fill: "oklch(0.55 0.01 160)" }} axisLine={false} tickLine={false} /><YAxis hide />
                  <RechartsTooltip contentStyle={{ backgroundColor: "oklch(0.22 0.014 168)", border: "1px solid oklch(0.32 0.014 165)", borderRadius: "6px", fontSize: "11px" }} formatter={(value: number) => [`${value}ms`, "Proving time"]} />
                  <Bar dataKey="provingTime" radius={[2, 2, 0, 0]}>
                    {proofHistory.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.status === "verified" ? "oklch(0.78 0.16 160 / 0.7)" : entry.status === "pending" ? "oklch(0.80 0.15 80 / 0.7)" : "oklch(0.64 0.21 25 / 0.7)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GradientBorderCard>
      </div>

      {/* ─── Interactive Proof Verification ─── */}
      <motion.div variants={cardVariants} className="flex items-center gap-2.5 pt-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-verified/30 bg-verified/10">
          <ShieldCheck className="h-4 w-4 text-verified" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Interactive Proof Verification</h3>
          <p className="text-[10px] text-muted-foreground">Simulate step-by-step ZK proof verification &amp; test circuit satisfaction</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Verify Proof Panel */}
          <GradientBorderCard gradientFrom="oklch(0.78 0.16 160 / 0.3)" gradientTo="oklch(0.64 0.21 25 / 0.15)" className="p-4">
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-verified" />
                <span className="text-xs font-semibold">Verify Proof</span>
                {verificationResult && (
                  <StatusPill
                    status={verificationResult.verified ? "verified" : "violating"}
                    label={verificationResult.verified ? "Verified" : "Failed"}
                    className="ml-auto text-[9px]"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedProofId} onValueChange={setSelectedProofId}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue placeholder="Select a proof..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proofHistory.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.id} · {p.status} · {p.provingTimeMs}ms
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <motion.button
                  onClick={runVerification}
                  disabled={!selectedProofId || isVerifying}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedProofId && !isVerifying
                      ? "border-verified/30 bg-verified/10 text-verified hover:bg-verified/20"
                      : "border-border/40 bg-muted/20 text-muted-foreground cursor-not-allowed"
                  )}
                  whileHover={selectedProofId && !isVerifying ? { scale: 1.02 } : undefined}
                  whileTap={selectedProofId && !isVerifying ? { scale: 0.98 } : undefined}
                >
                  {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Verify
                </motion.button>
              </div>

              {verifyingSteps.length > 0 && (
                <div className="space-y-1.5 rounded-md border border-border/40 bg-background/40 p-3">
                  {verifyingSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      {step.status === "idle" && <span className="h-3.5 w-3.5 rounded-full border border-border/60 bg-muted/20 shrink-0" />}
                      {step.status === "running" && <Loader2 className="h-3.5 w-3.5 text-repairing animate-spin shrink-0" />}
                      {step.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />}
                      {step.status === "failed" && <XCircle className="h-3.5 w-3.5 text-violating shrink-0" />}
                      <span className={cn(
                        step.status === "idle" ? "text-muted-foreground/50" :
                        step.status === "running" ? "text-repairing font-medium" :
                        step.status === "done" ? "text-verified" :
                        "text-violating font-medium"
                      )}>{step.label}</span>
                    </motion.div>
                  ))}

                  {verificationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-2 flex items-center justify-between rounded-md border px-3 py-2",
                        verificationResult.verified
                          ? "border-verified/30 bg-verified/5"
                          : "border-violating/30 bg-violating/5"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {verificationResult.verified
                          ? <CheckCircle2 className="h-4 w-4 text-verified" />
                          : <XCircle className="h-4 w-4 text-violating" />}
                        <span className={cn("text-xs font-semibold", verificationResult.verified ? "text-verified" : "text-violating")}>
                          {verificationResult.verified ? "Proof Verified" : "Verification Failed"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{verificationResult.timeMs}ms</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </GradientBorderCard>

          {/* Verification Results History */}
          <GradientBorderCard gradientFrom="oklch(0.80 0.15 80 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-repairing" />
                <span className="text-xs font-semibold">Verification History</span>
                {verificationHistory.length > 0 && (
                  <Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing font-mono ml-auto">
                    {verificationHistory.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                {verificationHistory.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-[11px] text-muted-foreground/50">
                    No verifications run yet
                  </div>
                ) : (
                  verificationHistory.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]",
                        v.verified ? "border-verified/30 bg-verified/5" : "border-violating/30 bg-violating/5"
                      )}
                    >
                      {v.verified
                        ? <CheckCircle2 className="h-3 w-3 text-verified shrink-0" />
                        : <XCircle className="h-3 w-3 text-violating shrink-0" />}
                      <span className="font-mono font-medium">{v.proofId}</span>
                      <span className="text-muted-foreground">· {v.timeMs}ms</span>
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                        {new Date(v.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </GradientBorderCard>
        </div>

        {/* Circuit Satisfaction Test */}
        <GradientBorderCard gradientFrom="oklch(0.70 0.13 40 / 0.3)" gradientTo="oklch(0.32 0.014 165 / 0.1)" className="p-4">
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <CircuitBoard className="h-3.5 w-3.5 text-quarantined" />
              <span className="text-xs font-semibold">Circuit Satisfaction</span>
              {circuitSatisfied ? (
                <StatusPill status="verified" label="Satisfied" className="ml-auto text-[9px]" />
              ) : (
                <StatusPill status="violating" label="Unsatisfied" className="ml-auto text-[9px]" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Toggle constraint gates to test circuit satisfaction. All gates must be enabled for the circuit to be satisfied.</p>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {constraintGates.map(gate => (
                <motion.div
                  key={gate.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
                    constraintEnabled[gate.id] !== false
                      ? "border-verified/20 bg-verified/5"
                      : "border-violating/20 bg-violating/5"
                  )}
                  whileHover={{ x: 2, scale: 1.005 }}
                >
                  {constraintEnabled[gate.id] !== false
                    ? <CheckCircle2 className="h-3 w-3 text-verified shrink-0" />
                    : <XCircle className="h-3 w-3 text-violating shrink-0" />}
                  <span className="font-mono font-medium flex-1 truncate">{gate.label}</span>
                  <span className="text-[9px] text-muted-foreground shrink-0">{gate.sublabel}</span>
                  <Switch
                    checked={constraintEnabled[gate.id] !== false}
                    onCheckedChange={(checked) => setConstraintOverrides(prev => ({ ...prev, [gate.id]: checked }))}
                    className="scale-75 origin-right"
                  />
                </motion.div>
              ))}
            </div>
            <div className={cn(
              "flex items-center justify-center gap-2 rounded-md border py-2.5 text-xs font-semibold",
              circuitSatisfied
                ? "border-verified/30 bg-verified/10 text-verified"
                : "border-violating/30 bg-violating/10 text-violating"
            )}>
              {circuitSatisfied
                ? <><CheckCircle2 className="h-4 w-4" /> Circuit Satisfied — All constraints pass</>
                : <><XCircle className="h-4 w-4" /> Circuit Unsatisfied — {constraintGates.filter(g => !constraintEnabled[g.id]).length} gate(s) disabled</>}
            </div>
          </div>
        </GradientBorderCard>
      </div>
    </motion.section>
  );
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1},${y1} C ${x1 + (x2 - x1) * 0.4},${y1} ${x2 - (x2 - x1) * 0.4},${y2} ${x2},${y2}`;
}

function GateShape({ gate, revealPrivate, isHovered, onHover }: { gate: CircuitGate; revealPrivate: boolean; isHovered: boolean; onHover: (id: string | null) => void }) {
  const w = 90, h = 30, x = gate.x, y = gate.y - h / 2;
  const isPrivate = gate.sublabel === "private", hidden = isPrivate && !revealPrivate;
  const config: Record<CircuitGate["type"], { fill: string; stroke: string; text: string }> = {
    input: { fill: "oklch(0.22 0.014 168)", stroke: "oklch(0.45 0.01 165)", text: "oklch(0.85 0.01 165)" },
    constraint: { fill: "oklch(0.25 0.03 80 / 0.6)", stroke: "oklch(0.80 0.15 80 / 0.7)", text: "oklch(0.90 0.10 80)" },
    aggregate: { fill: "oklch(0.25 0.03 40 / 0.6)", stroke: "oklch(0.70 0.13 40 / 0.8)", text: "oklch(0.90 0.10 40)" },
    output: { fill: "oklch(0.22 0.05 160 / 0.7)", stroke: "oklch(0.78 0.16 160)", text: "oklch(0.90 0.12 160)" },
  };
  const c = config[gate.type];
  return (
    <g onMouseEnter={() => onHover(gate.id)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={hidden ? "oklch(0.20 0.01 165)" : c.fill} stroke={hidden ? "oklch(0.35 0.02 165)" : c.stroke}
        strokeWidth={isHovered ? 2 : 1.2} strokeDasharray={hidden ? "3 2" : "0"} filter={isHovered ? "url(#gate-glow)" : "url(#gate-shadow)"} />
      {isHovered && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={5} fill="none" stroke={c.stroke} strokeWidth={0.5} opacity={0.5}><animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" /></rect>}
      <text x={x + w / 2} y={y + 13} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-geist-mono), monospace" fill={hidden ? "oklch(0.50 0.02 165)" : c.text} fontWeight={gate.type === "output" || gate.type === "aggregate" ? 600 : 400}>{hidden ? "•••••" : gate.label.length > 14 ? gate.label.slice(0, 12) + "…" : gate.label}</text>
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={7} fill="oklch(0.55 0.01 165)">{gate.sublabel}</text>
    </g>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "verified" | "repairing" }) {
  const color = accent === "verified" ? "text-verified" : accent === "repairing" ? "text-repairing" : "text-foreground";
  return <motion.div className="flex items-center justify-between" whileHover={{ x: 2 }}><span className="text-[11px] text-muted-foreground">{label}</span><span className={cn("font-mono text-xs font-medium", color)}>{value}</span></motion.div>;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-3 w-4 rounded-sm border", color)} />{label}</span>;
}

function FlowStep({ n, icon: Icon, title, detail, accent }: { n: number; icon: typeof Cpu; title: string; detail: string; accent?: "verified" | "repairing" }) {
  const color = accent === "verified" ? "text-verified border-verified/30 bg-verified/5" : accent === "repairing" ? "text-repairing border-repairing/30 bg-repairing/5" : "text-muted-foreground border-border/60 bg-background/40";
  return (
    <motion.div className={cn("rounded-md border p-2.5 relative", color)} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
      <div className="flex items-center gap-1.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/15 text-[9px] font-mono font-semibold">{n}</span><Icon className="h-3.5 w-3.5" /><span className="text-xs font-semibold">{title}</span></div>
      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{detail}</p>
    </motion.div>
  );
}

function VkEntry({ label, value, hash, accent }: { label: string; value: string; hash: string; accent: "verified" | "repairing" }) {
  const color = accent === "verified" ? "text-verified" : "text-repairing", border = accent === "verified" ? "border-verified/20" : "border-repairing/20";
  return (
    <motion.div className={cn("flex items-center gap-2 rounded border px-2.5 py-1.5", border)} whileHover={{ x: 2, scale: 1.005 }}>
      <Hash className={cn("h-3 w-3 shrink-0", color)} /><span className="text-[11px] text-muted-foreground shrink-0 w-28">{label}</span><span className={cn("text-[10px] font-mono", color)}>{value}</span><span className="ml-auto text-[9px] font-mono text-muted-foreground/60 truncate">{hash}</span>
    </motion.div>
  );
}
