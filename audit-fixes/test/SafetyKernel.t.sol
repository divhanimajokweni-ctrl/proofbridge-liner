// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {SafetyKernel}   from "../contracts/SafetyKernel.sol";
import {BayesianScorer} from "../contracts/BayesianScorer.sol";
import {TEEVerifier}    from "../contracts/TEEVerifier.sol";

/// @title  SafetyKernelTest
/// @notice Adversarial coverage for SafetyKernel — the sole enforcement point
///         of the constitutional invariant:
///           (vote=PASS, proof=FAIL, authorization=EXECUTE) is unreachable.
/// @dev    Created in response to audit gap #3: this invariant-critical
///         contract previously had NO dedicated test file. The tests below
///         cover: constructor guards, posterior computation, threshold
///         tripping, the onlyVerifiedInput modifier (the core audit fix),
///         reset semantics, and the FLOOR_80_BP constant.
contract SafetyKernelTest is Test {
    SafetyKernel   internal kernel;
    BayesianScorer internal scorer;
    TEEVerifier    internal teeVerifier;

    address internal authorizedActor = address(0xA11CE);
    address internal stranger        = address(0xDEAD);

    // Mock enclave key — TEEVerifier.verifyAndExecute requires a real sig,
    // so to test SafetyKernel.check() directly we prank as the teeVerifier.
    uint256 internal enclavePk   = 0xBEEF_CAFE_1234_5678_9ABC_DEF0_1234_5678_9ABC_DEF0_1234_5678_9A;
    address internal enclaveAddr;

    uint256 internal constant THRESHOLD_80_BP = 8000; // 80% in basis points

    event StateChanged(SafetyKernel.State newState);
    event PosteriorComputed(uint256 successes, uint256 failures, uint256 posterior, uint256 threshold);

    function setUp() public {
        enclaveAddr = vm.addr(enclavePk);

        scorer = new BayesianScorer();
        // Deploy TEEVerifier with a dummy kernel (we won't call verifyAndExecute
        // in these tests — we prank as the verifier directly).
        bytes32 dummyAssetId = keccak256("dummy");
        // TEEVerifier requires an IAssetRegistryKernel in its constructor;
        // we use the SafetyKernel itself once deployed. To break the cycle,
        // deploy TEEVerifier pointing at address(0) is rejected, so we use
        // a minimal stub.
        address stubKernel = address(new StubKernel());
        teeVerifier = new TEEVerifier(enclaveAddr, stubKernel);

        vm.prank(authorizedActor);
        kernel = new SafetyKernel(authorizedActor, address(scorer), address(teeVerifier));
    }

    /*//////////////////////////////////////////////////////////////
                          CONSTRUCTOR GUARDS
    //////////////////////////////////////////////////////////////*/

    function testRejectsZeroActor() public {
        vm.expectRevert(bytes("SK: actor=0"));
        new SafetyKernel(address(0), address(scorer), address(teeVerifier));
    }

    function testRejectsZeroScorer() public {
        vm.expectRevert(bytes("SK: scorer=0"));
        new SafetyKernel(authorizedActor, address(0), address(teeVerifier));
    }

    function testRejectsZeroTee() public {
        vm.expectRevert(bytes("SK: tee=0"));
        new SafetyKernel(authorizedActor, address(scorer), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                    onlyVerifiedInput — THE CORE AUDIT FIX
    //////////////////////////////////////////////////////////////*/

    /// @dev This is the central security property: check() MUST reject callers
    ///      that are not the bound TEEVerifier. Previously check() accepted a
    ///      caller-supplied posterior with no auth — anyone could lie.
    function testCheckRejectsNonVerifierCaller() public {
        vm.expectRevert(bytes("SafetyKernel: unverified input"));
        vm.prank(stranger);
        kernel.check(100, 0, THRESHOLD_80_BP);
    }

    /// @dev Even the authorizedActor (who can reset) cannot call check() —
    ///      only the TEEVerifier can.
    function testCheckRejectsAuthorizedActor() public {
        vm.expectRevert(bytes("SafetyKernel: unverified input"));
        vm.prank(authorizedActor);
        kernel.check(100, 0, THRESHOLD_80_BP);
    }

    /*//////////////////////////////////////////////////////////////
                    POSTERIOR COMPUTATION — INTERNAL, NOT CALLER-SUPPLIED
    //////////////////////////////////////////////////////////////*/

    /// @dev The posterior is computed internally via scorer.computePosterior().
    ///      With 100 successes and 0 failures, posterior = (1+100)/(1+100+10) * 10000
    ///      = 101/111 * 10000 = 9099 (≈91%), well above 80% threshold → stays OPEN.
    function testCheckWithStrongEvidenceStaysOpen() public {
        vm.prank(address(teeVerifier));
        kernel.check(100, 0, THRESHOLD_80_BP);
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.OPEN));
    }

    /// @dev With 0 successes and 10 failures, posterior = (1+0)/(1+0+10+10) * 10000
    ///      = 1/21 * 10000 = 476 (≈4.8%), far below 80% → HALTS.
    function testCheckWithWeakEvidenceHalts() public {
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.HALTED));
    }

    /// @dev Boundary: posterior exactly at threshold stays OPEN (strict <).
    ///      successes=39, failures=0 → (1+39)/(1+39+10) * 10000 = 40/50 * 10000 = 8000.
    function testCheckAtThresholdStaysOpen() public {
        vm.prank(address(teeVerifier));
        kernel.check(39, 0, THRESHOLD_80_BP);
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.OPEN));
    }

    /// @dev Boundary: one below threshold HALTS.
    ///      successes=38, failures=0 → (1+38)/(1+38+10) * 10000 = 39/49 * 10000 = 7959.
    function testCheckBelowThresholdHalts() public {
        vm.prank(address(teeVerifier));
        kernel.check(38, 0, THRESHOLD_80_BP);
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.HALTED));
    }

    /*//////////////////////////////////////////////////////////////
                            STATE TRANSITIONS
    //////////////////////////////////////////////////////////////*/

    function testCheckEmitsStateChangedOnHalt() public {
        vm.expectEmit(false, false, false, true);
        emit StateChanged(SafetyKernel.State.HALTED);
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);
    }

    function testCheckEmitsPosteriorComputed() public {
        vm.expectEmit(false, false, false, true);
        // posterior for (0, 10) = 1/21 * 10000 = 476 (integer division)
        emit PosteriorComputed(0, 10, 476, THRESHOLD_80_BP);
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);
    }

    /// @dev Once HALTED, subsequent checks are no-ops (stays HALTED,
    ///      only reset() can re-open).
    function testCheckOnHaltedIsNoOp() public {
        vm.startPrank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP); // halts
        kernel.check(100, 0, THRESHOLD_80_BP); // strong evidence, but can't un-halt via check
        vm.stopPrank();
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.HALTED));
    }

    /*//////////////////////////////////////////////////////////////
                              reset()
    //////////////////////////////////////////////////////////////*/

    function testResetReopensKernel() public {
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.HALTED));

        vm.prank(authorizedActor);
        kernel.reset();
        assertEq(uint256(kernel.state()), uint256(SafetyKernel.State.OPEN));
    }

    function testResetRejectsStranger() public {
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);

        vm.expectRevert(bytes("Unauthorized"));
        vm.prank(stranger);
        kernel.reset();
    }

    function testResetRejectsWhenNotHalted() public {
        vm.expectRevert(bytes("Not halted"));
        vm.prank(authorizedActor);
        kernel.reset();
    }

    /*//////////////////////////////////////////////////////////////
                            assertOpen()
    //////////////////////////////////////////////////////////////*/

    function testAssertOpenPassesWhenOpen() public view {
        kernel.assertOpen();
    }

    function testAssertOpenRevertsWhenHalted() public {
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);

        vm.expectRevert(bytes("Kernel is halted"));
        kernel.assertOpen();
    }

    /*//////////////////////////////////////////////////////////////
                          FLOOR_80_BP CONSTANT
    //////////////////////////////////////////////////////////////*/

    /// @dev Resolves the audit's FLOOR_80 ambiguity: the old constant was
    ///      `FLOOR_80 = 80` with an unresolved comment about units. The
    ///      patched constant is `FLOOR_80_BP = 8000` — clearly named and
    ///      unit'd (basis points, matching BayesianScorer's 0–10000 output).
    function testFloor80BpIs8000() public view {
        assertEq(kernel.FLOOR_80_BP(), 8000);
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTITUTIONAL INVARIANT
    //////////////////////////////////////////////////////////////*/

    /// @dev The forbidden state (vote=PASS, proof=FAIL, authorization=EXECUTE)
    ///      is unreachable because: (a) check() can only be called by the
    ///      TEEVerifier, (b) the posterior is computed internally from
    ///      enclave-attested evidence — not caller-supplied, (c) if the
    ///      posterior falls below threshold, state becomes HALTED, (d)
    ///      assertOpen() reverts on HALTED, blocking authorization. This
    ///      test exercises the full path: weak evidence → HALT → assertOpen
    ///      reverts.
    function testConstitutionalInvariantUnreachable() public {
        // Strong evidence initially → OPEN → assertOpen passes
        vm.prank(address(teeVerifier));
        kernel.check(100, 0, THRESHOLD_80_BP);
        kernel.assertOpen(); // passes

        // Weak evidence arrives → HALT
        vm.prank(address(teeVerifier));
        kernel.check(0, 10, THRESHOLD_80_BP);

        // Authorization (assertOpen) now MUST revert — the forbidden state
        // (proof=FAIL but authorization=EXECUTE) is unreachable.
        vm.expectRevert(bytes("Kernel is halted"));
        kernel.assertOpen();
    }
}

/// @dev Minimal stub implementing IAssetRegistryKernel for the TEEVerifier
///      constructor in setUp(). SafetyKernel doesn't implement that interface,
///      so we need a stand-in to satisfy TEEVerifier's constructor check.
contract StubKernel {
    function check(bytes32 assetId, uint256 posterior) external {}
}
