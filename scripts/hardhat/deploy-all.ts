/**
 * deploy-all.ts — Dual-network dormant deploy.
 *
 * Deploys VVUSovereignRegistry to BOTH Arbitrum Sepolia (421614) and
 * Polygon Amoy (80002) in sequence. The contract ships PAUSED on both
 * networks — the sovereign authority must call activate(gitCommitHash)
 * on each network separately after the AMD MI300x pipeline has verified
 * the latest git sync.
 *
 * Two addresses are written to artifacts/:
 *   - sovereign-arbitrum-sepolia.txt
 *   - sovereign-polygon-amoy.txt
 *
 * Run with:
 *   SOVEREIGN_AUTHORITY=<federal-multi-sig-address> \
 *   DEPLOYER_PRIVATE_KEY=<funded-wallet-private-key> \
 *   npx hardhat run scripts/hardhat/deploy-all.ts
 *
 * (Network is selected internally — you don't need to pass --network.
 *  The script connects to each network's public RPC directly via
 *  ethers.JsonRpcProvider.)
 *
 * Required env:
 *   DEPLOYER_PRIVATE_KEY     — funded wallet on BOTH networks
 *   SOVEREIGN_AUTHORITY      — the federal multi-sig address (no
 *                              private key — only the address is
 *                              passed to the constructor)
 */

import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";

const ARTIFACTS_DIR = path.resolve(__dirname, "../../artifacts");

const NETWORKS = [
  {
    name: "arbitrum-sepolia",
    chainId: 421614,
    file: "sovereign-arbitrum-sepolia.txt",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    faucet: "https://faucets.quicknode.com/arbitrum/sepolia",
  },
  {
    name: "polygon-amoy",
    chainId: 80002,
    file: "sovereign-polygon-amoy.txt",
    rpc: "https://rpc-amoy.polygon.technology",
    faucet: "https://faucet.polygon.technology/",
  },
] as const;

async function deployToNetwork(net: (typeof NETWORKS)[number]): Promise<string> {
  console.log(`\n━━━ Deploying VVUSovereignRegistry to ${net.name} (chainId ${net.chainId}) ━━━`);

  const deployerPk = process.env.DEPLOYER_PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(net.rpc);
  const deployer = new ethers.Wallet(deployerPk, provider);

  const network = await provider.getNetwork();
  console.log(`  Connected to chainId ${network.chainId} via ${net.rpc}`);
  if (Number(network.chainId) !== net.chainId) {
    throw new Error(`Chain ID mismatch: expected ${net.chainId}, got ${network.chainId}`);
  }

  // Sanity-check the deployer has a balance.
  const balance = await provider.getBalance(deployer.address);
  console.log(`  Deployer: ${deployer.address} | balance: ${ethers.formatEther(balance)} native`);
  if (balance === 0n) {
    throw new Error(
      `Deployer has 0 balance on ${net.name}. Fund from a faucet first:\n  ${net.faucet}`
    );
  }

  // Resolve the sovereign authority from env.
  const sovereignAuthority = process.env.SOVEREIGN_AUTHORITY;
  if (!sovereignAuthority || !ethers.isAddress(sovereignAuthority)) {
    throw new Error(
      "SOVEREIGN_AUTHORITY env var must be set to the federal multi-sig address"
    );
  }

  // Deploy — contract ships PAUSED (dormant). The sovereign authority
  // will call activate(gitCommitHash) from the AMD GPU pipeline after
  // git sync verification.
  //
  // We pull the ABI + bytecode from the hardhat artifacts so we don't
  // have to import the hardhat runtime (which has ESM/CJS interop
  // issues in this project).
  const artifactPath = path.resolve(
    ARTIFACTS_DIR,
    "contracts",
    "VVUSovereignRegistry.sol",
    "VVUSovereignRegistry.json"
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found at ${artifactPath}. Run \`npx hardhat compile\` first.`
    );
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  console.log(`  Deploying VVUSovereignRegistry (sovereign authority: ${sovereignAuthority})...`);
  console.log(`  ⚠ Contract ships DORMANT — activation via AMD pipeline required.`);

  const contract = await factory.deploy(sovereignAuthority) as ethers.Contract & {
    paused(): Promise<boolean>;
    activationCommitHash(): Promise<string>;
    getAddress(): Promise<string>;
  };
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  // Sanity-check: paused should be true, activationCommitHash zero.
  const paused = await contract.paused();
  const commitHash = await contract.activationCommitHash();
  if (!paused || commitHash !== ethers.ZeroHash) {
    throw new Error(
      `Dormant invariant violated on ${net.name}: paused=${paused}, commitHash=${commitHash}`
    );
  }

  console.log(`  ✅ Deployed at ${address} (dormant, paused=true)`);
  console.log(`  Federal auditor (deployer): ${deployer.address}`);
  console.log(`  Sovereign authority:         ${sovereignAuthority}`);

  // Persist the address.
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(ARTIFACTS_DIR, net.file), address + "\n", { mode: 0o644 });
  console.log(`  Address written to artifacts/${net.file}`);

  return address;
}

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY env var is required");
  }
  if (!process.env.SOVEREIGN_AUTHORITY) {
    throw new Error(
      "SOVEREIGN_AUTHORITY env var is required (the federal multi-sig address)"
    );
  }

  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│ VVUSovereignRegistry — dual-network dormant deploy          │");
  console.log("│ Targets: arbitrum-sepolia (421614) + polygon-amoy (80002)   │");
  console.log("│ Mode: DORMANT — activation via AMD MI300x pipeline          │");
  console.log("└─────────────────────────────────────────────────────────────┘");

  const addresses: Record<string, string> = {};
  for (const net of NETWORKS) {
    addresses[net.name] = await deployToNetwork(net);
  }

  console.log("\n┌─────────────────────────────────────────────────────────────┐");
  console.log("│ Dual-network dormant deploy complete.                       │");
  console.log("│                                                             │");
  console.log("│ ⚠ Contracts are DORMANT on both networks. No anchor / issue │");
  console.log("│   calls will succeed until the AMD MI300x pipeline verifies │");
  console.log("│   the latest git sync and calls activate(gitCommitHash).   │");
  console.log("│                                                             │");
  for (const net of NETWORKS) {
    console.log(`│ ${net.name.padEnd(20)} ${addresses[net.name]}`);
  }
  console.log("│                                                             │");
  console.log("│ Next: trigger .github/workflows/gpu-pipeline-activation.yml │");
  console.log("│       on git push to main. The pipeline authenticates as   │");
  console.log("│       the sovereign authority and calls activate().         │");
  console.log("└─────────────────────────────────────────────────────────────┘");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
