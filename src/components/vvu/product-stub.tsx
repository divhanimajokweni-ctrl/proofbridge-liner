"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Activity, ShieldCheck } from "lucide-react";
import type { ProductMeta } from "./products";

interface SourceProof {
  gate: string; claim: string; command: string; source: string;
}

const PROOFS: Record<string, SourceProof[]> = {
  "proofbridge": [
    { gate: "RECEIPT", claim: "Ed25519-signed receipt issuance", command: "proofbridge issue --contribution <id> --signer <key>", source: "Epistemic Runtime §2.2 — Proof primitives" },
    { gate: "MMR", claim: "Merkle Mountain Range anchoring", command: "proofbridge anchor --mmr --receipt <hash>", source: "Epistemic Runtime §2.2 — MMR membership proofs" },
    { gate: "ZK", claim: "Zero-knowledge proof of ancestry", command: "proofbridge zk prove --circuit ancestry", source: "Proof Graph §6.9.1 — ProofKind enumeration" },
  ],
  "air-runtime": [
    { gate: "HF-001", claim: "TEE Attestation → Sensor Spoofing Prevention", command: "air gate validate --tee --signature <payload.sig>", source: "Evidence Compiler Pass 2 · ATECC608B root of trust" },
    { gate: "HF-002", claim: "ZK Proof Verification → Token Fraud Prevention", command: "verifier.verifyProof(_proof, _publicSignals)", source: "GovernanceAnchor.sol · ProofKind: CONSENSUS" },
    { gate: "HF-005", claim: "Decision Derivation → AI Hallucination Prevention", command: "air ledger verify --brier-threshold 0.02", source: "Policy rejection → Failure Fact · Brier ≤ 0.02" },
    { gate: "LVL-17", claim: "72-Hour Blackout Survival", command: "air ledger merge --hlc", source: "NATS durable queue · HLC deterministic merge" },
  ],
  "hbk": [
    { gate: "HF-005", claim: "MCMC derivation log signed & reproducible", command: "air ledger verify --derivation-log /tmp/mcmc.json", source: "Epistemic Runtime §3.3 — Policies Emit Facts" },
    { gate: "TRIP", claim: "Brier Score > 0.02 → TRIP verdict, crew dispatch blocked", command: "air ledger emit-failure --type POLICY_VIOLATION", source: "AIR Runbooks §5 — Failure Facts (Rejected)" },
    { gate: "LVL-14", claim: "Conflicting telemetry → human-in-the-loop clarification", command: "air ledger emit-fact --type HUMAN_INTERVENTION", source: "AIR Runbooks · Chaos Engineering Level 14" },
  ],
};

export function ProductStub({ product, onBackToSphere }: { product: ProductMeta; onBackToSphere: () => void }) {
  const Icon = product.icon;
  const proofs = PROOFS[product.id] ?? [];
  return (
    <div className="relative flex h-full flex-col overflow-y-auto" style={{ background: "radial-gradient(ellipse at 50% 20%, #0f0f18, #09090f 75%)" }}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${product.accent}, transparent)` }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50" style={{ background: `radial-gradient(ellipse at 50% 0%, ${product.accent}22, transparent 70%)` }} aria-hidden />
      <div className="relative mx-auto w-full max-w-[1180px] flex-1 px-6 py-10 sm:px-10 sm:py-14">
        <button onClick={onBackToSphere} className="group mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10.5px] text-muted-foreground transition-all hover:border-[var(--vvu-gold)]/40 hover:bg-[var(--vvu-gold)]/[0.06] hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Trust Sphere</span>
          <kbd className="ml-1 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground/80">Esc</kbd>
        </button>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex flex-col gap-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl border" style={{ borderColor: `${product.accent}55`, background: `${product.accent}11`, boxShadow: `0 0 32px ${product.accent}22` }}>
              <Icon className="h-7 w-7" style={{ color: product.accent }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>{product.label}</h1>
                <span className="rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider" style={{ borderColor: `${product.accent}40`, background: `${product.accent}10`, color: product.accent }}>
                  {product.status === "ONLINE" ? "Online" : "Coming Online"}
                </span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{product.tagline}</p>
            </div>
          </div>
          <p className="max-w-3xl text-[15px] leading-relaxed text-foreground/85">{product.mission}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {product.signals.map((sig) => (
            <div key={sig.label} className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
              <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: product.accent }} aria-hidden />
              <div className="flex items-center gap-2 text-muted-foreground"><Activity className="h-3 w-3" style={{ color: product.accent }} /><span className="font-mono text-[10px] uppercase tracking-wider">{sig.label}</span></div>
              <div className="mt-2 font-mono text-2xl font-medium text-foreground">{sig.value}</div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground/80">{sig.hint}</div>
            </div>
          ))}
        </motion.div>
        {proofs.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} className="mt-10">
            <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4" style={{ color: product.accent }} /><h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/80">Source Documentation · Hardcoded, Not Aspirational</h2></div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {proofs.map((proof) => (
                <div key={proof.gate} className="rounded-xl border border-white/[0.07] bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md border px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-wider" style={{ borderColor: `${product.accent}40`, background: `${product.accent}10`, color: product.accent }}>{proof.gate}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{proof.source}</span>
                  </div>
                  <div className="mt-2.5 text-[13px] font-medium text-foreground/90">{proof.claim}</div>
                  <pre className="mt-2.5 overflow-x-auto rounded-md border border-white/[0.06] bg-black/50 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-foreground/75"><code>{proof.command}</code></pre>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
