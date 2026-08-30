import { ethers } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying VVUIVELedger with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  if (balance === /* @__PURE__ */ BigInt("0")) {
    console.warn(
      "\u26A0\uFE0F  Deployer has zero balance \u2014 funding required before deploy."
    );
  }
  const VVUIVELedger = await ethers.getContractFactory("VVUIVELedger");
  const ledger = await VVUIVELedger.deploy();
  await ledger.waitForDeployment();
  const address = await ledger.getAddress();
  console.log("\u2705 VVUIVELedger deployed to:", address);
  const artifactsDir = path.resolve(process.cwd(), "artifacts");
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, "contract-address.txt"),
    address + "\n",
    "utf-8"
  );
  console.log(`Address written to artifacts/contract-address.txt`);
  const verdict = await ledger.getVerdict();
  console.log("Post-deploy verdict tuple:", {
    studiVerdict: verdict[0].toString(),
    iveVerdict: verdict[1].toString(),
    breaker: verdict[2].toString(),
    confidence: verdict[3].toString(),
    lastUpdatedAt: verdict[4].toString()
  });
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
