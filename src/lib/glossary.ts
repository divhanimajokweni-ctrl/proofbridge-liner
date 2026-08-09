/**
 * VVU SEARM Platform — Contextual Glossary
 *
 * Domain-specific terminology used throughout the Structural Evidence Accounting
 * & Redundancy Management (SEARM) platform. Definitions are intentionally
 * concise (1–2 sentences of plain English) so they render well inside hover
 * tooltips; the optional `formula` and `seeAlso` fields add depth without
 * crowding the inline surface.
 *
 * Keys are stable identifiers — components reference terms by key (e.g.
 * `<GlossaryTerm term="N_ind" />`) so prose can be reworded safely.
 */

export interface GlossaryEntry {
  /** Display name of the term (rendered in mono font in the tooltip). */
  term: string;
  /** 1–2 sentence plain-English definition. */
  definition: string;
  /** Optional formula or formal expression, rendered in mono font. */
  formula?: string;
  /** Optional list of related term keys/names (plain text, non-interactive). */
  seeAlso?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  N_ind: {
    term: "N_ind",
    definition:
      "Spectral diversification count — the effective number of truly independent evidence sources, computed via the participation ratio of heat-kernel eigenvalues. Higher values indicate stronger evidentiary redundancy and a more robust claim.",
    formula: "N_ind = (Σ √λ_i)² / Σ λ_i",
    seeAlso: ["Participation Ratio", "Heat Kernel", "Theorem 2"],
  },

  CEISR: {
    term: "CEISR",
    definition:
      "Authorization formula A = C · E · I · S · R — a conjunctive gate combining Claim form, Evidence, Integrity, Safety, and Review. Every factor must independently evaluate TRUE; any single FALSE factor denies authorization.",
    formula: "A = C · E · I · S · R",
    seeAlso: ["Authorization", "P0 Integrity", "Theorem 5"],
  },

  "Epistemic Pivot": {
    term: "Epistemic Pivot",
    definition:
      "Strategic reframing of VVU's role away from being an 'Oracle of Truth' toward providing honest structural accounting of evidence — quantifying what is known, how independently, and with what residual uncertainty.",
    seeAlso: ["SEARM", "State Lattice"],
  },

  "Spectral Diversification": {
    term: "Spectral Diversification",
    definition:
      "Quantitative measure of how independent the underlying evidence sources are, obtained via spectral analysis of the evidence-mesh graph Laplacian. It distinguishes genuine redundancy from correlated or duplicated sourcing.",
    formula: "diversity ∝ participation-ratio(λ_i)",
    seeAlso: ["N_ind", "Heat Kernel", "Evidence Mesh"],
  },

  "Heat Kernel": {
    term: "Heat Kernel",
    definition:
      "Diffusion operator K_t = e^{-tL} applied over the evidence-mesh graph Laplacian L. It smooths evidence weights across the mesh while preserving the spectral geometry that drives N_ind computation.",
    formula: "K_t = e^{-tL}",
    seeAlso: ["Evidence Mesh", "N_ind", "Theorem 2"],
  },

  "Participation Ratio": {
    term: "Participation Ratio",
    definition:
      "Effective number of independent components in an eigenvalue spectrum, given by (Σ √λ_i)² / Σ λ_i. It equals 1 when one mode dominates and equals the dimension when all modes contribute equally.",
    formula: "PR = (Σ √λ_i)² / Σ λ_i",
    seeAlso: ["N_ind", "Spectral Diversification"],
  },

  "Fail-closed": {
    term: "Fail-closed",
    definition:
      "Design principle: when verification cannot be completed, evidence is insufficient, or any subsystem is indeterminate, the system denies authorization rather than permitting the action. Default state is 'deny'.",
    seeAlso: ["P0 Integrity", "Circuit Breaker", "Theorem 5"],
  },

  "P0 Integrity": {
    term: "P0 Integrity",
    definition:
      "Foundational precondition for admissibility. P0 requires a hash match, a valid signature, and a passing tamper check — all three sub-checks must hold before any downstream claim evaluation may proceed.",
    formula: "P0 = H ∧ S ∧ T",
    seeAlso: ["CEISR", "Fail-closed", "Theorem 5"],
  },

  SEARM: {
    term: "SEARM",
    definition:
      "Structural Evidence Accounting & Redundancy Management — the core methodology of the VVU platform. It treats evidence as a measured, audited structural quantity rather than a qualitative judgment.",
    seeAlso: ["Epistemic Pivot", "Evidence Mesh", "State Lattice"],
  },

  "Circuit Breaker": {
    term: "Circuit Breaker",
    definition:
      "Automatic guard that trips — revoking any active authorization — when evidence integrity, freshness, or threshold conditions are violated. It is the runtime enforcement layer of the fail-closed principle.",
    seeAlso: ["Fail-closed", "STALE", "Theorem 5"],
  },

  "Evidence Mesh": {
    term: "Evidence Mesh",
    definition:
      "Graph structure whose nodes are evidence items and whose edges encode provenance and dependency relationships between them. The Laplacian of this graph drives N_ind and spectral-diversity computation.",
    formula: "L = D − A (graph Laplacian)",
    seeAlso: ["Heat Kernel", "N_ind", "Spectral Diversification"],
  },

  Authorization: {
    term: "Authorization",
    definition:
      "Conjunctive gate A = C · E · I · S · R that must evaluate TRUE before any claim-triggered action may proceed. A single FALSE factor denies the entire authorization — there is no partial grant.",
    formula: "A = C · E · I · S · R",
    seeAlso: ["CEISR", "P0 Integrity", "Fail-closed"],
  },

  "State Lattice": {
    term: "State Lattice",
    definition:
      "Partial order over verification states: PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE. FALSIFIED is incomparable with the upper chain and is terminal — it can never be promoted.",
    seeAlso: ["STALE", "SEARM"],
  },

  STALE: {
    term: "STALE",
    definition:
      "Verification state indicating that supporting evidence has exceeded the staleness window (default 7 days). Authorization is blocked while any contributing evidence remains in the STALE state until refreshed.",
    formula: "stale ⟺ age(evidence) > 7d",
    seeAlso: ["Circuit Breaker", "State Lattice"],
  },

  "BA-1": {
    term: "BA-1",
    definition:
      "'Banking Audit-1' calibration pilot — a 90-day, 4-phase engagement that calibrates VVU's thresholds (N_ind cutoffs, staleness windows, P0 strictness) against a partner bank's existing audit pipeline.",
    seeAlso: ["SEARM", "P0 Integrity", "N_ind"],
  },

  "Theorem 1": {
    term: "Theorem 1",
    definition:
      "Evidence Bound — a probabilistic upper bound on the count of admissible evidence items given a target failure probability δ. It links N_ind to the maximum credible evidence budget per claim.",
    formula: "|E_claim| ≤ N_ind · log(1/δ)",
    seeAlso: ["N_ind", "Theorem 2", "Evidence Mesh"],
  },

  "Theorem 2": {
    term: "Theorem 2",
    definition:
      "N_ind computation theorem — establishes that N_ind is computed via the participation ratio of the heat-kernel eigenvalues of the evidence-mesh Laplacian, giving a principled measure of source independence.",
    formula: "N_ind = (Σ √λ_i(K_t))² / Σ λ_i(K_t)",
    seeAlso: ["N_ind", "Heat Kernel", "Participation Ratio"],
  },

  "Theorem 5": {
    term: "Theorem 5",
    definition:
      "System Closure — under the joint enforcement of P0 integrity, the circuit breaker, and the CEISR authorization gate, the system is fail-closed: no false authorization is reachable in any admissible execution path.",
    formula: "P0 ∧ CircuitBreaker ∧ CEISR ⟹ Fail-closed",
    seeAlso: ["P0 Integrity", "Circuit Breaker", "CEISR", "Fail-closed"],
  },
};

/**
 * All glossary keys in declaration order — useful for rendering an index,
 * search filtering, or keyboard-navigable lists.
 */
export const GLOSSARY_KEYS: string[] = Object.keys(GLOSSARY);

/**
 * Look up an entry by key, returning a fallback entry (with the key as the
 * term) when the key is missing. This keeps the `<GlossaryTerm>` component
 * resilient if a writer references an undefined term key.
 */
export function getGlossaryEntry(key: string): GlossaryEntry {
  return (
    GLOSSARY[key] ?? {
      term: key,
      definition:
        "This term is not yet defined in the VVU glossary. Please contact the documentation owner to have it added.",
    }
  );
}
