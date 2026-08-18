/**
 * VVU-IVE Webhook Subsystem — Kafka Topic Admin
 * ----------------------------------------------------------------------------
 * Idempotent topic creation. Run once at deploy time, or any time after
 * Kafka cluster boot to ensure all 3 topics exist with correct configs:
 *
 *   vvu-webhook-delivery      12 partitions  RF=3  7d retention
 *   vvu-webhook-delivery-dlq  12 partitions  RF=3  30d retention
 *   vvu-webhook-audit         12 partitions  RF=3  7d retention
 *
 * Safe to run repeatedly — existing topics are skipped (idempotent).
 *
 * Usage: bun run webhook:create-topics
 */

import type { ITopicConfig, ITopicMetadata } from "kafkajs";
import { ConfigResourceTypes } from "kafkajs";
import { kafka } from "./client";
import { ALL_TOPICS, TOPIC_SPECS } from "./topics";

export interface TopicCreationResult {
  topic: string;
  status: "created" | "already_exists" | "config_updated" | "error";
  error?: string;
}

export async function createTopics(): Promise<TopicCreationResult[]> {
  const admin = kafka.admin();
  await admin.connect();

  try {
    // Spread ALL_TOPICS (readonly tuple) into a mutable array for kafkajs
    const existing = await admin.fetchTopicMetadata({
      topics: [...ALL_TOPICS],
    });
    const existingNames = new Set(
      existing.topics.map((t: ITopicMetadata) => t.name),
    );

    const results: TopicCreationResult[] = [];

    for (const spec of TOPIC_SPECS) {
      try {
        if (!existingNames.has(spec.name)) {
          // Create with v1.1 contract spec
          const topicConfig: ITopicConfig = {
            topic: spec.name,
            numPartitions: spec.partitions,
            replicationFactor: spec.replicationFactor,
            configEntries: Object.entries(spec.config).map(([name, value]) => ({
              name,
              value,
            })),
          };
          await admin.createTopics({
            topics: [topicConfig],
            // Wait for all brokers to ack — prevents race on immediate publish
            waitForLeaders: true,
          });
          results.push({
            topic: spec.name,
            status: "created",
          });
        } else {
          // Already exists — update configs to match v1.1 contract
          // (No-op if already correct)
          await admin.alterConfigs({
            validateOnly: false,
            resources: [
              {
                type: ConfigResourceTypes.TOPIC,
                name: spec.name,
                configEntries: Object.entries(spec.config).map(
                  ([name, value]) => ({ name, value }),
                ),
              },
            ],
          });
          results.push({
            topic: spec.name,
            status: "config_updated",
          });
        }
      } catch (err) {
        results.push({
          topic: spec.name,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  } finally {
    await admin.disconnect();
  }
}

// CLI entrypoint (when run as `bun run webhook:create-topics`)
async function main() {
  // eslint-disable-next-line no-console
  console.log("[create-topics] Connecting to Kafka...");
  const results = await createTopics();
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(
      `  ${r.topic.padEnd(30)} ${r.status}${r.error ? ` — ${r.error}` : ""}`,
    );
  }
  // eslint-disable-next-line no-console
  console.log("[create-topics] Done.");
}

// Run main when executed directly via `bun scripts/create-topics.ts`
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("create-topics");
if (isMain) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[create-topics] FATAL:", err);
    process.exit(1);
  });
}
