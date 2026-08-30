#!/bin/bash
# GCP BigQuery Setup Script
# Project: project-cc455a72-1490-4cdf-b0e
# Run: bash scripts/gcp/setup-bigquery.sh

set -euo pipefail

PROJECT_ID="project-cc455a72-1490-4cdf-b0e"
DATASET="lindiwe_knowledge_base"
LOCATION="us-central1"

echo "=== VVU GCP BigQuery Setup ==="
echo "Project: $PROJECT_ID"
echo "Dataset: $DATASET"
echo "Location: $LOCATION"
echo ""

# 1. Enable required APIs
echo "1. Enabling required APIs..."
gcloud services enable bigquery.googleapis.com \
  bigqueryconnection.googleapis.com \
  datacatalog.googleapis.com \
  --project="$PROJECT_ID"

# 2. Create dataset
echo "2. Creating BigQuery dataset..."
bq mk --dataset \
  --location="$LOCATION" \
  --description="Lindiwe AI knowledge base for VVU operational telemetry" \
  "$PROJECT_ID:$DATASET" 2>/dev/null || echo "   Dataset already exists"

# 3. Create NATS JetStream events table
echo "3. Creating nats_jetstream_events table..."
bq query \
  --use_legacy_sql=false \
  --project_id="$PROJECT_ID" \
  < "$(dirname "$0")/nats_jetstream_events.sql"

# 4. Create ROSCA payout UDF
echo "4. Creating calculate_rosca_payout UDF..."
bq query \
  --use_legacy_sql=false \
  --project_id="$PROJECT_ID" \
  < "$(dirname "$0")/rosca_payout_udf.sql"

# 5. Verify
echo "5. Verifying setup..."
bq ls "$PROJECT_ID:$DATASET"

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  - Grant roles/bigquery.dataViewer to users"
echo "  - Grant roles/geminidataanalytics.dataAgentUser for Data Agent"
echo "  - Pipe NATS JetStream events into the table"
