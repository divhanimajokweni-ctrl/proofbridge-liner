# AIR Kernel — Terminal UI Command Reference

AIR (Automated Inference Runtime) is the pipeline compiler that powers the VVU Trust Runtime's evidence evaluation and governance decisions. Unlike a long-running daemon, AIR operates as a series of pure functions over immutable data — fetch evidence, run inference, evaluate governance rules, generate knowledge artifacts, and exit. This reference covers installation, authentication, core commands, gate execution, telemetry, and configuration.

---

## 1. Installation

### 1.1 System Requirements

| Requirement | Minimum |
|-------------|---------|
| Operating System | Linux, macOS, or Windows (WSL2) |
| Node.js | 18.x or later |
| Disk Space | 500 MB (including evidence store) |
| Memory | 512 MB available for pipeline runs |

### 1.2 Installing the air Binary

The `air` CLI is distributed as part of the proofbridge-liner repository. Install it globally:

```bash
npm install -g air
```

Or run it directly from the project:

```bash
npx air --version
```

To verify the installation:

```bash
air --version
```

Expected output:

```
AIR Kernel v1.x.x (pipeline compiler, not a daemon)
```

---

## 2. Authentication

### 2.1 API Key Setup

AIR requires an API key for authenticated operations. Generate a key from the VVU Trust Runtime dashboard under **Settings → API Keys**.

Set the key as an environment variable:

```bash
export AIR_API_KEY="your-api-key-here"
```

Or store it in your shell profile (`.bashrc`, `.zshrc`):

```bash
echo 'export AIR_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 2.2 Session Management

AIR sessions are created per pipeline run and destroyed on completion. There is no persistent session to manage. Each run is deterministic — the same inputs produce the same outputs regardless of when or where the pipeline executes.

To verify your API key is valid:

```bash
air status
```

If the key is invalid or missing, AIR returns an authentication error with exit code 1.

---

## 3. Core Commands

### 3.1 air gate

Runs the full evaluation pipeline across all six gates (A through F). This is the primary command for validating a system state.

```bash
air gate --input <path-to-input.json>
```

Options:

| Flag | Description | Default |
|------|-------------|---------|
| `--input` | Path to the input evidence bundle | stdin |
| `--format` | Output format: `json`, `html`, or `text` | `json` |
| `--output` | Path to write output file | stdout |
| `--strict` | Fail on any warning (exit code 1) | false |
| `--gates` | Comma-separated list of gates to evaluate (e.g., `A,B,D`) | all |

Example:

```bash
air gate --input evidence-bundle.json --format html --output report.html
```

### 3.2 air status

Reports the current state of the AIR infrastructure and connected services.

```bash
air status
```

Output includes:

- AIR Kernel version and build info
- Evidence Store status (append-only log health)
- Inference Runtime availability
- Governance Engine connectivity
- Last pipeline run timestamp and result

### 3.3 air verify

Verifies the integrity of a specific proof or attestation without running the full pipeline.

```bash
air verify --proof <proof-hash> [--contract <address>]
```

Options:

| Flag | Description |
|------|-------------|
| `--proof` | The proof hash or transaction hash to verify |
| `--contract` | Optional contract address for on-chain verification |
| `--network` | Network to verify against (default: polygon-amoy) |

Example:

```bash
air verify --proof 0xabc123... --network polygon-amoy
```

### 3.4 air deploy

Deploys a validated configuration to the production environment. Requires a passing `air gate` run before deployment is permitted.

```bash
air deploy --config <path-to-config.json>
```

Options:

| Flag | Description |
|------|-------------|
| `--config` | Path to the deployment configuration |
| `--dry-run` | Validate without deploying |
| `--force` | Skip pre-deployment checks (use with caution) |

Example:

```bash
air deploy --config air.config.json --dry-run
```

---

## 4. Gate Execution

### 4.1 Running Evaluation Loops

The evaluation loop processes evidence through the prover pipeline stages: Fetcher → Validator → Scorer → Submitter → Broadcaster.

Run a single evaluation:

```bash
air gate --input evidence.json
```

Run a continuous evaluation loop (re-evaluates on file change):

```bash
air gate --watch --input ./evidence-store/
```

### 4.2 Output Formats

**JSON output** (default) — structured data for programmatic consumption:

```bash
air gate --input evidence.json --format json
```

**HTML output** — human-readable report with visualisations:

```bash
air gate --input evidence.json --format html --output report.html
```

**Text output** — plain text for terminal or log file consumption:

```bash
air gate --input evidence.json --format text
```

---

## 5. Telemetry

### 5.1 Real-Time Gate Status

AIR exposes real-time gate status during pipeline execution. Enable verbose output with:

```bash
air gate --input evidence.json --verbose
```

Verbose output includes:

- Per-gate timing information
- Inference confidence scores
- Governance rule evaluation results
- Circuit breaker state checks

### 5.2 Audit Trail Access

Every `air gate` run produces an audit trail entry in the evidence store. Query past runs:

```bash
air status --history --limit 50
```

Export the audit trail:

```bash
air status --history --format json --output audit-trail.json
```

---

## 6. Configuration

### 6.1 air.config.json

AIR configuration is stored in `air.config.json` at the project root:

```json
{
  "version": "1.0",
  "gates": ["A", "B", "C", "D", "E", "F"],
  "riskParameter": 0.5,
  "strictMode": false,
  "output": {
    "format": "json",
    "directory": "./air/output"
  },
  "evidence": {
    "storePath": "./air/graph",
    "appendOnly": true
  },
  "contracts": {
    "governanceAnchor": "0x...",
    "circuitBreaker": "0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A"
  },
  "network": {
    "rpc": "https://rpc-amoy.polygon.technology",
    "chainId": 80002
  }
}
```

### 6.2 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AIR_API_KEY` | API key for authenticated operations | Yes |
| `AIR_CONFIG_PATH` | Custom path to `air.config.json` | No |
| `AIR_LOG_LEVEL` | Log verbosity: `debug`, `info`, `warn`, `error` | No (default: `info`) |
| `AIR_EVIDENCE_DIR` | Override evidence store directory | No |
| `SAFEKRIPTE_URL` | URL of the SafeKrypte signing service | No (default: `http://127.0.0.1:5096`) |
| `POLYGON_AMOY_RPC_URL` | Polygon Amoy RPC endpoint | No (default: `https://rpc-amoy.polygon.technology`) |
| `GOVERNANCE_ANCHOR_ADDRESS` | Address of the GovernanceAnchor contract | Yes (for on-chain ops) |
| `CIRCUIT_BREAKER_ADDRESS` | Address of the CircuitBreaker contract | Yes (for on-chain ops) |

---

## 7. Troubleshooting

### Q: `air gate` returns exit code 1 with "Evidence store not found."

Create the evidence store directory before running the pipeline:

```bash
mkdir -p air/graph
```

The evidence store must exist and be writable. The `air.config.json` `evidence.storePath` setting controls the location (default: `./air/graph`).

### Q: `air verify` returns "RPC connection failed."

Check that the Polygon Amoy RPC endpoint is reachable:

```bash
curl https://rpc-amoy.polygon.technology
```

If the endpoint is unreachable, verify your network connection or try an alternative RPC provider. Set the `POLYGON_AMOY_RPC_URL` environment variable to use a custom endpoint.

### Q: `air status` shows "Governance Engine unreachable."

The Governance Engine connects to the on-chain GovernanceAnchor contract. Ensure:

1. The `GOVERNANCE_ANCHOR_ADDRESS` environment variable is set to a valid contract address
2. The contract is deployed on the Polygon Amoy network
3. Your network allows outbound RPC connections

### Q: `air deploy` is rejected with "Pre-deployment gate failed."

Run `air gate` first and ensure all gates pass:

```bash
air gate --input evidence.json --strict
```

Only after a passing gate run will `air deploy` proceed. Use `--dry-run` to validate configuration without deploying.

### Q: Output is empty when using `--format html`.

Ensure the output directory exists:

```bash
mkdir -p air/output
```

Then re-run with the `--output` flag pointing to a valid file path:

```bash
air gate --input evidence.json --format html --output air/output/report.html
```

---

## Appendix: Complete Command Reference Table

| Command | Description | Key Flags |
|---------|-------------|-----------|
| `air gate` | Run full evaluation pipeline | `--input`, `--format`, `--output`, `--strict`, `--gates`, `--watch`, `--verbose` |
| `air status` | Report infrastructure state | `--history`, `--limit`, `--format`, `--output` |
| `air verify` | Verify a single proof or attestation | `--proof`, `--contract`, `--network` |
| `air deploy` | Deploy validated configuration | `--config`, `--dry-run`, `--force` |
| `air --version` | Print AIR Kernel version | — |
| `air --help` | Show help for any command | `--help` (available on all commands) |

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success — all gates passed, operation completed |
| 1 | Failure — gate failed, authentication error, or infrastructure issue |
| 2 | Warning — operation completed with warnings (non-strict mode only) |
