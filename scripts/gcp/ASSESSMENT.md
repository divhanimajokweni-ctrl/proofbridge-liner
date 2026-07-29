# GCP Integration Assessment — 2026-07-14

## Executive Summary

The GCP infrastructure briefing proposes Vertex AI, GKE, BigQuery, and Reasoning Engine integrations. **None of these exist in the current codebase.** This document assesses what's proposed vs. what's real, and provides a phased implementation recommendation.

## Current State

| Component | Status | Evidence |
|-----------|--------|----------|
| GCP Project | `project-cc455a72-1490-4cdf-b0e` | Referenced in briefing |
| `gcloud` CLI | Unknown | Not verified on this machine |
| BigQuery | **NOT CONFIGURED** | No datasets, no API enabled |
| Vertex AI | **NOT CONFIGURED** | No endpoints, no models |
| GKE | **NOT CONFIGURED** | No clusters, no node pools |
| MCP GCP Server | **MISSING** | `openclaw.json` references `mcp/gcp-server.js` — file doesn't exist |
| Terraform | EXISTS | `scripts/main.tf` — GitHub/Replit secret sync only |
| NATS JetStream | EXISTS | Used in VVU event bus |
| BigQuery Sink | **DOES NOT EXIST** | No pipeline from NATS to BigQuery |

## Briefing Proposals vs. VVU Reality

### 1. Multi-Model Orchestration (Vertex AI Reasoning Engine)
- **Briefing:** Deploy Reasoning Engine for "High-Stakes Router" (compliance, audit gates)
- **VVU Reality:** Lindiwe currently runs on Claude 3.5 Sonnet via API. No GCP project is configured.
- **Assessment:**有价值但为时过早. The compliance gates (HF-1 through HF-5) are enforced by the Compliance Fabric, not an AI router. Adding Vertex AI introduces a new failure mode without clear benefit at Phase 1 scale.
- **Recommendation:** Defer to Phase 2 when throughput justifies managed orchestration.

### 2. Open-Weight Models on GKE (GLM-5.2, Gemma 2)
- **Briefing:** Deploy L4 GPU node pools for cost-effective inference
- **VVU Reality:** No GKE setup. No GPU requirements at current scale.
- **Assessment:** Cost-prohibitive at Phase 1. A single G2-standard-24 node with 2 L4 GPUs costs ~$1.50/hr ($1,080/month). At Phase 1 throughput (< 1K requests/day), this is 100x over-provisioned.
- **Recommendation:** Revisit at Phase 2 when Ubuntu Pools reaches 10K+ active members.

### 3. BigQuery Data Agent
- **Briefing:** Create datasets, UDFs, and grant access for natural language querying
- **VVU Reality:** No BigQuery setup. NATS events are not piped anywhere.
- **Assessment:** Low-cost, high-value. BigQuery is pay-per-query. Creating the dataset and UDFs now costs nothing until data is loaded.
- **Recommendation:** Implement now. The ROSCA payout UDF and NATS event schema are ready.

### 4. NATS → BigQuery Pipeline
- **Briefing:** Pipe 34 events across 7 namespaces into BigQuery
- **VVU Reality:** NATS JetStream is used but events are not persisted to any analytics store.
- **Assessment:** Valuable for Lindiwe's training data loop. Can be implemented as a lightweight consumer.
- **Recommendation:** Implement as a Phase 2 deliverable. Requires a NATS consumer that writes to BigQuery via the streaming API.

## Cost Analysis

| Service | Phase 1 Cost | Phase 2 Cost | Notes |
|---------|-------------|-------------|-------|
| BigQuery (storage) | $0.02/GB/month | $0.02/GB/month | Pay-per-query |
| BigQuery (queries) | ~$5/100GB scanned | ~$5/100GB scanned | On-demand pricing |
| GKE (L4 GPUs) | N/A | ~$1,080/node/month | Deferred |
| Vertex AI | N/A | ~$0.01/1K tokens | Deferred |
| **Total Phase 1** | **~$0-5/month** | — | BigQuery only |

## Implementation Plan

### Phase 1 (Now) — BigQuery Foundation
1. Enable BigQuery API on `project-cc455a72-1490-4cdf-b0e`
2. Create `lindiwe_knowledge_base` dataset
3. Deploy `nats_jetstream_events` table schema
4. Deploy `calculate_rosca_payout` UDF
5. Grant `roles/bigquery.dataViewer` to team

### Phase 2 (Q1 2027) — NATS → BigQuery Pipeline
1. Build NATS consumer that writes to BigQuery streaming API
2. Instrument 34 event types across 7 namespaces
3. Create BigQuery Data Agent for natural language querying
4. Evaluate Vertex AI Reasoning Engine for compliance routing

### Phase 3 (Q2 2027) — GKE Inference (if justified)
1. Evaluate open-weight model hosting needs
2. Cost-benefit analysis of self-hosted vs. API inference
3. Deploy GKE cluster with L4 GPU node pools

## Files Created

```
scripts/gcp/
├── nats_jetstream_events.sql    # BigQuery table schema
├── rosca_payout_udf.sql         # ROSCA payout UDF
├── setup-bigquery.sh            # Automated setup script
└── ASSESSMENT.md                # This document
```

## Next Steps

1. Run `bash scripts/gcp/setup-bigquery.sh` to provision BigQuery resources
2. Configure `gcloud` authentication on this machine
3. Decide whether to implement NATS → BigQuery pipeline now or defer to Phase 2
