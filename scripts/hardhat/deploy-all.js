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
    faucet: "https://faucets.quicknode.com/arbitrum/sepolia"
  },
  {
    name: "polygon-amoy",
    chainId: 80002,
    file: "sovereign-polygon-amoy.txt",
    rpc: "https://rpc-amoy.polygon.technology",
    faucet: "https://faucet.polygon.technology/"
  }
];
async function deployToNetwork(net) {
  console.log(`
\u2501\u2501\u2501 Deploying VVUSovereignRegistry to ${net.name} (chainId ${net.chainId}) \u2501\u2501\u2501`);
  const deployerPk = process.env.DEPLOYER_PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(net.rpc);
  const deployer = new ethers.Wallet(deployerPk, provider);
  const network = await provider.getNetwork();
  console.log(`  Connected to chainId ${network.chainId} via ${net.rpc}`);
  if (Number(network.chainId) !== net.chainId) {
    throw new Error(`Chain ID mismatch: expected ${net.chainId}, got ${network.chainId}`);
  }
  const balance = await provider.getBalance(deployer.address);
  console.log(`  Deployer: ${deployer.address} | balance: ${ethers.formatEther(balance)} native`);
  if (balance === /* @__PURE__ */ BigInt("0")) {
    throw new Error(
      `Deployer has 0 balance on ${net.name}. Fund from a faucet first:
  ${net.faucet}`
    );
  }
  const sovereignAuthority = process.env.SOVEREIGN_AUTHORITY;
  if (!sovereignAuthority || !ethers.isAddress(sovereignAuthority)) {
    throw new Error(
      "SOVEREIGN_AUTHORITY env var must be set to the federal multi-sig address"
    );
  }
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
  console.log(`  \u26A0 Contract ships DORMANT \u2014 activation via AMD pipeline required.`);
  const contract = await factory.deploy(sovereignAuthority);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const paused = await contract.paused();
  const commitHash = await contract.activationCommitHash();
  if (!paused || commitHash !== ethers.ZeroHash) {
    throw new Error(
      `Dormant invariant violated on ${net.name}: paused=${paused}, commitHash=${commitHash}`
    );
  }
  console.log(`  \u2705 Deployed at ${address} (dormant, paused=true)`);
  console.log(`  Federal auditor (deployer): ${deployer.address}`);
  console.log(`  Sovereign authority:         ${sovereignAuthority}`);
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(ARTIFACTS_DIR, net.file), address + "\n", { mode: 420 });
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
  console.log("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  console.log("\u2502 VVUSovereignRegistry \u2014 dual-network dormant deploy          \u2502");
  console.log("\u2502 Targets: arbitrum-sepolia (421614) + polygon-amoy (80002)   \u2502");
  console.log("\u2502 Mode: DORMANT \u2014 activation via AMD MI300x pipeline          \u2502");
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518");
  const addresses = {};
  for (const net of NETWORKS) {
    addresses[net.name] = await deployToNetwork(net);
  }
  console.log("\n\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  console.log("\u2502 Dual-network dormant deploy complete.                       \u2502");
  console.log("\u2502                                                             \u2502");
  console.log("\u2502 \u26A0 Contracts are DORMANT on both networks. No anchor / issue \u2502");
  console.log("\u2502   calls will succeed until the AMD MI300x pipeline verifies \u2502");
  console.log("\u2502   the latest git sync and calls activate(gitCommitHash).   \u2502");
  console.log("\u2502                                                             \u2502");
  for (const net of NETWORKS) {
    console.log(`\u2502 ${net.name.padEnd(20)} ${addresses[net.name]}`);
  }
  console.log("\u2502                                                             \u2502");
  console.log("\u2502 Next: trigger .github/workflows/gpu-pipeline-activation.yml \u2502");
  console.log("\u2502       on git push to main. The pipeline authenticates as   \u2502");
  console.log("\u2502       the sovereign authority and calls activate().         \u2502");
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518");
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
