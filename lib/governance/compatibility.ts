/**
 * compatibility.ts — RFC 2119 Normative Tag Transition Validation
 *
 * GROUND-UP RATIONALE (read before modifying)
 * ---------------------------------------------------------------------------
 * RFC 2119 defines six normative tags on two independent axes:
 *
 *              Positive (requires X)     Negative (forbids X)
 *   Binding    MUST                      MUST NOT
 *   Advisory   SHOULD                    SHOULD NOT
 *   Optional   MAY                       MAY NOT / MAY
 *
 * The original GB-1.0 validate_transition collapsed this into one boolean
 * (is_must()). This throws away the polarity axis entirely. Consequence:
 * SHOULD -> SHOULD NOT is a complete reversal of what the obligation means,
 * and the original code let it through as Compatible, because neither tag
 * "is_must()". A version-transition tool that can't see a meaning reversal
 * isn't a safety mechanism — it's a false sense of one, which is worse
 * than not having it, because CI goes green.
 *
 * Fix: model both axes explicitly. Compatibility falls out of two simple,
 * independently-justifiable rules instead of a case-by-case boolean tangle:
 *   Rule A (polarity): any polarity flip is BREAKING, unconditionally.
 *   Rule B (strength): any strength decrease that leaves or crosses the
 *     Binding tier is BREAKING. Everything else is ConditionallyCompatible.
 */

export enum Polarity {
  Positive = "Positive", // requires the described action
  Negative = "Negative", // forbids the described action
}

export enum Strength {
  Optional = 1,  // MAY / MAY NOT
  Advisory = 2,  // SHOULD / SHOULD NOT
  Binding = 3,   // MUST / MUST NOT
}

export enum Normative {
  Must = "MUST",
  MustNot = "MUST NOT",
  Should = "SHOULD",
  ShouldNot = "SHOULD NOT",
  May = "MAY",
  MayNot = "MAY NOT",
}

export enum CompatibilityLevel {
  Compatible = "Compatible",
  ConditionallyCompatible = "ConditionallyCompatible",
  Breaking = "Breaking",
}

export interface ObligationTag {
  normative: Normative;
}

export interface Baseline {
  version: string;
  obligations: Record<string, ObligationTag>;
}

export interface BaselineTransition {
  from: string;
  to: string;
  compatibility: CompatibilityLevel;
  affectedObligations: Array<{ id: string; reason: string }>;
  transitionPeriodDays: number;
}

// ── Normative helpers ──────────────────────────────────────────────────────

const NORMATIVE_PARSE_MAP: Record<string, Normative> = {
  "MUST": Normative.Must,
  "REQUIRED": Normative.Must,
  "SHALL": Normative.Must,
  "MUST NOT": Normative.MustNot,
  "SHALL NOT": Normative.MustNot,
  "SHOULD": Normative.Should,
  "RECOMMENDED": Normative.Should,
  "SHOULD NOT": Normative.ShouldNot,
  "NOT RECOMMENDED": Normative.ShouldNot,
  "MAY": Normative.May,
  "OPTIONAL": Normative.May,
  "MAY NOT": Normative.MayNot,
};

export function parseNormative(tag: string): Normative | null {
  const key = tag.trim().toUpperCase();
  // Handle multi-word keys by normalizing whitespace
  const normalized = key.replace(/\s+/g, " ");
  return NORMATIVE_PARSE_MAP[normalized] ?? null;
}

export function normativePolarity(n: Normative): Polarity {
  switch (n) {
    case Normative.Must:
    case Normative.Should:
    case Normative.May:
      return Polarity.Positive;
    case Normative.MustNot:
    case Normative.ShouldNot:
    case Normative.MayNot:
      return Polarity.Negative;
  }
}

export function normativeStrength(n: Normative): Strength {
  switch (n) {
    case Normative.Must:
    case Normative.MustNot:
      return Strength.Binding;
    case Normative.Should:
    case Normative.ShouldNot:
      return Strength.Advisory;
    case Normative.May:
    case Normative.MayNot:
      return Strength.Optional;
  }
}

/**
 * Classify the change to a single obligation's normative tag.
 * This is the function the original bug lived in. Now it's a pure function
 * over two Normative values with no branching on "is this MUST" — it just
 * applies Rule A then Rule B.
 */
export function classifyNormativeChange(
  old: Normative,
  current: Normative,
): { level: CompatibilityLevel; reason: string } {
  if (old === current) {
    return { level: CompatibilityLevel.Compatible, reason: "unchanged" };
  }

  // Rule A: polarity flip is always Breaking, regardless of strength.
  if (normativePolarity(old) !== normativePolarity(current)) {
    return {
      level: CompatibilityLevel.Breaking,
      reason: `polarity reversal: ${old} -> ${current} (meaning inverted)`,
    };
  }

  // Rule B: same polarity, strength changed.
  const oldStrength = normativeStrength(old);
  const newStrength = normativeStrength(current);

  if (newStrength < oldStrength) {
    // Weakening. Breaking specifically when leaving the Binding tier —
    // that's the case where something previously mandatory no longer is.
    const level =
      oldStrength === Strength.Binding
        ? CompatibilityLevel.Breaking
        : CompatibilityLevel.ConditionallyCompatible;
    return {
      level,
      reason: `weakened: ${old} -> ${current} (strength decreased)`,
    };
  }

  // Strengthening (newStrength > oldStrength). Never Breaking — nothing that
  // complied with the old, weaker text becomes newly non-compliant with
  // *itself*; new obligations for new participants, handled like any other
  // addition. Flagged ConditionallyCompatible so reviewers examine it.
  return {
    level: CompatibilityLevel.ConditionallyCompatible,
    reason: `strengthened: ${old} -> ${current} (strength increased)`,
  };
}

/**
 * Validate a transition between two governance baselines.
 * Determines overall compatibility and transition period.
 */
export function validateTransition(
  from: Baseline,
  to: Baseline,
): BaselineTransition {
  const affected: Array<{ id: string; reason: string }> = [];
  let overall = CompatibilityLevel.Compatible;

  // Helper: combine compatibility levels (pick the worst).
  function worse(a: CompatibilityLevel, b: CompatibilityLevel): CompatibilityLevel {
    if (a === CompatibilityLevel.Breaking || b === CompatibilityLevel.Breaking) {
      return CompatibilityLevel.Breaking;
    }
    if (
      a === CompatibilityLevel.ConditionallyCompatible ||
      b === CompatibilityLevel.ConditionallyCompatible
    ) {
      return CompatibilityLevel.ConditionallyCompatible;
    }
    return CompatibilityLevel.Compatible;
  }

  // Removed obligations: always Breaking.
  for (const id of Object.keys(from.obligations)) {
    if (!(id in to.obligations)) {
      affected.push({ id, reason: "obligation removed" });
      overall = worse(overall, CompatibilityLevel.Breaking);
    }
  }

  // Changed obligations: run both axes through classifyNormativeChange.
  for (const [id, oldOb] of Object.entries(from.obligations)) {
    const newOb = to.obligations[id];
    if (newOb && oldOb.normative !== newOb.normative) {
      const { level, reason } = classifyNormativeChange(
        oldOb.normative,
        newOb.normative,
      );
      affected.push({ id, reason });
      overall = worse(overall, level);
    }
  }

  // New obligations: ConditionallyCompatible.
  for (const id of Object.keys(to.obligations)) {
    if (!(id in from.obligations)) {
      affected.push({ id, reason: "obligation added" });
      overall = worse(overall, CompatibilityLevel.ConditionallyCompatible);
    }
  }

  const transitionPeriodDays =
    overall === CompatibilityLevel.Compatible
      ? 0
      : overall === CompatibilityLevel.ConditionallyCompatible
        ? 90
        : 180;

  return {
    from: from.version,
    to: to.version,
    compatibility: overall,
    affectedObligations: affected,
    transitionPeriodDays,
  };
}
