// test/VVUSovereignRegistry.test.ts
//
// VVUSovereignRegistry — Solidity Test Automation Suite
// =====================================================
// Hardens the sovereign track with a comprehensive test harness covering
// deployment, access control, telemetry anchoring, clearance minting, and
// revocation. Asserts that the fail-closed bound is enforced at the
// contract layer before any federal credential is issued.
//
// Run:
//   npx hardhat test test/VVUSovereignRegistry.test.ts
//
// The suite uses Hardhat + Ethers.js v6 + Chai + hardhat-chai-matchers.
// A fresh contract instance is deployed in beforeEach, and the federal
// auditor (deployer) is impersonated separately from the sovereign
// multi-sig, the student, and an adversarial caller.

import { expect } from "chai";
import { ethers } from "hardhat";
import { VVUSovereignRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VVUSovereignRegistry", function () {
  let registry: VVUSovereignRegistry;
  let federalAuditor: SignerWithAddress;
  let sovereignAuthority: SignerWithAddress;
  let student: SignerWithAddress;
  let attacker: SignerWithAddress;

  const CLEARANCE_LEVEL = ethers.keccak256(ethers.toUtf8Bytes("TS/SCI"));
  const EXECUTION_TRACE = ethers.keccak256(ethers.toUtf8Bytes("trace-12345"));

  beforeEach(async function () {
    // 1. Deploy a fresh contract
    const signers = await ethers.getSigners();
    federalAuditor = signers[0]; // The automated Watchdog node
    sovereignAuthority = signers[1]; // The federal multi-sig
    student = signers[2];
    attacker = signers[3];

    const factory = await ethers.getContractFactory("VVUSovereignRegistry");
    registry = await factory.deploy(await sovereignAuthority.getAddress());
    await registry.waitForDeployment();

    // 2. Activate the contract (the 12 original tests below assume the
    //    contract is live — they cover the post-AMD-pipeline state).
    //    The dormant-deploy describe block re-deploys a fresh contract
    //    in its own beforeEach to test the pre-activation state.
    const activationHash = ethers.keccak256(ethers.toUtf8Bytes("beforeEach-activation"));
    await registry.connect(sovereignAuthority).activate(activationHash);
  });

  // ============================================================
  // 1. Deployment & Role Assignment
  // ============================================================
  it("should set the correct federal auditor and sovereign authority on deployment", async function () {
    expect(await registry.federalAuditor()).to.equal(await federalAuditor.getAddress());
    expect(await registry.sovereignAuthority()).to.equal(await sovereignAuthority.getAddress());
  });

  // ============================================================
  // 2. Access Control: onlyAuditor
  // ============================================================
  it("should allow the federal auditor to anchor telemetry", async function () {
    await expect(
      registry.connect(federalAuditor).anchorSovereignTelemetry(
        await student.getAddress(),
        EXECUTION_TRACE,
        true
      )
    ).to.not.be.reverted;
  });

  it("should revert if a non-auditor attempts to anchor telemetry", async function () {
    await expect(
      registry.connect(attacker).anchorSovereignTelemetry(
        await student.getAddress(),
        EXECUTION_TRACE,
        true
      )
    ).to.be.revertedWith("Auth: Caller is not the automated monitoring node");
  });

  // ============================================================
  // 3. Access Control: onlySovereign
  // ============================================================
  it("should allow the sovereign authority to mint a clearance SBT", async function () {
    // First, anchor telemetry (simulate a passing audit)
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );

    await expect(
      registry.connect(sovereignAuthority).issueSovereignSBT(
        await student.getAddress(),
        CLEARANCE_LEVEL,
        EXECUTION_TRACE
      )
    ).to.not.be.reverted;
  });

  it("should revert if a non-sovereign attempts to mint a clearance", async function () {
    await expect(
      registry.connect(attacker).issueSovereignSBT(
        await student.getAddress(),
        CLEARANCE_LEVEL,
        EXECUTION_TRACE
      )
    ).to.be.revertedWith("Auth: Caller is not the Executive Sovereign authority");
  });

  // ============================================================
  // 4. Clearance Minting & Integrity
  // ============================================================
  it("should store the clearance metadata correctly after minting", async function () {
    // Anchor telemetry (required precondition)
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );

    // Mint
    await registry.connect(sovereignAuthority).issueSovereignSBT(
      await student.getAddress(),
      CLEARANCE_LEVEL,
      EXECUTION_TRACE
    );

    const stored = await registry.clearanceRegistry(await student.getAddress());
    expect(stored.clearanceLevel).to.equal(CLEARANCE_LEVEL);
    expect(stored.executionTraceHash).to.equal(EXECUTION_TRACE);
    expect(stored.authorizationTime).to.be.gt(0);
    expect(stored.active).to.be.true;
  });

  it("should not allow minting a clearance if the student has not anchored telemetry", async function () {
    // Patched contract: issueSovereignSBT requires a prior anchor — see
    // contracts/VVUSovereignRegistry.sol, the require before the active check.
    await expect(
      registry.connect(sovereignAuthority).issueSovereignSBT(
        await student.getAddress(),
        CLEARANCE_LEVEL,
        EXECUTION_TRACE
      )
    ).to.be.revertedWith("Grid: No telemetry anchored for this operative");
  });

  // ============================================================
  // 5. Revocation via Failed Telemetry Audit
  // ============================================================
  it("should revoke clearance if the auditor sends a failed telemetry audit", async function () {
    // 1. Mint first
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );
    await registry.connect(sovereignAuthority).issueSovereignSBT(
      await student.getAddress(),
      CLEARANCE_LEVEL,
      EXECUTION_TRACE
    );

    // 2. Send a failed audit
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      false
    );

    const stored = await registry.clearanceRegistry(await student.getAddress());
    expect(stored.active).to.be.false;
  });

  // ============================================================
  // 6. Anti-Double-Minting
  // ============================================================
  it("should revert if the student already has an active clearance", async function () {
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );
    await registry.connect(sovereignAuthority).issueSovereignSBT(
      await student.getAddress(),
      CLEARANCE_LEVEL,
      EXECUTION_TRACE
    );

    await expect(
      registry.connect(sovereignAuthority).issueSovereignSBT(
        await student.getAddress(),
        CLEARANCE_LEVEL,
        EXECUTION_TRACE
      )
    ).to.be.revertedWith("Grid: Operative clearance node already initialized");
  });

  // ============================================================
  // 7. Event Emission Verification
  // ============================================================
  it("should emit TelemetryAudited on anchor", async function () {
    await expect(
      registry.connect(federalAuditor).anchorSovereignTelemetry(
        await student.getAddress(),
        EXECUTION_TRACE,
        true
      )
    ).to.emit(registry, "TelemetryAudited")
      .withArgs(await student.getAddress(), EXECUTION_TRACE, true);
  });

  it("should emit ClearanceMinted on successful issuance", async function () {
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );

    await expect(
      registry.connect(sovereignAuthority).issueSovereignSBT(
        await student.getAddress(),
        CLEARANCE_LEVEL,
        EXECUTION_TRACE
      )
    ).to.emit(registry, "ClearanceMinted")
      .withArgs(await student.getAddress(), CLEARANCE_LEVEL);
  });

  it("should emit ClearanceRevoked on failed audit", async function () {
    await registry.connect(federalAuditor).anchorSovereignTelemetry(
      await student.getAddress(),
      EXECUTION_TRACE,
      true
    );
    await registry.connect(sovereignAuthority).issueSovereignSBT(
      await student.getAddress(),
      CLEARANCE_LEVEL,
      EXECUTION_TRACE
    );

    await expect(
      registry.connect(federalAuditor).anchorSovereignTelemetry(
        await student.getAddress(),
        EXECUTION_TRACE,
        false
      )
    ).to.emit(registry, "ClearanceRevoked")
      .withArgs(await student.getAddress());
  });

  // ============================================================
  // 8. Dormant-Deploy Pattern (AMD MI300x activation gate)
  // ============================================================
  describe("Dormant-deploy activation gate", function () {
    beforeEach(async function () {
      // Override the outer beforeEach's registry with a FRESH contract
      // that is NOT activated. The dormant tests below need to observe
      // the pre-activation (paused=true) state and the activate() flow.
      const factory = await ethers.getContractFactory("VVUSovereignRegistry");
      registry = await factory.deploy(await sovereignAuthority.getAddress());
      await registry.waitForDeployment();
    });

    it("should ship paused = true on deployment", async function () {
      expect(await registry.paused()).to.be.true;
      expect(await registry.activationCommitHash()).to.equal(ethers.ZeroHash);
    });

    it("should refuse anchor + issue calls while dormant", async function () {
      // anchor should revert with the dormant message
      await expect(
        registry.connect(federalAuditor).anchorSovereignTelemetry(
          await student.getAddress(),
          EXECUTION_TRACE,
          true
        )
      ).to.be.revertedWith("Grid: Contract is dormant -- awaiting AMD pipeline activation");

      // issue should also revert with the dormant message
      await expect(
        registry.connect(sovereignAuthority).issueSovereignSBT(
          await student.getAddress(),
          CLEARANCE_LEVEL,
          EXECUTION_TRACE
        )
      ).to.be.revertedWith("Grid: Contract is dormant -- awaiting AMD pipeline activation");
    });

    it("should refuse activate from a non-sovereign caller", async function () {
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("deadbeef"));
      await expect(
        registry.connect(attacker).activate(fakeCommitHash)
      ).to.be.revertedWith("Auth: Caller is not the Executive Sovereign authority");
    });

    it("should refuse activate with a zero commit hash", async function () {
      await expect(
        registry.connect(sovereignAuthority).activate(ethers.ZeroHash)
      ).to.be.revertedWith("Grid: Activation commit hash cannot be zero");
    });

    it("should activate and emit ContractActivated with the commit hash", async function () {
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("amd-mi300x-verified-commit-abc123"));

      // Capture the block BEFORE the tx so we have a lower bound. The tx
      // will mine in a subsequent block, so we assert the emitted
      // timestamp is >= the pre-tx block timestamp.
      const blockBefore = await ethers.provider.getBlock("latest");
      const tx = await registry.connect(sovereignAuthority).activate(fakeCommitHash);
      const receipt = await tx.wait();
      const blockAfter = await ethers.provider.getBlock(receipt!.blockNumber);

      // Assert the event was emitted with the right commit hash and a
      // timestamp that falls within [blockBefore.timestamp, blockAfter.timestamp].
      await expect(tx)
        .to.emit(registry, "ContractActivated")
        .withArgs(fakeCommitHash, blockAfter!.timestamp);

      expect(await registry.paused()).to.be.false;
      expect(await registry.activationCommitHash()).to.equal(fakeCommitHash);
      expect(blockAfter!.timestamp).to.be.gte(blockBefore!.timestamp);
    });

    it("should refuse a second activate (already live)", async function () {
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("commit-1"));
      await registry.connect(sovereignAuthority).activate(fakeCommitHash);

      await expect(
        registry.connect(sovereignAuthority).activate(
          ethers.keccak256(ethers.toUtf8Bytes("commit-2"))
        )
      ).to.be.revertedWith("Grid: Contract is already live");
    });

    it("should accept anchor + issue calls after activation", async function () {
      // activate first
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("commit-1"));
      await registry.connect(sovereignAuthority).activate(fakeCommitHash);

      // now anchor + issue should both succeed (same flow as the
      // pre-dormant tests above)
      await expect(
        registry.connect(federalAuditor).anchorSovereignTelemetry(
          await student.getAddress(),
          EXECUTION_TRACE,
          true
        )
      ).to.not.be.reverted;

      await expect(
        registry.connect(sovereignAuthority).issueSovereignSBT(
          await student.getAddress(),
          CLEARANCE_LEVEL,
          EXECUTION_TRACE
        )
      ).to.not.be.reverted;

      const stored = await registry.clearanceRegistry(await student.getAddress());
      expect(stored.active).to.be.true;
    });

    it("should allow sovereign to re-pause via deactivate (emergency rollback)", async function () {
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("commit-1"));
      await registry.connect(sovereignAuthority).activate(fakeCommitHash);

      await expect(
        registry.connect(sovereignAuthority).deactivate()
      ).to.emit(registry, "ContractDeactivated");

      expect(await registry.paused()).to.be.true;

      // anchor should once again be refused while dormant
      await expect(
        registry.connect(federalAuditor).anchorSovereignTelemetry(
          await student.getAddress(),
          EXECUTION_TRACE,
          true
        )
      ).to.be.revertedWith("Grid: Contract is dormant -- awaiting AMD pipeline activation");
    });

    it("should refuse deactivate from a non-sovereign caller", async function () {
      const fakeCommitHash = ethers.keccak256(ethers.toUtf8Bytes("commit-1"));
      await registry.connect(sovereignAuthority).activate(fakeCommitHash);

      await expect(
        registry.connect(attacker).deactivate()
      ).to.be.revertedWith("Auth: Caller is not the Executive Sovereign authority");
    });

    it("should refuse deactivate while already dormant", async function () {
      // contract is still paused from beforeEach — deactivate should refuse
      await expect(
        registry.connect(sovereignAuthority).deactivate()
      ).to.be.revertedWith("Grid: Contract is already dormant");
    });
  });
});
