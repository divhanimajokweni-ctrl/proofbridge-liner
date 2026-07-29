import { describe, it, expect } from "@jest/globals";
import {
  CompatibilityLevel,
  classifyNormativeChange,
  validateTransition,
  parseNormative,
  Normative,
  type Baseline,
} from "../../lib/governance/compatibility";

describe("parseNormative", () => {
  it("parses MUST", () => {
    expect(parseNormative("MUST")).toBe(Normative.Must);
  });
  it("parses MUST NOT", () => {
    expect(parseNormative("MUST NOT")).toBe(Normative.MustNot);
  });
  it("parses SHOULD", () => {
    expect(parseNormative("SHOULD")).toBe(Normative.Should);
  });
  it("parses SHOULD NOT", () => {
    expect(parseNormative("SHOULD NOT")).toBe(Normative.ShouldNot);
  });
  it("parses MAY", () => {
    expect(parseNormative("MAY")).toBe(Normative.May);
  });
  it("parses MAY NOT", () => {
    expect(parseNormative("MAY NOT")).toBe(Normative.MayNot);
  });
  it("parses aliases: REQUIRED = MUST", () => {
    expect(parseNormative("REQUIRED")).toBe(Normative.Must);
  });
  it("parses aliases: SHALL = MUST", () => {
    expect(parseNormative("SHALL")).toBe(Normative.Must);
  });
  it("returns null for unknown tags", () => {
    expect(parseNormative("FORBIDDEN")).toBeNull();
  });
});

describe("classifyNormativeChange", () => {
  describe("Rule A: polarity flip is always BREAKING", () => {
    it("MUST -> MUST NOT (binding polarity flip)", () => {
      const r = classifyNormativeChange(Normative.Must, Normative.MustNot);
      expect(r.level).toBe(CompatibilityLevel.Breaking);
      expect(r.reason).toContain("polarity reversal");
    });

    it("SHOULD -> SHOULD NOT (the original bug)", () => {
      // The bug this module exists to fix.
      // Under the old is_must() approach this was Compatible.
      const r = classifyNormativeChange(Normative.Should, Normative.ShouldNot);
      expect(r.level).toBe(CompatibilityLevel.Breaking);
      expect(r.reason).toContain("polarity reversal");
    });

    it("MAY -> MAY NOT (optional polarity flip)", () => {
      const r = classifyNormativeChange(Normative.May, Normative.MayNot);
      expect(r.level).toBe(CompatibilityLevel.Breaking);
    });
  });

  describe("Rule B: strength decrease from Binding = BREAKING", () => {
    it("MUST -> SHOULD is BREAKING (mandatory -> advisory)", () => {
      const r = classifyNormativeChange(Normative.Must, Normative.Should);
      expect(r.level).toBe(CompatibilityLevel.Breaking);
      expect(r.reason).toContain("weakened");
    });

    it("MUST -> MAY is BREAKING (mandatory -> optional)", () => {
      const r = classifyNormativeChange(Normative.Must, Normative.May);
      expect(r.level).toBe(CompatibilityLevel.Breaking);
    });
  });

  describe("Rule B: strength decrease below Binding = ConditionallyCompatible", () => {
    it("SHOULD -> MAY is ConditionallyCompatible (advisory -> optional)", () => {
      const r = classifyNormativeChange(Normative.Should, Normative.May);
      expect(r.level).toBe(CompatibilityLevel.ConditionallyCompatible);
    });

    it("SHOULD NOT -> MAY NOT is ConditionallyCompatible", () => {
      const r = classifyNormativeChange(Normative.ShouldNot, Normative.MayNot);
      expect(r.level).toBe(CompatibilityLevel.ConditionallyCompatible);
    });
  });

  describe("Strength increase = ConditionallyCompatible", () => {
    it("SHOULD -> MUST is ConditionallyCompatible (advisory -> mandatory)", () => {
      const r = classifyNormativeChange(Normative.Should, Normative.Must);
      expect(r.level).toBe(CompatibilityLevel.ConditionallyCompatible);
    });

    it("MAY -> SHOULD is ConditionallyCompatible", () => {
      const r = classifyNormativeChange(Normative.May, Normative.Should);
      expect(r.level).toBe(CompatibilityLevel.ConditionallyCompatible);
    });
  });

  describe("Identical = Compatible", () => {
    it("MUST -> MUST is Compatible", () => {
      const r = classifyNormativeChange(Normative.Must, Normative.Must);
      expect(r.level).toBe(CompatibilityLevel.Compatible);
    });
  });
});

describe("validateTransition", () => {
  function baseline(version: string, obs: Record<string, Normative>): Baseline {
    const obligations: Baseline["obligations"] = {};
    for (const [id, normative] of Object.entries(obs)) {
      obligations[id] = { normative };
    }
    return { version, obligations };
  }

  it("identical baselines are Compatible", () => {
    const from = baseline("GB-1.0", { "OB-1": Normative.Must });
    const to = baseline("GB-1.0", { "OB-1": Normative.Must });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.Compatible);
    expect(t.transitionPeriodDays).toBe(0);
  });

  it("removed obligation is Breaking", () => {
    const from = baseline("GB-1.0", { "OB-1": Normative.Must });
    const to = baseline("GB-1.1", {});
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.Breaking);
    expect(t.transitionPeriodDays).toBe(180);
    expect(t.affectedObligations).toContainEqual(
      expect.objectContaining({ id: "OB-1", reason: "obligation removed" }),
    );
  });

  it("new obligation is ConditionallyCompatible", () => {
    const from = baseline("GB-1.0", {});
    const to = baseline("GB-1.1", { "OB-1": Normative.Must });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.ConditionallyCompatible);
    expect(t.transitionPeriodDays).toBe(90);
  });

  it("SHOULD -> SHOULD NOT is Breaking (the original GB-1.0 bug)", () => {
    const from = baseline("GB-1.0", { "OB-X": Normative.Should });
    const to = baseline("GB-1.1", { "OB-X": Normative.ShouldNot });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.Breaking);
    // Verify that affected obligations include the polarity reversal
    expect(t.affectedObligations).toContainEqual(
      expect.objectContaining({ id: "OB-X" }),
    );
  });

  it("MUST -> SHOULD (weakened from Binding) is Breaking", () => {
    const from = baseline("GB-1.0", { "OB-1": Normative.Must });
    const to = baseline("GB-1.1", { "OB-1": Normative.Should });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.Breaking);
  });

  it("SHOULD -> MUST (strengthened) is ConditionallyCompatible", () => {
    const from = baseline("GB-1.0", { "OB-1": Normative.Should });
    const to = baseline("GB-1.1", { "OB-1": Normative.Must });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.ConditionallyCompatible);
  });

  it("SHOULD -> MAY (weakened, non-Binding) is ConditionallyCompatible", () => {
    const from = baseline("GB-1.0", { "OB-1": Normative.Should });
    const to = baseline("GB-1.1", { "OB-1": Normative.May });
    const t = validateTransition(from, to);
    expect(t.compatibility).toBe(CompatibilityLevel.ConditionallyCompatible);
  });
});
