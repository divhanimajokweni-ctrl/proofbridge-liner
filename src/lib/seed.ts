// @ts-nocheck
// Seed the Epistemic Runtime database from sample .epd policies + simulated state.

import { db } from "@/lib/db";
import {
  SAMPLE_POLICIES,
  SAMPLE_STATES,
  VIOLATING_PROPOSED,
  validateEpd,
  evaluateInvariant,
  selfRepair,
  mmrRoot,
  parseEpd,
} from "@/lib/epd";

const REGIONS = [
  "europe-west",
  "europe-north",
  "na-east",
  "na-west",
  "apac-south",
  "apac-east",
];
const NODES = ["edge-01", "edge-02", "edge-03", "cloud-01", "cloud-02"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedIfEmpty() {
  const count = await db.policy.count();
  if (count > 0) return { seeded: false, reason: "already populated" };

  for (const sample of SAMPLE_POLICIES) {
    const result = validateEpd(sample.source);
    const policy = result.ast?.policies[0];
    if (!policy) continue;

    const created = await db.policy.create({
      data: {
        name: policy.name,
        filename: sample.filename,
        source: sample.source,
        domain: policy.domain ?? null,
        version: policy.version ?? null,
        description: policy.description ?? null,
        ok: result.ok,
        errorCount: result.diagnostics.filter((d) => d.level === "error").length,
        warningCount: result.diagnostics.filter((d) => d.level === "warning").length,
        invariantCount: policy.invariants.length,
        shardCount: policy.shard ? 1 : 0,
        shardKey: policy.shard?.key ?? null,
        shardStrategy: policy.shard?.strategy ?? null,
        repairStrategy: policy.onViolation?.strategy ?? null,
        zkEnabled: policy.ancestry?.zk ?? false,
        proofKind: policy.ancestry?.proof ?? null,
        shadowEnabled: policy.shadowBridge?.enabled ?? false,
        takeoverLatencyMs: policy.shadowBridge?.takeoverLatencyMs ?? null,
        wasmFingerprint: result.compiledEnforcer?.invariantFingerprints[0]?.hash ?? null,
      },
    });

    // Create shards
    const shardCount = policy.shard?.count ?? 1;
    const shardIds: string[] = [];
    for (let i = 0; i < shardCount; i++) {
      const region = REGIONS[i % REGIONS.length] ?? `region-${i}`;
      const baseState = SAMPLE_STATES[policy.name] ?? {};
      const state = {
        ...baseState,
        geo_region: region,
        facility_id: `facility-${i}`,
        vehicle_id: `AV-${String(i).padStart(3, "0")}`,
        custody_stage: ["producer", "transporter", "retailer"][i % 3],
        shard_index: i,
      };
      const mmr = mmrRoot([
        `${policy.name}:${region}:${i}`,
        JSON.stringify(state),
      ]);
      const shard = await db.shard.create({
        data: {
          policyId: created.id,
          shardKey: policy.shard?.key ?? "default",
          region,
          nodeId: rand(NODES),
          state: JSON.stringify(state),
          invariantStatus: i === 1 ? "violating" : i === 2 ? "repairing" : "healthy",
          mmrRoot: mmr,
          peerCount: 2 + (i % 4),
          lastMergeAt: new Date(Date.now() - i * 60000),
        },
      });
      shardIds.push(shard.id);
    }

    // Create a merge proposal (one self-repaired) using the violating state
    if (VIOLATING_PROPOSED[policy.name]) {
      const proposed = VIOLATING_PROPOSED[policy.name];
      const repair = selfRepair(policy, SAMPLE_STATES[policy.name] ?? {}, proposed);
      await db.mergeProposal.create({
        data: {
          policyId: created.id,
          sourceShardId: shardIds[1] ?? null,
          targetShard: REGIONS[0] ?? "default",
          sourceShardName: REGIONS[1] ?? "region-1",
          proposedState: JSON.stringify(proposed),
          repairedState: repair.ok ? JSON.stringify(repair.repairedState) : null,
          status: repair.ok ? "applied" : "rejected",
          violations: JSON.stringify(repair.violations),
          divergence: repair.divergence,
          iterations: repair.iterations,
          mmrProof: mmrRoot([JSON.stringify(proposed), policy.name]),
          zkProof: policy.ancestry?.zk
            ? `zk:stark:${Math.random().toString(16).slice(2, 18)}`
            : null,
        },
      });
    }

    // Ancestry proofs
    for (let i = 0; i < Math.min(3, shardIds.length); i++) {
      await db.ancestryProof.create({
        data: {
          policyId: created.id,
          shardKey: REGIONS[i] ?? `region-${i}`,
          mmrRoot: mmrRoot([policy.name, String(i), Date.now().toString()]),
          proofPath: JSON.stringify([
            Math.random().toString(16).slice(2, 18),
            Math.random().toString(16).slice(2, 18),
          ]),
          zkProof: policy.ancestry?.zk
            ? `zk:snark:${Math.random().toString(16).slice(2, 18)}`
            : null,
          anchored: policy.ancestry?.anchor !== "none",
          anchor: policy.ancestry?.anchor ?? null,
        },
      });
    }

    // Violations + drift log
    const state = SAMPLE_STATES[policy.name] ?? {};
    for (const inv of policy.invariants) {
      const ev = evaluateInvariant(inv, state);
      if (!ev.passed) {
        await db.invariantViolation.create({
          data: {
            policyId: created.id,
            invariant: inv.name,
            severity: inv.severity,
            soft: inv.soft,
            shardKey: REGIONS[0] ?? "default",
            actual: ev.actual ?? null,
            expected: ev.expected ?? null,
            repaired: false,
            driftDelta: Math.random() * 5,
          },
        });
      }
    }

    // Record drift violations from the violating proposed states (un-repaired
    // historical drift that the miner can learn from).
    const violating = VIOLATING_PROPOSED[policy.name];
    if (violating) {
      for (const inv of policy.invariants) {
        const ev = evaluateInvariant(inv, violating);
        if (!ev.passed) {
          await db.invariantViolation.create({
            data: {
              policyId: created.id,
              invariant: inv.name,
              severity: inv.severity,
              soft: inv.soft,
              shardKey: REGIONS[1] ?? "region-1",
              actual: ev.actual ?? null,
              expected: ev.expected ?? null,
              repaired: false,
              driftDelta: Math.random() * 8 + 1,
            },
          });
        }
      }
    }

    // Shadow events
    if (policy.shadowBridge?.enabled) {
      const kinds = ["takeover", "whatif", "replay", "divergence", "handback"];
      for (let i = 0; i < 4; i++) {
        await db.shadowEvent.create({
          data: {
            policyId: created.id,
            kind: kinds[i % kinds.length],
            summary: `Shadow ${kinds[i % kinds.length]} on ${REGIONS[i % REGIONS.length]}`,
            liveState: JSON.stringify(state),
            shadowState: JSON.stringify({ ...state, shadow: true }),
            divergence: Math.random() * 2,
            authoritative: policy.shadowBridge.authoritative ?? false,
          },
        });
      }
    }

    // Mined invariant candidates
    const mined = [
      {
        predicate: "ramp_rate <= 5",
        rationale: "Detected frequency instability correlates with ramp rates > 5 MW/min",
        confidence: 0.82,
        severity: "medium",
      },
      {
        predicate: "phase_imbalance <= 3",
        rationale: "Historical drift shows phase imbalance precedes grid splits",
        confidence: 0.71,
        severity: "high",
      },
      {
        predicate: "latency_p99 <= 120",
        rationale: "Control-loop latency above 120ms predicts takeover failures",
        confidence: 0.66,
        severity: "medium",
      },
    ];
    for (const m of mined) {
      await db.minedInvariant.create({
        data: { policyId: created.id, ...m, accepted: false },
      });
    }
  }

  return { seeded: true, policies: SAMPLE_POLICIES.length };
}

// Allow running directly: `bun run src/lib/seed.ts`
if (require.main === module) {
  seedIfEmpty()
    .then((r) => {
      console.log("seed result:", r);
    })
    .catch((e) => {
      console.error("seed failed:", e);
      process.exit(1);
    });
}
