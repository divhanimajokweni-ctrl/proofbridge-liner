import { db } from "../src/lib/db";
const GATES = [
  {
    slug: "charter",
    label: "Charter",
    description: "Founding charter reviewed and resolved by the board.",
    status: "DRAFT",
    order: 1
  },
  {
    slug: "moi",
    label: "MOI",
    description: "Memorandum of Incorporation filed with CIPC.",
    status: "DRAFT",
    order: 2
  },
  {
    slug: "sha",
    label: "Shareholders Agreement",
    description: "Signed SHA binding all founding shareholders.",
    status: "PENDING",
    order: 3
  },
  {
    slug: "cipc",
    label: "CIPC Filing",
    description: "Formal company registration filing accepted by CIPC.",
    status: "NOT-FILED",
    order: 4
  },
  {
    slug: "audit",
    label: "Audit Trail",
    description: "Independent audit trail established and verified.",
    status: "READY",
    order: 5
  },
  {
    slug: "trust-bound",
    label: "Trust Bound",
    description: "Trust deed executed; EIS trust bound in place.",
    status: "READY",
    order: 6
  }
];
async function main() {
  for (const g of GATES) {
    await db.studiGate.upsert({
      where: { slug: g.slug },
      create: g,
      update: {
        label: g.label,
        description: g.description,
        order: g.order
        // status is intentionally NOT overwritten — operator edits win.
      }
    });
  }
  const count = await db.studiGate.count();
  console.log(`\u2713 Sealed ${GATES.length} gates (${count} total in DB).`);
}
main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
