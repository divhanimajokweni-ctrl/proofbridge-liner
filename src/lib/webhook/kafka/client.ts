/**
 * VVU-IVE Webhook Subsystem — Kafka Client Factory
 * ----------------------------------------------------------------------------
 * Wraps kafkajs client creation. Reads brokers + client ID from env:
 *   KAFKA_BROKERS=localhost:9092,localhost:9093  (comma-separated)
 *   KAFKA_CLIENT_ID=vvu-ive-webhook              (optional, default shown)
 *
 * For SASL/SSL, see RELIABILITY contract — production should connect to MSK
 * with the appropriate auth. The factory is intentionally minimal; production
 * config is supplied via env vars.
 */

import { Kafka, KafkaConfig } from "kafkajs";
import { getKafkaBrokers } from "../config";

export function createKafkaClient(): Kafka {
  const brokers = getKafkaBrokers();
  if (brokers.length === 0) {
    throw new Error(
      "KAFKA_BROKERS env var is empty — cannot create Kafka client",
    );
  }

  const clientId = process.env.KAFKA_CLIENT_ID ?? "vvu-ive-webhook";

  const config: KafkaConfig = {
    clientId,
    brokers,
    // Production: MSK uses IAM/SASL. Wire in via env when needed.
    // For local docker-compose Kafka (KRaft, plaintext) this is sufficient.
    retry: {
      // Aggressive initial retry — Kafka cluster may still be booting
      initialRetryTime: 500,
      retries: 8,
      maxRetryTime: 30_000,
    },
  };

  // Optional SASL/SSL (production)
  if (process.env.KAFKA_SASL_MECHANISM) {
    config.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM as
        | "plain"
        | "scram-sha-256"
        | "scram-sha-512",
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    } as KafkaConfig["sasl"];
  }
  if (process.env.KAFKA_SSL === "true") {
    config.ssl = true;
  }

  return new Kafka(config);
}

/**
 * Singleton client (one per process — kafkajs internally multiplexes
 * connections across producer/consumer instances built from the same Kafka).
 */
const globalForKafka = globalThis as unknown as { __vvuKafka?: Kafka };
export const kafka: Kafka =
  globalForKafka.__vvuKafka ?? (globalForKafka.__vvuKafka = createKafkaClient());
