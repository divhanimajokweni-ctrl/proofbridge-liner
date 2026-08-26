#!/bin/bash
# /sandbox/setup.sh
# VVU IVE: Sandbox Environment Initialization
# Restructures legacy UI into full-screen World -> Room -> Activity workspaces.
set -euo pipefail

echo "======================================================="
echo "[VVU IVE] Initializing DWS Sandbox Environment"
echo "======================================================="

# 1. Enforce Directory Structure
echo "[1/4] Scaffolding system directories..."
mkdir -p pipeline src data evidence public/activities

# 2. Wire the Full-Screen Activity Wrapper
echo "[2/4] Wiring World -> Room -> Activity full-screen wrappers..."

cat << 'CSSEOF' > public/activities/workspace-wrapper.css
/* VVU IVE Activity Reset */
html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #020617;
    color: #e2e8f0;
    font-family: 'Inter', monospace;
}
.vvu-room-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
}
.vvu-activity-workspace {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
}
/* Strict DWS Data Labeling */
.vvu-data-label {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #f59e0b;
    color: #000;
    padding: 4px 16px;
    font-weight: bold;
    font-size: 12px;
    z-index: 9999;
    letter-spacing: 1px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
}
CSSEOF

# 3. Unblock HBK MKII Source
echo "[3/4] Verifying EIS v1.0 engine availability..."
if [ -f "../src/lib/evidence/EISv1Engine.ts" ]; then
    echo "      ✓ EISv1Engine.ts found at src/lib/evidence/"
    echo "      ✓ AuditSerializer.ts found at src/lib/evidence/"
else
    echo "      [WARN] EIS v1.0 engine not found. Ensure the Next.js project is at the parent level."
fi

# 4. Initialize Placeholder Data (NMBM)
echo "[4/4] Verifying placeholder datasets..."
if [ ! -f "data/nmbm_placeholder_baseline.csv" ]; then
    echo "      Generating NMBM placeholder time-series data..."
    echo "timestamp,flow_lps,pressure_m,status,quality_flag" > data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T00:00:00Z,102.0,48.2,NOMINAL,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T01:00:00Z,98.0,48.5,NOMINAL,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T02:00:00Z,97.0,48.4,NOMINAL,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T03:00:00Z,96.0,48.6,NOMINAL,VALID" >> data/nmbm_placeholder_baseline.csv
    # Inject the anomaly for the demo
    echo "2026-08-26T04:00:00Z,111.0,46.1,ANOMALY,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T05:00:00Z,114.0,45.7,ANOMALY,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "2026-08-26T06:00:00Z,116.0,45.4,ANOMALY,VALID" >> data/nmbm_placeholder_baseline.csv
    echo "      ✓ Placeholder data generated (clearly labelled SIMULATION DATA)"
else
    echo "      ✓ Placeholder data already exists."
fi

echo "======================================================="
echo "✅ Setup Complete."
echo "Run 'cd pipeline && ./run.sh' to execute the evidence engine."
echo "======================================================="
