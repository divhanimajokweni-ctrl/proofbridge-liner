import { createTopics } from "@/lib/webhook/kafka/admin";
(async () => {
  console.log("[create-topics] Connecting to Kafka...");
  const results = await createTopics();
  for (const r of results) {
    console.log(
      `  ${r.topic.padEnd(30)} ${r.status}${r.error ? ` \u2014 ${r.error}` : ""}`
    );
  }
  console.log("[create-topics] Done.");
})().catch((err) => {
  console.error("[create-topics] FATAL:", err);
  process.exit(1);
});
