/**
 * deploy-ledger.ts — Hardhat deploy script for VVUIVELedger.
 *
 * Deploys to the network passed via `--network` (typically
 * arbitrum-sepolia for the testnet, arbitrum for mainnet). Writes
 * the deployed contract address to artifacts/contract-address.txt
 * so deploy.sh can pick it up.
 *
 * Run with: npx hardhat run scripts/hardhat/deploy-ledger.ts --network arbitrum-sepolia
 */

import { ethers } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying VVUIVELedger with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.warn(
      "⚠️  Deployer has zero balance — funding required before deploy."
    );
  }

  const VVUIVELedger = await ethers.getContractFactory("VVUIVELedger");
  const ledger = await VVUIVELedger.deploy();
  await ledger.waitForDeployment();

  const address = await ledger.getAddress();
  console.log("✅ VVUIVELedger deployed to:", address);

  // Persist the address for deploy.sh to consume.
  const artifactsDir = path.resolve(process.cwd(), "artifacts");
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, "contract-address.txt"),
    address + "\n",
    "utf-8"
  );
  console.log(`Address written to artifacts/contract-address.txt`);

  // Quick sanity check — read back the verdict tuple.
  const verdict = await ledger.getVerdict();
  console.log("Post-deploy verdict tuple:", {
    studiVerdict: verdict[0].toString(),
    iveVerdict: verdict[1].toString(),
    breaker: verdict[2].toString(),
    confidence: verdict[3].toString(),
    lastUpdatedAt: verdict[4].toString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
