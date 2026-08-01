-- BigQuery Schema: NATS JetStream Event Logs
-- Project: project-cc455a72-1490-4cdf-b0e
-- Dataset: lindiwe_knowledge_base
-- Usage: bq query --use_legacy_sql=false < nats_jetstream_events.sql

CREATE OR REPLACE TABLE `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.nats_jetstream_events` (
  event_id STRING OPTIONS(description="Unique identifier for the event"),
  stream_name STRING OPTIONS(description="The name of the JetStream stream"),
  subject STRING OPTIONS(description="The specific subject the message was published to"),
  sequence_number INT64 OPTIONS(description="Stream sequence number"),
  payload JSON OPTIONS(description="The actual event data in JSON format"),
  headers ARRAY<STRUCT<key STRING, value STRING>> OPTIONS(description="NATS message headers"),
  event_timestamp TIMESTAMP OPTIONS(description="Timestamp when the event was recorded")
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY stream_name, subject
OPTIONS(
  description="NATS JetStream event logs for VVU operational telemetry",
  require_partition_filter=true
);
