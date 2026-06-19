// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/CircuitBreakerV2.sol";

contract CircuitBreakerV2Test is Test {
    CircuitBreakerV2 public cb;
    address public verifier;
    address public owner;
    address public attacker;

    uint256 internal featureId;
    uint32 internal criticalScore;
    uint256 internal timestamp;
    bytes internal signature;

    function setUp() public {
        owner = address(0x1);
        verifier = address(0x2);
        attacker = address(0x3);

        address[] memory signers = new address[](1);
        signers[0] = verifier;

        cb = new CircuitBreakerV2();
        vm.prank(owner);
        cb.initialize(signers, 1, verifier);

        featureId = 41055;
        criticalScore = 1_500_000; // 15.0 * 1e5
        timestamp = block.timestamp;
        signature = _signAlignmentAssertion(featureId, criticalScore, timestamp, verifier);
    }

    function _signAlignmentAssertion(
        uint256 _featureId,
        uint32 _criticalScore,
        uint256 _timestamp,
        address signer
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
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signer, digest);
        return abi.encodePacked(r, s, v);
    }

    function testInitializeSetsOwnerAndVerifier() public {
        assertEq(cb.owner(), owner);
        assertEq(cb.authorizedVerifier(), verifier);
        assertFalse(cb.isPaused());
    }

    function testInitializeRevertsOnSecondCall() public {
        // Initializer can only be called once (upgradeable pattern)
    }

    function testTripOnAlignmentBreach() public {
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
        assertTrue(cb.isPaused());
    }

    function testTripEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CircuitBreakerV2.AlignmentBreachTripped(featureId, criticalScore, timestamp, verifier);
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
    }

    function testTripRevertsIfNotVerifier() public {
        bytes memory badSig = _signAlignmentAssertion(featureId, criticalScore, timestamp, attacker);
        vm.prank(attacker);
        vm.expectRevert("Signature validation failed: Unauthorized source");
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, badSig);
    }

    function testCooldownEnforced() public {
        cb.assertAlignmentBreach(featureId, criticalScore, timestamp, signature);
        vm.warp(block.timestamp + 30 minutes);
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
