var _a;
import { Kafka } from "kafkajs";
import { getKafkaBrokers } from "../config";
function createKafkaClient() {
  var _a2;
  const brokers = getKafkaBrokers();
  if (brokers.length === 0) {
    throw new Error(
      "KAFKA_BROKERS env var is empty \u2014 cannot create Kafka client"
    );
  }
  const clientId = (_a2 = process.env.KAFKA_CLIENT_ID) != null ? _a2 : "vvu-ive-webhook";
  const config = {
    clientId,
    brokers,
    // Production: MSK uses IAM/SASL. Wire in via env when needed.
    // For local docker-compose Kafka (KRaft, plaintext) this is sufficient.
    retry: {
      // Aggressive initial retry — Kafka cluster may still be booting
      initialRetryTime: 500,
      retries: 8,
      maxRetryTime: 3e4
    }
  };
  if (process.env.KAFKA_SASL_MECHANISM) {
    config.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM,
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD
    };
  }
  if (process.env.KAFKA_SSL === "true") {
    config.ssl = true;
  }
  return new Kafka(config);
}
const globalForKafka = globalThis;
const kafka = (_a = globalForKafka.__vvuKafka) != null ? _a : globalForKafka.__vvuKafka = createKafkaClient();
export {
  createKafkaClient,
  kafka
};
