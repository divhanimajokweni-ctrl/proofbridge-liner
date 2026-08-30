import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.production' });

/**
 * VVU Platform: Automated Key Rotation & Replit Secret Sync
 * Description: Rotates the Gate F updater key on-chain and syncs to Replit.
 */

async function updateReplitSecret(name: string, value: string) {
  const replId = process.env.REPL_ID;
  const apiKey = process.env.REPLIT_API_KEY; // Requires Replit Personal API Key

  if (!replId || !apiKey) {
    console.warn(`⚠️ Skipping Replit Sync for ${name}: REPL_ID or REPLIT_API_KEY missing.`);
    return;
  }

  const query = `
    mutation SetSecret($replId: String!, $name: String!, $value: String!) {
      setSecret(replId: $replId, name: $name, value: $value) {
        id
      }
    }
  `;

  try {
    await axios.post(
      'https://replit.com/graphql',
      {
        query,
        variables: { replId, name, value },
      },
      {
        headers: {
          'X-Replit-Identity': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'replit-key-rotator',
        },
      }
    );
    console.log(`✅ Replit Secret Updated: ${name}`);
  } catch (error: any) {
    console.error(`❌ Failed to update Replit secret ${name}:`, error.response?.data || error.message);
  }
}

async function rotate() {
  const rpc = process.env.POLYGON_AMOY_RPC;
  const adminKey = process.env.CIRCUIT_BREAKER_ADMIN_KEY;
  const contractAddress = process.env.CIRCUIT_BREAKER_ADDRESS;
  const oldUpdaterAddress = process.env.CIRCUIT_BREAKER_UPDATER_ADDRESS;

  if (!rpc || !adminKey || !contractAddress || !oldUpdaterAddress) {
    console.error("❌ Error: Missing environment variables for rotation.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const adminWallet = new ethers.Wallet(adminKey, provider);
  
  const abi = [
    "function HEALTH_ORACLE_ROLE() view returns (bytes32)",
    "function grantRole(bytes32 role, address account) external",
    "function revokeRole(bytes32 role, address account) external",
    "function hasRole(bytes32 role, address account) view returns (bool)"
  ];

  const contract = new ethers.Contract(contractAddress, abi, adminWallet);
  const role = await contract.HEALTH_ORACLE_ROLE();

  console.log("🔄 Starting On-Chain Updater Key Rotation...");

  // 1. Generate new wallet
  const newWallet = ethers.Wallet.createRandom();
  console.log(`✨ New Updater Generated: ${newWallet.address}`);

  // 2. Grant Role to New Wallet
  console.log("🛰 Granting role to new updater...");
  const grantTx = await contract.grantRole(role, newWallet.address);
  await grantTx.wait();
  console.log(`✅ Role Granted on-chain. Tx: ${grantTx.hash}`);

  // 3. Revoke Role from Old Wallet
  console.log("🛰 Revoking role from old updater...");
  const revokeTx = await contract.revokeRole(role, oldUpdaterAddress);
  await revokeTx.wait();
  console.log(`✅ Role Revoked on-chain. Tx: ${revokeTx.hash}`);

  // 4. Verification
  const isNewValid = await contract.hasRole(role, newWallet.address);
  const isOldRevoked = !(await contract.hasRole(role, oldUpdaterAddress));

  if (isNewValid && isOldRevoked) {
    console.log("🎉 On-Chain Rotation Successful!");

    // 5. Sync to Replit
    console.log("🚀 Syncing new keys to Replit API...");
    await updateReplitSecret('CIRCUIT_BREAKER_UPDATER_KEY', newWallet.privateKey);
    await updateReplitSecret('CIRCUIT_BREAKER_UPDATER_ADDRESS', newWallet.address);
    
    console.log("\n--- ROTATION COMPLETE ---");
    console.log("Next Step: Restart the Replit deployment to load new environment variables.");
  } else {
    console.error("❌ Critical: On-chain verification failed. No secrets were synced.");
  }
}

rotate().catch((error) => {
  console.error("❌ Rotation script failed:", error);
  process.exit(1);
});