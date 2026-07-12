// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/CircuitBreakerV2.sol";

contract CircuitBreakerV2Test is Test {
    // Duplicate event declaration for vm.expectEmit usage
    event AlignmentBreachTripped(
        uint256 indexed featureId,
        uint32 criticalScore,
        uint256 indexed timestamp,
        address indexed verifier
    );

    CircuitBreakerV2 public cb;
    address public verifier;
    address public owner;
    address public attacker;

    uint256 internal verifierPk;
    uint256 internal attackerPk;

    uint256 internal featureId;
    uint32 internal criticalScore;
    uint256 internal timestamp;
    bytes internal signature;

    function setUp() public {
        // Warp past MIN_TRIP_INTERVAL to avoid cooldown arithmetic issues
        vm.warp(2 hours);

        verifierPk = 0xA11CE;
        attackerPk = 0xDEAD;
        owner = address(0x1);
        verifier = vm.addr(verifierPk);
        attacker = vm.addr(attackerPk);

        address[] memory signers = new address[](1);
        signers[0] = verifier;

        cb = new CircuitBreakerV2();
        vm.prank(owner);
        cb.initialize(signers, 1, verifier);

        featureId = 41055;
        criticalScore = 1_500_000; // 15.0 * 1e5
        timestamp = block.timestamp;
        signature = _signAlignmentAssertion(featureId, criticalScore, timestamp, verifierPk);
    }

    function _signAlignmentAssertion(
        uint256 _featureId,
        uint32 _criticalScore,
        uint256 _timestamp,
        uint256 signerPk
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                cb.ALIGNMENT_ASSERTION_TYPEHASH(),
                _featureId,
                _criticalScore,
                _timestamp
            )
        );
        bytes32 digest = cb.hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function testInitializeSetsOwnerAndVerifier() public {
        assertEq(cb.owner(), owner);
        assertEq(cb.authorizedVerifier(), verifier);
        assertFalse(cb.isPaused());
    }

    function testInitializeRevertsOnSecondCall() public {
        // Initializer can only be called once (upgradeable pattern)
        address[] memory s = new address[](1);
        s[0] = verifier;
        vm.expectRevert();
        cb.initialize(s, 1, verifier);
    }

    function testTripOnAlignmentBreach() public {
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
        assertTrue(cb.isPaused());
    }

    function testTripEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit AlignmentBreachTripped(featureId, criticalScore, timestamp, verifier);
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
    }

    function testTripRevertsIfNotVerifier() public {
        bytes memory badSig = _signAlignmentAssertion(featureId, criticalScore, timestamp, attackerPk);
        vm.prank(attacker);
        vm.expectRevert("Signature validation failed: Unauthorized source");
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, badSig);
    }

    function testCooldownEnforced() public {
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
        assertTrue(cb.isPaused());
        vm.warp(block.timestamp + 30 minutes);
        vm.prank(owner);
        cb.emergencyResume();
        assertFalse(cb.isPaused());
    }

    function testRotateVerifier() public {
        address newVerifier = address(0x4);
        vm.prank(owner);
        cb.rotateVerifier(newVerifier);
        assertEq(cb.authorizedVerifier(), newVerifier);
    }
}
