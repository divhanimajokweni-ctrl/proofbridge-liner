import { NextResponse } from "next/server";

function generateGitActions(count: number) {
  const actions = ["commit", "push", "merge", "deploy", "test", "validate"] as const;
  const branches = ["main", "hbk/mk-ii", "hbk/bayesian-engine", "hbk/sensor-cal", "hbk/cad-layout", "hbk/partners"];
  const messages = [
    "feat: add AMD Ryzen AI compute module bounding box",
    "fix: sensor isolation distance verified at X=20, Y=180",
    "refactor: BMS power distribution routing updated",
    "feat: NVMe storage bay vibration dampening mounts",
    "chore: IP67 transit shell envelope clearance check",
    "test: Bayesian inference engine MCMC convergence",
    "feat: Comms routing node Cellular/GNSS integration",
    "validate: 72h validation phase V3 metrics passing",
    "deploy: HBK Mk-II chassis layout to FreeCAD workspace",
    "merge: hbk/sensor-cal → main (acoustic filtering verified)",
    "feat: VVU 100% ownership model embedded in metadata",
    "fix: analog isolation clearance zone expanded",
    "test: Kria SoM edge-compute integration",
    "validate: Brier Score ≤ 0.02 threshold check",
    "feat: Founding Partners campaign framework",
    "chore: resource register initial data migration",
  ];
  const authors = ["eng-lead", "cad-operator", "bayesian-eng", "sensor-tech", "field-ops", "devops"];
  const result: Array<{
    id: string; timestamp: string; action: string; branch: string;
    message: string; author: string; status: string; hash: string;
  }> = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const hash = Math.random().toString(16).slice(2, 9);
    result.push({
      id: `ga-${i}`,
      timestamp: new Date(now - (count - i) * 180000 + Math.random() * 60000).toISOString(),
      action,
      branch: branches[Math.floor(Math.random() * branches.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      status: Math.random() > 0.08 ? "success" : Math.random() > 0.5 ? "running" : "failed",
      hash,
    });
  }
  return result;
}

export async function GET() {
  const actions = generateGitActions(24);
  return NextResponse.json({ actions, count: actions.length });
}
