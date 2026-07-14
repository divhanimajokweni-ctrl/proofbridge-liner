-- BigQuery Schema: NATS JetStream Event Logs
-- Project: project-cc455a72-1490-4cdf-b0e
-- Dataset: lindiwe_knowledge_base
-- Usage: bq query --use_legacy_sql=false < nats_jetstream_events.sql

CREATE OR REPLACE TABLE `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.nats_jetstream_events` (
  event_id STRING OPTIONS(description="Unique identifier for the event"),
  stream_name STRING OPTIONS(description="The name of the JetStream"),
  subject STRING OPTIONS(description="The specific subject the message was published to"),
  sequence_number INT64 OPTIONS(description="Stream sequence number"),
  payload JSON OPTIONS(description="The actual event data in JSON format"),
  headers ARRAY<STRUCT<key STRING, value STRING>> OPTIONS(description="Message headers as key-value pairs"),
  published_at TIMESTAMP OPTIONS(description="When the event was published"),
  received_at TIMESTAMP OPTIONS(description="When the event was received by the consumer"),
  consumer_name STRING OPTIONS(description="Name of the JetStream consumer"),
  redelivery_count INT64 OPTIONS(description="Number of times this message has been redelivered"),
  ack_pending BOOL OPTIONS(description="Whether the message is awaiting acknowledgment"),
  domain STRING OPTIONS(description="VVU domain: ubuntu_pools | proofbridge | safekrypte | safegrid"),
  tenant_id STRING OPTIONS(description="Multi-tenant isolation key")
)
PARTITION BY DATE(published_at)
CLUSTER BY stream_name, domain, subject
OPTIONS(
  description="NATS JetStream event logs for VVU operational telemetry",
  require_partition_filter=true
);
