var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASELINE_CLAIMS = [
  {
    title: "Memory-safety invariant holds across HBK \xB7 IVE kernel",
    description: "Every exported kernel entry point preserves the SBV allocation invariant under the HBK IVE actor model.",
    claimType: "mathematical",
    intendedAction: "deploy",
    safetyCritical: true
  },
  {
    title: "Webhook delivery signature scheme matches dual-sig spec",
    description: "HMAC-SHA256 over (timestamp.nonce.payload) verifies under both the v1.1 primary and next rotation keys.",
    claimType: "semantic",
    intendedAction: "rotate-signing-keys",
    safetyCritical: true
  },
  {
    title: "Circuit breaker recovers within 300s under 10x surge",
    description: "Empirical: cold-start under 10x baseline webhook rate sees breaker half-open in \u2264300s with zero dropped deliveries.",
    claimType: "empirical",
    intendedAction: "scale-to-production",
    safetyCritical: false
  },
  {
    title: "DLQ replay is idempotent under duplicate replay requests",
    description: "Replaying the same DLQ entry twice yields exactly one downstream delivery \u2014 the dedup window holds.",
    claimType: "operational",
    intendedAction: "enable-dlq-auto-replay",
    safetyCritical: false
  },
  {
    title: "STUDI charter hash binds the engineering release",
    description: "The release decision audit trail carries the charter content-hash, so the engineering release is traceable to a STUDI-resolved document.",
    claimType: "semantic",
    intendedAction: "publish-release-report",
    safetyCritical: true
  }
];
async function main() {
  let created = 0;
  let updated = 0;
  for (const c of BASELINE_CLAIMS) {
    const existing = await db.claim.findFirst({
      where: { title: c.title, claimType: c.claimType }
    });
    let row;
    if (!existing) {
      row = await db.claim.create({
        data: __spreadProps(__spreadValues({}, c), { state: "UNTESTED" })
      });
      created++;
    } else {
      row = await db.claim.update({
        where: { id: existing.id },
        data: {
          description: c.description,
          intendedAction: c.intendedAction,
          safetyCritical: c.safetyCritical
          // Do NOT overwrite state — operator may have advanced it.
        }
      });
      updated++;
    }
    console.log(
      `  ${existing ? "\xB7 (existing)" : "+ (created)"} ${c.claimType.padEnd(12)} ${c.title.slice(0, 60)}`
    );
  }
  console.log(`
Seed complete: ${created} created, ${updated} already-existed.`);
  console.log(`Total IVE claims now: ${await db.claim.count()}`);
}
main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
