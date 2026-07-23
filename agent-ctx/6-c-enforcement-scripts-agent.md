# Task 6-c — Enforcement Scripts Agent

## Task
Create VVU EARTH TECH boundary enforcement scripts (Golden Rule enforcement).

## Scripts Created

### 1. `scripts/golden-rule-checker.js`
- **Language**: Node.js (#!/usr/bin/env node)
- **Purpose**: AST scanner checking `open-source/` directory for product-specific strings
- **FORBIDDEN_STRINGS**: 14 entries — ProofBridge, Ubuntu Pools, UbuntuPools, SafeGrid, Stokvel, ROSCA, FSCA, FICA, POPIA, kimi_reply, vision_agent, Hydro-Gateway, HBK, VVU EARTH TECH
- **Extensions scanned**: .ts, .tsx, .js, .jsx, .rs, .go
- **Features**: Comment-awareness filter (skips comments mentioning "forbidden", "golden rule", "do not"), recursive directory scan, violation summary by string, styled ╔════╗ box output
- **Exit codes**: 0 = compliant, 1 = violations found
- **Test result**: Found 4 violations (VVU EARTH TECH in comments in air-kernel, epistemic-runtime, safe-krypte-basic)

### 2. `scripts/enforce-boundaries.sh`
- **Language**: Bash (#!/usr/bin/env bash)
- **Purpose**: Checks that no file in `open-source/` or `shared/` imports from `commercial/`
- **Import patterns**: 12 patterns covering `from 'commercial/`, `from '@vvu/commercial`, `require('commercial/`, `require('@vvu/commercial`, `import 'commercial/`, `import '@vvu/commercial` (both single and double quotes)
- **Scan method**: Two-pass — per-pattern file scan + combined grep detailed scan showing exact lines
- **Exit codes**: 0 = no violations, 1 = violations found
- **Test result**: PASSED — 0 violations, 5 files scanned across open-source/ and shared/

### 3. `scripts/check-licenses.sh`
- **Language**: Bash (#!/usr/bin/env bash)
- **Purpose**: Scans .ts files in `open-source/` and `shared/` for `@license VVU EARTH TECH` headers
- **Pattern**: `@license.*VVU EARTH TECH` or `VVU EARTH TECH.*@license`
- **Features**: Per-file status (✅/❌), missing files list, remediation instructions showing expected header format
- **Exit codes**: 0 = all licensed, 1 = files missing headers
- **Test result**: FAILED — 5 files missing headers (3 in open-source/, 2 in shared/)

## Styling
All scripts use ╔════════════════════════════════════════╗ box headers matching the existing `push-to-main.sh` pattern.

## Coordination Notes
- The golden-rule-checker finds "VVU EARTH TECH" in existing open-source comments — other agents should decide whether company attribution in comments should be exempted or removed
- The check-licenses.sh identifies 5 files needing @license headers — other agents should add these headers
- All scripts handle missing directories gracefully (skip with info message)
