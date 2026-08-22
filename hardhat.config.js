import "@nomicfoundation/hardhat-toolbox";
process.env.TS_NODE_PROJECT = "./tsconfig.hardhat.json";
process.env.TS_NODE_TRANSPILE_ONLY = "1";
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const ARB_API_KEY = process.env.ARBISCAN_API_KEY || "";
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache/hardhat"
  },
  networks: {
    hardhat: {},
    "arbitrum-sepolia": {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [DEPLOYER_PK],
      chainId: 421614
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [DEPLOYER_PK],
      chainId: 42161
    },
    // Polygon Amoy testnet — anchored to Ethereum Sepolia. Used by the
    // sovereign track for redundant anchoring (same contract deployed to
    // both Arbitrum Sepolia + Polygon Amoy in deploy-all.ts).
    "polygon-amoy": {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [DEPLOYER_PK],
      chainId: 80002
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [DEPLOYER_PK],
      chainId: 137
    }
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: ARB_API_KEY,
      arbitrum: ARB_API_KEY,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || ""
    }
  }
};
var stdin_default = config;
export {
  stdin_default as default
};
