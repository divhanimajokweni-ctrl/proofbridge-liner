/**
 * seed-ive-claims.ts — seed the baseline IVE claims that the operator
 * uses to drive the fail-closed valve from the IVE side.
 *
 * The IVE Claim Verification Injector (see
 * src/components/ive-workspace/ive-claim-injector.tsx) is the live
 * system validation surface for the IVE half of the valve. Each claim
 * below is a single row that the operator can authorize / revoke and
 * trip / reset the breaker on. The next /api/theorem-state poll
 * (≤5s) recomputes the IVE verdict, which feeds the global
 * theorem-state store, which the Evolution Matrix is subscribed to —
 * so the IVE hero morphs from web-spider → Miles as the operator
 * crosses the 50% authorisation ratio, and to web-spider+pulsing-red
 * the moment any breaker trips.
 *
 * The seed is idempotent: it upserts on the (title, claimType) pair.
 * Operator mutations to Authorization and CircuitBreaker records are
 * NOT touched by re-running this script.
 *
 * Run:
 *   bun run scripts/seed-ive-claims.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BASELINE_CLAIMS = [
  {
    title: "Memory-safety invariant holds across HBK · IVE kernel",
    description:
      "Every exported kernel entry point preserves the SBV allocation invariant under the HBK IVE actor model.",
    claimType: "mathematical",
    intendedAction: "deploy",
    safetyCritical: true,
  },
  {
    title: "Webhook delivery signature scheme matches dual-sig spec",
    description:
      "HMAC-SHA256 over (timestamp.nonce.payload) verifies under both the v1.1 primary and next rotation keys.",
    claimType: "semantic",
    intendedAction: "rotate-signing-keys",
    safetyCritical: true,
  },
  {
    title: "Circuit breaker recovers within 300s under 10x surge",
    description:
      "Empirical: cold-start under 10x baseline webhook rate sees breaker half-open in ≤300s with zero dropped deliveries.",
    claimType: "empirical",
    intendedAction: "scale-to-production",
    safetyCritical: false,
  },
  {
    title: "DLQ replay is idempotent under duplicate replay requests",
    description:
      "Replaying the same DLQ entry twice yields exactly one downstream delivery — the dedup window holds.",
    claimType: "operational",
    intendedAction: "enable-dlq-auto-replay",
    safetyCritical: false,
  },
  {
    title: "STUDI charter hash binds the engineering release",
    description:
      "The release decision audit trail carries the charter content-hash, so the engineering release is traceable to a STUDI-resolved document.",
    claimType: "semantic",
    intendedAction: "publish-release-report",
    safetyCritical: true,
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const c of BASELINE_CLAIMS) {
    // No unique constraint on (title, claimType) in the current schema —
    // do findFirst-or-create so the seed is idempotent without a migration.
    const existing = await db.claim.findFirst({
      where: { title: c.title, claimType: c.claimType },
    });
    let row;
    if (!existing) {
      row = await db.claim.create({
        data: { ...c, state: "UNTESTED" },
      });
      created++;
    } else {
      row = await db.claim.update({
        where: { id: existing.id },
        data: {
          description: c.description,
          intendedAction: c.intendedAction,
          safetyCritical: c.safetyCritical,
          // Do NOT overwrite state — operator may have advanced it.
        },
      });
      updated++;
    }
    console.log(
      `  ${existing ? "· (existing)" : "+ (created)"} ${c.claimType.padEnd(12)} ${c.title.slice(0, 60)}`
    );
  }

  console.log(`\nSeed complete: ${created} created, ${updated} already-existed.`);
  console.log(`Total IVE claims now: ${await db.claim.count()}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
