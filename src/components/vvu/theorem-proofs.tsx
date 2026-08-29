"use client";

/**
 * <InteractiveTheoremProofs> — expandable accordion of the five EIS theorems.
 *
 * Renders a vertical stack of theorem cards. Each card collapses to a one-line
 * statement (with theorem number badge, name, formula, and a "Proof sketch"
 * chevron) and expands into a step-by-step proof sketch with mathematical
 * formulas rendered via <CodeBlock>, plus a "References" footer linking to
 * related theorems and concepts.
 *
 * Theorems covered (substantive, real EIS proofs):
 *   1. Evidence Bound            |E_claim| ≤ N_ind · log(1/δ)
 *   2. N_ind via Participation    N_ind = (Σ √λ_i)² / Σ λ_i
 *   3. Heat Kernel Diffusion      K_t = e^{−tL}
 *   4. State Lattice Closure      A : S → {authorized, denied} is monotonic
 *   5. Fail-closed System Closure P0 ∧ CB ∧ CEISR ⇒ fail-closed
 *
 * Animation:
 *   - Staggered fade-in-up on first render (delay = index × 80ms)
 *   - Smooth height-auto + opacity expand/collapse via framer-motion
 *   - Chevron rotates 180° on open (CSS transition)
 *
 * Usage:
 *   <InteractiveTheoremProofs />
 *   <InteractiveTheoremProofs defaultOpen={2} />
 */

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, FunctionSquare, Lightbulb, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/vvu/code-block";

type Accent = "emerald" | "amber" | "zinc";

interface ProofStep {
  title: string;
  body: string;
  formula?: string;
  formulaLabel?: string;
}

interface Theorem {
  number: number;
  tag: string;
  name: string;
  statement: string;
  formula: string;
  accent: Accent;
  steps: ProofStep[];
  references: string[];
}

const ACCENT_STYLES: Record<
  Accent,
  {
    stepBadge: string;
    stepBorder: string;
    cardGlow: string;
    icon: string;
  }
> = {
  emerald: {
    stepBadge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30",
    stepBorder: "border-l-emerald-500/50",
    cardGlow: "shadow-[0_0_0_1px_rgba(16,185,129,0.10)]",
    icon: "text-emerald-500/80",
  },
  amber: {
    stepBadge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
    stepBorder: "border-l-amber-500/50",
    cardGlow: "shadow-[0_0_0_1px_rgba(245,158,11,0.10)]",
    icon: "text-amber-500/80",
  },
  zinc: {
    stepBadge:
      "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-500/30",
    stepBorder: "border-l-zinc-500/50",
    cardGlow: "shadow-[0_0_0_1px_rgba(113,113,122,0.10)]",
    icon: "text-zinc-500/80",
  },
};

const THEOREMS: Theorem[] = [
  {
    number: 1,
    tag: "Theorem 1",
    name: "Evidence Bound",
    accent: "emerald",
    statement:
      "For a claim with N_ind independent evidence sources and failure probability δ, the admissible evidence count is bounded.",
    formula: "|E_claim| ≤ N_ind · log(1/δ)",
    steps: [
      {
        title: "Partition the evidence set",
        body: "Let E_claim = {e_1, …, e_n} be the admissible evidence items. Partition E_claim into N_ind source classes, where each C_i collects items drawn from a single independent source.",
        formula: "E_claim = C_1 ⊔ C_2 ⊔ … ⊔ C_{N_ind}",
        formulaLabel: "partition",
      },
      {
        title: "Bound within-class correlation",
        body: "Items inside one source class are positively correlated; the worst case is perfect correlation. Independence lives only between classes, not within them.",
        formula: "∀ e_j, e_k ∈ C_i :  corr(e_j, e_k) ≥ 0   (worst case = 1)",
        formulaLabel: "correlation",
      },
      {
        title: "Apply Boole's union bound",
        body: "The probability that any class fails is at most the sum of per-class failure probabilities. Independence across classes licenses the union bound.",
        formula: "P( ⋃_{i=1}^{N_ind} fail_i )  ≤  Σ_{i=1}^{N_ind} P(fail_i)",
        formulaLabel: "union bound",
      },
      {
        title: "Allocate the failure budget",
        body: "Split the global failure probability δ evenly across the N_ind classes so the total stays within budget.",
        formula: "P(fail_i) ≤ δ / N_ind   ⇒   P(⋃ fail_i) ≤ δ",
        formulaLabel: "budget",
      },
      {
        title: "Solve for the admissible count",
        body: "Each class contributes at most log(N_ind/δ) usable items before its budget is exhausted. Summing across N_ind classes yields the bound.",
        formula: "n ≤ N_ind · log(1/δ)",
        formulaLabel: "solve",
      },
      {
        title: "Conclude the evidence bound",
        body: "The total admissible evidence count is bounded by N_ind · log(1/δ). Adding more evidence past this point cannot improve the claim's confidence guarantee — it is redundant.",
        formula: "|E_claim| ≤ N_ind · log(1/δ)   ∎",
        formulaLabel: "QED",
      },
    ],
    references: ["N_ind computation — Theorem 2", "Participation Ratio", "Evidence Mesh"],
  },
  {
    number: 2,
    tag: "Theorem 2",
    name: "N_ind via Participation Ratio",
    accent: "amber",
    statement:
      "The number of truly independent evidence sources equals the participation ratio of the heat-kernel eigenvalue spectrum.",
    formula: "N_ind = (Σ √λ_i)² / Σ λ_i",
    steps: [
      {
        title: "Construct the evidence-mesh graph",
        body: "Treat each evidence item as a node. Edges connect items that share provenance, embedding similarity, or temporal co-occurrence, forming graph G = (V, E).",
        formula: "G = (V, E),   V = { evidence items }",
        formulaLabel: "mesh",
      },
      {
        title: "Compute the graph Laplacian",
        body: "Form L = D − A, where D is the degree matrix and A the (weighted) adjacency matrix. L encodes the mesh's diffusion geometry.",
        formula: "L = D − A,   D = diag(deg(v_i))",
        formulaLabel: "Laplacian",
      },
      {
        title: "Extract the heat-kernel spectrum",
        body: "Apply the heat kernel K_t = e^{−tL} and read off its eigenvalues {λ_1, …, λ_n}. These summarize how strongly each principal mode of the evidence mesh participates in diffusion.",
        formula: "K_t = e^{−tL},   spectrum {λ_1, …, λ_n}",
        formulaLabel: "spectrum",
      },
      {
        title: "Compute the participation ratio",
        body: "The participation ratio PR weights each eigenmode by its effective rank contribution. A single dominant mode gives PR ≈ 1; N equal modes give PR = N.",
        formula: "PR = ( Σ √λ_i )² / Σ λ_i",
        formulaLabel: "PR",
      },
      {
        title: "Prove rotation invariance",
        body: "PR depends only on the eigenvalue multiset, not the eigenbasis. Any orthogonal change of basis Q leaves PR unchanged, so PR is a spectral invariant.",
        formula: "PR(Q Λ Q^T) = PR(Λ)   ∀ orthogonal Q",
        formulaLabel: "invariance",
      },
      {
        title: "Identify N_ind with PR",
        body: "Because PR counts the effective number of independent spectral modes — and each independent source contributes one such mode — set N_ind := PR. QED.",
        formula: "N_ind := PR   ∎",
        formulaLabel: "QED",
      },
    ],
    references: ["Heat Kernel — Theorem 3", "Evidence Mesh", "Theorem 1"],
  },
  {
    number: 3,
    tag: "Theorem 3",
    name: "Heat Kernel Diffusion",
    accent: "emerald",
    statement:
      "The heat kernel operator diffuses evidence weights over the mesh while preserving spectral geometry.",
    formula: "K_t = e^{−tL}",
    steps: [
      {
        title: "Spectral decomposition",
        body: "Diagonalize L = V Λ V^T. The heat kernel admits the closed-form spectral decomposition below, where v_i are Laplacian eigenvectors and λ_i the corresponding eigenvalues.",
        formula: "K_t = e^{−tL} = Σ_i e^{−tλ_i} v_i v_i^T",
        formulaLabel: "decomposition",
      },
      {
        title: "Verify the heat equation",
        body: "Differentiating the spectral form gives ∂K_t/∂t = −L K_t, confirming K_t solves the heat equation with initial condition K_0 = I.",
        formula: "∂K_t/∂t = −L K_t",
        formulaLabel: "PDE",
      },
      {
        title: "Boundary behavior",
        body: "At t = 0 the kernel is the identity; as t → ∞ it collapses onto the projection onto ker L (the constant eigenvector), washing out all high-frequency structure.",
        formula: "K_0 = I,   K_∞ = Π_{ker L}",
        formulaLabel: "limits",
      },
      {
        title: "Heat trace as spectral fingerprint",
        body: "The trace tr(K_t) = Σ_i e^{−tλ_i} is the heat trace. It encodes the full eigenvalue spectrum and is the quantity used by Theorem 2 to compute N_ind.",
        formula: "tr(K_t) = Σ_i e^{−tλ_i}",
        formulaLabel: "trace",
      },
      {
        title: "Low-frequency preservation",
        body: "Diffusion attenuates high-λ (high-frequency) modes exponentially while leaving low-λ modes nearly intact. Evidence weights are smoothed without erasing their dominant structure.",
        formula: "‖K_t u‖₂ → ‖u‖_{low-λ}   as  t grows",
        formulaLabel: "smoothing",
      },
      {
        title: "Spectral geometry preserved",
        body: "Because K_t acts by scalar rescaling of each eigenmode, the eigenvalue ratios λ_i/λ_j — and hence the participation ratio — are invariant under diffusion. QED.",
        formula: "λ_i / λ_j  unchanged  ∀ t   ∎",
        formulaLabel: "QED",
      },
    ],
    references: ["Theorem 2 — Participation Ratio", "Evidence Mesh", "Circuit Breaker"],
  },
  {
    number: 4,
    tag: "Theorem 4",
    name: "State Lattice Closure",
    accent: "zinc",
    statement:
      "PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE; FALSIFIED ⊥ everything. The lattice is closed under the authorization operator.",
    formula: "A : S → {authorized, denied}  is monotonic & total",
    steps: [
      {
        title: "Define the partial order",
        body: "Order verification states by epistemic strength: stronger evidence yields a higher state. This partial order reflects how much a state can support an authorization decision.",
        formula: "PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE",
        formulaLabel: "order",
      },
      {
        title: "Isolate FALSIFIED",
        body: "FALSIFIED is incomparable to every other state (⊥) and is an absorbing state: once a claim is falsified, no later evidence can lift it out.",
        formula: "FALSIFIED ⊥ s   ∀ s ≠ FALSIFIED;   FALSIFIED absorbing",
        formulaLabel: "⊥",
      },
      {
        title: "Define the authorization operator",
        body: "The operator A maps each verification state to an authorization verdict. The codomain is the two-element lattice {authorized, denied}.",
        formula: "A : S → { authorized, denied }",
        formulaLabel: "operator",
      },
      {
        title: "Prove monotonicity",
        body: "If s₁ ≥ s₂ then A(s₁) ≥ A(s₂). Stronger states authorize at least as often as weaker ones — authorization respects the lattice order.",
        formula: "s₁ ≥ s₂   ⇒   A(s₁) ≥ A(s₂)",
        formulaLabel: "monotone",
      },
      {
        title: "Fail-closed below threshold",
        body: "For any state strictly below SUPPORTED, A returns denied. The lattice boundary acts as a hard authorization gate.",
        formula: "s < SUPPORTED   ⇒   A(s) = denied",
        formulaLabel: "gate",
      },
      {
        title: "FALSIFIED is unconditionally denied",
        body: "Regardless of other inputs, A(FALSIFIED) = denied. This guarantees falsified claims can never slip through to authorization.",
        formula: "A(FALSIFIED) = denied   (unconditionally)",
        formulaLabel: "deny",
      },
      {
        title: "Conclude closure",
        body: "Every reachable transition maps into S, and A is total on S. No state or operator can produce an undefined configuration. The lattice is closed. QED.",
        formula: "∀ reachable s :  A(s) ∈ { authorized, denied }   ∎",
        formulaLabel: "QED",
      },
    ],
    references: ["Fail-closed — Theorem 5", "CEISR Authorization", "P0 Integrity"],
  },
  {
    number: 5,
    tag: "Theorem 5",
    name: "Fail-closed System Closure",
    accent: "amber",
    statement:
      "Under P0 integrity + Circuit Breaker + CEISR conjunctive authorization, no false authorization is possible — the system is fail-closed.",
    formula: "P0 ∧ CB ∧ (C·E·I·S·R)  ⇒  fail-closed",
    steps: [
      {
        title: "Assume P0 integrity",
        body: "P0 requires hash match (H), valid signature (S), and tamper check (T) all to be TRUE. Without P0, no downstream authorization may proceed.",
        formula: "P0 : H ∧ S ∧ T = TRUE",
        formulaLabel: "P0",
      },
      {
        title: "Assume the circuit breaker is armed",
        body: "The breaker trips on integrity violation, evidence staleness, or N_ind threshold breach. While tripped, all authorizations are revoked.",
        formula: "CB trips   ⇔   violation ∨ staleness ∨ threshold breach",
        formulaLabel: "CB",
      },
      {
        title: "Assume conjunctive authorization",
        body: "CEISR authorization is the logical AND of five conjuncts: claim state (C), evidence sufficiency (E), integrity (I), safety (S), and review (R).",
        formula: "A = C · E · I · S · R",
        formulaLabel: "CEISR",
      },
      {
        title: "Suppose, for contradiction, A = TRUE with a failed precondition",
        body: "Assume authorization is granted while at least one precondition is false. Both possible failure modes lead to contradiction.",
        formula: "Assume   A = TRUE   ∧   ∃ failed precondition",
        formulaLabel: "assume",
      },
      {
        title: "Case 1 — a CEISR conjunct fails",
        body: "If the failed precondition is one of {C, E, I, S, R}, the corresponding conjunct is FALSE, so A = C·E·I·S·R = FALSE. Contradiction with A = TRUE.",
        formula: "Case 1:  precondition ⊂ {C,E,I,S,R} fails   ⇒   A = FALSE.   ⊥",
        formulaLabel: "case 1",
      },
      {
        title: "Case 2 — integrity fails between P0 and A",
        body: "If integrity degrades after P0 was checked but before A is evaluated, the circuit breaker trips and revokes A. Contradiction with A = TRUE.",
        formula: "Case 2:  integrity fails   ⇒   CB trips   ⇒   A revoked.   ⊥",
        formulaLabel: "case 2",
      },
      {
        title: "Conclude fail-closure",
        body: "Both cases contradict A = TRUE. Therefore, under all three guards, A = TRUE implies every precondition holds. The system is fail-closed. QED.",
        formula: "A = TRUE   ⇒   all preconditions hold.   Fail-closed.   ∎",
        formulaLabel: "QED",
      },
    ],
    references: ["P0 Integrity", "Circuit Breaker", "CEISR Authorization", "Theorem 4"],
  },
];

export interface InteractiveTheoremProofsProps {
  /** Optional className for the outer wrapper. */
  className?: string;
  /** Initially expanded theorem number (1-5). Default: none collapsed. */
  defaultOpen?: number;
}

export function InteractiveTheoremProofs({
  className,
  defaultOpen,
}: InteractiveTheoremProofsProps) {
  const [openSet, setOpenSet] = React.useState<Set<number>>(() => {
    if (!defaultOpen || defaultOpen < 1 || defaultOpen > THEOREMS.length) {
      return new Set<number>();
    }
    return new Set<number>([defaultOpen - 1]);
  });

  const toggle = React.useCallback((index: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    setOpenSet(new Set(THEOREMS.map((_, i) => i)));
  }, []);

  const collapseAll = React.useCallback(() => {
    setOpenSet(new Set<number>());
  }, []);

  const allOpen = openSet.size === THEOREMS.length;
  const noneOpen = openSet.size === 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FunctionSquare className="size-3.5 text-emerald-500/70" />
          <span className="font-medium">
            5 EIS theorems · interactive proof sketches
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={expandAll}
            disabled={allOpen}
            className="h-7 px-2.5 text-xs"
          >
            Expand all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            disabled={noneOpen}
            className="h-7 px-2.5 text-xs"
          >
            Collapse all
          </Button>
        </div>
      </div>

      {/* theorem cards */}
      {THEOREMS.map((theorem, index) => {
        const isOpen = openSet.has(index);
        const accent = ACCENT_STYLES[theorem.accent];
        return (
          <motion.div
            key={theorem.number}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card
              className={cn(
                "gap-0 overflow-hidden py-0 transition-shadow duration-200",
                isOpen ? accent.cardGlow : undefined
              )}
            >
              <Collapsible open={isOpen} onOpenChange={() => toggle(index)}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`proof-content-${theorem.number}`}
                    className={cn(
                      "group flex w-full items-start gap-3 px-4 py-4 text-left",
                      "outline-none transition-colors hover:bg-muted/40",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      "md:px-5"
                    )}
                  >
                    {/* theorem number badge — always emerald */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center",
                        "rounded-full bg-emerald-500/15 text-sm font-bold",
                        "text-emerald-700 dark:text-emerald-300",
                        "ring-1 ring-emerald-500/30"
                      )}
                    >
                      {theorem.number}
                    </span>

                    {/* name + statement + formula */}
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                          {theorem.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-border/60 bg-muted/40 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {theorem.tag}
                        </Badge>
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {theorem.statement}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/80">
                        <FunctionSquare
                          className={cn("size-3 shrink-0", accent.icon)}
                        />
                        <span className="truncate">{theorem.formula}</span>
                      </span>
                    </span>

                    {/* expand chevron + label */}
                    <span
                      aria-hidden="true"
                      className="mt-1 flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70"
                    >
                      <span className="hidden sm:inline">Proof sketch</span>
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isOpen ? "rotate-180" : "rotate-0",
                          "group-hover:text-foreground"
                        )}
                      />
                    </span>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent forceMount asChild>
                  <motion.div
                    id={`proof-content-${theorem.number}`}
                    role="region"
                    aria-label={`Proof sketch for ${theorem.name}`}
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.32,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="border-t border-border/60 bg-muted/20 px-4 py-4 md:px-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Lightbulb
                          className={cn("size-3.5", accent.icon)}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Proof sketch · {theorem.steps.length} steps
                        </span>
                      </div>

                      <ol className="flex flex-col gap-2.5">
                        {theorem.steps.map((step, stepIdx) => (
                          <li
                            key={stepIdx}
                            className={cn(
                              "rounded-md border border-border/50 border-l-2 bg-background/60 p-3",
                              accent.stepBorder
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center",
                                  "rounded-full text-[10px] font-bold",
                                  accent.stepBadge
                                )}
                              >
                                {stepIdx + 1}
                              </span>
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="text-sm font-semibold leading-tight text-foreground">
                                  {step.title}
                                </span>
                                <span className="text-xs leading-relaxed text-muted-foreground">
                                  {step.body}
                                </span>
                                {step.formula ? (
                                  <CodeBlock
                                    label={step.formulaLabel}
                                    className="mt-1.5"
                                  >
                                    {step.formula}
                                  </CodeBlock>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>

                      {/* references footer */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3">
                        <Link2 className="size-3 text-muted-foreground/70" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          References
                        </span>
                        {theorem.references.map((ref, refIdx) => (
                          <Badge
                            key={refIdx}
                            variant="outline"
                            className="border-border/60 bg-background/60 text-[10px] font-normal text-muted-foreground"
                          >
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default InteractiveTheoremProofs;
