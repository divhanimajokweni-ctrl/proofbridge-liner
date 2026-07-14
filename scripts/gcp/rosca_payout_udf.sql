-- BigQuery UDF: ROSCA/Stokvel Payout Calculator
-- Project: project-cc455a72-1490-4cdf-b0e
-- Dataset: lindiwe_knowledge_base
-- Usage: bq query --use_legacy_sql=false < rosca_payout_udf.sql

CREATE OR REPLACE FUNCTION `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.calculate_rosca_payout`(
  contribution_amount FLOAT64,
  num_members INT64
) AS (
  -- Simple ROSCA payout: total pool collected per cycle
  -- Each cycle, every member contributes `contribution_amount`.
  -- The recipient gets the sum of all contributions.
  contribution_amount * num_members
);

-- Example usage:
-- SELECT `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.calculate_rosca_payout`(500.0, 12) as total_payout;
-- Returns: 6000.0 (R6,000 per cycle for a 12-member pool with R500 contributions)
