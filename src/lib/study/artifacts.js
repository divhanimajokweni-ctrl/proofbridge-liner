const EIS_HEX = {
  PROVEN: "#10b981",
  // emerald
  VERIFIED: "#22c55e",
  // green
  SUPPORTED: "#84cc16",
  // lime
  OBSERVED: "#f59e0b",
  // amber
  INCONCLUSIVE: "#f97316",
  // orange
  UNVALIDATED: "#71717a",
  // zinc
  UNTESTED: "#64748b",
  // slate
  STALE: "#a3a3a3",
  // neutral
  FALSIFIED: "#ef4444"
  // red
};
function mulberry32(seed) {
  let a = seed;
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function generateResearchArtifact() {
  const rand = mulberry32(42);
  const nodeCount = 14;
  const components = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = i / nodeCount * Math.PI * 2;
    const r = 4 + (rand() - 0.5) * 0.4;
    components.push({
      id: `paper-${i}`,
      label: `Paper ${String.fromCharCode(65 + i)}`,
      kind: "node",
      base: {
        position: [Math.cos(angle) * r, Math.sin(angle) * r, 0],
        color: "#94a3b8",
        // slate-400 — neutral grey before verification
        meta: { year: 2018 + i % 6, citations: Math.floor(rand() * 50) }
      }
    });
  }
  const edges = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({ from: `paper-${i}`, to: `paper-${i + 1}` });
  }
  edges.push({ from: "paper-3", to: "paper-7" });
  edges.push({ from: "paper-7", to: "paper-11" });
  edges.push({ from: "paper-11", to: "paper-3" });
  for (const id of ["paper-3", "paper-7", "paper-11"]) {
    const c = components.find((c2) => c2.id === id);
    if (c) c.anomaly = { kind: "circular-citation", description: "Member of a citation cycle (3 \u2194 7 \u2194 11)" };
  }
  components.push({
    id: "paper-unverified",
    label: "Paper U (preprint)",
    kind: "node",
    base: {
      position: [0, 0, 0],
      color: "#64748b",
      meta: { year: 2026, citations: 0, preprint: true }
    },
    anomaly: { kind: "unverified", description: "Preprint \u2014 not peer-reviewed" }
  });
  return {
    track: "research",
    title: "Citation Graph \u2014 Reproducibility Audit",
    description: "14 papers with forward citations. A deliberate citation cycle (A3 \u2194 A7 \u2194 A11) has been injected as an epistemic anomaly. One unreviewed preprint sits at the centre. IVE should mark the cycle as INCONCLUSIVE and the preprint as UNTESTED.",
    components,
    edges
  };
}
function generateEngineeringArtifact() {
  const components = [];
  const corners = [
    [-4, -4, "NW"],
    [4, -4, "NE"],
    [4, 4, "SE"],
    [-4, 4, "SW"],
    [-4, 0, "WM"],
    [4, 0, "EM"]
  ];
  for (const [x, z, label] of corners) {
    components.push({
      id: `column-${label}`,
      label: `Column ${label}`,
      kind: "column",
      base: {
        position: [x, 1.5, z],
        scale: [0.4, 3, 0.4],
        color: "#cbd5e1",
        // slate-300 — concrete neutral
        meta: { material: "C30/37 concrete", height_m: 3 }
      }
    });
  }
  const beamPairs = [
    ["NW-NE", [-4, -4], [4, -4]],
    ["NE-SE", [4, -4], [4, 4]],
    ["SE-SW", [4, 4], [-4, 4]],
    ["SW-NW", [-4, 4], [-4, -4]],
    ["WM-EM", [-4, 0], [4, 0]]
  ];
  beamPairs.forEach(([label, [x1, z1], [x2, z2]], i) => {
    const mid = [(x1 + x2) / 2, 3.1, (z1 + z2) / 2];
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    components.push({
      id: `beam-${label}`,
      label: `Beam ${label}`,
      kind: "beam",
      base: {
        position: mid,
        scale: [len, 0.2, 0.2],
        color: "#94a3b8",
        meta: { material: "S355 steel", length_m: len, load_kN: 25 }
      },
      // Beam 4 (WM-EM) — anomaly: load calc exceeds spec for the steel grade
      anomaly: i === 4 ? { kind: "load-spec-mismatch", description: "Load calc 38 kN > S355 spec 25 kN" } : void 0
    });
  });
  components.push({
    id: "slab-roof",
    label: "Roof Slab",
    kind: "slab",
    base: {
      position: [0, 3.3, 0],
      scale: [8.4, 0.2, 8.4],
      color: "#e2e8f0",
      meta: { material: "C25/30 concrete", thickness_mm: 200 }
    }
  });
  return {
    track: "engineering",
    title: "CAD Building \u2014 Load vs Material Spec Audit",
    description: "6 columns + 5 beams + 1 roof slab. The east-middle beam (WM-EM) has a deliberate load-vs-spec mismatch: the structural calc claims 38 kN but the S355 steel spec caps at 25 kN. IVE should FALSIFY that beam; the rest should reach VERIFIED.",
    components,
    edges: []
  };
}
function generateSportsArtifact() {
  const rand = mulberry32(7);
  const components = [];
  const timeline = [];
  const teamColors = ["#3b82f6", "#ef4444"];
  for (let team = 0; team < 2; team++) {
    for (let n = 1; n <= 11; n++) {
      const isGK = n === 1;
      const x = isGK ? team === 0 ? -8 : 8 : team === 0 ? -3 + rand() * 5 : 3 - rand() * 5;
      const z = -4 + rand() * 8;
      const id = `player-${team}-${n}`;
      const isAnomalyGpsDropout = team === 0 && n === 7;
      const isAnomalyDupTs = team === 1 && n === 9;
      components.push({
        id,
        label: `${team === 0 ? "Blue" : "Red"} #${n}${isGK ? " (GK)" : ""}`,
        kind: "player",
        base: {
          position: [x, 0.1, z],
          scale: [0.3, 0.3, 0.3],
          color: teamColors[team],
          meta: { team, number: n, role: isGK ? "GK" : "OUT" }
        },
        anomaly: isAnomalyGpsDropout ? { kind: "gps-dropout", description: "GPS dropout 58:00 \u2192 58:05" } : isAnomalyDupTs ? { kind: "duplicate-timestamp", description: "Two events at 73:21 share identical GPS coords" } : void 0
      });
    }
  }
  const eventKinds = ["pass", "tackle", "sprint", "shot"];
  for (let i = 0; i < 120; i++) {
    const t = Math.floor(i / 120 * 90 * 60);
    const team = rand() > 0.5 ? 0 : 1;
    const n = 1 + Math.floor(rand() * 11);
    const kind = eventKinds[Math.floor(rand() * eventKinds.length)];
    const id = `event-${i}`;
    const player = components.find((c) => c.id === `player-${team}-${n}`);
    const [px, , pz] = player.base.position;
    components.push({
      id,
      label: `${kind} @ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`,
      kind: "event",
      base: {
        position: [px + (rand() - 0.5) * 1.5, 0.05, pz + (rand() - 0.5) * 1.5],
        scale: [0.15, 0.15, 0.15],
        color: "#fde047",
        // yellow-300 — neutral event marker
        meta: { t, kind, playerId: `player-${team}-${n}` }
      }
    });
    timeline.push({ t, label: `${kind} #${i}`, componentIds: [id, `player-${team}-${n}`] });
  }
  timeline.sort((a, b) => a.t - b.t);
  return {
    track: "sports",
    title: "Football Match \u2014 22 Players, 120 Events, 2 Anomalies",
    description: "Synthetic 90-minute match: 22 players (2 teams of 11), ~120 events (pass/tackle/sprint/shot). Two deliberate anomalies are injected: (1) Blue #7 has a 5-second GPS dropout at 58:00 \u2014 any event in that window should resolve to UNTESTED. (2) Red #9 has two events sharing identical GPS coordinates at 73:21 \u2014 IVE should mark those as INCONCLUSIVE.",
    components,
    edges: [],
    timeline,
    durationSeconds: 90 * 60
  };
}
const STATE_LADDER = [
  "PROVEN",
  "VERIFIED",
  "SUPPORTED",
  "OBSERVED",
  "INCONCLUSIVE"
];
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i) | 0;
  }
  return h;
}
function computeVerificationFor(artifact) {
  const out = /* @__PURE__ */ new Map();
  for (const c of artifact.components) {
    if (c.anomaly) {
      if (c.anomaly.kind === "circular-citation") out.set(c.id, "INCONCLUSIVE");
      else if (c.anomaly.kind === "unverified") out.set(c.id, "UNTESTED");
      else if (c.anomaly.kind === "load-spec-mismatch") out.set(c.id, "FALSIFIED");
      else if (c.anomaly.kind === "gps-dropout") out.set(c.id, "UNTESTED");
      else if (c.anomaly.kind === "duplicate-timestamp") out.set(c.id, "INCONCLUSIVE");
      else out.set(c.id, "INCONCLUSIVE");
    } else {
      const h = Math.abs(hashString(c.id));
      out.set(c.id, STATE_LADDER[h % STATE_LADDER.length]);
    }
  }
  return out;
}
function runVerification(artifact, delayMs = 3e3) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(computeVerificationFor(artifact)), delayMs);
  });
}
const TRACKS = [
  { id: "research", label: "Research", generator: generateResearchArtifact },
  { id: "engineering", label: "Engineering", generator: generateEngineeringArtifact },
  { id: "sports", label: "Sports", generator: generateSportsArtifact }
];
export {
  EIS_HEX,
  TRACKS,
  computeVerificationFor,
  generateEngineeringArtifact,
  generateResearchArtifact,
  generateSportsArtifact,
  runVerification
};
