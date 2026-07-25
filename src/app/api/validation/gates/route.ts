export const dynamic = "force-static";
export const revalidate = 60;

const GATES = [
  {
    gate: "Gate A — Rehearsal Integrity",
    status: "PASS",
    summary: "Rehearsal scripts synced; lib.sh, verify.sh, freeze-build.sh behavioral contracts verified.",
    evidence: "76032fa",
  },
  {
    gate: "Gate B — Evidence Integrity",
    status: "INCOMPLETE",
    summary: "Evidence pipeline implementations complete; operational validation remains pending.",
    evidence: "e544e58",
  },
  {
    gate: "Gate C — Kubernetes Readiness",
    status: "PASS",
    summary: "NetworkPolicy, PDB, PriorityClass, security contexts, secrets, placeholders gated by freeze.",
    evidence: "a8204fa",
  },
  {
    gate: "Gate D — GitOps / Argo CD",
    status: "PASS",
    summary: "Repo URLs corrected, validation apps registered, rollback revised, promotion script added.",
    evidence: "fd2b2ad",
  },
  {
    gate: "Gate E — CI / CD",
    status: "INCOMPLETE",
    summary: "bun-run lint/test pass locally; pushed GitHub Actions need execution evidence.",
    evidence: "VVU-VAL-001/github/rehearsal.yml",
  },
  {
    gate: "Gate F — Documentation",
    status: "INCOMPLETE",
    summary: "Release gates and environment requirements documented; final operator/observer publication pending.",
    evidence: "validation/RELEASE_GATES.md",
  },
  {
    gate: "Gate G — Final Release",
    status: "INCOMPLETE",
    summary: "Final release requires all gates PASS, tagged release, observer attestation, and merged main.",
    evidence: "Gate F",
  },
];

export async function GET() {
  return Response.json({ gates: GATES, generated_at: new Date().toISOString() });
}
