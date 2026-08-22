import { ConfigResourceTypes } from "kafkajs";
import { kafka } from "./client";
import { ALL_TOPICS, TOPIC_SPECS } from "./topics";
async function createTopics() {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = await admin.fetchTopicMetadata({
      topics: [...ALL_TOPICS]
    });
    const existingNames = new Set(
      existing.topics.map((t) => t.name)
    );
    const results = [];
    for (const spec of TOPIC_SPECS) {
      try {
        if (!existingNames.has(spec.name)) {
          const topicConfig = {
            topic: spec.name,
            numPartitions: spec.partitions,
            replicationFactor: spec.replicationFactor,
            configEntries: Object.entries(spec.config).map(([name, value]) => ({
              name,
              value
            }))
          };
          await admin.createTopics({
            topics: [topicConfig],
            // Wait for all brokers to ack — prevents race on immediate publish
            waitForLeaders: true
          });
          results.push({
            topic: spec.name,
            status: "created"
          });
        } else {
          await admin.alterConfigs({
            validateOnly: false,
            resources: [
              {
                type: ConfigResourceTypes.TOPIC,
                name: spec.name,
                configEntries: Object.entries(spec.config).map(
                  ([name, value]) => ({ name, value })
                )
              }
            ]
          });
          results.push({
            topic: spec.name,
            status: "config_updated"
          });
        }
      } catch (err) {
        results.push({
          topic: spec.name,
          status: "error",
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return results;
  } finally {
    await admin.disconnect();
  }
}
async function main() {
  console.log("[create-topics] Connecting to Kafka...");
  const results = await createTopics();
  for (const r of results) {
    console.log(
      `  ${r.topic.padEnd(30)} ${r.status}${r.error ? ` \u2014 ${r.error}` : ""}`
    );
  }
  console.log("[create-topics] Done.");
}
const isMain = typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("create-topics");
if (isMain) {
  main().catch((err) => {
    console.error("[create-topics] FATAL:", err);
    process.exit(1);
  });
}
export {
  createTopics
};
