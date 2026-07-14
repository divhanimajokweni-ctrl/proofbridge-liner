-- BigQuery UDF: ROSCA/Stokvel Payout Calculator
-- Project: project-cc455a72-1490-4cdf-b0e
-- Dataset: lindiwe_knowledge_base
-- Usage: bq query --use_legacy_sql=false < rosca_payout_udf.sql

CREATE OR REPLACE FUNCTION
  `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.calculate_rosca_payout`(
    contributions ARRAY<STRUCT<member_id STRING, amount NUMERIC>>,
    payout_month INT64
  )
  RETURNS NUMERIC
  LANGUAGE js AS """
  // In a simple ROSCA model, the payout for a given month is the sum of all contributions
  // from all members for that specific payout period.
  // This UDF assumes 'contributions' is an array of all contributions for a single payout cycle.
  // The 'payout_month' parameter could be used for more complex logic, e.g., if contributions
  // vary by month or if there's a specific member designated for payout in that month.
  // For this basic implementation, we just sum up the provided contributions.

  if (!contributions || contributions.length === 0) {
    return 0;
  }

  let totalPayout = 0;
  for (let i = 0; i < contributions.length; i++) {
    if (typeof contributions[i].amount === 'number') {
      totalPayout += contributions[i].amount;
    }
  }
  return totalPayout;
""" OPTIONS (
  description = "Calculates the total payout for a Rotating Savings and Credit Association (ROSCA) for a given cycle."
);

-- Example usage:
-- SELECT `project-cc455a72-1490-4cdf-b0e.lindiwe_knowledge_base.calculate_rosca_payout`(
--   [
--     STRUCT('member_1' AS member_id, 500.00 AS amount),
--     STRUCT('member_2' AS member_id, 500.00 AS amount),
--     STRUCT('member_3' AS member_id, 500.00 AS amount),
--     STRUCT('member_4' AS member_id, 500.00 AS amount),
--     STRUCT('member_5' AS member_id, 500.00 AS amount),
--     STRUCT('member_6' AS member_id, 500.00 AS amount),
--     STRUCT('member_7' AS member_id, 500.00 AS amount),
--     STRUCT('member_8' AS member_id, 500.00 AS amount),
--     STRUCT('member_9' AS member_id, 500.00 AS amount),
--     STRUCT('member_10' AS member_id, 500.00 AS amount),
--     STRUCT('member_11' AS member_id, 500.00 AS amount),
--     STRUCT('member_12' AS member_id, 500.00 AS amount)
--   ],
--   1
-- ) AS total_payout;
-- Returns: 6000.00 (R6,000 per cycle for a 12-member pool with R500 contributions)
