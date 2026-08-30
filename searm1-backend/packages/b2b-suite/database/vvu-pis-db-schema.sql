
-- ==============================================================================
-- COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
-- MODULE: VVU-PIS-DB-SCHEMA-v1.1
-- TARGET SYSTEM: POSTGRESQL (v15+)
-- COMPILED BY: Office of the Commercial & Compliance Orchestrator
-- DATE: 2026-08-29
-- DESCRIPTION: High-performance Database Schema, PIS Integration Blueprint,
--              ASTM G31 Algorithm Engine, and YAML Edge Configurations.
-- ==============================================================================

-- Create custom enumerations for strict status tracking and SANS constraints
CREATE TYPE material_cohort AS ENUM (
    '316L_STAINLESS_STEEL',
    '304_STAINLESS_STEEL',
    'GALVANIZED_STEEL',
    'MILD_STEEL',
    'HDPE',
    'ALUMINIUM_6061_T6'
);

CREATE TYPE alert_severity AS ENUM (
    'NORMAL',
    'WARNING',
    'CRITICAL'
);

CREATE TYPE outreach_status AS ENUM (
    'NOT_CONTACTED', 
    'INITIAL_EMAIL_SENT', 
    'TECHNICAL_REVIEW_SCHEDULED', 
    'PDU_PROPOSAL_SENT', 
    'CLOSED_ACTIVE_PILOT'
);

-- ==============================================================================
-- SECTION 2: DDL TABLE ARCHITECTURE
-- ==============================================================================

-- Table 1: Facilities / Industrial Accounts
CREATE TABLE facilities (
    facility_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subsector VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    annual_unlogged_loss_m3 NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    water_tariff_zar_per_m3 NUMERIC(5, 2) NOT NULL DEFAULT 45.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Edge Node Registry (AMD Kria K26 SoMs)
CREATE TABLE edge_nodes (
    node_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    firmware_version VARCHAR(20) NOT NULL,
    casing_seal_status VARCHAR(20) DEFAULT 'IP68_VERIFIED',
    battery_nominal_voltage NUMERIC(4, 2) DEFAULT 25.60,
    system_dry_mass_kg NUMERIC(8, 6) DEFAULT 10.485151,
    mass_safety_margin_g NUMERIC(6, 3) DEFAULT 14.849,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Process Information System (PIS) Live Telemetry Stream
CREATE TABLE telemetry_logs (
    log_id BIGSERIAL PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
    static_pressure_bar NUMERIC(4, 2) NOT NULL,
    inlet_flow_rate_l_s NUMERIC(6, 2) NOT NULL,
    acoustic_snr_db NUMERIC(4, 1) NOT NULL,
    vibration_peak_hz NUMERIC(7, 2) NOT NULL,
    transient_surge_peak_bar NUMERIC(4, 2) NOT NULL,
    battery_voltage_v NUMERIC(4, 2) NOT NULL,
    temperature_c NUMERIC(4, 1) NOT NULL,
    raw_payload_json JSONB NOT NULL,
    sha256_signature CHAR(64) NOT NULL,
    signature_verified BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_pressure_limit CHECK (static_pressure_bar >= 0.0 AND static_pressure_bar <= 30.0),
    CONSTRAINT chk_voltage_range CHECK (battery_voltage_v >= 20.0 AND battery_voltage_v <= 30.0)
);

-- Table 4: Passive Dummy Unit (PDU) Coupon Evaluation Log
CREATE TABLE pdu_coupon_logs (
    coupon_id VARCHAR(50) PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    material_class material_cohort NOT NULL,
    initial_mass_g NUMERIC(8, 4) NOT NULL,
    final_mass_g NUMERIC(8, 4) NOT NULL,
    exposure_hours NUMERIC(8, 2) NOT NULL,
    exposure_area_cm2 NUMERIC(6, 3) NOT NULL,
    calculated_cr_mm_yr NUMERIC(8, 6) GENERATED ALWAYS AS (
        CASE 
            WHEN (initial_mass_g - final_mass_g) <= 0 THEN 0.0
            ELSE ((initial_mass_g - final_mass_g) * 87600.0) / (exposure_area_cm2 * exposure_hours * 
                CASE 
                    WHEN material_class = '316L_STAINLESS_STEEL' THEN 8.00
                    WHEN material_class = '304_STAINLESS_STEEL' THEN 8.00
                    WHEN material_class = 'GALVANIZED_STEEL' THEN 7.85
                    WHEN material_class = 'MILD_STEEL' THEN 7.85
                    WHEN material_class = 'HDPE' THEN 0.95
                    WHEN material_class = 'ALUMINIUM_6061_T6' THEN 2.70
                    ELSE 7.85
                END
            )
        END
    ) STORED,
    maximum_pitting_depth_mm NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    system_severity alert_severity GENERATED ALWAYS AS (
        CASE 
            WHEN maximum_pitting_depth_mm >= 0.50 OR 
                 (((initial_mass_g - final_mass_g) * 87600.0) / (exposure_area_cm2 * exposure_hours * 
                    CASE 
                        WHEN material_class = '304_STAINLESS_STEEL' THEN 8.00
                        ELSE 7.85
                    END
                 )) >= 0.10 THEN 'CRITICAL'::alert_severity
            WHEN maximum_pitting_depth_mm >= 0.30 THEN 'WARNING'::alert_severity
            ELSE 'NORMAL'::alert_severity
        END
    ) STORED,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mass_loss CHECK (final_mass_g <= initial_mass_g),
    CONSTRAINT chk_hours_positive CHECK (exposure_hours > 0.0)
);

-- ==============================================================================
-- SECTION 3: SYSTEM INDEXING & QUERY OPTIMISATION
-- ==============================================================================

CREATE INDEX idx_telemetry_node_timestamp ON telemetry_logs (node_id, logged_at DESC);
CREATE INDEX idx_coupon_node ON pdu_coupon_logs (node_id);
CREATE INDEX idx_facilities_subsector ON facilities (subsector);

-- ==============================================================================
-- SECTION 4: REAL-TIME B2B PIPELINE VIEW (ECONOMIC IMPACT)
-- ==============================================================================

CREATE VIEW view_b2b_economic_impact AS
SELECT 
    f.facility_id,
    f.name AS facility_name,
    f.subsector,
    f.annual_unlogged_loss_m3,
    (f.annual_unlogged_loss_m3 * f.water_tariff_zar_per_m3) AS annual_financial_loss_zar,
    COUNT(e.node_id) AS active_monitored_nodes
FROM facilities f
LEFT JOIN edge_nodes e ON f.facility_id = e.facility_id
GROUP BY f.facility_id, f.name, f.subsector, f.annual_unlogged_loss_m3, f.water_tariff_zar_per_m3;

-- ==============================================================================
-- SECTION 5: EDGE YAML CONFIGURATION TEMPLATE
-- ==============================================================================

/*
# ==============================================================================
# vvu_edge_config.yaml
# DEPLOYMENT TARGET: /etc/vvu/edge_relay.yaml ON AMD KRIA K26 EDGE MODULES
# ==============================================================================
edge_node:
  id: "VVU-HG-IND-01A"
  firmware: "v1.5.1-unilateral"
  logging_interval_seconds: 1

hardware:
  adc: "TI_PCM1864_Q1"
  analog_channels:
    ch0: "acoustic_hydrophone"
    ch1: "pressure_transient"
    ch2: "inlet_flow"
  battery_chemistry: "LiFePO4_8S4P_25.6V"
  thermal_watchdog_limits:
    warning_c: 65.0
    throttle_c: 75.0
    critical_shutdown_c: 85.0

security:
  hmac_secret_key: "secure_element_hardware_signing_key_2026_08"
  secure_chip: "SafeKrypte_HSM_v3"
  hash_algorithm: "SHA256"

pis_historian:
  target_url: "https://pis.client-domain.co.za/api/v1/ingest"
  auth_token: "vvu_secure_token_582cf_904cd8"
  connection_timeout_ms: 5000
  retry_backoff_base_seconds: 2
  max_local_store_payloads: 86400
*/

---

